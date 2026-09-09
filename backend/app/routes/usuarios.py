from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from ..database import get_db
from ..models.usuario import Usuario
from ..schemas.usuario import UsuarioRegistro, UsuarioLogin, UsuarioRespuesta
from ..services.usuarios import registrar_usuario, iniciar_sesion

router = APIRouter(
    prefix="/usuarios",
    tags=["Usuarios"]
)


@router.get("/")
def obtener_usuarios(db: Session = Depends(get_db)):
    return db.query(Usuario).all()


@router.post("/registro", response_model=UsuarioRespuesta)
def crear_usuario(
    datos: UsuarioRegistro,
    db: Session = Depends(get_db)
):
    return registrar_usuario(datos, db)

@router.post("/login", response_model=UsuarioRespuesta)
def login(
    datos: UsuarioLogin,
    db: Session = Depends(get_db)
):
    usuario = iniciar_sesion(
        datos.nombre_usuario,
        datos.contrasena,
        db
    )

    if not usuario:
        return {"mensaje": "Usuario o contraseña incorrectos"}

    return usuario