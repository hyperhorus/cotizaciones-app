import { useState, useEffect } from 'react';
import {
  getCotizaciones,
  getCotizacionById,
  createCotizacion,
  updateEstatus,
  deleteCotizacion,
  getClientes,
  getProductos,
  getTiposPrecios,
  getVendedores,
  getEstatus,
  getPreciosProducto,
  descargarPDF,              // ← NUEVO
  enviarEmailCotizacion      // ← NUEVO
} from '../services/api';
import {
  FaPlus, FaEye, FaTrash, FaSearch, FaFileInvoiceDollar,
  FaTimes, FaCheckCircle, FaTimesCircle, FaPaperPlane,
  FaHistory, FaShoppingCart, FaArrowRight,
  FaFilePdf, FaEnvelope, FaSpinner   // ← NUEVOS
} from 'react-icons/fa';

const Cotizaciones = () => {
  // =================== STATE ===================
  const [cotizaciones, setCotizaciones] = useState([]);
  const [clientes, setClientes] = useState([]);
  const [productos, setProductos] = useState([]);
  const [tiposPrecios, setTiposPrecios] = useState([]);
  const [vendedores, setVendedores] = useState([]);
  const [estatusList, setEstatusList] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filtros
  const [searchTerm, setSearchTerm] = useState('');
  const [filterEstatus, setFilterEstatus] = useState('');

  // Modales
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showEstatusModal, setShowEstatusModal] = useState(false);
  const [selectedCotizacion, setSelectedCotizacion] = useState(null);

  // Formulario nueva cotización
  const [formData, setFormData] = useState({
    id_cliente: '',
    id_vendedor: '',
    id_tipo_precio: '',
    fecha_vigencia: '',
    moneda: 'MXN',
    tipo_cambio: 1,
    porcentaje_descuento: 0,
    iva_porcentaje: 16,
    condiciones_pago: '',
    notas: '',
    detalle: []
  });

  // Estatus modal
  const [estatusForm, setEstatusForm] = useState({
    id_estatus_nuevo: '',
    comentario: '',
    usuario: 'Admin'
  });

  // =================== LOAD DATA ===================
  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [cotRes, cliRes, prodRes, tpRes, vendRes, estRes] = await Promise.all([
        getCotizaciones(),
        getClientes(),
        getProductos(),
        getTiposPrecios(),
        getVendedores(),
        getEstatus()
      ]);
      setCotizaciones(cotRes.data);
      setClientes(cliRes.data.filter(c => c.activo));
      setProductos(prodRes.data.filter(p => p.activo));
      setTiposPrecios(tpRes.data);
      setVendedores(vendRes.data);
      setEstatusList(estRes.data);
    } catch (error) {
      console.error('Error al cargar datos:', error);
      alert('Error al cargar los datos');
    } finally {
      setLoading(false);
    }
  };

  // =================== HANDLERS ===================
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  // Cuando se selecciona un cliente, asignar su tipo de precio
  const handleClienteChange = (e) => {
    const id_cliente = e.target.value;
    const cliente = clientes.find(c => c.id_cliente === parseInt(id_cliente));
    setFormData(prev => ({
      ...prev,
      id_cliente,
      id_tipo_precio: cliente?.id_tipo_precio_asignado || prev.id_tipo_precio,
      detalle: [] // Reset detalle al cambiar cliente
    }));
  };

  // Agregar producto al detalle
  const handleAddProducto = () => {
    setFormData(prev => ({
      ...prev,
      detalle: [
        ...prev.detalle,
        {
          id_producto: '',
          producto_nombre: '',
          codigo_sku: '',
          unidad_medida: '',
          cantidad: 1,
          precio_unitario: 0,
          porcentaje_descuento: 0,
          notas: ''
        }
      ]
    }));
  };

  // Cuando se selecciona un producto en el detalle
  const handleProductoSelect = async (index, id_producto) => {
    const producto = productos.find(p => p.id_producto === parseInt(id_producto));
    if (!producto) return;

    let precioUnitario = 0;

    // Buscar precio según tipo de precio seleccionado
    if (formData.id_tipo_precio) {
      try {
        const res = await getPreciosProducto(id_producto, formData.id_tipo_precio);
        if (res.data.length > 0) {
          precioUnitario = parseFloat(res.data[0].precio);
        }
      } catch (error) {
        console.error('Error al obtener precio:', error);
      }
    }

    const newDetalle = [...formData.detalle];
    newDetalle[index] = {
      ...newDetalle[index],
      id_producto: parseInt(id_producto),
      producto_nombre: producto.nombre,
      codigo_sku: producto.codigo_sku,
      unidad_medida: producto.unidad_medida,
      precio_unitario: precioUnitario
    };
    setFormData(prev => ({ ...prev, detalle: newDetalle }));
  };

  // Cambiar campo del detalle
  const handleDetalleChange = (index, field, value) => {
    const newDetalle = [...formData.detalle];
    newDetalle[index] = { ...newDetalle[index], [field]: value };
    setFormData(prev => ({ ...prev, detalle: newDetalle }));
  };

  // Remover línea de detalle
  const handleRemoveDetalle = (index) => {
    setFormData(prev => ({
      ...prev,
      detalle: prev.detalle.filter((_, i) => i !== index)
    }));
  };

  // =================== CALCULOS ===================
  const calcularSubtotalLinea = (item) => {
    const bruto = item.cantidad * item.precio_unitario;
    const descuento = bruto * (item.porcentaje_descuento || 0) / 100;
    return bruto - descuento;
  };

  const calcularTotales = () => {
    const subtotal = formData.detalle.reduce((sum, item) => sum + calcularSubtotalLinea(item), 0);
    const monto_descuento = subtotal * (formData.porcentaje_descuento || 0) / 100;
    const base_iva = subtotal - monto_descuento;
    const iva_monto = base_iva * (formData.iva_porcentaje || 16) / 100;
    const total = base_iva + iva_monto;
    return { subtotal, monto_descuento, base_iva, iva_monto, total };
  };

  const totales = calcularTotales();

  // =================== SUBMIT ===================
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (formData.detalle.length === 0) {
      return alert('Debes agregar al menos un producto');
    }

    if (!formData.id_cliente || !formData.id_tipo_precio) {
      return alert('Debes seleccionar un cliente y un tipo de precio');
    }

    try {
      const res = await createCotizacion(formData);
      alert(`✅ Cotización creada: ${res.data.folio}`);
      setShowCreateModal(false);
      resetForm();
      fetchData();
    } catch (error) {
      console.error('Error al crear:', error);
      alert(error.response?.data?.message || 'Error al crear cotización');
    }
  };

  const resetForm = () => {
    setFormData({
      id_cliente: '',
      id_vendedor: '',
      id_tipo_precio: '',
      fecha_vigencia: '',
      moneda: 'MXN',
      tipo_cambio: 1,
      porcentaje_descuento: 0,
      iva_porcentaje: 16,
      condiciones_pago: '',
      notas: '',
      detalle: []
    });
  };

  // Ver detalle
  const handleViewDetail = async (cotizacion) => {
    try {
      const res = await getCotizacionById(cotizacion.id_cotizacion);
      setSelectedCotizacion(res.data);
      setShowDetailModal(true);
    } catch (error) {
      console.error('Error:', error);
      alert('Error al obtener detalle');
    }
  };

  // Cambiar estatus
  const handleOpenEstatus = (cotizacion) => {
    setSelectedCotizacion(cotizacion);
    setEstatusForm({
      id_estatus_nuevo: '',
      comentario: '',
      usuario: 'Admin'
    });
    setShowEstatusModal(true);
  };

  const handleUpdateEstatus = async () => {
    if (!estatusForm.id_estatus_nuevo) {
      return alert('Selecciona un estatus');
    }
    try {
      await updateEstatus(selectedCotizacion.id_cotizacion, estatusForm);
      alert('✅ Estatus actualizado');
      setShowEstatusModal(false);
      fetchData();
    } catch (error) {
      console.error('Error:', error);
      alert('Error al actualizar estatus');
    }
  };

  // Eliminar
  const handleDelete = async (id) => {
    if (window.confirm('¿Estás seguro? Solo se pueden eliminar cotizaciones en borrador.')) {
      try {
        await deleteCotizacion(id);
        alert('✅ Cotización eliminada');
        fetchData();
      } catch (error) {
        alert(error.response?.data?.message || 'Error al eliminar');
      }
    }
  };

  // Fecha por defecto (15 días)
  const getDefaultVigencia = () => {
    const date = new Date();
    date.setDate(date.getDate() + 15);
    return date.toISOString().split('T')[0];
  };

  const handleNewCotizacion = () => {
    resetForm();
    setFormData(prev => ({
      ...prev,
      fecha_vigencia: getDefaultVigencia()
    }));
    setShowCreateModal(true);
  };

  // Filtrar
  const filteredCotizaciones = cotizaciones.filter(c => {
    const matchSearch =
      c.folio.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.cliente_nombre.toLowerCase().includes(searchTerm.toLowerCase());
    const matchEstatus = filterEstatus === '' || c.estatus_clave === filterEstatus;
    return matchSearch && matchEstatus;
  });

  // Color de estatus
  const getEstatusColor = (clave) => {
    const colores = {
      BORRADOR: { bg: '#e3f2fd', color: '#1565c0' },
      ENVIADA: { bg: '#fff3e0', color: '#e65100' },
      ACEPTADA: { bg: '#d4edda', color: '#155724' },
      RECHAZADA: { bg: '#f8d7da', color: '#721c24' },
      VENCIDA: { bg: '#f5f5f5', color: '#666' },
      CANCELADA: { bg: '#fce4ec', color: '#c62828' }
    };
    return colores[clave] || { bg: '#eee', color: '#333' };
  };

  // Formato moneda
  const formatMoney = (amount, currency = 'MXN') => {
    return `$${Number(amount).toLocaleString('es-MX', { minimumFractionDigits: 2 })} ${currency}`;
  };

  // Contadores
  const totalBorradores = cotizaciones.filter(c => c.estatus_clave === 'BORRADOR').length;
  const totalEnviadas = cotizaciones.filter(c => c.estatus_clave === 'ENVIADA').length;
  const totalAceptadas = cotizaciones.filter(c => c.estatus_clave === 'ACEPTADA').length;
  const montoTotal = cotizaciones
    .filter(c => c.estatus_clave === 'ACEPTADA')
    .reduce((sum, c) => sum + parseFloat(c.total), 0);

 // Agregar junto a los demás estados
