/**
 * Helper para manejo de errores de la aplicación
 * Proporciona funciones para manejar diferentes tipos de errores
 */

import { error, toastError } from './alertas.js';

/**
 * Maneja errores de respuestas de la API
 * @param {Object} respuesta - Respuesta de la API
 * @param {boolean} mostrarToast - Si mostrar toast en lugar de alerta completa
 */
export const manejarErrores = async (respuesta, mostrarToast = false) => {
  if (!respuesta) {
    const mensaje = 'Error de conexión con el servidor';
    mostrarToast ? await toastError(mensaje) : await error(mensaje);
    return;
  }

  if (respuesta.success === false) {
    const mensaje = respuesta.message || 'Ha ocurrido un error inesperado';
    
    // Manejar errores específicos
    switch (respuesta.status) {
      case 401:
        // Error de autenticación
        localStorage.clear();
        location.hash = '#Login';
        await error('Sesión expirada. Por favor, inicia sesión nuevamente.');
        break;
        
      case 403:
        // Error de permisos
        await error('No tienes permisos para realizar esta acción.');
        break;
        
      case 404:
        // Recurso no encontrado
        mostrarToast ? await toastError('Recurso no encontrado') : await error('El recurso solicitado no existe.');
        break;
        
      case 422:
        // Errores de validación
        if (respuesta.errors && Array.isArray(respuesta.errors)) {
          const mensajesError = respuesta.errors.map(err => err.message || err).join('\n');
          await error(`Errores de validación:\n${mensajesError}`);
        } else {
          mostrarToast ? await toastError(mensaje) : await error(mensaje);
        }
        break;
        
      case 500:
        // Error interno del servidor
        await error('Error interno del servidor. Por favor, contacta al administrador.');
        break;
        
      default:
        // Otros errores
        mostrarToast ? await toastError(mensaje) : await error(mensaje);
    }
  }
};

/**
 * Maneja errores de validación de formularios
 * @param {Object} errores - Objeto con errores de validación
 */
export const manejarErroresValidacion = (errores) => {
  Object.keys(errores).forEach(campo => {
    const input = document.querySelector(`[name="${campo}"]`);
    if (input) {
      // Mostrar error en el campo específico
      input.classList.add('is-invalid');
      
      let feedback = input.parentNode.querySelector('.invalid-feedback');
      if (!feedback) {
        feedback = document.createElement('div');
        feedback.className = 'invalid-feedback';
        input.parentNode.appendChild(feedback);
      }
      
      feedback.textContent = Array.isArray(errores[campo]) ? errores[campo][0] : errores[campo];
      feedback.style.display = 'block';
    }
  });
};

/**
 * Limpia los errores de validación de un formulario
 * @param {HTMLFormElement} formulario - Formulario a limpiar
 */
export const limpiarErroresValidacion = (formulario) => {
  const campos = formulario.querySelectorAll('.is-invalid');
  campos.forEach(campo => {
    campo.classList.remove('is-invalid');
    
    const feedback = campo.parentNode.querySelector('.invalid-feedback');
    if (feedback) {
      feedback.style.display = 'none';
    }
  });
};

/**
 * Maneja errores de red (cuando no hay respuesta del servidor)
 */
export const manejarErrorRed = async () => {
  await error('No se puede conectar con el servidor. Verifica tu conexión a internet.');
};

/**
 * Registra errores en la consola para debugging
 * @param {string} contexto - Contexto donde ocurrió el error
 * @param {Error|Object} error - Error a registrar
 */
export const registrarError = (contexto, error) => {
  console.group(`🚨 Error en ${contexto}`);
  console.error('Detalles del error:', error);
  console.error('Stack trace:', error.stack);
  console.error('Timestamp:', new Date().toISOString());
  console.groupEnd();
  
  // En producción, aquí se podría enviar el error a un servicio de logging
  if (process.env.NODE_ENV === 'production') {
    // Enviar error a servicio de logging externo
    // ejemplo: Sentry, LogRocket, etc.
  }
};
