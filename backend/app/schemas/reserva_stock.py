from uuid import UUID

from pydantic import BaseModel


class ReservaStockCrear(BaseModel):
    detalle_pedido_id: UUID
    producto_id: UUID
    cantidad: int