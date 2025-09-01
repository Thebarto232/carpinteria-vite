/**
 * Componente de navegación horizontal para el dashboard
 * Maneja la barra superior con información del usuario y opciones
 */

import { confirm, error } from "../../Helpers/alertas.js";
import * as api from "../../Helpers/api.js";

/**
 * Clase para manejar la navegación del dashboard
 */
export class DashboardNavigation {
  constructor() {
    this.usuario = null;
    this.rol = null;
  }

  /**
   * Inicializa el componente de navegación
   */
  async init() {
    await this.cargarDatosUsuario();
    this.renderizar();
    this.configurarEventos();
  }

  /**
   * Carga los datos del usuario desde localStorage
   */
  async cargarDatosUsuario() {
    try {
      this.usuario = JSON.parse(localStorage.getItem('usuario') || '{}');
      this.rol = JSON.parse(localStorage.getItem('rol') || '{}');
    } catch (error) {
      console.error('Error al cargar datos del usuario:', error);
      this.usuario = {};
      this.rol = {};
    }
  }

  /**
   * Renderiza el componente de navegación
   */
  renderizar() {
    const navContainer = document.querySelector('#dashboardNav');
    if (!navContainer) return;

    navContainer.innerHTML = this.getTemplate();
  }

  /**
   * Template HTML del componente de navegación
   * @returns {string} HTML del componente
   */
  getTemplate() {
    return `
      <div class="dashboard-header">
        <div class="header-left">
          <h1 class="dashboard-title">
            <i data-lucide="hammer" width="24" height="24"></i>
            Sistema de Carpintería
          </h1>
        </div>
        
        <div class="header-center">
          <nav class="main-nav">
            <button class="nav-btn active" data-section="dashboard">
              <i data-lucide="bar-chart-3" width="16" height="16"></i>
              Dashboard
            </button>
            <button class="nav-btn" data-section="tienda">
              <i data-lucide="shopping-cart" width="16" height="16"></i>
              Tienda
            </button>
            <button class="nav-btn" data-section="productos">
              <i data-lucide="package" width="16" height="16"></i>
              Productos
            </button>
            <button class="nav-btn" data-section="categorias">
              <i data-lucide="tag" width="16" height="16"></i>
              Categorías
            </button>
            <button class="nav-btn" data-section="proveedores">
              <i data-lucide="truck" width="16" height="16"></i>
              Proveedores
            </button>
            <button class="nav-btn" data-section="roles">
              <i data-lucide="shield" width="16" height="16"></i>
              Roles
            </button>
            <button class="nav-btn" data-section="usuarios">
              <i data-lucide="users" width="16" height="16"></i>
              Usuarios
            </button>
            <button class="nav-btn" data-section="compras">
              <i data-lucide="credit-card" width="16" height="16"></i>
              Comprar
            </button>
            <button class="nav-btn" data-section="mis-compras">
              <i data-lucide="shopping-bag" width="16" height="16"></i>
              Mis Compras
            </button>
            <button class="nav-btn" data-section="facturas">
              <i data-lucide="file-text" width="16" height="16"></i>
              Facturas
            </button>
          </nav>
        </div>
        
        <div class="header-right">
          <div class="nav-user-info">
            <div class="nav-user-details">
              <div class="user-name">${this.usuario.nombre_usuario || 'Usuario'}</div>
              <div class="user-role">${this.rol.nombre_rol || 'Sin rol'}</div>
            </div>
            <div class="user-actions">
              <button id="btnLogout" class="logout-btn" title="Cerrar Sesión">
                <i data-lucide="log-out" width="16" height="16"></i>
              </button>
            </div>
          </div>
        </div>
      </div>
      
      <style>
        .dashboard-header {
          background: #343a40;
          color: white;
          padding: 1rem 2rem;
          display: flex;
          justify-content: space-between;
          align-items: center;
          box-shadow: 0 2px 4px rgba(0,0,0,0.1);
          position: sticky;
          top: 0;
          z-index: 1000;
        }
          color: white;
          padding: 1rem 2rem;
          display: flex;
          justify-content: space-between;
          align-items: center;
          box-shadow: 0 2px 4px rgba(0,0,0,0.1);
          position: sticky;
          top: 0;
          z-index: 1000;
        }
        
        .dashboard-title {
          font-size: 1.5rem;
          font-weight: 600;
          margin: 0;
          color: white;
        }
        
        .main-nav {
          display: flex;
          gap: 0.5rem;
          flex-wrap: wrap;
          justify-content: center;
        }
        
        .nav-btn {
          background: transparent;
          color: rgba(255, 255, 255, 0.8);
          border: 1px solid rgba(255, 255, 255, 0.2);
          padding: 0.5rem 0.75rem;
          border-radius: 5px;
          cursor: pointer;
          font-size: 0.85rem;
          transition: all 0.3s ease;
          display: flex;
          align-items: center;
          gap: 0.25rem;
          white-space: nowrap;
        }
        
        .nav-btn:hover {
          background: rgba(255, 255, 255, 0.1);
          color: white;
        }
        
        .nav-btn.active {
          background: rgba(255, 255, 255, 0.2);
          color: white;
          border-color: rgba(255, 255, 255, 0.4);
        }
        
        .nav-user-info {
          display: flex;
          align-items: center;
          gap: 1rem;
        }
        
        .nav-user-details {
          text-align: right;
        }
        
        .user-name {
          font-weight: 500;
          font-size: 0.9rem;
        }
        
        .user-role {
          font-size: 0.8rem;
          opacity: 0.8;
        }
        
        .user-actions {
          display: flex;
          gap: 0.5rem;
        }
        
        .action-btn {
          background: rgba(255, 255, 255, 0.1);
          color: white;
          border: none;
          padding: 0.5rem;
          border-radius: 50%;
          cursor: pointer;
          font-size: 1rem;
          transition: background 0.3s ease;
          width: 35px;
          height: 35px;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        
        .action-btn:hover {
          background: rgba(255, 255, 255, 0.2);
        }
        
        .logout-btn {
          background: #dc3545;
          color: white;
          border: none;
          padding: 0.5rem;
          border-radius: 5px;
          cursor: pointer;
          font-size: 1rem;
          transition: background 0.3s ease;
          width: 35px;
          height: 35px;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        
        .logout-btn:hover {
          background: #c82333;
        }
        
        @media (max-width: 768px) {
          .dashboard-header {
            flex-direction: column;
            gap: 1rem;
            padding: 1rem;
          }
          
          .header-center {
            order: 3;
            width: 100%;
          }
          
          .main-nav {
            justify-content: center;
            flex-wrap: wrap;
            gap: 0.5rem;
          }
          
          .nav-btn {
            font-size: 0.8rem;
            padding: 0.4rem 0.6rem;
          }
          
          .user-details {
            text-align: center;
          }
        }
        
        @media (max-width: 1024px) {
          .nav-btn {
            font-size: 0.8rem;
            padding: 0.4rem 0.6rem;
          }
          
          .main-nav {
            gap: 0.25rem;
          }
        }
      </style>
    `;
  }

