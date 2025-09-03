/**
 * Helper para realizar peticiones HTTP a la API
 * Proporciona métodos para GET, POST, PUT y DELETE con manejo de tokens
 */

// URL base de la API
const API_URL = 'http://localhost:3000/api';

/**
 * Obtiene el token de acceso del localStorage
 * @returns {string|null} Token de acceso o null si no existe
 */
const getAccessToken = () => {
  return localStorage.getItem('accessToken');
};

/**
 * Obtiene el refresh token del localStorage
 * @returns {string|null} Refresh token o null si no existe
 */
const getRefreshToken = () => {
  return localStorage.getItem('refreshToken');
};

/**
 * Configura los headers comunes para las peticiones
 * @param {boolean} includeAuth - Si incluir el token de autorización
 * @returns {Object} Objeto con los headers configurados
 */
const getHeaders = (includeAuth = true) => {
  const headers = {
    'Content-Type': 'application/json'
  };

  if (includeAuth) {
    const token = getAccessToken();
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
  }

  return headers;
};

/**
 * Intenta renovar el token de acceso usando el refresh token
 * @returns {boolean} true si se renovó exitosamente, false en caso contrario
 */
const renovarToken = async () => {
  try {
    const refreshToken = getRefreshToken();
    if (!refreshToken) {
      return false;
    }

    const respuesta = await fetch(`${API_URL}/auth/refresh`, {
      method: 'POST',
      headers: getHeaders(false),
      body: JSON.stringify({ refreshToken })
    });

    if (respuesta.ok) {
      const datos = await respuesta.json();
      if (datos.success && datos.data) {
        localStorage.setItem('accessToken', datos.data.accessToken);
        if (datos.data.refreshToken) {
          localStorage.setItem('refreshToken', datos.data.refreshToken);
        }
        return true;
      }
    }

    return false;
  } catch (error) {
    console.error('Error al renovar token:', error);
    return false;
  }
};

/**
 * Maneja respuestas de la API y tokens expirados
 * @param {Response} respuesta - Respuesta de fetch
 * @param {string} endpoint - Endpoint original
 * @param {Object} opciones - Opciones originales de fetch
 * @returns {Promise<Object>} Datos de la respuesta
 */
const manejarRespuesta = async (respuesta, endpoint, opciones) => {
  // Si el token expiró, intentar renovarlo
  if (respuesta.status === 401) {
    const tokenRenovado = await renovarToken();
    
    if (tokenRenovado) {
      // Reintentar la petición con el nuevo token
      const nuevasOpciones = {
        ...opciones,
        headers: {
          ...opciones.headers,
          'Authorization': `Bearer ${getAccessToken()}`
        }
      };
      
      const nuevaRespuesta = await fetch(`${API_URL}${endpoint}`, nuevasOpciones);
      return await nuevaRespuesta.json();
    } else {
      // No se pudo renovar el token, redirigir al login
      localStorage.clear();
      location.hash = '#Login';
      return { success: false, message: 'Sesión expirada' };
    }
  }

  return await respuesta.json();
};

/**
 * Realiza una petición GET a la API
 * @param {string} endpoint - Endpoint de la API (sin /api)
 * @returns {Promise<Object>} Respuesta de la API
 */
export const get = async (endpoint) => {
  try {
    const respuesta = await fetch(`${API_URL}${endpoint}`, {
      method: 'GET',
      headers: getHeaders()
    });

    return await manejarRespuesta(respuesta, endpoint, { method: 'GET', headers: getHeaders() });
  } catch (error) {
    console.error('Error en petición GET:', error);
    return { success: false, message: 'Error de conexión' };
  }
};

/**
 * Realiza una petición POST a la API
 * @param {string} endpoint - Endpoint de la API (sin /api)
 * @param {Object} data - Datos a enviar en el body
 * @param {boolean} includeAuth - Si incluir token de autorización
 * @returns {Promise<Object>} Respuesta de la API
 */
export const post = async (endpoint, data, includeAuth = true) => {
  try {
    const opciones = {
      method: 'POST',
      headers: getHeaders(includeAuth),
      body: JSON.stringify(data)
    };

    const respuesta = await fetch(`${API_URL}${endpoint}`, opciones);
    return await manejarRespuesta(respuesta, endpoint, opciones);
  } catch (error) {
    console.error('Error en petición POST:', error);
    return { success: false, message: 'Error de conexión' };
  }
};

/**
 * Realiza una petición PUT a la API
 * @param {string} endpoint - Endpoint de la API (sin /api)
 * @param {Object} data - Datos a enviar en el body
 * @returns {Promise<Object>} Respuesta de la API
 */
export const put = async (endpoint, data) => {
  try {
    const opciones = {
      method: 'PUT',
      headers: getHeaders(),
      body: JSON.stringify(data)
    };

    const respuesta = await fetch(`${API_URL}${endpoint}`, opciones);
    return await manejarRespuesta(respuesta, endpoint, opciones);
  } catch (error) {
    console.error('Error en petición PUT:', error);
    return { success: false, message: 'Error de conexión' };
  }
};

/**
 * Realiza una petición PATCH a la API
 * @param {string} endpoint - Endpoint de la API (sin /api)
 * @param {Object} data - Datos a enviar en el body
 * @returns {Promise<Object>} Respuesta de la API
 */
export const patch = async (endpoint, data) => {
  try {
    const opciones = {
      method: 'PATCH',
      headers: getHeaders(),
      body: JSON.stringify(data)
    };

    const respuesta = await fetch(`${API_URL}${endpoint}`, opciones);
    return await manejarRespuesta(respuesta, endpoint, opciones);
  } catch (error) {
    console.error('Error en petición PATCH:', error);
    return { success: false, message: 'Error de conexión' };
  }
};

/**
 * Realiza una petición DELETE a la API
 * @param {string} endpoint - Endpoint de la API (sin /api)
 * @returns {Promise<Object>} Respuesta de la API
 */
export const del = async (endpoint) => {
  try {
    const opciones = {
      method: 'DELETE',
      headers: getHeaders()
    };

    const respuesta = await fetch(`${API_URL}${endpoint}`, opciones);
    return await manejarRespuesta(respuesta, endpoint, opciones);
  } catch (error) {
    console.error('Error en petición DELETE:', error);
    return { success: false, message: 'Error de conexión' };
  }
};
