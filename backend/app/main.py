import os
import asyncio
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles

from .routes.usuarios import router as usuarios_router
from .routes.productos import router as productos_router
from .routes.categorias import router as categorias_router
from .routes.pedidos import router as pedidos_router
from .routes.cajas import router as cajas_router
from .routes.api_v1.auth import router as auth_router
from .routes.web.sistema import router as sistema_web_router
from .core.background import bucle_liberador_reservas


BASE_DIR = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
FRONTEND_DIR = os.path.join(BASE_DIR, "frontend")
FRONTEND_SISTEMA_DIR = os.path.join(FRONTEND_DIR, "sistema")


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Iniciar tarea en segundo plano para limpiar carritos abandonados (cada 60 seg)
    tarea_liberador = asyncio.create_task(bucle_liberador_reservas(intervalo_segundos=60))
    yield
    tarea_liberador.cancel()
    try:
        await tarea_liberador
    except asyncio.CancelledError:
        pass


app = FastAPI(
    title="Mercado VIVA API & Storefront",
    description="Backend y canal de ventas de Mercado VIVA",
    version="1.0.0",
    lifespan=lifespan
)


# Configuración dinámica y local de CORS
default_origins = [
    "http://localhost:5500",
    "http://127.0.0.1:5500",
    "http://localhost:3000",
    "http://127.0.0.1:3000",
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    "http://localhost:8000",
    "http://127.0.0.1:8000",
]

env_origins = [
    o.strip()
    for o in os.getenv("ALLOWED_ORIGINS", "").split(",")
    if o.strip()
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=env_origins if env_origins else default_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Montaje de archivos estáticos (CSS, JS, Assets)
css_dir = os.path.join(FRONTEND_DIR, "css")
if os.path.isdir(css_dir):
    app.mount("/css", StaticFiles(directory=css_dir), name="css")

js_dir = os.path.join(FRONTEND_DIR, "js")
if os.path.isdir(js_dir):
    app.mount("/js", StaticFiles(directory=js_dir), name="js")

sistema_js_dir = os.path.join(FRONTEND_SISTEMA_DIR, "js")
if os.path.isdir(sistema_js_dir):
    app.mount("/sistema/js", StaticFiles(directory=sistema_js_dir), name="sistema_js")

sistema_css_dir = os.path.join(FRONTEND_SISTEMA_DIR, "css")
if os.path.isdir(sistema_css_dir):
    app.mount("/sistema/css", StaticFiles(directory=sistema_css_dir), name="sistema_css")

img_dir = os.path.join(FRONTEND_DIR, "img")
if os.path.isdir(img_dir):
    app.mount("/img", StaticFiles(directory=img_dir), name="img")


# Inclusión de Routers de API y Vistas
app.include_router(auth_router)
app.include_router(sistema_web_router)
app.include_router(usuarios_router)
app.include_router(categorias_router)
app.include_router(productos_router)
app.include_router(pedidos_router)
app.include_router(cajas_router)


# CANAL PÚBLICO: Storefront Web en la raíz
@app.get("/", response_class=FileResponse)
def canal_publico_storefront():
    index_path = os.path.join(FRONTEND_DIR, "index.html")
    return FileResponse(index_path)


@app.get("/login", response_class=FileResponse)
def canal_publico_login():
    return FileResponse(os.path.join(FRONTEND_DIR, "login.html"))


@app.get("/login.html", response_class=FileResponse)
def canal_publico_login_html():
    return FileResponse(os.path.join(FRONTEND_DIR, "login.html"))


@app.get("/cliente", response_class=FileResponse)
@app.get("/cliente.html", response_class=FileResponse)
def canal_publico_cliente_html():
    return FileResponse(os.path.join(FRONTEND_DIR, "cliente.html"))


@app.get("/cajero.html", response_class=FileResponse)
def canal_publico_cajero_html():
    return FileResponse(os.path.join(FRONTEND_DIR, "cajero.html"))


@app.get("/inventario.html", response_class=FileResponse)
def canal_publico_inventario_html():
    return FileResponse(os.path.join(FRONTEND_DIR, "inventario.html"))


@app.get("/api/health")
def api_health():
    return {"status": "ok", "servicio": "Mercado VIVA API"}