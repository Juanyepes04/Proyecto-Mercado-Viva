/* ==========================================================
   Mercado VIVA — Tienda web (cliente)
   Datos mockeados: en producción, CATEGORIAS y PRODUCTOS deben
   venir de GET /productos y de una tabla/endpoint de categorías.
   ========================================================== */

const ICONOS = {
  'frutas-verduras': '<svg class="icon" viewBox="0 0 20 20" aria-hidden="true"><path d="M10 4c0-1.2 1-2 2-2"/><path d="M10 6.5c-3.5 0-6 2.6-6 6.2 0 3 2.2 5.3 5 5.3.8 0 1.4-.2 1.9-.5.6.3 1.2.5 2 .5 2.8 0 5-2.3 5-5.3 0-3.6-2.5-6.2-6-6.2Z"/></svg>',
  carnicos: '<svg class="icon" viewBox="0 0 20 20" aria-hidden="true"><path d="M13 3c2.2 0 4 1.8 4 4 0 2.6-2.3 4.6-5.6 7.7l-2.6 2.4-1.4-1.4 1.8-1.9c-2 .3-3.8-.2-4.9-1.3-1.6-1.6-1.6-4.2 0-5.8 1.6-1.6 4.2-1.6 5.8 0"/></svg>',
  'lacteos-huevos': '<svg class="icon" viewBox="0 0 20 20" aria-hidden="true"><path d="M8 2h4l1 3.2v10a2 2 0 0 1-2 2H9a2 2 0 0 1-2-2v-10L8 2Z"/><path d="M7 9h6"/></svg>',
  panaderia: '<svg class="icon" viewBox="0 0 20 20" aria-hidden="true"><path d="M3 12c0-4 3-8 7-8s7 4 7 8-3 4-7 4-7 0-7-4Z"/><path d="M7 9.5v3M10 8.5v4M13 9.5v3"/></svg>',
  bebidas: '<svg class="icon" viewBox="0 0 20 20" aria-hidden="true"><path d="M8 2h4v3.2l1.6 2.3c.3.4.4.9.4 1.4V16a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2V8.9c0-.5.1-1 .4-1.4L10 5.2"/><path d="M6.5 12h7"/></svg>',
  aseo: '<svg class="icon" viewBox="0 0 20 20" aria-hidden="true"><path d="M9 2h3v3H9z"/><path d="M8 5h5l1.5 2H6.5L8 5Z"/><path d="M7 7h6v9a2 2 0 0 1-2 2H9a2 2 0 0 1-2-2V7Z"/></svg>',
  snacks: '<svg class="icon" viewBox="0 0 20 20" aria-hidden="true"><path d="M6 6 8 2h4l2 4"/><path d="M5 6h10l1 10a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2L5 6Z"/></svg>'
};

const CATEGORIAS = [
  { id: 'frutas-verduras', nombre: 'Frutas y Verduras' },
  { id: 'carnicos', nombre: 'Cárnicos' },
  { id: 'lacteos-huevos', nombre: 'Lácteos y Huevos' },
  { id: 'panaderia', nombre: 'Panadería' },
  { id: 'bebidas', nombre: 'Bebidas' },
  { id: 'aseo', nombre: 'Aseo y Limpieza' },
  { id: 'snacks', nombre: 'Snacks y Dulces' }
];

