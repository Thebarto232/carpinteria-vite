/**
 * Controlador para la gestión de proveedores
 * Maneja el CRUD completo de proveedores con validación de permisos
 */

import './proveedores.css';
import { DashboardNavigation } from '../../Components/Navigation/DashboardNavigation.js';
import { userManager } from '../../Helpers/userManager.js';
import * as api from '../../Helpers/api.js';
import { success, error, confirm } from '../../Helpers/alertas.js';

/**
 * Función principal del controlador de proveedores
 */
export const proveedoresController = async () => {
    // Inicializar gestor de usuario
    userManager.init();

    // Inicializar la página
    await inicializarPagina();
};

/**
 * Inicializa la página de proveedores
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
        await cargarProveedores();
        
        // Configurar permisos de botones
        configurarPermisosUI();
        
    } catch (err) {
        console.error('Error inicializando página:', err);
        await error('Error al cargar la página de proveedores');
    }
};

/**
 * Configura los eventos de la página
 */
const configurarEventos = () => {
    // Botón crear proveedor
    document.getElementById('btnCrearProveedor')?.addEventListener('click', abrirModalCrear);
    
    // Botón actualizar
    document.getElementById('btnRefresh')?.addEventListener('click', cargarProveedores);
    
    // Búsqueda en tiempo real
    document.getElementById('searchInput')?.addEventListener('input', filtrarProveedores);
    
    // Modal eventos
    document.getElementById('closeModal')?.addEventListener('click', cerrarModal);
    document.getElementById('btnCancelar')?.addEventListener('click', cerrarModal);
    document.getElementById('closeModalConfirmar')?.addEventListener('click', cerrarModalConfirmacion);
    document.getElementById('btnCancelarEliminar')?.addEventListener('click', cerrarModalConfirmacion);
    
    // Submit formulario
    document.getElementById('proveedorForm')?.addEventListener('submit', manejarSubmitFormulario);
    
    // Confirmación de eliminación
    document.getElementById('btnConfirmarEliminar')?.addEventListener('click', confirmarEliminacion);
    
    // Cerrar modal al hacer click fuera
    document.getElementById('modalProveedor')?.addEventListener('click', (e) => {
        if (e.target.id === 'modalProveedor') {
            cerrarModal();
        }
    });
    
    document.getElementById('modalConfirmar')?.addEventListener('click', (e) => {
        if (e.target.id === 'modalConfirmar') {
            cerrarModalConfirmacion();
        }
    });
};

/**
 * Configura la UI según los permisos del usuario
 */
const configurarPermisosUI = () => {
    const permisos = userManager.getPermisos();
    
    // Botón crear
    const btnCrear = document.getElementById('btnCrearProveedor');
    if (btnCrear && !permisos.includes('crear_proveedores') && !permisos.includes('*')) {
        btnCrear.style.display = 'none';
    }
};

/**
 * Carga todos los proveedores desde la API
 */
const cargarProveedores = async () => {
    try {
        mostrarCargando();
        
        const response = await api.get('/proveedores');
        
        if (response.success) {
            console.log('Respuesta completa:', response);
            mostrarTablaProveedores(response.data.data.proveedores);
        } else {
            mostrarErrorTabla('Error al cargar los proveedores');
        }
        
    } catch (err) {
        console.error('Error cargando proveedores:', err);
        mostrarErrorTabla('Error al cargar los proveedores');
    }
};

/**
 * Muestra la tabla de proveedores
 */
