/**
 * Controlador para la página de historial de compras
 * Maneja la lógica para mostrar las compras del usuario
 */

import './misCompras.css';
import { PublicNavigation } from '../../Components/Navigation/PublicNavigation.js';
import { userManager } from '../../Helpers/userManager.js';
import * as api from '../../Helpers/api.js';
import { success, error, confirm } from '../../Helpers/alertas.js';

// Variables globales
let compras = [];
let filtroEstado = 'todas';
let ordenamiento = 'fecha_desc';

/**
 * Función principal del controlador de mis compras
 */
export const misComprasController = async () => {
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
 * Inicializa la página de mis compras
 */
const inicializarPagina = async () => {
    try {
        console.log('🔍 Buscando contenedor publicNavContainer...');
        
        // Esperar hasta que el contenedor esté disponible
        const navContainer = await esperarContenedor('publicNavContainer');
        
        console.log('✅ Contenedor encontrado, inicializando navegación...');

        // Inicializar componente de navegación
        const navigation = new PublicNavigation();
        await navigation.init();
        
        console.log('🎨 Inicializando iconos...');
        
        // Inicializar Lucide icons
        if (typeof lucide !== 'undefined') {
            lucide.createIcons();
        }

        console.log('🔧 Configurando eventos...');

        // Configurar eventos
        configurarEventos();
        
        // Cargar compras iniciales
        await cargarCompras();
        
    } catch (err) {
        console.error('Error inicializando página:', err);
        await error('Error al cargar la página de mis compras');
    }
};

/**
 * Configura los eventos de la página
 */
const configurarEventos = () => {
    // Botón actualizar
    document.getElementById('btnRefresh')?.addEventListener('click', cargarCompras);
    
    // Filtros
    document.getElementById('filtroEstado')?.addEventListener('change', (e) => {
        filtroEstado = e.target.value;
        aplicarFiltros();
    });
    
    document.getElementById('ordenamiento')?.addEventListener('change', (e) => {
        ordenamiento = e.target.value;
        aplicarFiltros();
    });

    // Modal eventos
    document.getElementById('modalClose')?.addEventListener('click', cerrarModal);
    document.getElementById('modalCerrar')?.addEventListener('click', cerrarModal);
    
    // Cerrar modal al hacer click fuera
    document.getElementById('modalDetalles')?.addEventListener('click', (e) => {
        if (e.target.id === 'modalDetalles') {
            cerrarModal();
        }
    });

    // Eventos dinámicos para botones de compras
    document.addEventListener('click', (e) => {
        if (e.target.closest('.btn-ver-detalles')) {
            const compraId = parseInt(e.target.closest('.btn-ver-detalles').dataset.compraId);
            verDetalles(compraId);
        }

        if (e.target.closest('.btn-descargar-factura')) {
            const facturaId = parseInt(e.target.closest('.btn-descargar-factura').dataset.ventaId);
            descargarFactura(facturaId);
        }

        if (e.target.closest('.btn-cancelar-compra')) {
            const compraId = parseInt(e.target.closest('.btn-cancelar-compra').dataset.ventaId);
            cancelarCompra(compraId);
        }
    });
};

/**
 * Carga las compras desde la API
 */
const cargarCompras = async () => {
    try {
        // Mostrar loading
        document.getElementById('comprasLoading').style.display = 'block';
        document.getElementById('sinCompras').style.display = 'none';
        document.getElementById('comprasLista').style.display = 'none';

        const response = await api.get('/ventas/mis-compras');
        compras = response.data.ventas || [];
        console.log(compras);

        // Ocultar loading
        document.getElementById('comprasLoading').style.display = 'none';

        if (compras.length === 0) {
            mostrarSinCompras();
        } else {
            aplicarFiltros();
        }

    } catch (err) {
        console.error('Error cargando compras:', err);
        document.getElementById('comprasLoading').style.display = 'none';
        await error('Error al cargar el historial de compras');
    }
};

/**
 * Muestra el estado sin compras
 */
const mostrarSinCompras = () => {
    document.getElementById('sinCompras').style.display = 'block';
    document.getElementById('comprasLista').style.display = 'none';
};

/**
 * Aplica filtros y muestra las compras
 */
const aplicarFiltros = () => {
    const comprasFiltradas = filtrarYOrdenarCompras();
    
    if (comprasFiltradas.length === 0) {
        mostrarSinCompras();
    } else {
        mostrarListaCompras(comprasFiltradas);
    }
};

/**
 * Filtra y ordena las compras según los criterios seleccionados
 */
const filtrarYOrdenarCompras = () => {
    let comprasFiltradas = [...compras];

    // Filtrar por estado
    if (filtroEstado !== 'todas') {
        const estadoFiltro = filtroEstado.toUpperCase();
        comprasFiltradas = comprasFiltradas.filter(compra => compra.estado_venta === estadoFiltro);
    }

    // Ordenar
    comprasFiltradas.sort((a, b) => {
        switch (ordenamiento) {
            case 'fecha_desc':
                return new Date(b.fecha_venta) - new Date(a.fecha_venta);
            case 'fecha_asc':
                return new Date(a.fecha_venta) - new Date(b.fecha_venta);
            case 'total_desc':
                return parseFloat(b.total_venta) - parseFloat(a.total_venta);
            case 'total_asc':
                return parseFloat(a.total_venta) - parseFloat(b.total_venta);
            default:
                return 0;
        }
    });

    return comprasFiltradas;
};

/**
 * Muestra la lista de compras
 */
const mostrarListaCompras = (comprasFiltradas) => {
    document.getElementById('sinCompras').style.display = 'none';
    document.getElementById('comprasLista').style.display = 'block';

    const container = document.getElementById('comprasLista');
    container.innerHTML = comprasFiltradas.map(compra => renderizarCompra(compra)).join('');

    // Recrear iconos de Lucide
    if (typeof lucide !== 'undefined') {
        lucide.createIcons();
    }
};

/**
 * Renderiza una compra individual
 */
const renderizarCompra = (compra) => {
    const fecha = new Date(compra.fecha_venta);
    const fechaFormateada = fecha.toLocaleDateString('es-ES', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });

    const estadoClass = getEstadoClass(compra.estado_venta);
    const estadoTexto = getEstadoTexto(compra.estado_venta);
    const totalProductos = compra.total_productos || 0;

    return `
        <div class="compra-card">
            <div class="compra-header">
                <div class="compra-info">
                    <h3>Compra #${compra.id_venta}</h3>
                    <span class="estado-badge ${estadoClass}">${estadoTexto}</span>
                </div>
                <div class="compra-fecha">
                    ${fechaFormateada}
                </div>
            </div>

            <div class="compra-body">
                <div class="compra-detalles">
                    <div class="detalle">
                        <span class="label">Total:</span>
                        <span class="valor total">$${parseFloat(compra.total_venta).toFixed(2)}</span>
                    </div>
                    <div class="detalle">
                        <span class="label">Productos:</span>
                        <span class="valor">${totalProductos} artículo(s)</span>
                    </div>
                    <div class="detalle">
                        <span class="label">Estado:</span>
                        <span class="valor">${estadoTexto}</span>
                    </div>
                </div>
            </div>

            <div class="compra-actions">
                <button class="btn btn-outline btn-small btn-ver-detalles" data-compra-id="${compra.id_venta}">
                    <i data-lucide="eye" width="14" height="14"></i>
                    Ver Detalles
                </button>
                ${compra.estado_venta === 'COMPLETADA' ? `
                    <button class="btn btn-secondary btn-small btn-descargar-factura" data-venta-id="${compra.id_venta}">
                        <i data-lucide="download" width="14" height="14"></i>
                        Factura
                    </button>
                ` : ''}
                ${compra.estado_venta === 'PENDIENTE' ? `
                    <button class="btn btn-danger btn-small btn-cancelar-compra" data-compra-id="${compra.id_venta}">
                        <i data-lucide="x" width="14" height="14"></i>
                        Cancelar
                    </button>
                ` : ''}
            </div>
        </div>
    `;
};

