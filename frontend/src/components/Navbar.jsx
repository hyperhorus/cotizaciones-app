import { Link, useLocation } from 'react-router-dom';
import { FaBoxes, FaUsers, FaFileInvoiceDollar, FaChartBar } from 'react-icons/fa';

const Navbar = () => {
  const location = useLocation();

  const navStyle = {
    display: 'flex',
    alignItems: 'center',
    backgroundColor: '#1a1a2e',
    padding: '0 20px',
    height: '60px',
    color: '#fff',
    boxShadow: '0 2px 10px rgba(0,0,0,0.3)'
  };

  const linkStyle = {
    color: '#ccc',
    textDecoration: 'none',
    padding: '8px 16px',
    borderRadius: '6px',
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    fontSize: '14px',
    transition: 'all 0.3s'
  };

  const activeLinkStyle = {
    ...linkStyle,
    color: '#fff',
    backgroundColor: '#16213e'
  };

  const isActive = (path) => location.pathname === path;

  return (
    <nav style={navStyle}>
      <h2 style={{ marginRight: '40px', fontSize: '18px', color: '#e94560' }}>
        📋 Cotizaciones App
      </h2>
      <div style={{ display: 'flex', gap: '8px' }}>
        <Link to="/" style={isActive('/') ? activeLinkStyle : linkStyle}>
          <FaChartBar /> Dashboard
        </Link>
        <Link to="/productos" style={isActive('/productos') ? activeLinkStyle : linkStyle}>
          <FaBoxes /> Productos
        </Link>
        <Link to="/clientes" style={isActive('/clientes') ? activeLinkStyle : linkStyle}>
          <FaUsers /> Clientes
        </Link>
        <Link to="/cotizaciones" style={isActive('/cotizaciones') ? activeLinkStyle : linkStyle}>
          <FaFileInvoiceDollar /> Cotizaciones
        </Link>
      </div>
    </nav>
  );
};

export default Navbar;