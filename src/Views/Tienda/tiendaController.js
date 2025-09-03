/**
 * Controlador para la página de Tienda
 * Maneja la visualización de productos y funcionalidad del carrito
 */

import './tienda.css';
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
            // Obtener solo los productos disponibles
            let productos = response.data.productos.filter(p => p.estado === 'DISPONIBLE');
            // Para cada producto, obtener sus imágenes
            const productosConImagenes = await Promise.all(productos.map(async (producto) => {
                try {
                    const imagenesResp = await api.get(`/productos/${producto.id_producto}/imagenes`);
                    if (Array.isArray(imagenesResp)) {
                        producto.imagenes = imagenesResp.map(img => `http://localhost:3000${img.url_imagen}`);
                    } else {
                        producto.imagenes = [];
                    }
                } catch (err) {
                    producto.imagenes = [];
                }
                return producto;
            }));
            productosDisponibles = productosConImagenes;
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
            proveedoresDisponibles = response.data.data
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
    
        container.innerHTML = productos.map((producto, idx) => {
        let imagenesHtml;
        if (producto.imagenes && producto.imagenes.length > 0) {
            // Carrusel: solo una imagen visible, flechas para navegar
            imagenesHtml = `
                <div class="producto-carrusel" data-idx="${idx}">
                    <button class="carrusel-flecha carrusel-flecha-izq" data-accion="prev" data-idx="${idx}">&#8592;</button>
                    <img src="${producto.imagenes[0]}" alt="Imagen de ${producto.nombre_producto}" class="producto-carrusel-img" data-idx="${idx}" />
                    <button class="carrusel-flecha carrusel-flecha-der" data-accion="next" data-idx="${idx}">&#8594;</button>
                </div>
            `;
        } else {
            imagenesHtml = `
                <div class="producto-image">
                    <i data-lucide="package" width="48" height="48"></i>
                </div>
            `;
        }
        return `
            <div class="producto-card">
                ${imagenesHtml}
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
                        <div class="producto-precio">$${parseFloat(producto.precio).toLocaleString()}</div>
                        <div class="producto-footer-botones">
                            <button 
                                class="btn-agregar-carrito" 
                                onclick="agregarAlCarrito(${producto.id_producto})"
                                ${producto.stock <= 0 ? 'disabled' : ''}
                            >
                                <i data-lucide="plus" width="16" height="16"></i>
                                ${producto.stock <= 0 ? 'Agotado' : 'Agregar'}
                            </button>
                            <button 
                                class="btn btn-secondary btn-ver-detalle" 
                                data-id="${producto.id_producto}"
                            >
                                <i data-lucide="eye" width="16" height="16"></i>
                                Ver detalles
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }).join('');
    lucide.createIcons();

    // Carrusel JS: manejar flechas
    productos.forEach((producto, idx) => {
        if (producto.imagenes && producto.imagenes.length > 1) {
            let actual = 0;
            const carrusel = container.querySelector(`.producto-carrusel[data-idx='${idx}']`);
            if (!carrusel) return;
            const img = carrusel.querySelector('.producto-carrusel-img');
            const btnPrev = carrusel.querySelector('.carrusel-flecha-izq');
            const btnNext = carrusel.querySelector('.carrusel-flecha-der');
            btnPrev.addEventListener('click', () => {
                actual = (actual - 1 + producto.imagenes.length) % producto.imagenes.length;
                img.src = producto.imagenes[actual];
            });
            btnNext.addEventListener('click', () => {
                actual = (actual + 1) % producto.imagenes.length;
                img.src = producto.imagenes[actual];
            });
        }
        // Cargar reseñas y formulario
        cargarResenasProducto(producto.id_producto);
    });

    // Evento para abrir modal de detalles
    document.querySelectorAll('.btn-ver-detalle').forEach(btn => {
        btn.addEventListener('click', async (e) => {
            const id = btn.getAttribute('data-id');
            await abrirModalProductoTienda(id);
        });
    });

}

/**
 * Abre el modal de detalles de producto en la tienda
 */
async function abrirModalProductoTienda(idProducto) {
    // Buscar el producto en la lista global
    const producto = productosDisponibles.find(p => p.id_producto == idProducto);
    if (!producto) return;
    // Cargar reseñas
    let reseñas = [];
    try {
        const resp = await api.get(`/productos/${idProducto}/resenas`);
        if (resp.success && Array.isArray(resp.data)) {
            reseñas = resp.data;
        }
    } catch {}
    // Renderizar contenido
    const body = document.getElementById('modalProductoBody');
    const titulo = document.getElementById('modalProductoTitulo');
    if (!body || !titulo) return;
    titulo.textContent = producto.nombre_producto;
    body.innerHTML = `
        <div class="modal-producto-main">
            <div class="modal-producto-imagenes">
                ${(producto.imagenes && producto.imagenes.length > 0) ? `
                    <div class="modal-carrusel" style="position:relative;">
                        <button class="carrusel-flecha carrusel-flecha-izq" style="position:absolute;left:0;top:50%;transform:translateY(-50%);z-index:2;" type="button"><i data-lucide="chevron-left" width="28" height="28"></i></button>
                        <img src="${producto.imagenes[0]}" class="modal-producto-img" id="modalProductoImg" />
                        <button class="carrusel-flecha carrusel-flecha-der" style="position:absolute;right:0;top:50%;transform:translateY(-50%);z-index:2;" type="button"><i data-lucide="chevron-right" width="28" height="28"></i></button>
                    </div>
                ` : '<div class="empty-state">Sin imágenes</div>'}
            </div>
            <div class="modal-producto-info">
                <div class="modal-producto-info-row">
                    <div class="modal-info-block">
                        <span class="modal-info-key"><i data-lucide="layers" width="18" height="18"></i> Categoría</span>
                        <span class="modal-info-value">${producto.nombre_categoria || 'Sin categoría'}</span>
                    </div>
                    <div class="modal-info-block">
                        <span class="modal-info-key"><i data-lucide="truck" width="18" height="18"></i> Proveedor</span>
                        <span class="modal-info-value">${producto.nombre_proveedor || 'Sin proveedor'}</span>
                    </div>
                </div>
                <div class="modal-producto-info-row">
                    <div class="modal-info-block">
                        <span class="modal-info-key"><i data-lucide="dollar-sign" width="18" height="18"></i> Precio</span>
                        <span class="modal-info-value">$${parseFloat(producto.precio).toLocaleString()}</span>
                    </div>
                    <div class="modal-info-block">
                        <span class="modal-info-key"><i data-lucide="package" width="18" height="18"></i> Stock</span>
                        <span class="modal-info-value">${producto.stock}</span>
                    </div>
                </div>
                <div class="modal-producto-descripcion">
                    <span class="modal-info-key"><i data-lucide="file-text" width="18" height="18"></i> Descripción</span>
                    <div class="modal-info-value modal-descripcion-text">${producto.descripcion || 'Sin descripción'}</div>
                </div>
            </div>
        </div>
        <div class="modal-producto-reseñas">
            <h4>Reseñas</h4>
            <div class="reseña-form-container"></div>
            <div class="reseñas-list">
                ${reseñas.length > 0 ? reseñas.map(r => `
                    <div class="reseña-item">
                        <div class="reseña-header">
                            <span class="reseña-usuario"><i data-lucide="user" width="14" height="14"></i> ${r.nombre_usuario}</span>
                            <span class="reseña-calificacion">${'<i data-lucide="star" style="color:#f59e42"></i>'.repeat(r.calificacion)}${'<i data-lucide="star" style="color:#e5e7eb"></i>'.repeat(5 - r.calificacion)}</span>
                            <span class="reseña-fecha">${new Date(r.fecha_reseña).toLocaleDateString()}</span>
                        </div>
                        <div class="reseña-comentario">${r.comentario || ''}</div>
                    </div>
                `).join('') : '<div class="empty-state">Sin reseñas aún</div>'}
            </div>
        </div>
        <div class="modal-producto-footer">
            <button class="btn btn-primary" id="btnAgregarModalCarrito">
                <i data-lucide="shopping-cart" width="18" height="18"></i> Agregar al carrito
            </button>
        </div>
    `;
    lucide.createIcons();
    // Botón agregar al carrito en el modal
    const btnAgregar = body.querySelector('#btnAgregarModalCarrito');
    if (btnAgregar) {
        btnAgregar.onclick = () => {
            agregarAlCarrito(idProducto);
            document.getElementById('modalProductoTienda').classList.remove('show');
        };
    }
    // Carrusel de imágenes en el modal
    if (producto.imagenes && producto.imagenes.length > 1) {
        let actual = 0;
        const img = document.getElementById('modalProductoImg');
        const btnPrev = body.querySelector('.carrusel-flecha-izq');
        const btnNext = body.querySelector('.carrusel-flecha-der');
        btnPrev.addEventListener('click', () => {
            actual = (actual - 1 + producto.imagenes.length) % producto.imagenes.length;
            img.src = producto.imagenes[actual];
        });
        btnNext.addEventListener('click', () => {
            actual = (actual + 1) % producto.imagenes.length;
            img.src = producto.imagenes[actual];
        });
    }
    // Formulario de reseña si está autenticado
    const usuario = userManager.obtenerUsuario();
    const formContainer = body.querySelector('.reseña-form-container');
    if (usuario && formContainer) {
        formContainer.innerHTML = `
            <form class="reseña-form" onsubmit="return false;">
                <textarea id="comentario-modal" class="form-control" rows="2" maxlength="300" placeholder="Escribe tu reseña..."></textarea>
                <div class="reseña-form-bottom">
                    <div class="reseña-estrellas" id="reseñaEstrellas">
                        ${[1,2,3,4,5].map(i => `<i data-lucide="star" width="28" height="28" class="estrella-form" data-value="${i}" style="cursor:pointer;color:#e5e7eb;"></i>`).join('')}
                    </div>
                    <button type="submit" class="btn btn-success" id="btnEnviarResenaModal">
                        <i data-lucide="star" width="16" height="16"></i> Enviar reseña
                    </button>
                </div>
            </form>
        `;
        lucide.createIcons();
        // Interactividad de estrellas
        let calificacion = 0;
        const estrellas = formContainer.querySelectorAll('.estrella-form');
        estrellas.forEach((estrella, idx) => {
            estrella.addEventListener('click', () => {
                calificacion = idx + 1;
                estrellas.forEach((e, i) => {
                    e.style.color = i < calificacion ? '#f59e42' : '#e5e7eb';
                });
            });
        });
        document.getElementById('btnEnviarResenaModal').onclick = async (e) => {
            e.preventDefault();
            const comentario = document.getElementById('comentario-modal').value;
            if (!calificacion) return error('Selecciona una calificación');
            try {
                const resp = await api.post(`/productos/${idProducto}/resenas`, { calificacion, comentario });
                if (resp.success) {
                    success('¡Reseña enviada!');
                    abrirModalProductoTienda(idProducto);
                } else {
                    error(resp.error || 'No se pudo enviar la reseña');
                }
            } catch (err) {
                error('Error al enviar la reseña');
            }
        };
    } else if (formContainer) {
        formContainer.innerHTML = '<div class="empty-state">Inicia sesión para dejar una reseña</div>';
    }
    // Mostrar modal
    document.getElementById('modalProductoTienda').classList.add('show');
    // Evento cerrar
    document.getElementById('cerrarModalProductoTienda').onclick = () => {
        document.getElementById('modalProductoTienda').classList.remove('show');
    };
}

/**
 * Cargar reseñas y mostrar formulario para un producto
 */
async function cargarResenasProducto(idProducto) {
    const reseñasDiv = document.getElementById(`reseñas-${idProducto}`);
    if (!reseñasDiv) return;
    // Obtener reseñas
    let reseñas = [];
    try {
        const resp = await api.get(`/productos/${idProducto}/resenas`);
        if (resp.success && Array.isArray(resp.data)) {
            reseñas = resp.data;
        }
    } catch (err) {
        reseñasDiv.querySelector('.reseñas-list').innerHTML = '<div class="error-state">No se pudieron cargar las reseñas</div>';
        return;
    }
    // Mostrar reseñas
    reseñasDiv.querySelector('.reseñas-list').innerHTML = reseñas.length > 0 ? reseñas.map(r => `
        <div class="reseña-item">
            <div class="reseña-header">
                <span class="reseña-usuario"><i data-lucide="user" width="14" height="14"></i> ${r.nombre_usuario}</span>
                <span class="reseña-calificacion">${'★'.repeat(r.calificacion)}${'☆'.repeat(5 - r.calificacion)}</span>
                <span class="reseña-fecha">${new Date(r.fecha_reseña).toLocaleDateString()}</span>
            </div>
            <div class="reseña-comentario">${r.comentario || ''}</div>
        </div>
    `).join('') : '<div class="empty-state">Sin reseñas aún</div>';
    lucide.createIcons();
    // Mostrar formulario si está autenticado
    const usuario = userManager.obtenerUsuario();
    if (usuario) {
        reseñasDiv.querySelector('.reseña-form-container').innerHTML = `
            <form class="reseña-form" onsubmit="return false;">
                <label for="calificacion-${idProducto}">Calificación:</label>
                <select id="calificacion-${idProducto}" class="form-control" required>
                    <option value="">Selecciona</option>
                    <option value="1">1</option>
                    <option value="2">2</option>
                    <option value="3">3</option>
                    <option value="4">4</option>
                    <option value="5">5</option>
                </select>
                <label for="comentario-${idProducto}">Comentario:</label>
                <textarea id="comentario-${idProducto}" class="form-control" rows="2" maxlength="300" placeholder="Escribe tu reseña..."></textarea>
                <button type="submit" class="btn btn-success" id="btnEnviarResena-${idProducto}">
                    <i data-lucide="star" width="16" height="16"></i> Enviar reseña
                </button>
            </form>
        `;
        lucide.createIcons();
        // Evento submit
        document.getElementById(`btnEnviarResena-${idProducto}`).onclick = async (e) => {
            e.preventDefault();
            const calificacion = parseInt(document.getElementById(`calificacion-${idProducto}`).value);
            const comentario = document.getElementById(`comentario-${idProducto}`).value;
            if (!calificacion) return error('Selecciona una calificación');
            try {
                const resp = await api.post(`/productos/${idProducto}/resenas`, { calificacion, comentario });
                if (resp.success) {
                    success('¡Reseña enviada!');
                    cargarResenasProducto(idProducto);
                } else {
                    error(resp.error || 'No se pudo enviar la reseña');
                }
            } catch (err) {
                error('Error al enviar la reseña');
            }
        };
    } else {
        reseñasDiv.querySelector('.reseña-form-container').innerHTML = '<div class="empty-state">Inicia sesión para dejar una reseña</div>';
    }
}

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
        
        // Verificar autenticación
        if (!userManager.obtenerUsuario()) {
            await error('Debes iniciar sesión para proceder con la compra');
            location.hash = '#Login';
            return;
        }
        
        // Cerrar modal del carrito
        cerrarModalCarrito();
        
        // Navegar a la página de compras
        location.hash = '#Compras';
        
    } catch (err) {
        console.error('Error procesando compra:', err);
        await error('Error al proceder con la compra');
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
