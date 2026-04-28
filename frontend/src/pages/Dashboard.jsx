import { useState, useEffect } from 'react';
import { getDashboardStats } from '../services/api';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  PieChart, Pie, Cell, LineChart, Line, AreaChart, Area
} from 'recharts';
import {
  FaBoxes, FaUsers, FaFileInvoiceDollar, FaDollarSign,
  FaChartLine, FaChartPie, FaTrophy, FaArrowUp
} from 'react-icons/fa';

const Dashboard = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      setLoading(true);
      const res = await getDashboardStats();
      setStats(res.data);
    } catch (error) {
      console.error('Error al cargar estadísticas:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatMoney = (amount) => {
    return `$${Number(amount).toLocaleString('es-MX', { minimumFractionDigits: 2 })}`;
  };

  const COLORS = ['#e94560', '#1a1a2e', '#16213e', '#0f3460', '#533483', '#e94560', '#2ecc71'];
  const STATUS_COLORS = {
    BORRADOR: '#64b5f6',
    ENVIADA: '#ffb74d',
    ACEPTADA: '#81c784',
    RECHAZADA: '#e57373',
    VENCIDA: '#bdbdbd',
    CANCELADA: '#ef5350'
  };

  const styles = {
    container: {
      padding: '20px',
      maxWidth: '1400px',
      margin: '0 auto',
      fontFamily: 'Segoe UI, sans-serif'
    },
    header: {
      marginBottom: '24px'
    },
    title: {
      fontSize: '24px',
      fontWeight: 'bold',
      color: '#1a1a2e',
      marginBottom: '4px'
    },
    subtitle: {
      fontSize: '14px',
      color: '#888'
    },
    kpiRow: {
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
      gap: '16px',
      marginBottom: '24px'
    },
    kpiCard: {
      backgroundColor: '#fff',
      borderRadius: '12px',
      padding: '20px',
      boxShadow: '0 2px 10px rgba(0,0,0,0.06)',
      display: 'flex',
      alignItems: 'center',
      gap: '16px',
      position: 'relative',
      overflow: 'hidden'
    },
    kpiIcon: {
      width: '56px',
      height: '56px',
      borderRadius: '14px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontSize: '22px',
      flexShrink: 0
    },
    kpiNumber: {
      fontSize: '28px',
      fontWeight: '700',
      color: '#1a1a2e',
      lineHeight: 1
    },
    kpiLabel: {
      fontSize: '12px',
      color: '#888',
      marginTop: '4px'
    },
    chartsRow: {
      display: 'grid',
      gridTemplateColumns: '1fr 1fr',
      gap: '20px',
      marginBottom: '24px'
    },
    chartCard: {
      backgroundColor: '#fff',
      borderRadius: '12px',
      padding: '20px',
      boxShadow: '0 2px 10px rgba(0,0,0,0.06)'
    },
    chartTitle: {
      fontSize: '15px',
      fontWeight: '700',
      color: '#1a1a2e',
      marginBottom: '16px',
      display: 'flex',
      alignItems: 'center',
      gap: '8px'
    },
    fullWidth: {
      gridColumn: '1 / -1'
    },
    tableSmall: {
      width: '100%',
      borderCollapse: 'collapse',
      fontSize: '13px'
    },
    tableHead: {
      backgroundColor: '#f8f9fa',
      fontWeight: '600',
      padding: '10px 12px',
      textAlign: 'left',
      color: '#333',
      borderBottom: '2px solid #eee'
    },
    tableCell: {
      padding: '10px 12px',
      borderBottom: '1px solid #f0f0f0'
    },
    conversionCard: {
      backgroundColor: '#1a1a2e',
      borderRadius: '12px',
      padding: '24px',
      color: '#fff',
      textAlign: 'center'
    }
  };

  if (loading || !stats) {
    return (
      <div style={{ ...styles.container, textAlign: 'center', marginTop: '100px' }}>
        <h2>Cargando dashboard...</h2>
      </div>
    );
  }

  const tasaConversion = stats.conversion.total > 0
    ? ((stats.conversion.aceptadas / stats.conversion.total) * 100).toFixed(1)
    : 0;

  // Datos para pie chart de estatus
  const estatusData = stats.porEstatus
    .filter(e => e.total > 0)
    .map(e => ({
      name: e.nombre,
      value: e.total,
      color: STATUS_COLORS[e.clave] || '#ccc'
    }));

  return (
    <div style={styles.container}>
      {/* HEADER */}
      <div style={styles.header}>
        <h1 style={styles.title}>📊 Dashboard</h1>
        <p style={styles.subtitle}>
          Resumen general del sistema de cotizaciones · Actualizado: {new Date().toLocaleString('es-MX')}
        </p>
      </div>

      {/* KPIs */}
      <div style={styles.kpiRow}>
        <div style={styles.kpiCard}>
          <div style={{ ...styles.kpiIcon, backgroundColor: '#e3f2fd', color: '#1565c0' }}>
            <FaBoxes />
          </div>
          <div>
            <div style={styles.kpiNumber}>{stats.resumen.total_productos}</div>
            <div style={styles.kpiLabel}>Productos Activos</div>
          </div>
        </div>
        <div style={styles.kpiCard}>
          <div style={{ ...styles.kpiIcon, backgroundColor: '#f3e5f5', color: '#7b1fa2' }}>
            <FaUsers />
          </div>
          <div>
            <div style={styles.kpiNumber}>{stats.resumen.total_clientes}</div>
            <div style={styles.kpiLabel}>Clientes Activos</div>
          </div>
        </div>
        <div style={styles.kpiCard}>
          <div style={{ ...styles.kpiIcon, backgroundColor: '#fff3e0', color: '#e65100' }}>
            <FaFileInvoiceDollar />
          </div>
          <div>
            <div style={styles.kpiNumber}>{stats.resumen.total_cotizaciones}</div>
            <div style={styles.kpiLabel}>Total Cotizaciones</div>
          </div>
        </div>
        <div style={styles.kpiCard}>
          <div style={{ ...styles.kpiIcon, backgroundColor: '#e8f5e9', color: '#2e7d32' }}>
            <FaDollarSign />
          </div>
          <div>
            <div style={{ ...styles.kpiNumber, fontSize: '22px' }}>
              {formatMoney(stats.resumen.monto_total_aceptado)}
            </div>
            <div style={styles.kpiLabel}>Monto Total Aceptado</div>
          </div>
        </div>
      </div>

      {/* GRÁFICAS FILA 1 */}
      <div style={styles.chartsRow}>
        {/* Gráfica de barras - Cotizaciones por mes */}
        <div style={{ ...styles.chartCard, ...styles.fullWidth }}>
          <div style={styles.chartTitle}>
            <FaChartLine color="#e94560" /> Cotizaciones por Mes (Últimos 12 meses)
          </div>
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={stats.porMes}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="mes_nombre" fontSize={11} />
              <YAxis fontSize={11} />
              <Tooltip
                formatter={(value, name) => {
                  if (name === 'monto_total' || name === 'monto_aceptado') return formatMoney(value);
                  return value;
                }}
              />
              <Legend />
              <Area
                type="monotone"
                dataKey="total_cotizaciones"
                name="Cotizaciones"
                stroke="#1a1a2e"
                fill="#1a1a2e"
                fillOpacity={0.1}
              />
              <Area
                type="monotone"
                dataKey="monto_aceptado"
                name="Monto Aceptado"
                stroke="#e94560"
                fill="#e94560"
                fillOpacity={0.1}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Pie chart - Estatus */}
        <div style={styles.chartCard}>
          <div style={styles.chartTitle}>
            <FaChartPie color="#e94560" /> Cotizaciones por Estatus
          </div>
          <ResponsiveContainer width="100%" height={280}>
            <PieChart>
              <Pie
                data={estatusData}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={100}
                paddingAngle={3}
                dataKey="value"
                label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                labelLine={true}
                fontSize={11}
              >
                {estatusData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Tasa de conversión */}
        <div style={styles.conversionCard}>
          <div style={{ fontSize: '14px', marginBottom: '12px', opacity: 0.8 }}>
            📈 TASA DE CONVERSIÓN
          </div>
          <div style={{ fontSize: '56px', fontWeight: '800', color: '#e94560', lineHeight: 1 }}>
            {tasaConversion}%
          </div>
          <div style={{ marginTop: '16px', display: 'flex', justifyContent: 'center', gap: '24px', fontSize: '13px' }}>
            <div>
              <div style={{ fontSize: '20px', fontWeight: '700' }}>{stats.conversion.aceptadas}</div>
              <div style={{ opacity: 0.6 }}>Aceptadas</div>
            </div>
            <div>
              <div style={{ fontSize: '20px', fontWeight: '700' }}>{stats.conversion.rechazadas}</div>
              <div style={{ opacity: 0.6 }}>Rechazadas</div>
            </div>
            <div>
              <div style={{ fontSize: '20px', fontWeight: '700' }}>{stats.conversion.pendientes}</div>
              <div style={{ opacity: 0.6 }}>Pendientes</div>
            </div>
            <div>
              <div style={{ fontSize: '20px', fontWeight: '700' }}>{stats.conversion.borradores}</div>
              <div style={{ opacity: 0.6 }}>Borradores</div>
            </div>
          </div>
        </div>
      </div>

      {/* GRÁFICAS FILA 2 */}
      <div style={styles.chartsRow}>
        {/* Cotizaciones por tipo de precio */}
        <div style={styles.chartCard}>
          <div style={styles.chartTitle}>
            <FaChartPie color="#e94560" /> Por Tipo de Precio
          </div>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={stats.porTipoPrecio} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis type="number" fontSize={11} />
              <YAxis type="category" dataKey="tipo_precio" fontSize={10} width={120} />
              <Tooltip />
              <Bar dataKey="total" name="Cotizaciones" fill="#1a1a2e" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Top vendedores */}
        <div style={styles.chartCard}>
          <div style={styles.chartTitle}>
            <FaTrophy color="#e94560" /> Top Vendedores
          </div>
          {stats.topVendedores.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px', color: '#999' }}>
              No hay datos de vendedores
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={stats.topVendedores}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="nombre" fontSize={10} />
                <YAxis fontSize={11} />
                <Tooltip
                  formatter={(value, name) => {
                    if (name === 'Monto Total') return formatMoney(value);
                    return value;
                  }}
                />
                <Legend />
                <Bar dataKey="total_cotizaciones" name="Cotizaciones" fill="#1a1a2e" radius={[4, 4, 0, 0]} />
                <Bar dataKey="aceptadas" name="Aceptadas" fill="#e94560" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* TABLAS */}
      <div style={styles.chartsRow}>
        {/* Top Clientes */}
        <div style={styles.chartCard}>
          <div style={styles.chartTitle}>
            <FaTrophy color="#e94560" /> Top 10 Clientes
          </div>
          <table style={styles.tableSmall}>
            <thead>
              <tr>
                <th style={styles.tableHead}>#</th>
                <th style={styles.tableHead}>Cliente</th>
                <th style={{ ...styles.tableHead, textAlign: 'center' }}>Cotizaciones</th>
                <th style={{ ...styles.tableHead, textAlign: 'right' }}>Monto Total</th>
                <th style={{ ...styles.tableHead, textAlign: 'right' }}>Monto Aceptado</th>
              </tr>
            </thead>
            <tbody>
              {stats.topClientes.map((cliente, index) => (
                <tr key={index}>
                  <td style={styles.tableCell}>
                    {index < 3 ? ['🥇', '🥈', '🥉'][index] : index + 1}
                  </td>
                  <td style={{ ...styles.tableCell, fontWeight: '600' }}>{cliente.nombre}</td>
                  <td style={{ ...styles.tableCell, textAlign: 'center' }}>{cliente.total_cotizaciones}</td>
                  <td style={{ ...styles.tableCell, textAlign: 'right' }}>{formatMoney(cliente.monto_total)}</td>
                  <td style={{
                    ...styles.tableCell,
                    textAlign: 'right',
                    color: '#2e7d32',
                    fontWeight: '600'
                  }}>
                    {formatMoney(cliente.monto_aceptado)}
                  </td>
                </tr>
              ))}
              {stats.topClientes.length === 0 && (
                <tr><td colSpan="5" style={{ ...styles.tableCell, textAlign: 'center', color: '#999' }}>Sin datos</td></tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Top Productos */}
        <div style={styles.chartCard}>
          <div style={styles.chartTitle}>
            <FaTrophy color="#e94560" /> Top 10 Productos Cotizados
          </div>
          <table style={styles.tableSmall}>
            <thead>
              <tr>
                <th style={styles.tableHead}>#</th>
                <th style={styles.tableHead}>Producto</th>
                <th style={{ ...styles.tableHead, textAlign: 'center' }}>Veces</th>
                <th style={{ ...styles.tableHead, textAlign: 'center' }}>Cantidad</th>
                <th style={{ ...styles.tableHead, textAlign: 'right' }}>Monto</th>
              </tr>
            </thead>
            <tbody>
              {stats.topProductos.map((producto, index) => (
                <tr key={index}>
                  <td style={styles.tableCell}>
                    {index < 3 ? ['🥇', '🥈', '🥉'][index] : index + 1}
                  </td>
                  <td style={styles.tableCell}>
                    <div style={{ fontWeight: '600' }}>{producto.nombre}</div>
                    <div style={{ fontSize: '11px', color: '#888' }}>{producto.codigo_sku}</div>
                  </td>
                  <td style={{ ...styles.tableCell, textAlign: 'center' }}>{producto.veces_cotizado}</td>
                  <td style={{ ...styles.tableCell, textAlign: 'center' }}>{producto.total_cantidad}</td>
                  <td style={{
                    ...styles.tableCell,
                    textAlign: 'right',
                    fontWeight: '600',
                    color: '#e94560'
                  }}>
                    {formatMoney(producto.monto_total)}
                  </td>
                </tr>
              ))}
              {stats.topProductos.length === 0 && (
                <tr><td colSpan="5" style={{ ...styles.tableCell, textAlign: 'center', color: '#999' }}>Sin datos</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;