from fastapi import FastAPI

from .routes.usuarios import router as usuarios_router

app = FastAPI(
    title="Mercado VIVA API",
    description="Backend del MVP de Mercado VIVA",
    version="1.0.0"
)

app.include_router(usuarios_router)


@app.get("/")
def inicio():
    return {"mensaje": "API de Mercado VIVA funcionando"}