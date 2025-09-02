/**
 * Componente de navegación pública
 * Navbar reutilizable para páginas públicas como Home y Tienda
 */

import { userManager } from '../../Helpers/userManager.js';
import { confirm } from '../../Helpers/alertas.js';

export class PublicNavigation {
    constructor() {
        this.usuario = null;
        this.permisos = [];
    }

    /**
     * Inicializa el componente de navegación
     */
    async init() {
        await this.cargarDatosUsuario();
        this.render();
        this.configurarEventos();
    }

    /**
     * Carga los datos del usuario si está autenticado
     */
    async cargarDatosUsuario() {
        try {
            this.usuario = userManager.obtenerUsuario();
            this.permisos = userManager.obtenerPermisos();
        } catch (error) {
            console.log('Usuario no autenticado');
            this.usuario = null;
            this.permisos = [];
        }
    }

    /**
     * Renderiza la navegación en el contenedor especificado
     */
    render(containerId = 'publicNavContainer') {
        const container = document.getElementById(containerId);
        if (!container) {
            console.error(`Contenedor ${containerId} no encontrado`);
            return;
        }

        container.innerHTML = this.getNavHTML();
        
        // Inicializar iconos después del render
        if (typeof lucide !== 'undefined') {
            lucide.createIcons();
        }
        
        console.log('Navegación pública renderizada exitosamente');
    }

    /**
     * Genera el HTML de la navegación
     */
    getNavHTML() {
        return `
            <nav class="home-nav">
                <div class="nav-content">
                    <div class="nav-brand">
                        <i data-lucide="hammer" width="24" height="24" style="color: #3b82f6;"></i>
                        <span>Carpintería Pro</span>
                    </div>
                    
                    <div class="nav-center">
                        <div class="nav-links">
                            <a href="#Home" class="nav-link">
                                <i data-lucide="home" width="16" height="16"></i>
                                Inicio
                            </a>
                            <a href="#Tienda" class="nav-link">
                                <i data-lucide="shopping-cart" width="16" height="16"></i>
                                Tienda
                            </a>
                        </div>
                    </div>
                    
                    <div class="nav-actions">
                        ${this.getNavActionsHTML()}
                    </div>
                </div>
            </nav>
        `;
    }

    /**
     * Genera el HTML de las acciones de navegación según el estado del usuario
     */
    getNavActionsHTML() {
        if (!this.usuario) {
            // Usuario no autenticado
            return `
                <button class="nav-button" id="btnIniciarSesion">
                    <i data-lucide="log-in" width="16" height="16"></i>
                    Iniciar Sesión
                </button>
            `;
        }

        // Usuario autenticado
        const tieneDashboard = this.permisos.includes('dashboard');
        const token = localStorage.getItem('accessToken');
        
        return `
            <div class="nav-user-section">
                ${tieneDashboard ? `
                    <button class="nav-button nav-button-primary" id="btnDashboard">
                        <i data-lucide="layout-dashboard" width="16" height="16"></i>
                        Dashboard
                    </button>
                ` : ''}

                ${token ? `
                    <div class="nav-user-info">
                        <span class="nav-user-name">
                            <i data-lucide="user" width="14" height="14"></i>
                            ${this.usuario.nombre_usuario || 'Usuario'}
                        </span>
                        <button class="nav-button nav-button-secondary" id="btnCerrarSesion">
                            <i data-lucide="log-out" width="16" height="16"></i>
                            Cerrar Sesión
                        </button>
                    </div>
                    ` : `
                    <button class="nav-button" id="btnIniciarSesion">
                        <i data-lucide="log-in" width="16" height="16"></i>
                        Iniciar Sesión
                    </button>
                    `}
                
                
            </div>
        `;
    }

    /**
     * Configura los eventos de la navegación
     */
    configurarEventos() {
        // Evento para iniciar sesión
        const btnIniciarSesion = document.getElementById('btnIniciarSesion');
        if (btnIniciarSesion) {
            btnIniciarSesion.addEventListener('click', (e) => {
                e.preventDefault();
                location.hash = '#Login';
            });
        }

        // Evento para ir al dashboard
        const btnDashboard = document.getElementById('btnDashboard');
        if (btnDashboard) {
            btnDashboard.addEventListener('click', (e) => {
                e.preventDefault();
                location.hash = '#Dashboard';
            });
        }

        // Evento para cerrar sesión
        const btnCerrarSesion = document.getElementById('btnCerrarSesion');
        if (btnCerrarSesion) {
            btnCerrarSesion.addEventListener('click', (e) => {
                e.preventDefault();
                this.cerrarSesion();
            });
        }

        // Eventos para los enlaces de navegación
        const navLinks = document.querySelectorAll('.nav-link');
        navLinks.forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                const href = link.getAttribute('href');
                if (href) {
                    location.hash = href;
                }
            });
        });
    }

    /**
     * Maneja el proceso de cerrar sesión
     */
    async cerrarSesion() {
    try {
        const confirmacion = await confirm(
            '¿Estás seguro de que deseas cerrar sesión?',
            'Sí, cerrar sesión',
            'Cancelar'
        );
        if (!confirmacion) return;

        // Llamar al endpoint de logout
        await api.post('/auth/logout', {});

        // Limpiar localStorage
        localStorage.clear();

        // Disparar evento de cambio de autenticación
        const eventoAuth = new CustomEvent('authStateChanged', {
            detail: { usuario: null, autenticado: false },
            bubbles: true
        });
        document.dispatchEvent(eventoAuth);

        // Redirigir al login
        location.hash = '#Login';
    } catch (error) {
        console.error('Error al cerrar sesión:', error);
        localStorage.clear();
        location.hash = '#Login';
    }
    }

    /**
     * Actualiza la navegación cuando cambia el estado del usuario
     */
    async actualizar() {
        await this.cargarDatosUsuario();
        this.render();
        this.configurarEventos();
    }
}