/**
 * Obtiene la clase CSS para el estado
 */
const getEstadoClass = (estado) => {
    const clases = {
        'PENDIENTE': 'estado-pendiente',
        'COMPLETADA': 'estado-pagada',
        'CANCELADA': 'estado-cancelada'
    };
    return clases[estado] || 'estado-default';
};

/**
 * Obtiene el texto formateado para el estado
 */
const getEstadoTexto = (estado) => {
    const textos = {
        'PENDIENTE': 'Pendiente',
        'COMPLETADA': 'Completada',
        'CANCELADA': 'Cancelada'
    };
    return textos[estado] || estado;
};

/**
 * Formatea el método de pago
 */
const formatearMetodoPago = (metodo) => {
    const metodos = {
        'efectivo': '💵 Efectivo',
        'tarjeta': '💳 Tarjeta',
        'transferencia': '🏦 Transferencia'
    };
    return metodos[metodo] || metodo;
};

/**
 * Ver detalles de una compra
 */
const verDetalles = async (compraId) => {
    try {
        const response = await api.get(`/api/ventas/${compraId}`);
        if (response.success) {
            mostrarModalDetalles(response.data);
        }
    } catch (err) {
        console.error('Error cargando detalles:', err);
        await error('Error al cargar los detalles de la compra');
    }
};

