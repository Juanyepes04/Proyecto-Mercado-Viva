from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from ..database import get_db
from ..schemas.pedido import PedidoCrear, PedidoRespuesta
from ..services.pedidos import crear_pedido


router = APIRouter(
    prefix="/pedidos",
    tags=["Pedidos"]
)


@router.post("/", response_model=PedidoRespuesta)
def agregar_pedido(
    datos: PedidoCrear,
    db: Session = Depends(get_db)
):
    try:
        return crear_pedido(datos, db)

    except ValueError as e:
        raise HTTPException(
            status_code=400,
            detail=str(e)
        )