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
function cargarDepartamentosCiudades() {
  const departamentosCiudades = {
    "Amazonas": ["Leticia", "Puerto Nariño"],
    "Antioquia": ["Medellín", "Envigado", "Bello", "Itagüí", "Rionegro"],
    "Atlántico": ["Barranquilla", "Soledad", "Malambo"],
    "Bolívar": ["Cartagena", "Magangué", "Turbaco"],
    "Boyacá": ["Tunja", "Duitama", "Sogamoso"],
    "Caldas": ["Manizales", "Villamaría", "La Dorada"],
    "Caquetá": ["Florencia"],
    "Cauca": ["Popayán", "Santander de Quilichao"],
    "Cesar": ["Valledupar", "Aguachica"],
    "Córdoba": ["Montería", "Lorica"],
    "Cundinamarca": ["Soacha", "Zipaquirá", "Girardot"],
    "Chocó": ["Quibdó"],
    "Huila": ["Neiva", "Pitalito"],
    "La Guajira": ["Riohacha", "Maicao"],
    "Magdalena": ["Santa Marta", "Ciénaga"],
    "Meta": ["Villavicencio", "Acacías"],
    "Nariño": ["Pasto", "Ipiales"],
    "Norte de Santander": ["Cúcuta", "Ocaña"],
    "Quindío": ["Armenia", "Calarcá"],
    "Risaralda": ["Pereira", "Dosquebradas"],
    "Santander": ["Bucaramanga", "Floridablanca", "Girón", "Piedecuesta"],
    "Sucre": ["Sincelejo"],
    "Tolima": ["Ibagué", "Espinal"],
    "Valle del Cauca": ["Cali", "Palmira", "Buenaventura", "Tuluá"],
    "Vaupés": ["Mitú"],
    // ...continúa la lista...
  };
  const departamentoSelect = document.getElementById('departamento');
  const ciudadSelect = document.getElementById('ciudad');
  // Llenar departamentos solo si país es Colombia
  const paisSelect = document.getElementById('pais');
  function llenarDepartamentos() {
    departamentoSelect.innerHTML = '<option value="">Selecciona departamento</option>';
    ciudadSelect.innerHTML = '<option value="">Selecciona ciudad</option>';
    if (paisSelect.value === 'Colombia') {
      Object.keys(departamentosCiudades).forEach(dep => {
        const opt = document.createElement('option');
        opt.value = dep;
        opt.textContent = dep;
        departamentoSelect.appendChild(opt);
      });
    }
  }
  paisSelect.addEventListener('change', llenarDepartamentos);
  llenarDepartamentos();
  // Evento para llenar ciudades según departamento
  departamentoSelect.addEventListener('change', function() {
    const dep = departamentoSelect.value;
    ciudadSelect.innerHTML = '<option value="">Selecciona ciudad</option>';
    if (dep && departamentosCiudades[dep]) {
      departamentosCiudades[dep].forEach(ciudad => {
        const opt = document.createElement('option');
        opt.value = ciudad;
        opt.textContent = ciudad;
        ciudadSelect.appendChild(opt);
      });
    }
  });
}