/**
 * Muestra el modal con detalles de la compra
 */
const mostrarModalDetalles = (compra) => {
    const modal = document.getElementById('modalDetalles');
    const titulo = document.getElementById('modalTitulo');
    const body = document.getElementById('modalBody');

    titulo.textContent = `Detalles de Compra #${compra.id}`;
    
    const fecha = new Date(compra.fecha_venta).toLocaleString('es-ES');
    
    body.innerHTML = `
        <div class="info-grupo">
            <h3>Información General</h3>
            <p><strong>Fecha:</strong> ${fecha}</p>
            <p><strong>Estado:</strong> ${getEstadoTexto(compra.estado)}</p>
            <p><strong>Método de Pago:</strong> ${formatearMetodoPago(compra.metodo_pago)}</p>
            <p><strong>Total:</strong> $${compra.total.toFixed(2)}</p>
        </div>
        
        ${compra.productos && compra.productos.length > 0 ? `
            <div class="info-grupo">
                <h3>Productos Comprados</h3>
                <div class="productos-detalle">
                    ${compra.productos.map(producto => `
                        <div class="producto-detalle">
                            <span class="producto-nombre">${producto.nombre}</span>
                            <span class="producto-precio">$${producto.precio.toFixed(2)}</span>
                            <span class="producto-cantidad">x${producto.cantidad}</span>
                            <span class="producto-subtotal">$${(producto.precio * producto.cantidad).toFixed(2)}</span>
                        </div>
                    `).join('')}
                </div>
            </div>
        ` : ''}
        
        ${compra.factura_id ? `
            <div class="info-grupo">
                <h3>Facturación</h3>
                <p><strong>Factura ID:</strong> ${compra.factura_id}</p>
                <button class="btn btn-secondary btn-descargar-factura" data-factura-id="${compra.factura_id}">
                    <i data-lucide="download" width="16" height="16"></i>
                    Descargar Factura
                </button>
            </div>
        ` : ''}
    `;

    modal.style.display = 'flex';

    // Recrear iconos de Lucide
    if (typeof lucide !== 'undefined') {
        lucide.createIcons();
    }
};

/**
 * Cierra el modal
 */
const cerrarModal = () => {
    document.getElementById('modalDetalles').style.display = 'none';
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
 * Cancela una compra
 */
const cancelarCompra = async (compraId) => {
    try {
        const confirmar = await confirm(
            '¿Estás seguro de que quieres cancelar esta compra? Esta acción no se puede deshacer.',
            'Sí, cancelar compra',
            'No cancelar'
        );

        if (!confirmar) return;

        const response = await api.post(`/api/ventas/${compraId}/cancelar`);
        
        if (response.success) {
            await success('Compra cancelada exitosamente');
            await cargarCompras();
        } else {
            throw new Error(response.message || 'Error cancelando la compra');
        }
    } catch (err) {
        console.error('Error cancelando compra:', err);
        await error(err.message || 'Error al cancelar la compra');
    }
};

/**
 * Espera hasta que un contenedor con el ID especificado esté disponible en el DOM
 * @param {string} id - ID del contenedor a esperar
 * @param {number} maxIntentos - Número máximo de intentos antes de fallar
 * @returns {Promise<Element>} - Promesa que se resuelve con el elemento encontrado
 */
const esperarContenedor = (id, maxIntentos = 50) => {
    return new Promise((resolve, reject) => {
        let intentos = 0;
        
        const verificar = () => {
            const contenedor = document.getElementById(id);
            
            if (contenedor) {
                console.log(`✅ Contenedor ${id} encontrado después de ${intentos} intentos`);
                resolve(contenedor);
                return;
            }
            
            intentos++;
            
            if (intentos >= maxIntentos) {
                console.error(`❌ Contenedor ${id} no encontrado después de ${maxIntentos} intentos`);
                console.log('📋 Contenedores disponibles:', Array.from(document.querySelectorAll('[id]')).map(el => el.id));
                reject(new Error(`Contenedor ${id} no encontrado`));
                return;
            }
            
            setTimeout(verificar, 100);
        };
        
        verificar();
    });
};

// Exponer funciones globalmente para uso en onclick
window.descargarFactura = descargarFactura;