const PRODUCTOS = [
  { id: 'p01', categoriaId: 'frutas-verduras', sku: 'FV-0001', marca: 'Finca Local', nombre: 'Aguacate Hass', presentacion: 'Unidad ~200 g', unidadMedida: 'kg', precio: 2900, precioPorUnidad: 14500, stockCantidad: 34 },
  { id: 'p02', categoriaId: 'frutas-verduras', sku: 'FV-0002', marca: 'Finca Local', nombre: 'Banano Criollo', presentacion: '1 kg', unidadMedida: 'kg', precio: 2600, precioPorUnidad: 2600, stockCantidad: 6 },
  { id: 'p03', categoriaId: 'frutas-verduras', sku: 'FV-0003', marca: 'Huerta Andina', nombre: 'Tomate Chonto', presentacion: '1 kg', unidadMedida: 'kg', precio: 3200, precioPorUnidad: 3200, stockCantidad: 22 },
  { id: 'p04', categoriaId: 'frutas-verduras', sku: 'FV-0004', marca: 'Huerta Andina', nombre: 'Papa Criolla', presentacion: '1 kg', unidadMedida: 'kg', precio: 3800, precioPorUnidad: 3800, stockCantidad: 4 },

  { id: 'p05', categoriaId: 'carnicos', sku: 'CN-0001', marca: 'Carnes del Valle', nombre: 'Pechuga de Pollo', presentacion: '1 kg', unidadMedida: 'kg', precio: 13900, precioPorUnidad: 13900, stockCantidad: 15 },
  { id: 'p06', categoriaId: 'carnicos', sku: 'CN-0002', marca: 'Carnes del Valle', nombre: 'Carne Molida Res', presentacion: '500 g', unidadMedida: 'kg', precio: 9900, precioPorUnidad: 19800, stockCantidad: 5 },
  { id: 'p07', categoriaId: 'carnicos', sku: 'CN-0003', marca: 'Rancho Sabana', nombre: 'Chorizo Antioqueño', presentacion: '500 g', unidadMedida: 'kg', precio: 8500, precioPorUnidad: 17000, stockCantidad: 27 },
  { id: 'p08', categoriaId: 'carnicos', sku: 'CN-0004', marca: 'Pescadería Andina', nombre: 'Filete de Tilapia', presentacion: '400 g', unidadMedida: 'kg', precio: 12500, precioPorUnidad: 31250, stockCantidad: 3 },

  { id: 'p09', categoriaId: 'lacteos-huevos', sku: 'LH-0001', marca: 'Alquería', nombre: 'Leche Entera', presentacion: '1 L', unidadMedida: 'l', precio: 4200, precioPorUnidad: 4200, stockCantidad: 48 },
  { id: 'p10', categoriaId: 'lacteos-huevos', sku: 'LH-0002', marca: 'Colanta', nombre: 'Yogurt Griego Natural', presentacion: '200 g', unidadMedida: 'kg', precio: 2800, precioPorUnidad: 14000, stockCantidad: 19 },
  { id: 'p11', categoriaId: 'lacteos-huevos', sku: 'LH-0003', marca: 'Granja Feliz', nombre: 'Huevos AA', presentacion: '30 unidades', unidadMedida: 'und', precio: 16900, precioPorUnidad: 563, stockCantidad: 5 },
  { id: 'p12', categoriaId: 'lacteos-huevos', sku: 'LH-0004', marca: 'Alquería', nombre: 'Queso Campesino', presentacion: '450 g', unidadMedida: 'kg', precio: 11200, precioPorUnidad: 24888, stockCantidad: 12 },

  { id: 'p13', categoriaId: 'panaderia', sku: 'PN-0001', marca: 'Panadería VIVA', nombre: 'Pan Tajado Integral', presentacion: '500 g', unidadMedida: 'kg', precio: 6500, precioPorUnidad: 13000, stockCantidad: 26 },
  { id: 'p14', categoriaId: 'panaderia', sku: 'PN-0002', marca: 'Panadería VIVA', nombre: 'Croissant Mantequilla', presentacion: 'Unidad', unidadMedida: 'und', precio: 3500, precioPorUnidad: 3500, stockCantidad: 4 },
  { id: 'p15', categoriaId: 'panaderia', sku: 'PN-0003', marca: 'Bimbo', nombre: 'Arepas de Maíz', presentacion: 'Paquete x10', unidadMedida: 'und', precio: 5900, precioPorUnidad: 590, stockCantidad: 17 },
  { id: 'p16', categoriaId: 'panaderia', sku: 'PN-0004', marca: 'Panadería VIVA', nombre: 'Torta de Vainilla', presentacion: 'Unidad 800 g', unidadMedida: 'kg', precio: 18900, precioPorUnidad: 23625, stockCantidad: 2 },

  { id: 'p17', categoriaId: 'bebidas', sku: 'BB-0001', marca: 'Postobón', nombre: 'Gaseosa 1.5 L', presentacion: '1.5 L', unidadMedida: 'l', precio: 5500, precioPorUnidad: 3667, stockCantidad: 40 },
  { id: 'p18', categoriaId: 'bebidas', sku: 'BB-0002', marca: 'Cristal', nombre: 'Agua sin Gas', presentacion: '600 ml', unidadMedida: 'l', precio: 2000, precioPorUnidad: 3333, stockCantidad: 60 },
  { id: 'p19', categoriaId: 'bebidas', sku: 'BB-0003', marca: 'Jumbo Jet', nombre: 'Bebida Energizante', presentacion: '90 ml', unidadMedida: 'l', precio: 8490, precioPorUnidad: 94333, stockCantidad: 5 },
  { id: 'p20', categoriaId: 'bebidas', sku: 'BB-0004', marca: 'Colombiano', nombre: 'Café Molido', presentacion: '500 g', unidadMedida: 'kg', precio: 14500, precioPorUnidad: 29000, stockCantidad: 14 },

  { id: 'p21', categoriaId: 'aseo', sku: 'AS-0001', marca: 'Fab', nombre: 'Detergente en Polvo', presentacion: '1 kg', unidadMedida: 'kg', precio: 12000, precioPorUnidad: 12000, stockCantidad: 20 },
  { id: 'p22', categoriaId: 'aseo', sku: 'AS-0002', marca: 'Protex', nombre: 'Jabón de Baño', presentacion: 'Unidad 90 g', unidadMedida: 'kg', precio: 3200, precioPorUnidad: 35555, stockCantidad: 25 },
  { id: 'p23', categoriaId: 'aseo', sku: 'AS-0003', marca: 'Scott', nombre: 'Papel Higiénico x12', presentacion: '12 rollos', unidadMedida: 'und', precio: 22900, precioPorUnidad: 1908, stockCantidad: 5 },
  { id: 'p24', categoriaId: 'aseo', sku: 'AS-0004', marca: 'Fabuloso', nombre: 'Limpiador Multiusos', presentacion: '1 L', unidadMedida: 'l', precio: 8900, precioPorUnidad: 8900, stockCantidad: 16 },

  { id: 'p25', categoriaId: 'snacks', sku: 'SN-0001', marca: "M y M's", nombre: 'Estuche Surtido', presentacion: '4 und, 61 g', unidadMedida: 'kg', precio: 6990, precioPorUnidad: 114590, stockCantidad: 31 },
  { id: 'p26', categoriaId: 'snacks', sku: 'SN-0002', marca: 'Margarita', nombre: 'Papas Fritas Original', presentacion: '150 g', unidadMedida: 'kg', precio: 4500, precioPorUnidad: 30000, stockCantidad: 5 },
  { id: 'p27', categoriaId: 'snacks', sku: 'SN-0003', marca: 'Ghalia', nombre: 'Queso Brie Creamy', presentacion: '125 g', unidadMedida: 'kg', precio: 12800, precioPorUnidad: 102400, stockCantidad: 9 },
  { id: 'p28', categoriaId: 'snacks', sku: 'SN-0004', marca: 'Jet', nombre: 'Chocolatina Romantik', presentacion: '90 g', unidadMedida: 'kg', precio: 8490, precioPorUnidad: 94333, stockCantidad: 3 }
];

