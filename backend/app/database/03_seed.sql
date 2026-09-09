-- =========================================================
-- MERCADO VIVA — DATOS DE PRUEBA (SEED)
-- Archivo 3 de 3: ejecutar DESPUÉS de 01_schema.sql y 02_functions.sql
--
-- IMPORTANTE: contrasena_hash aquí es un valor de ejemplo en texto
-- plano ("prefijado"), NO un hash real. Cuando tengas el backend
-- definido, reemplaza estos valores por el hash real (bcrypt/argon2)
-- generado por tu capa de autenticación antes de usar en producción.
-- =========================================================

-- ---------------------------------------------------------
-- CATEGORÍAS
-- ---------------------------------------------------------
insert into categorias (id, nombre) values
    ('11111111-0000-0000-0000-000000000001', 'Bebidas'),
    ('11111111-0000-0000-0000-000000000002', 'Snacks'),
    ('11111111-0000-0000-0000-000000000003', 'Aseo'),
    ('11111111-0000-0000-0000-000000000004', 'Lácteos'),
    ('11111111-0000-0000-0000-000000000005', 'Panadería');

-- ---------------------------------------------------------
-- USUARIOS: 3 clientes web
-- ---------------------------------------------------------
insert into usuarios (id, nombre, numero_identidad, nombre_usuario, contrasena_hash, correo, rol, direccion, saldo_simulado) values
    ('22222222-0000-0000-0000-000000000001', 'Cliente Uno',   '1000000001', 'cliente1', 'CAMBIAR_HASH_1', 'cliente1@mercadoviva.test', 'cliente', 'Calle 1 # 1-01', 200000),
    ('22222222-0000-0000-0000-000000000002', 'Cliente Dos',   '1000000002', 'cliente2', 'CAMBIAR_HASH_2', 'cliente2@mercadoviva.test', 'cliente', 'Calle 2 # 2-02', 150000),
    ('22222222-0000-0000-0000-000000000003', 'Cliente Tres',  '1000000003', 'cliente3', 'CAMBIAR_HASH_3', 'cliente3@mercadoviva.test', 'cliente', 'Calle 3 # 3-03', 100000);

-- ---------------------------------------------------------
-- USUARIOS: 3 cajeros
-- ---------------------------------------------------------
insert into usuarios (id, nombre, numero_identidad, nombre_usuario, contrasena_hash, correo, rol, direccion) values
    ('33333333-0000-0000-0000-000000000001', 'Cajero Uno',   '2000000001', 'cajero1', 'CAMBIAR_HASH_4', 'cajero1@mercadoviva.test', 'cajero', 'Calle 4 # 4-04'),
    ('33333333-0000-0000-0000-000000000002', 'Cajero Dos',   '2000000002', 'cajero2', 'CAMBIAR_HASH_5', 'cajero2@mercadoviva.test', 'cajero', 'Calle 5 # 5-05'),
    ('33333333-0000-0000-0000-000000000003', 'Cajero Tres',  '2000000003', 'cajero3', 'CAMBIAR_HASH_6', 'cajero3@mercadoviva.test', 'cajero', 'Calle 6 # 6-06');

-- ---------------------------------------------------------
-- USUARIOS: 1 abastecedor (agrega más si tu equipo lo necesita)
-- ---------------------------------------------------------
insert into usuarios (id, nombre, numero_identidad, nombre_usuario, contrasena_hash, correo, rol, direccion) values
    ('44444444-0000-0000-0000-000000000001', 'Abastecedor Uno', '3000000001', 'abastecedor1', 'CAMBIAR_HASH_7', 'abastecedor1@mercadoviva.test', 'abastecedor', 'Bodega Central');

-- ---------------------------------------------------------
-- PRODUCTOS DE EJEMPLO
-- ---------------------------------------------------------
insert into productos (identificador, nombre, categoria_id, valor, stock_actual, stock_minimo) values
    ('SKU-0001', 'Gaseosa 1.5L',        '11111111-0000-0000-0000-000000000001', 5500,  40, 10),
    ('SKU-0002', 'Agua 600ml',          '11111111-0000-0000-0000-000000000001', 2000,  60, 15),
    ('SKU-0003', 'Papas fritas 150g',   '11111111-0000-0000-0000-000000000002', 4500,  35, 10),
    ('SKU-0004', 'Chocolatina',         '11111111-0000-0000-0000-000000000002', 2500,  80, 20),
    ('SKU-0005', 'Detergente 1kg',      '11111111-0000-0000-0000-000000000003', 12000, 20, 5),
    ('SKU-0006', 'Jabón de baño',       '11111111-0000-0000-0000-000000000003', 3200,  25, 5),
    ('SKU-0007', 'Leche entera 1L',     '11111111-0000-0000-0000-000000000004', 4200,  30, 10),
    ('SKU-0008', 'Yogurt 200ml',        '11111111-0000-0000-0000-000000000004', 2800,  40, 10),
    ('SKU-0009', 'Pan tajado',          '11111111-0000-0000-0000-000000000005', 6500,  15, 5),
    ('SKU-0010', 'Croissant',           '11111111-0000-0000-0000-000000000005', 3500,  0,  5);
    -- SKU-0010 queda a propósito en 0 para que puedas probar HU4 (alternativas)

-- ---------------------------------------------------------
-- CAJA ABIERTA de prueba para cajero1 (para probar fn_registrar_venta_pos
-- sin tener que llamar fn_abrir_caja primero)
-- ---------------------------------------------------------
select fn_abrir_caja('33333333-0000-0000-0000-000000000001', 50000);
