import os
from fastapi import APIRouter, Request, status
from fastapi.responses import FileResponse, RedirectResponse

from ...core.security import decodificar_token

router = APIRouter(prefix="/sistema", tags=["Vistas Sistema Interno"])

from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent.parent.parent.parent.parent
FRONTEND_SISTEMA_DIR = str(BASE_DIR / "frontend" / "sistema")


def validar_acceso_vista(request: Request, *roles_permitidos: str):
    """
    Inspecciona la cookie HttpOnly 'viva_session_token'.
    Si no está presente, está expirada o el rol es insuficiente,
    redirige de forma amigable a la pantalla de login de colaboradores.
    """
    token = request.cookies.get("viva_session_token")
    if not token:
        return RedirectResponse(
            url="/sistema/login?error=auth_required",
            status_code=status.HTTP_303_SEE_OTHER
        )

    payload = decodificar_token(token)
    if not payload:
        return RedirectResponse(
            url="/sistema/login?error=session_expired",
            status_code=status.HTTP_303_SEE_OTHER
        )

    rol = payload.get("rol")
    if rol not in roles_permitidos and rol != "admin":
        return RedirectResponse(
            url="/sistema/login?error=insufficient_role",
            status_code=status.HTTP_303_SEE_OTHER
        )

    return None


@router.get("", include_in_schema=False)
@router.get("/", include_in_schema=False)
def sistema_raiz():
    return RedirectResponse(url="/sistema/login", status_code=status.HTTP_303_SEE_OTHER)


@router.get("/login", response_class=FileResponse)
def vista_login_empleados():
    ruta = os.path.join(FRONTEND_SISTEMA_DIR, "login.html")
    return FileResponse(ruta)


@router.get("/caja")
def vista_pos(request: Request):
    redireccion = validar_acceso_vista(request, "cajero", "admin")
    if redireccion:
        return redireccion
    ruta = os.path.join(FRONTEND_SISTEMA_DIR, "caja.html")
    return FileResponse(ruta)


@router.get("/inventario")
def vista_inventario(request: Request):
    redireccion = validar_acceso_vista(request, "abastecedor", "admin")
    if redireccion:
        return redireccion
    ruta = os.path.join(FRONTEND_SISTEMA_DIR, "inventario.html")
    return FileResponse(ruta)


@router.get("/admin")
def vista_admin(request: Request):
    redireccion = validar_acceso_vista(request, "admin")
    if redireccion:
        return redireccion
    ruta = os.path.join(FRONTEND_SISTEMA_DIR, "admin.html")
    return FileResponse(ruta)