const SUCURSALES = [
  { id: 'centro', nombre: 'Sucursal Centro', estado: 'Stock sincronizado' },
  { id: 'norte', nombre: 'Sucursal Norte', estado: 'Stock sincronizado' },
  { id: 'poblado', nombre: 'Sucursal El Poblado', estado: 'Sincronizando' }
];

// Umbral bajo el cual un producto se muestra como "Pocas unidades".
const UMBRAL_POCAS_UNIDADES = 8;

// Duración de la reserva de inventario al iniciar el pago (HU3: 15 min en el
// backend real; aquí se deja en 5 min para poder probar el flujo completo).
const DURACION_RESERVA_SEGUNDOS = 5 * 60;

// stock_actual / stock_reservado / stock_disponible, igual que en el esquema
// real (01_schema.sql). stockCantidad = stock físico; stockReservado = lo que
// está apartado por un checkout en curso (de este cliente o, en producción,
// de cualquier otro). stockDisponible = lo que realmente se puede comprar.
PRODUCTOS.forEach(producto => { producto.stockReservado = 0; });

// carrito: { [productoId]: cantidad }
let carrito = {};

// Snapshot del carrito en el momento de iniciar el pago (lo que quedó reservado).
let pedidoReservado = {};

let reservaIntervalId = null;
let reservaSegundos = DURACION_RESERVA_SEGUNDOS;
let contadorPedidos = 1000;

