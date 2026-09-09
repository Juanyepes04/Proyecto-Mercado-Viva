from uuid import UUID

from pydantic import BaseModel


class ProductoCrear(BaseModel):
    identificador: str
    nombre: str
    categoria_id: UUID
    valor: float
    foto_url: str | None = None
    stock_actual: int
    stock_minimo: int
    abastecedor_id: UUID


class ProductoActualizar(BaseModel):
    nombre: str | None = None
    categoria_id: UUID | None = None
    valor: float | None = None
    foto_url: str | None = None
    stock_actual: int | None = None
    stock_minimo: int | None = None
    activo: bool | None = None