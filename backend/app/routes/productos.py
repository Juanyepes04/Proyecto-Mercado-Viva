from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from ..database import get_db
from ..schemas.producto import ProductoCrear, ProductoActualizar, ProductoRespuesta
from ..services.productos import (
    listar_productos,
    buscar_producto,
    crear_producto,
    actualizar_producto,
)


from ..core.deps import require_roles

router = APIRouter(
    prefix="/productos",
    tags=["Productos"]
)


@router.get("/", response_model=list[ProductoRespuesta])
def obtener_productos(
    categoria_id: UUID | None = None,
    q: str | None = None,
    db: Session = Depends(get_db)
):
    return listar_productos(db, categoria_id=categoria_id, q=q)


@router.get("/{producto_id}", response_model=ProductoRespuesta)
def obtener_producto(
    producto_id: UUID,
    db: Session = Depends(get_db)
):
    producto = buscar_producto(producto_id, db)

    if not producto:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Producto no encontrado"
        )

    return producto


@router.post("/", response_model=ProductoRespuesta, status_code=status.HTTP_201_CREATED)
def agregar_producto(
    datos: ProductoCrear,
    db: Session = Depends(get_db),
    _usuario_abastecedor = Depends(require_roles("abastecedor", "admin"))
):
    return crear_producto(datos, db)


@router.put("/{producto_id}", response_model=ProductoRespuesta)
def editar_producto(
    producto_id: UUID,
    datos: ProductoActualizar,
    db: Session = Depends(get_db),
    _usuario_abastecedor = Depends(require_roles("abastecedor", "admin"))
):
    producto = actualizar_producto(producto_id, datos, db)

    if not producto:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Producto no encontrado"
        )

    return producto
