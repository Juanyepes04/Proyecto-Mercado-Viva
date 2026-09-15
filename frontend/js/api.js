// =========================================================
// MERCADO VIVA — CLIENTE API COMPARTIDO
// Usado por login.js y, en los próximos módulos, por
// cliente.js, cajero.js e inventario.js.
// =========================================================

// En Render el backend sirve también el frontend, por lo que la API vive en
// el mismo origen. En desarrollo, el frontend usa el backend local:8000.
const VIVA_API_BASE_URL = (() => {
  const configurada = window.MERCADO_VIVA_API_URL || window.MERCADO_VIVA_API_BASE;
  if (configurada) return configurada.replace(/\/$/, "");

  const esLocal = ["localhost", "127.0.0.1"].includes(window.location.hostname);
  if (esLocal && window.location.port !== "8000") return "http://localhost:8000";
  return window.location.origin;
})();

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