/**
 * Controlador para el Dashboard principal
 * Maneja la lógica del panel de administración usando componentes modulares
 */

import { DashboardNavigation } from "../../Components/Navigation/DashboardNavigation.js";
import { DashboardStats } from "../../Components/Dashboard/DashboardStats.js";
import { userManager } from "../../Helpers/userManager.js";
import { success } from "../../Helpers/alertas.js";

/**
 * Función principal del controlador de Dashboard
 * Inicializa los componentes y configura eventos
 */
export const dashboardController = async () => {
  // Inicializar gestor de usuario
  userManager.init();
  
  // Cargar información del usuario
  cargarInformacionUsuario();
  
  // Inicializar componentes
  await inicializarComponentes();
  
  // Configurar eventos globales
  configurarEventosGlobales();
  
  // Configurar acciones rápidas
  configurarAccionesRapidas();
};

/**
 * Inicializa todos los componentes del dashboard
 */
const inicializarComponentes = async () => {
  try {
    // Inicializar componente de navegación
    const navigation = new DashboardNavigation();
    await navigation.init();
    
    // Inicializar componente de estadísticas
    const stats = new DashboardStats();
    await stats.init();
    
    // Guardar referencias a los componentes para uso posterior
    window.dashboardComponents = {
      navigation,
      stats
    };
    
  } catch (error) {
    console.error('Error al inicializar componentes:', error);
  }
};

/**
 * Carga la información del usuario en la sección user-info
 */
const cargarInformacionUsuario = () => {
  try {
    // Obtener datos del usuario desde localStorage
    const usuarioData = localStorage.getItem('usuario');
    const permisos = localStorage.getItem('permisos');
    
    if (usuarioData) {
      const usuario = JSON.parse(usuarioData);
      
      // Actualizar nombre del usuario
      const userNameElement = document.getElementById('userName');
      if (userNameElement) {
        userNameElement.textContent = usuario.nombre_usuario || 'Usuario';
      }
      
      // Actualizar rol del usuario
      const userRoleElement = document.getElementById('userRole');
      if (userRoleElement) {
        userRoleElement.textContent = usuario.rol?.nombre_rol || 'Sin rol asignado';
      }
      
      // Opcional: Mostrar información adicional si está disponible
      console.log('Información del usuario cargada:', {
        nombre: usuario.nombre,
        email: usuario.email,
        rol: usuario.rol?.nombre,
        permisos: permisos ? JSON.parse(permisos) : []
      });
      
    } else {
      console.warn('No se encontró información del usuario en localStorage');
      
      // Mostrar valores por defecto
      const userNameElement = document.getElementById('userName');
      const userRoleElement = document.getElementById('userRole');
      
      if (userNameElement) userNameElement.textContent = 'Usuario no identificado';
      if (userRoleElement) userRoleElement.textContent = 'Sin rol';
    }
    
  } catch (error) {
    console.error('Error al cargar información del usuario:', error);
    
    // Mostrar valores de error
    const userNameElement = document.getElementById('userName');
    const userRoleElement = document.getElementById('userRole');
    
    if (userNameElement) userNameElement.textContent = 'Error al cargar';
    if (userRoleElement) userRoleElement.textContent = 'Error al cargar';
  }
};

/**
 * Configura eventos globales del dashboard
 */
const configurarEventosGlobales = () => {
  // Escuchar cambios de sección desde la navegación
  document.addEventListener('sectionChange', manejarCambioSeccion);
  
  // Escuchar cambios en datos del usuario
  document.addEventListener('userDataChanged', manejarCambioUsuario);
  
  // Escuchar cambios en el estado de autenticación
  document.addEventListener('authStateChanged', manejarCambioAuth);
};

/**
 * Maneja los cambios de sección desde la navegación
 * @param {CustomEvent} event - Evento con detalles de la sección
 */
const manejarCambioSeccion = (event) => {
  const { section } = event.detail;
  
  console.log(`Cambiando a sección: ${section}`);
  
  // TODO: Implementar cambio de contenido según la sección
  switch (section) {
    case 'dashboard':
      mostrarSeccionDashboard();
      break;
    case 'proyectos':
      mostrarSeccionProyectos();
      break;
    case 'clientes':
      mostrarSeccionClientes();
      break;
    case 'inventario':
      mostrarSeccionInventario();
      break;
    default:
      console.warn(`Sección no reconocida: ${section}`);
  }
};

