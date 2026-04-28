const pool = require('../config/db');

// Generar folio automático
const generarFolio = async () => {
  const year = new Date().getFullYear();
  const [rows] = await pool.query(`
    SELECT COUNT(*) as total FROM cotizaciones 
    WHERE YEAR(fecha_cotizacion) = ?
  `, [year]);
  const consecutivo = (rows[0].total + 1).toString().padStart(4, '0');
  return `COT-${year}-${consecutivo}`;
};

// Obtener todas las cotizaciones
const getCotizaciones = async (req, res) => {
  try {
    const [rows] = await pool.query(`
      SELECT 
        c.id_cotizacion,
        c.folio,
        c.fecha_cotizacion,
        c.fecha_vigencia,
        c.moneda,
        c.subtotal,
        c.porcentaje_descuento,
        c.monto_descuento,
        c.iva_porcentaje,
        c.iva_monto,
        c.total,
        c.condiciones_pago,
        c.notas,
        c.created_at,
        cl.nombre AS cliente_nombre,
        cl.rfc AS cliente_rfc,
        cl.email AS cliente_email,
        cl.telefono AS cliente_telefono,
        v.nombre AS vendedor_nombre,
        ec.id_estatus,
        ec.clave AS estatus_clave,
        ec.nombre AS estatus_nombre,
        tp.nombre AS tipo_precio_nombre
      FROM cotizaciones c
      JOIN clientes cl ON c.id_cliente = cl.id_cliente
      LEFT JOIN vendedores v ON c.id_vendedor = v.id_vendedor
      JOIN estatus_cotizacion ec ON c.id_estatus = ec.id_estatus
      JOIN tipos_precio tp ON c.id_tipo_precio = tp.id_tipo_precio
      ORDER BY c.created_at DESC
    `);
    res.json(rows);
  } catch (error) {
    console.error('Error al obtener cotizaciones:', error);
    res.status(500).json({ message: 'Error al obtener cotizaciones' });
  }
};

// Obtener una cotización por ID con detalle
const getCotizacionById = async (req, res) => {
  try {
    const { id } = req.params;

    const [rows] = await pool.query(`
      SELECT 
        c.*,
        cl.nombre AS cliente_nombre,
        cl.rfc AS cliente_rfc,
        cl.email AS cliente_email,
        cl.telefono AS cliente_telefono,
        cl.direccion AS cliente_direccion,
        cl.ciudad AS cliente_ciudad,
        cl.estado AS cliente_estado,
        cl.codigo_postal AS cliente_cp,
        v.nombre AS vendedor_nombre,
        ec.clave AS estatus_clave,
        ec.nombre AS estatus_nombre,
        tp.nombre AS tipo_precio_nombre,
        tp.clave AS tipo_precio_clave
      FROM cotizaciones c
      JOIN clientes cl ON c.id_cliente = cl.id_cliente
      LEFT JOIN vendedores v ON c.id_vendedor = v.id_vendedor
      JOIN estatus_cotizacion ec ON c.id_estatus = ec.id_estatus
      JOIN tipos_precio tp ON c.id_tipo_precio = tp.id_tipo_precio
      WHERE c.id_cotizacion = ?
    `, [id]);

    if (rows.length === 0) {
      return res.status(404).json({ message: 'Cotización no encontrada' });
    }

    // Obtener detalle
    const [detalle] = await pool.query(`
      SELECT 
        dc.*,
        p.codigo_sku,
        p.nombre AS producto_nombre,
        p.unidad_medida
      FROM detalle_cotizacion dc
      JOIN productos p ON dc.id_producto = p.id_producto
      WHERE dc.id_cotizacion = ?
      ORDER BY dc.id_detalle ASC
    `, [id]);

    // Obtener historial
    const [historial] = await pool.query(`
      SELECT 
        h.*,
        ea.nombre AS estatus_anterior_nombre,
        en.nombre AS estatus_nuevo_nombre
      FROM historial_cotizacion h
      LEFT JOIN estatus_cotizacion ea ON h.id_estatus_anterior = ea.id_estatus
      JOIN estatus_cotizacion en ON h.id_estatus_nuevo = en.id_estatus
      WHERE h.id_cotizacion = ?
      ORDER BY h.fecha_cambio DESC
    `, [id]);

    res.json({
      ...rows[0],
      detalle,
      historial
    });
  } catch (error) {
    console.error('Error al obtener cotización:', error);
    res.status(500).json({ message: 'Error al obtener cotización' });
  }
};

