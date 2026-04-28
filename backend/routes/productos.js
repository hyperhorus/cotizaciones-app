const express = require('express');
const router = express.Router();
const {
  getProductos,
  getProductoById,
  createProducto,
  updateProducto,
  deleteProducto,
  getCategorias,
  getTiposPrecios
} = require('../controllers/productosController');

// Rutas auxiliares
router.get('/categorias', getCategorias);
router.get('/tipos-precios', getTiposPrecios);

// CRUD Productos
router.get('/', getProductos);
router.get('/:id', getProductoById);
router.post('/', createProducto);
router.put('/:id', updateProducto);
router.delete('/:id', deleteProducto);

module.exports = router;