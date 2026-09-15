/* ==========================================================
   Mercado VIVA — Tienda Web (Cliente)
   Totalmente conectada a la API real de FastAPI y Supabase.
   ========================================================== */

(() => {
  "use strict";

  const ICONOS_DEFAULT = {
    bebidas: '<svg class="icon" viewBox="0 0 20 20" aria-hidden="true"><path d="M8 2h4v3.2l1.6 2.3c.3.4.4.9.4 1.4V16a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2V8.9c0-.5.1-1 .4-1.4L10 5.2"/><path d="M6.5 12h7"/></svg>',
    snacks: '<svg class="icon" viewBox="0 0 20 20" aria-hidden="true"><path d="M6 6 8 2h4l2 4"/><path d="M5 6h10l1 10a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2L5 6Z"/></svg>',
    aseo: '<svg class="icon" viewBox="0 0 20 20" aria-hidden="true"><path d="M9 2h3v3H9z"/><path d="M8 5h5l1.5 2H6.5L8 5Z"/><path d="M7 7h6v9a2 2 0 0 1-2 2H9a2 2 0 0 1-2-2V7Z"/></svg>',
    lacteos: '<svg class="icon" viewBox="0 0 20 20" aria-hidden="true"><path d="M8 2h4l1 3.2v10a2 2 0 0 1-2 2H9a2 2 0 0 1-2-2v-10L8 2Z"/><path d="M7 9h6"/></svg>',
    panaderia: '<svg class="icon" viewBox="0 0 20 20" aria-hidden="true"><path d="M3 12c0-4 3-8 7-8s7 4 7 8-3 4-7 4-7 0-7-4Z"/><path d="M7 9.5v3M10 8.5v4M13 9.5v3"/></svg>',
  };

  const SUCURSALES = [
    { id: "centro", nombre: "Sucursal Centro", estado: "Stock sincronizado" },
    { id: "norte", nombre: "Sucursal Norte", estado: "Stock sincronizado" },
    { id: "poblado", nombre: "Sucursal El Poblado", estado: "Sincronizando" }
  ];

  const UMBRAL_POCAS_UNIDADES = 5;
  const DURACION_RESERVA_SEGUNDOS = 15 * 60; // 15 minutos exactos como en el backend

  // --------------------------------------------------------
  // Estado de la Aplicación
  // --------------------------------------------------------
  let categorias = [];
  let productos = [];
  let usuarioActual = null;
  let carrito = {}; // { [productoId]: cantidad }
  let pedidoActual = null; // Guardará la respuesta de POST /pedidos/
  let reservaIntervalId = null;
  let reservaSegundos = DURACION_RESERVA_SEGUNDOS;

  // --------------------------------------------------------
  // Utilidades y Notificaciones
  // --------------------------------------------------------
  function formatearPrecio(valor) {
    return new Intl.NumberFormat("es-CO", {
      style: "currency",
      currency: "COP",
      maximumFractionDigits: 0,
    }).format(valor || 0);
  }

  function mostrarToast(mensaje, tipo = "info") {
    const contenedor = document.getElementById("toastContenedor");
    if (!contenedor) return;

    const toast = document.createElement("div");
    toast.className = `toast toast--${tipo}`;
    toast.textContent = mensaje;

    contenedor.appendChild(toast);
    setTimeout(() => {
      toast.style.opacity = "0";
      toast.style.transform = "translateY(8px)";
      toast.style.transition = "all 200ms ease";
      setTimeout(() => toast.remove(), 250);
    }, 3500);
  }

  function imagenProducto(p) {
    if (p.foto_url && p.foto_url.trim()) return p.foto_url;
    return `https://placehold.co/300x300/f4f4f5/52525b?text=${encodeURIComponent(p.nombre)}`;
  }

  function obtenerIconoCategoria(nombre) {
    const key = (nombre || "").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
    for (const [k, icon] of Object.entries(ICONOS_DEFAULT)) {
      if (key.includes(k)) return icon;
    }
    return '<svg class="icon" viewBox="0 0 20 20" aria-hidden="true"><circle cx="10" cy="10" r="8"/><path d="M10 6v8M6 10h8"/></svg>';
  }

  // --------------------------------------------------------
  // Gestión de Usuario, Autenticación y Saldo
  // --------------------------------------------------------
  async function cargarUsuario() {
    try {
      const stored = localStorage.getItem("viva_usuario");
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed && parsed.rol === "cliente") {
          usuarioActual = parsed;
        }
      }

      if (usuarioActual && usuarioActual.id) {
        // Refrescar saldo del usuario desde el backend
        try {
          const actualizado = await vivaApiRequest(`/usuarios/${usuarioActual.id}`);
          if (actualizado) {
            usuarioActual = actualizado;
            localStorage.setItem("viva_usuario", JSON.stringify(actualizado));
          }
        } catch (_) {
          // Si el endpoint de refresh falla temporalmente, mantenemos la sesión en localStorage
        }
      }

      actualizarUsuarioUI();
    } catch (err) {
      console.warn("No se pudo sincronizar usuario:", err);
      usuarioActual = null;
      actualizarUsuarioUI();
    }
  }

  function actualizarUsuarioUI() {
    const elNombre = document.getElementById("usuarioNombre");
    const elSaldo = document.getElementById("usuarioSaldo");
    const elPagoSaldo = document.getElementById("pagoSaldoDisponible");
    const btnLogin = document.getElementById("btnAbrirLoginCliente");
    const badge = document.getElementById("usuarioBadge");

    if (usuarioActual && usuarioActual.id) {
      if (btnLogin) btnLogin.hidden = true;
      if (badge) badge.hidden = false;
      if (elNombre) elNombre.textContent = usuarioActual.nombre || usuarioActual.nombre_usuario;
      const saldoTexto = formatearPrecio(usuarioActual.saldo_simulado || 0);
      if (elSaldo) elSaldo.textContent = saldoTexto;
      if (elPagoSaldo) elPagoSaldo.textContent = saldoTexto;
    } else {
      if (btnLogin) btnLogin.hidden = false;
      if (badge) badge.hidden = true;
      if (elNombre) elNombre.textContent = "Invitado";
      if (elSaldo) elSaldo.textContent = "$0";
      if (elPagoSaldo) elPagoSaldo.textContent = "$0";
    }
  }

  function abrirModalLoginCliente() {
    const modal = document.getElementById("modalLoginCliente");
    const errBox = document.getElementById("loginClienteError");
    if (errBox) errBox.hidden = true;
    if (modal) modal.hidden = false;
    const inputUser = document.getElementById("inputLoginUsuario");
    if (inputUser) inputUser.focus();
  }

  function cerrarModalLoginCliente() {
    const modal = document.getElementById("modalLoginCliente");
    if (modal) modal.hidden = true;
  }

  async function procesarLoginCliente(evento) {
    evento.preventDefault();
    const errBox = document.getElementById("loginClienteError");
    const btnSubmit = document.getElementById("btnEnviarLoginCliente");
    const inputUser = document.getElementById("inputLoginUsuario");
    const inputPass = document.getElementById("inputLoginPassword");

    if (errBox) errBox.hidden = true;

    const nombre_usuario = inputUser.value.trim();
    const contrasena = inputPass.value;

    if (!nombre_usuario || !contrasena) {
      if (errBox) {
        errBox.textContent = "Por favor ingresa usuario y contraseña.";
        errBox.hidden = false;
      }
      return;
    }

    const prevLabel = btnSubmit.textContent;
    btnSubmit.disabled = true;
    btnSubmit.textContent = "Validando...";

    try {
      const res = await fetch("/api/v1/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nombre_usuario, contrasena }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.detail || "Credenciales incorrectas");
      }

      // Si es un empleado intentando entrar por el storefront público
      if (data.rol !== "cliente") {
        mostrarToast(`Bienvenido ${data.usuario.nombre}. Redirigiendo a tu portal de ${data.rol}...`, "info");
        localStorage.setItem("viva_token", data.access_token);
        localStorage.setItem("viva_usuario", JSON.stringify(data.usuario));
        setTimeout(() => {
          if (data.rol === "cajero") window.location.href = "/sistema/caja";
          else if (data.rol === "abastecedor") window.location.href = "/sistema/inventario";
          else window.location.href = "/sistema/admin";
        }, 1200);
        return;
      }

      // Guardar sesión de cliente
      localStorage.setItem("viva_token", data.access_token);
      localStorage.setItem("viva_usuario", JSON.stringify(data.usuario));
      usuarioActual = data.usuario;

      actualizarUsuarioUI();
      cerrarModalLoginCliente();
      mostrarToast(`¡Bienvenido, ${usuarioActual.nombre || usuarioActual.nombre_usuario}!`, "success");

      // Si el carrito tiene productos y el usuario estaba a punto de pagar
      const tieneItems = Object.values(carrito).some(q => q > 0);
      if (tieneItems && document.getElementById("carritoDrawer").getAttribute("aria-hidden") === "false") {
        iniciarCheckout();
      }
    } catch (err) {
      if (errBox) {
        errBox.textContent = err.message;
        errBox.hidden = false;
      }
    } finally {
      btnSubmit.disabled = false;
      btnSubmit.textContent = prevLabel;
    }
  }

  async function cerrarSesionCliente() {
    try {
      await fetch("/api/v1/auth/logout", { method: "POST" });
    } catch (_) {}
    localStorage.removeItem("viva_token");
    localStorage.removeItem("viva_usuario");
    usuarioActual = null;
    actualizarUsuarioUI();
    mostrarToast("Sesión cerrada correctamente", "info");
  }

  // --------------------------------------------------------
  // Carga de Datos desde la API (Categorías y Productos)
  // --------------------------------------------------------
  async function cargarDatos() {
    const contenedor = document.getElementById("secciones");
    if (contenedor) {
      contenedor.innerHTML = '<div class="catalogo-cargando">Cargando productos en tiempo real desde la tienda...</div>';
    }

    try {
      const [catsRes, prodsRes] = await Promise.all([
        vivaApiRequest("/categorias/"),
        vivaApiRequest("/productos/"),
      ]);

      categorias = catsRes || [];
      productos = (prodsRes || []).map((p) => ({
        id: p.id,
        identificador: p.identificador,
        nombre: p.nombre,
        categoriaId: p.categoria_id,
        precio: Number(p.valor || 0),
        foto_url: p.foto_url,
        stock_actual: p.stock_actual,
        stock_reservado: p.stock_reservado || 0,
        stock_disponible:
          p.stock_disponible !== undefined && p.stock_disponible !== null
            ? p.stock_disponible
            : Math.max(0, p.stock_actual - (p.stock_reservado || 0)),
        stock_minimo: p.stock_minimo,
        marca: "Mercado VIVA",
        presentacion: "Unidad",
      }));

      renderCategoriaNav();
      renderCatalogo();
    } catch (error) {
      if (contenedor) {
        contenedor.innerHTML = `
          <div class="catalogo-cargando" style="color: var(--danger-text);">
            Error al conectar con la API de Mercado VIVA: ${error.message}.<br>
            <button class="btn btn-secundario" style="margin-top: 12px;" onclick="location.reload()">Reintentar</button>
          </div>`;
      }
      mostrarToast("Error cargando productos: " + error.message, "error");
    }
  }

  // --------------------------------------------------------
  // Renderizado del Catálogo
  // --------------------------------------------------------
  function renderCategoriaNav() {
    const nav = document.getElementById("categoriaNav");
    if (!nav) return;

    nav.innerHTML = `
      <button class="chip activo" type="button" data-target="todas">
        <span>Todas</span>
      </button>
    ` + categorias.map((cat) => `
      <button class="chip" type="button" data-target="cat-${cat.id}">
        ${obtenerIconoCategoria(cat.nombre)}
        <span>${cat.nombre}</span>
      </button>
    `).join("");

    nav.addEventListener("click", (evento) => {
      const boton = evento.target.closest(".chip");
      if (!boton) return;

      nav.querySelectorAll(".chip").forEach((c) => c.classList.remove("activo"));
      boton.classList.add("activo");

      const target = boton.dataset.target;
      if (target === "todas") {
        renderCatalogo(productos, true);
        return;
      }

      const destino = document.getElementById(target);
      if (destino) {
        destino.scrollIntoView({ behavior: "smooth", block: "start" });
      }
    });
  }

  function crearTarjetaProducto(p) {
    const disponible = Math.max(0, p.stock_disponible);
    const cantidadEnCarrito = carrito[p.id] || 0;

    const estado = disponible <= UMBRAL_POCAS_UNIDADES
      ? { clase: "pocas", etiqueta: disponible === 0 ? "Agotado" : "Pocas unidades" }
      : { clase: "disponible", etiqueta: "Disponible" };

    const tarjeta = document.createElement("article");
    tarjeta.className = "producto-card";
    tarjeta.dataset.id = p.id;

    tarjeta.innerHTML = `
      <div class="producto-media">
        <img src="${imagenProducto(p)}" alt="${p.nombre}" loading="lazy">
        <span class="badge-stock ${estado.clase}">${estado.etiqueta}</span>
      </div>
      <div class="producto-info">
        <p class="producto-marca">${p.marca} · <span class="mono">${p.identificador}</span></p>
        <h3 class="producto-nombre">${p.nombre}</h3>
        <p class="producto-presentacion">${p.presentacion}</p>
        <div class="producto-precio-row">
          <span class="producto-precio mono">${formatearPrecio(p.precio)}</span>
        </div>
        <p class="producto-disponibilidad">${disponible} unidades disponibles</p>
      </div>
      <div class="producto-accion">
        <button class="btn-agregar" type="button" ${cantidadEnCarrito ? "hidden" : ""} ${disponible === 0 ? "disabled" : ""}>
          ${disponible === 0 ? "Agotado" : "+ Agregar"}
        </button>
        <div class="stepper" ${cantidadEnCarrito ? "" : "hidden"}>
          <button class="stepper-btn" type="button" data-accion="restar" aria-label="Quitar una unidad">−</button>
          <span class="stepper-valor mono">${cantidadEnCarrito}</span>
          <button class="stepper-btn" type="button" data-accion="sumar" aria-label="Agregar una unidad" ${cantidadEnCarrito >= disponible ? "disabled" : ""}>+</button>
        </div>
      </div>
    `;
    return tarjeta;
  }

  function renderCatalogo(lista = productos, agrupar = true) {
    const contenedor = document.getElementById("secciones");
    if (!contenedor) return;
    contenedor.innerHTML = "";

    if (!lista.length) {
      contenedor.innerHTML = '<div class="catalogo-cargando">No se encontraron productos disponibles.</div>';
      return;
    }

    if (!agrupar || !categorias.length) {
      const grid = document.createElement("div");
      grid.className = "producto-grid";
      lista.forEach((p) => grid.appendChild(crearTarjetaProducto(p)));
      contenedor.appendChild(grid);
      return;
    }

    categorias.forEach((categoria) => {
      const productosCat = lista.filter((p) => p.categoriaId === categoria.id);
      if (!productosCat.length) return;

      const seccion = document.createElement("section");
      seccion.className = "categoria-seccion";
      seccion.id = `cat-${categoria.id}`;
      seccion.innerHTML = `
        <div class="categoria-seccion-header">
          <h2>${categoria.nombre}</h2>
          <span>${productosCat.length} producto(s)</span>
        </div>
      `;

      const grid = document.createElement("div");
      grid.className = "producto-grid";
      productosCat.forEach((p) => grid.appendChild(crearTarjetaProducto(p)));
      seccion.appendChild(grid);

      contenedor.appendChild(seccion);
    });
  }

  // --------------------------------------------------------
  // Manejo del Carrito
  // --------------------------------------------------------
  function cambiarCantidad(productoId, delta) {
    const p = productos.find((prod) => prod.id === productoId);
    if (!p) return;

    const disponible = Math.max(0, p.stock_disponible);
    const actual = carrito[productoId] || 0;
    let nueva = actual + delta;

    if (nueva < 0) nueva = 0;
    if (nueva > disponible) {
      nueva = disponible;
      mostrarToast(`Solo hay ${disponible} unidades disponibles de ${p.nombre}`, "error");
    }

    if (nueva === 0) {
      delete carrito[productoId];
    } else {
      carrito[productoId] = nueva;
    }

    actualizarCarritoUI();
    actualizarTarjetaCatalogo(productoId);
  }

  function actualizarTarjetaCatalogo(productoId) {
    const tarjeta = document.querySelector(`.producto-card[data-id="${productoId}"]`);
    const p = productos.find((prod) => prod.id === productoId);
    if (!tarjeta || !p) return;

    const disponible = Math.max(0, p.stock_disponible);
    const cantidad = carrito[productoId] || 0;
    const btnAgregar = tarjeta.querySelector(".btn-agregar");
    const stepper = tarjeta.querySelector(".stepper");
    const valor = tarjeta.querySelector(".stepper-valor");
    const btnSumar = tarjeta.querySelector('[data-accion="sumar"]');

    if (cantidad === 0) {
      btnAgregar.hidden = false;
      stepper.hidden = true;
    } else {
      btnAgregar.hidden = true;
      stepper.hidden = false;
      valor.textContent = cantidad;
    }
    if (btnSumar) btnSumar.disabled = cantidad >= disponible;
  }

  function renderCarritoBody() {
    const body = document.getElementById("carritoBody");
    if (!body) return;

    const ids = Object.keys(carrito);
    if (ids.length === 0) {
      body.innerHTML = '<p class="carrito-vacio">Tu carrito está vacío. Agrega productos para verlos aquí.</p>';
      return;
    }

    body.innerHTML = "";
    ids.forEach((id) => {
      const p = productos.find((prod) => prod.id === id);
      if (!p) return;
      const cantidad = carrito[id];

      const item = document.createElement("div");
      item.className = "carrito-item";
      item.dataset.id = p.id;
      item.innerHTML = `
        <img src="${imagenProducto(p)}" alt="">
        <div class="carrito-item-info">
          <p class="carrito-item-nombre">${p.nombre}</p>
          <p class="carrito-item-precio mono">${formatearPrecio(p.precio)} c/u</p>
          <div class="carrito-item-controles">
            <div class="stepper">
              <button class="stepper-btn" type="button" data-accion="restar" aria-label="Quitar una unidad">−</button>
              <span class="stepper-valor mono">${cantidad}</span>
              <button class="stepper-btn" type="button" data-accion="sumar" aria-label="Agregar una unidad" ${cantidad >= p.stock_disponible ? "disabled" : ""}>+</button>
            </div>
            <span class="carrito-item-total mono">${formatearPrecio(p.precio * cantidad)}</span>
          </div>
        </div>
        <button class="carrito-item-quitar" type="button" aria-label="Eliminar ${p.nombre} del carrito">
          <svg class="icon" viewBox="0 0 20 20" aria-hidden="true"><path d="M4 6h12M8 6V4h4v2M6 6l1 10a1 1 0 0 0 1 1h4a1 1 0 0 0 1-1l1-10"/></svg>
        </button>
      `;
      body.appendChild(item);
    });
  }

  function actualizarCarritoUI() {
    const ids = Object.keys(carrito);
    const cantidadTotal = ids.reduce((acc, id) => acc + carrito[id], 0);
    const subtotal = ids.reduce((acc, id) => {
      const p = productos.find((prod) => prod.id === id);
      return acc + (p ? p.precio * carrito[id] : 0);
    }, 0);

    const elCount = document.getElementById("carritoCount");
    const elTotalHeader = document.getElementById("carritoTotalHeader");
    const elSubtotal = document.getElementById("carritoSubtotal");
    const btnCheckout = document.getElementById("btnCheckout");

    if (elCount) elCount.textContent = cantidadTotal;
    if (elTotalHeader) elTotalHeader.textContent = formatearPrecio(subtotal);
    if (elSubtotal) elSubtotal.textContent = formatearPrecio(subtotal);
    if (btnCheckout) btnCheckout.disabled = cantidadTotal === 0;

    renderCarritoBody();
  }

  function abrirCarrito() {
    const drawer = document.getElementById("carritoDrawer");
    const overlay = document.getElementById("carritoOverlay");
    const btnCarrito = document.getElementById("btnCarrito");
    if (document.body.classList.contains("en-pago")) return;

    drawer.classList.add("abierto");
    drawer.setAttribute("aria-hidden", "false");
    overlay.hidden = false;
    requestAnimationFrame(() => overlay.classList.add("visible"));
    btnCarrito.setAttribute("aria-expanded", "true");
  }

  function cerrarCarrito() {
    const drawer = document.getElementById("carritoDrawer");
    const overlay = document.getElementById("carritoOverlay");
    const btnCarrito = document.getElementById("btnCarrito");

    drawer.classList.remove("abierto");
    drawer.setAttribute("aria-hidden", "true");
    overlay.classList.remove("visible");
    btnCarrito.setAttribute("aria-expanded", "false");
    setTimeout(() => { overlay.hidden = true; }, 150);
  }

  // --------------------------------------------------------
  // Checkout Real: Iniciar Pedido + Reserva Temporal en Backend
  // --------------------------------------------------------
  async function iniciarCheckout() {
    const ids = Object.keys(carrito);
    if (!ids.length) return;

    if (!usuarioActual || !usuarioActual.id) {
      mostrarToast("Por favor identifícate o inicia sesión como cliente para continuar con tu compra.", "info");
      abrirModalLoginCliente();
      return;
    }

    const btnCheckout = document.getElementById("btnCheckout");
    const originalText = btnCheckout.textContent;
    btnCheckout.disabled = true;
    btnCheckout.textContent = "Apartando stock...";

    try {
      const detalles = ids.map((producto_id) => ({
        producto_id,
        cantidad: carrito[producto_id],
      }));

      // Llamada real al backend: crea el pedido y genera las reservas en reservas_stock
      const nuevoPedido = await vivaApiRequest("/pedidos/", {
        method: "POST",
        body: JSON.stringify({
          usuario_id: usuarioActual.id,
          canal: "web",
          detalles,
        }),
      });

      pedidoActual = nuevoPedido;
      cerrarCarrito();
      renderResumenPago();
      cambiarVista("pago");
      iniciarTemporizadorReserva();
      mostrarToast("¡Stock reservado con éxito por 15 minutos!", "success");
    } catch (error) {
      mostrarToast("No se pudo iniciar el checkout: " + error.message, "error");
    } finally {
      btnCheckout.disabled = false;
      btnCheckout.textContent = originalText;
    }
  }

  function renderResumenPago() {
    const contenedor = document.getElementById("pagoItems");
    if (!contenedor || !pedidoActual) return;

    let subtotal = 0;
    contenedor.innerHTML = (pedidoActual.detalles || []).map((det) => {
      const p = productos.find((prod) => prod.id === det.producto_id);
      const nombre = p ? p.nombre : "Producto";
      const totalLinea = det.subtotal || det.precio_unitario * det.cantidad;
      subtotal += totalLinea;
      return `
        <div class="pago-item">
          <span class="pago-item-nombre">${det.cantidad} × ${nombre}</span>
          <span class="mono">${formatearPrecio(totalLinea)}</span>
        </div>`;
    }).join("");

    const totalFinal = pedidoActual.total || subtotal;
    document.getElementById("pagoSubtotal").textContent = formatearPrecio(totalFinal);
    document.getElementById("pagoTotal").textContent = formatearPrecio(totalFinal);
  }

  function iniciarTemporizadorReserva() {
    reservaSegundos = DURACION_RESERVA_SEGUNDOS;
    actualizarTemporizadorUI();
    detenerTemporizadorReserva();

    reservaIntervalId = setInterval(() => {
      reservaSegundos -= 1;
      actualizarTemporizadorUI();
      if (reservaSegundos <= 0) {
        detenerTemporizadorReserva();
        expirarReserva();
      }
    }, 1000);
  }

  function detenerTemporizadorReserva() {
    if (reservaIntervalId) {
      clearInterval(reservaIntervalId);
      reservaIntervalId = null;
    }
  }

  function actualizarTemporizadorUI() {
    const minutos = Math.floor(reservaSegundos / 60).toString().padStart(2, "0");
    const segundos = (reservaSegundos % 60).toString().padStart(2, "0");

    const elTiempo = document.getElementById("reservaTiempo");
    if (elTiempo) elTiempo.textContent = `${minutos}:${segundos}`;

    const barra = document.getElementById("reservaBarra");
    if (barra) {
      barra.style.width = `${Math.max(0, (reservaSegundos / DURACION_RESERVA_SEGUNDOS) * 100)}%`;
    }

    const banner = document.getElementById("reservaBanner");
    if (banner) {
      banner.classList.toggle("urgente", reservaSegundos <= 60);
    }
  }

  async function liberarPedidoBackend() {
    if (!pedidoActual) return;
    try {
      await vivaApiRequest(`/pedidos/${pedidoActual.id}/cancelar`, {
        method: "POST",
      });
    } catch (error) {
      mostrarToast("No se pudo liberar la reserva: " + error.message, "error");
    }
    pedidoActual = null;
  }

  async function expirarReserva() {
    await liberarPedidoBackend();
    carrito = {};
    actualizarCarritoUI();
    cambiarVista("catalogo");
    mostrarToast("La reserva de 15 minutos expiró. El stock fue liberado.", "error");
    cargarDatos(); // Recargar stock actualizado
  }

  async function cancelarPago() {
    detenerTemporizadorReserva();
    await liberarPedidoBackend();
    cambiarVista("catalogo");
    abrirCarrito();
  }

  // --------------------------------------------------------
  // Confirmación de Pago Real
  // --------------------------------------------------------
  async function confirmarPago() {
    if (!pedidoActual) {
      mostrarToast("No hay ningún pedido activo para confirmar.", "error");
      return;
    }

    const metodoRadio = document.querySelector('input[name="metodoPago"]:checked');
    const metodo = metodoRadio ? metodoRadio.value : "saldo";

    // Si paga con tarjeta simulada, validamos los campos
    if (metodo === "tarjeta") {
      const numero = document.getElementById("tarjetaNumero").value.trim();
      const vencimiento = document.getElementById("tarjetaVencimiento").value.trim();
      const cvv = document.getElementById("tarjetaCvv").value.trim();
      if (!numero || !vencimiento || !cvv) {
        mostrarToast("Completa los datos de la tarjeta simulada.", "error");
        return;
      }
    }

    // Validar saldo si usa saldo simulado (o canal web)
    const saldoActual = usuarioActual ? usuarioActual.saldo_simulado : 0;
    if (saldoActual < pedidoActual.total) {
      mostrarToast(`Saldo insuficiente (${formatearPrecio(saldoActual)}). Necesitas ${formatearPrecio(pedidoActual.total)}. Recarga saldo para continuar.`, "error");
      abrirModalRecarga();
      return;
    }

    const btn = document.getElementById("btnConfirmarPago");
    const origText = btn.textContent;
    btn.disabled = true;
    btn.textContent = "Procesando pago...";

    try {
      // Llamada real al backend para confirmar la venta y descontar saldo simulado
      const pedidoPagado = await vivaApiRequest(`/pedidos/${pedidoActual.id}/confirmar`, {
        method: "POST",
      });

      detenerTemporizadorReserva();

      // Refrescar saldo del usuario
      await cargarUsuario();

      // Mostrar pantalla de confirmación con el ID real
      const orderIdShort = pedidoPagado.id ? pedidoPagado.id.slice(0, 8).toUpperCase() : "VIVA-OK";
      document.getElementById("confirmacionPedidoId").textContent = `#${orderIdShort}`;

      pedidoActual = null;
      carrito = {};
      actualizarCarritoUI();
      cambiarVista("confirmacion");
      mostrarToast("¡Compra confirmada con éxito!", "success");

      // Actualizar catálogo en segundo plano para reflejar nuevo stock
      cargarDatos();
    } catch (error) {
      mostrarToast("Error al procesar el pago: " + error.message, "error");
    } finally {
      btn.disabled = false;
      btn.textContent = origText;
    }
  }

  // --------------------------------------------------------
  // Recarga de Saldo Simulado
  // --------------------------------------------------------
  function abrirModalRecarga() {
    const backdrop = document.getElementById("modalRecargaBackdrop");
    if (backdrop) backdrop.hidden = false;
  }

  function cerrarModalRecarga() {
    const backdrop = document.getElementById("modalRecargaBackdrop");
    if (backdrop) backdrop.hidden = true;
  }

  async function procesarRecarga(evento) {
    evento.preventDefault();
    if (!usuarioActual || !usuarioActual.id) {
      mostrarToast("Inicia sesión para recargar saldo.", "error");
      return;
    }

    const inputMonto = document.getElementById("montoRecarga");
    const monto = parseFloat(inputMonto.value);
    if (!monto || monto <= 0) {
      mostrarToast("Ingresa un monto válido mayor a 0.", "error");
      return;
    }

    const btnSubmit = document.getElementById("btnConfirmarRecarga");
    btnSubmit.disabled = true;
    btnSubmit.textContent = "Recargando...";

    try {
      const usuarioActualizado = await vivaApiRequest(`/usuarios/${usuarioActual.id}/recargar`, {
        method: "POST",
        body: JSON.stringify({ monto }),
      });

      usuarioActual = usuarioActualizado;
      localStorage.setItem("viva_usuario", JSON.stringify(usuarioActualizado));
      actualizarUsuarioUI();
      cerrarModalRecarga();
      mostrarToast(`¡Saldo recargado exitosamente! Nuevo saldo: ${formatearPrecio(usuarioActual.saldo_simulado)}`, "success");
    } catch (error) {
      mostrarToast("No se pudo recargar el saldo: " + error.message, "error");
    } finally {
      btnSubmit.disabled = false;
      btnSubmit.textContent = "Recargar ahora";
    }
  }

  // --------------------------------------------------------
  // Navegación entre Vistas
  // --------------------------------------------------------
  function cambiarVista(nombre) {
    document.getElementById("vistaCatalogo").hidden = nombre !== "catalogo";
    document.getElementById("vistaPago").hidden = nombre !== "pago";
    document.getElementById("vistaConfirmacion").hidden = nombre !== "confirmacion";
    document.body.classList.toggle("en-pago", nombre !== "catalogo");
    window.scrollTo(0, 0);
  }

  // --------------------------------------------------------
  // Inicialización de Eventos
  // --------------------------------------------------------
  function inicializarEventos() {
    // Catálogo (delegación de eventos)
    document.getElementById("catalogo").addEventListener("click", (evento) => {
      const tarjeta = evento.target.closest(".producto-card");
      if (!tarjeta) return;
      const productoId = tarjeta.dataset.id;

      if (evento.target.closest(".btn-agregar")) {
        cambiarCantidad(productoId, 1);
      } else if (evento.target.closest(".stepper-btn")) {
        const accion = evento.target.closest(".stepper-btn").dataset.accion;
        cambiarCantidad(productoId, accion === "sumar" ? 1 : -1);
      }
    });

    // Carrito
    document.getElementById("btnCarrito").addEventListener("click", abrirCarrito);
    document.getElementById("btnCerrarCarrito").addEventListener("click", cerrarCarrito);
    document.getElementById("carritoOverlay").addEventListener("click", cerrarCarrito);
    document.addEventListener("keydown", (evento) => {
      if (evento.key === "Escape") {
        cerrarCarrito();
        cerrarModalRecarga();
        cerrarModalLoginCliente();
      }
    });

    document.getElementById("carritoBody").addEventListener("click", (evento) => {
      const item = evento.target.closest(".carrito-item");
      if (!item) return;
      const productoId = item.dataset.id;

      if (evento.target.closest(".stepper-btn")) {
        const accion = evento.target.closest(".stepper-btn").dataset.accion;
        cambiarCantidad(productoId, accion === "sumar" ? 1 : -1);
      } else if (evento.target.closest(".carrito-item-quitar")) {
        delete carrito[productoId];
        actualizarCarritoUI();
        actualizarTarjetaCatalogo(productoId);
      }
    });

    document.getElementById("btnCheckout").addEventListener("click", iniciarCheckout);

    // Pago
    document.getElementById("btnCancelarPago").addEventListener("click", cancelarPago);
    document.getElementById("btnConfirmarPago").addEventListener("click", confirmarPago);
    document.getElementById("btnVolverTienda").addEventListener("click", () => cambiarVista("catalogo"));

    const camposTarjeta = document.getElementById("camposTarjeta");
    document.getElementById("metodosPago").addEventListener("change", () => {
      document.querySelectorAll(".metodo-pago").forEach((label) => {
        label.classList.toggle("seleccionado", label.querySelector("input").checked);
      });
      const metodo = document.querySelector('input[name="metodoPago"]:checked').value;
      if (camposTarjeta) camposTarjeta.hidden = metodo !== "tarjeta";
    });

    // Buscador
    const formBuscador = document.getElementById("formBuscador");
    const inputBuscar = document.getElementById("inputBuscar");
    const resultadosInfo = document.getElementById("resultadosInfo");

    formBuscador.addEventListener("submit", (e) => e.preventDefault());
    inputBuscar.addEventListener("input", () => {
      const q = inputBuscar.value.trim().toLowerCase();
      if (!q) {
        if (resultadosInfo) resultadosInfo.hidden = true;
        renderCatalogo(productos, true);
        return;
      }

      const encontrados = productos.filter(
        (p) =>
          p.nombre.toLowerCase().includes(q) ||
          p.identificador.toLowerCase().includes(q)
      );

      if (resultadosInfo) {
        resultadosInfo.hidden = false;
        resultadosInfo.innerHTML = `<span>${encontrados.length} resultado(s) para "${inputBuscar.value.trim()}"</span>`;
      }
      renderCatalogo(encontrados, false);
    });

    // Sucursales
    const sucursalLista = document.getElementById("sucursalLista");
    if (sucursalLista) {
      sucursalLista.innerHTML = SUCURSALES.map(
        (s) => `
        <li>
          <button type="button" data-id="${s.id}">
            ${s.nombre}
            <span class="sucursal-stock">${s.estado}</span>
          </button>
        </li>
      `
      ).join("");

      const btnSucursal = document.getElementById("btnSucursal");
      const menuSucursal = document.getElementById("sucursalMenu");
      const wrapSucursal = document.getElementById("sucursalWrap");

      btnSucursal.addEventListener("click", () => {
        const abierto = !menuSucursal.hidden;
        menuSucursal.hidden = abierto;
        btnSucursal.setAttribute("aria-expanded", String(!abierto));
      });

      sucursalLista.addEventListener("click", (e) => {
        const b = e.target.closest("button[data-id]");
        if (!b) return;
        const suc = SUCURSALES.find((s) => s.id === b.dataset.id);
        if (suc) {
          document.getElementById("sucursalActual").textContent = suc.nombre;
        }
        menuSucursal.hidden = true;
        btnSucursal.setAttribute("aria-expanded", "false");
      });

      document.addEventListener("click", (e) => {
        if (!wrapSucursal.contains(e.target)) {
          menuSucursal.hidden = true;
          btnSucursal.setAttribute("aria-expanded", "false");
        }
      });
    }

    // Modal Recarga
    const btnAbrirRecarga = document.getElementById("btnAbrirRecarga");
    if (btnAbrirRecarga) btnAbrirRecarga.addEventListener("click", abrirModalRecarga);

    const btnCerrarModalRecarga = document.getElementById("btnCerrarModalRecarga");
    if (btnCerrarModalRecarga) btnCerrarModalRecarga.addEventListener("click", cerrarModalRecarga);

    const formRecargaSaldo = document.getElementById("formRecargaSaldo");
    if (formRecargaSaldo) formRecargaSaldo.addEventListener("submit", procesarRecarga);

    document.querySelectorAll(".chip-monto").forEach((chip) => {
      chip.addEventListener("click", () => {
        const inputMonto = document.getElementById("montoRecarga");
        if (inputMonto) inputMonto.value = chip.dataset.monto;
      });
    });

    // Modal Login de Clientes
    const btnAbrirLogin = document.getElementById("btnAbrirLoginCliente");
    if (btnAbrirLogin) btnAbrirLogin.addEventListener("click", abrirModalLoginCliente);

    const btnCerrarModalLogin = document.getElementById("btnCerrarModalLogin");
    if (btnCerrarModalLogin) btnCerrarModalLogin.addEventListener("click", cerrarModalLoginCliente);

    const btnCerrarSesion = document.getElementById("btnCerrarSesionCliente");
    if (btnCerrarSesion) btnCerrarSesion.addEventListener("click", cerrarSesionCliente);

    const formLoginCliente = document.getElementById("formLoginCliente");
    if (formLoginCliente) formLoginCliente.addEventListener("submit", procesarLoginCliente);

    const btnDemo = document.getElementById("btnAutollenarDemo");
    if (btnDemo) {
      btnDemo.addEventListener("click", () => {
        const u = document.getElementById("inputLoginUsuario");
        const p = document.getElementById("inputLoginPassword");
        if (u) u.value = "cliente1";
        if (p) p.value = "cliente123";
      });
    }
  }

  // --------------------------------------------------------
  // Inicialización Global
  // --------------------------------------------------------
  async function inicializar() {
    inicializarEventos();
    await cargarUsuario();
    await cargarDatos();
    actualizarCarritoUI();
  }

  document.addEventListener("DOMContentLoaded", inicializar);
})();