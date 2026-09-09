from datetime import datetime, timezone
from uuid import uuid4

from sqlalchemy import Column, String, Numeric, Boolean, DateTime
from sqlalchemy.dialects.postgresql import UUID
from ..database import Base



class Usuario(Base):
    __tablename__ = "usuarios"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid4)
    nombre = Column(String)
    numero_identidad = Column(String)
    nombre_usuario = Column(String)
    contrasena_hash = Column(String)
    correo = Column(String)
    rol = Column(String)
    direccion = Column(String)
    saldo_simulado = Column(Numeric)
    activo = Column(Boolean)

    created_at = Column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc)
    )

    updated_at = Column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc)
    )