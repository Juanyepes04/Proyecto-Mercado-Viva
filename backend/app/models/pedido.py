from datetime import datetime, timezone
from uuid import uuid4

from sqlalchemy import Column, Numeric, DateTime, String
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship

from ..database import Base


class Pedido(Base):
    __tablename__ = "pedidos"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid4)
    usuario_id = Column(UUID(as_uuid=True))
    cajero_id = Column(UUID(as_uuid=True))
    caja_id = Column(UUID(as_uuid=True))
    canal = Column(String)
    estado = Column(String)
    total = Column(Numeric)

    creado_en = Column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc)
    )

    actualizado_en = Column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc)
    )

    detalles = relationship(
        "DetallePedido",
        back_populates="pedido"
    )