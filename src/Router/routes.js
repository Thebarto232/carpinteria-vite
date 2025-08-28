/**
 * Configuración de rutas de la aplicación SPA
 * Define todas las rutas disponibles, sus controladores y permisos
 */

import { homeController } from '../Views/Home/homeController.js';
import { loginController } from '../Views/Auth/Login/loginController.js';
import { dashboardController } from '../Views/Dashboard/dashboardController.js';
import { rolesController } from '../Views/Roles/rolesController.js';
import { usuariosController } from '../Views/Usuarios/usuariosController.js';
import { categoriasController } from '../Views/Categorias/categoriasController.js';

/**
 * Definición de rutas de la aplicación
 * Estructura:
 * - path: ruta del archivo HTML de la vista
 * - controlador: función que maneja la lógica de la vista
 * - private: indica si requiere autenticación
 * - can: permiso específico requerido para acceder
 */
export const routes = {
  // Página de inicio público
  Home: {    
    path: "Home/index.html",
    controlador: homeController,
    private: false
  },
  
  // Página de inicio de sesión
  Login: {
    path: "Auth/Login/index.html",
    controlador: loginController,
    private: false,
  },
  
  // Dashboard principal (requiere autenticación y permiso)
  Dashboard: {
    path: "Dashboard/index.html",
    controlador: dashboardController,
    private: true,
    can: 'dashboard'
  },
  
  // Gestión de roles (requiere autenticación y permiso)
  Roles: {
    path: "Roles/index.html",
    controlador: rolesController,
    private: true,
    can: 'leer_roles'
  },

  // Gestión de usuarios (requiere autenticación y permiso)
  Usuarios: {
    path: "Usuarios/index.html",
    controlador: usuariosController,
    private: true,
    can: 'leer_usuarios'
  },

  // Gestión de categorías (requiere autenticación y permiso)
  Categorias: {
    path: "Categorias/index.html",
    controlador: categoriasController,
    private: true,
    can: 'leer_categorias'
  },
  }
};
