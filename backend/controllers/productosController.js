const pool = require('../config/db');

// Obtener todos los productos
const getProductos = async (req, res) => {
  try {
    const [rows] = await pool.query(`
      SELECT 
        p.id_producto,
        p.codigo_sku,
        p.codigo_barras,
        p.nombre,
        p.descripcion,
        p.unidad_medida,
        p.stock_actual,
        p.activo,
        c.nombre AS categoria,
        p.created_at
      FROM productos p
      LEFT JOIN categorias c ON p.id_categoria = c.id_categoria
      ORDER BY p.nombre ASC
    `);
    res.json(rows);
  } catch (error) {
    console.error('Error al obtener productos:', error);
    res.status(500).json({ message: 'Error al obtener productos' });
  }
};

// Obtener un producto por ID
const getProductoById = async (req, res) => {
  try {
    const { id } = req.params;
    const [rows] = await pool.query(`
      SELECT 
        p.*,
        c.nombre AS categoria
      FROM productos p
      LEFT JOIN categorias c ON p.id_categoria = c.id_categoria
      WHERE p.id_producto = ?
    `, [id]);

    if (rows.length === 0) {
      return res.status(404).json({ message: 'Producto no encontrado' });
    }

    // Obtener precios del producto
    const [precios] = await pool.query(`
      SELECT 
        pp.*,
        tp.nombre AS tipo_precio,
        tp.clave
      FROM precios_producto pp
      JOIN tipos_precio tp ON pp.id_tipo_precio = tp.id_tipo_precio
      WHERE pp.id_producto = ? AND pp.activo = TRUE
      ORDER BY pp.precio ASC
    `, [id]);

    res.json({ ...rows[0], precios });
  } catch (error) {
    console.error('Error al obtener producto:', error);
    res.status(500).json({ message: 'Error al obtener producto' });
  }
};

// Crear un producto
const createProducto = async (req, res) => {
  try {
    const {
      codigo_sku,
      codigo_barras,
      nombre,
      descripcion,
      id_categoria,
      unidad_medida,
      stock_actual,
      precios
    } = req.body;

    // Insertar producto
    const [result] = await pool.query(`
      INSERT INTO productos 
        (codigo_sku, codigo_barras, nombre, descripcion, id_categoria, unidad_medida, stock_actual)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `, [codigo_sku, codigo_barras, nombre, descripcion, id_categoria, unidad_medida, stock_actual || 0]);

    const id_producto = result.insertId;

    // Insertar precios si se proporcionan
    if (precios && precios.length > 0) {
      for (const precio of precios) {
        await pool.query(`
          INSERT INTO precios_producto 
            (id_producto, id_tipo_precio, precio, cantidad_minima, cantidad_maxima)
          VALUES (?, ?, ?, ?, ?)
        `, [
          id_producto,
          precio.id_tipo_precio,
          precio.precio,
          precio.cantidad_minima || 1,
          precio.cantidad_maxima || null
        ]);
      }
    }

    res.status(201).json({
      message: 'Producto creado exitosamente',
      id_producto
    });
  } catch (error) {
    console.error('Error al crear producto:', error);
    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(400).json({ message: 'El código SKU ya existe' });
    }
    res.status(500).json({ message: 'Error al crear producto' });
  }
};

// Actualizar un producto
const updateProducto = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      codigo_sku,
      codigo_barras,
      nombre,
      descripcion,
      id_categoria,
      unidad_medida,
      stock_actual,
      activo,
      precios
    } = req.body;

    await pool.query(`
      UPDATE productos SET
        codigo_sku = ?,
        codigo_barras = ?,
        nombre = ?,
        descripcion = ?,
        id_categoria = ?,
        unidad_medida = ?,
        stock_actual = ?,
        activo = ?
      WHERE id_producto = ?
    `, [codigo_sku, codigo_barras, nombre, descripcion, id_categoria, unidad_medida, stock_actual, activo, id]);

    // Actualizar precios
    if (precios && precios.length > 0) {
      // Desactivar precios anteriores
      await pool.query(`
        UPDATE precios_producto SET activo = FALSE WHERE id_producto = ?
      `, [id]);

      // Insertar nuevos precios
      for (const precio of precios) {
        await pool.query(`
          INSERT INTO precios_producto 
            (id_producto, id_tipo_precio, precio, cantidad_minima, cantidad_maxima, activo)
          VALUES (?, ?, ?, ?, ?, TRUE)
          ON DUPLICATE KEY UPDATE precio = ?, activo = TRUE
        `, [
          id,
          precio.id_tipo_precio,
          precio.precio,
          precio.cantidad_minima || 1,
          precio.cantidad_maxima || null,
          precio.precio
        ]);
      }
    }

    res.json({ message: 'Producto actualizado exitosamente' });
  } catch (error) {
    console.error('Error al actualizar producto:', error);
    res.status(500).json({ message: 'Error al actualizar producto' });
  }
};

// Eliminar un producto (soft delete)
const deleteProducto = async (req, res) => {
  try {
    const { id } = req.params;
    await pool.query(`
      UPDATE productos SET activo = FALSE WHERE id_producto = ?
    `, [id]);
    res.json({ message: 'Producto eliminado exitosamente' });
  } catch (error) {
    console.error('Error al eliminar producto:', error);
    res.status(500).json({ message: 'Error al eliminar producto' });
  }
};

// Obtener categorías
const getCategorias = async (req, res) => {
  try {
    const [rows] = await pool.query(`
      SELECT * FROM categorias WHERE activo = TRUE ORDER BY nombre ASC
    `);
    res.json(rows);
  } catch (error) {
    console.error('Error al obtener categorías:', error);
    res.status(500).json({ message: 'Error al obtener categorías' });
  }
};

// Obtener tipos de precio
const getTiposPrecios = async (req, res) => {
  try {
    const [rows] = await pool.query(`
      SELECT * FROM tipos_precio WHERE activo = TRUE ORDER BY nombre ASC
    `);
    res.json(rows);
  } catch (error) {
    console.error('Error al obtener tipos de precio:', error);
    res.status(500).json({ message: 'Error al obtener tipos de precio' });
  }
};

module.exports = {
  getProductos,
  getProductoById,
  createProducto,
  updateProducto,
  deleteProducto,
  getCategorias,
  getTiposPrecios
};