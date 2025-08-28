/**
 * Helper para mostrar alertas usando SweetAlert2
 * Proporciona funciones para diferentes tipos de alertas y confirmaciones
 */

/**
 * Muestra una alerta de éxito
 * @param {string|Object} mensaje - Mensaje a mostrar o objeto de respuesta del API
 */
export const success = async (mensaje) => {
  const { default: Swal } = await import('sweetalert2');
  
  let textoMensaje = '';
  
  if (typeof mensaje === 'string') {
    textoMensaje = mensaje;
  } else if (mensaje && mensaje.message) {
    textoMensaje = mensaje.message;
  } else {
    textoMensaje = 'Operación realizada exitosamente';
  }

  return Swal.fire({
    icon: 'success',
    title: '¡Éxito!',
    text: textoMensaje,
    confirmButtonText: 'Aceptar',
    confirmButtonColor: '#28a745'
  });
};

/**
 * Muestra una alerta de error
 * @param {string|Object} mensaje - Mensaje a mostrar o objeto de respuesta del API
 */
export const error = async (mensaje) => {
  const { default: Swal } = await import('sweetalert2');
  
  let textoMensaje = '';
  
  if (typeof mensaje === 'string') {
    textoMensaje = mensaje;
  } else if (mensaje && mensaje.message) {
    textoMensaje = mensaje.message;
  } else {
    textoMensaje = 'Ha ocurrido un error inesperado';
  }

  return Swal.fire({
    icon: 'error',
    title: 'Error',
    text: textoMensaje,
    confirmButtonText: 'Entendido',
    confirmButtonColor: '#dc3545'
  });
};

/**
 * Muestra una alerta de advertencia
 * @param {string} mensaje - Mensaje de advertencia
 */
export const warning = async (mensaje) => {
  const { default: Swal } = await import('sweetalert2');
  
  return Swal.fire({
    icon: 'warning',
    title: 'Advertencia',
    text: mensaje,
    confirmButtonText: 'Entendido',
    confirmButtonColor: '#ffc107'
  });
};

/**
 * Muestra una alerta informativa
 * @param {string} mensaje - Mensaje informativo
 */
export const info = async (mensaje) => {
  const { default: Swal } = await import('sweetalert2');
  
  return Swal.fire({
    icon: 'info',
    title: 'Información',
    text: mensaje,
    confirmButtonText: 'Aceptar',
    confirmButtonColor: '#17a2b8'
  });
};

/**
 * Muestra una alerta de confirmación
 * @param {string} mensaje - Mensaje de confirmación
 * @param {string} textoConfirmar - Texto del botón de confirmar
 * @param {string} textoCancelar - Texto del botón de cancelar
 * @returns {Promise<boolean>} true si se confirmó, false si se canceló
 */
export const confirm = async (mensaje, textoConfirmar = 'Sí, confirmar', textoCancelar = 'Cancelar') => {
  const { default: Swal } = await import('sweetalert2');
  
  const resultado = await Swal.fire({
    icon: 'question',
    title: '¿Estás seguro?',
    text: mensaje,
    showCancelButton: true,
    confirmButtonText: textoConfirmar,
    cancelButtonText: textoCancelar,
    confirmButtonColor: '#007bff',
    cancelButtonColor: '#6c757d',
    reverseButtons: true
  });

  return resultado.isConfirmed;
};

/**
 * Muestra una alerta de confirmación para acciones destructivas
 * @param {string} mensaje - Mensaje de confirmación
 * @param {string} textoConfirmar - Texto del botón de confirmar
 * @returns {Promise<boolean>} true si se confirmó, false si se canceló
 */
export const confirmDelete = async (mensaje, textoConfirmar = 'Sí, eliminar') => {
  const { default: Swal } = await import('sweetalert2');
  
  const resultado = await Swal.fire({
    icon: 'warning',
    title: '¿Estás seguro?',
    text: mensaje,
    showCancelButton: true,
    confirmButtonText: textoConfirmar,
    cancelButtonText: 'Cancelar',
    confirmButtonColor: '#dc3545',
    cancelButtonColor: '#6c757d',
    reverseButtons: true,
    focusCancel: true
  });

  return resultado.isConfirmed;
};

/**
 * Muestra un toast (notificación pequeña) de éxito
 * @param {string} mensaje - Mensaje del toast
 */
export const toastSuccess = async (mensaje) => {
  const { default: Swal } = await import('sweetalert2');
  
  const Toast = Swal.mixin({
    toast: true,
    position: 'top-end',
    showConfirmButton: false,
    timer: 3000,
    timerProgressBar: true,
    didOpen: (toast) => {
      toast.addEventListener('mouseenter', Swal.stopTimer);
      toast.addEventListener('mouseleave', Swal.resumeTimer);
    }
  });

  return Toast.fire({
    icon: 'success',
    title: mensaje
  });
};

/**
 * Muestra un toast (notificación pequeña) de error
 * @param {string} mensaje - Mensaje del toast
 */
export const toastError = async (mensaje) => {
  const { default: Swal } = await import('sweetalert2');
  
  const Toast = Swal.mixin({
    toast: true,
    position: 'top-end',
    showConfirmButton: false,
    timer: 4000,
    timerProgressBar: true,
    didOpen: (toast) => {
      toast.addEventListener('mouseenter', Swal.stopTimer);
      toast.addEventListener('mouseleave', Swal.resumeTimer);
    }
  });

  return Toast.fire({
    icon: 'error',
    title: mensaje
  });
};

/**
 * Muestra una alerta con input para capturar datos del usuario
 * @param {string} titulo - Título de la alerta
 * @param {string} placeholder - Placeholder del input
 * @param {string} tipoInput - Tipo de input (text, email, password, etc.)
 * @returns {Promise<string|null>} Valor ingresado o null si se canceló
 */
export const inputAlert = async (titulo, placeholder = '', tipoInput = 'text') => {
  const { default: Swal } = await import('sweetalert2');
  
  const resultado = await Swal.fire({
    title: titulo,
    input: tipoInput,
    inputPlaceholder: placeholder,
    showCancelButton: true,
    confirmButtonText: 'Aceptar',
    cancelButtonText: 'Cancelar',
    inputValidator: (value) => {
      if (!value.trim()) {
        return 'Este campo es obligatorio';
      }
    }
  });

  return resultado.isConfirmed ? resultado.value : null;
};
