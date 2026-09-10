from uuid import UUID

from pydantic import BaseModel


class DetallePedidoRespuesta(BaseModel):
    id: UUID
    pedido_id: UUID
    producto_id: UUID
    cantidad: int
    precio_unitario: float
    subtotal: float