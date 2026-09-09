from passlib.context import CryptContext
from sqlalchemy.orm import Session

from ..models.usuario import Usuario
from ..schemas.usuario import UsuarioRegistro


pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


def registrar_usuario(datos: UsuarioRegistro, db: Session):
    contrasena_hash = pwd_context.hash(datos.contrasena)

    nuevo_usuario = Usuario(
        nombre=datos.nombre,
        numero_identidad=datos.numero_identidad,
        nombre_usuario=datos.nombre_usuario,
        contrasena_hash=contrasena_hash,
        correo=datos.correo,
        rol=datos.rol,
        direccion=datos.direccion,
        saldo_simulado=0,
        activo=True
    )

    db.add(nuevo_usuario)
    db.commit()
    db.refresh(nuevo_usuario)

    return nuevo_usuario

def iniciar_sesion(nombre_usuario: str, contrasena: str, db: Session):
    usuario = db.query(Usuario).filter(
        Usuario.nombre_usuario == nombre_usuario
    ).first()

    if not usuario:
        return None

    if not pwd_context.verify(contrasena, usuario.contrasena_hash):
        return None

    if not usuario.activo:
        return None

    return usuario