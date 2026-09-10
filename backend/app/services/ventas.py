from sqlalchemy.orm import Session

from ..models.producto import Producto
from ..models.pedido import Pedido
from ..models.detalle_pedido import DetallePedido
from ..models.reserva_stock import ReservaStock
from ..models.movimiento_inventario import MovimientoInventario


def confirmar_pedido(pedido_id, db: Session):
    pedido = db.query(Pedido).filter(
        Pedido.id == pedido_id
    ).first()

    if not pedido:
        raise ValueError("Pedido no encontrado")

    if pedido.estado != "pendiente":
        raise ValueError(
            "El pedido no está pendiente"
        )

    detalles = db.query(DetallePedido).filter(
        DetallePedido.pedido_id == pedido.id
    ).all()

    if not detalles:
        raise ValueError(
            "El pedido no tiene detalles"
        )

    try:
        for detalle in detalles:

            producto = db.query(Producto).filter(
                Producto.id == detalle.producto_id
            ).first()

            if not producto:
                raise ValueError(
                    f"Producto no encontrado: {detalle.producto_id}"
                )

            reserva = db.query(ReservaStock).filter(
                ReservaStock.detalle_pedido_id == detalle.id,
                ReservaStock.estado == "activa"
            ).first()

            if not reserva:
                raise ValueError(
                    f"No existe una reserva activa para "
                    f"el producto {producto.nombre}"
                )

            if producto.stock_actual < detalle.cantidad:
                raise ValueError(
                    f"Stock insuficiente para completar: "
                    f"{producto.nombre}"
                )

            # La venta consume físicamente las unidades.
            producto.stock_actual -= detalle.cantidad

            # Se liberan las unidades que estaban reservadas.
            producto.stock_reservado -= detalle.cantidad

            # Confirmamos la reserva.
            reserva.estado = "confirmada"

            # Registramos el movimiento de inventario.
            tipo_movimiento = (
                "salida_web"
                if pedido.canal == "web"
                else "salida_pos"
            )

            movimiento = MovimientoInventario(
                producto_id=producto.id,
                tipo=tipo_movimiento,
                cantidad=detalle.cantidad,
                stock_resultante=producto.stock_actual,
                usuario_id=pedido.usuario_id,
                referencia_pedido_id=pedido.id,
                referencia_reserva_id=reserva.id
            )

            db.add(movimiento)

        pedido.estado = "pagado"

        db.commit()
        db.refresh(pedido)

        return pedido

    except Exception:
        db.rollback()
        raise