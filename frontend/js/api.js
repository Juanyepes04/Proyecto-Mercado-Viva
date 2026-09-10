// =========================================================
// MERCADO VIVA — CLIENTE API COMPARTIDO
// Usado por login.js y, en los próximos módulos, por
// cliente.js, cajero.js e inventario.js.
// =========================================================

// Ajusta esta URL al host/puerto donde corre el backend FastAPI.
const VIVA_API_BASE_URL = "http://localhost:8000";

/**
 * Llama a la API de Mercado VIVA y devuelve el JSON de la respuesta.
 * Lanza un Error con el mensaje del backend (detail o mensaje) si
 * la respuesta no es exitosa.
 */
async function vivaApiRequest(path, options = {}) {
  const response = await fetch(`${VIVA_API_BASE_URL}${path}`, {
    headers: {
      "Content-Type": "application/json",
      ...(options.headers || {}),
    },
    ...options,
  });

  let data = null;
  try {
    data = await response.json();
  } catch (_) {
    data = null;
  }

  if (!response.ok) {
    const mensaje =
      (data && data.detail) ||
      (data && data.mensaje) ||
      "Ocurrió un error al comunicarse con el servidor.";
    throw new Error(mensaje);
  }

  return data;
}