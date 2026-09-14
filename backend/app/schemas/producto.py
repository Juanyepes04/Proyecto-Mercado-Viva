from datetime import datetime
from uuid import UUID
from pydantic import BaseModel, ConfigDict


class ProductoCrear(BaseModel):
    identificador: str
    nombre: str
    categoria_id: UUID
    valor: float
    foto_url: str | None = None
    stock_actual: int
    stock_minimo: int
    abastecedor_id: UUID | None = None


class ProductoActualizar(BaseModel):
    nombre: str | None = None
    categoria_id: UUID | None = None
    valor: float | None = None
    foto_url: str | None = None
    stock_actual: int | None = None
    stock_minimo: int | None = None
    activo: bool | None = None


class ProductoRespuesta(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    identificador: str
    nombre: str
    categoria_id: UUID | None = None
    valor: float
    foto_url: str | None = None
    stock_actual: int
    stock_reservado: int
    stock_disponible: int | None = None
    stock_minimo: int
    activo: bool
    abastecedor_id: UUID | None = None
    created_at: datetime | None = None
    updated_at: datetime | None = None