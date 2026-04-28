const express = require('express');
const router = express.Router();
const {
  getClientes,
  getClienteById,
  createCliente,
  updateCliente,
  deleteCliente,
  getClienteStats
} = require('../controllers/clientesController');

router.get('/', getClientes);
router.get('/:id', getClienteById);
router.get('/:id/stats', getClienteStats);
router.post('/', createCliente);
router.put('/:id', updateCliente);
router.delete('/:id', deleteCliente);

module.exports = router;