/**
 * Maneja cambios en los datos del usuario
 * @param {CustomEvent} event - Evento con datos del usuario
 */
const manejarCambioUsuario = async (event) => {
  console.log('Datos del usuario actualizados:', event.detail);
  
  // Actualizar componente de navegación si existe
  if (window.dashboardComponents?.navigation) {
    await window.dashboardComponents.navigation.actualizarUsuario();
  }
};

/**
 * Maneja cambios en el estado de autenticación
 * @param {CustomEvent} event - Evento con estado de autenticación
 */
const manejarCambioAuth = (event) => {
  const { autenticado } = event.detail;
  
  if (!autenticado) {
    // Usuario cerró sesión, limpiar componentes
    window.dashboardComponents = null;
    location.hash = '#Login';
  }
};

/**
 * Configura los eventos de las acciones rápidas
 */
const configurarAccionesRapidas = () => {
  // Escuchar clicks en las tarjetas de acciones
  document.querySelectorAll('.action-card').forEach(card => {
    card.addEventListener('click', (e) => {
      const action = card.getAttribute('data-action');
      manejarAccionRapida(action);
    });
  });
};

/**
 * Maneja las acciones rápidas del dashboard
 * @param {string} action - Acción a ejecutar
 */
const manejarAccionRapida = (action) => {
  switch (action) {
    case 'productos':
      mostrarGestionProductos();
      break;
    case 'usuarios':
      mostrarGestionUsuarios();
      break;
    case 'roles':
      window.location.hash = '#Roles';
      break;
    case 'herramientas':
      mostrarGestionHerramientas();
      break;
    case 'reportes':
      mostrarReportes();
      break;
    case 'configuracion':
      mostrarConfiguracion();
      break;
    default:
      console.warn(`Acción no reconocida: ${action}`);
  }
};

// Funciones para manejar secciones
const mostrarSeccionDashboard = () => {
  console.log('Mostrando sección Dashboard');
  // TODO: Mostrar contenido del dashboard principal
};

const mostrarSeccionProyectos = () => {
  console.log('Mostrando sección Proyectos'); 
  // TODO: Implementar vista de proyectos
  success('Funcionalidad de proyectos en desarrollo');
};

const mostrarSeccionClientes = () => {
  console.log('Mostrando sección Clientes');
  // TODO: Implementar vista de clientes
  success('Funcionalidad de clientes en desarrollo');
};

const mostrarSeccionInventario = () => {
  console.log('Mostrando sección Inventario');
  // TODO: Implementar vista de inventario
  success('Funcionalidad de inventario en desarrollo');
};

// Funciones para acciones rápidas
const mostrarGestionProductos = () => {
  console.log('Gestionar productos');
  // TODO: Implementar gestión de productos
  success('Funcionalidad de gestión de productos en desarrollo');
};

const mostrarGestionUsuarios = () => {
  console.log('Gestionar usuarios');
  window.location.hash = '#Usuarios';
};

const mostrarGestionHerramientas = () => {
  console.log('Gestionar herramientas');
  // TODO: Implementar gestión de herramientas
  success('Funcionalidad de gestión de herramientas en desarrollo');
};

const mostrarConfiguracion = () => {
  console.log('Configuración del sistema');
  // TODO: Implementar configuración
  success('Funcionalidad de configuración en desarrollo');
};

const mostrarNuevoProyecto = () => {
  console.log('Crear nuevo proyecto');
  // TODO: Implementar modal o vista de nuevo proyecto
  success('Funcionalidad de nuevo proyecto en desarrollo');
};

const mostrarGestionClientes = () => {
  console.log('Gestionar clientes');
  // TODO: Implementar gestión de clientes
  success('Funcionalidad de gestión de clientes en desarrollo');
};

const mostrarInventario = () => {
  console.log('Ver inventario');
  // TODO: Implementar vista de inventario
  success('Funcionalidad de inventario en desarrollo');
};

const mostrarReportes = () => {
  console.log('Ver reportes');
  // TODO: Implementar vista de reportes
  success('Funcionalidad de reportes en desarrollo');
};
