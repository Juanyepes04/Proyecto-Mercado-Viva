// =========================================================
// MERCADO VIVA — MÓDULO LOGIN Y REGISTRO PÚBLICO
// =========================================================

document.addEventListener("DOMContentLoaded", () => {
  // -------------------------------------------------------
  // Referencias UI: Pestañas y Paneles
  // -------------------------------------------------------
  const tabLogin = document.getElementById("tab-login");
  const tabRegistro = document.getElementById("tab-registro");
  const panelLogin = document.getElementById("panel-login");
  const panelRegistro = document.getElementById("panel-registro");
  const btnIrRegistro = document.getElementById("btn-ir-registro");
  const btnIrLogin = document.getElementById("btn-ir-login");

  // -------------------------------------------------------
  // Referencias UI: Formulario de Login
  // -------------------------------------------------------
  const formLogin = document.getElementById("form-login");
  const btnSubmitLogin = document.getElementById("btn-submit");
  const btnLabelLogin = btnSubmitLogin ? btnSubmitLogin.querySelector(".btn__label") : null;
  const errorBoxLogin = document.getElementById("login-error");
  const togglePasswordLogin = document.getElementById("toggle-password");
  const inputPasswordLogin = document.getElementById("contrasena");

  // -------------------------------------------------------
  // Referencias UI: Formulario de Registro
  // -------------------------------------------------------
  const formRegistro = document.getElementById("form-registro");
  const btnSubmitRegistro = document.getElementById("btn-reg-submit");
  const btnLabelRegistro = btnSubmitRegistro ? btnSubmitRegistro.querySelector(".btn__label") : null;
  const errorBoxRegistro = document.getElementById("registro-error");
  const successBoxRegistro = document.getElementById("registro-success");
  const togglePasswordRegistro = document.getElementById("toggle-reg-password");
  const inputPasswordRegistro = document.getElementById("reg-contrasena");

  // -------------------------------------------------------
  // Navegación entre Pestañas (Iniciar Sesión / Crear Cuenta)
  // -------------------------------------------------------
  function mostrarModo(modo) {
    const esRegistro = modo === "registro";

    // Actualizar tabs
    if (tabLogin && tabRegistro) {
      tabLogin.classList.toggle("auth-tab--active", !esRegistro);
      tabLogin.setAttribute("aria-selected", !esRegistro);
      tabRegistro.classList.toggle("auth-tab--active", esRegistro);
      tabRegistro.setAttribute("aria-selected", esRegistro);
    }

    // Mostrar/ocultar paneles
    if (panelLogin) panelLogin.hidden = esRegistro;
    if (panelRegistro) panelRegistro.hidden = !esRegistro;

    // Limpiar alertas
    hideError(errorBoxLogin);
    hideError(errorBoxRegistro);
    if (successBoxRegistro) successBoxRegistro.hidden = true;

    // Sincronizar hash de URL sin recargar
    try {
      history.replaceState(null, "", esRegistro ? "#registro" : "#login");
    } catch (_) {}

    // Foco inicial accesible
    if (esRegistro) {
      const primerInputReg = document.getElementById("reg-nombre");
      if (primerInputReg) primerInputReg.focus();
    } else {
      const primerInputLogin = document.getElementById("nombre_usuario");
      if (primerInputLogin) primerInputLogin.focus();
    }
  }

  if (tabLogin) tabLogin.addEventListener("click", () => mostrarModo("login"));
  if (tabRegistro) tabRegistro.addEventListener("click", () => mostrarModo("registro"));
  if (btnIrRegistro) btnIrRegistro.addEventListener("click", () => mostrarModo("registro"));
  if (btnIrLogin) btnIrLogin.addEventListener("click", () => mostrarModo("login"));

  // Activar registro automáticamente si la URL viene con hash #registro o query ?modo=registro
  const hash = window.location.hash.toLowerCase();
  const params = new URLSearchParams(window.location.search);
  if (hash === "#registro" || params.get("modo") === "registro") {
    mostrarModo("registro");
  }

  // -------------------------------------------------------
  // Mostrar / Ocultar Contraseña
  // -------------------------------------------------------
  function configurarTogglePassword(boton, input) {
    if (!boton || !input) return;
    boton.addEventListener("click", () => {
      const isPassword = input.type === "password";
      input.type = isPassword ? "text" : "password";
      boton.setAttribute(
        "aria-label",
        isPassword ? "Ocultar contraseña" : "Mostrar contraseña"
      );
    });
  }

  configurarTogglePassword(togglePasswordLogin, inputPasswordLogin);
  configurarTogglePassword(togglePasswordRegistro, inputPasswordRegistro);

  // -------------------------------------------------------
  // SUBMIT: INICIAR SESIÓN
  // -------------------------------------------------------
  if (formLogin) {
    formLogin.addEventListener("submit", async (event) => {
      event.preventDefault();
      hideError(errorBoxLogin);

      const nombre_usuario = formLogin.nombre_usuario.value.trim();
      const contrasena = formLogin.contrasena.value;

      if (!nombre_usuario || !contrasena) {
        showError(errorBoxLogin, "Ingresa tu usuario y contraseña.");
        return;
      }

      setLoadingLogin(true);

      try {
        // Usar /api/v1/auth/login para emitir JWT y cookie viva_session_token
        let data;
        try {
          data = await vivaApiRequest("/api/v1/auth/login", {
            method: "POST",
            body: JSON.stringify({ nombre_usuario, contrasena }),
          });
        } catch (apiV1Error) {
          // Si por alguna razón falla api_v1, intentar fallback a /usuarios/login
          data = await vivaApiRequest("/usuarios/login", {
            method: "POST",
            body: JSON.stringify({ nombre_usuario, contrasena }),
          });
        }

        if (!data || !data.access_token || !data.usuario) {
          showError(errorBoxLogin, "No se recibieron credenciales válidas.");
          return;
        }

        localStorage.setItem("viva_token", data.access_token);
        localStorage.setItem("viva_usuario", JSON.stringify(data.usuario));

        redirigirPorRol(data.usuario.rol);
      } catch (error) {
        showError(errorBoxLogin, error.message || "No se pudo iniciar sesión. Intenta de nuevo.");
      } finally {
        setLoadingLogin(false);
      }
    });
  }

  // -------------------------------------------------------
  // SUBMIT: CREAR CUENTA (REGISTRO CLIENTE)
  // -------------------------------------------------------
  if (formRegistro) {
    formRegistro.addEventListener("submit", async (event) => {
      event.preventDefault();
      hideError(errorBoxRegistro);
      if (successBoxRegistro) successBoxRegistro.hidden = true;

      const nombre = formRegistro.nombre.value.trim();
      const numero_identidad = formRegistro.numero_identidad.value.trim();
      const nombre_usuario = formRegistro.nombre_usuario.value.trim();
      const correo = formRegistro.correo.value.trim().toLowerCase();
      const contrasena = formRegistro.contrasena.value;
      const direccion = formRegistro.direccion ? formRegistro.direccion.value.trim() : "";

      // Validaciones en cliente
      if (!nombre || !numero_identidad || !nombre_usuario || !correo || !contrasena) {
        showError(errorBoxRegistro, "Por favor completa todos los campos obligatorios (*).");
        return;
      }

      if (nombre.length < 2) {
        showError(errorBoxRegistro, "El nombre debe contener al menos 2 caracteres.");
        return;
      }

      if (numero_identidad.length < 4) {
        showError(errorBoxRegistro, "El documento de identidad debe tener al menos 4 caracteres.");
        return;
      }

      if (nombre_usuario.length < 3) {
        showError(errorBoxRegistro, "El nombre de usuario debe tener al menos 3 caracteres.");
        return;
      }

      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(correo)) {
        showError(errorBoxRegistro, "Ingresa una dirección de correo electrónico válida.");
        return;
      }

      if (contrasena.length < 4) {
        showError(errorBoxRegistro, "La contraseña debe tener al menos 4 caracteres.");
        return;
      }

      setLoadingRegistro(true);

      try {
        const payload = {
          nombre,
          numero_identidad,
          nombre_usuario,
          correo,
          contrasena,
          direccion: direccion || null,
        };

        const data = await vivaApiRequest("/api/v1/auth/registro", {
          method: "POST",
          body: JSON.stringify(payload),
        });

        if (!data || !data.access_token || !data.usuario) {
          throw new Error("No se pudo completar el registro automático.");
        }

        // Guardar sesión del usuario recién creado
        localStorage.setItem("viva_token", data.access_token);
        localStorage.setItem("viva_usuario", JSON.stringify(data.usuario));

        if (successBoxRegistro) {
          successBoxRegistro.textContent =
            `¡Bienvenido a Mercado VIVA, ${data.usuario.nombre || nombre}! Tu saldo promocional de $50.000 COP ya está disponible. Redirigiendo a la tienda...`;
          successBoxRegistro.hidden = false;
        }

        // Redirigir suavemente al canal del cliente
        setTimeout(() => {
          redirigirPorRol("cliente");
        }, 1200);

      } catch (error) {
        showError(errorBoxRegistro, error.message || "No se pudo registrar la cuenta. Verifica los datos.");
      } finally {
        setLoadingRegistro(false);
      }
    });
  }

  // -------------------------------------------------------
  // Funciones Auxiliares
  // -------------------------------------------------------
  function redirigirPorRol(rol) {
    const destinos = {
      cliente: "cliente.html",
      cajero: "/sistema/caja",
      abastecedor: "/sistema/inventario",
      admin: "/sistema/admin",
    };
    window.location.href = destinos[rol] || "cliente.html";
  }

  function showError(box, mensaje) {
    if (!box) return;
    box.textContent = mensaje;
    box.hidden = false;
  }

  function hideError(box) {
    if (!box) return;
    box.hidden = true;
    box.textContent = "";
  }

  function setLoadingLogin(isLoading) {
    if (btnSubmitLogin) btnSubmitLogin.disabled = isLoading;
    if (btnLabelLogin) btnLabelLogin.textContent = isLoading ? "Ingresando..." : "Iniciar sesión";
  }

  function setLoadingRegistro(isLoading) {
    if (btnSubmitRegistro) btnSubmitRegistro.disabled = isLoading;
    if (btnLabelRegistro) btnLabelRegistro.textContent = isLoading ? "Creando cuenta..." : "Crear cuenta y comenzar";
  }
});