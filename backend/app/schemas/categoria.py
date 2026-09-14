from datetime import datetime
from uuid import UUID
from pydantic import BaseModel, ConfigDict


class CategoriaBase(BaseModel):
    nombre: str
    foto_url: str | None = None


class CategoriaCrear(CategoriaBase):
    pass


class CategoriaRespuesta(CategoriaBase):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    created_at: datetime
