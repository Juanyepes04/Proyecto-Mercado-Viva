from datetime import datetime, timezone
from uuid import uuid4

from sqlalchemy import Column, Integer, DateTime, Enum
from sqlalchemy.dialects.postgresql import UUID

from ..database import Base


class MovimientoInventario(Base):
    __tablename__ = "movimientos_inventario"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid4)
    producto_id = Column(UUID(as_uuid=True), nullable=False)

    tipo = Column(
        Enum(
            "entrada",
            "salida_web",
            "salida_pos",
            "ajuste",
            "liberacion_reserva",
            name="tipo_movimiento_inventario",
            create_type=False
        ),
        nullable=False
    )

    cantidad = Column(Integer, nullable=False)
    stock_resultante = Column(Integer, nullable=False)
    usuario_id = Column(UUID(as_uuid=True))
    referencia_pedido_id = Column(UUID(as_uuid=True))
    referencia_reserva_id = Column(UUID(as_uuid=True))

    creado_en = Column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc)
    )