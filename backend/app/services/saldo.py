from sqlalchemy.orm import Session

from ..models.usuario import Usuario
from ..models.historial_saldo import HistorialSaldo


def descontar_saldo(
    usuario_id,
    monto,
    pedido_id,
    db: Session
):
    usuario = db.query(Usuario).filter(
        Usuario.id == usuario_id,
        Usuario.activo == True
    ).first()

    if not usuario:
        raise ValueError("Usuario no encontrado")

    if monto <= 0:
        raise ValueError("El monto debe ser mayor que cero")

    if usuario.saldo_simulado < monto:
        raise ValueError("Saldo insuficiente")

    usuario.saldo_simulado -= monto

    movimiento = HistorialSaldo(
        usuario_id=usuario.id,
        tipo="compra",
        monto=-monto,
        saldo_resultante=usuario.saldo_simulado,
        pedido_id=pedido_id
    )

    db.add(movimiento)
    db.flush()

    return usuario