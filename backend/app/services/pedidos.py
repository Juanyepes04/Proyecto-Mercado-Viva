from sqlalchemy.orm import Session

from ..models.pedido import Pedido
from ..models.detalle_pedido import DetallePedido
from ..models.producto import Producto
from ..schemas.pedido import PedidoCrear


def crear_pedido(datos: PedidoCrear, db: Session):
    total = 0

    try:
        pedido = Pedido(
            usuario_id=datos.usuario_id,
            canal=datos.canal,
            estado="pendiente",
            total=0
        )

        db.add(pedido)
        db.flush()

        for detalle in datos.detalles:

            producto = db.query(Producto).filter(
                Producto.id == detalle.producto_id,
                Producto.activo == True
            ).first()

            if not producto:
                raise ValueError(
                    f"Producto no encontrado: {detalle.producto_id}"
                )

            if detalle.cantidad <= 0:
                raise ValueError(
                    "La cantidad debe ser mayor que cero"
                )

            if producto.stock_disponible < detalle.cantidad:
                raise ValueError(
                    f"Stock insuficiente para: {producto.nombre}"
                )

            subtotal = producto.valor * detalle.cantidad
            total += subtotal

            nuevo_detalle = DetallePedido(
                pedido_id=pedido.id,
                producto_id=producto.id,
                cantidad=detalle.cantidad,
                precio_unitario=producto.valor
            )

            db.add(nuevo_detalle)

        pedido.total = total

        db.commit()
        db.refresh(pedido)

        return pedido

    except Exception:
        db.rollback()
        raise