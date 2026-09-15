# Mercado Viva

Sistema de gestión para la cadena de supermercados **Mercado Viva**, desarrollado como proyecto académico de Ingeniería de Sistemas.

El proyecto busca mejorar la gestión de productos, inventario, pedidos y ventas, especialmente en las compras realizadas por medios digitales. El sistema permite controlar la disponibilidad de los productos y gestionar las reservas de inventario para evitar inconsistencias entre las existencias reales y las mostradas al cliente.

## Objetivo

Desarrollar un sistema que permita gestionar de manera centralizada el inventario y las operaciones de venta de Mercado Viva, reduciendo los problemas ocasionados por diferencias entre el inventario disponible y el inventario real de las tiendas.

Uno de los principales objetivos del proyecto es evitar que un pedido sea confirmado cuando el producto no cuenta con unidades disponibles.

## Tecnologías utilizadas

* **Python**
* **FastAPI** para el desarrollo de la API REST
* **SQLAlchemy** como ORM
* **PostgreSQL / Supabase** para la base de datos
* **Pydantic** para la validación de datos
* **Passlib + Bcrypt** para el manejo seguro de contraseñas
* **Swagger / OpenAPI** para probar y documentar la API

## Roles del sistema

El sistema maneja principalmente tres tipos de usuarios:

* **Cliente:** puede realizar pedidos mediante el canal web.
* **Cajero:** puede realizar ventas mediante el canal POS y manejar una caja.
* **Reabastecedor:** se encarga de la gestión y actualización del inventario.

## Funcionalidades principales

### Usuarios

* Registro de usuarios.
* Validación de datos.
* Almacenamiento de contraseñas mediante hash.
* Inicio de sesión.
* Manejo de roles.
* Consulta de usuarios.

### Productos e inventario

* Consulta de productos.
* Consulta de un producto específico.
* Creación de productos.
* Actualización de productos.
* Control del stock actual.
* Control del stock reservado.
* Cálculo automático del stock disponible.

El stock disponible se obtiene mediante la relación:

```text
stock_disponible = stock_actual - stock_reservado
```

### Pedidos

* Creación de pedidos.
* Creación de detalles de pedido.
* Consulta de todos los pedidos.
* Consulta de un pedido específico.
* Cálculo automático del total.
* Validación de disponibilidad antes de crear una reserva.
* Confirmación de pedidos.

### Reservas de inventario

Cuando se crea un pedido, el sistema puede reservar las unidades necesarias del producto.

La reserva permite evitar que las mismas unidades sean utilizadas simultáneamente por otro pedido.

Las reservas manejan los siguientes estados:

```text
activa
confirmada
expirada
cancelada
```

Las reservas tienen un tiempo de expiración de 15 minutos.

### Ventas web

Al confirmar una venta realizada mediante el canal web:

1. Se verifica el saldo disponible del cliente.
2. Se descuenta el valor de la compra.
3. Se confirma la reserva.
4. Se descuenta el stock actual.
5. Se actualiza el stock reservado.
6. Se registra el movimiento de inventario.
7. El pedido pasa a estado `pagado`.

### Ventas POS

El sistema también permite manejar ventas realizadas desde el punto de venta.

Para las ventas POS se controla:

* Cajero responsable.
* Caja utilizada.
* Estado de la caja.
* Movimiento de caja.
* Movimiento de inventario.
* Confirmación del pedido.

### Cajas

El sistema permite:

* Abrir una caja.
* Registrar saldo inicial.
* Registrar ventas.
* Cerrar una caja.
* Calcular el saldo esperado.
* Registrar el saldo real.
* Calcular la diferencia de caja.

## Arquitectura del backend

El backend está organizado siguiendo una separación de responsabilidades:

```text
backend/
└── app/
    ├── models/
    │   ├── usuario.py
    │   ├── producto.py
    │   ├── pedido.py
    │   ├── detalle_pedido.py
    │   ├── reserva_stock.py
    │   ├── movimiento_inventario.py
    │   ├── historial_saldo.py
    │   ├── caja.py
    │   └── movimiento_caja.py
    │
    ├── schemas/
    │   ├── usuario.py
    │   ├── producto.py
    │   ├── pedido.py
    │   ├── detalle_pedido.py
    │   ├── reserva_stock.py
    │   └── caja.py
    │
    ├── services/
    │   ├── usuarios.py
    │   ├── productos.py
    │   ├── pedidos.py
    │   ├── reservas_stock.py
    │   ├── saldo.py
    │   ├── ventas.py
    │   └── cajas.py
    │
    ├── routes/
    │   ├── usuarios.py
    │   ├── productos.py
    │   ├── pedidos.py
    │   └── cajas.py
    │
    ├── database.py
    └── main.py
```

