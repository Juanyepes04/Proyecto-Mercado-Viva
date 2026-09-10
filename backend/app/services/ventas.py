from sqlalchemy.orm import Session

from ..models.producto import Producto
from ..models.pedido import Pedido
from ..models.detalle_pedido import DetallePedido
from ..models.reserva_stock import ReservaStock
from ..models.movimiento_inventario import MovimientoInventario
from .saldo import descontar_saldo
from ..models.caja import Caja
from ..models.movimiento_caja import MovimientoCaja


def confirmar_pedido(pedido_id, db: Session):
    pedido = db.query(Pedido).filter(
        Pedido.id == pedido_id
    ).first()

    if not pedido:
        raise ValueError("Pedido no encontrado")

    if pedido.estado != "pendiente":
        raise ValueError("El pedido no está pendiente")

    detalles = db.query(DetallePedido).filter(
        DetallePedido.pedido_id == pedido.id
    ).all()

    if not detalles:
        raise ValueError("El pedido no tiene detalles")

    try:
        # Las compras por web se cobran con el saldo simulado.
        if pedido.canal == "web":
            descontar_saldo(
                usuario_id=pedido.usuario_id,
                monto=pedido.total,
                pedido_id=pedido.id,
                db=db
            )

        if pedido.canal == "pos":
            if not pedido.cajero_id:
                raise ValueError("La venta POS necesita un cajero")

            if not pedido.caja_id:
                raise ValueError("La venta POS necesita una caja")

            caja = db.query(Caja).filter(
                Caja.id == pedido.caja_id,
                Caja.cajero_id == pedido.cajero_id,
                Caja.estado == "abierta"
            ).first()

            if not caja:
                raise ValueError("La caja no está abierta o no pertenece al cajero")

            movimiento_caja = MovimientoCaja(
                caja_id=caja.id,
                tipo="venta",
                monto=pedido.total,
                pedido_id=pedido.id,
                descripcion="Venta POS"
            )

            db.add(movimiento_caja)
            db.flush()

        for detalle in detalles:

            producto = db.query(Producto).filter(
                Producto.id == detalle.producto_id,
                Producto.activo == True
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

            producto.stock_actual -= detalle.cantidad
            producto.stock_reservado -= detalle.cantidad

            reserva.estado = "confirmada"

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

