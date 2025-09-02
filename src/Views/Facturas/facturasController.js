/**
 * Controlador para la gestión de facturas
 * Maneja el CRUD completo de facturas con validación de permisos
 */

import './facturas.css';
import { DashboardNavigation } from '../../Components/Navigation/DashboardNavigation.js';
import { userManager } from '../../Helpers/userManager.js';
import * as api from '../../Helpers/api.js';
import { success, error, confirm } from '../../Helpers/alertas.js';

// Variables globales
let facturas = [];
let facturaEditando = null;
let facturaAEliminar = null;

/**
 * Función principal del controlador de facturas
 */
export const facturasController = async () => {
    // Inicializar gestor de usuario
    userManager.init();

    // Verificar autenticación
    const usuario = userManager.obtenerUsuario();
    if (!usuario) {
        location.hash = '#Login';
        return;
    }

    // Inicializar la página
    await inicializarPagina();
};

/**
 * Inicializa la página de facturas
 */
const inicializarPagina = async () => {
    try {
        // Inicializar componente de navegación
        const navigation = new DashboardNavigation();
        await navigation.init();
        
        // Configurar eventos
        configurarEventos();
        
        // Configurar permisos de UI
        configurarPermisosUI();
        
        // Inicializar Lucide icons
        if (typeof lucide !== 'undefined') {
            lucide.createIcons();
        }
        
        // Cargar facturas iniciales
        await cargarFacturas();
        
    } catch (err) {
        console.error('Error inicializando página:', err);
        await error('Error al cargar la página de facturas');
    }
};

/**
 * Configura los eventos de la página
 */
