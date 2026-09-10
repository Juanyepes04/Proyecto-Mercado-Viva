from datetime import datetime, timezone
from uuid import uuid4

from sqlalchemy import Column, Numeric, DateTime, String, Enum
from sqlalchemy.dialects.postgresql import UUID

from ..database import Base


class MovimientoCaja(Base):
    __tablename__ = "movimientos_caja"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid4)
    caja_id = Column(UUID(as_uuid=True), nullable=False)

    tipo = Column(
        Enum(
            "apertura",
            "venta",
            "retiro",
            "ingreso",
            "cierre",
            name="tipo_movimiento_caja",
            create_type=False
        ),
        nullable=False
    )

    monto = Column(Numeric, nullable=False)
    pedido_id = Column(UUID(as_uuid=True))
    descripcion = Column(String)

    creado_en = Column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc)
    )