const mostrarTablaProveedores = (proveedores) => {
    const container = document.getElementById('proveedoresTableContainer');
    if (!container) return;
    
    if (!proveedores || proveedores.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <i data-lucide="truck"></i>
                <h3>No hay proveedores registrados</h3>
                <p>Comienza agregando el primer proveedor del sistema</p>
            </div>
        `;
        lucide.createIcons();
        return;
    }
    
    const permisos = userManager.getPermisos();
    const puedeEditar = permisos.includes('actualizar_proveedores') || permisos.includes('*');
    const puedeEliminar = permisos.includes('eliminar_proveedores') || permisos.includes('*');
    
    console.log('Proveedores cargados:', proveedores);
    container.innerHTML = `
        <div class="table-container">
            <table class="proveedores-table">
                <thead>
                    <tr>
                        <th>ID</th>
                        <th>Nombre del Proveedor</th>
                        <th>Contacto</th>
                        <th>Email</th>
                        <th>Teléfono</th>
                        <th>Total Productos</th>
                        <th>Acciones</th>
                    </tr>
                </thead>
            <tbody>
                ${proveedores.map(proveedor => `
                    <tr data-proveedor-id="${proveedor.id_proveedor}">
                        <td>${proveedor.id_proveedor}</td>
                        <td><strong>${proveedor.nombre_proveedor}</strong></td>
                        <td>${proveedor.contacto_nombre || 'Sin contacto'}</td>
                        <td>${proveedor.contacto_email || 'Sin email'}</td>
                        <td>${proveedor.contacto_telefono || 'Sin teléfono'}</td>
                        <td>
                            <span class="badge badge-info">${proveedor.total_productos || 0}</span>
                        </td>
                        <td>
                            <div class="actions">
                                <button 
                                    class="btn btn-sm btn-primary" 
                                    onclick="verDetallesProveedor(${proveedor.id_proveedor})"
                                    title="Ver detalles"
                                >
                                    <i data-lucide="eye"></i>
                                    Ver
                                </button>
                                ${puedeEditar ? `
                                    <button 
                                        class="btn btn-sm btn-success" 
                                        onclick="editarProveedor(${proveedor.id_proveedor})"
                                        title="Editar proveedor"
                                    >
                                        <i data-lucide="edit"></i>
                                        Editar
                                    </button>
                                ` : ''}
                                ${puedeEliminar ? `
                                    <button 
                                        class="btn btn-sm btn-danger" 
                                        onclick="eliminarProveedor(${proveedor.id_proveedor}, '${proveedor.nombre_proveedor}')"
                                        title="Eliminar proveedor"
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
        </div>
    `;
    
    // Actualizar iconos
    lucide.createIcons();
};

/**
 * Filtra los proveedores según el texto de búsqueda
 */
const filtrarProveedores = () => {
    const searchTerm = document.getElementById('searchInput')?.value.toLowerCase() || '';
    const filas = document.querySelectorAll('.proveedores-table tbody tr');
    
    filas.forEach(fila => {
        const nombre = fila.querySelector('td:nth-child(2)')?.textContent.toLowerCase() || '';
        const contacto = fila.querySelector('td:nth-child(3)')?.textContent.toLowerCase() || '';
        const email = fila.querySelector('td:nth-child(4)')?.textContent.toLowerCase() || '';
        
        const coincide = nombre.includes(searchTerm) || contacto.includes(searchTerm) || email.includes(searchTerm);
        fila.style.display = coincide ? '' : 'none';
    });
};

/**
 * Abre el modal para crear un nuevo proveedor
 */
const abrirModalCrear = () => {
    // Limpiar formulario y errores
    document.getElementById('proveedorForm').reset();
    limpiarErrores();
    
    // Configurar títulos
    document.getElementById('modalTitleText').textContent = 'Crear Proveedor';
    
    // Habilitar campos
    habilitarCampos(false);
    
    // Configurar botón guardar
    const btnGuardar = document.getElementById('btnGuardar');
    if (btnGuardar) {
        btnGuardar.innerHTML = '<i data-lucide="save"></i><span id="btnGuardarText">Crear Proveedor</span>';
        btnGuardar.type = 'submit';
        btnGuardar.className = 'btn btn-primary';
        btnGuardar.onclick = null;
    }
    
    window.proveedorEditando = null;
    document.getElementById('modalProveedor').classList.add('show');
    document.getElementById('nombreProveedor').focus();
    
    // Reinicializar iconos
    if (typeof lucide !== 'undefined') {
        lucide.createIcons();
    }
};

/**
 * Abre el modal para editar un proveedor existente
 */
const editarProveedor = async (idProveedor) => {
    try {
        const response = await api.get(`/proveedores/${idProveedor}`);
        
        if (!response.success) {
            await error('Error al cargar los datos del proveedor');
            return;
        }
        
        const proveedor = response.data.data;
        
        // Configurar títulos
        document.getElementById('modalTitleText').textContent = 'Editar Proveedor';
        
        // Llenar formulario
        llenarFormulario(proveedor);
        
        // Habilitar campos
        habilitarCampos(false);
        
        // Configurar botón guardar
        const btnGuardar = document.getElementById('btnGuardar');
        if (btnGuardar) {
            btnGuardar.innerHTML = '<i data-lucide="save"></i><span id="btnGuardarText">Actualizar Proveedor</span>';
            btnGuardar.type = 'submit';
            btnGuardar.className = 'btn btn-primary';
            btnGuardar.onclick = null;
        }
        
        window.proveedorEditando = idProveedor;
        document.getElementById('modalProveedor').classList.add('show');
        document.getElementById('nombreProveedor').focus();
        
        // Reinicializar iconos
        if (typeof lucide !== 'undefined') {
            lucide.createIcons();
        }
        
    } catch (err) {
        console.error('Error editando proveedor:', err);
        await error('Error al cargar los datos del proveedor');
    }
};

/**
 * Ver detalles de un proveedor
 */
const verDetallesProveedor = async (idProveedor) => {
    try {
        const response = await api.get(`/proveedores/${idProveedor}`);
        
        if (!response.success) {
            await error('Error al cargar los datos del proveedor');
            return;
        }
        
        const proveedor = response.data.data;
        
        // Configurar títulos
        document.getElementById('modalTitleText').textContent = 'Detalles del Proveedor';
        
        // Llenar formulario
        llenarFormulario(proveedor);
        
        // Deshabilitar campos
        habilitarCampos(true);
        
        // Configurar botón guardar
        const btnGuardar = document.getElementById('btnGuardar');
        if (btnGuardar) {
            btnGuardar.innerHTML = '<i data-lucide="x"></i><span id="btnGuardarText">Cerrar</span>';
            btnGuardar.type = 'button';
            btnGuardar.className = 'btn btn-secondary';
            btnGuardar.onclick = cerrarModal;
        }
        
        window.proveedorEditando = 'view';
        document.getElementById('modalProveedor').classList.add('show');
        
        // Reinicializar iconos
        if (typeof lucide !== 'undefined') {
            lucide.createIcons();
        }
        
    } catch (err) {
        console.error('Error viendo proveedor:', err);
        await error('Error al cargar los datos del proveedor');
    }
};

/**
 * Eliminar proveedor
 */
const eliminarProveedor = (idProveedor, nombreProveedor) => {
    document.getElementById('proveedorAEliminar').textContent = nombreProveedor;
    window.proveedorAEliminar = idProveedor;
    document.getElementById('modalConfirmar').classList.add('show');
};

/**
 * Confirma la eliminación del proveedor
 */
const confirmarEliminacion = async () => {
    try {
        const idProveedor = window.proveedorAEliminar;
        if (!idProveedor) return;
        
        const response = await api.del(`/proveedores/${idProveedor}`);
        
        if (response.success) {
            await success('Proveedor eliminado exitosamente');
            cerrarModalConfirmacion();
            await cargarProveedores();
        } else {
            await error(response.message || 'Error al eliminar el proveedor');
        }
        
    } catch (err) {
        console.error('Error eliminando proveedor:', err);
        await error('Error al eliminar el proveedor');
    }
};

/**
 * Maneja el submit del formulario
 */
const manejarSubmitFormulario = async (e) => {
    e.preventDefault();
    
    if (window.proveedorEditando === 'view') {
        cerrarModal();
        return;
    }
    
    try {
        const formData = new FormData(e.target);
        const datos = {
            nombre_proveedor: formData.get('nombre_proveedor'),
            contacto_nombre: formData.get('contacto_nombre'),
            contacto_email: formData.get('contacto_email'),
            contacto_telefono: formData.get('contacto_telefono'),
            direccion_fiscal: formData.get('direccion_fiscal')
        };
        
        if (!validarFormulario(datos)) {
            return;
        }
        
        let response;
        if (window.proveedorEditando) {
            // Actualizar proveedor existente
            response = await api.put(`/proveedores/${window.proveedorEditando}`, datos);
        } else {
            // Crear nuevo proveedor
            response = await api.post('/proveedores', datos);
        }
        
        if (response.success) {
            const mensaje = window.proveedorEditando ? 'Proveedor actualizado exitosamente' : 'Proveedor creado exitosamente';
            await success(mensaje);
            cerrarModal();
            await cargarProveedores();
        } else {
            await error(response.message || 'Error al guardar el proveedor');
        }
        
    } catch (err) {
        console.error('Error guardando proveedor:', err);
        await error('Error al guardar el proveedor');
    }
};

/**
 * Valida el formulario
 */
const validarFormulario = (datos) => {
    limpiarErrores();
    let esValido = true;
    
    if (!datos.nombre_proveedor || datos.nombre_proveedor.trim() === '') {
        mostrarError('errorNombreProveedor', 'El nombre del proveedor es requerido');
        document.getElementById('nombreProveedor').classList.add('error');
        esValido = false;
    } else if (datos.nombre_proveedor.length > 150) {
        mostrarError('errorNombreProveedor', 'El nombre no puede exceder 150 caracteres');
        document.getElementById('nombreProveedor').classList.add('error');
        esValido = false;
    }
    
    // Validar email si se proporciona
    if (datos.contacto_email && datos.contacto_email.trim() !== '') {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(datos.contacto_email)) {
            mostrarError('errorContactoEmail', 'El formato del email es inválido');
            document.getElementById('contactoEmail').classList.add('error');
            esValido = false;
        }
    }
    
    return esValido;
};

/**
 * Llena el formulario con los datos del proveedor
 */
const llenarFormulario = (proveedor) => {
    document.getElementById('nombreProveedor').value = proveedor.nombre_proveedor;
    document.getElementById('contactoNombre').value = proveedor.contacto_nombre || '';
    document.getElementById('contactoEmail').value = proveedor.contacto_email || '';
    document.getElementById('contactoTelefono').value = proveedor.contacto_telefono || '';
    document.getElementById('direccionFiscal').value = proveedor.direccion_fiscal || '';
};

/**
 * Habilita o deshabilita los campos del formulario
 */
const habilitarCampos = (deshabilitar) => {
    const campos = ['nombreProveedor', 'contactoNombre', 'contactoEmail', 'contactoTelefono', 'direccionFiscal'];
    campos.forEach(campo => {
        const elemento = document.getElementById(campo);
        if (elemento) {
            elemento.disabled = deshabilitar;
        }
    });
};

/**
 * Cierra el modal principal
 */
const cerrarModal = () => {
    document.getElementById('modalProveedor').classList.remove('show');
    
    // Rehabilitar campos si estaban deshabilitados
    habilitarCampos(false);
    
    // Restaurar botón guardar
    const btnGuardar = document.getElementById('btnGuardar');
    if (btnGuardar) {
        btnGuardar.innerHTML = '<i data-lucide="save"></i><span id="btnGuardarText">Crear Proveedor</span>';
        btnGuardar.type = 'submit';
        btnGuardar.className = 'btn btn-primary';
        btnGuardar.onclick = null;
    }
    
    // Limpiar el formulario
    document.getElementById('proveedorForm')?.reset();
    
    limpiarErrores();
    window.proveedorEditando = null;
    
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
    window.proveedorAEliminar = null;
};

/**
 * Muestra estado de carga
 */
const mostrarCargando = () => {
    const container = document.getElementById('proveedoresTableContainer');
    if (container) {
        container.innerHTML = `
            <div class="loading">
                <i data-lucide="loader-2" style="animation: spin 1s linear infinite;"></i>
                <p>Cargando proveedores...</p>
            </div>
        `;
        lucide.createIcons();
    }
};

/**
 * Muestra mensaje de error en la tabla
 */
const mostrarErrorTabla = (mensaje) => {
    const container = document.getElementById('proveedoresTableContainer');
    if (container) {
        container.innerHTML = `
            <div class="error-state">
                <i data-lucide="alert-triangle"></i>
                <h3>Error</h3>
                <p>${mensaje}</p>
                <button onclick="cargarProveedores()" class="btn btn-primary">
                    <i data-lucide="refresh-cw"></i>
                    Reintentar
                </button>
            </div>
        `;
        lucide.createIcons();
    }
};

/**
 * Muestra mensaje de error en formularios
 */
const mostrarError = (elementId, mensaje) => {
    const elemento = document.getElementById(elementId);
    if (elemento) {
        elemento.textContent = mensaje;
    }
};

/**
 * Limpia todos los errores
 */
const limpiarErrores = () => {
    document.querySelectorAll('.error-message').forEach(el => el.textContent = '');
    document.querySelectorAll('.form-control.error').forEach(el => el.classList.remove('error'));
};

// Exponer funciones globalmente para uso en onclick
window.editarProveedor = editarProveedor;
window.verDetallesProveedor = verDetallesProveedor;
window.eliminarProveedor = eliminarProveedor;
window.cargarProveedores = cargarProveedores;
