from uuid import UUID
from sqlalchemy.orm import Session

from ..models.categoria import Categoria
from ..schemas.categoria import CategoriaCrear


def listar_categorias(db: Session) -> list[Categoria]:
    return db.query(Categoria).order_by(Categoria.nombre.asc()).all()


def buscar_categoria(categoria_id: UUID, db: Session) -> Categoria | None:
    return db.query(Categoria).filter(Categoria.id == categoria_id).first()


def crear_categoria(datos: CategoriaCrear, db: Session) -> Categoria:
    categoria = Categoria(
        nombre=datos.nombre,
        foto_url=datos.foto_url
    )
    db.add(categoria)
    db.commit()
    db.refresh(categoria)
    return categoria
