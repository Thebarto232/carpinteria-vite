/**
 * Controlador para la página de inicio
 * Maneja la lógica de la página principal y redirecciones
 */

/**
 * Función principal del controlador de Home
 * Configura eventos de la página principal
 */
export const homeController = () => {
  // Configurar eventos
  configurarEventos();
};

/**
 * Configura todos los eventos de la página de inicio
 */
const configurarEventos = () => {
  // Evento para el botón de iniciar sesión
  const btnIniciarSesion = document.querySelector('#btnIniciarSesion');
  
  if (btnIniciarSesion) {
    btnIniciarSesion.addEventListener('click', (e) => {
      e.preventDefault();
      location.hash = '#Login';
    });
  }
  
  // Mostrar/ocultar botón según estado de autenticación
  mostrarBotonesSegunEstado();
  
  // Agregar efecto hover a las tarjetas de características
  const featureCards = document.querySelectorAll('.feature-card');
  featureCards.forEach(card => {
    card.addEventListener('mouseenter', () => {
      card.style.transform = 'translateY(-5px)';
      card.style.transition = 'transform 0.3s ease';
    });
    
    card.addEventListener('mouseleave', () => {
      card.style.transform = 'translateY(0)';
    });
  });
};

/**
 * Muestra u oculta botones según el estado de autenticación
 */
const mostrarBotonesSegunEstado = () => {
  const token = localStorage.getItem('accessToken');
  const btnIniciarSesion = document.querySelector('#btnIniciarSesion');
  
  if (btnIniciarSesion) {
    if (token) {
      // Usuario autenticado - cambiar texto del botón
      btnIniciarSesion.innerHTML = `
        <i data-lucide="bar-chart-3" width="16" height="16"></i>
        Ir al Dashboard
      `;
      btnIniciarSesion.onclick = () => {
        location.hash = '#Dashboard';
      };
    } else {
      // Usuario no autenticado - botón normal
      btnIniciarSesion.innerHTML = `
        <i data-lucide="user" width="16" height="16"></i>
        Iniciar Sesión
      `;
      btnIniciarSesion.onclick = () => {
        location.hash = '#Login';
      };
    }
    
    // Inicializar iconos después de cambiar el contenido dinámicamente
    setTimeout(() => {
      if (window.lucide) {
        window.lucide.createIcons();
      }
    }, 100);
  }
};
