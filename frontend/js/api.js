// =========================================================
// MERCADO VIVA — CLIENTE API COMPARTIDO
// Usado por login.js y, en los próximos módulos, por
// cliente.js, cajero.js e inventario.js.
// =========================================================

// Ajusta esta URL al host/puerto donde corre el backend FastAPI.
const VIVA_API_BASE_URL =
  (window.location.port === "8000" ||
   window.location.hostname === "localhost" ||
   window.location.hostname === "127.0.0.1")
    ? (window.location.port === "8000"
        ? window.location.origin
        : "http://localhost:8000")
    : window.location.origin;

/**
 * Llama a la API de Mercado VIVA y devuelve el JSON de la respuesta.
 * Lanza un Error con el mensaje del backend (detail o mensaje) si
 * la respuesta no es exitosa.
 */
async function vivaApiRequest(path, options = {}) {
  const token = localStorage.getItem("viva_token");
  const headers = {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(options.headers || {}),
  };

  const response = await fetch(`${VIVA_API_BASE_URL}${path}`, {
    ...options,
    credentials: options.credentials || "include",
    headers,
  });

  let data = null;
  try {
    data = await response.json();
  } catch (_) {
    data = null;
  }

  if (!response.ok) {
    let mensaje = "Ocurrió un error al comunicarse con el servidor.";
    if (data) {
      if (typeof data.detail === "string") {
        mensaje = data.detail;
      } else if (Array.isArray(data.detail) && data.detail.length > 0) {
        mensaje = data.detail
          .map((err) => {
            const campo = err.loc ? err.loc[err.loc.length - 1] : "";
            const prefijo = campo && campo !== "body" ? `Campo '${campo}': ` : "";
            return `${prefijo}${err.msg || err.message}`;
          })
          .join(". ");
      } else if (data.mensaje) {
        mensaje = data.mensaje;
      }
    }
    throw new Error(mensaje);
  }

  return data;
}