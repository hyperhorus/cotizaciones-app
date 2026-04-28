const express = require('express');
const cors = require('cors');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 4000;

// Middlewares
app.use(cors());
app.use(express.json());

// Rutas
const productosRoutes = require('./routes/productos');
const clientesRoutes = require('./routes/clientes');
const cotizacionesRoutes = require('./routes/cotizaciones');
const pdfRoutes = require('./routes/pdf');
const emailRoutes = require('./routes/email');
const dashboardRoutes = require('./routes/dashboard');

app.use('/api/productos', productosRoutes);
app.use('/api/clientes', clientesRoutes);
app.use('/api/cotizaciones', cotizacionesRoutes);
app.use('/api/pdf', pdfRoutes);
app.use('/api/email', emailRoutes);
app.use('/api/dashboard', dashboardRoutes);

// Ruta de prueba
app.get('/api', (req, res) => {
  res.json({ message: '🚀 API de Cotizaciones funcionando' });
});

app.listen(PORT, () => {
  console.log(`🚀 Servidor corriendo en http://localhost:${PORT}`);
});