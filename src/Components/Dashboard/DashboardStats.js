/**
 * Componente de estadísticas del dashboard
 * Maneja la visualización y actualización de métricas
 */

import { manejarErrores } from "../../Helpers/manejoErrores.js";

/**
 * Clase para manejar las estadísticas del dashboard
 */
export class DashboardStats {
  constructor() {
    this.estadisticas = {
      proyectosActivos: 0,
      totalClientes: 0,
      ventasMes: '$0',
      totalInventario: 0
    };
    this.actualizandose = false;
  }

  /**
   * Inicializa el componente de estadísticas
   */
  async init() {
    this.renderizar();
    await this.cargarEstadisticas();
    this.configurarActualizacionPeriodica();
  }

  /**
   * Renderiza el componente de estadísticas
   */
  renderizar() {
    const statsContainer = document.querySelector('#dashboardStats');
    if (!statsContainer) return;

    statsContainer.innerHTML = this.getTemplate();
  }

  /**
   * Template HTML del componente de estadísticas
   * @returns {string} HTML del componente
   */
  getTemplate() {
    return `
      <div class="stats-container">
        <div class="stats-header">
          <h3 class="stats-title">Resumen General</h3>
          <button id="refreshStats" class="refresh-btn" ${this.actualizandose ? 'disabled' : ''}>
            <i data-lucide="refresh-cw" width="16" height="16"></i>
            ${this.actualizandose ? 'Actualizando...' : 'Actualizar'}
          </button>
        </div>
        
        <div class="stats-grid">
          ${this.renderizarTarjetaEstadistica('proyectosActivos', '<i data-lucide="bar-chart-3" width="24" height="24"></i>', 'Proyectos Activos', this.estadisticas.proyectosActivos)}
          ${this.renderizarTarjetaEstadistica('totalClientes', '<i data-lucide="users" width="24" height="24"></i>', 'Total Clientes', this.estadisticas.totalClientes)}
          ${this.renderizarTarjetaEstadistica('ventasMes', '<i data-lucide="dollar-sign" width="24" height="24"></i>', 'Ventas del Mes', this.estadisticas.ventasMes)}
          ${this.renderizarTarjetaEstadistica('totalInventario', '<i data-lucide="package" width="24" height="24"></i>', 'Items Inventario', this.estadisticas.totalInventario)}
        </div>
      </div>
      
      <style>
        .stats-container {
          background: white;
          padding: 1.5rem;
          border-radius: 10px;
          box-shadow: 0 2px 10px rgba(0,0,0,0.1);
          margin-bottom: 2rem;
        }
        
        .stats-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 1.5rem;
        }
        
        .stats-title {
          color: #343a40;
          font-size: 1.3rem;
          margin: 0;
          font-weight: 600;
        }
        
        .refresh-btn {
          background: #007bff;
          color: white;
          border: none;
          padding: 0.5rem 1rem;
          border-radius: 5px;
          cursor: pointer;
          font-size: 0.9rem;
          transition: background 0.3s ease;
        }
        
        .refresh-btn:hover:not(:disabled) {
          background: #0056b3;
        }
        
        .refresh-btn:disabled {
          background: #6c757d;
          cursor: not-allowed;
        }
        
        .stats-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
          gap: 1.5rem;
        }
        
        .stat-card {
          background: #f8f9fa;
          padding: 1.5rem;
          border-radius: 8px;
          text-align: center;
          transition: all 0.3s ease;
          border: 1px solid #e9ecef;
        }
        
        .stat-card:hover {
          transform: translateY(-3px);
          box-shadow: 0 4px 15px rgba(0,0,0,0.1);
        }
        
        .stat-icon {
          font-size: 2.5rem;
          margin-bottom: 0.5rem;
          display: block;
        }
        
        .stat-title {
          font-size: 0.9rem;
          color: #6c757d;
          margin-bottom: 0.5rem;
          font-weight: 500;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }
        
        .stat-value {
          font-size: 2rem;
          font-weight: 700;
          color: #007bff;
          margin: 0;
          transition: all 0.3s ease;
        }
        
        .stat-loading {
          color: #6c757d;
          font-style: italic;
        }
        
        @media (max-width: 768px) {
          .stats-header {
            flex-direction: column;
            gap: 1rem;
            align-items: stretch;
          }
          
          .stats-grid {
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 1rem;
          }
          
          .stat-card {
            padding: 1rem;
          }
          
          .stat-value {
            font-size: 1.5rem;
          }
        }
      </style>
    `;
  }

