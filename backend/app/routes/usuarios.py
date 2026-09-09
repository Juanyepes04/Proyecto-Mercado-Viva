from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from passlib.context import CryptContext

from ..database import get_db
from ..models.usuario import Usuario
from ..schemas.usuario import UsuarioRegistro

router = APIRouter(
    prefix="/usuarios",
    tags=["Usuarios"]
)

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


@router.get("/")
def obtener_usuarios(db: Session = Depends(get_db)):
    return db.query(Usuario).all()


@router.post("/registro")
def registrar_usuario(
    datos: UsuarioRegistro,
    db: Session = Depends(get_db)
):
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