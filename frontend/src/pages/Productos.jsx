import { useState, useEffect } from 'react';
import { 
  getProductos, 
  createProducto, 
  updateProducto, 
  deleteProducto, 
  getCategorias, 
  getTiposPrecios 
} from '../services/api';
import { FaPlus, FaEdit, FaTrash, FaSearch, FaTags } from 'react-icons/fa';

const Productos = () => {
  const [productos, setProductos] = useState([]);
  const [categorias, setCategorias] = useState([]);
  const [tiposPrecios, setTiposPrecios] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [showPreciosModal, setShowPreciosModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [editingProduct, setEditingProduct] = useState(null);
  const [loading, setLoading] = useState(true);

  // Estado del formulario
  const [formData, setFormData] = useState({
    codigo_sku: '',
    codigo_barras: '',
    nombre: '',
    descripcion: '',
    id_categoria: '',
    unidad_medida: 'pza',
    stock_actual: 0,
    precios: []
  });

  // Cargar datos
  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [prodRes, catRes, tpRes] = await Promise.all([
        getProductos(),
        getCategorias(),
        getTiposPrecios()
      ]);
      setProductos(prodRes.data);
      setCategorias(catRes.data);
      setTiposPrecios(tpRes.data);
    } catch (error) {
      console.error('Error al cargar datos:', error);
      alert('Error al cargar los datos');
    } finally {
      setLoading(false);
    }
  };

  // Manejar cambios en el formulario
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  // Manejar precios
  const handlePrecioChange = (index, field, value) => {
    const newPrecios = [...formData.precios];
    newPrecios[index] = { ...newPrecios[index], [field]: value };
    setFormData(prev => ({ ...prev, precios: newPrecios }));
  };

  const addPrecio = () => {
    setFormData(prev => ({
      ...prev,
      precios: [...prev.precios, { id_tipo_precio: '', precio: '', cantidad_minima: 1, cantidad_maxima: '' }]
    }));
  };

  const removePrecio = (index) => {
    setFormData(prev => ({
      ...prev,
      precios: prev.precios.filter((_, i) => i !== index)
    }));
  };

  // Abrir modal para nuevo producto
  const handleNew = () => {
    setEditingProduct(null);
    setFormData({
      codigo_sku: '',
      codigo_barras: '',
      nombre: '',
      descripcion: '',
      id_categoria: '',
      unidad_medida: 'pza',
      stock_actual: 0,
      precios: []
    });
    setShowModal(true);
  };

  // Abrir modal para editar
  const handleEdit = (producto) => {
    setEditingProduct(producto);
    setFormData({
      codigo_sku: producto.codigo_sku,
      codigo_barras: producto.codigo_barras || '',
      nombre: producto.nombre,
      descripcion: producto.descripcion || '',
      id_categoria: producto.id_categoria || '',
      unidad_medida: producto.unidad_medida,
      stock_actual: producto.stock_actual,
      activo: producto.activo,
      precios: producto.precios || []
    });
    setShowModal(true);
  };

  // Guardar producto
  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingProduct) {
        await updateProducto(editingProduct.id_producto, formData);
        alert('✅ Producto actualizado');
      } else {
        await createProducto(formData);
        alert('✅ Producto creado');
      }
      setShowModal(false);
      fetchData();
    } catch (error) {
      console.error('Error al guardar:', error);
      alert(error.response?.data?.message || 'Error al guardar el producto');
    }
  };

  // Eliminar producto
  const handleDelete = async (id) => {
    if (window.confirm('¿Estás seguro de eliminar este producto?')) {
      try {
        await deleteProducto(id);
        alert('✅ Producto eliminado');
        fetchData();
      } catch (error) {
        console.error('Error al eliminar:', error);
        alert('Error al eliminar el producto');
      }
    }
  };

  // Filtrar productos
  const filteredProductos = productos.filter(p =>
    p.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.codigo_sku.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // =================== ESTILOS ===================
  const styles = {
    container: {
      padding: '20px',
      maxWidth: '1200px',
      margin: '0 auto',
      fontFamily: 'Segoe UI, sans-serif'
    },
    header: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: '20px'
    },
    title: {
      fontSize: '24px',
      fontWeight: 'bold',
      color: '#1a1a2e'
    },
    searchBar: {
      display: 'flex',
      alignItems: 'center',
      gap: '10px',
      backgroundColor: '#f5f5f5',
      padding: '8px 16px',
      borderRadius: '8px',
      flex: 1,
      maxWidth: '400px',
      marginRight: '16px'
    },
    searchInput: {
      border: 'none',
      outline: 'none',
      backgroundColor: 'transparent',
      width: '100%',
      fontSize: '14px'
    },
    btnPrimary: {
      backgroundColor: '#e94560',
      color: '#fff',
      border: 'none',
      padding: '10px 20px',
      borderRadius: '8px',
      cursor: 'pointer',
      display: 'flex',
      alignItems: 'center',
      gap: '8px',
      fontSize: '14px',
      fontWeight: '600'
    },
    table: {
      width: '100%',
      borderCollapse: 'collapse',
      backgroundColor: '#fff',
      borderRadius: '10px',
      overflow: 'hidden',
      boxShadow: '0 2px 10px rgba(0,0,0,0.1)'
    },
    th: {
      backgroundColor: '#1a1a2e',
      color: '#fff',
      padding: '12px 16px',
      textAlign: 'left',
      fontSize: '13px',
      fontWeight: '600'
    },
    td: {
      padding: '12px 16px',
      borderBottom: '1px solid #eee',
      fontSize: '14px',
      color: '#333'
    },
    badge: {
      padding: '4px 10px',
      borderRadius: '12px',
      fontSize: '12px',
      fontWeight: '600'
    },
    badgeActive: {
      backgroundColor: '#d4edda',
      color: '#155724'
    },
    badgeInactive: {
      backgroundColor: '#f8d7da',
      color: '#721c24'
    },
    actionBtn: {
      border: 'none',
      padding: '6px 10px',
      borderRadius: '6px',
      cursor: 'pointer',
      marginRight: '6px',
      fontSize: '13px'
    },
    // Modal
    overlay: {
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0,0,0,0.5)',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      zIndex: 1000
    },
    modal: {
      backgroundColor: '#fff',
      borderRadius: '12px',
      padding: '30px',
      width: '90%',
      maxWidth: '700px',
      maxHeight: '90vh',
      overflowY: 'auto',
      boxShadow: '0 10px 30px rgba(0,0,0,0.3)'
    },
    formGroup: {
      marginBottom: '16px'
    },
    label: {
      display: 'block',
      marginBottom: '6px',
      fontWeight: '600',
      fontSize: '13px',
      color: '#333'
    },
    input: {
      width: '100%',
      padding: '10px 12px',
      border: '1px solid #ddd',
      borderRadius: '8px',
      fontSize: '14px',
      boxSizing: 'border-box'
    },
    select: {
      width: '100%',
      padding: '10px 12px',
      border: '1px solid #ddd',
      borderRadius: '8px',
      fontSize: '14px',
      boxSizing: 'border-box',
      backgroundColor: '#fff'
    },
    formRow: {
      display: 'grid',
      gridTemplateColumns: '1fr 1fr',
      gap: '16px'
    },
    precioRow: {
      display: 'grid',
      gridTemplateColumns: '2fr 1fr 1fr 1fr auto',
      gap: '8px',
      alignItems: 'end',
      marginBottom: '8px'
    }
  };

  if (loading) {
    return (
      <div style={{ ...styles.container, textAlign: 'center', marginTop: '100px' }}>
        <h2>Cargando productos...</h2>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      {/* HEADER */}
      <div style={styles.header}>
        <h1 style={styles.title}>📦 Catálogo de Productos</h1>
        <div style={{ display: 'flex', alignItems: 'center' }}>
          <div style={styles.searchBar}>
            <FaSearch color="#999" />
            <input
              style={styles.searchInput}
              placeholder="Buscar por nombre o SKU..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <button style={styles.btnPrimary} onClick={handleNew}>
            <FaPlus /> Nuevo Producto
          </button>
        </div>
      </div>

      {/* TABLA */}
      <table style={styles.table}>
        <thead>
          <tr>
            <th style={styles.th}>SKU</th>
            <th style={styles.th}>Nombre</th>
            <th style={styles.th}>Categoría</th>
            <th style={styles.th}>Unidad</th>
            <th style={styles.th}>Stock</th>
            <th style={styles.th}>Estado</th>
            <th style={styles.th}>Acciones</th>
          </tr>
        </thead>
        <tbody>
          {filteredProductos.length === 0 ? (
            <tr>
              <td style={styles.td} colSpan="7">
                No se encontraron productos
              </td>
            </tr>
          ) : (
            filteredProductos.map((producto) => (
              <tr key={producto.id_producto} style={{ transition: 'background 0.2s' }}>
                <td style={{ ...styles.td, fontWeight: '600', color: '#e94560' }}>
                  {producto.codigo_sku}
                </td>
                <td style={styles.td}>{producto.nombre}</td>
                <td style={styles.td}>{producto.categoria || 'Sin categoría'}</td>
                <td style={styles.td}>{producto.unidad_medida}</td>
                <td style={styles.td}>{producto.stock_actual}</td>
                <td style={styles.td}>
                  <span style={{
                    ...styles.badge,
                    ...(producto.activo ? styles.badgeActive : styles.badgeInactive)
                  }}>
                    {producto.activo ? 'Activo' : 'Inactivo'}
                  </span>
                </td>
                <td style={styles.td}>
                  <button
                    style={{ ...styles.actionBtn, backgroundColor: '#fff3cd', color: '#856404' }}
                    onClick={() => handleEdit(producto)}
                    title="Editar"
                  >
                    <FaEdit />
                  </button>
                  <button
                    style={{ ...styles.actionBtn, backgroundColor: '#f8d7da', color: '#721c24' }}
                    onClick={() => handleDelete(producto.id_producto)}
                    title="Eliminar"
                  >
                    <FaTrash />
                  </button>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>

      {/* MODAL */}
      {showModal && (
        <div style={styles.overlay} onClick={() => setShowModal(false)}>
          <div style={styles.modal} onClick={(e) => e.stopPropagation()}>
            <h2 style={{ marginBottom: '20px', color: '#1a1a2e' }}>
              {editingProduct ? '✏️ Editar Producto' : '➕ Nuevo Producto'}
            </h2>
            <form onSubmit={handleSubmit}>
              {/* Fila 1 */}
              <div style={styles.formRow}>
                <div style={styles.formGroup}>
                  <label style={styles.label}>Código SKU *</label>
                  <input
                    style={styles.input}
                    name="codigo_sku"
                    value={formData.codigo_sku}
                    onChange={handleChange}
                    required
                    placeholder="Ej: PROD-001"
                  />
                </div>
                <div style={styles.formGroup}>
                  <label style={styles.label}>Código de Barras</label>
                  <input
                    style={styles.input}
                    name="codigo_barras"
                    value={formData.codigo_barras}
                    onChange={handleChange}
                    placeholder="Ej: 7501234567890"
                  />
                </div>
              </div>

              {/* Nombre */}
              <div style={styles.formGroup}>
                <label style={styles.label}>Nombre del Producto *</label>
                <input
                  style={styles.input}
                  name="nombre"
                  value={formData.nombre}
                  onChange={handleChange}
                  required
                  placeholder="Nombre del producto"
                />
              </div>

              {/* Descripción */}
              <div style={styles.formGroup}>
                <label style={styles.label}>Descripción</label>
                <textarea
                  style={{ ...styles.input, minHeight: '60px', resize: 'vertical' }}
                  name="descripcion"
                  value={formData.descripcion}
                  onChange={handleChange}
                  placeholder="Descripción del producto"
                />
              </div>

              {/* Fila 3 */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '16px' }}>
                <div style={styles.formGroup}>
                  <label style={styles.label}>Categoría</label>
                  <select
                    style={styles.select}
                    name="id_categoria"
                    value={formData.id_categoria}
                    onChange={handleChange}
                  >
                    <option value="">Seleccionar...</option>
                    {categorias.map(cat => (
                      <option key={cat.id_categoria} value={cat.id_categoria}>
                        {cat.nombre}
                      </option>
                    ))}
                  </select>
                </div>
                <div style={styles.formGroup}>
                  <label style={styles.label}>Unidad de Medida *</label>
                  <select
                    style={styles.select}
                    name="unidad_medida"
                    value={formData.unidad_medida}
                    onChange={handleChange}
                    required
                  >
                    <option value="pza">Pieza</option>
                    <option value="kg">Kilogramo</option>
                    <option value="lt">Litro</option>
                    <option value="mt">Metro</option>
                    <option value="caja">Caja</option>
                    <option value="paquete">Paquete</option>
                  </select>
                </div>
                <div style={styles.formGroup}>
                  <label style={styles.label}>Stock Actual</label>
                  <input
                    style={styles.input}
                    type="number"
                    name="stock_actual"
                    value={formData.stock_actual}
                    onChange={handleChange}
                    min="0"
                    step="0.01"
                  />
                </div>
              </div>

              {/* PRECIOS */}
              <div style={{ 
                marginTop: '16px', 
                padding: '16px', 
                backgroundColor: '#f8f9fa', 
                borderRadius: '8px' 
              }}>
                <div style={{ 
                  display: 'flex', 
                  justifyContent: 'space-between', 
                  alignItems: 'center',
                  marginBottom: '12px'
                }}>
                  <label style={{ ...styles.label, margin: 0 }}>
                    <FaTags /> Precios del Producto
                  </label>
                  <button
                    type="button"
                    onClick={addPrecio}
                    style={{
                      ...styles.btnPrimary,
                      padding: '6px 12px',
                      fontSize: '12px',
                      backgroundColor: '#16213e'
                    }}
                  >
                    <FaPlus /> Agregar Precio
                  </button>
                </div>

                {formData.precios.map((precio, index) => (
                  <div key={index} style={styles.precioRow}>
                    <div>
                      <label style={{ fontSize: '11px', color: '#666' }}>Tipo de Precio</label>
                      <select
                        style={styles.select}
                        value={precio.id_tipo_precio}
                        onChange={(e) => handlePrecioChange(index, 'id_tipo_precio', e.target.value)}
                        required
                      >
                        <option value="">Seleccionar...</option>
                        {tiposPrecios.map(tp => (
                          <option key={tp.id_tipo_precio} value={tp.id_tipo_precio}>
                            {tp.nombre}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label style={{ fontSize: '11px', color: '#666' }}>Precio $</label>
                      <input
                        style={styles.input}
                        type="number"
                        value={precio.precio}
                        onChange={(e) => handlePrecioChange(index, 'precio', e.target.value)}
                        min="0"
                        step="0.01"
                        required
                      />
                    </div>
                    <div>
                      <label style={{ fontSize: '11px', color: '#666' }}>Cant. Mín.</label>
                      <input
                        style={styles.input}
                        type="number"
                        value={precio.cantidad_minima}
                        onChange={(e) => handlePrecioChange(index, 'cantidad_minima', e.target.value)}
                        min="1"
                      />
                    </div>
                    <div>
                      <label style={{ fontSize: '11px', color: '#666' }}>Cant. Máx.</label>
                      <input
                        style={styles.input}
                        type="number"
                        value={precio.cantidad_maxima}
                        onChange={(e) => handlePrecioChange(index, 'cantidad_maxima', e.target.value)}
                      />
                    </div>
                    <button
                      type="button"
                      onClick={() => removePrecio(index)}
                      style={{
                        ...styles.actionBtn,
                        backgroundColor: '#f8d7da',
                        color: '#721c24',
                        alignSelf: 'end',
                        marginBottom: '2px'
                      }}
                    >
                      <FaTrash />
                    </button>
                  </div>
                ))}

                {formData.precios.length === 0 && (
                  <p style={{ color: '#999', fontSize: '13px', textAlign: 'center' }}>
                    No se han agregado precios aún
                  </p>
                )}
              </div>

              {/* BOTONES */}
              <div style={{ 
                display: 'flex', 
                justifyContent: 'flex-end', 
                gap: '12px', 
                marginTop: '20px' 
              }}>
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  style={{
                    padding: '10px 20px',
                    borderRadius: '8px',
                    border: '1px solid #ddd',
                    backgroundColor: '#fff',
                    cursor: 'pointer',
                    fontSize: '14px'
                  }}
                >
                  Cancelar
                </button>
                <button type="submit" style={styles.btnPrimary}>
                  {editingProduct ? 'Actualizar' : 'Guardar'} Producto
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Productos;