const [showEmailModal, setShowEmailModal] = useState(false);
const [emailForm, setEmailForm] = useState({
  email_destino: '',
  asunto: '',
  mensaje: ''
});
const [sendingEmail, setSendingEmail] = useState(false);
const [generatingPDF, setGeneratingPDF] = useState(false);    

// =================== PDF ===================
const handleDescargarPDF = async (cotizacion) => {
  try {
    setGeneratingPDF(true);
    const response = await descargarPDF(cotizacion.id_cotizacion);

    // Crear blob y descargar
    const blob = new Blob([response.data], { type: 'application/pdf' });
    const url = window.URL.createObjectURL(blob);

    // Abrir en nueva pestaña
    window.open(url, '_blank');

    // O para descargar directamente:
    // const link = document.createElement('a');
    // link.href = url;
    // link.download = `cotizacion-${cotizacion.folio}.pdf`;
    // document.body.appendChild(link);
    // link.click();
    // document.body.removeChild(link);

    window.URL.revokeObjectURL(url);
  } catch (error) {
    console.error('Error al generar PDF:', error);
    alert('Error al generar el PDF');
  } finally {
    setGeneratingPDF(false);
  }
};

// =================== EMAIL ===================
const handleOpenEmailModal = (cotizacion) => {
  setSelectedCotizacion(cotizacion);
  setEmailForm({
    email_destino: cotizacion.cliente_email || '',
    asunto: `Cotización ${cotizacion.folio} - Icaro Trading`,
    mensaje: `Estimado(a) ${cotizacion.cliente_nombre}, le hacemos llegar la cotización ${cotizacion.folio} para su consideración. Quedamos atentos a sus comentarios.`
  });
  setShowEmailModal(true);
};

