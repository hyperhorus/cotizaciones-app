import axios from 'axios';

const API_URL = 'http://localhost:4000/api';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json'
  }
});

// ====== PRODUCTOS ======
export const getProductos = () => api.get('/productos');
export const getProductoById = (id) => api.get(`/productos/${id}`);
export const createProducto = (data) => api.post('/productos', data);
export const updateProducto = (id, data) => api.put(`/productos/${id}`, data);
export const deleteProducto = (id) => api.delete(`/productos/${id}`);

// ====== AUXILIARES ======
export const getCategorias = () => api.get('/productos/categorias');
export const getTiposPrecios = () => api.get('/productos/tipos-precios');

// ====== CLIENTES ======
export const getClientes = () => api.get('/clientes');
export const getClienteById = (id) => api.get(`/clientes/${id}`);
export const createCliente = (data) => api.post('/clientes', data);
export const updateCliente = (id, data) => api.put(`/clientes/${id}`, data);
export const deleteCliente = (id) => api.delete(`/clientes/${id}`);
export const getClienteStats = (id) => api.get(`/clientes/${id}/stats`);

// ====== COTIZACIONES ======
export const getCotizaciones = () => api.get('/cotizaciones');
export const getCotizacionById = (id) => api.get(`/cotizaciones/${id}`);
export const createCotizacion = (data) => api.post('/cotizaciones', data);
export const updateEstatus = (id, data) => api.patch(`/cotizaciones/${id}/estatus`, data);
export const deleteCotizacion = (id) => api.delete(`/cotizaciones/${id}`);
export const getPreciosProducto = (idProd, idTipo) => api.get(`/cotizaciones/precios/${idProd}/${idTipo}`);
export const getEstatus = () => api.get('/cotizaciones/estatus');
export const getVendedores = () => api.get('/cotizaciones/vendedores');

// ====== PDF ======
export const descargarPDF = (id) => api.get(`/pdf/cotizacion/${id}`, { responseType: 'blob' });

// ====== EMAIL ======
export const enviarEmailCotizacion = (id, data) => api.post(`/email/cotizacion/${id}`, data);

// ====== DASHBOARD ======
export const getDashboardStats = () => api.get('/dashboard/stats');

export default api;