from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, ConfigDict


class DetallePedidoCrear(BaseModel):
    producto_id: UUID
    cantidad: int


class PedidoCrear(BaseModel):
    usuario_id: UUID
    canal: str
    detalles: list[DetallePedidoCrear]


class DetallePedidoRespuesta(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    pedido_id: UUID
    producto_id: UUID
    cantidad: int
    precio_unitario: float
    subtotal: float


class PedidoRespuesta(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    usuario_id: UUID
    cajero_id: UUID | None
    caja_id: UUID | None
    canal: str
    estado: str
    total: float
    creado_en: datetime
    actualizado_en: datetime
    detalles: list[DetallePedidoRespuesta]