/* ---------- utilidades ---------- */

function formatearPrecio(valor) {
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    maximumFractionDigits: 0
  }).format(valor);
}

function obtenerDisponible(producto) {
  return Math.max(0, producto.stockCantidad - producto.stockReservado);
}

function obtenerEstadoStock(cantidad) {
  return cantidad <= UMBRAL_POCAS_UNIDADES
    ? { clase: 'pocas', etiqueta: 'Pocas unidades' }
    : { clase: 'disponible', etiqueta: 'Disponible en tienda' };
}

function imagenProducto(nombre, tamano) {
  return `https://placehold.co/${tamano}x${tamano}/f4f4f5/52525b?text=${encodeURIComponent(nombre)}`;
}

/* ---------- catálogo ---------- */

function renderCategoriaNav() {
  const nav = document.getElementById('categoriaNav');
  nav.innerHTML = CATEGORIAS.map(cat => `
    <button class="chip" type="button" data-target="cat-${cat.id}">
      ${ICONOS[cat.id] || ''}<span>${cat.nombre}</span>
    </button>
  `).join('');

  nav.addEventListener('click', (evento) => {
    const boton = evento.target.closest('.chip');
    if (!boton) return;
    const destino = document.getElementById(boton.dataset.target);
    if (destino) destino.scrollIntoView({ behavior: 'smooth', block: 'start' });
  });
}

function crearTarjetaProducto(producto) {
  const disponible = obtenerDisponible(producto);
  const estado = obtenerEstadoStock(disponible);
  const cantidadEnCarrito = carrito[producto.id] || 0;

  const tarjeta = document.createElement('article');
  tarjeta.className = 'producto-card';
  tarjeta.dataset.id = producto.id;

  tarjeta.innerHTML = `
    <div class="producto-media">
      <img src="${imagenProducto(producto.nombre, 300)}" alt="${producto.nombre}" loading="lazy">
      <span class="badge-stock ${estado.clase}">${estado.etiqueta}</span>
    </div>
    <div class="producto-info">
      <p class="producto-marca">${producto.marca}</p>
      <h3 class="producto-nombre">${producto.nombre}</h3>
      <p class="producto-presentacion">${producto.presentacion}</p>
      <div class="producto-precio-row">
        <span class="producto-precio mono">${formatearPrecio(producto.precio)}</span>
        <span class="producto-precio-unidad mono">${formatearPrecio(producto.precioPorUnidad)} / ${producto.unidadMedida}</span>
      </div>
      <p class="producto-disponibilidad">${disponible} unidades disponibles en tienda</p>
    </div>
    <div class="producto-accion">
      <button class="btn-agregar" type="button" ${cantidadEnCarrito ? 'hidden' : ''} ${disponible === 0 ? 'disabled' : ''}>+ Agregar</button>
      <div class="stepper" ${cantidadEnCarrito ? '' : 'hidden'}>
        <button class="stepper-btn" type="button" data-accion="restar" aria-label="Quitar una unidad">−</button>
        <span class="stepper-valor mono">${cantidadEnCarrito}</span>
        <button class="stepper-btn" type="button" data-accion="sumar" aria-label="Agregar una unidad" ${cantidadEnCarrito >= disponible ? 'disabled' : ''}>+</button>
      </div>
    </div>
  `;
  return tarjeta;
}

function renderCatalogo(lista = PRODUCTOS, agrupar = true) {
  const contenedor = document.getElementById('secciones');
  contenedor.innerHTML = '';

  if (!agrupar) {
    const grid = document.createElement('div');
    grid.className = 'producto-grid';
    lista.forEach(producto => grid.appendChild(crearTarjetaProducto(producto)));
    contenedor.appendChild(grid);
    return;
  }

  CATEGORIAS.forEach(categoria => {
    const productosCategoria = lista.filter(p => p.categoriaId === categoria.id);
    if (!productosCategoria.length) return;

    const seccion = document.createElement('section');
    seccion.className = 'categoria-seccion';
    seccion.id = `cat-${categoria.id}`;
    seccion.innerHTML = `
      <div class="categoria-seccion-header">
        <h2>${categoria.nombre}</h2>
        <span>${productosCategoria.length} productos</span>
      </div>
    `;

    const grid = document.createElement('div');
    grid.className = 'producto-grid';
    productosCategoria.forEach(producto => grid.appendChild(crearTarjetaProducto(producto)));
    seccion.appendChild(grid);

    contenedor.appendChild(seccion);
  });

  observarSecciones();
}

