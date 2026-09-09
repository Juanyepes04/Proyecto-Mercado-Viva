-- =========================================================
-- MERCADO VIVA — FUNCIONES Y TRIGGERS
-- Archivo 2 de 3: lógica de negocio a nivel de base de datos
-- Ejecutar DESPUÉS de 01_schema.sql
-- =========================================================

-- ---------------------------------------------------------
-- TRIGGER GENÉRICO: mantener updated_at
-- ---------------------------------------------------------
create or replace function fn_actualizar_updated_at()
returns trigger as $$
begin
    new.updated_at = now();
    return new;
end;
$$ language plpgsql;

create trigger trg_usuarios_updated_at
    before update on usuarios
    for each row execute function fn_actualizar_updated_at();

create trigger trg_productos_updated_at
    before update on productos
    for each row execute function fn_actualizar_updated_at();

create or replace function fn_actualizar_pedido_timestamp()
returns trigger as $$
begin
    new.actualizado_en = now();
    return new;
end;
$$ language plpgsql;

create trigger trg_pedidos_updated_at
    before update on pedidos
    for each row execute function fn_actualizar_pedido_timestamp();


-- =========================================================
-- HU1 / RNF1 — Validación de disponibilidad (solo lectura, sin locks)
-- Úsala en el frontend antes de intentar el checkout, para mostrar
-- en tiempo real si algo ya no alcanza.
-- p_items formato: '[{"producto_id":"uuid","cantidad":2}, ...]'
-- =========================================================
create or replace function fn_validar_disponibilidad(p_items jsonb)
returns table (
    producto_id uuid,
    nombre text,
    cantidad_solicitada integer,
    stock_disponible integer,
    disponible boolean
) as $$
begin
    return query
    select
        p.id,
        p.nombre,
        (item->>'cantidad')::integer,
        p.stock_disponible,
        p.stock_disponible >= (item->>'cantidad')::integer
    from jsonb_array_elements(p_items) as item
    join productos p on p.id = (item->>'producto_id')::uuid;
end;
$$ language plpgsql stable;


-- =========================================================
-- HU4 — Sugerir alternativas si un producto no tiene stock
-- =========================================================
create or replace function fn_sugerir_alternativas(p_producto_id uuid, p_cantidad integer default 1)
returns table (
    producto_id uuid,
    nombre text,
    valor numeric,
    stock_disponible integer
) as $$
begin
    return query
    select p.id, p.nombre, p.valor, p.stock_disponible
    from productos p
    where p.categoria_id = (select categoria_id from productos where id = p_producto_id)
      and p.id <> p_producto_id
      and p.activo = true
      and p.stock_disponible >= p_cantidad
    order by p.stock_disponible desc
    limit 5;
end;
$$ language plpgsql stable;


-- =========================================================
-- HU2 / HU3 — Iniciar checkout web: crea el pedido + reserva
-- de stock por 15 minutos. Todo o nada (transacción atómica).
-- p_items formato: '[{"producto_id":"uuid","cantidad":2}, ...]'
-- =========================================================
create or replace function fn_iniciar_checkout_web(p_usuario_id uuid, p_items jsonb)
returns uuid as $$
declare
    v_pedido_id uuid;
    v_detalle_id uuid;
    item jsonb;
    v_producto productos%rowtype;
    v_cantidad integer;
    v_disponible integer;
begin
    insert into pedidos (usuario_id, canal, estado)
    values (p_usuario_id, 'web', 'pendiente')
    returning id into v_pedido_id;

    for item in select * from jsonb_array_elements(p_items)
    loop
        v_cantidad := (item->>'cantidad')::integer;

        -- bloquea la fila del producto para evitar condiciones de carrera
        select * into v_producto
        from productos
        where id = (item->>'producto_id')::uuid
        for update;

        if not found then
            raise exception 'Producto % no existe', item->>'producto_id';
        end if;

        v_disponible := v_producto.stock_actual - v_producto.stock_reservado;

        if v_disponible < v_cantidad then
            raise exception 'STOCK_INSUFICIENTE: producto % solo tiene % disponibles (se pidieron %)',
                v_producto.nombre, v_disponible, v_cantidad
                using errcode = 'P0001';
        end if;

        insert into detalle_pedido (pedido_id, producto_id, cantidad, precio_unitario)
        values (v_pedido_id, v_producto.id, v_cantidad, v_producto.valor)
        returning id into v_detalle_id;

        insert into reservas_stock (detalle_pedido_id, producto_id, cantidad, expira_en)
        values (v_detalle_id, v_producto.id, v_cantidad, now() + interval '15 minutes');

        update productos
        set stock_reservado = stock_reservado + v_cantidad
        where id = v_producto.id;
    end loop;

    update pedidos
    set total = (select coalesce(sum(subtotal), 0) from detalle_pedido where pedido_id = v_pedido_id)
    where id = v_pedido_id;

    return v_pedido_id;
end;
$$ language plpgsql;


