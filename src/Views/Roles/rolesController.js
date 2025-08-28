/**
 * Controlador para la gestión de roles
 * Maneja el CRUD completo de roles con validación de permisos
 */

import { error, success, confirm } from "../../Helpers/alertas.js";
import * as api from "../../Helpers/api.js";
import { userManager } from "../../Helpers/userManager.js";
import { DashboardNavigation } from "../../Components/Navigation/DashboardNavigation.js";

/**
 * Función principal del controlador de roles
 */
export const rolesController = async () => {
    // Inicializar gestor de usuario
    userManager.init();

    // Inicializar la página
    await inicializarPagina();
};

/**
 * Inicializa la página de roles
 */
const inicializarPagina = async () => {
    try {
        // Inicializar componente de navegación
        const navigation = new DashboardNavigation();
        await navigation.init();
        
        // Inicializar Lucide icons
        if (typeof lucide !== 'undefined') {
            lucide.createIcons();
        }

        // Configurar eventos
        configurarEventos();
        
        // Cargar datos iniciales
        await cargarRoles();
        await cargarPermisos();
        
        // Configurar permisos de botones
        configurarPermisosUI();
        
    } catch (err) {
        console.error('Error inicializando página:', err);
        await error('Error al cargar la página de roles');
    }
};

/**
 * Configura los eventos de la página
 */
const configurarEventos = () => {
    // Botón crear rol
    document.getElementById('btnCrearRol')?.addEventListener('click', abrirModalCrear);
    
    // Botón actualizar
    document.getElementById('btnRefresh')?.addEventListener('click', cargarRoles);
    
    // Búsqueda en tiempo real
    document.getElementById('searchInput')?.addEventListener('input', filtrarRoles);
    
    // Modal eventos
    document.getElementById('closeModal')?.addEventListener('click', cerrarModal);
    document.getElementById('btnCancelar')?.addEventListener('click', cerrarModal);
    document.getElementById('closeModalConfirmar')?.addEventListener('click', cerrarModalConfirmacion);
    document.getElementById('btnCancelarEliminar')?.addEventListener('click', cerrarModalConfirmacion);
    
    // Submit formulario
    document.getElementById('rolForm')?.addEventListener('submit', manejarSubmitFormulario);
    
    // Confirmación de eliminación
    document.getElementById('btnConfirmarEliminar')?.addEventListener('click', confirmarEliminacion);
    
    // Cerrar modal al hacer click fuera
    document.getElementById('modalRol')?.addEventListener('click', (e) => {
        if (e.target.id === 'modalRol') cerrarModal();
    });
    
    document.getElementById('modalConfirmar')?.addEventListener('click', (e) => {
        if (e.target.id === 'modalConfirmar') cerrarModalConfirmacion();
    });
};

/**
 * Configura la UI según los permisos del usuario
 */
const configurarPermisosUI = () => {
    const permisos = userManager.getPermisos();
    
    // Botón crear
    const btnCrear = document.getElementById('btnCrearRol');
    if (btnCrear && !permisos.includes('crear_roles', '*')) {
        btnCrear.style.display = 'none';
    }
};

/**
 * Carga todos los roles desde la API
 */
const cargarRoles = async () => {
    try {
        mostrarCargando();
        
        const response = await api.get('/roles');
        
        if (response.success) {
            mostrarTablaRoles(response.data);
        } else {
            throw new Error(response.message || 'Error al cargar roles');
        }
        
    } catch (err) {
        console.error('Error cargando roles:', err);
        mostrarError('Error al cargar los roles');
    }
};

/**
 * Carga todos los permisos disponibles
 */
const cargarPermisos = async () => {
    try {
        const response = await api.get('/permisos');
        
        if (response.success) {
            window.permisosDisponibles = response.data;
            mostrarPermisosEnModal(response.data);
        } else {
            throw new Error(response.message || 'Error al cargar permisos');
        }
        
    } catch (err) {
        console.error('Error cargando permisos:', err);
        // No mostramos error aquí porque no es crítico para la funcionalidad básica
    }
};

