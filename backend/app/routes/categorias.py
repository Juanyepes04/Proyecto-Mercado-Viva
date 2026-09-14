from uuid import UUID
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from ..database import get_db
from ..schemas.categoria import CategoriaCrear, CategoriaRespuesta
from ..services.categorias import (
    listar_categorias,
    buscar_categoria,
    crear_categoria,
)

router = APIRouter(
    prefix="/categorias",
    tags=["Categorías"]
)


@router.get("/", response_model=list[CategoriaRespuesta])
def obtener_categorias(db: Session = Depends(get_db)):
    return listar_categorias(db)


@router.get("/{categoria_id}", response_model=CategoriaRespuesta)
def obtener_categoria(
    categoria_id: UUID,
    db: Session = Depends(get_db)
):
    categoria = buscar_categoria(categoria_id, db)
    if not categoria:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Categoría no encontrada"
        )
    return categoria


@router.post("/", response_model=CategoriaRespuesta, status_code=status.HTTP_201_CREATED)
def agregar_categoria(
    datos: CategoriaCrear,
    db: Session = Depends(get_db)
):
    try:
        return crear_categoria(datos, db)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )
