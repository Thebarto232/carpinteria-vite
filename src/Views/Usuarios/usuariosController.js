/**
 * Controlador para la gestión de usuarios
 * Maneja el CRUD completo de usuarios con validación de permisos
 */

import { error, success, confirm } from "../../Helpers/alertas.js";
import * as api from "../../Helpers/api.js";
import { userManager } from "../../Helpers/userManager.js";
import { DashboardNavigation } from "../../Components/Navigation/DashboardNavigation.js";

/**
 * Función principal del controlador de usuarios
 */
export const usuariosController = async () => {
    // Inicializar gestor de usuario
    userManager.init();

    // Inicializar la página
    await inicializarPagina();
};

/**
 * Inicializa la página de usuarios
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
        await cargarUsuarios();
        await cargarRoles();
        
        // Configurar permisos de botones
        configurarPermisosUI();
        
    } catch (err) {
        console.error('Error inicializando página:', err);
        await error('Error al cargar la página de usuarios');
    }
};

/**
 * Configura los eventos de la página
 */
const configurarEventos = () => {
    // Botón crear usuario
    document.getElementById('btnCrearUsuario')?.addEventListener('click', abrirModalCrear);
    
    // Botón actualizar
    document.getElementById('btnRefresh')?.addEventListener('click', cargarUsuarios);
    
    // Búsqueda en tiempo real
    document.getElementById('searchInput')?.addEventListener('input', filtrarUsuarios);
    document.getElementById('filtroRol')?.addEventListener('change', filtrarUsuarios);
    
    // Modal eventos
    document.getElementById('closeModal')?.addEventListener('click', cerrarModal);
    document.getElementById('btnCancelar')?.addEventListener('click', cerrarModal);
    document.getElementById('closeModalConfirmar')?.addEventListener('click', cerrarModalConfirmacion);
    document.getElementById('btnCancelarEliminar')?.addEventListener('click', cerrarModalConfirmacion);
    
    // Submit formulario
    document.getElementById('usuarioForm')?.addEventListener('submit', manejarSubmitFormulario);
    
    // Confirmación de eliminación
    document.getElementById('btnConfirmarEliminar')?.addEventListener('click', confirmarEliminacion);
    
    // Cerrar modal al hacer click fuera
    document.getElementById('modalUsuario')?.addEventListener('click', (e) => {
        if (e.target.id === 'modalUsuario') cerrarModal();
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
    const btnCrear = document.getElementById('btnCrearUsuario');
    if (btnCrear && !permisos.includes('crear_usuarios') && !permisos.includes('*')) {
        btnCrear.style.display = 'none';
    }
};

/**
 * Carga todos los usuarios desde la API
 */
const cargarUsuarios = async () => {
    try {
        mostrarCargando();
        
        const response = await api.get('/usuarios');
        
        if (response.success) {
            // El backend devuelve {usuarios: [...], paginacion: {...}}
            const usuarios = response.data.usuarios || response.data;
            mostrarTablaUsuarios(usuarios);
        } else {
            throw new Error(response.message || 'Error al cargar usuarios');
        }
        
    } catch (err) {
        console.error('Error cargando usuarios:', err);
        mostrarErrorCarga('Error al cargar los usuarios');
    }
};

/**
 * Carga todos los roles disponibles
 */
const cargarRoles = async () => {
    try {
        const response = await api.get('/roles');
        
        if (response.success) {
            window.rolesDisponibles = response.data;
            llenarSelectRoles(response.data);
            llenarFiltroRoles(response.data);
        } else {
            throw new Error(response.message || 'Error al cargar roles');
        }
        
    } catch (err) {
        console.error('Error cargando roles:', err);
        // No mostramos error aquí porque no es crítico para la funcionalidad básica
    }
};

/**
 * Llena el select de roles en el modal
 */
const llenarSelectRoles = (roles) => {
    const select = document.getElementById('rolUsuario');
    if (!select || !roles) return;
    
    select.innerHTML = '<option value="">Selecciona un rol</option>';
    
    // Manejar tanto arrays como objetos de roles
    const rolesArray = Array.isArray(roles) ? roles : Object.values(roles);
    
    rolesArray.forEach(rol => {
        const option = document.createElement('option');
        // Usar el nombre del rol como value para que coincida con lo que devuelve el backend
        option.value = rol.nombre_rol || rol.rol || rol.name;
        option.textContent = rol.nombre_rol || rol.rol || rol.name;
        select.appendChild(option);
    });
};

/**
 * Llena el filtro de roles
 */
const llenarFiltroRoles = (roles) => {
    const filtro = document.getElementById('filtroRol');
    if (!filtro || !roles) return;
    
    filtro.innerHTML = '<option value="">Todos los roles</option>';
    
    // Manejar tanto arrays como objetos de roles
    const rolesArray = Array.isArray(roles) ? roles : Object.values(roles);
    
    rolesArray.forEach(rol => {
        const option = document.createElement('option');
        // Usar el nombre del rol como value para que coincida con lo que devuelve el backend
        option.value = rol.nombre_rol || rol.rol || rol.name;
        option.textContent = rol.nombre_rol || rol.rol || rol.name;
        filtro.appendChild(option);
    });
};

/**
 * Muestra la tabla de usuarios
 */
const mostrarTablaUsuarios = (usuarios) => {
    
    const container = document.getElementById('usuariosTableContainer');
    if (!container) return;
    
    if (!usuarios || usuarios.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <i data-lucide="users"></i>
                <h3>No hay usuarios registrados</h3>
                <p>Comienza creando el primer usuario del sistema</p>
            </div>
        `;
        lucide.createIcons();
        return;
    }
    
    const permisos = userManager.getPermisos();
    const puedeEditar = permisos.includes('editar_usuarios') || permisos.includes('*');
    const puedeEliminar = permisos.includes('eliminar_usuarios') || permisos.includes('*');

    container.innerHTML = `
        <table class="usuarios-table">
            <thead>
                <tr>
                    <th>ID</th>
                    <th>Nombre Completo</th>
                    <th>Email</th>
                    <th>Teléfono</th>
                    <th>Rol</th>
                    <th>Estado</th>
                    <th>Fecha Registro</th>
                    <th>Acciones</th>
                </tr>
            </thead>
            <tbody>
                ${usuarios.map(usuario => `
                    <tr data-usuario-id="${usuario.id_usuario}">
                        <td>${usuario.id_usuario}</td>
                        <td>
                            <div>
                                <strong>${usuario.nombre_usuario}</strong>
                                ${usuario.ultimo_acceso ? `<br><small style="color: #6b7280;">Último acceso: ${formatearFecha(usuario.ultimo_acceso)}</small>` : ''}
                            </div>
                        </td>
                        <td>${usuario.correo}</td>
                        <td>${usuario.telefono || '-'}</td>
                        <td>
                            <span class="role-badge">${usuario.rol || 'Sin rol'}</span>
                        </td>
                        <td>
                            <span class="status-badge ${usuario.estado === 'ACTIVO' ? 'status-active' : 'status-inactive'}">
                                ${usuario.estado || 'Inactivo'}
                            </span>
                        </td>
                        <td>${formatearFecha(usuario.fecha_registro)}</td>
                        <td>
                            <div class="actions">
                                <button 
                                    class="btn btn-sm btn-primary" 
                                    onclick="verDetallesUsuario(${usuario.id_usuario})"
                                    title="Ver detalles"
                                >
                                    <i data-lucide="eye"></i>
                                    Ver
                                </button>
                                ${puedeEditar ? `
                                    <button 
                                        class="btn btn-sm btn-success" 
                                        onclick="editarUsuario(${usuario.id_usuario})"
                                        title="Editar usuario"
                                    >
                                        <i data-lucide="edit"></i>
                                        Editar
                                    </button>
                                ` : ''}
                                ${puedeEliminar ? `
                                    <button 
                                        class="btn btn-sm btn-danger" 
                                        onclick="eliminarUsuario(${usuario.id_usuario}, '${usuario.nombre_usuario}')"
                                        title="Eliminar usuario"
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
    
    // Guardar usuarios en variable global para uso posterior
    window.usuariosData = usuarios;
    
    // Extraer roles únicos de los usuarios para el filtro
    actualizarFiltroRolesDeUsuarios(usuarios);
    
    // Actualizar iconos
    lucide.createIcons();
};

/**
 * Actualiza el filtro de roles basado en los roles de los usuarios cargados
 */
const actualizarFiltroRolesDeUsuarios = (usuarios) => {
    const filtro = document.getElementById('filtroRol');
    if (!filtro || !usuarios) return;
    
    // Extraer roles únicos
    const rolesUnicos = [...new Set(usuarios.map(u => u.rol).filter(Boolean))];
    
    filtro.innerHTML = '<option value="">Todos los roles</option>';
    rolesUnicos.forEach(rol => {
        const option = document.createElement('option');
        option.value = rol;
        option.textContent = rol;
        filtro.appendChild(option);
    });
};

/**
 * Filtra los usuarios según el texto de búsqueda y rol
 */
const filtrarUsuarios = () => {
    const searchTerm = document.getElementById('searchInput')?.value.toLowerCase() || '';
    const rolFiltro = document.getElementById('filtroRol')?.value || '';
    const filas = document.querySelectorAll('.usuarios-table tbody tr');
    
    filas.forEach(fila => {
        const nombre = fila.querySelector('td:nth-child(2)')?.textContent.toLowerCase() || '';
        const email = fila.querySelector('td:nth-child(3)')?.textContent.toLowerCase() || '';
        const rol = fila.querySelector('td:nth-child(5)')?.textContent.toLowerCase() || '';
        
        // Filtro por texto
        const coincideTexto = nombre.includes(searchTerm) || email.includes(searchTerm) || rol.includes(searchTerm);
        
        // Filtro por rol
        let coincideRol = true;
        if (rolFiltro) {
            const usuario = window.usuariosData?.find(u => u.id_usuario == fila.dataset.usuarioId);
            coincideRol = usuario && (usuario.rol === rolFiltro);
        }
        
        fila.style.display = (coincideTexto && coincideRol) ? '' : 'none';
    });
};

/**
 * Abre el modal para crear un nuevo usuario
 */
const abrirModalCrear = () => {
    // Limpiar formulario y errores
    document.getElementById('usuarioForm').reset();
    limpiarErrores();
    
    // Configurar títulos
    document.getElementById('modalTitleText').textContent = 'Crear Usuario';
    
    // Mostrar campos de contraseña
    document.getElementById('passwordGroup').style.display = 'block';
    document.getElementById('confirmPasswordGroup').style.display = 'block';
    document.getElementById('password').required = true;
    document.getElementById('confirmPassword').required = true;
    
    // Habilitar campos
    habilitarCampos(true);
    
    // Configurar botón guardar
    const btnGuardar = document.getElementById('btnGuardar');
    if (btnGuardar) {
        btnGuardar.innerHTML = '<i data-lucide="save"></i><span id="btnGuardarText">Crear Usuario</span>';
        btnGuardar.type = 'submit';
        btnGuardar.className = 'btn btn-primary';
        btnGuardar.onclick = null;
    }
    
    window.usuarioEditando = null;
    document.getElementById('modalUsuario').classList.add('show');
    document.getElementById('nombres').focus();
    
    // Reinicializar iconos
    if (typeof lucide !== 'undefined') {
        lucide.createIcons();
    }
};

/**
 * Abre el modal para editar un usuario existente
 */
const editarUsuario = async (idUsuario) => {
    try {
        const usuario = window.usuariosData?.find(u => u.id_usuario === idUsuario);
        if (!usuario) {
            throw new Error('Usuario no encontrado');
        }
        
        // Configurar títulos
        document.getElementById('modalTitleText').textContent = 'Editar Usuario';
        
        // Llenar formulario
        llenarFormulario(usuario);
        
        // Habilitar campos
        habilitarCampos(true);
        
        // Ocultar campos de contraseña en edición
        document.getElementById('passwordGroup').style.display = 'none';
        document.getElementById('confirmPasswordGroup').style.display = 'none';
        document.getElementById('password').required = false;
        document.getElementById('confirmPassword').required = false;
        
        // Configurar botón guardar
        const btnGuardar = document.getElementById('btnGuardar');
        if (btnGuardar) {
            btnGuardar.innerHTML = '<i data-lucide="save"></i><span id="btnGuardarText">Actualizar Usuario</span>';
            btnGuardar.type = 'submit';
            btnGuardar.className = 'btn btn-primary';
            btnGuardar.onclick = null;
        }
        
        limpiarErrores();
        window.usuarioEditando = idUsuario;
        document.getElementById('modalUsuario').classList.add('show');
        document.getElementById('nombres').focus();
        
        // Reinicializar iconos
        if (typeof lucide !== 'undefined') {
            lucide.createIcons();
        }
        
    } catch (err) {
        console.error('Error cargando usuario:', err);
        await error('Error al cargar los datos del usuario');
    }
};

/**
 * Ver detalles de un usuario
 */
const verDetallesUsuario = async (idUsuario) => {
    try {
        const usuario = window.usuariosData?.find(u => u.id_usuario === idUsuario);
        if (!usuario) {
            throw new Error('Usuario no encontrado');
        }
        
        document.getElementById('modalTitleText').textContent = 'Detalles del Usuario';
        
        // Llenar formulario
        llenarFormulario(usuario);
        
        // Deshabilitar campos
        habilitarCampos(false);
        
        // Ocultar campos de contraseña
        document.getElementById('passwordGroup').style.display = 'none';
        document.getElementById('confirmPasswordGroup').style.display = 'none';
        
        // Cambiar botón guardar por cerrar
        const btnGuardar = document.getElementById('btnGuardar');
        if (btnGuardar) {
            btnGuardar.innerHTML = '<i data-lucide="x"></i>Cerrar';
            btnGuardar.type = 'button';
            btnGuardar.className = 'btn btn-secondary';
            btnGuardar.onclick = cerrarModal;
        }
        
        window.usuarioEditando = 'view';
        document.getElementById('modalUsuario').classList.add('show');
        
        // Reinicializar iconos
        if (typeof lucide !== 'undefined') {
            lucide.createIcons();
        }
        
    } catch (err) {
        console.error('Error cargando usuario:', err);
        await error('Error al cargar los datos del usuario');
    }
};

/**
 * Eliminar usuario
 */
const eliminarUsuario = (idUsuario, nombreUsuario) => {
    document.getElementById('usuarioAEliminar').textContent = nombreUsuario;
    window.usuarioAEliminar = idUsuario;
    document.getElementById('modalConfirmar').classList.add('show');
};

/**
 * Llena el formulario con datos del usuario
 */
const llenarFormulario = (usuario) => {
    // El backend devuelve nombre_usuario como un solo campo, necesitamos dividirlo
    const nombreCompleto = usuario.nombre_usuario || '';
    const partes = nombreCompleto.split(' ');
    const nombres = partes.slice(0, Math.ceil(partes.length / 2)).join(' ');
    const apellidos = partes.slice(Math.ceil(partes.length / 2)).join(' ');
    
    document.getElementById('nombres').value = nombres;
    document.getElementById('apellidos').value = apellidos;
    document.getElementById('email').value = usuario.correo || '';
    document.getElementById('telefono').value = usuario.telefono || '';
    document.getElementById('rolUsuario').value = usuario.rol || '';
    document.getElementById('activo').checked = usuario.estado === 'ACTIVO';
};

/**
 * Habilita o deshabilita campos del formulario
 */
const habilitarCampos = (habilitar) => {
    const campos = document.querySelectorAll('#usuarioForm input, #usuarioForm select, #usuarioForm textarea');
    campos.forEach(campo => {
        campo.disabled = !habilitar;
    });
};

/**
 * Confirma la eliminación del usuario
 */
const confirmarEliminacion = async () => {
    try {
        const idUsuario = window.usuarioAEliminar;
        
        const response = await api.del(`/usuarios/${idUsuario}`);
        
        if (response.success) {
            await success('Usuario eliminado correctamente');
            cerrarModalConfirmacion();
            await cargarUsuarios();
        } else {
            console.log('Error al eliminar usuario:', response);
            throw new Error(response.message || 'Error al eliminar usuario');
        }
        
    } catch (err) {
        console.error('Error eliminando usuario:', err);
        await error(err.message || 'Error al eliminar el usuario');
    }
};

/**
 * Maneja el submit del formulario
 */
const manejarSubmitFormulario = async (e) => {
    e.preventDefault();
    
    if (window.usuarioEditando === 'view') {
        cerrarModal();
        return;
    }
    
    try {
        const formData = new FormData(e.target);
        const nombres = formData.get('nombres').trim();
        const apellidos = formData.get('apellidos').trim();
        
        const datos = {
            nombre_usuario: `${nombres} ${apellidos}`.trim(),
            correo: formData.get('email').trim(),
            telefono: formData.get('telefono')?.trim() || null,
            rol: formData.get('rol_id'),
            estado: formData.get('activo') === 'on' ? 'ACTIVO' : 'INACTIVO'
        };
        
        // Agregar contraseña solo si es creación
        if (!window.usuarioEditando) {
            datos.contraseña = formData.get('password');
            const confirmPassword = formData.get('confirm_password');
            
            if (datos.contraseña !== confirmPassword) {
                throw new Error('Las contraseñas no coinciden');
            }
        }
        
        // Validar datos
        if (!validarFormulario(datos)) {
            return;
        }
        
        let response;
        
        if (window.usuarioEditando && window.usuarioEditando !== 'view') {
            // Actualizar usuario existente
            delete datos.contraseña; // No enviar contraseña en edición
            response = await api.put(`/usuarios/${window.usuarioEditando}`, datos);
        } else {
            // Crear nuevo usuario
            response = await api.post('/usuarios', datos);
        }
        
        if (response.success) {
            await success(window.usuarioEditando ? 'Usuario actualizado correctamente' : 'Usuario creado correctamente');
            cerrarModal();
            await cargarUsuarios();
        } else {
            throw new Error(response.message || 'Error al guardar usuario');
        }
        
    } catch (err) {
        console.error('Error guardando usuario:', err);
        await error(err.message || 'Error al guardar el usuario');
    }
};

/**
 * Valida el formulario
 */
const validarFormulario = (datos) => {
    limpiarErrores();
    let esValido = true;
    
    if (!datos.nombre_usuario) {
        mostrarError('errorNombres', 'El nombre completo es obligatorio');
        esValido = false;
    } else if (datos.nombre_usuario.length < 3) {
        mostrarError('errorNombres', 'El nombre debe tener al menos 3 caracteres');
        esValido = false;
    }
    
    if (!datos.correo) {
        mostrarError('errorEmail', 'El email es obligatorio');
        esValido = false;
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(datos.correo)) {
        mostrarError('errorEmail', 'El email no tiene un formato válido');
        esValido = false;
    }
    
    if (!datos.rol) {
        mostrarError('errorRolUsuario', 'Debes seleccionar un rol');
        esValido = false;
    }
    
    // Validar contraseña solo en creación
    if (!window.usuarioEditando && datos.contraseña) {
        if (datos.contraseña.length < 8) {
            mostrarError('errorPassword', 'La contraseña debe tener al menos 8 caracteres');
            esValido = false;
        }
    }
    
    return esValido;
};

/**
 * Cierra el modal principal
 */
const cerrarModal = () => {
    document.getElementById('modalUsuario').classList.remove('show');
    
    // Rehabilitar campos si estaban deshabilitados
    habilitarCampos(true);
    
    // Restaurar botón guardar completamente
    const btnGuardar = document.getElementById('btnGuardar');
    if (btnGuardar) {
        btnGuardar.innerHTML = '<i data-lucide="save"></i><span id="btnGuardarText">Crear Usuario</span>';
        btnGuardar.onclick = null;
        btnGuardar.type = 'submit';
        btnGuardar.className = 'btn btn-primary';
        
        // Re-asignar el evento submit al formulario
        const form = document.getElementById('usuarioForm');
        if (form) {
            form.onsubmit = manejarSubmitFormulario;
        }
    }
    
    // Limpiar el formulario
    document.getElementById('usuarioForm')?.reset();
    
    limpiarErrores();
    window.usuarioEditando = null;
    
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
    window.usuarioAEliminar = null;
};

/**
 * Muestra estado de carga
 */
const mostrarCargando = () => {
    const container = document.getElementById('usuariosTableContainer');
    if (container) {
        container.innerHTML = `
            <div class="loading">
                <i data-lucide="loader-2" style="animation: spin 1s linear infinite;"></i>
                <p>Cargando usuarios...</p>
            </div>
        `;
        lucide.createIcons();
    }
};

/**
 * Muestra mensaje de error en la carga
 */
const mostrarErrorCarga = (mensaje) => {
    const container = document.getElementById('usuariosTableContainer');
    if (container) {
        container.innerHTML = `
            <div class="empty-state">
                <i data-lucide="alert-circle"></i>
                <h3>Error al cargar</h3>
                <p>${mensaje}</p>
                <button class="btn btn-primary" onclick="cargarUsuarios()">
                    <i data-lucide="refresh-cw"></i>
                    Reintentar
                </button>
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

// Exponer funciones globalmente para uso en onclick
window.editarUsuario = editarUsuario;
window.verDetallesUsuario = verDetallesUsuario;
window.eliminarUsuario = eliminarUsuario;
window.cargarUsuarios = cargarUsuarios;

// Añadir estilos para la animación de carga
const style = document.createElement('style');
style.textContent = `
    @keyframes spin {
        from { transform: rotate(0deg); }
        to { transform: rotate(360deg); }
    }
`;
document.head.appendChild(style);