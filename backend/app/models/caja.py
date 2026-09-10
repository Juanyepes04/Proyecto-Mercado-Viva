from datetime import datetime, timezone
from uuid import uuid4

from sqlalchemy import Column, Numeric, DateTime, Enum
from sqlalchemy.dialects.postgresql import UUID

from ..database import Base


class Caja(Base):
    __tablename__ = "cajas"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid4)
    cajero_id = Column(UUID(as_uuid=True), nullable=False)

    saldo_inicial = Column(Numeric, nullable=False)
    saldo_final_esperado = Column(Numeric)
    saldo_final_real = Column(Numeric)
    diferencia = Column(Numeric)

    estado = Column(
        Enum(
            "abierta",
            "cerrada",
            name="estado_caja",
            create_type=False
        ),
        nullable=False
    )

    abierta_en = Column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        nullable=False
    )

    cerrada_en = Column(DateTime(timezone=True))