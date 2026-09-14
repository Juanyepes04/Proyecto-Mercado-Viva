from datetime import timedelta
from uuid import UUID
from fastapi import APIRouter, Depends, HTTPException, Response, status
from pydantic import BaseModel, Field
from sqlalchemy import select
from sqlalchemy.orm import Session
from passlib.context import CryptContext

from ...database import get_db
from ...models.usuario import Usuario
from ...core.security import crear_token_acceso, ACCESS_TOKEN_EXPIRE_MINUTES
from ...core.deps import get_current_user

router = APIRouter(prefix="/api/v1/auth", tags=["Autenticación"])

import bcrypt

def verificar_contrasena(plain_password: str, hashed_password: str) -> bool:
    try:
        if not hashed_password:
            return False
        password_bytes = plain_password.strip().encode("utf-8")[:72]
        hash_bytes = hashed_password.strip().encode("utf-8")
        return bcrypt.checkpw(password_bytes, hash_bytes)
    except Exception:
        return False


class LoginRequest(BaseModel):
    nombre_usuario: str = Field(..., min_length=3, max_length=50)
    contrasena: str = Field(..., min_length=3)


class UsuarioInfo(BaseModel):
    id: UUID
    nombre: str
    nombre_usuario: str
    rol: str
    correo: str
    saldo_simulado: float
    direccion: str | None = None


class LoginResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    rol: str
    usuario: UsuarioInfo


@router.post("/login", response_model=LoginResponse)
def login(
    datos: LoginRequest,
    response: Response,
    db: Session = Depends(get_db)
):
    stmt = select(Usuario).where(
        Usuario.nombre_usuario == datos.nombre_usuario.strip(),
        Usuario.activo == True
    )
    usuario = db.execute(stmt).scalar_one_or_none()

    if not usuario or not verificar_contrasena(datos.contrasena, usuario.contrasena_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Credenciales incorrectas o usuario inactivo."
        )

    # Generar JWT con user_id, rol y username
    access_token = crear_token_acceso({
        "sub": str(usuario.id),
        "rol": usuario.rol,
        "nombre_usuario": usuario.nombre_usuario
    })

    # Guardar Cookie HttpOnly para navegación fluida de páginas HTML
    response.set_cookie(
        key="viva_session_token",
        value=access_token,
        httponly=True,
        max_age=ACCESS_TOKEN_EXPIRE_MINUTES * 60,
        samesite="lax",
        path="/",
        secure=False  # Cambiar a True en producción bajo HTTPS
    )

    return LoginResponse(
        access_token=access_token,
        token_type="bearer",
        rol=usuario.rol,
        usuario=UsuarioInfo(
            id=usuario.id,
            nombre=usuario.nombre,
            nombre_usuario=usuario.nombre_usuario,
            rol=usuario.rol,
            correo=usuario.correo,
            saldo_simulado=float(usuario.saldo_simulado or 0),
            direccion=usuario.direccion
        )
    )


@router.post("/logout")
def logout(response: Response):
    response.delete_cookie(key="viva_session_token", path="/")
    return {"mensaje": "Sesión cerrada correctamente"}


@router.get("/me", response_model=UsuarioInfo)
def obtener_usuario_actual(usuario: Usuario = Depends(get_current_user)):
    return UsuarioInfo(
        id=usuario.id,
        nombre=usuario.nombre,
        nombre_usuario=usuario.nombre_usuario,
        rol=usuario.rol,
        correo=usuario.correo,
        saldo_simulado=float(usuario.saldo_simulado or 0),
        direccion=usuario.direccion
    )
