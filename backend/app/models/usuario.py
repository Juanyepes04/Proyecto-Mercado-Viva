from sqlalchemy import Column, String, Numeric, Boolean, DateTime
from sqlalchemy.dialects.postgresql import UUID
from ..database import Base


class Usuario(Base):
    __tablename__ = "usuarios"

    id = Column(UUID(as_uuid=True), primary_key=True)
    nombre = Column(String)
    numero_identidad = Column(String)
    nombre_usuario = Column(String)
    contrasena_hash = Column(String)
    correo = Column(String)
    rol = Column(String)
    direccion = Column(String)
    saldo_simulado = Column(Numeric)
    activo = Column(Boolean)
    created_at = Column(DateTime)
    updated_at = Column(DateTime)