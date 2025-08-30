/**
 * Controlador para la página de Tienda
 * Maneja la visualización de productos y funcionalidad del carrito
 */

import { PublicNavigation } from '../../Components/Navigation/PublicNavigation.js';
import { userManager } from '../../Helpers/userManager.js';
import * as api from '../../Helpers/api.js';
import { success, error, confirm } from '../../Helpers/alertas.js';

/**
 * Función principal del controlador de tienda
 */
export const tiendaController = async () => {
    console.log('🛍️ Iniciando controlador de tienda...');
    
    // Esperar a que el DOM esté listo
    if (document.readyState === 'loading') {
        console.log('⏳ Esperando a que el DOM esté listo...');
        await new Promise(resolve => {
            document.addEventListener('DOMContentLoaded', resolve);
        });
    }
    
    // Usar setTimeout para asegurar que el HTML se haya renderizado
    await new Promise(resolve => setTimeout(resolve, 100));
    
    console.log('✅ DOM listo, verificando contenedor...');

    // Inicializar gestor de usuario
    userManager.init();

    // Inicializar la página
    await inicializarPagina();
};

/**
 * Variables globales
 */
let productosDisponibles = [];
let categoriasDisponibles = [];
let proveedoresDisponibles = [];
let carritoItems = [];

/**
 * Inicializa la página de tienda
 */
const inicializarPagina = async () => {
    try {
        console.log('🔍 Buscando contenedor publicNavContainer...');
        
        // Esperar hasta que el contenedor esté disponible
        const navContainer = await esperarContenedor('publicNavContainer');
        
        console.log('✅ Contenedor encontrado, inicializando navegación...');

        // Inicializar componente de navegación pública
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
        
        console.log('📦 Cargando datos iniciales...');
        
        // Cargar datos iniciales
        await Promise.all([
            cargarProductos(),
            cargarCategorias(),
            cargarProveedores(),
            actualizarContadorCarrito()
        ]);
        
        console.log('🎉 Tienda inicializada exitosamente');
        
    } catch (err) {
        console.error('💥 Error inicializando página:', err);
        if (typeof error !== 'undefined') {
            await error('Error al cargar la tienda');
        }
    }
};

/**
 * Espera hasta que un contenedor específico esté disponible en el DOM
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

/**
 * Configura todos los eventos de la página
 */
const configurarEventos = () => {
    // Filtros
    document.getElementById('searchInput')?.addEventListener('input', filtrarProductos);
    document.getElementById('filtroCategoria')?.addEventListener('change', filtrarProductos);
    document.getElementById('filtroProveedor')?.addEventListener('change', filtrarProductos);
    document.getElementById('ordenarPor')?.addEventListener('change', ordenarProductos);
    
    // Carrito
    document.getElementById('btnCarrito')?.addEventListener('click', abrirModalCarrito);
    document.getElementById('cerrarModalCarrito')?.addEventListener('click', cerrarModalCarrito);
    document.getElementById('btnVaciarCarrito')?.addEventListener('click', vaciarCarrito);
    document.getElementById('btnProcederCompra')?.addEventListener('click', procederCompra);
    
    // Click fuera del modal para cerrarlo
    document.getElementById('modalCarrito')?.addEventListener('click', (e) => {
        if (e.target.id === 'modalCarrito') {
            cerrarModalCarrito();
        }
    });
};

/**
 * Carga todos los productos disponibles
 */
const cargarProductos = async () => {
    try {
        mostrarCargando();
        
        const response = await api.get('/productos');
        
        if (response.success) {
            productosDisponibles = response.data.productos.filter(p => p.estado === 'DISPONIBLE');
            mostrarProductos(productosDisponibles);
        } else {
            mostrarErrorProductos('Error al cargar los productos');
        }
        
    } catch (err) {
        console.error('Error cargando productos:', err);
        mostrarErrorProductos('Error al cargar los productos');
    }
};

/**
 * Carga las categorías disponibles
 */
const cargarCategorias = async () => {
    try {
        const response = await api.get('/categorias/simple');
        if (response.success) {
            categoriasDisponibles = response.data;
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
            proveedoresDisponibles = response.data;
            llenarSelectProveedores();
        }
    } catch (err) {
        console.error('Error cargando proveedores:', err);
    }
};

/**
 * Llena el select de categorías
 */
