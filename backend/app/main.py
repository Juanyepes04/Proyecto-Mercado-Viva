from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from .routes.usuarios import router as usuarios_router
from .routes.productos import router as productos_router
from .routes.pedidos import router as pedidos_router
from .routes.cajas import router as cajas_router


app = FastAPI(
    title="Mercado VIVA API",
    description="Backend del MVP de Mercado VIVA",
    version="1.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5500",
        "http://127.0.0.1:5500",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(usuarios_router)
app.include_router(productos_router)
app.include_router(pedidos_router)
app.include_router(cajas_router)


@app.get("/")
def inicio():
    return {"mensaje": "API de Mercado VIVA funcionando"}