  /**
   * Configura los eventos del componente
   */
  configurarEventos() {
    // Evento para cerrar sesión
    const btnLogout = document.querySelector('#btnLogout');
    if (btnLogout) {
      btnLogout.addEventListener('click', this.manejarCerrarSesion.bind(this));
    }

    // Eventos para navegación
    const navButtons = document.querySelectorAll('.nav-btn');
    navButtons.forEach(btn => {
      btn.addEventListener('click', this.manejarNavegacion.bind(this));
    });

    // Eventos para acciones del usuario
    const btnProfile = document.querySelector('#btnProfile');
    if (btnProfile) {
      btnProfile.addEventListener('click', this.mostrarPerfil.bind(this));
    }

    const btnNotifications = document.querySelector('#btnNotifications');
    if (btnNotifications) {
      btnNotifications.addEventListener('click', this.mostrarNotificaciones.bind(this));
    }
  }

  /**
   * Maneja la navegación entre secciones
   * @param {Event} event - Evento del botón
   */
  manejarNavegacion(event) {
    const section = event.target.dataset.section;
    
    // Actualizar botón activo
    document.querySelectorAll('.nav-btn').forEach(btn => {
      btn.classList.remove('active');
    });
    event.target.classList.add('active');

    // Redirigir a las páginas correspondientes
    switch (section) {
      case 'dashboard':
        window.location.hash = '#Dashboard';
        break;
      case 'productos':
        window.location.hash = '#Productos';
        break;
      case 'categorias':
        window.location.hash = '#Categorias';
        break;
      case 'proveedores':
        window.location.hash = '#Proveedores';
        break;
      case 'roles':
        window.location.hash = '#Roles';
        break;
      case 'usuarios':
        window.location.hash = '#Usuarios';
        break;
      case 'tienda':
        window.location.hash = '#Tienda';
        break;
      case 'compras':
        window.location.hash = '#Compras';
        break;
      case 'mis-compras':
        window.location.hash = '#MisCompras';
        break;
      case 'facturas':
        window.location.hash = '#Facturas';
        break;
      default:
        console.warn(`Sección no reconocida: ${section}`);
    }
  }

  /**
   * Maneja el proceso de cerrar sesión
   */
  async manejarCerrarSesion() {
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
   * Muestra el perfil del usuario
   */
  mostrarPerfil() {
    // TODO: Implementar modal o página de perfil
    console.log('Mostrar perfil del usuario');
  }

  /**
   * Muestra las notificaciones
   */
  mostrarNotificaciones() {
    // TODO: Implementar sistema de notificaciones
    console.log('Mostrar notificaciones');
  }

  /**
   * Actualiza la información del usuario en la navegación
   */
  async actualizarUsuario() {
    await this.cargarDatosUsuario();
    this.renderizar();
    this.configurarEventos();
  }
}