function observarSecciones() {
  const secciones = document.querySelectorAll('.categoria-seccion');
  const chips = document.querySelectorAll('.chip');
  if (!('IntersectionObserver' in window) || !secciones.length) return;

  const observador = new IntersectionObserver((entradas) => {
    entradas.forEach(entrada => {
      if (entrada.isIntersecting) {
        chips.forEach(chip => chip.classList.toggle('activo', chip.dataset.target === entrada.target.id));
      }
    });
  }, { rootMargin: '-140px 0px -70% 0px', threshold: 0 });

  secciones.forEach(seccion => observador.observe(seccion));
}

/* ---------- carrito ---------- */

function cambiarCantidad(productoId, delta) {
  const producto = PRODUCTOS.find(p => p.id === productoId);
  if (!producto) return;

  const disponible = obtenerDisponible(producto);
  const actual = carrito[productoId] || 0;
  let nueva = actual + delta;
  if (nueva < 0) nueva = 0;
  if (nueva > disponible) nueva = disponible;

  if (nueva === 0) {
    delete carrito[productoId];
  } else {
    carrito[productoId] = nueva;
  }

  actualizarCarritoUI();
}

function actualizarTarjetaCatalogo(productoId) {
  const tarjeta = document.querySelector(`.producto-card[data-id="${productoId}"]`);
  const producto = PRODUCTOS.find(p => p.id === productoId);
  if (!tarjeta || !producto) return;

  const disponible = obtenerDisponible(producto);
  const cantidad = carrito[productoId] || 0;
  const btnAgregar = tarjeta.querySelector('.btn-agregar');
  const stepper = tarjeta.querySelector('.stepper');
  const valor = tarjeta.querySelector('.stepper-valor');
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

  const disponibilidadTexto = tarjeta.querySelector('.producto-disponibilidad');
  if (disponibilidadTexto) disponibilidadTexto.textContent = `${disponible} unidades disponibles en tienda`;
  const badge = tarjeta.querySelector('.badge-stock');
  if (badge) {
    const estado = obtenerEstadoStock(disponible);
    badge.className = `badge-stock ${estado.clase}`;
    badge.textContent = estado.etiqueta;
  }
}

function crearItemCarrito(producto) {
  const cantidad = carrito[producto.id];
  const item = document.createElement('div');
  item.className = 'carrito-item';
  item.dataset.id = producto.id;

  item.innerHTML = `
    <img src="${imagenProducto(producto.nombre.slice(0, 12), 100)}" alt="">
    <div class="carrito-item-info">
      <p class="carrito-item-nombre">${producto.nombre}</p>
      <p class="carrito-item-precio mono">${formatearPrecio(producto.precio)} c/u</p>
      <div class="carrito-item-controles">
        <div class="stepper">
          <button class="stepper-btn" type="button" data-accion="restar" aria-label="Quitar una unidad">−</button>
          <span class="stepper-valor mono">${cantidad}</span>
          <button class="stepper-btn" type="button" data-accion="sumar" aria-label="Agregar una unidad" ${cantidad >= obtenerDisponible(producto) ? 'disabled' : ''}>+</button>
        </div>
        <span class="carrito-item-total mono">${formatearPrecio(producto.precio * cantidad)}</span>
      </div>
    </div>
    <button class="carrito-item-quitar" type="button" aria-label="Eliminar ${producto.nombre} del carrito">
      <svg class="icon" viewBox="0 0 20 20" aria-hidden="true"><path d="M4 6h12M8 6V4h4v2M6 6l1 10a1 1 0 0 0 1 1h4a1 1 0 0 0 1-1l1-10"/></svg>
    </button>
  `;
  return item;
}

