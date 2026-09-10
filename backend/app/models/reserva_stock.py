from datetime import datetime, timezone
from uuid import uuid4

from sqlalchemy import Column, Integer, DateTime, String
from sqlalchemy.dialects.postgresql import UUID

from ..database import Base


class ReservaStock(Base):
    __tablename__ = "reservas_stock"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid4)
    detalle_pedido_id = Column(UUID(as_uuid=True))
    producto_id = Column(UUID(as_uuid=True))
    cantidad = Column(Integer)
    estado = Column(String)

    creado_en = Column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc)
    )

    expira_en = Column(DateTime(timezone=True))