/**
 * Muestra la tabla de roles
 */
const mostrarTablaRoles = (roles) => {
    const container = document.getElementById('rolesTableContainer');
    if (!container) return;
    
    if (!roles || roles.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <i data-lucide="shield"></i>
                <h3>No hay roles registrados</h3>
                <p>Comienza creando el primer rol del sistema</p>
            </div>
        `;
        lucide.createIcons();
        return;
    }
    
    const permisos = userManager.getPermisos();

    // tambien permitir los que tengan el *
    const puedeEditar = permisos.includes('actualizar_roles') || permisos.includes('*');
    const puedeEliminar = permisos.includes('eliminar_roles') || permisos.includes('*');

    console.log('Permisos del usuario:', permisos);
    console.log('Puede editar:', puedeEditar);
    console.log('Puede eliminar:', puedeEliminar);

    container.innerHTML = `
        <table class="roles-table">
            <thead>
                <tr>
                    <th>ID</th>
                    <th>Nombre del Rol</th>
                    <th>Descripción</th>
                    <th>Fecha Creación</th>
                    <th>Acciones</th>
                </tr>
            </thead>
            <tbody>
                ${roles.map(rol => `
                    <tr data-rol-id="${rol.id_rol}">
                        <td>${rol.id_rol}</td>
                        <td><strong>${rol.nombre_rol}</strong></td>
                        <td>${rol.descripcion || 'Sin descripción'}</td>
                        <td>${formatearFecha(rol.fecha_creacion)}</td>
                        <td>
                            <div class="actions">
                                <button 
                                    class="btn btn-sm btn-primary" 
                                    onclick="verDetallesRol(${rol.id_rol})"
                                    title="Ver detalles"
                                >
                                    <i data-lucide="eye"></i>
                                    Ver
                                </button>
                                ${puedeEditar ? `
                                    <button 
                                        class="btn btn-sm btn-success" 
                                        onclick="editarRol(${rol.id_rol})"
                                        title="Editar rol"
                                    >
                                        <i data-lucide="edit"></i>
                                        Editar
                                    </button>
                                ` : ''}
                                ${puedeEliminar ? `
                                    <button 
                                        class="btn btn-sm btn-danger" 
                                        onclick="eliminarRol(${rol.id_rol}, '${rol.nombre_rol}')"
                                        title="Eliminar rol"
                                    >
                                        <i data-lucide="trash-2"></i>
                                        Eliminar
                                    </button>
                                ` : ''}
                            </div>
                        </td>
                    </tr>
                `).join('')}
            </tbody>
        </table>
    `;
    
    // Actualizar iconos
    lucide.createIcons();
};

/**
 * Muestra los permisos en el modal
 */
const mostrarPermisosEnModal = (permisos) => {
    const container = document.getElementById('permisosContainer');
    if (!container) return;
    
    // Agrupar permisos por módulo
    const permisosPorModulo = {};
    
    if (Array.isArray(permisos)) {
        permisos.forEach(permiso => {
            if (!permisosPorModulo[permiso.modulo]) {
                permisosPorModulo[permiso.modulo] = [];
            }
            permisosPorModulo[permiso.modulo].push(permiso);
        });
    } else {
        // Si permisos ya está agrupado
        Object.assign(permisosPorModulo, permisos);
    }
    
    container.innerHTML = Object.keys(permisosPorModulo).map(modulo => `
        <div class="permiso-group">
            <h4>${capitalizeFirst(modulo)}</h4>
            ${permisosPorModulo[modulo].map(permiso => `
                <div class="permiso-item">
                    <input 
                        type="checkbox" 
                        id="permiso_${permiso.id_permiso}" 
                        name="permisos" 
                        value="${permiso.id_permiso}"
                    >
                    <label for="permiso_${permiso.id_permiso}">
                        ${permiso.nombre_permiso}
                        ${permiso.descripcion ? `<br><small style="color: #718096;">${permiso.descripcion}</small>` : ''}
                    </label>
                </div>
            `).join('')}
        </div>
    `).join('');
};

/**
 * Filtra los roles según el texto de búsqueda
 */
const filtrarRoles = () => {
    const searchTerm = document.getElementById('searchInput')?.value.toLowerCase() || '';
    const filas = document.querySelectorAll('.roles-table tbody tr');
    
    filas.forEach(fila => {
        const nombre = fila.querySelector('td:nth-child(2)')?.textContent.toLowerCase() || '';
        const descripcion = fila.querySelector('td:nth-child(3)')?.textContent.toLowerCase() || '';
        
        const coincide = nombre.includes(searchTerm) || descripcion.includes(searchTerm);
        fila.style.display = coincide ? '' : 'none';
    });
};

/**
 * Abre el modal para crear un nuevo rol
 */
const abrirModalCrear = () => {
    // Limpiar formulario y errores
    document.getElementById('rolForm').reset();
    limpiarErrores();
    
    // Configurar títulos
    document.getElementById('modalTitleText').textContent = 'Crear Rol';
    
    // Limpiar permisos seleccionados
    document.querySelectorAll('input[name="permisos"]').forEach(cb => {
        cb.checked = false;
        cb.disabled = false;
    });
    
    // Habilitar campos
    document.getElementById('nombreRol').disabled = false;
    document.getElementById('descripcionRol').disabled = false;
    
    // Configurar botón guardar
    const btnGuardar = document.getElementById('btnGuardar');
    if (btnGuardar) {
        btnGuardar.innerHTML = '<i data-lucide="save"></i><span id="btnGuardarText">Crear Rol</span>';
        btnGuardar.type = 'submit';
        btnGuardar.className = 'btn btn-primary';
        btnGuardar.onclick = null;
    }
    
    window.rolEditando = null;
    document.getElementById('modalRol').classList.add('show');
    document.getElementById('nombreRol').focus();
    
    // Reinicializar iconos
    if (typeof lucide !== 'undefined') {
        lucide.createIcons();
    }
};

/**
 * Abre el modal para editar un rol existente
 */
const editarRol = async (idRol) => {
    try {
        const response = await api.get(`/roles/${idRol}/permisos`);
        
        if (!response.success) {
            throw new Error(response.message || 'Error al cargar datos del rol');
        }
        
        const rol = response.data;
        
        // Configurar títulos
        document.getElementById('modalTitleText').textContent = 'Editar Rol';
        
        // Llenar formulario
        document.getElementById('nombreRol').value = rol.nombre_rol;
        document.getElementById('descripcionRol').value = rol.descripcion || '';
        
        // Habilitar campos
        document.getElementById('nombreRol').disabled = false;
        document.getElementById('descripcionRol').disabled = false;
        
        // Marcar permisos actuales
        document.querySelectorAll('input[name="permisos"]').forEach(cb => {
            cb.checked = rol.permisos?.some(p => p.id_permiso == cb.value) || false;
            cb.disabled = false;
        });
        
        // Configurar botón guardar
        const btnGuardar = document.getElementById('btnGuardar');
        if (btnGuardar) {
            btnGuardar.innerHTML = '<i data-lucide="save"></i><span id="btnGuardarText">Actualizar Rol</span>';
            btnGuardar.type = 'submit';
            btnGuardar.className = 'btn btn-primary';
            btnGuardar.onclick = null;
        }
        
        limpiarErrores();
        window.rolEditando = idRol;
        document.getElementById('modalRol').classList.add('show');
        document.getElementById('nombreRol').focus();
        
        // Reinicializar iconos
        if (typeof lucide !== 'undefined') {
            lucide.createIcons();
        }
        
    } catch (err) {
        console.error('Error cargando rol:', err);
        await error('Error al cargar los datos del rol');
    }
};

/**
 * Ver detalles de un rol
 */
const verDetallesRol = async (idRol) => {
    try {
        const response = await api.get(`/roles/${idRol}/permisos`);
        
        if (!response.success) {
            throw new Error(response.message || 'Error al cargar datos del rol');
        }
        
        const rol = response.data;
        
        document.getElementById('modalTitleText').textContent = 'Detalles del Rol';
        document.getElementById('nombreRol').value = rol.nombre_rol;
        document.getElementById('descripcionRol').value = rol.descripcion || '';
        
        // Deshabilitar campos
        document.getElementById('nombreRol').disabled = true;
        document.getElementById('descripcionRol').disabled = true;
        
        // Marcar permisos (deshabilitados)
        document.querySelectorAll('input[name="permisos"]').forEach(cb => {
            cb.checked = rol.permisos?.some(p => p.id_permiso == cb.value) || false;
            cb.disabled = true;
        });
        
        // Cambiar botón guardar por cerrar
        const btnGuardar = document.getElementById('btnGuardar');
        if (btnGuardar) {
            btnGuardar.innerHTML = '<i data-lucide="x"></i>Cerrar';
            btnGuardar.type = 'button';
            btnGuardar.className = 'btn btn-secondary';
            btnGuardar.onclick = cerrarModal;
        }
        
        window.rolEditando = 'view';
        document.getElementById('modalRol').classList.add('show');
        
        // Reinicializar iconos
        if (typeof lucide !== 'undefined') {
            lucide.createIcons();
        }
        
    } catch (err) {
        console.error('Error cargando rol:', err);
        await error('Error al cargar los datos del rol');
    }
};

/**
 * Eliminar rol
 */
const eliminarRol = (idRol, nombreRol) => {
    document.getElementById('rolAEliminar').textContent = nombreRol;
    window.rolAEliminar = idRol;
    document.getElementById('modalConfirmar').classList.add('show');
};

/**
 * Confirma la eliminación del rol
 */
const confirmarEliminacion = async () => {
    try {
        const idRol = window.rolAEliminar;
        
        const response = await api.del(`/roles/${idRol}`);
        
        if (response.success) {
            await success('Rol eliminado correctamente');
            cerrarModalConfirmacion();
            await cargarRoles();
        } else {
            throw new Error(response.message || 'Error al eliminar rol');
        }
        
    } catch (err) {
        console.error('Error eliminando rol:', err);
        await error(err.message || 'Error al eliminar el rol');
    }
};

/**
 * Maneja el submit del formulario
 */
const manejarSubmitFormulario = async (e) => {
    e.preventDefault();
    
    if (window.rolEditando === 'view') {
        cerrarModal();
        return;
    }
    
    try {
        const formData = new FormData(e.target);
        const datos = {
            nombre_rol: formData.get('nombre_rol').trim(),
            descripcion: formData.get('descripcion').trim()
        };
        
        // Obtener permisos seleccionados
        const permisosSeleccionados = Array.from(document.querySelectorAll('input[name="permisos"]:checked'))
            .map(cb => parseInt(cb.value));
        
        // Validar datos
        if (!validarFormulario(datos)) {
            return;
        }
        
        let response;
        
        if (window.rolEditando && window.rolEditando !== 'view') {
            // Editar rol existente
            response = await api.put(`/roles/${window.rolEditando}`, datos);
            
            if (response.success && permisosSeleccionados.length > 0) {
                // Actualizar permisos
                await api.post(`/roles/${window.rolEditando}/permisos`, {
                    permisos: permisosSeleccionados
                });
            }
        } else {
            // Crear nuevo rol
            response = await api.post('/roles', datos);
            
            if (response.success && permisosSeleccionados.length > 0) {
                // Asignar permisos al nuevo rol
                const nuevoRolId = response.data.id_rol || response.data.insertId;
                await api.post(`/roles/${nuevoRolId}/permisos`, {
                    permisos: permisosSeleccionados
                });
            }
        }
        
        if (response.success) {
            await success(window.rolEditando ? 'Rol actualizado correctamente' : 'Rol creado correctamente');
            cerrarModal();
            await cargarRoles();
        } else {
            throw new Error(response.message || 'Error al guardar rol');
        }
        
    } catch (err) {
        console.error('Error guardando rol:', err);
        await error(err.message || 'Error al guardar el rol');
    }
};

/**
 * Valida el formulario
 */
const validarFormulario = (datos) => {
    limpiarErrores();
    let esValido = true;
    
    if (!datos.nombre_rol) {
        mostrarError('errorNombreRol', 'El nombre del rol es obligatorio');
        esValido = false;
    } else if (datos.nombre_rol.length < 3) {
        mostrarError('errorNombreRol', 'El nombre debe tener al menos 3 caracteres');
        esValido = false;
    }
    
    return esValido;
};

/**
 * Cierra el modal principal
 */
const cerrarModal = () => {
    document.getElementById('modalRol').classList.remove('show');
    
    // Rehabilitar campos si estaban deshabilitados
    document.getElementById('nombreRol').disabled = false;
    document.getElementById('descripcionRol').disabled = false;
    document.querySelectorAll('input[name="permisos"]').forEach(cb => cb.disabled = false);
    
    // Restaurar botón guardar completamente
    const btnGuardar = document.getElementById('btnGuardar');
    if (btnGuardar) {
        btnGuardar.innerHTML = '<i data-lucide="save"></i><span id="btnGuardarText">Crear Rol</span>';
        btnGuardar.onclick = null;
        btnGuardar.type = 'submit';
        btnGuardar.className = 'btn btn-primary';
        
        // Re-asignar el evento submit al formulario
        const form = document.getElementById('rolForm');
        if (form) {
            form.onsubmit = manejarSubmitFormulario;
        }
    }
    
    // Limpiar el formulario
    document.getElementById('rolForm')?.reset();
    
    limpiarErrores();
    window.rolEditando = null;
    
    // Reinicializar iconos de Lucide
    if (typeof lucide !== 'undefined') {
        lucide.createIcons();
    }
};

/**
 * Cierra el modal de confirmación
 */
const cerrarModalConfirmacion = () => {
    document.getElementById('modalConfirmar').classList.remove('show');
    window.rolAEliminar = null;
};

/**
 * Muestra estado de carga
 */
const mostrarCargando = () => {
    const container = document.getElementById('rolesTableContainer');
    if (container) {
        container.innerHTML = `
            <div class="loading">
                <i data-lucide="loader-2" style="animation: spin 1s linear infinite;"></i>
                <p>Cargando roles...</p>
            </div>
        `;
        lucide.createIcons();
    }
};

/**
 * Muestra mensaje de error
 */
const mostrarError = (elementId, mensaje) => {
    const elemento = document.getElementById(elementId);
    if (elemento) {
        elemento.textContent = mensaje;
        const input = document.getElementById(elementId.replace('error', ''));
        if (input) {
            input.classList.add('error');
        }
    }
};

/**
 * Limpia todos los errores
 */
const limpiarErrores = () => {
    document.querySelectorAll('.error-message').forEach(el => el.textContent = '');
    document.querySelectorAll('.form-control.error').forEach(el => el.classList.remove('error'));
};

/**
 * Formatea una fecha
 */
const formatearFecha = (fecha) => {
    if (!fecha) return 'No especificada';
    
    try {
        return new Date(fecha).toLocaleDateString('es-ES', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    } catch (err) {
        return 'Fecha inválida';
    }
};

/**
 * Capitaliza la primera letra
 */
const capitalizeFirst = (str) => {
    return str.charAt(0).toUpperCase() + str.slice(1);
};

// Exponer funciones globalmente para uso en onclick
window.editarRol = editarRol;
window.verDetallesRol = verDetallesRol;
window.eliminarRol = eliminarRol;

// Añadir estilos para la animación de carga
const style = document.createElement('style');
style.textContent = `
    @keyframes spin {
        from { transform: rotate(0deg); }
        to { transform: rotate(360deg); }
    }
`;
document.head.appendChild(style);