function renderCarritoBody() {
  const body = document.getElementById('carritoBody');
  const ids = Object.keys(carrito);

  if (ids.length === 0) {
    body.innerHTML = '<p class="carrito-vacio" id="carritoVacio">Tu carrito está vacío. Agrega productos para verlos aquí, agrupados por sección de despacho.</p>';
    return;
  }

  // Agrupar por categoría = sección de despacho en bodega.
  const porCategoria = {};
  ids.forEach(id => {
    const producto = PRODUCTOS.find(p => p.id === id);
    if (!porCategoria[producto.categoriaId]) porCategoria[producto.categoriaId] = [];
    porCategoria[producto.categoriaId].push(producto);
  });

  body.innerHTML = '';
  CATEGORIAS.forEach(categoria => {
    const productos = porCategoria[categoria.id];
    if (!productos) return;

    const grupo = document.createElement('div');
    grupo.className = 'carrito-grupo';
    grupo.innerHTML = `<p class="carrito-grupo-titulo">${ICONOS[categoria.id] || ''} ${categoria.nombre}</p>`;
    productos.forEach(producto => grupo.appendChild(crearItemCarrito(producto)));
    body.appendChild(grupo);
  });
}

function actualizarCarritoUI() {
  const ids = Object.keys(carrito);
  const cantidadTotal = ids.reduce((acc, id) => acc + carrito[id], 0);
  const subtotal = ids.reduce((acc, id) => {
    const producto = PRODUCTOS.find(p => p.id === id);
    return acc + producto.precio * carrito[id];
  }, 0);

  document.getElementById('carritoCount').textContent = cantidadTotal;
  document.getElementById('carritoTotalHeader').textContent = formatearPrecio(subtotal);
  document.getElementById('carritoSubtotal').textContent = formatearPrecio(subtotal);
  document.getElementById('btnCheckout').disabled = cantidadTotal === 0;

  renderCarritoBody();
}

/* ---------- interacciones ---------- */

function inicializarCatalogoEventos() {
  document.getElementById('catalogo').addEventListener('click', (evento) => {
    const tarjeta = evento.target.closest('.producto-card');
    if (!tarjeta) return;
    const productoId = tarjeta.dataset.id;

    if (evento.target.closest('.btn-agregar')) {
      cambiarCantidad(productoId, 1);
      actualizarTarjetaCatalogo(productoId);
    } else if (evento.target.closest('.stepper-btn')) {
      const accion = evento.target.closest('.stepper-btn').dataset.accion;
      cambiarCantidad(productoId, accion === 'sumar' ? 1 : -1);
      actualizarTarjetaCatalogo(productoId);
    }
  });
}

function abrirCarrito() {
  const drawer = document.getElementById('carritoDrawer');
  const overlay = document.getElementById('carritoOverlay');
  const btnCarrito = document.getElementById('btnCarrito');
  if (document.body.classList.contains('en-pago')) return; // el carrito no se edita mientras se paga

  drawer.classList.add('abierto');
  drawer.setAttribute('aria-hidden', 'false');
  overlay.hidden = false;
  requestAnimationFrame(() => overlay.classList.add('visible'));
  btnCarrito.setAttribute('aria-expanded', 'true');
}

function cerrarCarrito() {
  const drawer = document.getElementById('carritoDrawer');
  const overlay = document.getElementById('carritoOverlay');
  const btnCarrito = document.getElementById('btnCarrito');

  drawer.classList.remove('abierto');
  drawer.setAttribute('aria-hidden', 'true');
  overlay.classList.remove('visible');
  btnCarrito.setAttribute('aria-expanded', 'false');
  setTimeout(() => { overlay.hidden = true; }, 150);
}

function inicializarCarritoEventos() {
  document.getElementById('btnCarrito').addEventListener('click', abrirCarrito);
  document.getElementById('btnCerrarCarrito').addEventListener('click', cerrarCarrito);
  document.getElementById('carritoOverlay').addEventListener('click', cerrarCarrito);
  document.addEventListener('keydown', (evento) => {
    if (evento.key === 'Escape') cerrarCarrito();
  });

  document.getElementById('carritoBody').addEventListener('click', (evento) => {
    const item = evento.target.closest('.carrito-item');
    if (!item) return;
    const productoId = item.dataset.id;

    if (evento.target.closest('.stepper-btn')) {
      const accion = evento.target.closest('.stepper-btn').dataset.accion;
      cambiarCantidad(productoId, accion === 'sumar' ? 1 : -1);
      actualizarTarjetaCatalogo(productoId);
    } else if (evento.target.closest('.carrito-item-quitar')) {
      delete carrito[productoId];
      actualizarCarritoUI();
      actualizarTarjetaCatalogo(productoId);
    }
  });

  document.getElementById('btnCheckout').addEventListener('click', iniciarCheckout);
}

