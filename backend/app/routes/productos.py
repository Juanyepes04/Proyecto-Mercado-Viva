from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from ..database import get_db
from ..models.categoria import Categoria
from ..models.producto import Producto
from ..schemas.producto import ProductoCrear, ProductoActualizar
from ..services.productos import (
    listar_productos,
    buscar_producto,
    crear_producto,
    actualizar_producto,
)


router = APIRouter(
    prefix="/productos",
    tags=["Productos"]
)


@router.get("/")
def obtener_productos(db: Session = Depends(get_db)):
    productos = db.query(Producto, Categoria.nombre).outerjoin(
        Categoria, Producto.categoria_id == Categoria.id
    ).filter(Producto.activo == True).all()

    return [
        {
            "id": producto.id,
            "identificador": producto.identificador,
            "nombre": producto.nombre,
            "categoria_id": producto.categoria_id,
            "categoria_nombre": categoria_nombre,
            "valor": producto.valor,
            "foto_url": producto.foto_url,
            "stock_actual": producto.stock_actual,
            "stock_reservado": producto.stock_reservado,
            "stock_disponible": producto.stock_disponible,
        }
        for producto, categoria_nombre in productos
    ]


@router.get("/{producto_id}")
def obtener_producto(
    producto_id: UUID,
    db: Session = Depends(get_db)
):
    producto = buscar_producto(producto_id, db)

    if not producto:
        raise HTTPException(
            status_code=404,
            detail="Producto no encontrado"
        )

    return producto


@router.post("/")
def agregar_producto(
    datos: ProductoCrear,
    db: Session = Depends(get_db)
):
    return crear_producto(datos, db)


@router.put("/{producto_id}")
def editar_producto(
    producto_id: UUID,
    datos: ProductoActualizar,
    db: Session = Depends(get_db)
):
    producto = actualizar_producto(producto_id, datos, db)

    if not producto:
        raise HTTPException(
            status_code=404,
            detail="Producto no encontrado"
        )

    return producto