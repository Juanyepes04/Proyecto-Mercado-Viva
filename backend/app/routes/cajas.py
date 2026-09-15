from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from ..database import get_db
from ..schemas.caja import CajaAbrir, CajaCerrar, CajaRespuesta
from ..services.cajas import abrir_caja, cerrar_caja, obtener_caja_abierta


from ..core.deps import require_roles


router = APIRouter(
    prefix="/cajas",
    tags=["Cajas"]
)


@router.post("/abrir", response_model=CajaRespuesta)
def abrir(
    datos: CajaAbrir,
    db: Session = Depends(get_db),
    _usuario_cajero = Depends(require_roles("cajero", "admin"))
):
    try:
        return abrir_caja(
            datos.cajero_id,
            datos.saldo_inicial,
            db
        )
    except ValueError as e:
        raise HTTPException(
            status_code=400,
            detail=str(e)
        )


@router.get("/abierta/{cajero_id}", response_model=CajaRespuesta)
def obtener_abierta(
    cajero_id: UUID,
    db: Session = Depends(get_db)
):
    caja = obtener_caja_abierta(cajero_id, db)
    if not caja:
        raise HTTPException(
            status_code=404,
            detail="El cajero no tiene una caja abierta"
        )
    return caja


@router.post("/{caja_id}/cerrar", response_model=CajaRespuesta)
def cerrar(
    caja_id: UUID,
    datos: CajaCerrar,
    db: Session = Depends(get_db),
    _usuario_cajero = Depends(require_roles("cajero", "admin"))
):
    try:
        return cerrar_caja(
            caja_id,
            datos.saldo_final_real,
            db
        )
    except ValueError as e:
        raise HTTPException(
            status_code=400,
            detail=str(e)
        )
