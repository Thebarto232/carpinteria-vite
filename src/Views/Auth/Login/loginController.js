/**
 * Controlador para la página de inicio de sesión
 * Maneja la lógica de autenticación y validación del formulario
 */
import './login.css';
import * as api from "../../../Helpers/api.js";
import { manejarErrores } from "../../../Helpers/manejoErrores.js";
import * as validacion from "../../../Helpers/validaciones.js";
import { success, error } from "../../../Helpers/alertas.js";
import { userManager } from '../../../Helpers/userManager.js';

/**
 * Función principal del controlador de Login
 * Configura validaciones y eventos del formulario
 */
export const loginController = () => {
  // Verificar si ya está autenticado
  if (localStorage.getItem('accessToken')) {
    verificarYRedirigir();
    return;
  }

  // Configurar validaciones y eventos
  configurarValidaciones();
  configurarFormulario();
};

/**
 * Verifica si el usuario ya está autenticado y redirige según sus permisos
 */
const verificarYRedirigir = async () => {
  try {
    const permisos = JSON.parse(localStorage.getItem('permisos') || '[]');
    const puedeAccederDashboard = permisos.some(p => p === 'dashboard' || p === '*');
    
    if (puedeAccederDashboard) {
      location.hash = '#Dashboard';
    } else {
      location.hash = '#Home';
    }
  } catch (error) {
    // Si hay error con los permisos, limpiar y quedarse en login
    localStorage.clear();
  }
};

/**
 * Configura las validaciones en tiempo real para los campos del formulario
 */
const configurarValidaciones = () => {
  const email = document.querySelector('#email');
  const password = document.querySelector('#password');

  if (email) {
    // Validar email en blur (cuando pierde el foco)
    email.addEventListener('blur', validacion.validarCampo);
    
    // Validar email en tiempo real y limitar caracteres
    email.addEventListener('keydown', (e) => {
      validacion.validarCampo(e);
      validacion.validarLimite(e, 100);
    });
  }

  if (password) {
    // Validar contraseña en blur
    password.addEventListener('blur', validacion.validarCampo);
    
    // Validar contraseña en tiempo real y limitar caracteres
    password.addEventListener('keydown', (e) => {
      validacion.validarCampo(e);
      validacion.validarLimite(e, 50);
    });
  }

  // Configurar toggle de contraseña
  const togglePassword = document.querySelector('#togglePassword');
  if (togglePassword && password) {
    togglePassword.addEventListener('click', () => {
      const tipo = password.type === 'password' ? 'text' : 'password';
      password.type = tipo;
      
      const icono = togglePassword.querySelector('i');
      if (icono) {
        icono.setAttribute('data-lucide', tipo === 'password' ? 'eye' : 'eye-off');
        // Reinicializar iconos para actualizar el cambio
        if (window.lucide) {
          window.lucide.createIcons();
        }
      }
    });
  }

  // Prevenir pérdida de datos no guardados
  document.addEventListener('beforeunload', (e) => {
    if (email?.value.trim() || password?.value.trim()) {
      e.preventDefault();
      e.returnValue = ''; // Para navegadores más antiguos
    }
  });
};

/**
 * Configura el evento de envío del formulario
 */
const configurarFormulario = () => {
  const form = document.querySelector('#loginForm');
  
  if (form) {
    form.addEventListener('submit', manejarLogin);
  }
};

/**
 * Maneja el proceso de inicio de sesión
 * @param {Event} evento - Evento submit del formulario
 */
const manejarLogin = async (evento) => {
  evento.preventDefault();

  // Obtener los campos
  const emailInput = document.getElementById('email');
  const passwordInput = document.getElementById('password');
  const emailError = document.getElementById('emailError');
  const passwordError = document.getElementById('passwordError');
  let valid = true;

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
    // Transformar los datos al formato que espera el backend
    const datosLogin = {
      correo: emailInput.value.trim(),
      contraseña: passwordInput.value.trim()
    };

    // Realizar petición de login a la API
    const respuesta = await api.post('/auth/login', datosLogin, false);
    console.log(respuesta);
    if (respuesta.success) {
      // Login exitoso - guardar datos en localStorage
      await guardarDatosUsuario(respuesta.data);
      // Mostrar mensaje de éxito
      await success(respuesta.message || 'Inicio de sesión exitoso');
      // Disparar evento personalizado para notificar cambio de estado
      const eventoAuth = new CustomEvent('authStateChanged', {
        detail: {
          usuario: respuesta.data.usuario,
          autenticado: true
        },
        bubbles: true,
        cancelable: true
      });
      document.dispatchEvent(eventoAuth);
      // Redirigir según permisos
      redirigirSegunPermisos(respuesta.data.usuario);
    } else {
      if (respuesta.detalles) {
        const message = respuesta.detalles[0].mensaje;
        error(message || 'Error desconocido');
      } else {
        error(respuesta.message || 'Error desconocido');
      }
      
    }
  } catch (errorCapturado) {
    error(respuesta.message || 'Error desconocido');
  } finally {

    // Ocultar estado de carga
    mostrarCargando(false);
  }
};

/**
 * Guarda los datos del usuario en localStorage
 * @param {Object} data - Datos de respuesta del login
 */
const guardarDatosUsuario = async (data) => {
  try {
    // Guardar tokens
    if (data.accessToken) {
      localStorage.setItem('accessToken', data.accessToken);
    }
    
    if (data.refreshToken) {
      localStorage.setItem('refreshToken', data.refreshToken);
    }
    
    // Guardar información del usuario
    if (data.usuario) {
      localStorage.setItem('usuario', JSON.stringify(data.usuario));
      
      // Guardar permisos si están disponibles
      if (data.usuario.permisos) {
        localStorage.setItem('permisos', JSON.stringify(data.usuario.permisos));
      }
      
      // Guardar rol si está disponible
      if (data.usuario.rol) {
        localStorage.setItem('rol', JSON.stringify(data.usuario.rol));
      }
    }

    userManager.cargarDatosLocales();
    
  } catch (error) {
    console.error('Error al guardar datos del usuario:', error);
    throw new Error('Error al procesar los datos del usuario');
  }
};

/**
 * Redirige al usuario según sus permisos
 * @param {Object} usuario - Datos del usuario autenticado
 */
const redirigirSegunPermisos = (usuario) => {
  try {
    const permisos = usuario.permisos || [];
    
    // Verificar si tiene permiso para acceder al dashboard
    const puedeAccederDashboard = permisos.some(p => p === 'dashboard' || p === '*');
    
    if (puedeAccederDashboard) {
      location.hash = '#Dashboard';
    } else {
      // Si no tiene permisos para dashboard, redirigir a home
      location.hash = '#Home';
    }
    
  } catch (error) {
    console.error('Error al verificar permisos:', error);
    // En caso de error, redirigir a home por seguridad
    location.hash = '#/Home';
  }
};

/**
 * Controla el estado visual de carga del botón
 * @param {boolean} cargando - Si mostrar estado de carga
 */
const mostrarCargando = (cargando) => {
  const btnLogin = document.querySelector('#btnLogin');
  const btnText = document.querySelector('#btnText');
  const btnLoading = document.querySelector('#btnLoading');
  
  if (btnLogin && btnText && btnLoading) {
    if (cargando) {
      btnLogin.disabled = true;
      btnText.style.display = 'none';
      btnLoading.style.display = 'inline-block';
    } else {
      btnLogin.disabled = false;
      btnText.style.display = 'inline';
      btnLoading.style.display = 'none';
    }
  }
};
