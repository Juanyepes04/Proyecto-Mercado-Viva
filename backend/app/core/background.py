import asyncio
import logging
from ..database import SessionLocal
from ..services.reservas_stock import liberar_reservas_expiradas

logger = logging.getLogger("mercado_viva.background")


async def bucle_liberador_reservas(intervalo_segundos: int = 60):
    """
    Worker asíncrono que corre periódicamente en segundo plano durante
    la vida de la aplicación FastAPI para limpiar carritos abandonados.
    """
    logger.info(f"Iniciando liberador de reservas de stock (intervalo: {intervalo_segundos}s)...")
    while True:
        try:
            db = SessionLocal()
            try:
                liberadas = liberar_reservas_expiradas(db)
                if liberadas > 0:
                    print(f"[RESERVAS] Se liberaron {liberadas} reserva(s) de stock expirada(s) automáticamente.")
            finally:
                db.close()
        except asyncio.CancelledError:
            print("[RESERVAS] Tarea en segundo plano detenida limpiamente.")
            break
        except Exception as e:
            print(f"[RESERVAS] Error en ciclo de liberación: {e}")

        await asyncio.sleep(intervalo_segundos)
