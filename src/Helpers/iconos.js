/**
 * Helper para manejo de iconos Lucide - versión ultra simple
 * Solo inicializa los iconos, el HTML se escribe directamente con data-lucide
 */

/**
 * Inicializa todos los iconos de Lucide en el DOM
 * Debe llamarse después de cargar contenido con data-lucide
 */
export const inicializarIconos = () => {
  if (window.lucide) {
    window.lucide.createIcons();
  }
};