-- =========================================================
-- Confirmar el pago de un pedido web (dentro de la ventana de 15 min)
-- Descuenta saldo simulado y convierte la reserva en salida real de stock.
-- =========================================================
create or replace function fn_confirmar_pago_web(p_pedido_id uuid)
returns void as $$
declare
    v_pedido pedidos%rowtype;
    v_usuario usuarios%rowtype;
    v_detalle record;
    v_reserva reservas_stock%rowtype;
    v_nuevo_saldo numeric(12,2);
begin
    select * into v_pedido from pedidos where id = p_pedido_id for update;

    if not found then
        raise exception 'Pedido % no existe', p_pedido_id;
    end if;

    if v_pedido.estado <> 'pendiente' then
        raise exception 'El pedido % no está pendiente de pago (estado actual: %)', p_pedido_id, v_pedido.estado;
    end if;

    -- valida que ninguna reserva del pedido haya expirado
    if exists (
        select 1 from reservas_stock r
        join detalle_pedido d on d.id = r.detalle_pedido_id
        where d.pedido_id = p_pedido_id
          and (r.estado <> 'activa' or r.expira_en < now())
    ) then
        raise exception 'RESERVA_EXPIRADA: la reserva de stock para el pedido % ya venció, vuelva a intentar' , p_pedido_id;
    end if;

    select * into v_usuario from usuarios where id = v_pedido.usuario_id for update;

    if v_usuario.saldo_simulado < v_pedido.total then
        raise exception 'SALDO_INSUFICIENTE: saldo % es menor al total %', v_usuario.saldo_simulado, v_pedido.total;
    end if;

    v_nuevo_saldo := v_usuario.saldo_simulado - v_pedido.total;

    update usuarios set saldo_simulado = v_nuevo_saldo where id = v_usuario.id;

    insert into historial_saldo (usuario_id, tipo, monto, saldo_resultante, pedido_id)
    values (v_usuario.id, 'compra', -v_pedido.total, v_nuevo_saldo, p_pedido_id);

    for v_detalle in
        select d.id as detalle_id, d.producto_id, d.cantidad
        from detalle_pedido d
        where d.pedido_id = p_pedido_id
    loop
        select * into v_reserva from reservas_stock where detalle_pedido_id = v_detalle.detalle_id;

        update productos
        set stock_actual = stock_actual - v_detalle.cantidad,
            stock_reservado = stock_reservado - v_detalle.cantidad
        where id = v_detalle.producto_id;

        insert into movimientos_inventario
            (producto_id, tipo, cantidad, stock_resultante, referencia_pedido_id, referencia_reserva_id)
        values (
            v_detalle.producto_id, 'salida_web', -v_detalle.cantidad,
            (select stock_actual from productos where id = v_detalle.producto_id),
            p_pedido_id, v_reserva.id
        );

        update reservas_stock set estado = 'confirmada' where id = v_reserva.id;
    end loop;

    update pedidos set estado = 'pagado' where id = p_pedido_id;
end;
$$ language plpgsql;


-- =========================================================
-- Liberar reservas expiradas (HU3) — programar con pg_cron cada 1 minuto
-- =========================================================
create or replace function fn_liberar_reservas_expiradas()
returns integer as $$
declare
    v_reserva record;
    v_contador integer := 0;
    v_pedido_id uuid;
begin
    for v_reserva in
        select r.id, r.producto_id, r.cantidad, d.pedido_id
        from reservas_stock r
        join detalle_pedido d on d.id = r.detalle_pedido_id
        where r.estado = 'activa' and r.expira_en < now()
        for update of r
    loop
        update productos
        set stock_reservado = stock_reservado - v_reserva.cantidad
        where id = v_reserva.producto_id;

        update reservas_stock set estado = 'expirada' where id = v_reserva.id;

        insert into movimientos_inventario (producto_id, tipo, cantidad, stock_resultante, referencia_pedido_id, referencia_reserva_id)
        values (
            v_reserva.producto_id, 'liberacion_reserva', v_reserva.cantidad,
            (select stock_actual - stock_reservado from productos where id = v_reserva.producto_id),
            v_reserva.pedido_id, v_reserva.id
        );

        v_contador := v_contador + 1;

        -- si el pedido ya no tiene ninguna reserva activa, se cancela
        if not exists (
            select 1 from reservas_stock r2
            join detalle_pedido d2 on d2.id = r2.detalle_pedido_id
            where d2.pedido_id = v_reserva.pedido_id and r2.estado = 'activa'
        ) then
            update pedidos set estado = 'cancelado'
            where id = v_reserva.pedido_id and estado = 'pendiente';
        end if;
    end loop;

    return v_contador;
end;
$$ language plpgsql;


-- =========================================================
-- CAJERO / POS — abrir caja, registrar venta, cerrar caja
-- =========================================================
create or replace function fn_abrir_caja(p_cajero_id uuid, p_saldo_inicial numeric)
returns uuid as $$
declare
    v_caja_id uuid;
