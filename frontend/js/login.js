// =========================================================
// MERCADO VIVA — MÓDULO LOGIN
// =========================================================

document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("form-login");
  const btnSubmit = document.getElementById("btn-submit");
  const btnLabel = btnSubmit.querySelector(".btn__label");
  const errorBox = document.getElementById("login-error");
  const togglePassword = document.getElementById("toggle-password");
  const inputPassword = document.getElementById("contrasena");

  // Mostrar / ocultar contraseña
  togglePassword.addEventListener("click", () => {
    const isPassword = inputPassword.type === "password";
    inputPassword.type = isPassword ? "text" : "password";
    togglePassword.setAttribute(
      "aria-label",
      isPassword ? "Ocultar contraseña" : "Mostrar contraseña"
    );
  });

  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    hideError();

    const nombre_usuario = form.nombre_usuario.value.trim();
    const contrasena = form.contrasena.value;

    if (!nombre_usuario || !contrasena) {
      showError("Ingresa tu usuario y contraseña.");
      return;
    }

    setLoading(true);

    try {
      const usuario = await vivaApiRequest("/usuarios/login", {
        method: "POST",
        body: JSON.stringify({ nombre_usuario, contrasena }),
      });

      // Nota: /usuarios/login hoy responde 200 con {"mensaje": "..."}
      // cuando las credenciales son incorrectas (no un 401/HTTPException),
      // así que validamos la forma de la respuesta en vez de solo el status.
      if (!usuario || !usuario.rol) {
        showError(
          (usuario && usuario.mensaje) || "Usuario o contraseña incorrectos."
        );
        return;
      }

      localStorage.setItem("viva_usuario", JSON.stringify(usuario));
      redirigirPorRol(usuario.rol);
    } catch (error) {
      showError(error.message || "No se pudo iniciar sesión. Intenta de nuevo.");
    } finally {
      setLoading(false);
    }
  });

  function redirigirPorRol(rol) {
    const destinos = {
      cliente: "cliente.html",
      cajero: "cajero.html",
      abastecedor: "inventario.html",
      admin: "inventario.html",
    };
    window.location.href = destinos[rol] || "index.html";
  }

  function showError(mensaje) {
    errorBox.textContent = mensaje;
    errorBox.hidden = false;
  }

  function hideError() {
    errorBox.hidden = true;
    errorBox.textContent = "";
  }

  function setLoading(isLoading) {
    btnSubmit.disabled = isLoading;
    btnLabel.textContent = isLoading ? "Ingresando..." : "Iniciar sesión";
  }
});