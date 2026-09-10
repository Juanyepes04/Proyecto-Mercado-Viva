from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from ..database import get_db
from ..schemas.pedido import PedidoCrear, PedidoRespuesta
from ..services.pedidos import crear_pedido
from ..services.ventas import confirmar_pedido
from ..services.pedidos import crear_pedido, listar_pedidos, buscar_pedido


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


@router.post("/{pedido_id}/confirmar", response_model=PedidoRespuesta)
def confirmar_venta(
    pedido_id: UUID,
    db: Session = Depends(get_db)
):
    try:
        return confirmar_pedido(pedido_id, db)

    except ValueError as e:
        raise HTTPException(
            status_code=400,
            detail=str(e)
        )

    @router.post("/{pedido_id}/confirmar", response_model=PedidoRespuesta)
    def confirmar_venta(
        pedido_id: UUID,
        db: Session = Depends(get_db)
    ):
        try:
            return confirmar_pedido(pedido_id, db)

        except ValueError as e:
            raise HTTPException(
                status_code=400,
                detail=str(e)
            )

@router.get("/", response_model=list[PedidoRespuesta])
def obtener_pedidos(db: Session = Depends(get_db)):
    return listar_pedidos(db)


@router.get("/{pedido_id}", response_model=PedidoRespuesta)
def obtener_pedido(
    pedido_id: UUID,
    db: Session = Depends(get_db)
):
    pedido = buscar_pedido(pedido_id, db)

    if not pedido:
        raise HTTPException(
            status_code=404,
            detail="Pedido no encontrado"
        )

    return pedido