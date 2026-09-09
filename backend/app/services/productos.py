from sqlalchemy.orm import Session

from ..models.producto import Producto


def listar_productos(db: Session):
    return db.query(Producto).filter(Producto.activo == True).all()


def buscar_producto(producto_id, db: Session):
    return db.query(Producto).filter(
        Producto.id == producto_id,
        Producto.activo == True
    ).first()


def crear_producto(datos, db: Session):
    nuevo_producto = Producto(
        identificador=datos.identificador,
        nombre=datos.nombre,
        categoria_id=datos.categoria_id,
        valor=datos.valor,
        foto_url=datos.foto_url,
        stock_actual=datos.stock_actual,
        stock_reservado=0,
        stock_minimo=datos.stock_minimo,
        activo=True,
        abastecedor_id=datos.abastecedor_id
    )

    db.add(nuevo_producto)
    db.commit()
    db.refresh(nuevo_producto)

    return nuevo_producto


def actualizar_producto(producto_id, datos, db: Session):
    producto = db.query(Producto).filter(
        Producto.id == producto_id
    ).first()

    if not producto:
        return None

    if datos.nombre is not None:
        producto.nombre = datos.nombre

    if datos.categoria_id is not None:
        producto.categoria_id = datos.categoria_id

    if datos.valor is not None:
        producto.valor = datos.valor

    if datos.foto_url is not None:
        producto.foto_url = datos.foto_url

    if datos.stock_actual is not None:
        producto.stock_actual = datos.stock_actual

    if datos.stock_minimo is not None:
        producto.stock_minimo = datos.stock_minimo

    if datos.activo is not None:
        producto.activo = datos.activo

    db.commit()
    db.refresh(producto)

    return producto