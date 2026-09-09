from pydantic import BaseModel, EmailStr
from uuid import UUID


class UsuarioRegistro(BaseModel):
    nombre: str
    numero_identidad: str
    nombre_usuario: str
    contrasena: str
    correo: EmailStr
    rol: str
    direccion: str

class UsuarioLogin(BaseModel):
    nombre_usuario: str
    contrasena: str


class UsuarioRespuesta(BaseModel):
    id: UUID
    nombre: str
    numero_identidad: str
    nombre_usuario: str
    correo: EmailStr
    rol: str
    direccion: str
    saldo_simulado: float
    activo: bool