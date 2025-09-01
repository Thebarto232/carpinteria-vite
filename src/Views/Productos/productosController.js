
/**
 * Controlador para la gestión de productos
 * Maneja el CRUD completo de productos con validación de permisos
 */

import './productos.css';
import { DashboardNavigation } from '../../Components/Navigation/DashboardNavigation.js';
import { userManager } from '../../Helpers/userManager.js';
import * as api from '../../Helpers/api.js';
import { success, error, confirm } from '../../Helpers/alertas.js';

// Variables globales para almacenar datos
let categoriasDisponibles = [];
let proveedoresDisponibles = [];

/**
 * Función principal del controlador de productos
 */
export const productosController = async () => {
    // Inicializar gestor de usuario
    userManager.init();

    // Inicializar la página
    await inicializarPagina();
};

/**
 * Inicializa la página de productos
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
        await Promise.all([
            cargarProductos(),
            cargarCategorias(),
            cargarProveedores()
        ]);
        
        // Configurar permisos de botones
        configurarPermisosUI();
        
    } catch (err) {
        console.error('Error inicializando página:', err);
        await error('Error al cargar la página de productos');
    }
};

/**
 * Configura los eventos de la página
 */
const configurarEventos = () => {
    // Botón crear producto
    document.getElementById('btnCrearProducto')?.addEventListener('click', abrirModalCrear);
    
    // Botón actualizar
    document.getElementById('btnRefresh')?.addEventListener('click', cargarProductos);
    
    // Búsqueda en tiempo real
    document.getElementById('searchInput')?.addEventListener('input', filtrarProductos);
    
    // Filtros
    document.getElementById('filtroCategoria')?.addEventListener('change', aplicarFiltros);
    document.getElementById('filtroProveedor')?.addEventListener('change', aplicarFiltros);
    document.getElementById('filtroEstado')?.addEventListener('change', aplicarFiltros);
    
    // Modal eventos
    document.getElementById('closeModal')?.addEventListener('click', cerrarModal);
    document.getElementById('btnCancelar')?.addEventListener('click', cerrarModal);
    document.getElementById('closeModalConfirmar')?.addEventListener('click', cerrarModalConfirmacion);
    document.getElementById('btnCancelarEliminar')?.addEventListener('click', cerrarModalConfirmacion);
    
    // Submit formulario
    document.getElementById('productoForm')?.addEventListener('submit', manejarSubmitFormulario);
    
    // Confirmación de eliminación
    document.getElementById('btnConfirmarEliminar')?.addEventListener('click', confirmarEliminacion);
    
    // Cerrar modal al hacer click fuera
    document.getElementById('modalProducto')?.addEventListener('click', (e) => {
        if (e.target.id === 'modalProducto') {
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
    const btnCrear = document.getElementById('btnCrearProducto');
    if (btnCrear && !permisos.includes('crear_productos') && !permisos.includes('*')) {
        btnCrear.style.display = 'none';
    }
};

/**
 * Carga todos los productos desde la API
 */
const cargarProductos = async () => {
    try {
        mostrarCargando();
        
        const response = await api.get('/productos');
        
        if (response.success) {
            console.log('Respuesta productos:', response);
            mostrarTablaProductos(response.data.productos);
        } else {
            mostrarErrorTabla('Error al cargar los productos');
        }
        
    } catch (err) {
        console.error('Error cargando productos:', err);
        mostrarErrorTabla('Error al cargar los productos');
    }
};

/**
 * Carga las categorías disponibles
 */
const cargarCategorias = async () => {
    try {
        const response = await api.get('/categorias/simple');
        if (response.success) {
            categoriasDisponibles = response.data.data;
            llenarSelectCategorias();
        }
    } catch (err) {
        console.error('Error cargando categorías:', err);
    }
};

/**
 * Carga los proveedores disponibles
 */
const cargarProveedores = async () => {
    try {
        const response = await api.get('/proveedores/simple');
        if (response.success) {
            proveedoresDisponibles = response.data.data;
            llenarSelectProveedores();
        }
    } catch (err) {
        console.error('Error cargando proveedores:', err);
    }
};

/**
 * Llena los selects de categorías
 */
const llenarSelectCategorias = () => {
    // Select en el formulario
    const selectForm = document.getElementById('categoriaProducto');
    if (selectForm) {
        selectForm.innerHTML = '<option value="">Seleccione una categoría</option>' +
            categoriasDisponibles.map(cat => 
                `<option value="${cat.id_categoria}">${cat.nombre_categoria}</option>`
            ).join('');
    }
    
    // Select en filtros
    const selectFiltro = document.getElementById('filtroCategoria');
    if (selectFiltro) {
        selectFiltro.innerHTML = '<option value="">Todas las categorías</option>' +
            categoriasDisponibles.map(cat => 
                `<option value="${cat.id_categoria}">${cat.nombre_categoria}</option>`
            ).join('');
    }
};

/**
 * Llena los selects de proveedores
 */
const llenarSelectProveedores = () => {
    // Select en el formulario
    const selectForm = document.getElementById('proveedorProducto');
    if (selectForm) {
        selectForm.innerHTML = '<option value="">Sin proveedor</option>' +
            proveedoresDisponibles.map(prov => 
                `<option value="${prov.id_proveedor}">${prov.nombre_proveedor}</option>`
            ).join('');
    }
    
    // Select en filtros
    const selectFiltro = document.getElementById('filtroProveedor');
    if (selectFiltro) {
        selectFiltro.innerHTML = '<option value="">Todos los proveedores</option>' +
            proveedoresDisponibles.map(prov => 
                `<option value="${prov.id_proveedor}">${prov.nombre_proveedor}</option>`
            ).join('');
    }
};

/**
 * Muestra la tabla de productos
 */
const mostrarTablaProductos = (productos) => {
    const container = document.getElementById('productosTableContainer');
    if (!container) return;
    
    if (!productos || productos.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <i data-lucide="package"></i>
                <h3>No hay productos registrados</h3>
                <p>Comienza agregando el primer producto del sistema</p>
            </div>
        `;
        lucide.createIcons();
        return;
    }
    
    const permisos = userManager.getPermisos();
    const puedeEditar = permisos.includes('actualizar_productos') || permisos.includes('*');
    const puedeEliminar = permisos.includes('eliminar_productos') || permisos.includes('*');

    container.innerHTML = `
        <table class="productos-table">
            <thead>
                <tr>
                    <th>ID</th>
                    <th>Producto</th>
                    <th>Categoría</th>
                    <th>Proveedor</th>
                    <th>Precio</th>
                    <th>Stock</th>
                    <th>Estado</th>
                    <th>Acciones</th>
                </tr>
            </thead>
            <tbody>
                ${productos.map(producto => {
                    const estadoClass = {
                        'DISPONIBLE': 'badge-success',
                        'AGOTADO': 'badge-danger',
                        'DESCONTINUADO': 'badge-warning'
                    }[producto.estado] || 'badge-secondary';
                    
                    const stockClass = producto.stock <= 10 ? 'stock-bajo' : '';
                    
                    return `
                        <tr data-producto-id="${producto.id_producto}">
                            <td>${producto.id_producto}</td>
                            <td>
                                <div class="producto-info">
                                    <strong>${producto.nombre_producto}</strong>
                                    ${producto.descripcion ? `<br><small>${producto.descripcion}</small>` : ''}
                                </div>
                            </td>
                            <td>${producto.nombre_categoria || 'Sin categoría'}</td>
                            <td>${producto.nombre_proveedor || 'Sin proveedor'}</td>
                            <td class="precio">$${Number(producto.precio).toLocaleString()}</td>
                            <td>
                                <span class="stock ${stockClass}">${producto.stock}</span>
                            </td>
                            <td>
                                <span class="badge ${estadoClass}">${producto.estado}</span>
                            </td>
                            <td>
                                <div class="actions">
                                    <button 
                                        class="btn btn-sm btn-primary" 
                                        onclick="verDetallesProducto(${producto.id_producto})"
                                        title="Ver detalles"
                                    >
                                        <i data-lucide="eye"></i>
                                        Ver
                                    </button>
                                    ${puedeEditar ? `
                                        <button 
                                            class="btn btn-sm btn-success" 
                                            onclick="editarProducto(${producto.id_producto})"
                                            title="Editar producto"
                                        >
                                            <i data-lucide="edit"></i>
                                            Editar
                                        </button>
                                    ` : ''}
                                    ${puedeEliminar ? `
                                        <button 
                                            class="btn btn-sm btn-danger" 
                                            onclick="eliminarProducto(${producto.id_producto}, '${producto.nombre_producto}')"
                                            title="Eliminar producto"
                                        >
                                            <i data-lucide="trash-2"></i>
                                            Eliminar
                                        </button>
                                    ` : ''}
                                </div>
                            </td>
                        </tr>
                    `;
                }).join('')}
            </tbody>
        </table>
    `;
    
    // Actualizar iconos
    lucide.createIcons();
};

/**
 * Aplica filtros a la tabla
 */
const aplicarFiltros = async () => {
    try {
        mostrarCargando();
        
        const categoria = document.getElementById('filtroCategoria')?.value || '';
        const proveedor = document.getElementById('filtroProveedor')?.value || '';
        const estado = document.getElementById('filtroEstado')?.value || '';
        const busqueda = document.getElementById('searchInput')?.value || '';
        
        const params = new URLSearchParams();
        if (categoria) params.append('categoria', categoria);
        if (proveedor) params.append('proveedor', proveedor);
        if (estado) params.append('estado', estado);
        if (busqueda) params.append('busqueda', busqueda);
        
        const response = await api.get(`/productos?${params.toString()}`);
        
        if (response.success) {
            mostrarTablaProductos(response.data.productos);
        } else {
            mostrarErrorTabla('Error al filtrar los productos');
        }
        
    } catch (err) {
        console.error('Error aplicando filtros:', err);
        mostrarErrorTabla('Error al filtrar los productos');
    }
};

/**
 * Filtra los productos localmente
 */
const filtrarProductos = () => {
    // Para simplificar, usaremos el filtro del servidor
    aplicarFiltros();
};

/**
 * Abre el modal para crear un nuevo producto
 */
const abrirModalCrear = () => {
    // Limpiar formulario y errores
    document.getElementById('productoForm').reset();
    limpiarErrores();
    
    // Configurar títulos
    document.getElementById('modalTitleText').textContent = 'Crear Producto';
    
    // Habilitar campos
    habilitarCampos(false);
    
    // Configurar botón guardar
    const btnGuardar = document.getElementById('btnGuardar');
    if (btnGuardar) {
        btnGuardar.innerHTML = '<i data-lucide="save"></i><span id="btnGuardarText">Crear Producto</span>';
        btnGuardar.type = 'submit';
        btnGuardar.className = 'btn btn-primary';
        btnGuardar.onclick = null;
    }
    
    window.productoEditando = null;
    document.getElementById('modalProducto').classList.add('show');
    document.getElementById('nombreProducto').focus();
    
    // Reinicializar iconos
    if (typeof lucide !== 'undefined') {
        lucide.createIcons();
    }
};

// Eliminar imagen de producto
async function eliminarImagenProducto(idProducto, idImagen) {
    if (!confirm('¿Seguro que deseas eliminar esta imagen?')) return;
    try {
        const resp = await api.del(`/productos/${idProducto}/imagenes/${idImagen}`);
        if (resp.message) {
            await success('Imagen eliminada');
            cargarImagenesProducto(idProducto);
        } else {
            await error(resp.error || 'No se pudo eliminar la imagen');
        }
    } catch (err) {
        await error('Error al eliminar la imagen');
    }
}
window.eliminarImagenProducto = eliminarImagenProducto;

/**
 * Abre el modal para editar un producto existente
 */
const editarProducto = async (idProducto) => {
    try {
        const response = await api.get(`/productos/${idProducto}`);
        
        if (!response.success) {
            await error('Error al cargar los datos del producto');
            return;
        }
        
        const producto = response.data.data;
        
        // Configurar títulos
        document.getElementById('modalTitleText').textContent = 'Editar Producto';
        
        // Llenar formulario
        llenarFormulario(producto);
        
        // Habilitar campos
        habilitarCampos(false);
        
        // Configurar botón guardar
        const btnGuardar = document.getElementById('btnGuardar');
        if (btnGuardar) {
            btnGuardar.innerHTML = '<i data-lucide="save"></i><span id="btnGuardarText">Actualizar Producto</span>';
            btnGuardar.type = 'submit';
            btnGuardar.className = 'btn btn-primary';
            btnGuardar.onclick = null;
        }
        
        window.productoEditando = idProducto;
        document.getElementById('modalProducto').classList.add('show');
        document.getElementById('nombreProducto').focus();
    

        await cargarImagenesProducto(idProducto);

        // Reinicializar iconos
        if (typeof lucide !== 'undefined') {
            lucide.createIcons();
        }
        
    } catch (err) {
        console.error('Error editando producto:', err);
        await error('Error al cargar los datos del producto');
    }
};

/**
 * Ver detalles de un producto
 */
const verDetallesProducto = async (idProducto) => {
    try {
        const response = await api.get(`/productos/${idProducto}`);
        
        if (!response.success) {
            await error('Error al cargar los datos del producto');
            return;
        }
        
        const producto = response.data.data;
        
        // Configurar títulos
        document.getElementById('modalTitleText').textContent = 'Detalles del Producto';
        
        // Llenar formulario
        llenarFormulario(producto);

        
        
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
        
        window.productoEditando = 'view';
        document.getElementById('modalProducto').classList.add('show');
        
        await cargarImagenesProducto(idProducto);

        // Reinicializar iconos
        if (typeof lucide !== 'undefined') {
            lucide.createIcons();
        }
        
    } catch (err) {
        console.error('Error viendo producto:', err);
        await error('Error al cargar los datos del producto');
    }
};

/**
 * Eliminar producto
 */
const eliminarProducto = (idProducto, nombreProducto) => {
    document.getElementById('productoAEliminar').textContent = nombreProducto;
    window.productoAEliminar = idProducto;
    document.getElementById('modalConfirmar').classList.add('show');
};

/**
 * Confirma la eliminación del producto
 */
const confirmarEliminacion = async () => {
    try {
        const idProducto = window.productoAEliminar;
        if (!idProducto) return;
        
        const response = await api.del(`/productos/${idProducto}`);
        
        if (response.success) {
            await success('Producto eliminado exitosamente');
            cerrarModalConfirmacion();
            await cargarProductos();
        } else {
            await error(response.message || 'Error al eliminar el producto');
        }
        
    } catch (err) {
        console.error('Error eliminando producto:', err);
        await error('Error al eliminar el producto');
    }
};

async function cargarImagenesProducto(idProducto) {
    try {
        const imagenes = await api.get(`/productos/${idProducto}/imagenes`);
        const contenedor = document.getElementById('imagenesProducto');
        contenedor.innerHTML = '';
        contenedor.classList.add('imagenes-producto-lista');
        const isView = window.productoEditando === 'view';
        imagenes.forEach(img => {
            const url = `http://localhost:3000${img.url_imagen}`;
            contenedor.innerHTML += `
                <div class="imagen-item" data-id-imagen="${img.id_imagen}">
                    <img src="${url}" alt="Imagen producto">
                    ${!isView ? `<button class='imagen-eliminar-btn' title='Eliminar imagen' onclick='eliminarImagenProducto(${idProducto}, ${img.id_imagen})'>&times;</button>` : ''}
                </div>
            `;
        });
    } catch (err) {
        console.error('Error cargando imágenes', err);
    }
}



/**
 * Maneja el submit del formulario
 */
const manejarSubmitFormulario = async (e) => {
    try {
        const form = e.target;
        const formData = new FormData(form);
        const datos = {
            nombre_producto: formData.get('nombre_producto'),
            descripcion: formData.get('descripcion'),
            precio: parseFloat(formData.get('precio')),
            stock: parseInt(formData.get('stock')),
            id_categoria: parseInt(formData.get('id_categoria')),
            id_proveedor: formData.get('id_proveedor') ? parseInt(formData.get('id_proveedor')) : null,
            estado: formData.get('estado')
        };

        if (!validarFormulario(datos)) {
            return;
        }

        let response;
        let productoId;
        if (window.productoEditando) {
            // Actualizar producto existente
            response = await api.put(`/productos/${window.productoEditando}`, datos);
            productoId = window.productoEditando;
        } else {
            // Crear nuevo producto
            response = await api.post('/productos', datos);
            productoId = response.data?.data?.id_producto;
        }

        if (response.success) {
            // Obtener el input file directamente
            const inputImagen = document.getElementById('imagenProducto');
            const imagenFile = inputImagen && inputImagen.files && inputImagen.files[0] ? inputImagen.files[0] : null;
            if (imagenFile && productoId) {
                const imagenForm = new FormData();
                imagenForm.append('imagen', imagenFile);
                try {
                    console.log("1");
                    const resp = await fetch(`http://localhost:3000/api/productos/${productoId}/imagenes`, {
                        method: 'POST',
                        headers: {
                            // No se pone Content-Type, fetch lo gestiona con FormData
                            'Authorization': `Bearer ${userManager.obtenerToken()}`
                        },
                        body: imagenForm
                    });
                    console.log("2");
                    const imagenResp = await resp.json();
                    console.log(imagenResp);
                    if (!resp.ok || !imagenResp || imagenResp.error) {
                        await error(imagenResp.error || 'La imagen no se pudo subir');
                    }
                } catch (err) {
                    await error('Error al subir la imagen');
                }
            } else if (inputImagen && inputImagen.value && !imagenFile) {
                mostrarError('errorImagenProducto', 'Selecciona una imagen válida');
            }
            const mensaje = window.productoEditando ? 'Producto actualizado exitosamente' : 'Producto creado exitosamente';
            await success(mensaje);
            cerrarModal();
            await cargarProductos();
        } else {
            await error(response.message || 'Error al guardar el producto');
        }

    } catch (err) {
        console.error('Error guardando producto:', err);
        await error('Error al guardar el producto');
    }

};

/**
 * Valida el formulario
 */
const validarFormulario = (datos) => {
    limpiarErrores();
    let esValido = true;
    
    if (!datos.nombre_producto || datos.nombre_producto.trim() === '') {
        mostrarError('errorNombreProducto', 'El nombre del producto es requerido');
        document.getElementById('nombreProducto').classList.add('error');
        esValido = false;
    }
    
    if (!datos.precio || isNaN(datos.precio) || datos.precio < 0) {
        mostrarError('errorPrecio', 'El precio debe ser un número válido mayor o igual a 0');
        document.getElementById('precio').classList.add('error');
        esValido = false;
    }
    
    if (isNaN(datos.stock) || datos.stock < 0) {
        mostrarError('errorStock', 'El stock debe ser un número válido mayor o igual a 0');
        document.getElementById('stock').classList.add('error');
        esValido = false;
    }
    
    if (!datos.id_categoria || isNaN(datos.id_categoria)) {
        mostrarError('errorCategoria', 'Debe seleccionar una categoría');
        document.getElementById('categoriaProducto').classList.add('error');
        esValido = false;
    }
    
    return esValido;
};

/**
 * Llena el formulario con los datos del producto
 */
const llenarFormulario = (producto) => {
    document.getElementById('nombreProducto').value = producto.nombre_producto;
    document.getElementById('descripcion').value = producto.descripcion || '';
    document.getElementById('precio').value = producto.precio;
    document.getElementById('stock').value = producto.stock;
    document.getElementById('categoriaProducto').value = producto.id_categoria;
    document.getElementById('proveedorProducto').value = producto.id_proveedor || '';
    document.getElementById('estado').value = producto.estado;
};

/**
 * Habilita o deshabilita los campos del formulario
 */
const habilitarCampos = (deshabilitar) => {
    const campos = ['nombreProducto', 'descripcion', 'precio', 'stock', 'categoriaProducto', 'proveedorProducto', 'estado'];
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
    document.getElementById('modalProducto').classList.remove('show');
    
    // Rehabilitar campos si estaban deshabilitados
    habilitarCampos(false);
    
    // Restaurar botón guardar
    const btnGuardar = document.getElementById('btnGuardar');
    if (btnGuardar) {
        btnGuardar.innerHTML = '<i data-lucide="save"></i><span id="btnGuardarText">Crear Producto</span>';
        btnGuardar.type = 'submit';
        btnGuardar.className = 'btn btn-primary';
        btnGuardar.onclick = null;
    }
    
    // Limpiar el formulario
    document.getElementById('productoForm')?.reset();
    
    limpiarErrores();
    window.productoEditando = null;
    
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
    window.productoAEliminar = null;
};

/**
 * Muestra estado de carga
 */
const mostrarCargando = () => {
    const container = document.getElementById('productosTableContainer');
    if (container) {
        container.innerHTML = `
            <div class="loading">
                <i data-lucide="loader-2" style="animation: spin 1s linear infinite;"></i>
                <p>Cargando productos...</p>
            </div>
        `;
        lucide.createIcons();
    }
};

/**
 * Muestra mensaje de error en la tabla
 */
const mostrarErrorTabla = (mensaje) => {
    const container = document.getElementById('productosTableContainer');
    if (container) {
        container.innerHTML = `
            <div class="error-state">
                <i data-lucide="alert-triangle"></i>
                <h3>Error</h3>
                <p>${mensaje}</p>
                <button onclick="cargarProductos()" class="btn btn-primary">
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
window.editarProducto = editarProducto;
window.verDetallesProducto = verDetallesProducto;
window.eliminarProducto = eliminarProducto;
window.cargarProductos = cargarProductos;