/* ---------- checkout: reserva temporal + pago ---------- */

function cambiarVista(nombre) {
  document.getElementById('vistaCatalogo').hidden = nombre !== 'catalogo';
  document.getElementById('vistaPago').hidden = nombre !== 'pago';
  document.getElementById('vistaConfirmacion').hidden = nombre !== 'confirmacion';
  document.body.classList.toggle('en-pago', nombre !== 'catalogo');
  document.getElementById('catalogo').scrollTo?.(0, 0);
  window.scrollTo(0, 0);
}

function generarIdPedido() {
  contadorPedidos += 1;
  return `VIVA-${contadorPedidos}`;
}

// Reserva stock del inventario real (equivalente a fn_iniciar_checkout_web:
// crea la reserva y sube stock_reservado) para que nadie más pueda comprarlo
// mientras este cliente paga.
function iniciarCheckout() {
  const ids = Object.keys(carrito);
  if (!ids.length) return;

  pedidoReservado = { ...carrito };
  ids.forEach(id => {
    const producto = PRODUCTOS.find(p => p.id === id);
    if (producto) producto.stockReservado += carrito[id];
  });

  cerrarCarrito();
  renderResumenPago();
  cambiarVista('pago');
  iniciarTemporizadorReserva();
}

function renderResumenPago() {
  const contenedor = document.getElementById('pagoItems');
  const ids = Object.keys(pedidoReservado);
  let subtotal = 0;

  contenedor.innerHTML = ids.map(id => {
    const producto = PRODUCTOS.find(p => p.id === id);
    const cantidad = pedidoReservado[id];
    const total = producto.precio * cantidad;
    subtotal += total;
    return `
      <div class="pago-item">
        <span class="pago-item-nombre">${cantidad} × ${producto.nombre}</span>
        <span class="mono">${formatearPrecio(total)}</span>
      </div>`;
  }).join('');

  document.getElementById('pagoSubtotal').textContent = formatearPrecio(subtotal);
  document.getElementById('pagoTotal').textContent = formatearPrecio(subtotal);
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
  const minutos = Math.floor(reservaSegundos / 60).toString().padStart(2, '0');
  const segundos = (reservaSegundos % 60).toString().padStart(2, '0');

  const elTiempo = document.getElementById('reservaTiempo');
  if (elTiempo) elTiempo.textContent = `${minutos}:${segundos}`;

  const barra = document.getElementById('reservaBarra');
  if (barra) barra.style.width = `${Math.max(0, (reservaSegundos / DURACION_RESERVA_SEGUNDOS) * 100)}%`;

  const banner = document.getElementById('reservaBanner');
  if (banner) banner.classList.toggle('urgente', reservaSegundos <= 30);
}

// Libera lo reservado (baja stock_reservado) sin tocar el stock físico —
// equivalente a fn_liberar_reservas_expiradas cuando vence la ventana.
function liberarReserva() {
  Object.keys(pedidoReservado).forEach(id => {
    const producto = PRODUCTOS.find(p => p.id === id);
    if (producto) producto.stockReservado = Math.max(0, producto.stockReservado - pedidoReservado[id]);
  });
  pedidoReservado = {};
}

function expirarReserva() {
  liberarReserva();
  carrito = {}; // el pedido queda cancelado, igual que en el backend cuando vence la reserva
  actualizarCarritoUI();
  renderCatalogo();
  cambiarVista('catalogo');
  alert('Se agotó el tiempo para pagar. Liberamos los productos reservados para que otros clientes puedan comprarlos — vuelve a agregarlos si todavía los quieres.');
}

function cancelarPago() {
  detenerTemporizadorReserva();
  liberarReserva();
  renderCatalogo();
  cambiarVista('catalogo');
  abrirCarrito();
}

