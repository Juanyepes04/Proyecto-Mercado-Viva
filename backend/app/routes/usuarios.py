from uuid import UUID
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from ..database import get_db
from ..models.usuario import Usuario
from ..schemas.usuario import (
    UsuarioRegistro,
    UsuarioLogin,
    UsuarioRespuesta,
    UsuarioRecarga,
    UsuarioActualizarDireccion,
    TokenRespuesta,
)
from ..services.usuarios import registrar_usuario, iniciar_sesion
from ..services.saldo import recargar_saldo
from ..core.security import crear_token_acceso
from ..core.deps import get_current_user

router = APIRouter(
    prefix="/usuarios",
    tags=["Usuarios"]
)


@router.get("/", response_model=list[UsuarioRespuesta])
def obtener_usuarios(db: Session = Depends(get_db)):
    return db.query(Usuario).all()


@router.get("/me", response_model=UsuarioRespuesta)
def obtener_perfil_actual(
    usuario_actual: Usuario = Depends(get_current_user)
):
    return usuario_actual


@router.get("/{usuario_id}", response_model=UsuarioRespuesta)
def obtener_usuario(
    usuario_id: UUID,
    db: Session = Depends(get_db)
):
    usuario = db.query(Usuario).filter(
        Usuario.id == usuario_id,
        Usuario.activo == True
    ).first()

    if not usuario:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Usuario no encontrado"
        )

    return usuario


@router.post("/registro", response_model=UsuarioRespuesta, status_code=status.HTTP_201_CREATED)
def crear_usuario(
    datos: UsuarioRegistro,
    db: Session = Depends(get_db)
):
    return registrar_usuario(datos, db)


@router.post("/login", response_model=TokenRespuesta)
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
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Usuario o contraseña incorrectos"
        )

    token = crear_token_acceso({
        "sub": str(usuario.id),
        "rol": usuario.rol,
        "nombre_usuario": usuario.nombre_usuario
    })

    return TokenRespuesta(
        access_token=token,
        token_type="bearer",
        usuario=usuario
    )


@router.post("/{usuario_id}/recargar", response_model=UsuarioRespuesta)
def recargar(
    usuario_id: UUID,
    datos: UsuarioRecarga,
    db: Session = Depends(get_db),
    usuario_actual: Usuario = Depends(get_current_user)
):
    # Solo el propio usuario o un admin pueden recargar el saldo de esa cuenta
    if usuario_actual.id != usuario_id and usuario_actual.rol != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="No tienes permiso para recargar el saldo de otro usuario."
        )

    try:
        return recargar_saldo(usuario_id, datos.monto, db)
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )


@router.patch("/{usuario_id}/direccion", response_model=UsuarioRespuesta)
def actualizar_direccion_usuario(
    usuario_id: UUID,
    datos: UsuarioActualizarDireccion,
    db: Session = Depends(get_db)
):
    usuario = db.query(Usuario).filter(Usuario.id == usuario_id, Usuario.activo == True).first()
    if not usuario:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Usuario no encontrado"
        )

    nueva_dir = datos.direccion.strip()
    if not nueva_dir:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="La dirección no puede estar vacía"
        )

    usuario.direccion = nueva_dir
    db.commit()
    db.refresh(usuario)
    return usuario
