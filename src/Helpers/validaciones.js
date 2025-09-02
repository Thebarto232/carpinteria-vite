/**
 * Helper para manejo de validaciones de formularios
 * Proporciona funciones para validar campos y formularios completos
 */

// Objeto para almacenar los datos del formulario válidos
export let datos = {};

/**
 * Valida un campo individual del formulario
 * @param {Event} evento - Evento del campo (blur, keydown, etc.)
 */
export const validarCampo = (evento) => {
  const campo = evento.target;
  const valor = campo.value.trim();
  const nombre = campo.name;

  // Limpiar clases de validación previas
  campo.classList.remove('is-valid', 'is-invalid');

  // Validar que el campo no esté vacío
  if (!valor) {
    mostrarError(campo, 'Este campo es obligatorio');
    delete datos[nombre];
    return false;
  }

  // Validaciones específicas por tipo de campo
  switch (campo.type) {
    case 'email':
      if (!validarEmail(valor)) {
        mostrarError(campo, 'Ingresa un email válido');
        delete datos[nombre];
        return false;
      }
      break;
      
    case 'password':
      if (valor.length < 6) {
        mostrarError(campo, 'La contraseña debe tener al menos 6 caracteres');
        delete datos[nombre];
        return false;
      }
      break;
  }

  // Si llegamos aquí, el campo es válido
  mostrarExito(campo);
  datos[nombre] = valor;
  return true;
};

/**
 * Valida la longitud máxima de un campo durante la escritura
 * @param {Event} evento - Evento keydown
 * @param {number} limite - Límite máximo de caracteres
 */
export const validarLimite = (evento, limite) => {
  const campo = evento.target;
  
  // Permitir teclas de control (backspace, delete, arrows, etc.)
  const teclasPermitidas = [
    'Backspace', 'Delete', 'ArrowLeft', 'ArrowRight', 
    'ArrowUp', 'ArrowDown', 'Tab', 'Escape', 'Enter'
  ];
  
  if (teclasPermitidas.includes(evento.key)) {
    return;
  }
  
  // Prevenir entrada si se excede el límite
  if (campo.value.length >= limite) {
    evento.preventDefault();
    mostrarAdvertencia(campo, `Máximo ${limite} caracteres`);
  }
};

/**
 * Valida todos los campos de un formulario
 * @param {Event} evento - Evento submit del formulario
 * @returns {boolean} true si todos los campos son válidos
 */
export const validarCampos = (evento) => {
  const formulario = evento.target;
  const campos = formulario.querySelectorAll('input, textarea, select');
  let formularioValido = true;

  // Limpiar el objeto de datos
  datos = {};

  // Validar cada campo
  campos.forEach(campo => {
    if (campo.required || campo.value.trim()) {
      const eventoSimulado = { target: campo };
      if (!validarCampo(eventoSimulado)) {
        formularioValido = false;
      }
    }
  });

  return formularioValido;
};

/**
 * Valida el formato de un email
 * @param {string} email - Email a validar
 * @returns {boolean} true si el email es válido
 */
export const validarEmail = (email) => {
  const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return regex.test(email);
};

/**
 * Muestra un mensaje de error en un campo
 * @param {HTMLElement} campo - Campo del formulario
 * @param {string} mensaje - Mensaje de error
 */
const mostrarError = (campo, mensaje) => {
  
};

/**
 * Muestra estado de éxito en un campo
 * @param {HTMLElement} campo - Campo del formulario
 */
const mostrarExito = (campo) => {
  campo.classList.add('is-valid');
  
  // Ocultar mensaje de error si existe
  const feedback = campo.parentNode.querySelector('.invalid-feedback');
  if (feedback) {
    feedback.style.display = 'none';
  }
};

/**
 * Muestra una advertencia temporal en un campo
 * @param {HTMLElement} campo - Campo del formulario
 * @param {string} mensaje - Mensaje de advertencia
 */
const mostrarAdvertencia = (campo, mensaje) => {
  // Crear tooltip temporal
  const tooltip = document.createElement('div');
  tooltip.textContent = mensaje;
  tooltip.style.cssText = `
    position: absolute;
    background: #ffc107;
    color: #000;
    padding: 5px 10px;
    border-radius: 4px;
    font-size: 12px;
    z-index: 1000;
    top: -30px;
    left: 0;
  `;
  
  campo.parentNode.style.position = 'relative';
  campo.parentNode.appendChild(tooltip);
  
  // Remover tooltip después de 2 segundos
  setTimeout(() => {
    if (tooltip.parentNode) {
      tooltip.parentNode.removeChild(tooltip);
    }
  }, 2000);
};