const configurarEventos = () => {
    // Botón actualizar
    document.getElementById('btnRefresh')?.addEventListener('click', cargarFacturas);
    
    // Búsqueda en tiempo real
    document.getElementById('searchInput')?.addEventListener('input', filtrarFacturas);
    
    // Filtros
    document.getElementById('filtroEstado')?.addEventListener('change', filtrarFacturas);
    document.getElementById('filtroFecha')?.addEventListener('change', filtrarFacturas);
    
    // Modal eventos
    document.getElementById('closeModal')?.addEventListener('click', cerrarModal);
    document.getElementById('btnCancelar')?.addEventListener('click', cerrarModal);
    document.getElementById('closeModalConfirmar')?.addEventListener('click', cerrarModalConfirmacion);
    document.getElementById('btnCancelarEliminar')?.addEventListener('click', cerrarModalConfirmacion);
    
    // Confirmación de eliminación
    document.getElementById('btnConfirmarEliminar')?.addEventListener('click', confirmarEliminacion);
    
    // Cerrar modal al hacer click fuera
    document.getElementById('modalFactura')?.addEventListener('click', (e) => {
        if (e.target.id === 'modalFactura') {
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
    
    // Los botones de crear no aplican para facturas ya que se generan automáticamente
    // Solo mostrar/ocultar botones según permisos de lectura
    console.log('Permisos del usuario:', permisos);
};

/**
 * Carga todas las facturas desde la API
 */
const cargarFacturas = async () => {
    try {
        mostrarCargando();
        
        const response = await api.get('/facturas');
        console.log(response.data);
        
        if (response.success) {
            facturas = response.data.facturas || [];
            mostrarTablaFacturas(facturas);
        } else {
            throw new Error(response.message || 'Error al cargar facturas');
        }
        
    } catch (err) {
        console.error('Error cargando facturas:', err);
        mostrarErrorTabla('Error al cargar las facturas: ' + err.message);
    }
};

/**
 * Muestra la tabla de facturas
 */
const mostrarTablaFacturas = (facturas) => {
    const container = document.getElementById('facturasTableContainer');
    if (!container) return;
    
    if (!facturas || facturas.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <i data-lucide="file-text"></i>
                <h3>No hay facturas registradas</h3>
                <p>Las facturas se generan automáticamente al completar las ventas.</p>
            </div>
        `;
        if (typeof lucide !== 'undefined') {
            lucide.createIcons();
        }
        return;
    }
    
    const permisos = userManager.getPermisos();
    const puedeVer = permisos.includes('leer_facturas') || permisos.includes('*');
    const puedeDescargar = permisos.includes('descargar_facturas') || permisos.includes('*');
    const puedeEliminar = permisos.includes('eliminar_facturas') || permisos.includes('*');

    container.innerHTML = `
        <table class="facturas-table">
            <thead>
                <tr>
                    <th>ID</th>
                    <th>N° Factura</th>
                    <th>Cliente</th>
                    <th>Contacto</th>
                    <th>Items</th>
                    <th>Fecha</th>
                    <th>Total</th>
                    <th>Estado</th>
                    <th>Acciones</th>
                </tr>
            </thead>
            <tbody>
                ${facturas.map(factura => `
                    <tr data-factura-id="${factura.id_factura}">
                        <td>${factura.id_factura}</td>
                        <td><strong>#${factura.numero_factura}</strong></td>
                        <td>
                            <div class="cliente-info">
                                <strong>${factura.cliente_nombre || 'N/A'}</strong>
                                ${factura.cliente_rol ? `<small class="rol-badge">${factura.cliente_rol}</small>` : ''}
                            </div>
                        </td>
                        <td>
                            <div class="contacto-info">
                                ${factura.cliente_email ? `<div><i data-lucide="mail"></i> ${factura.cliente_email}</div>` : ''}
                                ${factura.cliente_telefono ? `<div><i data-lucide="phone"></i> ${factura.cliente_telefono}</div>` : ''}
                            </div>
                        </td>
                        <td>
                            <span class="badge badge-info">${factura.total_items || 0} items</span>
                        </td>
                        <td>${formatearFecha(factura.fecha_factura)}</td>
                        <td class="precio">$${parseFloat(factura.total_factura).toFixed(2)}</td>
                        <td>
                            <span class="badge ${getBadgeEstado(factura.estado_factura)}">
                                ${factura.estado_factura}
                            </span>
                        </td>
                        <td>
                            <div class="actions">
                                ${puedeVer ? `
                                    <button 
                                        class="btn btn-sm btn-primary" 
                                        onclick="verDetallesFactura(${factura.id_factura})"
                                        title="Ver detalles"
                                    >
                                        <i data-lucide="eye"></i>
                                        Ver
                                    </button>
                                ` : ''}
                                ${puedeDescargar ? `
                                    <button 
                                        class="btn btn-sm btn-secondary" 
                                        onclick="descargarFactura(${factura.id_factura})"
                                        title="Descargar PDF"
                                    >
                                        <i data-lucide="download"></i>
                                        PDF
                                    </button>
                                ` : ''}
                                ${puedeEliminar ? `
                                    <button 
                                        class="btn btn-sm btn-danger" 
                                        onclick="eliminarFactura(${factura.id_factura}, '${factura.numero_factura}')"
                                        title="Eliminar factura"
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
    if (typeof lucide !== 'undefined') {
        lucide.createIcons();
    }
};

/**
 * Obtiene la clase CSS para el badge según el estado
 */
const getBadgeEstado = (estado) => {
    const clases = {
        'GENERADA': 'badge-success',
        'ENVIADA': 'badge-warning',
        'PAGADA': 'badge-success',
        'CANCELADA': 'badge-danger'
    };
    return clases[estado] || 'badge-secondary';
};

/**
 * Filtra las facturas según los criterios de búsqueda
 */
const filtrarFacturas = () => {
    const searchTerm = document.getElementById('searchInput')?.value.toLowerCase() || '';
    const filtroEstado = document.getElementById('filtroEstado')?.value || '';
    const filtroFecha = document.getElementById('filtroFecha')?.value || '';
    
    let facturasFiltradas = [...facturas];
    
    // Filtro por texto
    if (searchTerm) {
        facturasFiltradas = facturasFiltradas.filter(factura => 
            factura.numero_factura.toLowerCase().includes(searchTerm) ||
            (factura.cliente_nombre && factura.cliente_nombre.toLowerCase().includes(searchTerm))
        );
    }
    
    // Filtro por estado
    if (filtroEstado) {
        facturasFiltradas = facturasFiltradas.filter(factura => 
            factura.estado_factura === filtroEstado
        );
    }
    
    // Filtro por fecha (últimos 30 días, 90 días, etc.)
    if (filtroFecha) {
        const ahora = new Date();
        const dias = parseInt(filtroFecha);
        const fechaLimite = new Date(ahora.getTime() - (dias * 24 * 60 * 60 * 1000));
        
        facturasFiltradas = facturasFiltradas.filter(factura => 
            new Date(factura.fecha_factura) >= fechaLimite
        );
    }
    
    mostrarTablaFacturas(facturasFiltradas);
};

/**
 * Ver detalles de una factura
 */
const verDetallesFactura = async (idFactura) => {
    try {
        const response = await api.get(`/facturas/${idFactura}`);
        
        if (response.success) {
            console.log(response.data);
            mostrarModalDetalles(response.data.factura);
        } else {
            throw new Error(response.message || 'Error al cargar detalles');
        }
    } catch (err) {
        console.error('Error cargando detalles:', err);
        await error('Error al cargar los detalles de la factura: ' + err.message);
    }
};

/**
 * Muestra el modal con detalles de la factura
 */
const mostrarModalDetalles = (factura) => {
    document.getElementById('modalTitleText').textContent = `Factura #${factura.numero_factura}`;
    
    const modalBody = document.getElementById('modalBody');
    modalBody.innerHTML = `
        <div class="factura-detalles">
            <div class="info-grupo">
                <h4><i data-lucide="file-text"></i> Información de la Factura</h4>
                <div class="detalle-grid">
                    <div class="detalle-item">
                        <label>Número de Factura:</label>
                        <span>#${factura.numero_factura}</span>
                    </div>
                    <div class="detalle-item">
                        <label>Fecha de Emisión:</label>
                        <span>${formatearFecha(factura.fecha_emision || factura.fecha_factura)}</span>
                    </div>
                    <div class="detalle-item">
                        <label>Estado:</label>
                        <span class="badge ${getBadgeEstado(factura.estado || factura.estado_factura)}">
                            ${factura.estado || factura.estado_factura}
                        </span>
                    </div>
                    <div class="detalle-item">
                        <label>Total Facturado:</label>
                        <span class="precio">$${parseFloat(factura.monto_total || factura.total_factura).toFixed(2)}</span>
                    </div>
                </div>
            </div>
            
            <div class="info-grupo">
                <h4><i data-lucide="user"></i> Información del Cliente</h4>
                <div class="detalle-grid">
                    <div class="detalle-item">
                        <label>Nombre:</label>
                        <span>${factura.nombre_usuario || factura.cliente_nombre || 'N/A'}</span>
                    </div>
                    <div class="detalle-item">
                        <label>Email:</label>
                        <span>${factura.email || factura.cliente_email || 'N/A'}</span>
                    </div>
                    <div class="detalle-item">
                        <label>Teléfono:</label>
                        <span>${factura.telefono || factura.cliente_telefono || 'N/A'}</span>
                    </div>
                    <div class="detalle-item">
                        <label>Rol:</label>
                        <span class="rol-badge">${factura.nombre_rol || factura.cliente_rol || 'N/A'}</span>
                    </div>
                </div>
            </div>
            
            <div class="info-grupo">
                <h4><i data-lucide="shopping-cart"></i> Información de la Venta</h4>
                <div class="detalle-grid">
                    <div class="detalle-item">
                        <label>ID de Venta:</label>
                        <span>#${factura.id_venta}</span>
                    </div>
                    <div class="detalle-item">
                        <label>Fecha de Venta:</label>
                        <span>${formatearFecha(factura.fecha_venta)}</span>
                    </div>
                    <div class="detalle-item">
                        <label>Estado de Venta:</label>
                        <span class="badge ${getBadgeEstado(factura.estado_venta)}">
                            ${factura.estado_venta || 'N/A'}
                        </span>
                    </div>
                    <div class="detalle-item">
                        <label>Total de Venta:</label>
                        <span class="precio">$${parseFloat(factura.total_venta || factura.monto_total).toFixed(2)}</span>
                    </div>
                </div>
            </div>
            
            ${factura.items && factura.items.length > 0 ? `
                <div class="info-grupo">
                    <h4>Items Facturados</h4>
                    <div class="items-table">
                        <table>
                            <thead>
                                <tr>
                                    <th>Producto</th>
                                    <th>Cantidad</th>
                                    <th>Precio Unit.</th>
                                    <th>Subtotal</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${factura.items.map(item => `
                                    <tr>
                                        <td>${item.nombre_producto}</td>
                                        <td>${item.cantidad}</td>
                                        <td>$${parseFloat(item.precio_unitario).toFixed(2)}</td>
                                        <td>$${parseFloat(item.subtotal).toFixed(2)}</td>
                                    </tr>
                                `).join('')}
                            </tbody>
                        </table>
                    </div>
                </div>
            ` : ''}
        </div>
    `;
    
    // Ocultar botones de acción ya que es solo lectura
    document.getElementById('modalFooter').innerHTML = `
        <button type="button" class="btn btn-secondary" id="btnCancelar">Cerrar</button>
        <button type="button" class="btn btn-primary" onclick="descargarFactura(${factura.id_factura})">
            <i data-lucide="download"></i>
            Descargar PDF
        </button>
    `;
    
    document.getElementById('modalFactura').classList.add('show');
    
    // Reinicializar eventos y iconos
    document.getElementById('btnCancelar').addEventListener('click', cerrarModal);
    if (typeof lucide !== 'undefined') {
        lucide.createIcons();
    }
};

/**
 * Descarga una factura en PDF
 */
const descargarFactura = async (idFactura) => {
    try {
        // Obtener token del usuario
        const token = userManager.obtenerToken();
        if (!token) {
            await error('No tienes permisos para descargar esta factura');
            return;
        }

        // Realizar petición para descargar PDF
        const response = await fetch(`http://localhost:3000/api/facturas/${idFactura}/pdf`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/pdf',
                'Authorization': `Bearer ${token}`
            }
        });
        if (!response.ok) {
            let errorMessage = 'Error al descargar factura';
            try {
                const errorData = await response.json();
                errorMessage = errorData.mensaje || errorData.message || errorMessage;
            } catch (e) {
                // Si no se puede parsear como JSON, usar el status text
                errorMessage = response.statusText || errorMessage;
            }
            throw new Error(errorMessage);
        }

        // Crear blob del PDF
        const blob = await response.blob();

        // Verificar que el blob tiene contenido
        if (blob.size === 0) {
            throw new Error('El archivo PDF está vacío');
        }

        // Crear URL temporal para el blob
        const url = window.URL.createObjectURL(blob);
        
        // Crear elemento de descarga temporal
        const a = document.createElement('a');
        a.href = url;
        a.download = `Factura_${idFactura}.pdf`;
        
        // Agregar al DOM temporalmente y hacer click
        document.body.appendChild(a);
        a.click();
        
        // Limpiar
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
        
        await success('Factura descargada exitosamente');
        
    } catch (err) {
        console.error('Error descargando factura:', err);
        await error('Error al descargar la factura: ' + err.message);
    }
};

/**
 * Eliminar factura
 */
const eliminarFactura = (idFactura, numeroFactura) => {
    facturaAEliminar = { id: idFactura, numero: numeroFactura };
    
    document.getElementById('mensajeConfirmacion').innerHTML = `
        <div class="text-center">
            <i data-lucide="alert-triangle" class="warning-icon"></i>
            <p>¿Estás seguro de que quieres eliminar la factura <strong>#${numeroFactura}</strong>?</p>
            <p><small>Esta acción no se puede deshacer.</small></p>
        </div>
    `;
    
    document.getElementById('modalConfirmar').classList.add('show');
    
    if (typeof lucide !== 'undefined') {
        lucide.createIcons();
    }
};

/**
 * Confirma la eliminación de la factura
 */
const confirmarEliminacion = async () => {
    if (!facturaAEliminar) return;
    
    try {
        const response = await api.del(`/facturas/${facturaAEliminar.id}`);
        
        if (response.success) {
            await success('Factura eliminada exitosamente');
            cerrarModalConfirmacion();
            await cargarFacturas();
        } else {
            throw new Error(response.message || 'Error al eliminar factura');
        }
    } catch (err) {
        console.error('Error eliminando factura:', err);
        await error('Error al eliminar la factura: ' + err.message);
    }
    
    facturaAEliminar = null;
};

/**
 * Cierra el modal principal
 */
const cerrarModal = () => {
    document.getElementById('modalFactura').classList.remove('show');
    facturaEditando = null;
};

/**
 * Cierra el modal de confirmación
 */
const cerrarModalConfirmacion = () => {
    document.getElementById('modalConfirmar').classList.remove('show');
    facturaAEliminar = null;
};

/**
 * Muestra estado de carga
 */
const mostrarCargando = () => {
    const container = document.getElementById('facturasTableContainer');
    if (container) {
        container.innerHTML = `
            <div class="loading">
                <i data-lucide="loader-2" class="spin"></i>
                <p>Cargando facturas...</p>
            </div>
        `;
        
        if (typeof lucide !== 'undefined') {
            lucide.createIcons();
        }
    }
};

/**
 * Muestra mensaje de error en la tabla
 */
const mostrarErrorTabla = (mensaje) => {
    const container = document.getElementById('facturasTableContainer');
    if (container) {
        container.innerHTML = `
            <div class="empty-state">
                <i data-lucide="alert-circle"></i>
                <h3>Error al cargar facturas</h3>
                <p>${mensaje}</p>
                <button class="btn btn-primary" onclick="cargarFacturas()">
                    <i data-lucide="refresh-cw"></i>
                    Reintentar
                </button>
            </div>
        `;
        
        if (typeof lucide !== 'undefined') {
            lucide.createIcons();
        }
    }
};

/**
 * Formatea una fecha
 */
const formatearFecha = (fecha) => {
    if (!fecha) return 'N/A';
    
    try {
        return new Date(fecha).toLocaleDateString('es-ES', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    } catch (err) {
        return 'Fecha inválida';
    }
};

// Exponer funciones globalmente para uso en onclick
window.verDetallesFactura = verDetallesFactura;
window.descargarFactura = descargarFactura;
window.eliminarFactura = eliminarFactura;
window.cargarFacturas = cargarFacturas;

// Añadir estilos para la animación de carga
const style = document.createElement('style');
style.textContent = `
    @keyframes spin {
        from { transform: rotate(0deg); }
        to { transform: rotate(360deg); }
    }
    .spin {
        animation: spin 1s linear infinite;
    }
`;
document.head.appendChild(style);
