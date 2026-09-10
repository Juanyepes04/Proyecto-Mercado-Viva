from sqlalchemy.orm import Session

from ..models.pedido import Pedido
from ..models.detalle_pedido import DetallePedido
from ..models.producto import Producto
from ..schemas.pedido import PedidoCrear
from .reservas_stock import crear_reserva


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
            db.flush()

            crear_reserva(
                detalle_pedido_id=nuevo_detalle.id,
                producto_id=producto.id,
                cantidad=detalle.cantidad,
                db=db
            )

        pedido.total = total

        db.commit()
        db.refresh(pedido)

        return pedido

    except Exception:
        db.rollback()
        raise

def listar_pedidos(db: Session):
    return db.query(Pedido).order_by(
        Pedido.creado_en.desc()
    ).all()


def buscar_pedido(pedido_id, db: Session):
    return db.query(Pedido).filter(
        Pedido.id == pedido_id
    ).first()