/**
 * Controlador para la gestión de categorías
 * Maneja el CRUD completo de categorías con validación de permisos
 */

import './categorias.css'
import { DashboardNavigation } from '../../Components/Navigation/DashboardNavigation.js';
import { userManager } from '../../Helpers/userManager.js';
import * as api from '../../Helpers/api.js';
import { success, error, confirm } from '../../Helpers/alertas.js';

/**
 * Función principal del controlador de categorías
 */
export const categoriasController = async () => {
    // Inicializar gestor de usuario
    userManager.init();

    // Inicializar la página
    await inicializarPagina();
};

/**
 * Inicializa la página de categorías
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
        await cargarCategorias();
        
        // Configurar permisos de botones
        configurarPermisosUI();
        
    } catch (err) {
        console.error('Error inicializando página:', err);
        await error('Error al cargar la página de categorías');
    }
};

/**
 * Configura los eventos de la página
 */
const configurarEventos = () => {
    // Botón crear categoría
    document.getElementById('btnCrearCategoria')?.addEventListener('click', abrirModalCrear);
    
    // Botón actualizar
    document.getElementById('btnRefresh')?.addEventListener('click', cargarCategorias);
    
    // Búsqueda en tiempo real
    document.getElementById('searchInput')?.addEventListener('input', filtrarCategorias);
    
    // Modal eventos
    document.getElementById('closeModal')?.addEventListener('click', cerrarModal);
    document.getElementById('btnCancelar')?.addEventListener('click', cerrarModal);
    document.getElementById('closeModalConfirmar')?.addEventListener('click', cerrarModalConfirmacion);
    document.getElementById('btnCancelarEliminar')?.addEventListener('click', cerrarModalConfirmacion);
    
    // Submit formulario
    document.getElementById('categoriaForm')?.addEventListener('submit', manejarSubmitFormulario);
    
    // Confirmación de eliminación
    document.getElementById('btnConfirmarEliminar')?.addEventListener('click', confirmarEliminacion);
    
    // Cerrar modal al hacer click fuera
    document.getElementById('modalCategoria')?.addEventListener('click', (e) => {
        if (e.target.id === 'modalCategoria') {
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
    const btnCrear = document.getElementById('btnCrearCategoria');
    if (btnCrear && !permisos.includes('crear_categorias') && !permisos.includes('*')) {
        btnCrear.style.display = 'none';
    }
};

/**
 * Carga todas las categorías desde la API
 */
const cargarCategorias = async () => {
    try {
        mostrarCargando();
        
        const response = await api.get('/categorias');
        
        if (response.success) {
            mostrarTablaCategorias(response.data.categorias);
        } else {
            mostrarErrorTabla('Error al cargar las categorías');
        }
        
    } catch (err) {
        console.error('Error cargando categorías:', err);
        mostrarErrorTabla('Error al cargar las categorías');
    }
};

/**
 * Muestra la tabla de categorías
 */
const mostrarTablaCategorias = (categorias) => {
    const container = document.getElementById('categoriasTableContainer');
    if (!container) return;
    
    if (!categorias || categorias.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <i data-lucide="tag"></i>
                <h3>No hay categorías registradas</h3>
                <p>Comienza creando la primera categoría del sistema</p>
            </div>
        `;
        lucide.createIcons();
        return;
    }
    
    const permisos = userManager.getPermisos();
    const puedeEditar = permisos.includes('actualizar_categorias') || permisos.includes('*');
    const puedeEliminar = permisos.includes('eliminar_categorias') || permisos.includes('*');

    container.innerHTML = `
        <table class="categorias-table">
            <thead>
                <tr>
                    <th>ID</th>
                    <th>Nombre de la Categoría</th>
                    <th>Descripción</th>
                    <th>Total Productos</th>
                    <th>Acciones</th>
                </tr>
            </thead>
            <tbody>
                ${categorias.map(categoria => `
                    <tr data-categoria-id="${categoria.id_categoria}">
                        <td>${categoria.id_categoria}</td>
                        <td><strong>${categoria.nombre_categoria}</strong></td>
                        <td>${categoria.descripcion || 'Sin descripción'}</td>
                        <td>
                            <span class="badge badge-info">${categoria.total_productos || 0}</span>
                        </td>
                        <td>
                            <div class="actions">
                                <button 
                                    class="btn btn-sm btn-primary" 
                                    onclick="verDetallesCategoria(${categoria.id_categoria})"
                                    title="Ver detalles"
                                >
                                    <i data-lucide="eye"></i>
                                    Ver
                                </button>
                                ${puedeEditar ? `
                                    <button 
                                        class="btn btn-sm btn-success" 
                                        onclick="editarCategoria(${categoria.id_categoria})"
                                        title="Editar categoría"
                                    >
                                        <i data-lucide="edit"></i>
                                        Editar
                                    </button>
                                ` : ''}
                                ${puedeEliminar ? `
                                    <button 
                                        class="btn btn-sm btn-danger" 
                                        onclick="eliminarCategoria(${categoria.id_categoria}, '${categoria.nombre_categoria}')"
                                        title="Eliminar categoría"
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
 * Filtra las categorías según el texto de búsqueda
 */
const filtrarCategorias = () => {
    const searchTerm = document.getElementById('searchInput')?.value.toLowerCase() || '';
    const filas = document.querySelectorAll('.categorias-table tbody tr');
    
    filas.forEach(fila => {
        const nombre = fila.querySelector('td:nth-child(2)')?.textContent.toLowerCase() || '';
        const descripcion = fila.querySelector('td:nth-child(3)')?.textContent.toLowerCase() || '';
        
        const coincide = nombre.includes(searchTerm) || descripcion.includes(searchTerm);
        fila.style.display = coincide ? '' : 'none';
    });
};

/**
 * Abre el modal para crear una nueva categoría
 */
const abrirModalCrear = () => {
    // Limpiar formulario y errores
    document.getElementById('categoriaForm').reset();
    limpiarErrores();
    
    // Configurar títulos
    document.getElementById('modalTitleText').textContent = 'Crear Categoría';
    
    // Habilitar campos
    document.getElementById('nombreCategoria').disabled = false;
    document.getElementById('descripcionCategoria').disabled = false;
    
    // Configurar botón guardar
    const btnGuardar = document.getElementById('btnGuardar');
    if (btnGuardar) {
        btnGuardar.innerHTML = '<i data-lucide="save"></i><span id="btnGuardarText">Crear Categoría</span>';
        btnGuardar.type = 'submit';
        btnGuardar.className = 'btn btn-primary';
        btnGuardar.onclick = null;
    }
    
    window.categoriaEditando = null;
    document.getElementById('modalCategoria').classList.add('show');
    document.getElementById('nombreCategoria').focus();
    
    // Reinicializar iconos
    if (typeof lucide !== 'undefined') {
        lucide.createIcons();
    }
};

/**
 * Abre el modal para editar una categoría existente
 */
const editarCategoria = async (idCategoria) => {
    try {
        const response = await api.get(`/categorias/${idCategoria}`);
        
        if (!response.success) {
            await error('Error al cargar los datos de la categoría');
            return;
        }
        
        const categoria = response.data.data;
        
        // Configurar títulos
        document.getElementById('modalTitleText').textContent = 'Editar Categoría';
        
        // Llenar formulario
        document.getElementById('nombreCategoria').value = categoria.nombre_categoria;
        document.getElementById('descripcionCategoria').value = categoria.descripcion || '';
        
        // Habilitar campos
        document.getElementById('nombreCategoria').disabled = false;
        document.getElementById('descripcionCategoria').disabled = false;
        
        // Configurar botón guardar
        const btnGuardar = document.getElementById('btnGuardar');
        if (btnGuardar) {
            btnGuardar.innerHTML = '<i data-lucide="save"></i><span id="btnGuardarText">Actualizar Categoría</span>';
            btnGuardar.type = 'submit';
            btnGuardar.className = 'btn btn-primary';
            btnGuardar.onclick = null;
        }
        
        window.categoriaEditando = idCategoria;
        document.getElementById('modalCategoria').classList.add('show');
        document.getElementById('nombreCategoria').focus();
        
        // Reinicializar iconos
        if (typeof lucide !== 'undefined') {
            lucide.createIcons();
        }
        
    } catch (err) {
        console.error('Error editando categoría:', err);
        await error('Error al cargar los datos de la categoría');
    }
};

/**
 * Ver detalles de una categoría
 */
const verDetallesCategoria = async (idCategoria) => {
    try {
        const response = await api.get(`/categorias/${idCategoria}`);
        
        if (!response.success) {
            await error('Error al cargar los datos de la categoría');
            return;
        }
        
        const categoria = response.data.data;
        
        // Configurar títulos
        document.getElementById('modalTitleText').textContent = 'Detalles de la Categoría';
        
        // Llenar formulario
        document.getElementById('nombreCategoria').value = categoria.nombre_categoria;
        document.getElementById('descripcionCategoria').value = categoria.descripcion || '';
        
        // Deshabilitar campos
        document.getElementById('nombreCategoria').disabled = true;
        document.getElementById('descripcionCategoria').disabled = true;
        
        // Configurar botón guardar
        const btnGuardar = document.getElementById('btnGuardar');
        if (btnGuardar) {
            btnGuardar.innerHTML = '<i data-lucide="x"></i><span id="btnGuardarText">Cerrar</span>';
            btnGuardar.type = 'button';
            btnGuardar.className = 'btn btn-secondary';
            btnGuardar.onclick = cerrarModal;
        }
        
        window.categoriaEditando = 'view';
        document.getElementById('modalCategoria').classList.add('show');
        
        // Reinicializar iconos
        if (typeof lucide !== 'undefined') {
            lucide.createIcons();
        }
        
    } catch (err) {
        console.error('Error viendo categoría:', err);
        await error('Error al cargar los datos de la categoría');
    }
};

/**
 * Eliminar categoría
 */
const eliminarCategoria = (idCategoria, nombreCategoria) => {
    document.getElementById('categoriaAEliminar').textContent = nombreCategoria;
    window.categoriaAEliminar = idCategoria;
    document.getElementById('modalConfirmar').classList.add('show');
};

/**
 * Confirma la eliminación de la categoría
 */
const confirmarEliminacion = async () => {
    try {
        const idCategoria = window.categoriaAEliminar;
        if (!idCategoria) return;
        
        const response = await api.del(`/categorias/${idCategoria}`);
        
        if (response.success) {
            await success('Categoría eliminada exitosamente');
            cerrarModalConfirmacion();
            await cargarCategorias();
        } else {
            await error(response.message || 'Error al eliminar la categoría');
        }
        
    } catch (err) {
        console.error('Error eliminando categoría:', err);
        await error('Error al eliminar la categoría');
    }
};

/**
 * Maneja el submit del formulario
 */
const manejarSubmitFormulario = async (e) => {
    e.preventDefault();
    
    if (window.categoriaEditando === 'view') {
        cerrarModal();
        return;
    }
    
    try {
        const formData = new FormData(e.target);
        const datos = {
            nombre_categoria: formData.get('nombre_categoria'),
            descripcion: formData.get('descripcion')
        };
        
        if (!validarFormulario(datos)) {
            return;
        }
        
        let response;
        if (window.categoriaEditando) {
            // Actualizar categoría existente
            response = await api.put(`/categorias/${window.categoriaEditando}`, datos);
        } else {
            // Crear nueva categoría
            response = await api.post('/categorias', datos);
        }
        
        if (response.success) {
            const mensaje = window.categoriaEditando ? 'Categoría actualizada exitosamente' : 'Categoría creada exitosamente';
            await success(mensaje);
            cerrarModal();
            await cargarCategorias();
        } else {
            await error(response.message || 'Error al guardar la categoría');
        }
        
    } catch (err) {
        console.error('Error guardando categoría:', err);
        await error('Error al guardar la categoría');
    }
};

/**
 * Valida el formulario
 */
const validarFormulario = (datos) => {
    limpiarErrores();
    let esValido = true;
    
    if (!datos.nombre_categoria || datos.nombre_categoria.trim() === '') {
        mostrarError('errorNombreCategoria', 'El nombre de la categoría es requerido');
        document.getElementById('nombreCategoria').classList.add('error');
        esValido = false;
    } else if (datos.nombre_categoria.length > 100) {
        mostrarError('errorNombreCategoria', 'El nombre no puede exceder 100 caracteres');
        document.getElementById('nombreCategoria').classList.add('error');
        esValido = false;
    }
    
    return esValido;
};

/**
 * Cierra el modal principal
 */
const cerrarModal = () => {
    document.getElementById('modalCategoria').classList.remove('show');
    
    // Rehabilitar campos si estaban deshabilitados
    document.getElementById('nombreCategoria').disabled = false;
    document.getElementById('descripcionCategoria').disabled = false;
    
    // Restaurar botón guardar
    const btnGuardar = document.getElementById('btnGuardar');
    if (btnGuardar) {
        btnGuardar.innerHTML = '<i data-lucide="save"></i><span id="btnGuardarText">Crear Categoría</span>';
        btnGuardar.type = 'submit';
        btnGuardar.className = 'btn btn-primary';
        btnGuardar.onclick = null;
    }
    
    // Limpiar el formulario
    document.getElementById('categoriaForm')?.reset();
    
    limpiarErrores();
    window.categoriaEditando = null;
    
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
    window.categoriaAEliminar = null;
};

/**
 * Muestra estado de carga
 */
const mostrarCargando = () => {
    const container = document.getElementById('categoriasTableContainer');
    if (container) {
        container.innerHTML = `
            <div class="loading">
                <i data-lucide="loader-2" style="animation: spin 1s linear infinite;"></i>
                <p>Cargando categorías...</p>
            </div>
        `;
        lucide.createIcons();
    }
};

/**
 * Muestra mensaje de error en la tabla
 */
const mostrarErrorTabla = (mensaje) => {
    const container = document.getElementById('categoriasTableContainer');
    if (container) {
        container.innerHTML = `
            <div class="error-state">
                <i data-lucide="alert-triangle"></i>
                <h3>Error</h3>
                <p>${mensaje}</p>
                <button onclick="cargarCategorias()" class="btn btn-primary">
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
window.editarCategoria = editarCategoria;
window.verDetallesCategoria = verDetallesCategoria;
window.eliminarCategoria = eliminarCategoria;
window.cargarCategorias = cargarCategorias;