  /**
   * Renderiza una tarjeta de estadística individual
   * @param {string} id - ID único de la estadística
   * @param {string} icon - Icono a mostrar
   * @param {string} title - Título de la estadística
   * @param {string|number} value - Valor de la estadística
   * @returns {string} HTML de la tarjeta
   */
  renderizarTarjetaEstadistica(id, icon, title, value) {
    return `
      <div class="stat-card" data-stat="${id}">
        <span class="stat-icon">${icon}</span>
        <h4 class="stat-title">${title}</h4>
        <p class="stat-value" id="${id}">${value}</p>
      </div>
    `;
  }

  /**
   * Carga las estadísticas desde la API o datos simulados
   */
  async cargarEstadisticas() {
    this.actualizandose = true;
    this.actualizarEstadoBotones();

    try {
      // Por ahora usar datos simulados, en el futuro conectar a API real
      await this.simularCargaEstadisticas();
      
      // TODO: Reemplazar con llamada real a la API
      // const respuesta = await api.get('/dashboard/stats');
      // if (respuesta.success) {
      //   this.estadisticas = respuesta.data;
      // }
      
      this.actualizarElementosVisuales();
      
    } catch (error) {
      console.error('Error al cargar estadísticas:', error);
      await manejarErrores({
        success: false,
        message: 'Error al cargar estadísticas del dashboard'
      }, true);
    } finally {
      this.actualizandose = false;
      this.actualizarEstadoBotones();
    }
  }

  /**
   * Simula la carga de estadísticas con datos aleatorios
   */
  async simularCargaEstadisticas() {
    // Simular tiempo de carga
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    this.estadisticas = {
      proyectosActivos: Math.floor(Math.random() * 15) + 5,
      totalClientes: Math.floor(Math.random() * 50) + 20,
      ventasMes: (Math.random() * 50000 + 10000).toLocaleString('es-CO', {
        style: 'currency',
        currency: 'COP'
      }),
      totalInventario: Math.floor(Math.random() * 200) + 100
    };
  }

  /**
   * Actualiza los elementos visuales con las nuevas estadísticas
   */
  actualizarElementosVisuales() {
    Object.keys(this.estadisticas).forEach(key => {
      const elemento = document.querySelector(`#${key}`);
      if (elemento) {
        // Agregar animación de actualización
        elemento.style.transform = 'scale(1.1)';
        elemento.style.transition = 'transform 0.3s ease';
        
        setTimeout(() => {
          elemento.textContent = this.estadisticas[key];
          elemento.style.transform = 'scale(1)';
        }, 150);
      }
    });
  }

  /**
   * Actualiza el estado visual de los botones
   */
  actualizarEstadoBotones() {
    const refreshBtn = document.querySelector('#refreshStats');
    if (refreshBtn) {
      refreshBtn.disabled = this.actualizandose;
      refreshBtn.textContent = this.actualizandose ? '🔄 Actualizando...' : '🔄 Actualizar';
    }
  }

  /**
   * Configura la actualización periódica de estadísticas
   */
  configurarActualizacionPeriodica() {
    // Actualizar cada 5 minutos
    setInterval(() => {
      if (!this.actualizandose) {
        this.cargarEstadisticas();
      }
    }, 300000);

    // Configurar evento del botón de actualización
    const refreshBtn = document.querySelector('#refreshStats');
    if (refreshBtn) {
      refreshBtn.addEventListener('click', () => {
        if (!this.actualizandose) {
          this.cargarEstadisticas();
        }
      });
    }
  }

  /**
   * Actualiza una estadística específica
   * @param {string} key - Clave de la estadística
   * @param {string|number} value - Nuevo valor
   */
  actualizarEstadistica(key, value) {
    if (this.estadisticas.hasOwnProperty(key)) {
      this.estadisticas[key] = value;
      
      const elemento = document.querySelector(`#${key}`);
      if (elemento) {
        elemento.style.transform = 'scale(1.1)';
        elemento.style.transition = 'transform 0.3s ease';
        
        setTimeout(() => {
          elemento.textContent = value;
          elemento.style.transform = 'scale(1)';
        }, 150);
      }
    }
  }

  /**
   * Obtiene las estadísticas actuales
   * @returns {Object} Objeto con las estadísticas
   */
  obtenerEstadisticas() {
    return { ...this.estadisticas };
  }
}
