const express = require('express');
const router = express.Router();
const {
  getCotizaciones,
  getCotizacionById,
  createCotizacion,
  updateEstatus,
  deleteCotizacion,
  getPreciosProducto,
  getEstatus,
  getVendedores
} = require('../controllers/cotizacionesController');

// Auxiliares
router.get('/estatus', getEstatus);
router.get('/vendedores', getVendedores);
router.get('/precios/:id_producto/:id_tipo_precio', getPreciosProducto);

// CRUD
router.get('/', getCotizaciones);
router.get('/:id', getCotizacionById);
router.post('/', createCotizacion);
router.patch('/:id/estatus', updateEstatus);
router.delete('/:id', deleteCotizacion);

module.exports = router;