// Crear una cotización
const createCotizacion = async (req, res) => {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    const {
      id_cliente,
      id_vendedor,
      id_tipo_precio,
      fecha_vigencia,
      moneda,
      tipo_cambio,
      porcentaje_descuento,
      iva_porcentaje,
      condiciones_pago,
      notas,
      detalle
    } = req.body;

    const folio = await generarFolio();
    const fecha_cotizacion = new Date().toISOString().split('T')[0];

    // Calcular totales
    let subtotal = 0;
    for (const item of detalle) {
      const descuentoLinea = (item.precio_unitario * item.cantidad) * (item.porcentaje_descuento || 0) / 100;
      const subtotalLinea = (item.precio_unitario * item.cantidad) - descuentoLinea;
      subtotal += subtotalLinea;
    }

    const monto_descuento = subtotal * (porcentaje_descuento || 0) / 100;
    const base_iva = subtotal - monto_descuento;
    const iva_monto = base_iva * (iva_porcentaje || 16) / 100;
    const total = base_iva + iva_monto;

    // Obtener estatus BORRADOR
    const [estatus] = await connection.query(`
      SELECT id_estatus FROM estatus_cotizacion WHERE clave = 'BORRADOR'
    `);
    const id_estatus = estatus[0].id_estatus;

    // Insertar cotización
    const [result] = await connection.query(`
      INSERT INTO cotizaciones 
        (folio, id_cliente, id_vendedor, id_tipo_precio, id_estatus,
         fecha_cotizacion, fecha_vigencia, moneda, tipo_cambio,
         subtotal, porcentaje_descuento, monto_descuento,
         iva_porcentaje, iva_monto, total, condiciones_pago, notas)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      folio, id_cliente, id_vendedor || null, id_tipo_precio, id_estatus,
      fecha_cotizacion, fecha_vigencia, moneda || 'MXN', tipo_cambio || 1,
      subtotal, porcentaje_descuento || 0, monto_descuento,
      iva_porcentaje || 16, iva_monto, total, condiciones_pago, notas
    ]);

    const id_cotizacion = result.insertId;

    // Insertar detalle
    for (const item of detalle) {
      const descuentoLinea = (item.precio_unitario * item.cantidad) * (item.porcentaje_descuento || 0) / 100;
      const subtotalLinea = (item.precio_unitario * item.cantidad) - descuentoLinea;

      await connection.query(`
        INSERT INTO detalle_cotizacion 
          (id_cotizacion, id_producto, cantidad, precio_unitario,
           porcentaje_descuento, monto_descuento, subtotal_linea, notas)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `, [
        id_cotizacion, item.id_producto, item.cantidad, item.precio_unitario,
        item.porcentaje_descuento || 0, descuentoLinea, subtotalLinea, item.notas || null
      ]);
    }

    // Registrar en historial
    await connection.query(`
      INSERT INTO historial_cotizacion 
        (id_cotizacion, id_estatus_anterior, id_estatus_nuevo, comentario, usuario)
      VALUES (?, NULL, ?, 'Cotización creada', 'Sistema')
    `, [id_cotizacion, id_estatus]);

    await connection.commit();

    res.status(201).json({
      message: 'Cotización creada exitosamente',
      id_cotizacion,
      folio
    });
  } catch (error) {
    await connection.rollback();
    console.error('Error al crear cotización:', error);
    res.status(500).json({ message: 'Error al crear cotización' });
  } finally {
    connection.release();
  }
};

// Actualizar estatus de cotización
const updateEstatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { id_estatus_nuevo, comentario, usuario } = req.body;

    // Obtener estatus actual
    const [current] = await pool.query(`
      SELECT id_estatus FROM cotizaciones WHERE id_cotizacion = ?
    `, [id]);

    if (current.length === 0) {
      return res.status(404).json({ message: 'Cotización no encontrada' });
    }

    const id_estatus_anterior = current[0].id_estatus;

    // Actualizar estatus
    await pool.query(`
      UPDATE cotizaciones SET id_estatus = ? WHERE id_cotizacion = ?
    `, [id_estatus_nuevo, id]);

    // Registrar en historial
    await pool.query(`
      INSERT INTO historial_cotizacion 
        (id_cotizacion, id_estatus_anterior, id_estatus_nuevo, comentario, usuario)
      VALUES (?, ?, ?, ?, ?)
    `, [id, id_estatus_anterior, id_estatus_nuevo, comentario || '', usuario || 'Sistema']);

    res.json({ message: 'Estatus actualizado exitosamente' });
  } catch (error) {
    console.error('Error al actualizar estatus:', error);
    res.status(500).json({ message: 'Error al actualizar estatus' });
  }
};

// Eliminar cotización (solo en borrador)
const deleteCotizacion = async (req, res) => {
  try {
    const { id } = req.params;

    const [current] = await pool.query(`
      SELECT c.id_cotizacion, ec.clave 
      FROM cotizaciones c
      JOIN estatus_cotizacion ec ON c.id_estatus = ec.id_estatus
      WHERE c.id_cotizacion = ?
    `, [id]);

    if (current.length === 0) {
      return res.status(404).json({ message: 'Cotización no encontrada' });
    }

    if (current[0].clave !== 'BORRADOR') {
      return res.status(400).json({ message: 'Solo se pueden eliminar cotizaciones en borrador' });
    }

    // Eliminar historial
    await pool.query(`DELETE FROM historial_cotizacion WHERE id_cotizacion = ?`, [id]);
    // Eliminar detalle
    await pool.query(`DELETE FROM detalle_cotizacion WHERE id_cotizacion = ?`, [id]);
    // Eliminar cotización
    await pool.query(`DELETE FROM cotizaciones WHERE id_cotizacion = ?`, [id]);

    res.json({ message: 'Cotización eliminada exitosamente' });
  } catch (error) {
    console.error('Error al eliminar cotización:', error);
    res.status(500).json({ message: 'Error al eliminar cotización' });
  }
};

// Obtener precios de un producto según tipo de precio
const getPreciosProducto = async (req, res) => {
  try {
    const { id_producto, id_tipo_precio } = req.params;

    const [rows] = await pool.query(`
      SELECT pp.*, tp.nombre AS tipo_precio_nombre
      FROM precios_producto pp
      JOIN tipos_precio tp ON pp.id_tipo_precio = tp.id_tipo_precio
      WHERE pp.id_producto = ? AND pp.id_tipo_precio = ? AND pp.activo = TRUE
      ORDER BY pp.cantidad_minima ASC
    `, [id_producto, id_tipo_precio]);

    res.json(rows);
  } catch (error) {
    console.error('Error al obtener precios:', error);
    res.status(500).json({ message: 'Error al obtener precios' });
  }
};

// Obtener estatus
const getEstatus = async (req, res) => {
  try {
    const [rows] = await pool.query(`
      SELECT * FROM estatus_cotizacion ORDER BY id_estatus ASC
    `);
    res.json(rows);
  } catch (error) {
    console.error('Error al obtener estatus:', error);
    res.status(500).json({ message: 'Error al obtener estatus' });
  }
};

// Obtener vendedores
const getVendedores = async (req, res) => {
  try {
    const [rows] = await pool.query(`
      SELECT * FROM vendedores WHERE activo = TRUE ORDER BY nombre ASC
    `);
    res.json(rows);
  } catch (error) {
    console.error('Error al obtener vendedores:', error);
    res.status(500).json({ message: 'Error al obtener vendedores' });
  }
};

module.exports = {
  getCotizaciones,
  getCotizacionById,
  createCotizacion,
  updateEstatus,
  deleteCotizacion,
  getPreciosProducto,
  getEstatus,
  getVendedores
};