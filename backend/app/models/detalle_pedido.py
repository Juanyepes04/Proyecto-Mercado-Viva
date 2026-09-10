from uuid import uuid4

from sqlalchemy import Column, Integer, Numeric, Computed, ForeignKey
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship

from ..database import Base


class DetallePedido(Base):
    __tablename__ = "detalle_pedido"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid4)

    pedido_id = Column(
        UUID(as_uuid=True),
        ForeignKey("pedidos.id")
    )

    producto_id = Column(UUID(as_uuid=True))

    cantidad = Column(Integer)
    precio_unitario = Column(Numeric)

    subtotal = Column(
        Numeric,
        Computed("cantidad * precio_unitario")
    )

    pedido = relationship(
        "Pedido",
        back_populates="detalles"
    )