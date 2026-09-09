from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from ..database import get_db
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
    return listar_productos(db)


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