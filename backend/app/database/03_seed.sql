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
    ('22222222-0000-0000-0000-000000000001', 'Cliente Uno',   '1000000001', 'cliente1', '$2b$12$RaldPclU7Y4Zg7YWsS5FtebIOOJWuNemu45gzMbevTzlauW3MN0eW', 'cliente1@mercadoviva.test', 'cliente', 'Calle 1 # 1-01', 200000),
    ('22222222-0000-0000-0000-000000000002', 'Cliente Dos',   '1000000002', 'cliente2', '$2b$12$RaldPclU7Y4Zg7YWsS5FtebIOOJWuNemu45gzMbevTzlauW3MN0eW', 'cliente2@mercadoviva.test', 'cliente', 'Calle 2 # 2-02', 150000),
    ('22222222-0000-0000-0000-000000000003', 'Cliente Tres',  '1000000003', 'cliente3', '$2b$12$RaldPclU7Y4Zg7YWsS5FtebIOOJWuNemu45gzMbevTzlauW3MN0eW', 'cliente3@mercadoviva.test', 'cliente', 'Calle 3 # 3-03', 100000);

-- ---------------------------------------------------------
-- USUARIOS: 3 cajeros
-- ---------------------------------------------------------
insert into usuarios (id, nombre, numero_identidad, nombre_usuario, contrasena_hash, correo, rol, direccion) values
    ('33333333-0000-0000-0000-000000000001', 'Cajero Uno',   '2000000001', 'cajero1', '$2b$12$C3Chy3u4SKqCyg02Ba9UGeORDMlvpKJ8qHkWxOC6Dh8j5dWErsYpu', 'cajero1@mercadoviva.test', 'cajero', 'Calle 4 # 4-04'),
    ('33333333-0000-0000-0000-000000000002', 'Cajero Dos',   '2000000002', 'cajero2', '$2b$12$C3Chy3u4SKqCyg02Ba9UGeORDMlvpKJ8qHkWxOC6Dh8j5dWErsYpu', 'cajero2@mercadoviva.test', 'cajero', 'Calle 5 # 5-05'),
    ('33333333-0000-0000-0000-000000000003', 'Cajero Tres',  '2000000003', 'cajero3', '$2b$12$C3Chy3u4SKqCyg02Ba9UGeORDMlvpKJ8qHkWxOC6Dh8j5dWErsYpu', 'cajero3@mercadoviva.test', 'cajero', 'Calle 6 # 6-06');

-- ---------------------------------------------------------
-- USUARIOS: 1 abastecedor (agrega más si tu equipo lo necesita)
-- ---------------------------------------------------------
insert into usuarios (id, nombre, numero_identidad, nombre_usuario, contrasena_hash, correo, rol, direccion) values
    ('44444444-0000-0000-0000-000000000001', 'Abastecedor Uno', '3000000001', 'abastecedor1', '$2b$12$0hwgPCKDPSiXnA8ONvNAnOh3eS9KDNgdGpJJN28B2KmNP8WyptNdi', 'abastecedor1@mercadoviva.test', 'abastecedor', 'Bodega Central');

-- ---------------------------------------------------------
-- PRODUCTOS DE EJEMPLO
-- ---------------------------------------------------------
insert into productos (identificador, nombre, categoria_id, valor, foto_url, stock_actual, stock_minimo) values
    ('SKU-0001', 'Gaseosa 1.5L',        '11111111-0000-0000-0000-000000000001', 5500, 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQeXzHRVmsN9M3l_eTIZvZBAcLb8-FCKYaUo4htA4bzVQ&s=10', 40, 10),
    ('SKU-0002', 'Agua 600ml',          '11111111-0000-0000-0000-000000000001', 2000, 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQz-p50v7umI0rHOG-9A9IeMyAd03PNA1FYO4alP6arRw&s=10', 60, 15),
    ('SKU-0003', 'Papas fritas 150g',   '11111111-0000-0000-0000-000000000002', 4500, 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQ6AMSP8mp-q2BOmXSecBLUGs_ppgm3WI4C3kZQPmJurg&s=10',  35, 10),
    ('SKU-0004', 'Chocolatina',         '11111111-0000-0000-0000-000000000002', 2500, 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRifAFkt0v_zjPbVheJAVvYAj_ziEVP_dCQOH5zFYptAQ&s=10',  80, 20),
    ('SKU-0005', 'Detergente 1kg',      '11111111-0000-0000-0000-000000000003', 12000, 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTqAfgYk2fap3_VvmdK4cak9fqgLGHqsyUR5ybmY7tddA&s=10', 20, 5),
    ('SKU-0006', 'Jabón de baño',       '11111111-0000-0000-0000-000000000003', 3200, 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQCptqJN0fVxZNJMUhgLBZjRbBWLcf_rAky94peftyfwA&s=10', 25, 5),
    ('SKU-0007', 'Leche entera 1L',     '11111111-0000-0000-0000-000000000004', 4200,  'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRo8l2VWVpdkO7l_svtihBTauqRo1i5Rtfiu-Gz_WlD8Q&s=1030', 30, 10),
    ('SKU-0008', 'Yogurt 200ml',        '11111111-0000-0000-0000-000000000004', 2800, 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSw6DRcnZerope38iGpOFKh6dX_LXUOiCG7qBcyoA926w&s=10', 40, 10),
    ('SKU-0009', 'Pan tajado',          '11111111-0000-0000-0000-000000000005', 6500, 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRYPdmlY7cdlyyDrlExTXP3cNO0DEJslAluo4hZbiOJkw&s=10', 15, 5),
    ('SKU-0010', 'Croissant',           '11111111-0000-0000-0000-000000000005', 3500, 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSM47genvrncEp8mKiNbuxhsmJY1vRESKwM2dw3edf-Qg&s=10', 0, 5),
    ('SKU-0011', 'Jugo de naranja',     '11111111-0000-0000-0000-000000000001', 4500, 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcS1iljfhS0hi1bigdMi29sZqosFJEpSuzhO0_C4v2csBA&s=10', 50, 5);
    -- SKU-0010 queda a propósito en 0 para que puedas probar HU4 (alternativas)

-- ---------------------------------------------------------
-- CAJA ABIERTA de prueba para cajero1 (para probar fn_registrar_venta_pos
-- sin tener que llamar fn_abrir_caja primero)
-- ---------------------------------------------------------
select fn_abrir_caja('33333333-0000-0000-0000-000000000001', 50000);
