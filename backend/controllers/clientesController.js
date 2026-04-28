const pool = require('../config/db');

// Obtener todos los clientes
const getClientes = async (req, res) => {
  try {
    const [rows] = await pool.query(`
      SELECT 
        cl.id_cliente,
        cl.tipo_cliente,
        cl.nombre,
        cl.razon_social,
        cl.rfc,
        cl.email,
        cl.telefono,
        cl.direccion,
        cl.ciudad,
        cl.estado,
        cl.codigo_postal,
        cl.activo,
        cl.created_at,
        tp.nombre AS tipo_precio_nombre,
        tp.clave AS tipo_precio_clave
      FROM clientes cl
      LEFT JOIN tipos_precio tp ON cl.id_tipo_precio_asignado = tp.id_tipo_precio
      ORDER BY cl.nombre ASC
    `);
    res.json(rows);
  } catch (error) {
    console.error('Error al obtener clientes:', error);
    res.status(500).json({ message: 'Error al obtener clientes' });
  }
};

// Obtener un cliente por ID
const getClienteById = async (req, res) => {
  try {
    const { id } = req.params;
    const [rows] = await pool.query(`
      SELECT 
        cl.*,
        tp.nombre AS tipo_precio_nombre,
        tp.clave AS tipo_precio_clave
      FROM clientes cl
      LEFT JOIN tipos_precio tp ON cl.id_tipo_precio_asignado = tp.id_tipo_precio
      WHERE cl.id_cliente = ?
    `, [id]);

    if (rows.length === 0) {
      return res.status(404).json({ message: 'Cliente no encontrado' });
    }

    // Obtener cotizaciones del cliente
    const [cotizaciones] = await pool.query(`
      SELECT 
        c.id_cotizacion,
        c.folio,
        c.fecha_cotizacion,
        c.total,
        c.moneda,
        ec.nombre AS estatus
      FROM cotizaciones c
      JOIN estatus_cotizacion ec ON c.id_estatus = ec.id_estatus
      WHERE c.id_cliente = ?
      ORDER BY c.fecha_cotizacion DESC
      LIMIT 10
    `, [id]);

    res.json({ ...rows[0], cotizaciones });
  } catch (error) {
    console.error('Error al obtener cliente:', error);
    res.status(500).json({ message: 'Error al obtener cliente' });
  }
};

// Crear un cliente
const createCliente = async (req, res) => {
  try {
    const {
      tipo_cliente,
      nombre,
      razon_social,
      rfc,
      email,
      telefono,
      direccion,
      ciudad,
      estado,
      codigo_postal,
      id_tipo_precio_asignado
    } = req.body;

    const [result] = await pool.query(`
      INSERT INTO clientes 
        (tipo_cliente, nombre, razon_social, rfc, email, telefono, 
         direccion, ciudad, estado, codigo_postal, id_tipo_precio_asignado)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      tipo_cliente, nombre, razon_social, rfc, email, telefono,
      direccion, ciudad, estado, codigo_postal, id_tipo_precio_asignado || null
    ]);

    res.status(201).json({
      message: 'Cliente creado exitosamente',
      id_cliente: result.insertId
    });
  } catch (error) {
    console.error('Error al crear cliente:', error);
    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(400).json({ message: 'El RFC ya está registrado' });
    }
    res.status(500).json({ message: 'Error al crear cliente' });
  }
};

// Actualizar un cliente
const updateCliente = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      tipo_cliente,
      nombre,
      razon_social,
      rfc,
      email,
      telefono,
      direccion,
      ciudad,
      estado,
      codigo_postal,
      id_tipo_precio_asignado,
      activo
    } = req.body;

    await pool.query(`
      UPDATE clientes SET
        tipo_cliente = ?,
        nombre = ?,
        razon_social = ?,
        rfc = ?,
        email = ?,
        telefono = ?,
        direccion = ?,
        ciudad = ?,
        estado = ?,
        codigo_postal = ?,
        id_tipo_precio_asignado = ?,
        activo = ?
      WHERE id_cliente = ?
    `, [
      tipo_cliente, nombre, razon_social, rfc, email, telefono,
      direccion, ciudad, estado, codigo_postal,
      id_tipo_precio_asignado || null, activo, id
    ]);

    res.json({ message: 'Cliente actualizado exitosamente' });
  } catch (error) {
    console.error('Error al actualizar cliente:', error);
    res.status(500).json({ message: 'Error al actualizar cliente' });
  }
};

// Eliminar un cliente (soft delete)
const deleteCliente = async (req, res) => {
  try {
    const { id } = req.params;

    // Verificar si tiene cotizaciones
    const [cotizaciones] = await pool.query(`
      SELECT COUNT(*) as total FROM cotizaciones WHERE id_cliente = ?
    `, [id]);

    if (cotizaciones[0].total > 0) {
      // Soft delete si tiene cotizaciones
      await pool.query(`
        UPDATE clientes SET activo = FALSE WHERE id_cliente = ?
      `, [id]);
      return res.json({ message: 'Cliente desactivado (tiene cotizaciones asociadas)' });
    }

    await pool.query(`
      UPDATE clientes SET activo = FALSE WHERE id_cliente = ?
    `, [id]);

    res.json({ message: 'Cliente eliminado exitosamente' });
  } catch (error) {
    console.error('Error al eliminar cliente:', error);
    res.status(500).json({ message: 'Error al eliminar cliente' });
  }
};

// Obtener estadísticas del cliente
const getClienteStats = async (req, res) => {
  try {
    const { id } = req.params;

    const [stats] = await pool.query(`
      SELECT 
        COUNT(c.id_cotizacion) AS total_cotizaciones,
        SUM(CASE WHEN ec.clave = 'ACEPTADA' THEN 1 ELSE 0 END) AS cotizaciones_aceptadas,
        SUM(CASE WHEN ec.clave = 'RECHAZADA' THEN 1 ELSE 0 END) AS cotizaciones_rechazadas,
        SUM(CASE WHEN ec.clave = 'ACEPTADA' THEN c.total ELSE 0 END) AS monto_total_aceptado,
        MAX(c.fecha_cotizacion) AS ultima_cotizacion
      FROM cotizaciones c
      JOIN estatus_cotizacion ec ON c.id_estatus = ec.id_estatus
      WHERE c.id_cliente = ?
    `, [id]);

    res.json(stats[0]);
  } catch (error) {
    console.error('Error al obtener estadísticas:', error);
    res.status(500).json({ message: 'Error al obtener estadísticas' });
  }
};

module.exports = {
  getClientes,
  getClienteById,
  createCliente,
  updateCliente,
  deleteCliente,
  getClienteStats
};