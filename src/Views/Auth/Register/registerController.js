/**
 * Controlador para la página de registro de clientes
 * Maneja la lógica de registro y validación del formulario
 */
import './register.css';
import * as api from "../../../Helpers/api.js";
import { manejarErrores } from "../../../Helpers/manejoErrores.js";
import * as validacion from "../../../Helpers/validaciones.js";
import { success, error } from "../../../Helpers/alertas.js";
import { userManager } from '../../../Helpers/userManager.js';

/**
 * Función principal del controlador de Registro
 * Configura validaciones y eventos del formulario
 */
export const registerController = () => {
  // Si ya está autenticado, redirigir
  if (localStorage.getItem('accessToken')) {
    if (userManager.tienePermiso('dashboard' || userManager.tienePermiso('*'))) {
      location.hash = '#Dashboard';
    } else {
        location.hash = '#Home';
    }
    return;
  }

  configurarValidaciones();
  configurarFormulario();
};

/**
 * Configura las validaciones en tiempo real para los campos del formulario
 */
const configurarValidaciones = () => {
  const nombre = document.querySelector('#nombre');
  const email = document.querySelector('#email');
  const password = document.querySelector('#password');
  const telefono = document.querySelector('#telefono');

  if (nombre) {
    nombre.addEventListener('blur', validacion.validarCampo);
    nombre.addEventListener('keydown', (e) => {
      validacion.validarCampo(e);
      validacion.validarLimite(e, 100);
    });
  }
  if (email) {
    email.addEventListener('blur', validacion.validarCampo);
    email.addEventListener('keydown', (e) => {
      validacion.validarCampo(e);
      validacion.validarLimite(e, 100);
    });
  }
  if (password) {
    password.addEventListener('blur', validacion.validarCampo);
    password.addEventListener('keydown', (e) => {
      validacion.validarCampo(e);
      validacion.validarLimite(e, 50);
    });
  }
  if (telefono) {
    telefono.addEventListener('blur', validacion.validarCampo);
    telefono.addEventListener('keydown', (e) => {
      validacion.validarCampo(e);
      validacion.validarLimite(e, 20);
    });
  }
};

/**
 * Configura el evento de envío del formulario
 */
const configurarFormulario = () => {
  const form = document.querySelector('#registerForm');
  if (form) {
    form.addEventListener('submit', manejarRegistro);
  }
};

/**
 * Maneja el proceso de registro
 * @param {Event} evento - Evento submit del formulario
 */
const manejarRegistro = async (evento) => {
  evento.preventDefault();

  // Obtener los campos
  const nombreInput = document.getElementById('nombre');
  const emailInput = document.getElementById('email');
  const passwordInput = document.getElementById('password');
  const telefonoInput = document.getElementById('telefono');
  const nombreError = document.getElementById('nombreError');
  const emailError = document.getElementById('emailError');
  const passwordError = document.getElementById('passwordError');
  let valid = true;

  // Validar nombre
  if (!nombreInput.value.trim()) {
    nombreError.textContent = 'El nombre es obligatorio.';
    nombreError.classList.add('show');
    valid = false;
  } else {
    nombreError.textContent = '';
    nombreError.classList.remove('show');
  }

  // Validar email
  if (!emailInput.value.trim()) {
    emailError.textContent = 'El correo es obligatorio.';
    emailError.classList.add('show');
    valid = false;
  } else if (!validacion.validarEmail(emailInput.value.trim())) {
    emailError.textContent = 'El correo no es válido.';
    emailError.classList.add('show');
    valid = false;
  } else {
    emailError.textContent = '';
    emailError.classList.remove('show');
  }

  // Validar contraseña
  if (!passwordInput.value.trim()) {
    passwordError.textContent = 'La contraseña es obligatoria.';
    passwordError.classList.add('show');
    valid = false;
  } else if (passwordInput.value.trim().length < 6) {
    passwordError.textContent = 'La contraseña debe tener al menos 6 caracteres.';
    passwordError.classList.add('show');
    valid = false;
  } else {
    passwordError.textContent = '';
    passwordError.classList.remove('show');
  }

  if (!valid) {
    return;
  }

  // Mostrar estado de carga
  mostrarCargando(true);

  try {
    // Datos para el backend
    const datosRegistro = {
      nombre_usuario: nombreInput.value.trim(),
      correo: emailInput.value.trim(),
      contraseña: passwordInput.value.trim(),
      telefono: telefonoInput ? telefonoInput.value.trim() : '',
      id_rol: 2 // Rol de usuario por defecto
    };

    // Petición de registro
    const respuesta = await api.post('/auth/registro', datosRegistro, false);

    if (respuesta.success) {
      await success(respuesta.message || 'Registro exitoso');
      location.hash = '#Login';
    } else {
      if (respuesta.message) {
        const generalError = document.getElementById('generalError');
        if (generalError) {
          generalError.style.display = 'flex';
          generalError.querySelector('span').textContent = respuesta.message;
        }
      }
      await manejarErrores(respuesta);
    }
  } catch (errorCapturado) {
    console.error('Error en el proceso de registro:', errorCapturado);
    const generalError = document.getElementById('generalError');
    if (generalError) {
      generalError.style.display = 'flex';
      generalError.querySelector('span').textContent = 'Error de conexión. Por favor, intenta nuevamente.';
    }
  } finally {
    mostrarCargando(false);
  }
};

/**
 * Controla el estado visual de carga del botón
 * @param {boolean} cargando - Si mostrar estado de carga
 */
const mostrarCargando = (cargando) => {
  const btnRegister = document.querySelector('#btnRegister');
  const btnText = document.querySelector('#btnText');
  const btnLoading = document.querySelector('#btnLoading');
  if (btnRegister && btnText && btnLoading) {
    if (cargando) {
      btnRegister.disabled = true;
      btnText.style.display = 'none';
      btnLoading.style.display = 'inline-block';
    } else {
      btnRegister.disabled = false;
      btnText.style.display = 'inline';
      btnLoading.style.display = 'none';
    }
  }
};
