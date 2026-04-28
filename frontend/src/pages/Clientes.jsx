import { useState, useEffect } from 'react';
import {
  getClientes,
  createCliente,
  updateCliente,
  deleteCliente,
  getClienteById,
  getTiposPrecios
} from '../services/api';
import {
  FaPlus,
  FaEdit,
  FaTrash,
  FaSearch,
  FaUser,
  FaBuilding,
  FaEye,
  FaPhone,
  FaEnvelope,
  FaMapMarkerAlt,
  FaTimes
} from 'react-icons/fa';

const Clientes = () => {
  const [clientes, setClientes] = useState([]);
  const [tiposPrecios, setTiposPrecios] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterTipo, setFilterTipo] = useState('');
  const [editingCliente, setEditingCliente] = useState(null);
  const [selectedCliente, setSelectedCliente] = useState(null);
  const [loading, setLoading] = useState(true);

  const [formData, setFormData] = useState({
    tipo_cliente: 'PERSONA_FISICA',
    nombre: '',
    razon_social: '',
    rfc: '',
    email: '',
    telefono: '',
    direccion: '',
    ciudad: '',
    estado: '',
    codigo_postal: '',
    id_tipo_precio_asignado: ''
  });

  // Estados de México
  const estadosMexico = [
    'Aguascalientes', 'Baja California', 'Baja California Sur', 'Campeche',
    'Chiapas', 'Chihuahua', 'Ciudad de México', 'Coahuila', 'Colima',
    'Durango', 'Estado de México', 'Guanajuato', 'Guerrero', 'Hidalgo',
    'Jalisco', 'Michoacán', 'Morelos', 'Nayarit', 'Nuevo León', 'Oaxaca',
    'Puebla', 'Querétaro', 'Quintana Roo', 'San Luis Potosí', 'Sinaloa',
    'Sonora', 'Tabasco', 'Tamaulipas', 'Tlaxcala', 'Veracruz',
    'Yucatán', 'Zacatecas'
  ];

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [clientesRes, tpRes] = await Promise.all([
        getClientes(),
        getTiposPrecios()
      ]);
      setClientes(clientesRes.data);
      setTiposPrecios(tpRes.data);
    } catch (error) {
      console.error('Error al cargar datos:', error);
      alert('Error al cargar los datos');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const resetForm = () => {
    setFormData({
      tipo_cliente: 'PERSONA_FISICA',
      nombre: '',
      razon_social: '',
      rfc: '',
      email: '',
      telefono: '',
      direccion: '',
      ciudad: '',
      estado: '',
      codigo_postal: '',
      id_tipo_precio_asignado: ''
    });
  };

  const handleNew = () => {
    setEditingCliente(null);
    resetForm();
    setShowModal(true);
  };

  const handleEdit = (cliente) => {
    setEditingCliente(cliente);
    setFormData({
      tipo_cliente: cliente.tipo_cliente,
      nombre: cliente.nombre,
      razon_social: cliente.razon_social || '',
      rfc: cliente.rfc || '',
      email: cliente.email || '',
      telefono: cliente.telefono || '',
      direccion: cliente.direccion || '',
      ciudad: cliente.ciudad || '',
      estado: cliente.estado || '',
      codigo_postal: cliente.codigo_postal || '',
      id_tipo_precio_asignado: cliente.id_tipo_precio_asignado || '',
      activo: cliente.activo
    });
    setShowModal(true);
  };

  const handleViewDetail = async (cliente) => {
    try {
      const res = await getClienteById(cliente.id_cliente);
      setSelectedCliente(res.data);
      setShowDetailModal(true);
    } catch (error) {
      console.error('Error al obtener detalle:', error);
      alert('Error al obtener detalle del cliente');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingCliente) {
        await updateCliente(editingCliente.id_cliente, formData);
        alert('✅ Cliente actualizado');
      } else {
        await createCliente(formData);
        alert('✅ Cliente creado');
      }
      setShowModal(false);
      fetchData();
    } catch (error) {
      console.error('Error al guardar:', error);
      alert(error.response?.data?.message || 'Error al guardar el cliente');
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('¿Estás seguro de eliminar este cliente?')) {
      try {
        await deleteCliente(id);
        alert('✅ Cliente eliminado');
        fetchData();
      } catch (error) {
        console.error('Error al eliminar:', error);
        alert('Error al eliminar el cliente');
      }
    }
  };

  // Filtrar clientes
  const filteredClientes = clientes.filter(c => {
    const matchSearch =
      c.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (c.rfc && c.rfc.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (c.email && c.email.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchTipo = filterTipo === '' || c.tipo_cliente === filterTipo;

    return matchSearch && matchTipo;
  });

  // Contadores
  const totalActivos = clientes.filter(c => c.activo).length;
  const totalFisicas = clientes.filter(c => c.tipo_cliente === 'PERSONA_FISICA').length;
  const totalMorales = clientes.filter(c => c.tipo_cliente === 'PERSONA_MORAL').length;

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
      marginBottom: '20px',
      flexWrap: 'wrap',
      gap: '12px'
    },
    title: {
      fontSize: '24px',
      fontWeight: 'bold',
      color: '#1a1a2e'
    },
    // Tarjetas de resumen
    statsRow: {
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
      gap: '16px',
      marginBottom: '20px'
    },
    statCard: {
      backgroundColor: '#fff',
      borderRadius: '10px',
      padding: '16px 20px',
      boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
      display: 'flex',
      alignItems: 'center',
      gap: '16px'
    },
    statIcon: {
      width: '48px',
      height: '48px',
      borderRadius: '12px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontSize: '20px'
    },
    statNumber: {
      fontSize: '24px',
      fontWeight: '700',
      color: '#1a1a2e'
    },
    statLabel: {
      fontSize: '12px',
      color: '#888',
      marginTop: '2px'
    },
    // Filtros
    filtersRow: {
      display: 'flex',
      alignItems: 'center',
      gap: '12px',
      marginBottom: '20px',
      flexWrap: 'wrap'
    },
    searchBar: {
      display: 'flex',
      alignItems: 'center',
      gap: '10px',
      backgroundColor: '#fff',
      padding: '8px 16px',
      borderRadius: '8px',
      flex: 1,
      maxWidth: '400px',
      boxShadow: '0 1px 4px rgba(0,0,0,0.08)'
    },
    searchInput: {
      border: 'none',
      outline: 'none',
      backgroundColor: 'transparent',
      width: '100%',
      fontSize: '14px'
    },
    filterSelect: {
      padding: '10px 14px',
      borderRadius: '8px',
      border: '1px solid #ddd',
      fontSize: '14px',
      backgroundColor: '#fff'
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
    // Tarjetas de clientes
    cardsGrid: {
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))',
      gap: '16px'
    },
    card: {
      backgroundColor: '#fff',
      borderRadius: '12px',
      padding: '20px',
      boxShadow: '0 2px 10px rgba(0,0,0,0.08)',
      transition: 'transform 0.2s, box-shadow 0.2s',
      cursor: 'default',
      position: 'relative',
      borderLeft: '4px solid #e94560'
    },
    cardHeader: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'flex-start',
      marginBottom: '12px'
    },
    cardName: {
      fontSize: '16px',
      fontWeight: '700',
      color: '#1a1a2e',
      marginBottom: '4px'
    },
    cardRfc: {
      fontSize: '12px',
      color: '#888',
      fontFamily: 'monospace'
    },
    cardInfo: {
      display: 'flex',
      flexDirection: 'column',
      gap: '6px',
      marginBottom: '12px'
    },
    cardInfoItem: {
      display: 'flex',
      alignItems: 'center',
      gap: '8px',
      fontSize: '13px',
      color: '#555'
    },
    cardFooter: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingTop: '12px',
      borderTop: '1px solid #f0f0f0'
    },
    badge: {
      padding: '4px 10px',
      borderRadius: '12px',
      fontSize: '11px',
      fontWeight: '600'
    },
    badgePersonaFisica: {
      backgroundColor: '#e3f2fd',
      color: '#1565c0'
    },
    badgePersonaMoral: {
      backgroundColor: '#f3e5f5',
      color: '#7b1fa2'
    },
    badgePrecio: {
      backgroundColor: '#fff3e0',
      color: '#e65100'
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
      fontSize: '13px',
      transition: 'opacity 0.2s'
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
      maxWidth: '750px',
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
    formRow3: {
      display: 'grid',
      gridTemplateColumns: '1fr 1fr 1fr',
      gap: '16px'
    },
    // Detail modal
    detailSection: {
      marginBottom: '20px'
    },
    detailTitle: {
      fontSize: '14px',
      fontWeight: '700',
      color: '#1a1a2e',
      marginBottom: '10px',
      paddingBottom: '6px',
      borderBottom: '2px solid #e94560'
    },
    detailGrid: {
      display: 'grid',
      gridTemplateColumns: '1fr 1fr',
      gap: '8px'
    },
    detailItem: {
      fontSize: '13px',
      color: '#555'
    },
    detailLabel: {
      fontWeight: '600',
      color: '#333',
      display: 'block'
    }
  };

  if (loading) {
    return (
      <div style={{ ...styles.container, textAlign: 'center', marginTop: '100px' }}>
        <h2>Cargando clientes...</h2>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      {/* HEADER */}
      <div style={styles.header}>
        <h1 style={styles.title}>👥 Gestión de Clientes</h1>
        <button style={styles.btnPrimary} onClick={handleNew}>
          <FaPlus /> Nuevo Cliente
        </button>
      </div>

      {/* TARJETAS DE RESUMEN */}
      <div style={styles.statsRow}>
        <div style={styles.statCard}>
          <div style={{ ...styles.statIcon, backgroundColor: '#e3f2fd', color: '#1565c0' }}>
            <FaUser />
          </div>
          <div>
            <div style={styles.statNumber}>{clientes.length}</div>
            <div style={styles.statLabel}>Total Clientes</div>
          </div>
        </div>
        <div style={styles.statCard}>
          <div style={{ ...styles.statIcon, backgroundColor: '#d4edda', color: '#155724' }}>
            <FaUser />
          </div>
          <div>
            <div style={styles.statNumber}>{totalActivos}</div>
            <div style={styles.statLabel}>Clientes Activos</div>
          </div>
        </div>
        <div style={styles.statCard}>
          <div style={{ ...styles.statIcon, backgroundColor: '#fff3e0', color: '#e65100' }}>
            <FaUser />
          </div>
          <div>
            <div style={styles.statNumber}>{totalFisicas}</div>
            <div style={styles.statLabel}>Personas Físicas</div>
          </div>
        </div>
        <div style={styles.statCard}>
          <div style={{ ...styles.statIcon, backgroundColor: '#f3e5f5', color: '#7b1fa2' }}>
            <FaBuilding />
          </div>
          <div>
            <div style={styles.statNumber}>{totalMorales}</div>
            <div style={styles.statLabel}>Personas Morales</div>
          </div>
        </div>
      </div>

      {/* FILTROS */}
      <div style={styles.filtersRow}>
        <div style={styles.searchBar}>
          <FaSearch color="#999" />
          <input
            style={styles.searchInput}
            placeholder="Buscar por nombre, RFC o email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <select
          style={styles.filterSelect}
          value={filterTipo}
          onChange={(e) => setFilterTipo(e.target.value)}
        >
          <option value="">Todos los tipos</option>
          <option value="PERSONA_FISICA">Persona Física</option>
          <option value="PERSONA_MORAL">Persona Moral</option>
        </select>
      </div>

      {/* TARJETAS DE CLIENTES */}
      {filteredClientes.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '40px', color: '#999' }}>
          <h3>No se encontraron clientes</h3>
        </div>
      ) : (
        <div style={styles.cardsGrid}>
          {filteredClientes.map((cliente) => (
            <div
              key={cliente.id_cliente}
              style={{
                ...styles.card,
                borderLeftColor: cliente.tipo_cliente === 'PERSONA_FISICA' ? '#1565c0' : '#7b1fa2',
                opacity: cliente.activo ? 1 : 0.6
              }}
            >
              {/* Card Header */}
              <div style={styles.cardHeader}>
                <div>
                  <div style={styles.cardName}>{cliente.nombre}</div>
                  {cliente.rfc && <div style={styles.cardRfc}>RFC: {cliente.rfc}</div>}
                </div>
                <span style={{
                  ...styles.badge,
                  ...(cliente.tipo_cliente === 'PERSONA_FISICA'
                    ? styles.badgePersonaFisica
                    : styles.badgePersonaMoral)
                }}>
                  {cliente.tipo_cliente === 'PERSONA_FISICA' ? '👤 Física' : '🏢 Moral'}
                </span>
              </div>

              {/* Card Info */}
              <div style={styles.cardInfo}>
                {cliente.email && (
                  <div style={styles.cardInfoItem}>
                    <FaEnvelope color="#e94560" size={12} />
                    {cliente.email}
                  </div>
                )}
                {cliente.telefono && (
                  <div style={styles.cardInfoItem}>
                    <FaPhone color="#e94560" size={12} />
                    {cliente.telefono}
                  </div>
                )}
                {(cliente.ciudad || cliente.estado) && (
                  <div style={styles.cardInfoItem}>
                    <FaMapMarkerAlt color="#e94560" size={12} />
                    {[cliente.ciudad, cliente.estado].filter(Boolean).join(', ')}
                  </div>
                )}
              </div>

              {/* Tipo de precio asignado */}
              {cliente.tipo_precio_nombre && (
                <div style={{ marginBottom: '12px' }}>
                  <span style={{ ...styles.badge, ...styles.badgePrecio }}>
                    💲 {cliente.tipo_precio_nombre}
                  </span>
                </div>
              )}

              {/* Card Footer */}
              <div style={styles.cardFooter}>
                <span style={{
                  ...styles.badge,
                  ...(cliente.activo ? styles.badgeActive : styles.badgeInactive)
                }}>
                  {cliente.activo ? '✅ Activo' : '❌ Inactivo'}
                </span>
                <div style={{ display: 'flex', gap: '6px' }}>
                  <button
                    style={{ ...styles.actionBtn, backgroundColor: '#e3f2fd', color: '#1565c0' }}
                    onClick={() => handleViewDetail(cliente)}
                    title="Ver detalle"
                  >
                    <FaEye />
                  </button>
                  <button
                    style={{ ...styles.actionBtn, backgroundColor: '#fff3cd', color: '#856404' }}
                    onClick={() => handleEdit(cliente)}
                    title="Editar"
                  >
                    <FaEdit />
                  </button>
                  <button
                    style={{ ...styles.actionBtn, backgroundColor: '#f8d7da', color: '#721c24' }}
                    onClick={() => handleDelete(cliente.id_cliente)}
                    title="Eliminar"
                  >
                    <FaTrash />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* =================== MODAL FORMULARIO =================== */}
      {showModal && (
        <div style={styles.overlay} onClick={() => setShowModal(false)}>
          <div style={styles.modal} onClick={(e) => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h2 style={{ color: '#1a1a2e', margin: 0 }}>
                {editingCliente ? '✏️ Editar Cliente' : '➕ Nuevo Cliente'}
              </h2>
              <button
                onClick={() => setShowModal(false)}
                style={{ background: 'none', border: 'none', fontSize: '20px', cursor: 'pointer', color: '#999' }}
              >
                <FaTimes />
              </button>
            </div>

            <form onSubmit={handleSubmit}>
              {/* Tipo de cliente */}
              <div style={styles.formGroup}>
                <label style={styles.label}>Tipo de Cliente *</label>
                <div style={{ display: 'flex', gap: '16px' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                    <input
                      type="radio"
                      name="tipo_cliente"
                      value="PERSONA_FISICA"
                      checked={formData.tipo_cliente === 'PERSONA_FISICA'}
                      onChange={handleChange}
                    />
                    <FaUser color="#1565c0" /> Persona Física
                  </label>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                    <input
                      type="radio"
                      name="tipo_cliente"
                      value="PERSONA_MORAL"
                      checked={formData.tipo_cliente === 'PERSONA_MORAL'}
                      onChange={handleChange}
                    />
                    <FaBuilding color="#7b1fa2" /> Persona Moral
                  </label>
                </div>
              </div>

              {/* Nombre y Razón Social */}
              <div style={styles.formRow}>
                <div style={styles.formGroup}>
                  <label style={styles.label}>Nombre *</label>
                  <input
                    style={styles.input}
                    name="nombre"
                    value={formData.nombre}
                    onChange={handleChange}
                    required
                    placeholder="Nombre completo o comercial"
                  />
                </div>
                <div style={styles.formGroup}>
                  <label style={styles.label}>
                    Razón Social {formData.tipo_cliente === 'PERSONA_MORAL' ? '*' : ''}
                  </label>
                  <input
                    style={styles.input}
                    name="razon_social"
                    value={formData.razon_social}
                    onChange={handleChange}
                    placeholder="Razón social"
                    required={formData.tipo_cliente === 'PERSONA_MORAL'}
                  />
                </div>
              </div>

              {/* RFC y Tipo Precio */}
              <div style={styles.formRow}>
                <div style={styles.formGroup}>
                  <label style={styles.label}>RFC</label>
                  <input
                    style={styles.input}
                    name="rfc"
                    value={formData.rfc}
                    onChange={handleChange}
                    placeholder="Ej: XAXX010101000"
                    maxLength={13}
                  />
                </div>
                <div style={styles.formGroup}>
                  <label style={styles.label}>Tipo de Precio Asignado</label>
                  <select
                    style={styles.select}
                    name="id_tipo_precio_asignado"
                    value={formData.id_tipo_precio_asignado}
                    onChange={handleChange}
                  >
                    <option value="">Sin asignar</option>
                    {tiposPrecios.map(tp => (
                      <option key={tp.id_tipo_precio} value={tp.id_tipo_precio}>
                        {tp.nombre}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Contacto */}
              <div style={{
                padding: '16px',
                backgroundColor: '#f8f9fa',
                borderRadius: '8px',
                marginBottom: '16px'
              }}>
                <label style={{ ...styles.label, marginBottom: '12px', fontSize: '14px' }}>
                  📞 Información de Contacto
                </label>
                <div style={styles.formRow}>
                  <div style={styles.formGroup}>
                    <label style={styles.label}>Email</label>
                    <input
                      style={styles.input}
                      name="email"
                      type="email"
                      value={formData.email}
                      onChange={handleChange}
                      placeholder="correo@ejemplo.com"
                    />
                  </div>
                  <div style={styles.formGroup}>
                    <label style={styles.label}>Teléfono</label>
                    <input
                      style={styles.input}
                      name="telefono"
                      value={formData.telefono}
                      onChange={handleChange}
                      placeholder="Ej: 55 1234 5678"
                    />
                  </div>
                </div>
              </div>

              {/* Dirección */}
              <div style={{
                padding: '16px',
                backgroundColor: '#f8f9fa',
                borderRadius: '8px',
                marginBottom: '16px'
              }}>
                <label style={{ ...styles.label, marginBottom: '12px', fontSize: '14px' }}>
                  📍 Dirección
                </label>
                <div style={styles.formGroup}>
                  <label style={styles.label}>Dirección</label>
                  <input
                    style={styles.input}
                    name="direccion"
                    value={formData.direccion}
                    onChange={handleChange}
                    placeholder="Calle, número, colonia"
                  />
                </div>
                <div style={styles.formRow3}>
                  <div style={styles.formGroup}>
                    <label style={styles.label}>Ciudad</label>
                    <input
                      style={styles.input}
                      name="ciudad"
                      value={formData.ciudad}
                      onChange={handleChange}
                      placeholder="Ciudad"
                    />
                  </div>
                  <div style={styles.formGroup}>
                    <label style={styles.label}>Estado</label>
                    <select
                      style={styles.select}
                      name="estado"
                      value={formData.estado}
                      onChange={handleChange}
                    >
                      <option value="">Seleccionar...</option>
                      {estadosMexico.map(edo => (
                        <option key={edo} value={edo}>{edo}</option>
                      ))}
                    </select>
                  </div>
                  <div style={styles.formGroup}>
                    <label style={styles.label}>Código Postal</label>
                    <input
                      style={styles.input}
                      name="codigo_postal"
                      value={formData.codigo_postal}
                      onChange={handleChange}
                      placeholder="Ej: 06600"
                      maxLength={5}
                    />
                  </div>
                </div>
              </div>

              {/* BOTONES */}
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '20px' }}>
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
                  {editingCliente ? 'Actualizar' : 'Guardar'} Cliente
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* =================== MODAL DETALLE =================== */}
      {showDetailModal && selectedCliente && (
        <div style={styles.overlay} onClick={() => setShowDetailModal(false)}>
          <div style={{ ...styles.modal, maxWidth: '600px' }} onClick={(e) => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h2 style={{ color: '#1a1a2e', margin: 0 }}>👤 Detalle del Cliente</h2>
              <button
                onClick={() => setShowDetailModal(false)}
                style={{ background: 'none', border: 'none', fontSize: '20px', cursor: 'pointer', color: '#999' }}
              >
                <FaTimes />
              </button>
            </div>

            {/* Info General */}
            <div style={styles.detailSection}>
              <div style={styles.detailTitle}>Información General</div>
              <div style={styles.detailGrid}>
                <div style={styles.detailItem}>
                  <span style={styles.detailLabel}>Nombre</span>
                  {selectedCliente.nombre}
                </div>
                <div style={styles.detailItem}>
                  <span style={styles.detailLabel}>Tipo</span>
                  {selectedCliente.tipo_cliente === 'PERSONA_FISICA' ? 'Persona Física' : 'Persona Moral'}
                </div>
                {selectedCliente.razon_social && (
                  <div style={styles.detailItem}>
                    <span style={styles.detailLabel}>Razón Social</span>
                    {selectedCliente.razon_social}
                  </div>
                )}
                {selectedCliente.rfc && (
                  <div style={styles.detailItem}>
                    <span style={styles.detailLabel}>RFC</span>
                    {selectedCliente.rfc}
                  </div>
                )}
                <div style={styles.detailItem}>
                  <span style={styles.detailLabel}>Tipo de Precio</span>
                  {selectedCliente.tipo_precio_nombre || 'No asignado'}
                </div>
                <div style={styles.detailItem}>
                  <span style={styles.detailLabel}>Estado</span>
                  {selectedCliente.activo ? '✅ Activo' : '❌ Inactivo'}
                </div>
              </div>
            </div>

            {/* Contacto */}
            <div style={styles.detailSection}>
              <div style={styles.detailTitle}>Contacto</div>
              <div style={styles.detailGrid}>
                <div style={styles.detailItem}>
                  <span style={styles.detailLabel}>Email</span>
                  {selectedCliente.email || 'No registrado'}
                </div>
                <div style={styles.detailItem}>
                  <span style={styles.detailLabel}>Teléfono</span>
                  {selectedCliente.telefono || 'No registrado'}
                </div>
              </div>
            </div>

            {/* Dirección */}
            <div style={styles.detailSection}>
              <div style={styles.detailTitle}>Dirección</div>
              <div style={styles.detailItem}>
                {[
                  selectedCliente.direccion,
                  selectedCliente.ciudad,
                  selectedCliente.estado,
                  selectedCliente.codigo_postal ? `C.P. ${selectedCliente.codigo_postal}` : ''
                ].filter(Boolean).join(', ') || 'No registrada'}
              </div>
            </div>

            {/* Cotizaciones Recientes */}
            {selectedCliente.cotizaciones && selectedCliente.cotizaciones.length > 0 && (
              <div style={styles.detailSection}>
                <div style={styles.detailTitle}>Últimas Cotizaciones</div>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                  <thead>
                    <tr style={{ backgroundColor: '#f8f9fa' }}>
                      <th style={{ padding: '8px', textAlign: 'left' }}>Folio</th>
                      <th style={{ padding: '8px', textAlign: 'left' }}>Fecha</th>
                      <th style={{ padding: '8px', textAlign: 'right' }}>Total</th>
                      <th style={{ padding: '8px', textAlign: 'center' }}>Estatus</th>
                    </tr>
                  </thead>
                  <tbody>
                    {selectedCliente.cotizaciones.map(cot => (
                      <tr key={cot.id_cotizacion} style={{ borderBottom: '1px solid #eee' }}>
                        <td style={{ padding: '8px', fontWeight: '600', color: '#e94560' }}>{cot.folio}</td>
                        <td style={{ padding: '8px' }}>{new Date(cot.fecha_cotizacion).toLocaleDateString()}</td>
                        <td style={{ padding: '8px', textAlign: 'right' }}>
                          ${Number(cot.total).toLocaleString('es-MX', { minimumFractionDigits: 2 })} {cot.moneda}
                        </td>
                        <td style={{ padding: '8px', textAlign: 'center' }}>
                          <span style={{ ...styles.badge, backgroundColor: '#e3f2fd', color: '#1565c0' }}>
                            {cot.estatus}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* Botón cerrar */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '20px' }}>
              <button
                onClick={() => setShowDetailModal(false)}
                style={styles.btnPrimary}
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Clientes;