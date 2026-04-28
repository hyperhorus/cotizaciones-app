const pool = require('../config/db');

// Estadísticas generales
const getEstadisticasGenerales = async (req, res) => {
  try {
    // Total de cotizaciones por estatus
    const [porEstatus] = await pool.query(`
      SELECT 
        ec.clave,
        ec.nombre,
        COUNT(c.id_cotizacion) AS total,
        COALESCE(SUM(c.total), 0) AS monto_total
      FROM estatus_cotizacion ec
      LEFT JOIN cotizaciones c ON ec.id_estatus = c.id_estatus
      GROUP BY ec.id_estatus, ec.clave, ec.nombre
      ORDER BY ec.id_estatus
    `);

    // Cotizaciones por mes (últimos 12 meses)
    const [porMes] = await pool.query(`
      SELECT 
        DATE_FORMAT(fecha_cotizacion, '%Y-%m') AS mes,
        DATE_FORMAT(fecha_cotizacion, '%b %Y') AS mes_nombre,
        COUNT(*) AS total_cotizaciones,
        SUM(total) AS monto_total,
        SUM(CASE WHEN ec.clave = 'ACEPTADA' THEN total ELSE 0 END) AS monto_aceptado
      FROM cotizaciones c
      JOIN estatus_cotizacion ec ON c.id_estatus = ec.id_estatus
      WHERE fecha_cotizacion >= DATE_SUB(CURDATE(), INTERVAL 12 MONTH)
      GROUP BY DATE_FORMAT(fecha_cotizacion, '%Y-%m'), DATE_FORMAT(fecha_cotizacion, '%b %Y')
      ORDER BY mes ASC
    `);

    // Top 10 clientes
    const [topClientes] = await pool.query(`
      SELECT 
        cl.nombre,
        COUNT(c.id_cotizacion) AS total_cotizaciones,
        SUM(c.total) AS monto_total,
        SUM(CASE WHEN ec.clave = 'ACEPTADA' THEN c.total ELSE 0 END) AS monto_aceptado
      FROM clientes cl
      JOIN cotizaciones c ON cl.id_cliente = c.id_cliente
      JOIN estatus_cotizacion ec ON c.id_estatus = ec.id_estatus
      GROUP BY cl.id_cliente, cl.nombre
      ORDER BY monto_total DESC
      LIMIT 10
    `);

    // Top 10 productos más cotizados
    const [topProductos] = await pool.query(`
      SELECT 
        p.nombre,
        p.codigo_sku,
        COUNT(dc.id_detalle) AS veces_cotizado,
        SUM(dc.cantidad) AS total_cantidad,
        SUM(dc.subtotal_linea) AS monto_total
      FROM productos p
      JOIN detalle_cotizacion dc ON p.id_producto = dc.id_producto
      GROUP BY p.id_producto, p.nombre, p.codigo_sku
      ORDER BY veces_cotizado DESC
      LIMIT 10
    `);

    // Cotizaciones por tipo de precio
    const [porTipoPrecio] = await pool.query(`
      SELECT 
        tp.nombre AS tipo_precio,
        COUNT(c.id_cotizacion) AS total,
        SUM(c.total) AS monto_total
      FROM tipos_precio tp
      LEFT JOIN cotizaciones c ON tp.id_tipo_precio = c.id_tipo_precio
      GROUP BY tp.id_tipo_precio, tp.nombre
      HAVING total > 0
      ORDER BY total DESC
    `);

    // Tasa de conversión
    const [conversion] = await pool.query(`
      SELECT 
        COUNT(*) AS total,
        SUM(CASE WHEN ec.clave = 'ACEPTADA' THEN 1 ELSE 0 END) AS aceptadas,
        SUM(CASE WHEN ec.clave = 'RECHAZADA' THEN 1 ELSE 0 END) AS rechazadas,
        SUM(CASE WHEN ec.clave = 'ENVIADA' THEN 1 ELSE 0 END) AS pendientes,
        SUM(CASE WHEN ec.clave = 'BORRADOR' THEN 1 ELSE 0 END) AS borradores
      FROM cotizaciones c
      JOIN estatus_cotizacion ec ON c.id_estatus = ec.id_estatus
    `);

    // Resumen general
    const [resumen] = await pool.query(`
      SELECT 
        (SELECT COUNT(*) FROM productos WHERE activo = TRUE) AS total_productos,
        (SELECT COUNT(*) FROM clientes WHERE activo = TRUE) AS total_clientes,
        (SELECT COUNT(*) FROM cotizaciones) AS total_cotizaciones,
        (SELECT COALESCE(SUM(total), 0) FROM cotizaciones c JOIN estatus_cotizacion ec ON c.id_estatus = ec.id_estatus WHERE ec.clave = 'ACEPTADA') AS monto_total_aceptado,
        (SELECT COUNT(*) FROM vendedores WHERE activo = TRUE) AS total_vendedores
    `);

    // Vendedores con más cotizaciones
    const [topVendedores] = await pool.query(`
      SELECT 
        v.nombre,
        COUNT(c.id_cotizacion) AS total_cotizaciones,
        SUM(c.total) AS monto_total,
        SUM(CASE WHEN ec.clave = 'ACEPTADA' THEN 1 ELSE 0 END) AS aceptadas
      FROM vendedores v
      JOIN cotizaciones c ON v.id_vendedor = c.id_vendedor
      JOIN estatus_cotizacion ec ON c.id_estatus = ec.id_estatus
      GROUP BY v.id_vendedor, v.nombre
      ORDER BY total_cotizaciones DESC
      LIMIT 5
    `);

    res.json({
      resumen: resumen[0],
      porEstatus,
      porMes,
      topClientes,
      topProductos,
      porTipoPrecio,
      conversion: conversion[0],
      topVendedores
    });

  } catch (error) {
    console.error('Error en dashboard:', error);
    res.status(500).json({ message: 'Error al obtener estadísticas' });
  }
};

module.exports = { getEstadisticasGenerales };