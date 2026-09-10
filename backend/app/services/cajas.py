from datetime import datetime, timezone
from decimal import Decimal
from sqlalchemy.orm import Session

from ..models.caja import Caja
from ..models.movimiento_caja import MovimientoCaja


def abrir_caja(cajero_id, saldo_inicial, db: Session):
    caja_abierta = db.query(Caja).filter(
        Caja.cajero_id == cajero_id,
        Caja.estado == "abierta"
    ).first()

    if caja_abierta:
        raise ValueError("El cajero ya tiene una caja abierta")

    if saldo_inicial < 0:
        raise ValueError("El saldo inicial no puede ser negativo")

    caja = Caja(
        cajero_id=cajero_id,
        saldo_inicial=saldo_inicial,
        saldo_final_esperado=saldo_inicial,
        estado="abierta"
    )

    db.add(caja)
    db.flush()

    movimiento = MovimientoCaja(
        caja_id=caja.id,
        tipo="apertura",
        monto=saldo_inicial,
        descripcion="Apertura de caja"
    )

    db.add(movimiento)
    db.commit()
    db.refresh(caja)

    return caja


def cerrar_caja(caja_id, saldo_final_real, db: Session):
    caja = db.query(Caja).filter(
        Caja.id == caja_id
    ).first()

    if not caja:
        raise ValueError("Caja no encontrada")

    if caja.estado != "abierta":
        raise ValueError("La caja ya está cerrada")

    if saldo_final_real < 0:
        raise ValueError("El saldo final no puede ser negativo")

    movimientos_venta = db.query(MovimientoCaja).filter(
        MovimientoCaja.caja_id == caja.id,
        MovimientoCaja.tipo == "venta"
    ).all()

    total_ventas = sum(
        movimiento.monto
        for movimiento in movimientos_venta
    )

    caja.saldo_final_esperado = (
        caja.saldo_inicial + total_ventas
    )

    saldo_final_real = Decimal(str(saldo_final_real))

    caja.saldo_final_real = saldo_final_real

    caja.diferencia = (
        saldo_final_real - caja.saldo_final_esperado
    )

    caja.estado = "cerrada"
    caja.cerrada_en = datetime.now(timezone.utc)

    movimiento = MovimientoCaja(
        caja_id=caja.id,
        tipo="cierre",
        monto=saldo_final_real,
        descripcion="Cierre de caja"
    )

    db.add(movimiento)
    db.commit()
    db.refresh(caja)

    return caja