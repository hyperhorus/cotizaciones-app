const express = require('express');
const router = express.Router();
const { generarPDF } = require('../controllers/pdfController');

router.get('/cotizacion/:id', generarPDF);

module.exports = router;