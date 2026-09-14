from uuid import UUID
from fastapi import Depends, HTTPException, Request, status
from fastapi.security import OAuth2PasswordBearer

from sqlalchemy.orm import Session

from ..database import get_db
from ..models.usuario import Usuario
from .security import decodificar_token

oauth2_scheme = OAuth2PasswordBearer(
    tokenUrl="/api/v1/auth/login",
    auto_error=False
)


def get_current_user(
    request: Request,
    token_header: str | None = Depends(oauth2_scheme),
    db: Session = Depends(get_db)
) -> Usuario:
    # 1. Leer Bearer token del header o Cookie de sesión
    token = token_header or request.cookies.get("viva_session_token")

    if not token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Autenticación requerida. Sesión no encontrada.",
            headers={"WWW-Authenticate": "Bearer"},
        )


    payload = decodificar_token(token)
    if not payload:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token inválido o expirado.",
            headers={"WWW-Authenticate": "Bearer"},
        )

    user_id_str = payload.get("sub")
    if not user_id_str:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token no contiene identificador de usuario válido.",
            headers={"WWW-Authenticate": "Bearer"},
        )

    try:
        user_id = UUID(user_id_str)
    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Identificador de usuario inválido en el token.",
            headers={"WWW-Authenticate": "Bearer"},
        )

    usuario = db.query(Usuario).filter(
        Usuario.id == user_id,
        Usuario.activo == True
    ).first()

    if not usuario:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Usuario no encontrado o inactivo.",
            headers={"WWW-Authenticate": "Bearer"},
        )

    return usuario


def require_roles(*roles_permitidos: str):
    def verificador_rol(
        usuario: Usuario = Depends(get_current_user)
    ) -> Usuario:
        if usuario.rol not in roles_permitidos and usuario.rol != "admin":
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=(
                    f"Acceso denegado: tu rol '{usuario.rol}' no tiene permisos para esta acción. "
                    f"Roles permitidos: {', '.join(roles_permitidos)}"
                )
            )
        return usuario

    return verificador_rol
