from datetime import datetime, timezone
from uuid import uuid4

from sqlalchemy import Column, String, Numeric, Integer, Boolean, DateTime, Computed
from sqlalchemy.dialects.postgresql import UUID

from ..database import Base


class Producto(Base):
    __tablename__ = "productos"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid4)
    identificador = Column(String)
    nombre = Column(String)
    categoria_id = Column(UUID(as_uuid=True))
    valor = Column(Numeric)
    foto_url = Column(String)
    stock_actual = Column(Integer)
    stock_reservado = Column(Integer)
    stock_disponible = Column(Integer,Computed("stock_actual - stock_reservado"))
    stock_minimo = Column(Integer)
    activo = Column(Boolean)
    abastecedor_id = Column(UUID(as_uuid=True))

    created_at = Column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc)
    )

    updated_at = Column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc)
    )