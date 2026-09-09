-- =========================================================
-- MERCADO VIVA — ESQUEMA DE BASE DE DATOS (PostgreSQL / Supabase)
-- Archivo 1 de 3: Extensiones, tipos, tablas, índices y vistas
-- =========================================================

-- ---------------------------------------------------------
-- EXTENSIONES
-- ---------------------------------------------------------
create extension if not exists pgcrypto;   -- gen_random_uuid()

-- ---------------------------------------------------------
-- TIPOS ENUMERADOS
-- ---------------------------------------------------------
create type rol_usuario as enum ('cliente', 'cajero', 'abastecedor', 'admin');
create type canal_venta as enum ('web', 'pos');
create type estado_pedido as enum ('pendiente', 'pagado', 'completado', 'cancelado');
create type estado_reserva as enum ('activa', 'confirmada', 'expirada', 'cancelada');
create type estado_caja as enum ('abierta', 'cerrada');
create type tipo_movimiento_caja as enum ('apertura', 'venta', 'retiro', 'ingreso', 'cierre');
create type tipo_movimiento_inventario as enum ('entrada', 'salida_web', 'salida_pos', 'ajuste', 'liberacion_reserva');

-- ---------------------------------------------------------
-- TABLA: usuarios
-- Guarda los 3 roles: cliente (usuario web), cajero, abastecedor.
-- Nota: contrasena_hash se guarda como texto; el HASH real
-- (bcrypt/argon2) lo genera la capa de backend, no la BD.
-- ---------------------------------------------------------
create table usuarios (
    id                 uuid primary key default gen_random_uuid(),
    nombre             text not null,
    numero_identidad   text not null unique,
    nombre_usuario     text not null unique,
    contrasena_hash    text not null,
    correo             text not null unique,
    rol                rol_usuario not null default 'cliente',
    direccion          text,
    saldo_simulado     numeric(12,2) not null default 0 check (saldo_simulado >= 0),
    activo             boolean not null default true,
    created_at         timestamptz not null default now(),
    updated_at         timestamptz not null default now()
);

create index idx_usuarios_rol on usuarios (rol);

-- ---------------------------------------------------------
-- TABLA: categorias
-- ---------------------------------------------------------
create table categorias (
    id          uuid primary key default gen_random_uuid(),
    nombre      text not null unique,
    foto_url    text,
    created_at  timestamptz not null default now()
);

-- ---------------------------------------------------------
-- TABLA: productos
-- stock_disponible es columna generada = lo que puede venderse
-- ahora mismo (lo físico menos lo que está reservado en checkouts
-- web activos). Esto es lo que consulta HU1.
-- ---------------------------------------------------------
create table productos (
    id                 uuid primary key default gen_random_uuid(),
    identificador      text not null unique,          -- SKU / código de barras
    nombre             text not null,
    categoria_id       uuid references categorias(id),
    valor              numeric(12,2) not null check (valor >= 0),
    foto_url           text,
    stock_actual       integer not null default 0 check (stock_actual >= 0),
    stock_reservado    integer not null default 0 check (stock_reservado >= 0),
    stock_disponible   integer generated always as (stock_actual - stock_reservado) stored,
    stock_minimo       integer not null default 5,
    activo             boolean not null default true,
    abastecedor_id     uuid references usuarios(id),  -- último abastecedor que lo tocó
    created_at         timestamptz not null default now(),
    updated_at         timestamptz not null default now(),
    constraint chk_reservado_no_supera_actual check (stock_reservado <= stock_actual)
);

create index idx_productos_categoria on productos (categoria_id);
create index idx_productos_activo on productos (activo);

-- ---------------------------------------------------------
-- TABLA: cajas (sesiones de caja registradora por cajero)
-- ---------------------------------------------------------
create table cajas (
    id                     uuid primary key default gen_random_uuid(),
    cajero_id              uuid not null references usuarios(id),
    saldo_inicial          numeric(12,2) not null default 0,
    saldo_final_esperado   numeric(12,2),
    saldo_final_real       numeric(12,2),
    diferencia             numeric(12,2),
    estado                 estado_caja not null default 'abierta',
    abierta_en             timestamptz not null default now(),
    cerrada_en             timestamptz
);

-- un cajero no puede tener dos cajas abiertas al tiempo
create unique index uq_caja_abierta_por_cajero
    on cajas (cajero_id) where estado = 'abierta';

