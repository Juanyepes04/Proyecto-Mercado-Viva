from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from ..database import get_db
from ..models.usuario import Usuario

router = APIRouter(
    prefix="/usuarios",
    tags=["Usuarios"]
)


@router.get("/")
def obtener_usuarios(db: Session = Depends(get_db)):
    usuarios = db.query(Usuario).all()
    return usuarios