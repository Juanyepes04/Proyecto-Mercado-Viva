/**
 * MERCADO VIVA — Portal Operativo de Empleados
 * Autenticación y Redirección Basada en Roles
 */
document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("form-login-empleados");
  const btnSubmit = document.getElementById("btn-ingresar");
  const btnLabel = btnSubmit.querySelector(".btn__label");
  const errorBox = document.getElementById("alerta-error");
  const togglePassword = document.getElementById("toggle-password");
  const inputPassword = document.getElementById("contrasena");

  // Mostrar / ocultar contraseña
  if (togglePassword && inputPassword) {
    togglePassword.addEventListener("click", () => {
      const isPassword = inputPassword.type === "password";
      inputPassword.type = isPassword ? "text" : "password";
      togglePassword.setAttribute("aria-label", isPassword ? "Ocultar contraseña" : "Mostrar contraseña");
    });
  }

  // Verificar parámetros de error en URL (por intentos de acceso no autorizados)
  procesarErroresURL();

  // Si ya existe sesión activa de colaborador, redirigir automáticamente
  verificarSesionExistente();

  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    limpiarError();

    const nombre_usuario = form.nombre_usuario.value.trim();
    const contrasena = form.contrasena.value;

    if (!nombre_usuario || !contrasena) {
      mostrarError("Ingresa tu usuario institucional y contraseña.");
      return;
    }

    setLoading(true);

    try {
      const response = await fetch("/api/v1/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nombre_usuario, contrasena }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.detail || "Usuario o contraseña incorrectos.");
      }

      // REGLA DE NEGOCIO: Un cliente no puede usar este portal
      if (data.rol === "cliente") {
        throw new Error(
          "Este portal es exclusivo para personal de tienda y bodega. " +
          "Si eres cliente, por favor ingresa desde el sitio web principal."
        );
      }

      // 1. Guardar sesión y token en localStorage
      localStorage.setItem("viva_token", data.access_token);
      localStorage.setItem("viva_usuario", JSON.stringify(data.usuario));

      // 2. Redirección condicional según el rol
      redireccionarPorRol(data.rol);
    } catch (error) {
      mostrarError(error.message);
    } finally {
      setLoading(false);
    }
  });

  function redireccionarPorRol(rol) {
    switch (rol) {
      case "cajero":
        window.location.href = "/sistema/caja";
        break;
      case "abastecedor":
        window.location.href = "/sistema/inventario";
        break;
      case "admin":
        window.location.href = "/sistema/admin";
        break;
      default:
        mostrarError(`El rol '${rol}' no tiene una terminal asignada.`);
    }
  }

  function verificarSesionExistente() {
    try {
      const usuario = JSON.parse(localStorage.getItem("viva_usuario") || "null");
      const token = localStorage.getItem("viva_token");
      if (token && usuario && usuario.rol !== "cliente") {
        redireccionarPorRol(usuario.rol);
      }
    } catch (_) {}
  }

  function procesarErroresURL() {
    const params = new URLSearchParams(window.location.search);
    const error = params.get("error");
    if (error === "auth_required") {
      mostrarError("Debes iniciar sesión con tu cuenta de colaborador para acceder a esta terminal.");
    } else if (error === "insufficient_role") {
      mostrarError("No tienes los permisos asignados para acceder a la terminal solicitada.");
    } else if (error === "session_expired") {
      mostrarError("Tu sesión ha expirado por inactividad. Ingresa nuevamente.");
    }
  }

  function mostrarError(mensaje) {
    errorBox.textContent = mensaje;
    errorBox.hidden = false;
  }

  function limpiarError() {
    errorBox.textContent = "";
    errorBox.hidden = true;
  }

  function setLoading(isLoading) {
    btnSubmit.disabled = isLoading;
    btnLabel.textContent = isLoading ? "Verificando terminal..." : "Ingresar a terminal";
  }
});
