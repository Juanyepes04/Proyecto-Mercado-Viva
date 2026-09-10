from datetime import datetime, timezone, timedelta

from sqlalchemy.orm import Session

from ..models.producto import Producto
from ..models.reserva_stock import ReservaStock


def crear_reserva(
    detalle_pedido_id,
    producto_id,
    cantidad,
    db: Session
):
    producto = db.query(Producto).filter(
        Producto.id == producto_id,
        Producto.activo == True
    ).first()

    if not producto:
        raise ValueError("Producto no encontrado")

    if cantidad <= 0:
        raise ValueError("La cantidad debe ser mayor que cero")

    if producto.stock_disponible < cantidad:
        raise ValueError(
            f"Stock insuficiente para: {producto.nombre}"
        )

    producto.stock_reservado += cantidad

    ahora = datetime.now(timezone.utc)
    expira_en = ahora + timedelta(minutes=15)

    reserva = ReservaStock(
        detalle_pedido_id=detalle_pedido_id,
        producto_id=producto_id,
        cantidad=cantidad,
        estado="activa",
        expira_en=expira_en
    )

    db.add(reserva)
    db.flush()

    return reserva