const llenarSelectCategorias = () => {
    const select = document.getElementById('filtroCategoria');
    if (!select) return;
    
    // Limpiar opciones existentes (excepto la primera)
    while (select.children.length > 1) {
        select.removeChild(select.lastChild);
    }
    
    categoriasDisponibles.forEach(categoria => {
        const option = document.createElement('option');
        option.value = categoria.id_categoria;
        option.textContent = categoria.nombre_categoria;
        select.appendChild(option);
    });
};

/**
 * Llena el select de proveedores
 */
const llenarSelectProveedores = () => {
    const select = document.getElementById('filtroProveedor');
    if (!select) return;
    
    // Limpiar opciones existentes (excepto la primera)
    while (select.children.length > 1) {
        select.removeChild(select.lastChild);
    }
    
    proveedoresDisponibles.forEach(proveedor => {
        const option = document.createElement('option');
        option.value = proveedor.id_proveedor;
        option.textContent = proveedor.nombre_proveedor;
        select.appendChild(option);
    });
};

/**
 * Muestra los productos en el grid
 */
const mostrarProductos = (productos) => {
    const container = document.getElementById('productosGrid');
    if (!container) return;
    
    if (!productos || productos.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <i data-lucide="package-x"></i>
                <h3>No hay productos disponibles</h3>
                <p>No se encontraron productos que coincidan con los filtros seleccionados</p>
            </div>
        `;
        lucide.createIcons();
        return;
    }
    
    container.innerHTML = productos.map(producto => `
        <div class="producto-card">
            <div class="producto-image">
                <i data-lucide="package" width="48" height="48"></i>
            </div>
            <div class="producto-content">
                <h3 class="producto-title">${producto.nombre_producto}</h3>
                <p class="producto-description">${producto.descripcion || 'Sin descripción'}</p>
                
                <div class="producto-meta">
                    <span class="producto-categoria">${producto.nombre_categoria || 'Sin categoría'}</span>
                    <span class="producto-stock ${producto.stock <= 0 ? 'agotado' : ''}">
                        Stock: ${producto.stock}
                    </span>
                </div>
                
                <div class="producto-footer">
                    <span class="producto-precio">$${parseFloat(producto.precio).toLocaleString()}</span>
                    <button 
                        class="btn-agregar-carrito" 
                        onclick="agregarAlCarrito(${producto.id_producto})"
                        ${producto.stock <= 0 ? 'disabled' : ''}
                    >
                        <i data-lucide="plus" width="16" height="16"></i>
                        ${producto.stock <= 0 ? 'Agotado' : 'Agregar'}
                    </button>
                </div>
            </div>
        </div>
    `).join('');
    
    lucide.createIcons();
};

/**
 * Filtra los productos según los criterios seleccionados
 */
const filtrarProductos = () => {
    const busqueda = document.getElementById('searchInput')?.value.toLowerCase() || '';
    const categoria = document.getElementById('filtroCategoria')?.value || '';
    const proveedor = document.getElementById('filtroProveedor')?.value || '';
    
    let productosFiltrados = productosDisponibles.filter(producto => {
        const coincideBusqueda = !busqueda || 
            producto.nombre_producto.toLowerCase().includes(busqueda) ||
            (producto.descripcion && producto.descripcion.toLowerCase().includes(busqueda));
            
        const coincideCategoria = !categoria || producto.id_categoria == categoria;
        const coincideProveedor = !proveedor || producto.id_proveedor == proveedor;
        
        return coincideBusqueda && coincideCategoria && coincideProveedor;
    });
    
    ordenarYMostrarProductos(productosFiltrados);
};

/**
 * Ordena los productos según el criterio seleccionado
 */
const ordenarProductos = () => {
    filtrarProductos(); // Aplicar filtros y ordenar
};

/**
 * Ordena y muestra los productos
 */
const ordenarYMostrarProductos = (productos) => {
    const ordenar = document.getElementById('ordenarPor')?.value || 'nombre';
    
    productos.sort((a, b) => {
        switch (ordenar) {
            case 'precio_asc':
                return parseFloat(a.precio) - parseFloat(b.precio);
            case 'precio_desc':
                return parseFloat(b.precio) - parseFloat(a.precio);
            case 'nombre':
            default:
                return a.nombre_producto.localeCompare(b.nombre_producto);
        }
    });
    
    mostrarProductos(productos);
};

/**
 * Agrega un producto al carrito
 */
const agregarAlCarrito = async (idProducto) => {
    try {
        // Verificar si el usuario está autenticado
        const token = localStorage.getItem('accessToken');
        if (!token) {
            await error('Debes iniciar sesión para agregar productos al carrito');
            setTimeout(() => {
                location.hash = '#Login';
            }, 2000);
            return;
        }

        const response = await api.post('/carrito/agregar', {
            id_producto: idProducto,
            cantidad: 1
        });
        
        if (response.success) {
            await success('Producto agregado al carrito');
            await actualizarContadorCarrito();
        } else {
            await error(response.mensaje || 'Error al agregar producto al carrito');
        }
        
    } catch (err) {
        console.error('Error agregando al carrito:', err);
        if (err.message && err.message.includes('401')) {
            await error('Debes iniciar sesión para agregar productos al carrito');
            setTimeout(() => {
                location.hash = '#Login';
            }, 2000);
        } else {
            await error('Error al agregar producto al carrito');
        }
    }
};

/**
 * Actualiza el contador del carrito en la UI
 */
const actualizarContadorCarrito = async () => {
    try {
        const token = localStorage.getItem('accessToken');
        if (!token) {
            // Usuario no autenticado, mostrar contador en 0
            const contador = document.getElementById('carritoContador');
            if (contador) {
                contador.textContent = 0;
            }
            return;
        }

        const response = await api.get('/carrito/resumen');
        
        if (response.success) {
            const contador = document.getElementById('carritoContador');
            if (contador) {
                contador.textContent = response.data.resumen.total_cantidad || 0;
            }
        }
        
    } catch (err) {
        console.error('Error actualizando contador del carrito:', err);
        // En caso de error, mantener contador en 0
        const contador = document.getElementById('carritoContador');
        if (contador) {
            contador.textContent = 0;
        }
    }
};

/**
 * Abre el modal del carrito
 */
const abrirModalCarrito = async () => {
    try {
        const token = localStorage.getItem('accessToken');
        if (!token) {
            await error('Debes iniciar sesión para ver tu carrito');
            setTimeout(() => {
                location.hash = '#Login';
            }, 2000);
            return;
        }

        await cargarCarrito();
        const modal = document.getElementById('modalCarrito');
        if (modal) {
            modal.classList.add('show');
        }
    } catch (err) {
        console.error('Error abriendo carrito:', err);
        await error('Error al cargar el carrito');
    }
};

/**
 * Cierra el modal del carrito
 */
const cerrarModalCarrito = () => {
    const modal = document.getElementById('modalCarrito');
    if (modal) {
        modal.classList.remove('show');
    }
};

/**
 * Carga el contenido del carrito
 */
const cargarCarrito = async () => {
    try {
        const response = await api.get('/carrito');
        
        if (response.success) {
            carritoItems = response.data.productos;
            mostrarCarrito(carritoItems, response.data.resumen);
        } else {
            await error('Error al cargar el carrito');
        }
        
    } catch (err) {
        console.error('Error cargando carrito:', err);
        await error('Error al cargar el carrito');
    }
};

/**
 * Muestra el contenido del carrito en el modal
 */
const mostrarCarrito = (items, resumen) => {
    const contenido = document.getElementById('carritoContenido');
    const resumenDiv = document.getElementById('carritoResumen');
    
    if (!contenido || !resumenDiv) return;
    
    if (!items || items.length === 0) {
        contenido.innerHTML = `
            <div class="empty-state">
                <i data-lucide="shopping-cart"></i>
                <h3>Tu carrito está vacío</h3>
                <p>Agrega algunos productos para empezar a comprar</p>
            </div>
        `;
        resumenDiv.innerHTML = '';
        lucide.createIcons();
        return;
    }
    
    // Mostrar items del carrito
    contenido.innerHTML = items.map(item => `
        <div class="carrito-item">
            <div class="carrito-item-info">
                <h4 class="carrito-item-title">${item.nombre_producto}</h4>
                <p class="carrito-item-precio">$${parseFloat(item.precio).toLocaleString()} c/u</p>
                <p>Subtotal: $${parseFloat(item.subtotal).toLocaleString()}</p>
            </div>
            <div class="carrito-item-controls">
                <button onclick="cambiarCantidad(${item.id_producto}, ${item.cantidad - 1})" class="btn btn-sm btn-secondary">
                    <i data-lucide="minus" width="14" height="14"></i>
                </button>
                <input 
                    type="number" 
                    class="cantidad-input" 
                    value="${item.cantidad}" 
                    min="1" 
                    max="${item.stock}"
                    onchange="cambiarCantidad(${item.id_producto}, this.value)"
                >
                <button onclick="cambiarCantidad(${item.id_producto}, ${item.cantidad + 1})" class="btn btn-sm btn-secondary">
                    <i data-lucide="plus" width="14" height="14"></i>
                </button>
                <button onclick="eliminarDelCarrito(${item.id_producto})" class="btn btn-sm btn-danger">
                    <i data-lucide="trash-2" width="14" height="14"></i>
                </button>
            </div>
        </div>
    `).join('');
    
    // Mostrar resumen
    resumenDiv.innerHTML = `
        <div class="resumen-line">
            <span>Productos:</span>
            <span>${resumen.total_productos}</span>
        </div>
        <div class="resumen-line">
            <span>Cantidad total:</span>
            <span>${resumen.total_cantidad}</span>
        </div>
        <div class="resumen-line resumen-total">
            <span>Total:</span>
            <span>$${parseFloat(resumen.total_precio).toLocaleString()}</span>
        </div>
    `;
    
    lucide.createIcons();
};

/**
 * Cambia la cantidad de un producto en el carrito
 */
const cambiarCantidad = async (idProducto, nuevaCantidad) => {
    try {
        if (nuevaCantidad <= 0) {
            await eliminarDelCarrito(idProducto);
            return;
        }
        
        
        const response = await api.put(`/carrito/producto/${idProducto}`, {
            cantidad: parseInt(nuevaCantidad)
        });
        if (response.success) {
            await cargarCarrito();
            await actualizarContadorCarrito();
        } else {
            await error(response.mensaje || 'Error al actualizar cantidad');
        }
        
    } catch (err) {
        console.error('Error cambiando cantidad:', err);
        await error('Error al actualizar cantidad');
    }
};

/**
 * Elimina un producto del carrito
 */
const eliminarDelCarrito = async (idProducto) => {
    try {
        const response = await api.del(`/carrito/producto/${idProducto}`);
        
        if (response.success) {
            await cargarCarrito();
            await actualizarContadorCarrito();
        } else {
            await error('Error al eliminar producto del carrito');
        }
        
    } catch (err) {
        console.error('Error eliminando del carrito:', err);
        await error('Error al eliminar producto del carrito');
    }
};

/**
 * Vacía completamente el carrito
 */
const vaciarCarrito = async () => {
    try {
        const confirmacion = await confirm(
            '¿Estás seguro de que deseas vaciar el carrito?',
            'Sí, vaciar carrito',
            'Cancelar'
        );
        
        if (!confirmacion) return;
        
        const response = await api.del('/carrito/vaciar');
        
        if (response.success) {
            await cargarCarrito();
            await actualizarContadorCarrito();
            await success('Carrito vaciado exitosamente');
        } else {
            await error('Error al vaciar el carrito');
        }
        
    } catch (err) {
        console.error('Error vaciando carrito:', err);
        await error('Error al vaciar el carrito');
    }
};

/**
 * Procede a la compra
 */
const procederCompra = async () => {
    try {
        if (carritoItems.length === 0) {
            await error('El carrito está vacío');
            return;
        }
        
        // TODO: Implementar proceso de compra
        await success('Funcionalidad de compra en desarrollo');
        
    } catch (err) {
        console.error('Error procesando compra:', err);
        await error('Error al procesar la compra');
    }
};

/**
 * Muestra estado de carga
 */
const mostrarCargando = () => {
    const container = document.getElementById('productosGrid');
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
 * Muestra mensaje de error en productos
 */
const mostrarErrorProductos = (mensaje) => {
    const container = document.getElementById('productosGrid');
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

// Exponer funciones globalmente para uso en onclick
window.agregarAlCarrito = agregarAlCarrito;
window.cambiarCantidad = cambiarCantidad;
window.eliminarDelCarrito = eliminarDelCarrito;
window.cargarProductos = cargarProductos;
