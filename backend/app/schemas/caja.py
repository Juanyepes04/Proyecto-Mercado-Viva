from datetime import datetime
from uuid import UUID

from pydantic import BaseModel


class CajaAbrir(BaseModel):
    cajero_id: UUID
    saldo_inicial: float


class CajaCerrar(BaseModel):
    saldo_final_real: float


class CajaRespuesta(BaseModel):
    id: UUID
    cajero_id: UUID
    saldo_inicial: float
    saldo_final_esperado: float | None
    saldo_final_real: float | None
    diferencia: float | None
    estado: str
    abierta_en: datetime
    cerrada_en: datetime | None