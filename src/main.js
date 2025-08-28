/**
 * Punto de entrada principal de la aplicación SPA Carpintería
 * Inicializa el router y configura el sistema de navegación
 */

import { router } from "./Router/router.js";

// Variable global para el contenedor principal de la aplicación
const app = document.querySelector('#app');

/**
 * Función de inicialización de la aplicación
 * Se ejecuta cuando el DOM está completamente cargado
 */
const init = () => {
    // Inicializar el router con el contenedor principal
    router(app);
    
    // Escuchar cambios en el hash para navegación SPA
    window.addEventListener('hashchange', () => {
        router(app);
    });
    
    // Escuchar eventos personalizados para actualizaciones del estado de autenticación
    document.addEventListener('authStateChanged', () => {
        router(app);
    });
};

// Inicializar la aplicación cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', init);