// Descuenta del stock físico (equivalente a fn_confirmar_pago_web): la venta
// queda hecha y el inventario reservado se consolida como salida real.
function confirmarPago() {
  const metodoSeleccionado = document.querySelector('input[name="metodoPago"]:checked');
  const metodo = metodoSeleccionado ? metodoSeleccionado.value : null;

  if (metodo === 'tarjeta') {
    const numero = document.getElementById('tarjetaNumero').value.trim();
    const vencimiento = document.getElementById('tarjetaVencimiento').value.trim();
    const cvv = document.getElementById('tarjetaCvv').value.trim();
    if (!numero || !vencimiento || !cvv) {
      alert('Completa los datos de la tarjeta para continuar.');
      return;
    }
  }

  detenerTemporizadorReserva();

  Object.keys(pedidoReservado).forEach(id => {
    const producto = PRODUCTOS.find(p => p.id === id);
    if (!producto) return;
    const cantidad = pedidoReservado[id];
    producto.stockCantidad -= cantidad;
    producto.stockReservado = Math.max(0, producto.stockReservado - cantidad);
  });

  document.getElementById('confirmacionPedidoId').textContent = `#${generarIdPedido()}`;

  pedidoReservado = {};
  carrito = {};
  actualizarCarritoUI();
  renderCatalogo();
  cambiarVista('confirmacion');
}

function inicializarPagoEventos() {
  document.getElementById('btnCancelarPago').addEventListener('click', cancelarPago);
  document.getElementById('btnConfirmarPago').addEventListener('click', confirmarPago);
  document.getElementById('btnVolverTienda').addEventListener('click', () => cambiarVista('catalogo'));

  const camposTarjeta = document.getElementById('camposTarjeta');
  document.getElementById('metodosPago').addEventListener('change', () => {
    document.querySelectorAll('.metodo-pago').forEach(label => {
      label.classList.toggle('seleccionado', label.querySelector('input').checked);
    });
    const metodo = document.querySelector('input[name="metodoPago"]:checked').value;
    camposTarjeta.hidden = metodo !== 'tarjeta';
  });
}

function inicializarSucursalEventos() {
  const lista = document.getElementById('sucursalLista');
  lista.innerHTML = SUCURSALES.map(sucursal => `
    <li>
      <button type="button" data-id="${sucursal.id}">
        ${sucursal.nombre}
        <span class="sucursal-stock">${sucursal.estado}</span>
      </button>
    </li>
  `).join('');

  const wrap = document.getElementById('sucursalWrap');
  const btn = document.getElementById('btnSucursal');
  const menu = document.getElementById('sucursalMenu');

  btn.addEventListener('click', () => {
    const estaAbierto = !menu.hidden;
    menu.hidden = estaAbierto;
    btn.setAttribute('aria-expanded', String(!estaAbierto));
  });

  lista.addEventListener('click', (evento) => {
    const boton = evento.target.closest('button[data-id]');
    if (!boton) return;
    const sucursal = SUCURSALES.find(s => s.id === boton.dataset.id);
    document.getElementById('sucursalActual').textContent = sucursal.nombre;
    menu.hidden = true;
    btn.setAttribute('aria-expanded', 'false');
  });

  document.addEventListener('click', (evento) => {
    if (!wrap.contains(evento.target)) {
      menu.hidden = true;
      btn.setAttribute('aria-expanded', 'false');
    }
  });
}

function inicializarBusqueda() {
  const form = document.getElementById('formBuscador');
  const input = document.getElementById('inputBuscar');
  const info = document.getElementById('resultadosInfo');

  form.addEventListener('submit', (evento) => evento.preventDefault());

  input.addEventListener('input', () => {
    const termino = input.value.trim().toLowerCase();

    if (!termino) {
      info.hidden = true;
      renderCatalogo(PRODUCTOS, true);
      return;
    }

    const encontrados = PRODUCTOS.filter(p =>
      p.nombre.toLowerCase().includes(termino) || p.marca.toLowerCase().includes(termino)
    );

    info.hidden = false;
    info.innerHTML = `<span>${encontrados.length} resultado(s) para "${input.value.trim()}"</span>`;
    renderCatalogo(encontrados, false);
  });
}

/* ---------- inicio ---------- */

function inicializar() {
  renderCategoriaNav();
  inicializarSucursalEventos();
  inicializarBusqueda();
  renderCatalogo();
  inicializarCatalogoEventos();
  inicializarCarritoEventos();
  inicializarPagoEventos();
  actualizarCarritoUI();
}

document.addEventListener('DOMContentLoaded', inicializar);