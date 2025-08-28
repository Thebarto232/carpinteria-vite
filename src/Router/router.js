/**
 * Router principal de la aplicación SPA
 * Maneja la navegación entre vistas y control de acceso
 */

import { routes } from "./routes.js";
import { inicializarIconos } from "../Helpers/iconos.js";

/**
 * Función principal del enrutador SPA
 * @param {HTMLElement} elemento - Contenedor donde se renderizarán las vistas
 */
export const router = async (elemento) => {
  const hash = location.hash.slice(1); // Eliminamos "#"
  const rutaNombre = hash || "Home"; // Si no hay hash, usar Home por defecto

  // Redirigir a Home si no hay hash
  if (!hash) {
    redirigirARuta("Home");
    return;
  }

  // Buscar la ruta directamente por nombre
  const ruta = routes[rutaNombre];
  
  if (!ruta) {
    console.warn("Ruta inválida:", rutaNombre);
    elemento.innerHTML = `<h2>Ruta no encontrada</h2>`;
    return;
  }

  // Verificar acceso privado
  if (ruta.private && !localStorage.getItem('accessToken')) {
    redirigirARuta("Login");
    return;
  }
  
  // Verificar permisos específicos si la ruta los requiere
  if (ruta.private && ruta.can && !puedeAcceder(ruta.can)) {
    window.history.back();
    // Mostrar alerta de acceso denegado
    const { default: Swal } = await import('sweetalert2');
    Swal.fire({
      icon: 'error',
      title: 'Acceso Denegado',
      text: 'No tienes permisos para acceder a esta sección',
      confirmButtonText: 'Entendido'
    });
    return;
  }
 
  // Cargar la vista HTML y ejecutar el controlador JS
  await cargarVista(ruta.path, elemento);
  await ruta.controlador();
  
  // Inicializar iconos después de cargar contenido
  setTimeout(() => {
    inicializarIconos();
  }, 100);
};

/**
 * Redirecciona a una ruta determinada
 * @param {string} ruta - Nombre de la ruta a la que redirigir
 */
const redirigirARuta = (ruta) => {
  location.hash = `#${ruta}`;
};

/**
 * Carga una vista HTML en el contenedor especificado
 * @param {string} rutaVista - Ruta del archivo HTML de la vista
 * @param {HTMLElement} elemento - Elemento donde cargar la vista
 */
const cargarVista = async (rutaVista, elemento) => {
  try {
    const respuesta = await fetch(`src/Views/${rutaVista}`);
    
    if (!respuesta.ok) {
      throw new Error(`Error al cargar la vista: ${respuesta.status}`);
    }
    
    const html = await respuesta.text();
    elemento.innerHTML = html;
  } catch (error) {
    console.error('Error al cargar la vista:', error);
    elemento.innerHTML = `
      <div style="text-align: center; padding: 2rem;">
        <h2>Error al cargar la vista</h2>
        <p>No se pudo cargar el contenido solicitado.</p>
      </div>
    `;
  }
};

/**
 * Verifica si el usuario actual puede acceder a un recurso específico
 * @param {string} permiso - Nombre del permiso a verificar
 * @returns {boolean} true si puede acceder, false en caso contrario
 */
const puedeAcceder = (permiso) => {
  try {
    const permisos = JSON.parse(localStorage.getItem('permisos') || '[]');
    return permisos.some(p => p === permiso || p === '*');
  } catch (error) {
    console.error('Error al verificar permisos:', error);
    return false;
  }
};
