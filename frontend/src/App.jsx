import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import Dashboard from './pages/Dashboard';
import Productos from './pages/Productos';
import Clientes from './pages/Clientes';
import Cotizaciones from './pages/Cotizaciones';

function App() {
  return (
    <Router>
      <div style={{ minHeight: '100vh', backgroundColor: '#f0f2f5' }}>
        <Navbar />
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/productos" element={<Productos />} />
          <Route path="/clientes" element={<Clientes />} />
          <Route path="/cotizaciones" element={<Cotizaciones />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;