### Responsabilidad de cada capa

**Models:** representan las tablas de la base de datos.

**Schemas:** validan los datos que entran y salen de la API.

**Services:** contienen la lógica de negocio del sistema.

**Routes:** reciben las solicitudes HTTP y llaman a los servicios correspondientes.

**Database:** contiene la configuración de conexión con la base de datos.

## Instalación

### 1. Clonar el repositorio

```bash
git clone <URL_DEL_REPOSITORIO>
cd Proyecto-Mercado-Viva
```

### 2. Crear el entorno virtual

En Windows PowerShell:

```powershell
python -m venv .venv
```

Activar el entorno virtual:

```powershell
.\.venv\Scripts\Activate.ps1
```

Si PowerShell bloquea la ejecución del script, puede utilizarse:

```powershell
Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass
```

y posteriormente:

```powershell
.\.venv\Scripts\Activate.ps1
```

### 3. Instalar dependencias

```powershell
pip install -r requirements.txt
```

### 4. Configurar la base de datos

El proyecto utiliza **Supabase/PostgreSQL**.

Se debe configurar la cadena de conexión correspondiente en el archivo de configuración utilizado por el proyecto.

No se deben subir al repositorio las credenciales reales de la base de datos.

## Ejecución

Con el entorno virtual activado, ejecutar:

```powershell
uvicorn backend.app.main:app --reload
```

La API estará disponible en:

```text
http://127.0.0.1:8000
```

La documentación interactiva de Swagger estará disponible en:

```text
http://127.0.0.1:8000/docs
```

## Principales endpoints

### Usuarios

```text
GET  /usuarios/
POST /usuarios/registro
POST /usuarios/login
```

### Productos

```text
GET  /productos/
GET  /productos/{producto_id}
POST /productos/
PUT  /productos/{producto_id}
```

### Pedidos

```text
GET  /pedidos/
GET  /pedidos/{pedido_id}
POST /pedidos/
POST /pedidos/{pedido_id}/confirmar
```

### Cajas

```text
POST /cajas/abrir
POST /cajas/{caja_id}/cerrar
```

## Flujo principal de compra web

```text
Cliente
   ↓
Crear pedido
   ↓
Validar producto y stock
   ↓
Reservar unidades
   ↓
Verificar saldo
   ↓
Confirmar pedido
   ↓
Descontar inventario
   ↓
Registrar movimiento
   ↓
Pedido pagado
```

## Flujo de venta POS

```text
Cajero
   ↓
Caja abierta
   ↓
Crear pedido POS
   ↓
Validar caja
   ↓
Confirmar venta
   ↓
Registrar movimiento de caja
   ↓
Descontar inventario
   ↓
Registrar movimiento de inventario
   ↓
Pedido pagado
```

## Base de datos

Las principales tablas utilizadas por el proyecto son:

```text
usuarios
productos
categorias
pedidos
detalle_pedido
reservas_stock
movimientos_inventario
historial_saldo
cajas
movimientos_caja
```

También se utiliza la vista:

```text
vista_catalogo
```

## Manejo de inventario

El sistema diferencia entre:

* **Stock actual:** unidades físicas existentes.
* **Stock reservado:** unidades apartadas para pedidos.
* **Stock disponible:** unidades que pueden venderse.

El stock disponible es calculado automáticamente por la base de datos, evitando que el backend pueda generar valores inconsistentes.

## Seguridad

Las contraseñas de los usuarios no se almacenan en texto plano. Antes de guardarlas en la base de datos se genera un hash utilizando Bcrypt.

Además, las respuestas públicas de usuario no exponen el campo `contrasena_hash`.

## Estado del proyecto

El backend cuenta con las funcionalidades principales del MVP implementadas y conectadas a la base de datos.

El siguiente paso del proyecto es integrar el frontend con la API para permitir el uso del sistema desde una interfaz gráfica.

## Autores

**Proyecto Mercado Viva**

Equipo:

* Juan Diego Yepes Valencia
* Samuel David Gutierrez Mejia
* Luis Alejandro Correa Arrieta
* Santiago Ossa Orozco
