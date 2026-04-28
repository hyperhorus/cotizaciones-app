const express = require('express');
const router = express.Router();
const { getEstadisticasGenerales } = require('../controllers/dashboardController');

router.get('/stats', getEstadisticasGenerales);

module.exports = router;