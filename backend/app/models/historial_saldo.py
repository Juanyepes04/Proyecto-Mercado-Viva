from datetime import datetime, timezone
from uuid import uuid4

from sqlalchemy import Column, String, Numeric, DateTime
from sqlalchemy.dialects.postgresql import UUID

from ..database import Base


class HistorialSaldo(Base):
    __tablename__ = "historial_saldo"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid4)
    usuario_id = Column(UUID(as_uuid=True), nullable=False)
    tipo = Column(String, nullable=False)
    monto = Column(Numeric, nullable=False)
    saldo_resultante = Column(Numeric, nullable=False)
    pedido_id = Column(UUID(as_uuid=True))
    creado_en = Column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc)
    )