export const registerController = () => {
  cargarDepartamentosCiudades();
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
  const direccionInput = document.getElementById('direccion');
  const ciudadInput = document.getElementById('ciudad');
  const departamentoInput = document.getElementById('departamento');
  const codigoPostalInput = document.getElementById('codigo_postal');
  const paisInput = document.getElementById('pais');
  const nombreError = document.getElementById('nombreError');
  const emailError = document.getElementById('emailError');
  const passwordError = document.getElementById('passwordError');
  const direccionError = document.getElementById('direccionError');
  const ciudadError = document.getElementById('ciudadError');
  const departamentoError = document.getElementById('departamentoError');
  const paisError = document.getElementById('paisError');
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

  // Validar dirección
  if (!direccionInput.value.trim()) {
    direccionError.textContent = 'La dirección es obligatoria.';
    direccionError.classList.add('show');
    valid = false;
  } else {
    direccionError.textContent = '';
    direccionError.classList.remove('show');
  }
  // Validar ciudad
  if (!ciudadInput.value) {
    ciudadError.textContent = 'La ciudad es obligatoria.';
    ciudadError.classList.add('show');
    valid = false;
  } else {
    ciudadError.textContent = '';
    ciudadError.classList.remove('show');
  }
  // Validar departamento
  if (!departamentoInput.value) {
    departamentoError.textContent = 'El departamento es obligatorio.';
    departamentoError.classList.add('show');
    valid = false;
  } else {
    departamentoError.textContent = '';
    departamentoError.classList.remove('show');
  }
  // Validar país
  if (!paisInput.value) {
    paisError.textContent = 'El país es obligatorio.';
    paisError.classList.add('show');
    valid = false;
  } else {
    paisError.textContent = '';
    paisError.classList.remove('show');
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
      direccion: direccionInput.value.trim(),
      ciudad: ciudadInput.value,
      departamento: departamentoInput.value,
      codigo_postal: codigoPostalInput ? codigoPostalInput.value.trim() : '',
      pais: paisInput.value,
      id_rol: 2 // Rol de usuario por defecto
    };

// --- Lógica para selects dependientes ---
function cargarDepartamentosCiudades() {
  const departamentosCiudades = {
    "Amazonas": ["Leticia", "Puerto Nariño"],
    "Antioquia": ["Medellín", "Envigado", "Bello", "Itagüí", "Rionegro"],
    "Atlántico": ["Barranquilla", "Soledad", "Malambo"],
    "Bolívar": ["Cartagena", "Magangué", "Turbaco"],
    "Boyacá": ["Tunja", "Duitama", "Sogamoso"],
    "Caldas": ["Manizales", "Villamaría", "La Dorada"],
    "Caquetá": ["Florencia"],
    "Cauca": ["Popayán", "Santander de Quilichao"],
    "Cesar": ["Valledupar", "Aguachica"],
    "Córdoba": ["Montería", "Lorica"],
    "Cundinamarca": ["Soacha", "Zipaquirá", "Girardot"],
    "Chocó": ["Quibdó"],
    "Huila": ["Neiva", "Pitalito"],
    "La Guajira": ["Riohacha", "Maicao"],
    "Magdalena": ["Santa Marta", "Ciénaga"],
    "Meta": ["Villavicencio", "Acacías"],
    "Nariño": ["Pasto", "Ipiales"],
    "Norte de Santander": ["Cúcuta", "Ocaña"],
    "Quindío": ["Armenia", "Calarcá"],
    "Risaralda": ["Pereira", "Dosquebradas"],
    "Santander": ["Bucaramanga", "Floridablanca", "Girón", "Piedecuesta"],
    "Sucre": ["Sincelejo"],
    "Tolima": ["Ibagué", "Espinal"],
    "Valle del Cauca": ["Cali", "Palmira", "Buenaventura", "Tuluá"],
    "Vaupés": ["Mitú"],
    "Vichada": ["Puerto Carreño"]
  };
  const departamentoSelect = document.getElementById('departamento');
  const ciudadSelect = document.getElementById('ciudad');
  // Llenar departamentos solo si país es Colombia
  const paisSelect = document.getElementById('pais');
  function llenarDepartamentos() {
    departamentoSelect.innerHTML = '<option value="">Selecciona departamento</option>';
    ciudadSelect.innerHTML = '<option value="">Selecciona ciudad</option>';
    if (paisSelect.value === 'Colombia') {
      Object.keys(departamentosCiudades).forEach(dep => {
        const opt = document.createElement('option');
        opt.value = dep;
        opt.textContent = dep;
        departamentoSelect.appendChild(opt);
      });
    }
  }
  paisSelect.addEventListener('change', llenarDepartamentos);
  llenarDepartamentos();
  // Evento para llenar ciudades según departamento
  departamentoSelect.addEventListener('change', function() {
    const dep = departamentoSelect.value;
    ciudadSelect.innerHTML = '<option value="">Selecciona ciudad</option>';
    if (dep && departamentosCiudades[dep]) {
      departamentosCiudades[dep].forEach(ciudad => {
        const opt = document.createElement('option');
        opt.value = ciudad;
        opt.textContent = ciudad;
        ciudadSelect.appendChild(opt);
      });
    }
  });
}

    console.log('Datos de registro:', datosRegistro);
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
      } else if (respuesta.detalles) {
        // Manejar errores específicos
        let mensaje = respuesta.detalles
          .map(e => `${e.campo}: ${e.mensaje}`)
          .join('\n');
        console.log(respuesta.detalles);
        console.log('Mensaje de error:', mensaje);
        error(mensaje);
      }
      //await manejarErrores(respuesta);
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
