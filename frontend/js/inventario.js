/* =========================================================
   MERCADO VIVA — Portal de Abastecedor / Inventario
   Sin dependencias externas. Consume la API real de FastAPI
   (backend/app/routes/productos.py). No inventa endpoints ni
   campos que no existan en el modelo de datos del proyecto.
   ========================================================= */

(() => {
  "use strict";

  // ------------------------------------------------------
  // Config
  // ------------------------------------------------------

  // Ajusta esta URL según el entorno (local/staging/prod).
  // Puede sobreescribirse definiendo window.MERCADO_VIVA_API_URL
  // antes de cargar este script.
  const API_BASE_URL = window.MERCADO_VIVA_API_URL || "http://localhost:8000";

  // Mapeo temporal de categoría → nombre. El backend aún no expone
  // GET /categorias, así que se usan los UUID reales del seed
  // (backend/app/database/03_seed.sql) hasta que exista ese endpoint.
  const CATEGORIAS_SEED = {
    "11111111-0000-0000-0000-000000000001": "Bebidas",
    "11111111-0000-0000-0000-000000000002": "Snacks",
    "11111111-0000-0000-0000-000000000003": "Aseo",
    "11111111-0000-0000-0000-000000000004": "Lácteos",
    "11111111-0000-0000-0000-000000000005": "Panadería",
  };

  const money = new Intl.NumberFormat("es-CO", {
    style: "currency",
    currency: "COP",
    maximumFractionDigits: 0,
  });

  const dateFmt = new Intl.DateTimeFormat("es-CO", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });

  const dateTimeFmt = new Intl.DateTimeFormat("es-CO", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });

  // ------------------------------------------------------
  // Estado
  // ------------------------------------------------------

  let productos = [];         // catálogo cargado desde /productos/
  let receptionItems = [];    // renglones de la recepción en curso
  let currentFiltro = "todos";
  let searchQuery = "";
  let categoriaGridFiltro = "";

  // ------------------------------------------------------
  // Referencias DOM
  // ------------------------------------------------------

  const $ = (id) => document.getElementById(id);

  const el = {
    // topbar
    relojActual: $("relojActual"),
    fechaActual: $("fechaActual"),
    btnTheme: $("btnTheme"),
    themeIcon: $("themeIcon"),
    nombreAbastecedorTop: $("nombreAbastecedorTop"),
    avatarAbastecedor: $("avatarAbastecedor"),

    // recepción — cabecera
    panelRecepcionBody: $("panelRecepcionBody"),
    btnColapsar: $("btnColapsar"),
    colapsarIcon: $("colapsarIcon"),
    refRecepcion: $("refRecepcion"),
    fechaRecepcion: $("fechaRecepcion"),
    filtroCategoriaScan: $("filtroCategoriaScan"),
    inputAbastecedor: $("inputAbastecedor"),

    // recepción — escaneo
    scanInput: $("scanInput"),
    listaProductos: $("listaProductos"),
    scanHint: $("scanHint"),
    btnAgregarManual: $("btnAgregarManual"),
    manualAddRow: $("manualAddRow"),
    manualProducto: $("manualProducto"),
    manualCantidad: $("manualCantidad"),
    manualConfirmar: $("manualConfirmar"),
    manualCancelarBtn: $("manualCancelarBtn"),

    // recepción — tabla y footer
    renglonesBody: $("renglonesBody"),
    renglonesEmpty: $("renglonesEmpty"),
    totalItems: $("totalItems"),
    totalUnidades: $("totalUnidades"),
    btnCancelar: $("btnCancelar"),
    btnBorrador: $("btnBorrador"),
    btnExportar: $("btnExportar"),
    btnRegistrar: $("btnRegistrar"),

    // grid
    btnRefrescar: $("btnRefrescar"),
    resumenCards: $("resumenCards"),
    chipFiltros: $("chipFiltros"),
    filtroCategoriaGrid: $("filtroCategoriaGrid"),
    buscarProducto: $("buscarProducto"),
    inventarioBody: $("inventarioBody"),

    // toast + modal
    toast: $("toast"),
    modalBackdrop: $("modalAjusteBackdrop"),
    modalProducto: $("modalAjusteProducto"),
    modalStockActual: $("modalStockActual"),
    modalStockMinimo: $("modalStockMinimo"),
    modalCancelar: $("modalCancelar"),
    modalGuardar: $("modalGuardar"),
  };

  let modalProductoId = null;

  // ------------------------------------------------------
  // Utilidades
  // ------------------------------------------------------

  function escapeHtml(str) {
    return String(str ?? "").replace(/[&<>"']/g, (c) => ({
      "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;",
    }[c]));
  }

  function nombreCategoria(categoriaId) {
    return CATEGORIAS_SEED[categoriaId] || "Sin categoría";
  }

  function debounce(fn, wait) {
    let t;
    return (...args) => {
      clearTimeout(t);
      t = setTimeout(() => fn(...args), wait);
    };
  }

  let toastTimer = null;
  function showToast(mensaje, tipo = "success") {
    el.toast.textContent = mensaje;
    el.toast.className = `toast is-visible toast--${tipo}`;
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => {
      el.toast.classList.remove("is-visible");
    }, 3500);
  }

  function showScanHint(mensaje, esError) {
    el.scanHint.textContent = mensaje;
    el.scanHint.classList.toggle("is-error", !!esError);
    el.scanHint.classList.toggle("is-success", !esError && !!mensaje);
  }

  // ------------------------------------------------------
  // Reloj / referencia de recepción
  // ------------------------------------------------------

  function tickReloj() {
    const ahora = new Date();
    el.relojActual.textContent = ahora.toLocaleTimeString("es-CO", { hour12: false });
  }

  function generarReferencia() {
    const ahora = new Date();
    const yyyy = ahora.getFullYear();
    const mm = String(ahora.getMonth() + 1).padStart(2, "0");
    const dd = String(ahora.getDate()).padStart(2, "0");
    const suf = Math.floor(Math.random() * 900 + 100);
    return `REC-${yyyy}${mm}${dd}-${suf}`;
  }

  function initCabeceraRecepcion() {
    el.refRecepcion.value = generarReferencia();
    el.fechaRecepcion.value = dateFmt.format(new Date());
    el.fechaActual.textContent = dateFmt.format(new Date());
    tickReloj();
    setInterval(tickReloj, 1000);
  }

  // ------------------------------------------------------
  // Tema (claro / modo bodega oscuro) — sin storage persistente
  // ------------------------------------------------------

  function initTheme() {
    const prefiereOscuro = window.matchMedia &&
      window.matchMedia("(prefers-color-scheme: dark)").matches;
    setTheme(prefiereOscuro ? "dark" : "light");

    el.btnTheme.addEventListener("click", () => {
      const actual = document.documentElement.getAttribute("data-theme");
      setTheme(actual === "dark" ? "light" : "dark");
    });
  }

  function setTheme(theme) {
    document.documentElement.setAttribute("data-theme", theme);
    el.themeIcon.textContent = theme === "dark" ? "☀️" : "🌙";
  }

  // ------------------------------------------------------
  // Carga de productos desde la API
  // ------------------------------------------------------

  async function cargarProductos() {
    el.inventarioBody.innerHTML =
      `<tr><td colspan="10" class="loading-row">Cargando inventario...</td></tr>`;

    try {
      const resp = await fetch(`${API_BASE_URL}/productos/`);
      if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
      const data = await resp.json();
      productos = Array.isArray(data) ? data : [];

      poblarCategorias();
      poblarDatalistYSelectManual();
      renderResumenCards();
      renderInventarioGrid();
    } catch (err) {
      productos = [];
      el.inventarioBody.innerHTML =
        `<tr><td colspan="10" class="error-row">No se pudo conectar con la API (${API_BASE_URL}). ` +
        `Verifica que el backend esté corriendo.</td></tr>`;
      showToast("Error al cargar el inventario", "error");
    }
  }

  function poblarCategorias() {
    const idsPresentes = [...new Set(productos.map(p => p.categoria_id).filter(Boolean))];
    const opciones = idsPresentes
      .map(id => ({ id, nombre: nombreCategoria(id) }))
      .sort((a, b) => a.nombre.localeCompare(b.nombre));

    const construir = (select, placeholder) => {
      const valorPrevio = select.value;
      select.innerHTML = `<option value="">${placeholder}</option>` +
        opciones.map(o => `<option value="${o.id}">${escapeHtml(o.nombre)}</option>`).join("");
      select.value = valorPrevio;
    };

    construir(el.filtroCategoriaScan, "Todas las categorías");
    construir(el.filtroCategoriaGrid, "Todas las categorías");
  }

  function poblarDatalistYSelectManual() {
    const categoriaRef = el.filtroCategoriaScan.value;
    const activos = productos
      .filter(p => p.activo !== false)
      .filter(p => !categoriaRef || p.categoria_id === categoriaRef)
      .sort((a, b) => (a.nombre || "").localeCompare(b.nombre || ""));

    el.listaProductos.innerHTML = activos
      .map(p => `<option value="${escapeHtml(p.identificador)}">${escapeHtml(p.nombre)}</option>`)
      .join("");

    el.manualProducto.innerHTML = activos
      .map(p => `<option value="${p.id}">${escapeHtml(p.identificador)} — ${escapeHtml(p.nombre)}</option>`)
      .join("");
  }

  // ------------------------------------------------------
  // KPIs
  // ------------------------------------------------------

  function renderResumenCards() {
    const activos = productos.filter(p => p.activo !== false);
    const enQuiebre = activos.filter(p => stockDisponible(p) <= 0);
    const bajoMinimo = activos.filter(p => {
      const d = stockDisponible(p);
      return d > 0 && d <= (p.stock_minimo ?? 0);
    });
    const reservadas = activos.reduce((acc, p) => acc + (p.stock_reservado || 0), 0);

    el.resumenCards.innerHTML = `
      <div class="kpi-card">
        <div class="kpi-card__label">Productos activos</div>
        <div class="kpi-card__value">${activos.length}</div>
      </div>
      <div class="kpi-card kpi-card--rose">
        <div class="kpi-card__label">En quiebre de stock</div>
        <div class="kpi-card__value">${enQuiebre.length}</div>
      </div>
      <div class="kpi-card kpi-card--amber">
        <div class="kpi-card__label">Bajo stock mínimo</div>
        <div class="kpi-card__value">${bajoMinimo.length}</div>
      </div>
      <div class="kpi-card kpi-card--emerald">
        <div class="kpi-card__label">Unidades reservadas (web)</div>
        <div class="kpi-card__value">${reservadas}</div>
      </div>
    `;
  }

  // ------------------------------------------------------
  // Grid de inventario
  // ------------------------------------------------------

  function stockDisponible(p) {
    if (typeof p.stock_disponible === "number") return p.stock_disponible;
    return (p.stock_actual || 0) - (p.stock_reservado || 0);
  }

  // La "discrepancia" en este modelo es un estado semántico (no una
  // diferencia numérica): stock_disponible es una columna generada en
  // BD como stock_actual - stock_reservado, por lo que esos tres
  // valores siempre son consistentes entre sí. El riesgo real a
  // vigilar es de disponibilidad: quiebre, bajo mínimo o bloqueado.
  function computeDiscrepancia(p) {
    if (p.activo === false) return { label: "Bloqueado", clase: "rose" };
    const disponible = stockDisponible(p);
    if (disponible <= 0) return { label: "Quiebre de stock", clase: "rose" };
    if (disponible <= (p.stock_minimo ?? 0)) return { label: "Bajo mínimo", clase: "amber" };
    return { label: "Sincronizado", clase: "emerald" };
  }

  function pasaFiltro(p) {
    const disponible = stockDisponible(p);

    if (currentFiltro === "bajo-minimo" && !(disponible > 0 && disponible <= (p.stock_minimo ?? 0))) return false;
    if (currentFiltro === "quiebre" && !(disponible <= 0)) return false;
    if (currentFiltro === "reservado" && !((p.stock_reservado || 0) > 0)) return false;

    if (categoriaGridFiltro && p.categoria_id !== categoriaGridFiltro) return false;

    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      const enSku = (p.identificador || "").toLowerCase().includes(q);
      const enNombre = (p.nombre || "").toLowerCase().includes(q);
      if (!enSku && !enNombre) return false;
    }

    return true;
  }

  function renderInventarioGrid() {
    const filas = productos.filter(pasaFiltro)
      .sort((a, b) => (a.nombre || "").localeCompare(b.nombre || ""));

    if (filas.length === 0) {
      el.inventarioBody.innerHTML =
        `<tr><td colspan="10" class="empty-row">Ningún producto coincide con el filtro actual</td></tr>`;
      return;
    }

    el.inventarioBody.innerHTML = filas.map(p => {
      const disponible = stockDisponible(p);
      const estado = computeDiscrepancia(p);
      const actualizado = p.updated_at ? dateTimeFmt.format(new Date(p.updated_at)) : "—";

      return `
        <tr class="row--${estado.clase}">
          <td class="cell-sku mono">${escapeHtml(p.identificador)}</td>
          <td>
            ${escapeHtml(p.nombre)}
            <span class="cell-desc-muted">${money.format(p.valor || 0)}</span>
          </td>
          <td>${escapeHtml(nombreCategoria(p.categoria_id))}</td>
          <td class="num">${p.stock_actual ?? 0}</td>
          <td class="num">${p.stock_reservado ?? 0}</td>
          <td class="num">${disponible}</td>
          <td class="num">${p.stock_minimo ?? 0}</td>
          <td><span class="badge badge--${estado.clase}">${estado.label}</span></td>
          <td>${actualizado}</td>
          <td class="col-action">
            <button class="btn-adjust" type="button" data-ajustar="${p.id}" title="Ajuste rápido">✎</button>
          </td>
        </tr>
      `;
    }).join("");
  }

  // ------------------------------------------------------
  // Filtros / búsqueda del grid
  // ------------------------------------------------------

  function initToolbarGrid() {
    el.chipFiltros.addEventListener("click", (e) => {
      const btn = e.target.closest(".chip");
      if (!btn) return;
      currentFiltro = btn.dataset.filtro;
      [...el.chipFiltros.children].forEach(c => c.classList.toggle("chip--active", c === btn));
      renderInventarioGrid();
    });

    el.filtroCategoriaGrid.addEventListener("change", () => {
      categoriaGridFiltro = el.filtroCategoriaGrid.value;
      renderInventarioGrid();
    });

    const buscarDebounced = debounce(() => {
      searchQuery = el.buscarProducto.value.trim();
      renderInventarioGrid();
    }, 200);
    el.buscarProducto.addEventListener("input", buscarDebounced);

    el.btnRefrescar.addEventListener("click", cargarProductos);

    el.inventarioBody.addEventListener("click", (e) => {
      const btn = e.target.closest("[data-ajustar]");
      if (!btn) return;
      abrirModalAjuste(btn.dataset.ajustar);
    });
  }

  // ------------------------------------------------------
  // Modal de ajuste rápido
  // ------------------------------------------------------

  function abrirModalAjuste(productoId) {
    const p = productos.find(x => x.id === productoId);
    if (!p) return;

    modalProductoId = productoId;
    el.modalProducto.textContent = `${p.identificador} — ${p.nombre}`;
    el.modalStockActual.value = p.stock_actual ?? 0;
    el.modalStockMinimo.value = p.stock_minimo ?? 0;
    el.modalBackdrop.hidden = false;
    el.modalStockActual.focus();
  }

  function cerrarModalAjuste() {
    el.modalBackdrop.hidden = true;
    modalProductoId = null;
  }

  async function guardarAjuste() {
    if (!modalProductoId) return;

    const stockActual = Number(el.modalStockActual.value);
    const stockMinimo = Number(el.modalStockMinimo.value);

    if (!Number.isFinite(stockActual) || stockActual < 0 ||
        !Number.isFinite(stockMinimo) || stockMinimo < 0) {
      showToast("Los valores de stock deben ser números válidos ≥ 0", "warn");
      return;
    }

    el.modalGuardar.disabled = true;
    try {
      const resp = await fetch(`${API_BASE_URL}/productos/${modalProductoId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ stock_actual: stockActual, stock_minimo: stockMinimo }),
      });
      if (!resp.ok) throw new Error(await resp.text());

      showToast("Ajuste guardado", "success");
      cerrarModalAjuste();
      await cargarProductos();
    } catch (err) {
      showToast("No se pudo guardar el ajuste", "error");
    } finally {
      el.modalGuardar.disabled = false;
    }
  }

  function initModal() {
    el.modalCancelar.addEventListener("click", cerrarModalAjuste);
    el.modalGuardar.addEventListener("click", guardarAjuste);
    el.modalBackdrop.addEventListener("click", (e) => {
      if (e.target === el.modalBackdrop) cerrarModalAjuste();
    });
  }

  // ------------------------------------------------------
  // Recepción — agregar renglones
  // ------------------------------------------------------

  function addOrIncrementReception(producto, cantidad) {
    const existente = receptionItems.find(i => i.productoId === producto.id);
    if (existente) {
      existente.cantidad += cantidad;
    } else {
      receptionItems.push({
        productoId: producto.id,
        sku: producto.identificador,
        nombre: producto.nombre,
        categoriaId: producto.categoria_id,
        stockAntes: producto.stock_actual ?? 0,
        cantidad,
      });
    }
    renderReception();
  }

  function removeReceptionItem(productoId) {
    receptionItems = receptionItems.filter(i => i.productoId !== productoId);
    renderReception();
  }

  function renderReception() {
    if (receptionItems.length === 0) {
      el.renglonesBody.innerHTML =
        `<tr class="empty-row" id="renglonesEmpty"><td colspan="8">Sin renglones — escanea un SKU o agrega manualmente</td></tr>`;
    } else {
      el.renglonesBody.innerHTML = receptionItems.map((item, idx) => `
        <tr>
          <td class="col-index">${idx + 1}</td>
          <td class="cell-sku mono">${escapeHtml(item.sku)}</td>
          <td>${escapeHtml(item.nombre)}</td>
          <td>${escapeHtml(nombreCategoria(item.categoriaId))}</td>
          <td class="num">${item.stockAntes}</td>
          <td class="num">
            <input type="number" class="qty-input" min="1" step="1"
                   value="${item.cantidad}" data-cantidad="${item.productoId}">
          </td>
          <td class="num">${item.stockAntes + item.cantidad}</td>
          <td class="col-action">
            <button class="btn-remove" type="button" data-quitar="${item.productoId}" title="Quitar">✕</button>
          </td>
        </tr>
      `).join("");
    }

    const totalItems = receptionItems.length;
    const totalUnidades = receptionItems.reduce((acc, i) => acc + i.cantidad, 0);
    el.totalItems.textContent = totalItems;
    el.totalUnidades.textContent = totalUnidades;
    el.btnRegistrar.disabled = totalItems === 0;
  }

  function initReceptionTable() {
    el.renglonesBody.addEventListener("click", (e) => {
      const btn = e.target.closest("[data-quitar]");
      if (!btn) return;
      removeReceptionItem(btn.dataset.quitar);
    });

    el.renglonesBody.addEventListener("input", (e) => {
      const input = e.target.closest("[data-cantidad]");
      if (!input) return;
      const item = receptionItems.find(i => i.productoId === input.dataset.cantidad);
      if (!item) return;
      const val = Math.max(1, parseInt(input.value, 10) || 1);
      item.cantidad = val;
      renderReception();
    });
  }

  // ------------------------------------------------------
  // Recepción — escaneo y alta manual
  // ------------------------------------------------------

  function initScan() {
    el.scanInput.addEventListener("keydown", (e) => {
      if (e.key !== "Enter") return;
      e.preventDefault();
      const codigo = el.scanInput.value.trim();
      if (!codigo) return;

      const producto = productos.find(
        p => (p.identificador || "").toLowerCase() === codigo.toLowerCase()
      );

      if (!producto) {
        showScanHint(`SKU "${codigo}" no encontrado en el catálogo`, true);
      } else if (producto.activo === false) {
        showScanHint(`"${producto.nombre}" está inactivo y no puede recibirse`, true);
      } else {
        addOrIncrementReception(producto, 1);
        showScanHint(`Agregado: ${producto.identificador} — ${producto.nombre}`, false);
      }
      el.scanInput.value = "";
      el.scanInput.focus();
    });

    el.filtroCategoriaScan.addEventListener("change", poblarDatalistYSelectManual);
  }

  function initManualAdd() {
    el.btnAgregarManual.addEventListener("click", () => {
      el.manualAddRow.hidden = !el.manualAddRow.hidden;
      if (!el.manualAddRow.hidden) el.manualProducto.focus();
    });

    el.manualCancelarBtn.addEventListener("click", () => {
      el.manualAddRow.hidden = true;
    });

    el.manualConfirmar.addEventListener("click", () => {
      const productoId = el.manualProducto.value;
      const cantidad = Math.max(1, parseInt(el.manualCantidad.value, 10) || 1);
      const producto = productos.find(p => p.id === productoId);

      if (!producto) {
        showToast("Selecciona un producto válido", "warn");
        return;
      }

      addOrIncrementReception(producto, cantidad);
      el.manualCantidad.value = 1;
      el.manualAddRow.hidden = true;
      showScanHint(`Agregado: ${producto.identificador} — ${producto.nombre}`, false);
    });
  }

  // ------------------------------------------------------
  // Recepción — acciones de pie de tabla
  // ------------------------------------------------------

  function limpiarRecepcion() {
    receptionItems = [];
    renderReception();
    showScanHint("", false);
    el.refRecepcion.value = generarReferencia();
  }

  function initFooterActions() {
    el.btnCancelar.addEventListener("click", () => {
      if (receptionItems.length > 0 &&
          !confirm("¿Cancelar la recepción en curso? Se perderán los renglones agregados.")) {
        return;
      }
      limpiarRecepcion();
    });

    el.btnBorrador.addEventListener("click", () => {
      if (receptionItems.length === 0) {
        showToast("No hay renglones para guardar como borrador", "warn");
        return;
      }
      // Los renglones ya se mantienen en memoria mientras la pestaña
      // permanezca abierta; no existe (todavía) un endpoint de
      // borradores en el backend para persistirlos entre sesiones.
      showToast("Borrador conservado en esta sesión", "success");
    });

    el.btnExportar.addEventListener("click", exportarResumenCSV);
    el.btnRegistrar.addEventListener("click", registrarEntrada);
  }

  function exportarResumenCSV() {
    if (receptionItems.length === 0) {
      showToast("No hay renglones para exportar", "warn");
      return;
    }

    const encabezado = ["referencia", "fecha", "recibido_por", "sku", "descripcion", "categoria", "stock_antes", "cantidad_recibida", "stock_resultante"];
    const filas = receptionItems.map(i => [
      el.refRecepcion.value,
      el.fechaRecepcion.value,
      el.inputAbastecedor.value || "",
      i.sku,
      i.nombre,
      nombreCategoria(i.categoriaId),
      i.stockAntes,
      i.cantidad,
      i.stockAntes + i.cantidad,
    ]);

    const csv = [encabezado, ...filas]
      .map(fila => fila.map(v => `"${String(v).replace(/"/g, '""')}"`).join(","))
      .join("\n");

    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${el.refRecepcion.value}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  async function registrarEntrada() {
    if (receptionItems.length === 0) return;

    el.btnRegistrar.disabled = true;
    el.btnRegistrar.textContent = "Registrando...";

    const ok = [];
    const conError = [];

    for (const item of receptionItems) {
      try {
        // Se relee el stock justo antes de guardar para minimizar
        // condiciones de carrera: PUT /productos/{id} reemplaza el
        // valor absoluto (no incrementa). Lo ideal a futuro es exponer
        // un endpoint atómico equivalente a fn_abastecer_producto().
        const actualResp = await fetch(`${API_BASE_URL}/productos/${item.productoId}`);
        if (!actualResp.ok) throw new Error("No se pudo leer el stock actual");
        const actual = await actualResp.json();
        const nuevoStock = (actual.stock_actual ?? item.stockAntes) + item.cantidad;

        const resp = await fetch(`${API_BASE_URL}/productos/${item.productoId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ stock_actual: nuevoStock }),
        });
        if (!resp.ok) throw new Error(await resp.text());

        ok.push(item);
      } catch (err) {
        conError.push(item);
      }
    }

    el.btnRegistrar.disabled = false;
    el.btnRegistrar.textContent = "✔ Registrar entrada — FINALIZAR";

    if (conError.length === 0) {
      showToast(`Entrada registrada: ${ok.length} producto(s) actualizados`, "success");
      limpiarRecepcion();
    } else {
      showToast(`${ok.length} actualizados, ${conError.length} con error — revisa la conexión`, "error");
      receptionItems = receptionItems.filter(i => conError.includes(i));
      renderReception();
    }

    await cargarProductos();
  }

  // ------------------------------------------------------
  // Colapsar panel de recepción
  // ------------------------------------------------------

  function initColapsar() {
    el.btnColapsar.addEventListener("click", () => {
      const expandido = el.btnColapsar.getAttribute("aria-expanded") === "true";
      el.panelRecepcionBody.hidden = expandido;
      el.btnColapsar.setAttribute("aria-expanded", String(!expandido));
      el.colapsarIcon.textContent = expandido ? "▸" : "▾";
      el.btnColapsar.firstChild.textContent = expandido ? "Expandir " : "Contraer ";
    });
  }

  // ------------------------------------------------------
  // Init
  // ------------------------------------------------------

  function init() {
    initTheme();
    initCabeceraRecepcion();
    initColapsar();
    initScan();
    initManualAdd();
    initReceptionTable();
    initFooterActions();
    initToolbarGrid();
    initModal();
    renderReception();
    cargarProductos();
  }

  document.addEventListener("DOMContentLoaded", init);
})();