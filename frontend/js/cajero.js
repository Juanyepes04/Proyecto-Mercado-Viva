/* =========================================================
   MERCADO VIVA — Terminal POS (Cajero)
   Lógica de captura de venta, carrito, cobro y modo offline.
   Depende únicamente de la API del backend (FastAPI). No usa
   frontend/js/api.js porque este terminal necesita manejar su
   propia cola de reintentos cuando la tienda pierde conexión.
   ========================================================= */

(function () {
  "use strict";

  // -------------------------------------------------------
  // CONFIGURACIÓN
  // -------------------------------------------------------
  // Ajusta esta URL al desplegar el backend. Puede sobreescribirse
  // definiendo `window.MERCADO_VIVA_API_BASE` antes de cargar este script.
  const API_BASE = window.MERCADO_VIVA_API_BASE || "http://localhost:8000";

  const CLAVE_OFFLINE = "vivapos_pendientes_offline";
  const CLAVE_SESION = "vivapos_sesion_cajero";

  // Datos de respaldo si aún no existe un flujo de login que escriba
  // la sesión del cajero. Coinciden con backend/app/database/03_seed.sql.
  const SESION_DEMO = {
    cajero_id: "33333333-0000-0000-0000-000000000001",
    cajero_nombre: "Cajero Uno",
    caja_id: null, // se desconoce sin un endpoint de consulta; ver aviso en consola
    caja_numero: "1",
  };

  // -------------------------------------------------------
  // ESTADO
  // -------------------------------------------------------
  const estado = {
    productosPorCodigo: new Map(), // identificador -> producto
    productosPorId: new Map(), // id -> producto
    carrito: [], // { producto_id, identificador, nombre, cantidad, precio_unitario }
    seleccionIndex: null,
    bufferNumpad: "",
    metodoPago: null,
    sesion: null,
    cajaCerrada: false,
    pendientesOffline: [],
  };

  // -------------------------------------------------------
  // REFERENCIAS DOM
  // -------------------------------------------------------
  const el = {
    cajaNumero: document.getElementById("cajaNumero"),
    cajeroNombre: document.getElementById("cajeroNombre"),
    reloj: document.getElementById("reloj"),
    estadoConexionDot: document.getElementById("estadoConexion"),
    estadoConexionTexto: document.getElementById("estadoConexionTexto"),
    bloquePendientes: document.getElementById("bloquePendientes"),
    pendientesCount: document.getElementById("pendientesCount"),

    btnCerrarCaja: document.getElementById("btnCerrarCaja"),
    cierreCajaBar: document.getElementById("cierreCajaBar"),
    inputSaldoFinal: document.getElementById("inputSaldoFinal"),
    btnConfirmarCierre: document.getElementById("btnConfirmarCierre"),
    btnCancelarCierre: document.getElementById("btnCancelarCierre"),

    inputEscaneo: document.getElementById("inputEscaneo"),
    scanBar: document.querySelector(".scan-bar"),
    resultadosBusqueda: document.getElementById("resultadosBusqueda"),

    cartTableWrap: document.querySelector(".cart-table-wrap"),
    cuerpoCarrito: document.getElementById("cuerpoCarrito"),

    numpadValor: document.getElementById("numpadValor"),
    numpadGrid: document.querySelector(".numpad__grid"),
    btnAplicarNumpad: document.getElementById("btnAplicarNumpad"),

    totalSubtotal: document.getElementById("totalSubtotal"),
    totalIva: document.getElementById("totalIva"),
    totalDescuento: document.getElementById("totalDescuento"),
    totalGeneral: document.getElementById("totalGeneral"),

    metodoPagoOpciones: document.getElementById("metodoPagoOpciones"),

    inputTicketId: document.getElementById("inputTicketId"),
    btnValidarTicket: document.getElementById("btnValidarTicket"),
    devolucionesResultado: document.getElementById("devolucionesResultado"),

    mensajeEstado: document.getElementById("mensajeEstado"),
    btnCobrar: document.getElementById("btnCobrar"),
    btnCobrarTotal: document.getElementById("btnCobrarTotal"),
  };

  const formatoCOP = new Intl.NumberFormat("es-CO", {
    style: "currency",
    currency: "COP",
    maximumFractionDigits: 0,
  });

  function formatearMoneda(valor) {
    return formatoCOP.format(Number(valor) || 0);
  }

  function escaparHtml(texto) {
    const contenedor = document.createElement("span");
    contenedor.textContent = texto == null ? "" : String(texto);
    return contenedor.innerHTML;
  }

  // -------------------------------------------------------
  // INICIALIZACIÓN
  // -------------------------------------------------------
  function init() {
    cargarSesion();
    renderCajero();
    iniciarReloj();
    actualizarEstadoConexion();
    cargarPendientesOffline();
    cargarProductos();
    enlazarEventos();
    recalcularTotales();
    el.inputEscaneo.focus();
  }

  function cargarSesion() {
    try {
      const guardada = JSON.parse(sessionStorage.getItem(CLAVE_SESION) || "null");
      estado.sesion = guardada || SESION_DEMO;
    } catch (err) {
      estado.sesion = SESION_DEMO;
    }

    if (!estado.sesion.caja_id) {
      console.info(
        "[VIVA POS] No hay caja_id en la sesión: el backend aún no expone un " +
        "endpoint para consultar la caja abierta de un cajero. Define " +
        "sessionStorage['" + CLAVE_SESION + "'] desde login.js con { cajero_id, cajero_nombre, caja_id, caja_numero }."
      );
    }
  }

  function renderCajero() {
    el.cajaNumero.textContent = estado.sesion.caja_numero || "—";
    el.cajeroNombre.textContent = estado.sesion.cajero_nombre || "Cajero";
  }

  function iniciarReloj() {
    const actualizar = () => {
      el.reloj.textContent = new Date().toLocaleTimeString("es-CO", {
        hour: "2-digit",
        minute: "2-digit",
      });
    };
    actualizar();
    setInterval(actualizar, 15000);
  }

  // -------------------------------------------------------
  // CATÁLOGO DE PRODUCTOS
  // -------------------------------------------------------
  async function cargarProductos() {
    try {
      const respuesta = await fetch(`${API_BASE}/productos/`);
      if (!respuesta.ok) throw new Error("No se pudo cargar el catálogo");
      const lista = await respuesta.json();

      estado.productosPorCodigo.clear();
      estado.productosPorId.clear();

      lista.forEach((producto) => {
        estado.productosPorCodigo.set(producto.identificador, producto);
        estado.productosPorId.set(producto.id, producto);
      });
    } catch (err) {
      mostrarMensaje("No se pudo cargar el catálogo de productos. Verifica la conexión con el backend.", "error");
    }
  }

  function badgeStock(producto) {
    if (producto.stock_disponible <= 0) return { clase: "badge-stock--sin", texto: "Sin stock" };
    if (producto.stock_disponible <= (producto.stock_minimo || 0)) return { clase: "badge-stock--bajo", texto: `${producto.stock_disponible} disp.` };
    return { clase: "badge-stock--ok", texto: `${producto.stock_disponible} disp.` };
  }

  // -------------------------------------------------------
  // ESCANEO Y BÚSQUEDA
  // -------------------------------------------------------
  function manejarEnterEscaneo(codigo) {
    const valor = codigo.trim();
    if (!valor) return;

    const producto = estado.productosPorCodigo.get(valor);

    if (!producto) {
      flashScanBarError();
      mostrarMensaje("Código de barras no asignado a la sucursal.", "error");
      return;
    }

    agregarAlCarrito(producto, 1);
    limpiarEscaneo();
  }

  function limpiarEscaneo() {
    el.inputEscaneo.value = "";
    ocultarResultados();
  }

  function flashScanBarError() {
    el.scanBar.classList.add("is-error");
    setTimeout(() => el.scanBar.classList.remove("is-error"), 400);
  }

  function manejarEscritura(texto) {
    const consulta = texto.trim().toLowerCase();

    if (consulta.length < 2) {
      ocultarResultados();
      return;
    }

    const coincidencias = [];
    for (const producto of estado.productosPorId.values()) {
      if (!producto.activo) continue;
      if (
        producto.nombre.toLowerCase().includes(consulta) ||
        producto.identificador.toLowerCase().includes(consulta)
      ) {
        coincidencias.push(producto);
      }
      if (coincidencias.length >= 6) break;
    }

    renderResultadosBusqueda(coincidencias);
  }

  function renderResultadosBusqueda(productos) {
    if (productos.length === 0) {
      ocultarResultados();
      return;
    }

    el.resultadosBusqueda.innerHTML = productos
      .map((producto) => {
        const stock = badgeStock(producto);
        return `
          <li class="search-results__item" data-producto-id="${producto.id}">
            <span class="search-results__nombre">${escaparHtml(producto.nombre)}</span>
            <span class="search-results__meta">
              <span class="badge-stock ${stock.clase}">${stock.texto}</span>
              <span>${formatearMoneda(producto.valor)}</span>
            </span>
          </li>
        `;
      })
      .join("");

    el.resultadosBusqueda.hidden = false;
  }

  function ocultarResultados() {
    el.resultadosBusqueda.hidden = true;
    el.resultadosBusqueda.innerHTML = "";
  }

  // -------------------------------------------------------
  // CARRITO
  // -------------------------------------------------------
  function agregarAlCarrito(producto, cantidad) {
    if (!producto.activo || producto.stock_disponible <= 0) {
      mostrarMensaje(`"${producto.nombre}" no tiene stock disponible.`, "aviso");
      return;
    }

    const indiceExistente = estado.carrito.findIndex((linea) => linea.producto_id === producto.id);

    if (indiceExistente >= 0) {
      const linea = estado.carrito[indiceExistente];
      const nuevaCantidad = Math.min(linea.cantidad + cantidad, producto.stock_disponible);
      linea.cantidad = nuevaCantidad;
      estado.seleccionIndex = indiceExistente;
    } else {
      estado.carrito.push({
        producto_id: producto.id,
        identificador: producto.identificador,
        nombre: producto.nombre,
        cantidad: Math.min(cantidad, producto.stock_disponible),
        precio_unitario: Number(producto.valor),
      });
      estado.seleccionIndex = estado.carrito.length - 1;
    }

    renderCarrito({ flashIndex: estado.seleccionIndex, flashTipo: "added" });
  }

  function eliminarLinea(indice) {
    estado.carrito.splice(indice, 1);
    if (estado.seleccionIndex === indice) estado.seleccionIndex = null;
    renderCarrito();
  }

  function seleccionarLinea(indice) {
    estado.seleccionIndex = indice;
    renderCarrito();
  }

  function renderCarrito(opciones) {
    const flashIndex = opciones && opciones.flashIndex;
    const flashTipo = opciones && opciones.flashTipo;

    el.cartTableWrap.classList.toggle("is-empty", estado.carrito.length === 0);

    el.cuerpoCarrito.innerHTML = estado.carrito
      .map((linea, indice) => {
        const subtotal = linea.cantidad * linea.precio_unitario;
        const seleccionada = indice === estado.seleccionIndex;
        const flashClase =
          indice === flashIndex
            ? flashTipo === "added"
              ? "is-flash-added"
              : "is-flash-error"
            : "";

        return `
          <tr data-indice="${indice}" class="${seleccionada ? "is-selected" : ""} ${flashClase}">
            <td class="col-sku">${escaparHtml(linea.identificador)}</td>
            <td class="col-nombre">${escaparHtml(linea.nombre)}</td>
            <td class="num col-cifra">${linea.cantidad}</td>
            <td class="num col-cifra">${formatearMoneda(linea.precio_unitario)}</td>
            <td class="num col-cifra">${formatearMoneda(subtotal)}</td>
            <td class="col-accion">
              <button type="button" class="btn-eliminar-linea" data-eliminar="${indice}" title="Quitar línea">×</button>
            </td>
          </tr>
        `;
      })
      .join("");

    recalcularTotales();
  }

  function recalcularTotales() {
    const subtotal = estado.carrito.reduce((suma, linea) => suma + linea.cantidad * linea.precio_unitario, 0);
    const ivaIncluido = subtotal - subtotal / 1.19;
    const descuento = 0;
    const total = subtotal - descuento;

    el.totalSubtotal.textContent = formatearMoneda(subtotal);
    el.totalIva.textContent = formatearMoneda(ivaIncluido);
    el.totalDescuento.textContent = formatearMoneda(descuento);
    el.totalGeneral.textContent = formatearMoneda(total);
    el.btnCobrarTotal.textContent = formatearMoneda(total);

    const puedeCobrar = estado.carrito.length > 0 && !!estado.metodoPago && !estado.cajaCerrada;
    el.btnCobrar.disabled = !puedeCobrar;
  }

  // -------------------------------------------------------
  // TECLADO NUMÉRICO (edita la cantidad de la línea seleccionada)
  // -------------------------------------------------------
  function manejarTeclaNumpad(tecla) {
    if (tecla === "C") {
      estado.bufferNumpad = "";
    } else if (tecla === "back") {
      estado.bufferNumpad = estado.bufferNumpad.slice(0, -1);
    } else if (estado.bufferNumpad.length < 4) {
      estado.bufferNumpad += tecla;
    }

    el.numpadValor.textContent = estado.bufferNumpad || "0";
  }

  function aplicarNumpad() {
    let indice = estado.seleccionIndex;
    if (indice === null && estado.carrito.length > 0) {
      indice = estado.carrito.length - 1;
    }
    if (indice === null || !estado.carrito[indice]) {
      mostrarMensaje("Selecciona una línea del carrito para editar la cantidad.", "aviso");
      return;
    }

    const nuevaCantidad = parseInt(estado.bufferNumpad, 10);
    if (!nuevaCantidad || nuevaCantidad <= 0) {
      mostrarMensaje("Ingresa una cantidad mayor a cero.", "aviso");
      return;
    }

    const linea = estado.carrito[indice];
    const producto = estado.productosPorId.get(linea.producto_id);
    const tope = producto ? producto.stock_disponible : nuevaCantidad;

    linea.cantidad = Math.min(nuevaCantidad, tope);
    if (nuevaCantidad > tope) {
      mostrarMensaje(`Solo hay ${tope} unidades disponibles de "${linea.nombre}".`, "aviso");
    }

    estado.bufferNumpad = "";
    el.numpadValor.textContent = "0";
    renderCarrito();
    el.inputEscaneo.focus();
  }

  // -------------------------------------------------------
  // MÉTODO DE PAGO
  // -------------------------------------------------------
  function seleccionarMetodoPago(boton) {
    document.querySelectorAll(".metodo-btn").forEach((b) => b.classList.remove("is-active"));
    boton.classList.add("is-active");
    estado.metodoPago = boton.dataset.metodo;
    recalcularTotales();
  }

  // -------------------------------------------------------
  // COBRO
  // -------------------------------------------------------
  async function procesarCobro() {
    if (estado.carrito.length === 0) return;
    if (!estado.metodoPago) {
      mostrarMensaje("Selecciona un método de pago antes de cobrar.", "aviso");
      return;
    }
    if (estado.cajaCerrada) {
      mostrarMensaje("La caja está cerrada. Abre una nueva caja para seguir vendiendo.", "error");
      return;
    }

    const payload = {
      cajero_id: estado.sesion.cajero_id,
      caja_id: estado.sesion.caja_id,
      canal: "pos",
      detalles: estado.carrito.map((linea) => ({
        producto_id: linea.producto_id,
        cantidad: linea.cantidad,
      })),
    };

    el.btnCobrar.disabled = true;
    const textoOriginal = el.btnCobrar.querySelector("span").textContent;
    el.btnCobrar.querySelector("span").textContent = "Procesando…";

    try {
      if (!navigator.onLine) {
        encolarOffline(payload);
        mostrarMensaje("Sin conexión: la venta quedó guardada y se sincronizará automáticamente.", "aviso");
        limpiarVentaActual();
        return;
      }

      const respuestaPedido = await fetch(`${API_BASE}/pedidos/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!respuestaPedido.ok) {
        const detalle = await respuestaPedido.json().catch(() => ({}));
        throw new Error(detalle.detail || "No se pudo crear el pedido.");
      }

      const pedido = await respuestaPedido.json();

      const respuestaConfirmar = await fetch(`${API_BASE}/pedidos/${pedido.id}/confirmar`, {
        method: "POST",
      });

      if (!respuestaConfirmar.ok) {
        const detalle = await respuestaConfirmar.json().catch(() => ({}));
        throw new Error(detalle.detail || "No se pudo confirmar el pago.");
      }

      mostrarMensaje(`Venta ${pedido.id.slice(0, 8)} registrada correctamente.`, "exito");
      limpiarVentaActual();
      cargarProductos(); // refresca stock disponible
    } catch (err) {
      if (!navigator.onLine) {
        encolarOffline(payload);
        mostrarMensaje("Sin conexión: la venta quedó guardada y se sincronizará automáticamente.", "aviso");
        limpiarVentaActual();
      } else {
        mostrarMensaje(err.message, "error");
      }
    } finally {
      el.btnCobrar.querySelector("span").textContent = textoOriginal;
      recalcularTotales();
    }
  }

  function limpiarVentaActual() {
    estado.carrito = [];
    estado.seleccionIndex = null;
    estado.metodoPago = null;
    document.querySelectorAll(".metodo-btn").forEach((b) => b.classList.remove("is-active"));
    renderCarrito();
    el.inputEscaneo.focus();
  }

  // -------------------------------------------------------
  // MODO OFFLINE — cola local (Restricción 1: operación continua)
  // -------------------------------------------------------
  function cargarPendientesOffline() {
    try {
      estado.pendientesOffline = JSON.parse(localStorage.getItem(CLAVE_OFFLINE) || "[]");
    } catch (err) {
      estado.pendientesOffline = [];
    }
    renderPendientesOffline();
  }

  function guardarPendientesOffline() {
    localStorage.setItem(CLAVE_OFFLINE, JSON.stringify(estado.pendientesOffline));
    renderPendientesOffline();
  }

  function encolarOffline(payload) {
    estado.pendientesOffline.push({ payload, creado_en: new Date().toISOString() });
    guardarPendientesOffline();
  }

  function renderPendientesOffline() {
    const cantidad = estado.pendientesOffline.length;
    el.bloquePendientes.hidden = cantidad === 0;
    el.pendientesCount.textContent = String(cantidad);
  }

  async function sincronizarPendientes() {
    if (estado.pendientesOffline.length === 0 || !navigator.onLine) return;

    const restantes = [];

    for (const pendiente of estado.pendientesOffline) {
      try {
        const respuesta = await fetch(`${API_BASE}/pedidos/`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(pendiente.payload),
        });
        if (!respuesta.ok) throw new Error("rechazado por el servidor");
        const pedido = await respuesta.json();
        await fetch(`${API_BASE}/pedidos/${pedido.id}/confirmar`, { method: "POST" });
      } catch (err) {
        restantes.push(pendiente);
      }
    }

    estado.pendientesOffline = restantes;
    guardarPendientesOffline();

    if (restantes.length === 0) {
      mostrarMensaje("Ventas pendientes sincronizadas correctamente.", "exito");
    }
  }

  // -------------------------------------------------------
  // ESTADO DE CONEXIÓN
  // -------------------------------------------------------
  function actualizarEstadoConexion() {
    const enLinea = navigator.onLine;
    el.estadoConexionDot.dataset.state = enLinea ? "online" : "offline";
    el.estadoConexionTexto.textContent = enLinea ? "Conectado" : "Sin conexión";
  }

  // -------------------------------------------------------
  // CIERRE DE CAJA
  // -------------------------------------------------------
  function abrirBarraCierre() {
    el.cierreCajaBar.hidden = false;
    el.inputSaldoFinal.value = "";
    el.inputSaldoFinal.focus();
  }

  function cerrarBarraCierre() {
    el.cierreCajaBar.hidden = true;
  }

  async function confirmarCierreCaja() {
    if (!estado.sesion.caja_id) {
      mostrarMensaje("No hay una caja_id registrada en esta sesión para cerrar.", "error");
      return;
    }

    const saldoFinalReal = parseFloat(el.inputSaldoFinal.value);
    if (isNaN(saldoFinalReal) || saldoFinalReal < 0) {
      mostrarMensaje("Ingresa un saldo final válido.", "aviso");
      return;
    }

    try {
      const respuesta = await fetch(`${API_BASE}/cajas/${estado.sesion.caja_id}/cerrar`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ saldo_final_real: saldoFinalReal }),
      });

      if (!respuesta.ok) {
        const detalle = await respuesta.json().catch(() => ({}));
        throw new Error(detalle.detail || "No se pudo cerrar la caja.");
      }

      const caja = await respuesta.json();
      estado.cajaCerrada = true;
      cerrarBarraCierre();
      recalcularTotales();
      mostrarMensaje(
        `Caja cerrada. Diferencia: ${formatearMoneda(caja.diferencia)}.`,
        Number(caja.diferencia) === 0 ? "exito" : "aviso"
      );
    } catch (err) {
      mostrarMensaje(err.message, "error");
    }
  }

  // -------------------------------------------------------
  // DEVOLUCIONES / VALIDAR TICKET
  // -------------------------------------------------------
  async function validarTicket() {
    const idPedido = el.inputTicketId.value.trim();
    if (!idPedido) return;

    try {
      const respuesta = await fetch(`${API_BASE}/pedidos/${idPedido}`);
      if (!respuesta.ok) throw new Error("Ticket no encontrado.");

      const pedido = await respuesta.json();
      el.devolucionesResultado.hidden = false;
      el.devolucionesResultado.classList.remove("es-error");
      el.devolucionesResultado.classList.add("es-exito");
      el.devolucionesResultado.textContent =
        `Pedido ${pedido.canal.toUpperCase()} · estado: ${pedido.estado} · total: ${formatearMoneda(pedido.total)}. ` +
        `Registro de devolución pendiente de habilitar en el backend.`;
    } catch (err) {
      el.devolucionesResultado.hidden = false;
      el.devolucionesResultado.classList.remove("es-exito");
      el.devolucionesResultado.classList.add("es-error");
      el.devolucionesResultado.textContent = err.message;
    }
  }

  // -------------------------------------------------------
  // MENSAJES DE ESTADO
  // -------------------------------------------------------
  let temporizadorMensaje = null;

  function mostrarMensaje(texto, tipo) {
    el.mensajeEstado.hidden = false;
    el.mensajeEstado.textContent = texto;
    el.mensajeEstado.classList.remove("es-error", "es-exito", "es-aviso");
    if (tipo) el.mensajeEstado.classList.add(`es-${tipo}`);

    clearTimeout(temporizadorMensaje);
    temporizadorMensaje = setTimeout(() => {
      el.mensajeEstado.hidden = true;
    }, 5000);
  }

  // -------------------------------------------------------
  // EVENTOS
  // -------------------------------------------------------
  function enlazarEventos() {
    el.inputEscaneo.addEventListener("keydown", (e) => {
      if (e.key === "Enter") {
        e.preventDefault();
        e.stopPropagation();
        manejarEnterEscaneo(el.inputEscaneo.value);
      } else if (e.key === "Escape") {
        limpiarEscaneo();
      }
    });

    el.inputEscaneo.addEventListener("input", (e) => manejarEscritura(e.target.value));

    el.resultadosBusqueda.addEventListener("click", (e) => {
      const item = e.target.closest(".search-results__item");
      if (!item) return;
      const producto = estado.productosPorId.get(item.dataset.productoId);
      if (producto) agregarAlCarrito(producto, 1);
      limpiarEscaneo();
    });

    el.cuerpoCarrito.addEventListener("click", (e) => {
      const botonEliminar = e.target.closest("[data-eliminar]");
      if (botonEliminar) {
        eliminarLinea(Number(botonEliminar.dataset.eliminar));
        return;
      }
      const fila = e.target.closest("tr[data-indice]");
      if (fila) seleccionarLinea(Number(fila.dataset.indice));
    });

    el.numpadGrid.addEventListener("click", (e) => {
      const boton = e.target.closest(".numpad__key");
      if (boton) manejarTeclaNumpad(boton.dataset.key);
    });

    el.btnAplicarNumpad.addEventListener("click", aplicarNumpad);

    el.metodoPagoOpciones.addEventListener("click", (e) => {
      const boton = e.target.closest(".metodo-btn");
      if (boton) seleccionarMetodoPago(boton);
    });

    el.btnCobrar.addEventListener("click", procesarCobro);

    el.btnValidarTicket.addEventListener("click", validarTicket);
    el.inputTicketId.addEventListener("keydown", (e) => {
      if (e.key === "Enter") validarTicket();
    });

    el.btnCerrarCaja.addEventListener("click", abrirBarraCierre);
    el.btnCancelarCierre.addEventListener("click", cerrarBarraCierre);
    el.btnConfirmarCierre.addEventListener("click", confirmarCierreCaja);

    window.addEventListener("online", () => {
      actualizarEstadoConexion();
      sincronizarPendientes();
    });
    window.addEventListener("offline", actualizarEstadoConexion);

    document.addEventListener("keydown", (e) => {
      if (e.key === "F2") {
        e.preventDefault();
        el.inputEscaneo.focus();
        el.inputEscaneo.select();
      } else if (e.key === "F8") {
        e.preventDefault();
        el.inputTicketId.focus();
      } else if (e.key === "Enter" && document.activeElement !== el.inputEscaneo && document.activeElement !== el.inputTicketId) {
        if (!el.btnCobrar.disabled) procesarCobro();
      }
    });
  }

  document.addEventListener("DOMContentLoaded", init);
})();