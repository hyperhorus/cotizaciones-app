const express = require('express');
const router = express.Router();
const { enviarCotizacionEmail } = require('../controllers/emailController');

router.post('/cotizacion/:id', enviarCotizacionEmail);

module.exports = router;