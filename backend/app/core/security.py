import os
from datetime import datetime, timezone, timedelta
import jwt

SECRET_KEY = os.getenv("SECRET_KEY", "mercadoviva-secret-key-production-change-me")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", "720"))


def crear_token_acceso(datos: dict, expira_minutos: int | None = None) -> str:
    a_codificar = datos.copy()
    minutos = expira_minutos if expira_minutos is not None else ACCESS_TOKEN_EXPIRE_MINUTES
    expiracion = datetime.now(timezone.utc) + timedelta(minutes=minutos)
    a_codificar.update({"exp": expiracion})
    token = jwt.encode(a_codificar, SECRET_KEY, algorithm=ALGORITHM)
    return token


def decodificar_token(token: str) -> dict | None:
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        return payload
    except jwt.PyJWTError:
        return None
