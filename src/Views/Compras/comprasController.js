/**
 * Controlador para la página de finalizar compras
 * Maneja la lógica de procesamiento de compras desde el carrito
 */

import './compras.css';
import { PublicNavigation } from '../../Components/Navigation/PublicNavigation.js';
import { userManager } from '../../Helpers/userManager.js';
import * as api from '../../Helpers/api.js';
import { success, error, confirm } from '../../Helpers/alertas.js';

// Variables globales
let carrito = [];
let productos = [];
let total = 0;

/**
 * Función principal del controlador de compras
 */
export const comprasController = async () => {
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
 * Inicializa la página de compras
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
        
        // Cargar datos del carrito
        await cargarDatosCarrito();
        
    } catch (err) {
        console.error('Error inicializando página:', err);
        await error('Error al cargar la página de compras');
    }
};

/**
 * Configura los eventos de la página
 */
const configurarEventos = () => {
    // Botón procesar compra
    document.getElementById('btnProcesarCompra')?.addEventListener('click', procesarCompra);
    
    // Botón vaciar carrito
    document.getElementById('btnVaciarCarrito')?.addEventListener('click', vaciarCarrito);
    
    // Eventos de cantidad y eliminación se configurarán dinámicamente
    document.addEventListener('click', (e) => {
        if (e.target.classList.contains('btn-cantidad')) {
            const accion = e.target.dataset.accion;
            const itemId = parseInt(e.target.dataset.itemId);
            modificarCantidad(itemId, accion);
        }

        if (e.target.classList.contains('btn-eliminar')) {
            const itemId = parseInt(e.target.dataset.itemId);
            eliminarItem(itemId);
        }
    });
};

/**
 * Carga los datos del carrito desde la API
 */
const cargarDatosCarrito = async () => {
    try {
        // Mostrar loading
        document.getElementById('comprasLoading').style.display = 'block';
        document.getElementById('carritoVacio').style.display = 'none';
        document.getElementById('checkoutContent').style.display = 'none';

        // Cargar carrito actual
        const carritoResponse = await api.get('/carrito');
        carrito = carritoResponse.data.productos || [];

        // Cargar productos para mostrar detalles
        const productosResponse = await api.get('/productos');
        productos = productosResponse.data.productos || [];

        console.log(carrito);
        console.log(productos);

        // Ocultar loading
        document.getElementById('comprasLoading').style.display = 'none';

        if (carrito.length === 0) {
            mostrarCarritoVacio();
        } else {
            mostrarCheckout();
        }

    } catch (err) {
        console.error('Error cargando carrito:', err);
        document.getElementById('comprasLoading').style.display = 'none';
        await error('Error al cargar los datos del carrito');
    }
};

/**
 * Muestra el estado de carrito vacío
 */
const mostrarCarritoVacio = () => {
    document.getElementById('carritoVacio').style.display = 'block';
    document.getElementById('checkoutContent').style.display = 'none';
};

/**
 * Muestra el contenido del checkout
 */
const mostrarCheckout = () => {
    document.getElementById('carritoVacio').style.display = 'none';
    document.getElementById('checkoutContent').style.display = 'block';
    
    renderizarItemsCarrito();
    calcularTotales();
};

/**
 * Renderiza los items del carrito
 */
const renderizarItemsCarrito = () => {
    const container = document.getElementById('itemsCarrito');
    if (!container) return;

    container.innerHTML = carrito.map(item => {
        const producto = productos.find(p => p.id_producto === item.id_producto);
        if (!producto) return '';

        const precio = parseFloat(item.precio || producto.precio);
        const subtotal = parseFloat(item.subtotal || (precio * item.cantidad));

        return `
            <div class="item-carrito" data-id="${item.id_carrito}">
                <div class="item-info">
                    <img src="${producto.imagen || '/images/no-image.png'}" 
                         alt="${item.nombre_producto || producto.nombre_producto}" class="item-imagen">
                    <div class="item-detalles">
                        <h4>${item.nombre_producto || producto.nombre_producto}</h4>
                        <p class="item-categoria">${item.nombre_categoria || producto.nombre_categoria || 'Sin categoría'}</p>
                        <div class="item-precio">$${precio.toFixed(2)} c/u</div>
                    </div>
                </div>
                
                <div class="item-cantidad">
                    <button class="btn-cantidad" data-accion="decrementar" data-item-id="${item.id_carrito}">-</button>
                    <span class="cantidad">${item.cantidad}</span>
                    <button class="btn-cantidad" data-accion="incrementar" data-item-id="${item.id_carrito}">+</button>
                </div>
                
                <div class="item-subtotal">
                    $${subtotal.toFixed(2)}
                </div>
                
                <button class="btn-eliminar" data-item-id="${item.id}">
                    <i data-lucide="trash-2" width="16" height="16"></i>
                </button>
            </div>
        `;
    }).join('');

    // Recrear iconos de Lucide
    if (typeof lucide !== 'undefined') {
        lucide.createIcons();
    }
};

/**
 * Calcula y actualiza los totales
 */