-- ---------------------------------------------------------
-- TABLA: pedidos (una venta, sea web o POS)
-- ---------------------------------------------------------
create table pedidos (
    id           uuid primary key default gen_random_uuid(),
    usuario_id   uuid references usuarios(id),   -- cliente (nullable en venta POS anónima)
    cajero_id    uuid references usuarios(id),   -- nulo si es venta web
    caja_id      uuid references cajas(id),      -- nulo si es venta web
    canal        canal_venta not null,
    estado       estado_pedido not null default 'pendiente',
    total        numeric(12,2) not null default 0,
    creado_en    timestamptz not null default now(),
    actualizado_en timestamptz not null default now()
);

create index idx_pedidos_usuario on pedidos (usuario_id);
create index idx_pedidos_cajero on pedidos (cajero_id);
create index idx_pedidos_estado on pedidos (estado);

-- ---------------------------------------------------------
-- TABLA: detalle_pedido
-- ---------------------------------------------------------
create table detalle_pedido (
    id               uuid primary key default gen_random_uuid(),
    pedido_id        uuid not null references pedidos(id) on delete cascade,
    producto_id      uuid not null references productos(id),
    cantidad         integer not null check (cantidad > 0),
    precio_unitario  numeric(12,2) not null,
    subtotal         numeric(12,2) generated always as (cantidad * precio_unitario) stored
);

create index idx_detalle_pedido_pedido on detalle_pedido (pedido_id);
create index idx_detalle_pedido_producto on detalle_pedido (producto_id);

-- ---------------------------------------------------------
-- TABLA: reservas_stock (HU3 — reserva temporal de 15 min)
-- Una reserva está ligada a una línea del carrito (detalle_pedido).
-- ---------------------------------------------------------
create table reservas_stock (
    id                 uuid primary key default gen_random_uuid(),
    detalle_pedido_id  uuid not null references detalle_pedido(id) on delete cascade,
    producto_id        uuid not null references productos(id),
    cantidad           integer not null check (cantidad > 0),
    estado             estado_reserva not null default 'activa',
    creado_en          timestamptz not null default now(),
    expira_en          timestamptz not null default (now() + interval '15 minutes')
);

create index idx_reservas_estado_expira on reservas_stock (estado, expira_en);
create index idx_reservas_producto on reservas_stock (producto_id);

-- ---------------------------------------------------------
-- TABLA: movimientos_caja (cuadre de caja)
-- ---------------------------------------------------------
create table movimientos_caja (
    id           uuid primary key default gen_random_uuid(),
    caja_id      uuid not null references cajas(id),
    tipo         tipo_movimiento_caja not null,
    monto        numeric(12,2) not null,
    pedido_id    uuid references pedidos(id),
    descripcion  text,
    creado_en    timestamptz not null default now()
);

create index idx_movimientos_caja_caja on movimientos_caja (caja_id);

-- ---------------------------------------------------------
-- TABLA: movimientos_inventario (auditoría de todo cambio de stock)
-- ---------------------------------------------------------
create table movimientos_inventario (
    id                     uuid primary key default gen_random_uuid(),
    producto_id            uuid not null references productos(id),
    tipo                   tipo_movimiento_inventario not null,
    cantidad               integer not null,
    stock_resultante       integer not null,
    usuario_id             uuid references usuarios(id),
    referencia_pedido_id   uuid references pedidos(id),
    referencia_reserva_id  uuid references reservas_stock(id),
    creado_en              timestamptz not null default now()
);

create index idx_mov_inventario_producto on movimientos_inventario (producto_id);
create index idx_mov_inventario_tipo on movimientos_inventario (tipo);

-- ---------------------------------------------------------
-- TABLA: historial_saldo (ledger del saldo simulado del cliente)
-- ---------------------------------------------------------
create table historial_saldo (
    id                 uuid primary key default gen_random_uuid(),
    usuario_id         uuid not null references usuarios(id),
    tipo               text not null check (tipo in ('recarga', 'compra', 'ajuste')),
    monto              numeric(12,2) not null,
    saldo_resultante   numeric(12,2) not null,
    pedido_id          uuid references pedidos(id),
    creado_en          timestamptz not null default now()
);

create index idx_historial_saldo_usuario on historial_saldo (usuario_id);

-- ---------------------------------------------------------
-- VISTA: catálogo público con stock en tiempo real (HU1)
-- ---------------------------------------------------------
create view vista_catalogo as
select
    p.id,
    p.identificador,
    p.nombre,
    c.nombre as categoria,
    p.valor,
    p.foto_url,
    p.stock_actual,
    p.stock_reservado,
    p.stock_disponible,
    p.activo
from productos p
left join categorias c on c.id = p.categoria_id;
