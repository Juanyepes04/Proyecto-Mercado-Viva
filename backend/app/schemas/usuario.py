from pydantic import BaseModel, EmailStr


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