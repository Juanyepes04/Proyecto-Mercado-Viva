import bcrypt
from sqlalchemy.orm import Session
from fastapi import HTTPException, status

from ..models.usuario import Usuario
from ..schemas.usuario import UsuarioRegistro


def hashear_contrasena(contrasena: str) -> str:
    pwd_bytes = contrasena.strip().encode("utf-8")[:72]
    salt = bcrypt.gensalt()
    return bcrypt.hashpw(pwd_bytes, salt).decode("utf-8")


def verificar_contrasena(plain_password: str, hashed_password: str) -> bool:
    try:
        if not hashed_password:
            return False
        password_bytes = plain_password.strip().encode("utf-8")[:72]
        hash_bytes = hashed_password.strip().encode("utf-8")
        return bcrypt.checkpw(password_bytes, hash_bytes)
    except Exception:
        return False


def registrar_usuario(datos: UsuarioRegistro, db: Session):
    nombre_usuario = datos.nombre_usuario.strip()
    correo = datos.correo.strip().lower()
    numero_identidad = datos.numero_identidad.strip() if datos.numero_identidad else ""

    if db.query(Usuario).filter(Usuario.nombre_usuario == nombre_usuario).first():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="El nombre de usuario ya se encuentra registrado."
        )

    if db.query(Usuario).filter(Usuario.correo == correo).first():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="El correo electrónico ya se encuentra registrado."
        )

    if numero_identidad and db.query(Usuario).filter(Usuario.numero_identidad == numero_identidad).first():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="El documento de identidad ya se encuentra registrado."
        )

    contrasena_hash = hashear_contrasena(datos.contrasena)

    rol = datos.rol or "cliente"
    nuevo_usuario = Usuario(
        nombre=datos.nombre.strip(),
        numero_identidad=numero_identidad,
        nombre_usuario=nombre_usuario,
        contrasena_hash=contrasena_hash,
        correo=correo,
        rol=rol,
        direccion=datos.direccion.strip() if datos.direccion else None,
        saldo_simulado=50000 if rol == "cliente" else 0,
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

    if not verificar_contrasena(contrasena, usuario.contrasena_hash):
        return None

    if not usuario.activo:
        return None

    return usuario