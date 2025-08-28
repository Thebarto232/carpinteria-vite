/**
 * Helper para gestión centralizada de usuario y sesión
 * Proporciona funciones para manejar datos del usuario y autenticación
 */

/**
 * Clase para gestión de usuario
 */
export class UserManager {
  constructor() {
    this.usuario = null;
    this.rol = null;
    this.permisos = [];
    this.token = null;
    this.refreshToken = null;
  }

  /**
   * Inicializa el gestor de usuario cargando datos del localStorage
   */
  init() {
    this.cargarDatosLocales();
  }

  /**
   * Carga los datos del usuario desde localStorage
   */
  cargarDatosLocales() {
    try {
      this.usuario = JSON.parse(localStorage.getItem('usuario') || '{}');
      this.rol = JSON.parse(localStorage.getItem('rol') || '{}');
      this.permisos = JSON.parse(localStorage.getItem('permisos') || '[]');
      this.token = localStorage.getItem('accessToken');
      this.refreshToken = localStorage.getItem('refreshToken');
    } catch (error) {
      console.error('Error al cargar datos del usuario:', error);
      this.limpiarDatos();
    }
  }

  /**
   * Guarda los datos del usuario en localStorage
   * @param {Object} datosUsuario - Datos del usuario a guardar
   */
  guardarDatos(datosUsuario) {
    try {
      if (datosUsuario.usuario) {
        this.usuario = datosUsuario.usuario;
        localStorage.setItem('usuario', JSON.stringify(datosUsuario.usuario));
      }

      if (datosUsuario.rol) {
        this.rol = datosUsuario.rol;
        localStorage.setItem('rol', JSON.stringify(datosUsuario.rol));
      }

      if (datosUsuario.permisos) {
        this.permisos = datosUsuario.permisos;
        localStorage.setItem('permisos', JSON.stringify(datosUsuario.permisos));
      }

      if (datosUsuario.accessToken) {
        this.token = datosUsuario.accessToken;
        localStorage.setItem('accessToken', datosUsuario.accessToken);
      }

      if (datosUsuario.refreshToken) {
        this.refreshToken = datosUsuario.refreshToken;
        localStorage.setItem('refreshToken', datosUsuario.refreshToken);
      }

    } catch (error) {
      console.error('Error al guardar datos del usuario:', error);
      throw new Error('Error al procesar los datos del usuario');
    }
  }

  /**
   * Limpia todos los datos del usuario
   */
  limpiarDatos() {
    this.usuario = null;
    this.rol = null;
    this.permisos = [];
    this.token = null;
    this.refreshToken = null;
    localStorage.clear();
  }

  /**
   * Verifica si el usuario está autenticado
   * @returns {boolean} true si está autenticado
   */
  estaAutenticado() {
    return !!this.token;
  }

  /**
   * Verifica si el usuario tiene un permiso específico
   * @param {string} permiso - Nombre del permiso a verificar
   * @returns {boolean} true si tiene el permiso
   */
  tienePermiso(permiso) {
    if (!this.permisos || this.permisos.length === 0) {
      return false;
    }

    return this.permisos.some(p => 
      p === permiso || 
      p === '*' || 
      (typeof p === 'object' && (p.nombre === permiso || p.codigo === permiso))
    );
  }

  /**
   * Verifica si el usuario tiene uno de varios permisos
   * @param {Array<string>} permisos - Array de permisos a verificar
   * @returns {boolean} true si tiene al menos uno de los permisos
   */
  tieneAlgunoDeEstosPermisos(permisos) {
    return permisos.some(permiso => this.tienePermiso(permiso));
  }

  /**
   * Verifica si el usuario tiene todos los permisos especificados
   * @param {Array<string>} permisos - Array de permisos que debe tener todos
   * @returns {boolean} true si tiene todos los permisos
   */
  tieneTodosLosPermisos(permisos) {
    return permisos.every(permiso => this.tienePermiso(permiso));
  }

  /**
   * Obtiene la información del usuario
   * @returns {Object} Datos del usuario
   */
  obtenerUsuario() {
    return this.usuario ? { ...this.usuario } : {};
  }

  /**
   * Obtiene la información del rol
   * @returns {Object} Datos del rol
   */
  obtenerRol() {
    return this.rol ? { ...this.rol } : {};
  }

  /**
   * Obtiene los permisos del usuario
   * @returns {Array} Array de permisos
   */
  obtenerPermisos() {
    return [...this.permisos];
  }

  /**
   * Alias para obtenerPermisos (compatibilidad)
   * @returns {Array} Array de permisos
   */
  getPermisos() {
    return this.obtenerPermisos();
  }

  /**
   * Obtiene el token de acceso
   * @returns {string|null} Token de acceso
   */
  obtenerToken() {
    return this.token;
  }

  /**
   * Obtiene el refresh token
   * @returns {string|null} Refresh token
   */
  obtenerRefreshToken() {
    return this.refreshToken;
  }

  /**
   * Actualiza el token de acceso
   * @param {string} nuevoToken - Nuevo token de acceso
   */
  actualizarToken(nuevoToken) {
    this.token = nuevoToken;
    localStorage.setItem('accessToken', nuevoToken);
  }

  /**
   * Obtiene el nombre completo del usuario
   * @returns {string} Nombre del usuario
   */
  obtenerNombreCompleto() {
    if (!this.usuario) return 'Usuario';
    
    return this.usuario.nombre_usuario || 
           this.usuario.nombre_completo || 
           this.usuario.nombre || 
           'Usuario';
  }

  /**
   * Obtiene el nombre del rol
   * @returns {string} Nombre del rol
   */
  obtenerNombreRol() {
    if (!this.rol) return 'Sin rol';
    
    return this.rol.nombre || 
           this.rol.descripcion || 
           'Sin rol';
  }

  /**
   * Verifica si el usuario es administrador
   * @returns {boolean} true si es administrador
   */
  esAdministrador() {
    return this.tienePermiso('*') || 
           this.tienePermiso('admin') ||
           (this.rol && this.rol.nombre && this.rol.nombre.toLowerCase().includes('admin'));
  }

  /**
   * Obtiene las iniciales del usuario para avatar
   * @returns {string} Iniciales del usuario
   */
  obtenerIniciales() {
    const nombre = this.obtenerNombreCompleto();
    const palabras = nombre.split(' ');
    
    if (palabras.length >= 2) {
      return palabras[0][0] + palabras[1][0];
    } else if (palabras.length === 1) {
      return palabras[0][0] + (palabras[0][1] || '');
    }
    
    return 'U';
  }

  /**
   * Escucha cambios en el localStorage para sincronizar datos
   */
  configurarSincronizacion() {
    window.addEventListener('storage', (event) => {
      if (['usuario', 'rol', 'permisos', 'accessToken', 'refreshToken'].includes(event.key)) {
        this.cargarDatosLocales();
        
        // Disparar evento personalizado para notificar cambios
        const eventoUsuario = new CustomEvent('userDataChanged', {
          detail: {
            usuario: this.usuario,
            rol: this.rol,
            permisos: this.permisos
          },
          bubbles: true
        });
        document.dispatchEvent(eventoUsuario);
      }
    });
  }

  /**
   * Obtiene un resumen del estado del usuario
   * @returns {Object} Resumen del estado
   */
  obtenerResumen() {
    return {
      autenticado: this.estaAutenticado(),
      usuario: this.obtenerNombreCompleto(),
      rol: this.obtenerNombreRol(),
      esAdmin: this.esAdministrador(),
      permisos: this.permisos.length,
      iniciales: this.obtenerIniciales()
    };
  }
}

// Crear instancia singleton
export const userManager = new UserManager();