begin
    insert into cajas (cajero_id, saldo_inicial, estado)
    values (p_cajero_id, p_saldo_inicial, 'abierta')
    returning id into v_caja_id;

    insert into movimientos_caja (caja_id, tipo, monto, descripcion)
    values (v_caja_id, 'apertura', p_saldo_inicial, 'Apertura de caja');

    return v_caja_id;
end;
$$ language plpgsql;


create or replace function fn_registrar_venta_pos(
    p_caja_id uuid,
    p_cajero_id uuid,
    p_items jsonb,
    p_usuario_id uuid default null
)
returns uuid as $$
declare
    v_pedido_id uuid;
    item jsonb;
    v_producto productos%rowtype;
    v_cantidad integer;
    v_disponible integer;
    v_total numeric(12,2);
begin
    if not exists (select 1 from cajas where id = p_caja_id and estado = 'abierta' and cajero_id = p_cajero_id) then
        raise exception 'La caja % no está abierta para el cajero %', p_caja_id, p_cajero_id;
    end if;

    insert into pedidos (usuario_id, cajero_id, caja_id, canal, estado)
    values (p_usuario_id, p_cajero_id, p_caja_id, 'pos', 'completado')
    returning id into v_pedido_id;

    for item in select * from jsonb_array_elements(p_items)
    loop
        v_cantidad := (item->>'cantidad')::integer;

        select * into v_producto
        from productos
        where id = (item->>'producto_id')::uuid
        for update;

        if not found then
            raise exception 'Producto % no existe', item->>'producto_id';
        end if;

        v_disponible := v_producto.stock_actual - v_producto.stock_reservado;

        if v_disponible < v_cantidad then
            raise exception 'STOCK_INSUFICIENTE: producto % solo tiene % disponibles (se pidieron %)',
                v_producto.nombre, v_disponible, v_cantidad;
        end if;

        insert into detalle_pedido (pedido_id, producto_id, cantidad, precio_unitario)
        values (v_pedido_id, v_producto.id, v_cantidad, v_producto.valor);

        update productos
        set stock_actual = stock_actual - v_cantidad
        where id = v_producto.id;

        insert into movimientos_inventario (producto_id, tipo, cantidad, stock_resultante, usuario_id, referencia_pedido_id)
        values (
            v_producto.id, 'salida_pos', -v_cantidad,
            (select stock_actual from productos where id = v_producto.id),
            p_cajero_id, v_pedido_id
        );
    end loop;

    select coalesce(sum(subtotal), 0) into v_total from detalle_pedido where pedido_id = v_pedido_id;
    update pedidos set total = v_total where id = v_pedido_id;

    insert into movimientos_caja (caja_id, tipo, monto, pedido_id, descripcion)
    values (p_caja_id, 'venta', v_total, v_pedido_id, 'Venta POS');

    return v_pedido_id;
end;
$$ language plpgsql;


create or replace function fn_cerrar_caja(p_caja_id uuid, p_saldo_final_real numeric)
returns table (saldo_final_esperado numeric, diferencia numeric) as $$
declare
    v_caja cajas%rowtype;
    v_esperado numeric(12,2);
begin
    select * into v_caja from cajas where id = p_caja_id and estado = 'abierta' for update;

    if not found then
        raise exception 'La caja % no existe o ya está cerrada', p_caja_id;
    end if;

    select v_caja.saldo_inicial
         + coalesce(sum(monto) filter (where tipo in ('venta', 'ingreso')), 0)
         - coalesce(sum(monto) filter (where tipo = 'retiro'), 0)
    into v_esperado
    from movimientos_caja
    where caja_id = p_caja_id;

    update cajas
    set estado = 'cerrada',
        saldo_final_esperado = v_esperado,
        saldo_final_real = p_saldo_final_real,
        diferencia = p_saldo_final_real - v_esperado,
        cerrada_en = now()
    where id = p_caja_id;

    insert into movimientos_caja (caja_id, tipo, monto, descripcion)
    values (p_caja_id, 'cierre', p_saldo_final_real, 'Cierre de caja');

    return query select v_esperado, (p_saldo_final_real - v_esperado);
end;
$$ language plpgsql;


-- =========================================================
-- ABASTECEDOR — entrada de stock a bodega
-- =========================================================
create or replace function fn_abastecer_producto(
    p_abastecedor_id uuid,
    p_producto_id uuid,
    p_cantidad integer
)
returns void as $$
declare
    v_stock_resultante integer;
begin
    if p_cantidad <= 0 then
        raise exception 'La cantidad a abastecer debe ser mayor a 0';
    end if;

    update productos
    set stock_actual = stock_actual + p_cantidad,
        abastecedor_id = p_abastecedor_id
    where id = p_producto_id
    returning stock_actual into v_stock_resultante;

    if not found then
        raise exception 'Producto % no existe', p_producto_id;
    end if;

    insert into movimientos_inventario (producto_id, tipo, cantidad, stock_resultante, usuario_id)
    values (p_producto_id, 'entrada', p_cantidad, v_stock_resultante, p_abastecedor_id);
end;
$$ language plpgsql;