const calcularTotales = () => {
    total = carrito.reduce((sum, item) => {
        // Usar el subtotal ya calculado que viene del carrito o calcularlo
        const subtotal = parseFloat(item.subtotal || 0);
        return sum + subtotal;
    }, 0);

    const impuestos = total * 0.16;
    const totalFinal = total + impuestos;

    document.getElementById('subtotalAmount').textContent = `$${total.toFixed(2)}`;
    document.getElementById('impuestosAmount').textContent = `$${impuestos.toFixed(2)}`;
    document.getElementById('totalAmount').textContent = `$${totalFinal.toFixed(2)}`;
};

/**
 * Modifica la cantidad de un item
 */
const modificarCantidad = async (itemId, accion) => {
    try {
        const item = carrito.find(c => c.id_carrito === parseInt(itemId));
        if (!item) return;

        const nuevaCantidad = accion === 'incrementar' ? item.cantidad + 1 : item.cantidad - 1;

        if (nuevaCantidad <= 0) {
            await eliminarItem(itemId);
            return;
        }

        const response = await api.put(`/carrito/producto/${itemId}`, { cantidad: nuevaCantidad });
        
        if (response.success) {
            await cargarDatosCarrito();
        } else {
            // Mostrar el mensaje de error que viene del backend
            await error(response.mensaje || 'Error al actualizar la cantidad');
        }
        
    } catch (err) {
        console.error('Error modificando cantidad:', err);
        // Si hay un mensaje de error en la respuesta, mostrarlo
        if (err.response && err.response.data && err.response.data.mensaje) {
            await error(err.response.data.mensaje);
        } else {
            await error('Error al actualizar la cantidad');
        }
    }
};

/**
 * Elimina un item del carrito
 */
const eliminarItem = async (itemId) => {
    try {
        const confirmar = await confirm(
            '¿Estás seguro de que quieres eliminar este producto del carrito?',
            'Sí, eliminar',
            'Cancelar'
        );

        if (!confirmar) return;

        await api.del(`/carrito/eliminar/${itemId}`);
        await cargarDatosCarrito();
        await success('Producto eliminado del carrito');
        
    } catch (err) {
        console.error('Error eliminando item:', err);
        await error('Error al eliminar el producto');
    }
};

/**
 * Vacía completamente el carrito
 */
const vaciarCarrito = async () => {
    try {
        const confirmar = await confirm(
            '¿Estás seguro de que quieres eliminar todos los productos del carrito?',
            'Sí, vaciar carrito',
            'Cancelar'
        );

        if (!confirmar) return;

        await api.del('/carrito/vaciar');
        await cargarDatosCarrito();
        await success('Carrito vaciado exitosamente');
        
    } catch (err) {
        console.error('Error vaciando carrito:', err);
        await error('Error al vaciar el carrito');
    }
};

/**
 * Procesa la compra
 */
const procesarCompra = async () => {
    try {
        if (carrito.length === 0) {
            await error('El carrito está vacío');
            return;
        }

        const totalFinal = total * 1.16;
        
        const confirmar = await confirm(
            `¿Proceder con la compra por $${totalFinal.toFixed(2)}?`,
            'Sí, procesar compra',
            'Cancelar'
        );

        if (!confirmar) return;

        // Deshabilitar botón
        const btnProcesar = document.getElementById('btnProcesarCompra');
        btnProcesar.disabled = true;
        btnProcesar.innerHTML = '<i data-lucide="loader" width="16" height="16"></i> Procesando...';

        const response = await api.post('/ventas/procesar-compra');

        if (response.success) {
            await success('¡Compra procesada exitosamente!');
            mostrarCompraExitosa(response.data);
        } else {
            throw new Error(response.mensaje || 'Error procesando la compra');
        }

    } catch (err) {
        console.error('Error procesando compra:', err);
        await error(err.message || 'Error al procesar la compra');
        
        // Rehabilitar botón
        const btnProcesar = document.getElementById('btnProcesarCompra');
        if (btnProcesar) {
            btnProcesar.disabled = false;
            btnProcesar.innerHTML = '<i data-lucide="credit-card" width="20" height="20"></i> Procesar Compra';
        }
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
 * Muestra la pantalla de compra exitosa
 */
const mostrarCompraExitosa = (data) => {
    document.getElementById('checkoutContent').style.display = 'none';
    document.getElementById('compraExitosa').style.display = 'block';

    const detallesContainer = document.getElementById('compraDetalles');
    console.log(data);
    detallesContainer.innerHTML = `
        <div class="detalle-card">
            <h3>Detalles de la Venta</h3>
            <p><strong>Número de Venta:</strong> #${data.venta.id_venta}</p>
            <p><strong>Total:</strong> $${parseFloat(data.venta.total_venta).toFixed(2)}</p>
            <p><strong>Fecha:</strong> ${new Date(data.venta.fecha_venta).toLocaleString()}</p>
        </div>

        ${data.factura ? `
            <div class="detalle-card">
                <h3>Factura Generada</h3>
                <p><strong>Número:</strong> ${data.factura.numero_factura}</p>
                <p><strong>Estado:</strong> ${data.factura.estado}</p>
                <button onclick="descargarFactura(${data.factura.id_factura})" 
                        class="btn btn-secondary">
                    <i data-lucide="download" width="16" height="16"></i>
                    Descargar Factura
                </button>
            </div>
        ` : ''}
    `;

    // Recrear iconos
    if (typeof lucide !== 'undefined') {
        lucide.createIcons();
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