const handleSendEmail = async () => {
  if (!emailForm.email_destino) {
    return alert('El email de destino es requerido');
  }

  // Validar formato de email
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(emailForm.email_destino)) {
    return alert('El formato del email no es válido');
  }

  try {
    setSendingEmail(true);
    const res = await enviarEmailCotizacion(selectedCotizacion.id_cotizacion, emailForm);
    alert(`✅ ${res.data.message}`);
    setShowEmailModal(false);
    fetchData(); // Refrescar para ver cambio de estatus
  } catch (error) {
    console.error('Error al enviar email:', error);
    alert(error.response?.data?.message || 'Error al enviar el email. Verifica la configuración SMTP.');
  } finally {
    setSendingEmail(false);
  }
};


  // =================== ESTILOS ===================
  const styles = {
    container: {
      padding: '20px',
      maxWidth: '1400px',
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
    title: { fontSize: '24px', fontWeight: 'bold', color: '#1a1a2e' },
    statsRow: {
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
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
    statNumber: { fontSize: '24px', fontWeight: '700', color: '#1a1a2e' },
    statLabel: { fontSize: '12px', color: '#888', marginTop: '2px' },
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
    btnSecondary: {
      backgroundColor: '#16213e',
      color: '#fff',
      border: 'none',
      padding: '8px 16px',
      borderRadius: '8px',
      cursor: 'pointer',
      display: 'flex',
      alignItems: 'center',
      gap: '6px',
      fontSize: '13px'
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
      padding: '12px 14px',
      textAlign: 'left',
      fontSize: '12px',
      fontWeight: '600',
      textTransform: 'uppercase'
    },
    td: {
      padding: '12px 14px',
      borderBottom: '1px solid #eee',
      fontSize: '13px',
      color: '#333'
    },
    badge: {
      padding: '4px 10px',
      borderRadius: '12px',
      fontSize: '11px',
      fontWeight: '600',
      display: 'inline-block'
    },
    actionBtn: {
      border: 'none',
      padding: '6px 10px',
      borderRadius: '6px',
      cursor: 'pointer',
      fontSize: '12px',
      marginRight: '4px'
    },
    overlay: {
      position: 'fixed',
      top: 0, left: 0, right: 0, bottom: 0,
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
      width: '95%',
      maxWidth: '1000px',
      maxHeight: '95vh',
      overflowY: 'auto',
      boxShadow: '0 10px 30px rgba(0,0,0,0.3)'
    },
    modalSmall: {
      backgroundColor: '#fff',
      borderRadius: '12px',
      padding: '30px',
      width: '90%',
      maxWidth: '500px',
      boxShadow: '0 10px 30px rgba(0,0,0,0.3)'
    },
    formGroup: { marginBottom: '16px' },
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
    formRow4: {
      display: 'grid',
      gridTemplateColumns: '1fr 1fr 1fr 1fr',
      gap: '16px'
    },
    sectionTitle: {
      fontSize: '15px',
      fontWeight: '700',
      color: '#1a1a2e',
      marginBottom: '12px',
      paddingBottom: '6px',
      borderBottom: '2px solid #e94560',
      display: 'flex',
      alignItems: 'center',
      gap: '8px'
    },
    totalesBox: {
      backgroundColor: '#1a1a2e',
      color: '#fff',
      borderRadius: '10px',
      padding: '20px',
      marginTop: '16px'
    },
    totalesRow: {
      display: 'flex',
      justifyContent: 'space-between',
      padding: '6px 0',
      fontSize: '14px'
    },
    totalFinal: {
      display: 'flex',
      justifyContent: 'space-between',
      padding: '10px 0',
      fontSize: '20px',
      fontWeight: '700',
      borderTop: '1px solid rgba(255,255,255,0.3)',
      marginTop: '8px'
    },
    // Agregar estos estilos dentro del objeto styles existente
btnPDF: {
  backgroundColor: '#c62828',
  color: '#fff',
  border: 'none',
  padding: '8px 16px',
  borderRadius: '8px',
  cursor: 'pointer',
  display: 'flex',
  alignItems: 'center',
  gap: '6px',
  fontSize: '13px'
},
btnEmail: {
  backgroundColor: '#1565c0',
  color: '#fff',
  border: 'none',
  padding: '8px 16px',
  borderRadius: '8px',
  cursor: 'pointer',
  display: 'flex',
  alignItems: 'center',
  gap: '6px',
  fontSize: '13px'
},
btnDisabled: {
  opacity: 0.6,
  cursor: 'not-allowed'
},
  };

  if (loading) {
    return (
      <div style={{ ...styles.container, textAlign: 'center', marginTop: '100px' }}>
        <h2>Cargando cotizaciones...</h2>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      {/* =================== HEADER =================== */}
      <div style={styles.header}>
        <h1 style={styles.title}>📋 Gestión de Cotizaciones</h1>
        <button style={styles.btnPrimary} onClick={handleNewCotizacion}>
          <FaPlus /> Nueva Cotización
        </button>
      </div>

      {/* =================== STATS =================== */}
      <div style={styles.statsRow}>
        <div style={styles.statCard}>
          <div style={{ ...styles.statIcon, backgroundColor: '#e3f2fd', color: '#1565c0' }}>
            <FaFileInvoiceDollar />
          </div>
          <div>
            <div style={styles.statNumber}>{cotizaciones.length}</div>
            <div style={styles.statLabel}>Total Cotizaciones</div>
          </div>
        </div>
        <div style={styles.statCard}>
          <div style={{ ...styles.statIcon, backgroundColor: '#fff3e0', color: '#e65100' }}>
            <FaPaperPlane />
          </div>
          <div>
            <div style={styles.statNumber}>{totalBorradores}/{totalEnviadas}</div>
            <div style={styles.statLabel}>Borradores / Enviadas</div>
          </div>
        </div>
        <div style={styles.statCard}>
          <div style={{ ...styles.statIcon, backgroundColor: '#d4edda', color: '#155724' }}>
            <FaCheckCircle />
          </div>
          <div>
            <div style={styles.statNumber}>{totalAceptadas}</div>
            <div style={styles.statLabel}>Aceptadas</div>
          </div>
        </div>
        <div style={styles.statCard}>
          <div style={{ ...styles.statIcon, backgroundColor: '#e8f5e9', color: '#2e7d32' }}>
            💰
          </div>
          <div>
            <div style={{ ...styles.statNumber, fontSize: '18px' }}>{formatMoney(montoTotal)}</div>
            <div style={styles.statLabel}>Monto Aceptado</div>
          </div>
        </div>
      </div>

      {/* =================== FILTROS =================== */}
      <div style={styles.filtersRow}>
        <div style={styles.searchBar}>
          <FaSearch color="#999" />
          <input
            style={styles.searchInput}
            placeholder="Buscar por folio o cliente..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <select
          style={styles.filterSelect}
          value={filterEstatus}
          onChange={(e) => setFilterEstatus(e.target.value)}
        >
          <option value="">Todos los estatus</option>
          {estatusList.map(est => (
            <option key={est.id_estatus} value={est.clave}>{est.nombre}</option>
          ))}
        </select>
      </div>

      {/* =================== TABLA =================== */}
      <table style={styles.table}>
        <thead>
          <tr>
            <th style={styles.th}>Folio</th>
            <th style={styles.th}>Fecha</th>
            <th style={styles.th}>Cliente</th>
            <th style={styles.th}>Vendedor</th>
            <th style={styles.th}>Tipo Precio</th>
            <th style={styles.th}>Total</th>
            <th style={styles.th}>Vigencia</th>
            <th style={styles.th}>Estatus</th>
            <th style={styles.th}>Acciones</th>
          </tr>
        </thead>
        <tbody>
          {filteredCotizaciones.length === 0 ? (
            <tr>
              <td style={styles.td} colSpan="9">No se encontraron cotizaciones</td>
            </tr>
          ) : (
            filteredCotizaciones.map((cot) => {
              const estatusColor = getEstatusColor(cot.estatus_clave);
              const isVencida = new Date(cot.fecha_vigencia) < new Date() && cot.estatus_clave === 'ENVIADA';
              return (
                <tr key={cot.id_cotizacion}>
                  <td style={{ ...styles.td, fontWeight: '700', color: '#e94560' }}>
                    {cot.folio}
                  </td>
                  <td style={styles.td}>
                    {new Date(cot.fecha_cotizacion).toLocaleDateString('es-MX')}
                  </td>
                  <td style={styles.td}>
                    <div style={{ fontWeight: '600' }}>{cot.cliente_nombre}</div>
                    {cot.cliente_rfc && (
                      <div style={{ fontSize: '11px', color: '#888' }}>{cot.cliente_rfc}</div>
                    )}
                  </td>
                  <td style={styles.td}>{cot.vendedor_nombre || '—'}</td>
                  <td style={styles.td}>
                    <span style={{ ...styles.badge, backgroundColor: '#fff3e0', color: '#e65100' }}>
                      {cot.tipo_precio_nombre}
                    </span>
                  </td>
                  <td style={{ ...styles.td, fontWeight: '700', textAlign: 'right' }}>
                    {formatMoney(cot.total, cot.moneda)}
                  </td>
                  <td style={{
                    ...styles.td,
                    color: isVencida ? '#c62828' : '#333'
                  }}>
                    {new Date(cot.fecha_vigencia).toLocaleDateString('es-MX')}
                    {isVencida && <span style={{ fontSize: '10px', color: '#c62828' }}> ⚠️ Vencida</span>}
                  </td>
                  <td style={styles.td}>
                    <span style={{
                      ...styles.badge,
                      backgroundColor: estatusColor.bg,
                      color: estatusColor.color
                    }}>
                      {cot.estatus_nombre}
                    </span>
                  </td>
                  <td style={styles.td}>
                    <button
                      style={{ ...styles.actionBtn, backgroundColor: '#e3f2fd', color: '#1565c0' }}
                      onClick={() => handleViewDetail(cot)}
                      title="Ver detalle"
                    >
                      <FaEye />
                    </button>
                    <button
                      style={{ ...styles.actionBtn, backgroundColor: '#fff3e0', color: '#e65100' }}
                      onClick={() => handleOpenEstatus(cot)}
                      title="Cambiar estatus"
                    >
                      <FaArrowRight />
                    </button>
                    {cot.estatus_clave === 'BORRADOR' && (
                      <button
                        style={{ ...styles.actionBtn, backgroundColor: '#f8d7da', color: '#721c24' }}
                        onClick={() => handleDelete(cot.id_cotizacion)}
                        title="Eliminar"
                      >
                        <FaTrash />
                      </button>
                    )}
                  </td>
                  <td style={styles.td}>
                    {/* Ver detalle */}
                    <button
                        style={{ ...styles.actionBtn, backgroundColor: '#e3f2fd', color: '#1565c0' }}
                        onClick={() => handleViewDetail(cot)}
                        title="Ver detalle"
                    >
                        <FaEye />
                    </button>
                    {/* Descargar PDF */}
                    <button
                        style={{
                        ...styles.actionBtn,
                        backgroundColor: '#ffebee',
                        color: '#c62828'
                        }}
                        onClick={() => handleDescargarPDF(cot)}
                        title="Descargar PDF"
                        disabled={generatingPDF}
                    >
                        <FaFilePdf />
                    </button>
                    {/* Enviar por email */}
                    <button
                        style={{
                        ...styles.actionBtn,
                        backgroundColor: '#e3f2fd',
                        color: '#1565c0'
                        }}
                        onClick={() => handleOpenEmailModal(cot)}
                        title="Enviar por email"
                    >
                        <FaEnvelope />
                    </button>
                    {/* Cambiar estatus */}
                    <button
                        style={{ ...styles.actionBtn, backgroundColor: '#fff3e0', color: '#e65100' }}
                        onClick={() => handleOpenEstatus(cot)}
                        title="Cambiar estatus"
                    >
                        <FaArrowRight />
                    </button>
                    {/* Eliminar (solo borradores) */}
                    {cot.estatus_clave === 'BORRADOR' && (
                        <button
                        style={{ ...styles.actionBtn, backgroundColor: '#f8d7da', color: '#721c24' }}
                        onClick={() => handleDelete(cot.id_cotizacion)}
                        title="Eliminar"
                        >
                        <FaTrash />
                        </button>
                    )}
                    </td>
                </tr>
              );
            })
          )}
        </tbody>
      </table>

      {/* =================== MODAL CREAR COTIZACIÓN =================== */}
      {showCreateModal && (
        <div style={styles.overlay}>
          <div style={styles.modal} onClick={(e) => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h2 style={{ color: '#1a1a2e', margin: 0 }}>➕ Nueva Cotización</h2>
              <button
                onClick={() => setShowCreateModal(false)}
                style={{ background: 'none', border: 'none', fontSize: '20px', cursor: 'pointer', color: '#999' }}
              >
                <FaTimes />
              </button>
            </div>

            <form onSubmit={handleSubmit}>
              {/* SECCIÓN: DATOS GENERALES */}
              <div style={{ marginBottom: '24px' }}>
                <div style={styles.sectionTitle}>
                  <FaFileInvoiceDollar /> Datos Generales
                </div>
                <div style={styles.formRow3}>
                  <div style={styles.formGroup}>
                    <label style={styles.label}>Cliente *</label>
                    <select
                      style={styles.select}
                      name="id_cliente"
                      value={formData.id_cliente}
                      onChange={handleClienteChange}
                      required
                    >
                      <option value="">Seleccionar cliente...</option>
                      {clientes.map(cl => (
                        <option key={cl.id_cliente} value={cl.id_cliente}>
                          {cl.nombre} {cl.rfc ? `(${cl.rfc})` : ''}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div style={styles.formGroup}>
                    <label style={styles.label}>Vendedor</label>
                    <select
                      style={styles.select}
                      name="id_vendedor"
                      value={formData.id_vendedor}
                      onChange={handleChange}
                    >
                      <option value="">Sin vendedor</option>
                      {vendedores.map(v => (
                        <option key={v.id_vendedor} value={v.id_vendedor}>
                          {v.nombre}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div style={styles.formGroup}>
                    <label style={styles.label}>Tipo de Precio *</label>
                    <select
                      style={styles.select}
                      name="id_tipo_precio"
                      value={formData.id_tipo_precio}
                      onChange={handleChange}
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
                </div>

                <div style={styles.formRow4}>
                  <div style={styles.formGroup}>
                    <label style={styles.label}>Vigencia *</label>
                    <input
                      style={styles.input}
                      type="date"
                      name="fecha_vigencia"
                      value={formData.fecha_vigencia}
                      onChange={handleChange}
                      required
                    />
                  </div>
                  <div style={styles.formGroup}>
                    <label style={styles.label}>Moneda</label>
                    <select
                      style={styles.select}
                      name="moneda"
                      value={formData.moneda}
                      onChange={handleChange}
                    >
                      <option value="MXN">MXN - Peso Mexicano</option>
                      <option value="USD">USD - Dólar</option>
                      <option value="EUR">EUR - Euro</option>
                    </select>
                  </div>
                  <div style={styles.formGroup}>
                    <label style={styles.label}>Tipo de Cambio</label>
                    <input
                      style={styles.input}
                      type="number"
                      name="tipo_cambio"
                      value={formData.tipo_cambio}
                      onChange={handleChange}
                      min="0"
                      step="0.0001"
                    />
                  </div>
                  <div style={styles.formGroup}>
                    <label style={styles.label}>Condiciones de Pago</label>
                    <select
                      style={styles.select}
                      name="condiciones_pago"
                      value={formData.condiciones_pago}
                      onChange={handleChange}
                    >
                      <option value="">Seleccionar...</option>
                      <option value="Contado">Contado</option>
                      <option value="15 días">15 días</option>
                      <option value="30 días">30 días</option>
                      <option value="60 días">60 días</option>
                      <option value="50% anticipo">50% anticipo</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* SECCIÓN: PRODUCTOS */}
              <div style={{ marginBottom: '24px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={styles.sectionTitle}>
                    <FaShoppingCart /> Productos
                  </div>
                  <button
                    type="button"
                    onClick={handleAddProducto}
                    style={{ ...styles.btnSecondary, marginBottom: '12px' }}
                  >
                    <FaPlus /> Agregar Producto
                  </button>
                </div>

                {formData.detalle.length === 0 ? (
                  <div style={{
                    textAlign: 'center',
                    padding: '30px',
                    backgroundColor: '#f8f9fa',
                    borderRadius: '8px',
                    color: '#999'
                  }}>
                    <FaShoppingCart size={30} />
                    <p>No hay productos agregados. Haz clic en "Agregar Producto"</p>
                  </div>
                ) : (
                  <div style={{
                    backgroundColor: '#f8f9fa',
                    borderRadius: '8px',
                    padding: '16px',
                    overflowX: 'auto'
                  }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                      <thead>
                        <tr style={{ borderBottom: '2px solid #ddd' }}>
                          <th style={{ padding: '8px', textAlign: 'left', width: '30%' }}>Producto</th>
                          <th style={{ padding: '8px', textAlign: 'center', width: '10%' }}>Unidad</th>
                          <th style={{ padding: '8px', textAlign: 'center', width: '12%' }}>Cantidad</th>
                          <th style={{ padding: '8px', textAlign: 'right', width: '15%' }}>Precio Unit.</th>
                          <th style={{ padding: '8px', textAlign: 'center', width: '10%' }}>Desc. %</th>
                          <th style={{ padding: '8px', textAlign: 'right', width: '15%' }}>Subtotal</th>
                          <th style={{ padding: '8px', textAlign: 'center', width: '8%' }}></th>
                        </tr>
                      </thead>
                      <tbody>
                        {formData.detalle.map((item, index) => (
                          <tr key={index} style={{ borderBottom: '1px solid #eee' }}>
                            <td style={{ padding: '8px' }}>
                              <select
                                style={{ ...styles.select, fontSize: '13px', padding: '8px' }}
                                value={item.id_producto}
                                onChange={(e) => handleProductoSelect(index, e.target.value)}
                                required
                              >
                                <option value="">Seleccionar producto...</option>
                                {productos.map(p => (
                                  <option key={p.id_producto} value={p.id_producto}>
                                    {p.codigo_sku} - {p.nombre}
                                  </option>
                                ))}
                              </select>
                            </td>
                            <td style={{ padding: '8px', textAlign: 'center', color: '#888' }}>
                              {item.unidad_medida || '—'}
                            </td>
                            <td style={{ padding: '8px' }}>
                              <input
                                style={{ ...styles.input, fontSize: '13px', padding: '8px', textAlign: 'center' }}
                                type="number"
                                value={item.cantidad}
                                onChange={(e) => handleDetalleChange(index, 'cantidad', parseFloat(e.target.value) || 0)}
                                min="0.01"
                                step="0.01"
                                required
                              />
                            </td>
                            <td style={{ padding: '8px' }}>
                              <input
                                style={{ ...styles.input, fontSize: '13px', padding: '8px', textAlign: 'right' }}
                                type="number"
                                value={item.precio_unitario}
                                onChange={(e) => handleDetalleChange(index, 'precio_unitario', parseFloat(e.target.value) || 0)}
                                min="0"
                                step="0.01"
                                required
                              />
                            </td>
                            <td style={{ padding: '8px' }}>
                              <input
                                style={{ ...styles.input, fontSize: '13px', padding: '8px', textAlign: 'center' }}
                                type="number"
                                value={item.porcentaje_descuento}
                                onChange={(e) => handleDetalleChange(index, 'porcentaje_descuento', parseFloat(e.target.value) || 0)}
                                min="0"
                                max="100"
                                step="0.01"
                              />
                            </td>
                            <td style={{ padding: '8px', textAlign: 'right', fontWeight: '600', color: '#1a1a2e' }}>
                              {formatMoney(calcularSubtotalLinea(item))}
                            </td>
                            <td style={{ padding: '8px', textAlign: 'center' }}>
                              <button
                                type="button"
                                onClick={() => handleRemoveDetalle(index)}
                                style={{ ...styles.actionBtn, backgroundColor: '#f8d7da', color: '#721c24' }}
                              >
                                <FaTrash />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

              {/* SECCIÓN: DESCUENTO E IVA */}
              <div style={styles.formRow3}>
                <div style={styles.formGroup}>
                  <label style={styles.label}>Descuento Global (%)</label>
                  <input
                    style={styles.input}
                    type="number"
                    name="porcentaje_descuento"
                    value={formData.porcentaje_descuento}
                    onChange={handleChange}
                    min="0"
                    max="100"
                    step="0.01"
                  />
                </div>
                <div style={styles.formGroup}>
                  <label style={styles.label}>IVA (%)</label>
                  <input
                    style={styles.input}
                    type="number"
                    name="iva_porcentaje"
                    value={formData.iva_porcentaje}
                    onChange={handleChange}
                    min="0"
                    step="0.01"
                  />
                </div>
                <div style={styles.formGroup}>
                  <label style={styles.label}>Notas</label>
                  <input
                    style={styles.input}
                    name="notas"
                    value={formData.notas}
                    onChange={handleChange}
                    placeholder="Notas adicionales..."
                  />
                </div>
              </div>

              {/* SECCIÓN: TOTALES */}
              <div style={styles.totalesBox}>
                <div style={styles.totalesRow}>
                  <span>Subtotal:</span>
                  <span>{formatMoney(totales.subtotal, formData.moneda)}</span>
                </div>
                {formData.porcentaje_descuento > 0 && (
                  <div style={{ ...styles.totalesRow, color: '#ff8a80' }}>
                    <span>Descuento ({formData.porcentaje_descuento}%):</span>
                    <span>- {formatMoney(totales.monto_descuento, formData.moneda)}</span>
                  </div>
                )}
                <div style={styles.totalesRow}>
                  <span>IVA ({formData.iva_porcentaje}%):</span>
                  <span>{formatMoney(totales.iva_monto, formData.moneda)}</span>
                </div>
                <div style={styles.totalFinal}>
                  <span>TOTAL:</span>
                  <span>{formatMoney(totales.total, formData.moneda)}</span>
                </div>
              </div>

              {/* BOTONES */}
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '20px' }}>
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
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
                  💾 Crear Cotización
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

          {/* =================== MODAL DETALLE =================== */}
      {showDetailModal && selectedCotizacion && (
        <div style={styles.overlay} onClick={() => setShowDetailModal(false)}>
          <div style={styles.modal} onClick={(e) => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <div>
                <h2 style={{ color: '#1a1a2e', margin: 0 }}>
                  📋 Cotización {selectedCotizacion.folio}
                </h2>
                <span style={{
                  ...styles.badge,
                  ...getEstatusColor(selectedCotizacion.estatus_clave),
                  marginTop: '8px'
                }}>
                  {selectedCotizacion.estatus_nombre}
                </span>
              </div>
              <button
                onClick={() => setShowDetailModal(false)}
                style={{ background: 'none', border: 'none', fontSize: '20px', cursor: 'pointer', color: '#999' }}
              >
                <FaTimes />
              </button>
            </div>

            {/* INFO GENERAL */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: '24px',
              marginBottom: '24px'
            }}>
              {/* Datos de la cotización */}
              <div style={{
                backgroundColor: '#f8f9fa',
                borderRadius: '10px',
                padding: '16px'
              }}>
                <div style={styles.sectionTitle}>
                  <FaFileInvoiceDollar /> Datos de Cotización
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', fontSize: '13px' }}>
                  <div>
                    <span style={{ fontWeight: '600', color: '#333', display: 'block' }}>Folio</span>
                    <span style={{ color: '#e94560', fontWeight: '700' }}>{selectedCotizacion.folio}</span>
                  </div>
                  <div>
                    <span style={{ fontWeight: '600', color: '#333', display: 'block' }}>Fecha</span>
                    {new Date(selectedCotizacion.fecha_cotizacion).toLocaleDateString('es-MX')}
                  </div>
                  <div>
                    <span style={{ fontWeight: '600', color: '#333', display: 'block' }}>Vigencia</span>
                    {new Date(selectedCotizacion.fecha_vigencia).toLocaleDateString('es-MX')}
                  </div>
                  <div>
                    <span style={{ fontWeight: '600', color: '#333', display: 'block' }}>Moneda</span>
                    {selectedCotizacion.moneda}
                    {selectedCotizacion.tipo_cambio > 1 && ` (TC: ${selectedCotizacion.tipo_cambio})`}
                  </div>
                  <div>
                    <span style={{ fontWeight: '600', color: '#333', display: 'block' }}>Tipo Precio</span>
                    {selectedCotizacion.tipo_precio_nombre}
                  </div>
                  <div>
                    <span style={{ fontWeight: '600', color: '#333', display: 'block' }}>Condiciones</span>
                    {selectedCotizacion.condiciones_pago || '—'}
                  </div>
                  <div>
                    <span style={{ fontWeight: '600', color: '#333', display: 'block' }}>Vendedor</span>
                    {selectedCotizacion.vendedor_nombre || '—'}
                  </div>
                </div>
              </div>

              {/* Datos del cliente */}
              <div style={{
                backgroundColor: '#f8f9fa',
                borderRadius: '10px',
                padding: '16px'
              }}>
                <div style={styles.sectionTitle}>
                  👤 Datos del Cliente
                </div>
                <div style={{ fontSize: '13px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <div>
                    <span style={{ fontWeight: '600', color: '#333', display: 'block' }}>Nombre</span>
                    {selectedCotizacion.cliente_nombre}
                  </div>
                  {selectedCotizacion.cliente_rfc && (
                    <div>
                      <span style={{ fontWeight: '600', color: '#333', display: 'block' }}>RFC</span>
                      {selectedCotizacion.cliente_rfc}
                    </div>
                  )}
                  {selectedCotizacion.cliente_email && (
                    <div>
                      <span style={{ fontWeight: '600', color: '#333', display: 'block' }}>Email</span>
                      {selectedCotizacion.cliente_email}
                    </div>
                  )}
                  {selectedCotizacion.cliente_telefono && (
                    <div>
                      <span style={{ fontWeight: '600', color: '#333', display: 'block' }}>Teléfono</span>
                      {selectedCotizacion.cliente_telefono}
                    </div>
                  )}
                  {(selectedCotizacion.cliente_direccion || selectedCotizacion.cliente_ciudad) && (
                    <div>
                      <span style={{ fontWeight: '600', color: '#333', display: 'block' }}>Dirección</span>
                      {[
                        selectedCotizacion.cliente_direccion,
                        selectedCotizacion.cliente_ciudad,
                        selectedCotizacion.cliente_estado,
                        selectedCotizacion.cliente_cp ? `C.P. ${selectedCotizacion.cliente_cp}` : ''
                      ].filter(Boolean).join(', ')}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* DETALLE DE PRODUCTOS */}
            <div style={{ marginBottom: '24px' }}>
              <div style={styles.sectionTitle}>
                <FaShoppingCart /> Detalle de Productos
              </div>
              <table style={{
                width: '100%',
                borderCollapse: 'collapse',
                fontSize: '13px',
                backgroundColor: '#fff',
                borderRadius: '8px',
                overflow: 'hidden',
                boxShadow: '0 1px 4px rgba(0,0,0,0.08)'
              }}>
                <thead>
                  <tr style={{ backgroundColor: '#1a1a2e', color: '#fff' }}>
                    <th style={{ padding: '10px 12px', textAlign: 'left' }}>#</th>
                    <th style={{ padding: '10px 12px', textAlign: 'left' }}>SKU</th>
                    <th style={{ padding: '10px 12px', textAlign: 'left' }}>Producto</th>
                    <th style={{ padding: '10px 12px', textAlign: 'center' }}>Unidad</th>
                    <th style={{ padding: '10px 12px', textAlign: 'center' }}>Cantidad</th>
                    <th style={{ padding: '10px 12px', textAlign: 'right' }}>P. Unitario</th>
                    <th style={{ padding: '10px 12px', textAlign: 'center' }}>Desc. %</th>
                    <th style={{ padding: '10px 12px', textAlign: 'right' }}>Subtotal</th>
                  </tr>
                </thead>
                <tbody>
                  {selectedCotizacion.detalle && selectedCotizacion.detalle.map((item, index) => (
                    <tr key={item.id_detalle} style={{ borderBottom: '1px solid #eee' }}>
                      <td style={{ padding: '10px 12px', color: '#888' }}>{index + 1}</td>
                      <td style={{ padding: '10px 12px', fontFamily: 'monospace', color: '#e94560' }}>
                        {item.codigo_sku}
                      </td>
                      <td style={{ padding: '10px 12px', fontWeight: '600' }}>
                        {item.producto_nombre}
                        {item.notas && (
                          <div style={{ fontSize: '11px', color: '#888', fontWeight: '400' }}>
                            {item.notas}
                          </div>
                        )}
                      </td>
                      <td style={{ padding: '10px 12px', textAlign: 'center' }}>
                        {item.unidad_medida}
                      </td>
                      <td style={{ padding: '10px 12px', textAlign: 'center', fontWeight: '600' }}>
                        {item.cantidad}
                      </td>
                      <td style={{ padding: '10px 12px', textAlign: 'right' }}>
                        {formatMoney(item.precio_unitario)}
                      </td>
                      <td style={{ padding: '10px 12px', textAlign: 'center' }}>
                        {item.porcentaje_descuento > 0 ? `${item.porcentaje_descuento}%` : '—'}
                      </td>
                      <td style={{ padding: '10px 12px', textAlign: 'right', fontWeight: '700' }}>
                        {formatMoney(item.subtotal_linea)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* TOTALES */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '24px' }}>
              <div style={{ ...styles.totalesBox, width: '350px' }}>
                <div style={styles.totalesRow}>
                  <span>Subtotal:</span>
                  <span>{formatMoney(selectedCotizacion.subtotal, selectedCotizacion.moneda)}</span>
                </div>
                {parseFloat(selectedCotizacion.porcentaje_descuento) > 0 && (
                  <div style={{ ...styles.totalesRow, color: '#ff8a80' }}>
                    <span>Descuento ({selectedCotizacion.porcentaje_descuento}%):</span>
                    <span>- {formatMoney(selectedCotizacion.monto_descuento, selectedCotizacion.moneda)}</span>
                  </div>
                )}
                <div style={styles.totalesRow}>
                  <span>IVA ({selectedCotizacion.iva_porcentaje}%):</span>
                  <span>{formatMoney(selectedCotizacion.iva_monto, selectedCotizacion.moneda)}</span>
                </div>
                <div style={styles.totalFinal}>
                  <span>TOTAL:</span>
                  <span>{formatMoney(selectedCotizacion.total, selectedCotizacion.moneda)}</span>
                </div>
              </div>
            </div>

            {/* NOTAS */}
            {selectedCotizacion.notas && (
              <div style={{
                backgroundColor: '#fff8e1',
                borderRadius: '8px',
                padding: '12px 16px',
                marginBottom: '24px',
                fontSize: '13px'
              }}>
                <strong>📝 Notas:</strong> {selectedCotizacion.notas}
              </div>
            )}

            {/* HISTORIAL */}
            {selectedCotizacion.historial && selectedCotizacion.historial.length > 0 && (
              <div style={{ marginBottom: '20px' }}>
                <div style={styles.sectionTitle}>
                  <FaHistory /> Historial de Cambios
                </div>
                <div style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '8px'
                }}>
                  {selectedCotizacion.historial.map((h, index) => (
                    <div
                      key={h.id_historial}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '12px',
                        padding: '10px 14px',
                        backgroundColor: index === 0 ? '#e3f2fd' : '#f8f9fa',
                        borderRadius: '8px',
                        fontSize: '13px'
                      }}
                    >
                      <div style={{
                        width: '10px',
                        height: '10px',
                        borderRadius: '50%',
                        backgroundColor: index === 0 ? '#1565c0' : '#ccc',
                        flexShrink: 0
                      }} />
                      <div style={{ flex: 1 }}>
                        <div style={{ fontWeight: '600' }}>
                          {h.estatus_anterior_nombre ? (
                            <>
                              {h.estatus_anterior_nombre}
                              <span style={{ margin: '0 8px', color: '#999' }}>→</span>
                              <span style={{ color: '#e94560' }}>{h.estatus_nuevo_nombre}</span>
                            </>
                          ) : (
                            <span style={{ color: '#e94560' }}>{h.estatus_nuevo_nombre}</span>
                          )}
                        </div>
                        {h.comentario && (
                          <div style={{ color: '#666', marginTop: '2px' }}>
                            {h.comentario}
                          </div>
                        )}
                      </div>
                      <div style={{ fontSize: '11px', color: '#999', whiteSpace: 'nowrap' }}>
                        {new Date(h.fecha_cambio).toLocaleString('es-MX')}
                        {h.usuario && ` · ${h.usuario}`}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* BOTONES DEL DETALLE */}
            
            <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            marginTop: '20px',
            flexWrap: 'wrap',
            gap: '8px'
            }}>
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                {/* PDF */}
                <button
                onClick={() => handleDescargarPDF(selectedCotizacion)}
                disabled={generatingPDF}
                style={{
                    ...styles.btnPDF,
                    ...(generatingPDF ? styles.btnDisabled : {})
                }}
                >
                {generatingPDF ? <FaSpinner className="spin" /> : <FaFilePdf />}
                {generatingPDF ? 'Generando...' : 'Descargar PDF'}
                </button>

                {/* Email */}
                <button
                onClick={() => {
                    setShowDetailModal(false);
                    handleOpenEmailModal(selectedCotizacion);
                }}
                style={styles.btnEmail}
                >
                <FaEnvelope /> Enviar por Email
                </button>

                {/* Cambiar estatus */}
                <button
                onClick={() => {
                    setShowDetailModal(false);
                    handleOpenEstatus(selectedCotizacion);
                }}
                style={{
                    ...styles.btnSecondary,
                    backgroundColor: '#e65100'
                }}
                >
                <FaArrowRight /> Cambiar Estatus
                </button>

                {/* Eliminar */}
                {selectedCotizacion.estatus_clave === 'BORRADOR' && (
                <button
                    onClick={() => {
                    setShowDetailModal(false);
                    handleDelete(selectedCotizacion.id_cotizacion);
                    }}
                    style={{
                    ...styles.btnSecondary,
                    backgroundColor: '#c62828'
                    }}
                >
                    <FaTrash /> Eliminar
                </button>
                )}
            </div>

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

      {/* =================== MODAL CAMBIAR ESTATUS =================== */}
      {showEstatusModal && selectedCotizacion && (
        <div style={styles.overlay} onClick={() => setShowEstatusModal(false)}>
          <div style={styles.modalSmall} onClick={(e) => e.stopPropagation()}>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '20px'
            }}>
              <h2 style={{ color: '#1a1a2e', margin: 0, fontSize: '18px' }}>
                🔄 Cambiar Estatus
              </h2>
              <button
                onClick={() => setShowEstatusModal(false)}
                style={{ background: 'none', border: 'none', fontSize: '20px', cursor: 'pointer', color: '#999' }}
              >
                <FaTimes />
              </button>
            </div>

            {/* Info de la cotización */}
            <div style={{
              backgroundColor: '#f8f9fa',
              borderRadius: '8px',
              padding: '12px 16px',
              marginBottom: '20px',
              fontSize: '13px'
            }}>
              <div style={{ fontWeight: '700', color: '#e94560', marginBottom: '4px' }}>
                {selectedCotizacion.folio}
              </div>
              <div style={{ color: '#555' }}>
                {selectedCotizacion.cliente_nombre}
              </div>
              <div style={{ marginTop: '6px' }}>
                Estatus actual:{' '}
                <span style={{
                  ...styles.badge,
                  ...getEstatusColor(selectedCotizacion.estatus_clave)
                }}>
                  {selectedCotizacion.estatus_nombre}
                </span>
              </div>
            </div>

            {/* Formulario */}
            <div style={styles.formGroup}>
              <label style={styles.label}>Nuevo Estatus *</label>
              <select
                style={styles.select}
                value={estatusForm.id_estatus_nuevo}
                onChange={(e) => setEstatusForm(prev => ({ ...prev, id_estatus_nuevo: e.target.value }))}
                required
              >
                <option value="">Seleccionar estatus...</option>
                {estatusList
                  .filter(est => est.id_estatus !== selectedCotizacion.id_estatus)
                  .map(est => {
                    const color = getEstatusColor(est.clave);
                    return (
                      <option key={est.id_estatus} value={est.id_estatus}>
                        {est.nombre}
                      </option>
                    );
                  })
                }
              </select>
            </div>

            <div style={styles.formGroup}>
              <label style={styles.label}>Comentario</label>
              <textarea
                style={{ ...styles.input, minHeight: '80px', resize: 'vertical' }}
                value={estatusForm.comentario}
                onChange={(e) => setEstatusForm(prev => ({ ...prev, comentario: e.target.value }))}
                placeholder="Agrega un comentario sobre el cambio de estatus..."
              />
            </div>

            <div style={styles.formGroup}>
              <label style={styles.label}>Usuario</label>
              <input
                style={styles.input}
                value={estatusForm.usuario}
                onChange={(e) => setEstatusForm(prev => ({ ...prev, usuario: e.target.value }))}
                placeholder="Nombre del usuario"
              />
            </div>

            {/* Botones */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '20px' }}>
              <button
                onClick={() => setShowEstatusModal(false)}
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
              <button
                onClick={handleUpdateEstatus}
                style={styles.btnPrimary}
              >
                <FaCheckCircle /> Actualizar Estatus
              </button>
            </div>
          </div>
        </div>
      )}
            {/* =================== MODAL ENVIAR EMAIL =================== */}
      {showEmailModal && selectedCotizacion && (
        <div style={styles.overlay} onClick={() => !sendingEmail && setShowEmailModal(false)}>
          <div style={{ ...styles.modalSmall, maxWidth: '550px' }} onClick={(e) => e.stopPropagation()}>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '20px'
            }}>
              <h2 style={{ color: '#1a1a2e', margin: 0, fontSize: '18px' }}>
                📧 Enviar Cotización por Email
              </h2>
              <button
                onClick={() => !sendingEmail && setShowEmailModal(false)}
                style={{ background: 'none', border: 'none', fontSize: '20px', cursor: 'pointer', color: '#999' }}
              >
                <FaTimes />
              </button>
            </div>

            {/* Info de la cotización */}
            <div style={{
              backgroundColor: '#f8f9fa',
              borderRadius: '8px',
              padding: '12px 16px',
              marginBottom: '20px',
              fontSize: '13px'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <div style={{ fontWeight: '700', color: '#e94560' }}>
                    {selectedCotizacion.folio}
                  </div>
                  <div style={{ color: '#555', marginTop: '2px' }}>
                    {selectedCotizacion.cliente_nombre}
                  </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontWeight: '700', color: '#1a1a2e', fontSize: '16px' }}>
                    ${Number(selectedCotizacion.total).toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                  </div>
                  <div style={{ color: '#888', fontSize: '11px' }}>
                    {selectedCotizacion.moneda}
                  </div>
                </div>
              </div>
            </div>

            {/* Formulario */}
            <div style={styles.formGroup}>
              <label style={styles.label}>Email Destino *</label>
              <input
                style={styles.input}
                type="email"
                value={emailForm.email_destino}
                onChange={(e) => setEmailForm(prev => ({ ...prev, email_destino: e.target.value }))}
                placeholder="correo@ejemplo.com"
                required
                disabled={sendingEmail}
              />
              {selectedCotizacion.cliente_email && emailForm.email_destino !== selectedCotizacion.cliente_email && (
                <button
                  type="button"
                  onClick={() => setEmailForm(prev => ({ ...prev, email_destino: selectedCotizacion.cliente_email }))}
                  style={{
                    marginTop: '4px',
                    background: 'none',
                    border: 'none',
                    color: '#1565c0',
                    cursor: 'pointer',
                    fontSize: '12px',
                    padding: 0
                  }}
                >
                  Usar email del cliente: {selectedCotizacion.cliente_email}
                </button>
              )}
            </div>

            <div style={styles.formGroup}>
              <label style={styles.label}>Asunto</label>
              <input
                style={styles.input}
                value={emailForm.asunto}
                onChange={(e) => setEmailForm(prev => ({ ...prev, asunto: e.target.value }))}
                placeholder="Asunto del correo"
                disabled={sendingEmail}
              />
            </div>

            <div style={styles.formGroup}>
              <label style={styles.label}>Mensaje</label>
              <textarea
                style={{ ...styles.input, minHeight: '100px', resize: 'vertical' }}
                value={emailForm.mensaje}
                onChange={(e) => setEmailForm(prev => ({ ...prev, mensaje: e.target.value }))}
                placeholder="Escribe un mensaje personalizado para el cliente..."
                disabled={sendingEmail}
              />
            </div>

            {/* Info adicional */}
            <div style={{
              backgroundColor: '#e3f2fd',
              borderRadius: '8px',
              padding: '10px 14px',
              fontSize: '12px',
              color: '#1565c0',
              marginBottom: '16px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}>
              <FaFilePdf />
              Se adjuntará automáticamente el PDF de la cotización.
              {selectedCotizacion.estatus_clave === 'BORRADOR' && (
                <span style={{ marginLeft: '4px' }}>
                  El estatus cambiará a <strong>"Enviada"</strong>.
                </span>
              )}
            </div>

            {/* Botones */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
              <button
                onClick={() => setShowEmailModal(false)}
                disabled={sendingEmail}
                style={{
                  padding: '10px 20px',
                  borderRadius: '8px',
                  border: '1px solid #ddd',
                  backgroundColor: '#fff',
                  cursor: sendingEmail ? 'not-allowed' : 'pointer',
                  fontSize: '14px',
                  opacity: sendingEmail ? 0.6 : 1
                }}
              >
                Cancelar
              </button>
              <button
                onClick={handleSendEmail}
                disabled={sendingEmail}
                style={{
                  ...styles.btnEmail,
                  padding: '10px 24px',
                  fontSize: '14px',
                  ...(sendingEmail ? styles.btnDisabled : {})
                }}
              >
                {sendingEmail ? (
                  <>
                    <FaSpinner style={{ animation: 'spin 1s linear infinite' }} />
                    Enviando...
                  </>
                ) : (
                  <>
                    <FaPaperPlane /> Enviar Email
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Cotizaciones;