/**
 * Controlador para la página de inicio
 * Maneja la lógica de la página principal y redirecciones
 */

import { PublicNavigation } from '../../Components/Navigation/PublicNavigation.js';

/**
 * Función principal del controlador de Home
 * Configura eventos de la página principal
 */
export const homeController = async () => {
  // Esperar a que el DOM esté listo
  if (document.readyState === 'loading') {
    await new Promise(resolve => {
      document.addEventListener('DOMContentLoaded', resolve);
    });
  }

  // Usar setTimeout para asegurar que el HTML se haya renderizado
  await new Promise(resolve => setTimeout(resolve, 100));

  // Esperar hasta que el contenedor esté disponible
  try {
    const navContainer = await esperarContenedor('publicNavContainer');
    
    // Inicializar navegación pública
    const navigation = new PublicNavigation();
    await navigation.init();
    
    // Configurar eventos
    configurarEventos();
    
    // Inicializar iconos
    if (typeof lucide !== 'undefined') {
      lucide.createIcons();
    }
  } catch (err) {
    console.error('Error inicializando Home:', err);
  }
};

/**
 * Espera hasta que un contenedor específico esté disponible en el DOM
 */
const esperarContenedor = (id, maxIntentos = 50) => {
  return new Promise((resolve, reject) => {
    let intentos = 0;
    
    const verificar = () => {
      const contenedor = document.getElementById(id);
      
      if (contenedor) {
        resolve(contenedor);
        return;
      }
      
      intentos++;
      
      if (intentos >= maxIntentos) {
        reject(new Error(`Contenedor ${id} no encontrado`));
        return;
      }
      
      setTimeout(verificar, 100);
    };
    
    verificar();
  });
};

/**
 * Configura todos los eventos de la página de inicio
 */
const configurarEventos = () => {
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
  
  // Eventos para botones de hero
  const getStartedBtn = document.getElementById('getStartedBtn');
  const learnMoreBtn = document.getElementById('learnMoreBtn');
  
  if (getStartedBtn) {
    getStartedBtn.addEventListener('click', () => {
      const token = localStorage.getItem('accessToken');
      if (token) {
        location.hash = '#Dashboard';
      } else {
        location.hash = '#Login';
      }
    });
  }
  
  if (learnMoreBtn) {
    learnMoreBtn.addEventListener('click', () => {
      // Scroll a la sección de características
      const featuresSection = document.querySelector('.features');
      if (featuresSection) {
        featuresSection.scrollIntoView({ behavior: 'smooth' });
      }
    });
  }
};


