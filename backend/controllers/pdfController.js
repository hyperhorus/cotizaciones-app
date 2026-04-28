const PDFDocument = require('pdfkit');
const pool = require('../config/db');

const generarPDF = async (req, res) => {
  try {
    const { id } = req.params;

    // Obtener cotización
    const [cotRows] = await pool.query(`
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
        ec.nombre AS estatus_nombre,
        tp.nombre AS tipo_precio_nombre
      FROM cotizaciones c
      JOIN clientes cl ON c.id_cliente = cl.id_cliente
      LEFT JOIN vendedores v ON c.id_vendedor = v.id_vendedor
      JOIN estatus_cotizacion ec ON c.id_estatus = ec.id_estatus
      JOIN tipos_precio tp ON c.id_tipo_precio = tp.id_tipo_precio
      WHERE c.id_cotizacion = ?
    `, [id]);

    if (cotRows.length === 0) {
      return res.status(404).json({ message: 'Cotización no encontrada' });
    }

    const cotizacion = cotRows[0];

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

    // Crear PDF
    const doc = new PDFDocument({
      size: 'LETTER',
      margin: 50,
      info: {
        Title: `Cotización ${cotizacion.folio}`,
        Author: 'Sistema de Cotizaciones'
      }
    });

    // Headers de respuesta
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `inline; filename=cotizacion-${cotizacion.folio}.pdf`);
    doc.pipe(res);

    // ============ COLORES ============
    const primaryColor = '#1a1a2e';
    const accentColor = '#e94560';
    const grayColor = '#666666';
    const lightGray = '#f5f5f5';

    // ============ ENCABEZADO ============
    // Rectángulo superior
    doc.rect(0, 0, doc.page.width, 120).fill(primaryColor);

    // Nombre de la empresa
    doc.font('Helvetica-Bold')
      .fontSize(22)
      .fillColor('#ffffff')
      .text('Icaro Trading', 50, 30);

    doc.font('Helvetica')
      .fontSize(9)
      .fillColor('#cccccc')
      .text('Av. Principal #123, Col. Centro, Ciudad de México, C.P. 06000', 50, 55)
      .text('Tel: (55) 1234-5678 | ventas@miempresa.com | www.miempresa.com', 50, 67);

    // Folio
    doc.font('Helvetica-Bold')
      .fontSize(16)
      .fillColor('#ffffff')
      .text('COTIZACIÓN', 400, 30, { align: 'right', width: 162 });

    doc.font('Helvetica-Bold')
      .fontSize(14)
      .fillColor(accentColor)
      .text(cotizacion.folio, 400, 52, { align: 'right', width: 162 });

    // Fecha y vigencia en header
    doc.font('Helvetica')
      .fontSize(8)
      .fillColor('#cccccc')
      .text(`Fecha: ${new Date(cotizacion.fecha_cotizacion).toLocaleDateString('es-MX')}`, 400, 72, { align: 'right', width: 162 })
      .text(`Vigencia: ${new Date(cotizacion.fecha_vigencia).toLocaleDateString('es-MX')}`, 400, 83, { align: 'right', width: 162 })
      .text(`Estatus: ${cotizacion.estatus_nombre}`, 400, 94, { align: 'right', width: 162 });

    let y = 140;

    // ============ DATOS DEL CLIENTE ============
    doc.rect(50, y, 512, 22).fill(primaryColor);
    doc.font('Helvetica-Bold')
      .fontSize(10)
      .fillColor('#ffffff')
      .text('DATOS DEL CLIENTE', 58, y + 6);

    y += 30;

    // Caja de datos del cliente
    doc.rect(50, y, 512, 70).fill(lightGray).stroke('#dddddd');

    doc.font('Helvetica-Bold').fontSize(9).fillColor(primaryColor);
    doc.text('Cliente:', 58, y + 8);
    doc.text('RFC:', 58, y + 22);
    doc.text('Teléfono:', 58, y + 36);
    doc.text('Dirección:', 58, y + 50);

    doc.font('Helvetica').fontSize(9).fillColor(grayColor);
    doc.text(cotizacion.cliente_nombre, 130, y + 8);
    doc.text(cotizacion.cliente_rfc || 'N/A', 130, y + 22);
    doc.text(cotizacion.cliente_telefono || 'N/A', 130, y + 36);

    const direccionCompleta = [
      cotizacion.cliente_direccion,
      cotizacion.cliente_ciudad,
      cotizacion.cliente_estado,
      cotizacion.cliente_cp ? `C.P. ${cotizacion.cliente_cp}` : ''
    ].filter(Boolean).join(', ') || 'N/A';
    doc.text(direccionCompleta, 130, y + 50, { width: 420 });

    // Email y vendedor (columna derecha)
    doc.font('Helvetica-Bold').fontSize(9).fillColor(primaryColor);
    doc.text('Email:', 340, y + 8);
    doc.text('Vendedor:', 340, y + 22);
    doc.text('Tipo Precio:', 340, y + 36);
    doc.text('Moneda:', 340, y + 50);

    doc.font('Helvetica').fontSize(9).fillColor(grayColor);
    doc.text(cotizacion.cliente_email || 'N/A', 420, y + 8);
    doc.text(cotizacion.vendedor_nombre || 'N/A', 420, y + 22);
    doc.text(cotizacion.tipo_precio_nombre, 420, y + 36);
    doc.text(cotizacion.moneda, 420, y + 50);

    y += 85;

    // ============ TABLA DE PRODUCTOS ============
    doc.rect(50, y, 512, 22).fill(primaryColor);
    doc.font('Helvetica-Bold').fontSize(10).fillColor('#ffffff');
    doc.text('DETALLE DE PRODUCTOS', 58, y + 6);
    y += 28;

    // Header de la tabla
    const tableTop = y;
    const colX = {
      num: 50,
      sku: 75,
      producto: 145,
      unidad: 310,
      cantidad: 350,
      precio: 400,
      desc: 460,
      subtotal: 505
    };

    doc.rect(50, tableTop, 512, 18).fill('#e8e8e8');
    doc.font('Helvetica-Bold').fontSize(7.5).fillColor(primaryColor);
    doc.text('#', colX.num + 4, tableTop + 5);
    doc.text('SKU', colX.sku, tableTop + 5);
    doc.text('PRODUCTO', colX.producto, tableTop + 5);
    doc.text('UNIDAD', colX.unidad, tableTop + 5);
    doc.text('CANT.', colX.cantidad, tableTop + 5);
    doc.text('P. UNIT.', colX.precio, tableTop + 5);
    doc.text('DESC.', colX.desc, tableTop + 5);
    doc.text('SUBTOTAL', colX.subtotal, tableTop + 5);

    y = tableTop + 22;

    // Filas de productos
    detalle.forEach((item, index) => {
      // Verificar si necesitamos nueva página
      if (y > 650) {
        doc.addPage();
        y = 50;
      }

      const bgColor = index % 2 === 0 ? '#ffffff' : '#fafafa';
      doc.rect(50, y, 512, 18).fill(bgColor);

      doc.font('Helvetica').fontSize(8).fillColor(grayColor);
      doc.text((index + 1).toString(), colX.num + 4, y + 5);
      doc.text(item.codigo_sku, colX.sku, y + 5);

      doc.font('Helvetica-Bold').fontSize(8).fillColor(primaryColor);
      doc.text(item.producto_nombre, colX.producto, y + 5, { width: 160 });

      doc.font('Helvetica').fontSize(8).fillColor(grayColor);
      doc.text(item.unidad_medida, colX.unidad, y + 5);
      doc.text(item.cantidad.toString(), colX.cantidad + 5, y + 5);
      doc.text(`
$$
{Number(item.precio_unitario).toLocaleString('es-MX', { minimumFractionDigits: 2 })}`, colX.precio - 5, y + 5);
      doc.text(item.porcentaje_descuento > 0 ? `${item.porcentaje_descuento}%` : '—', colX.desc + 5, y + 5);

      doc.font('Helvetica-Bold').fontSize(8).fillColor(primaryColor);
      doc.text(
        `
$$
{Number(item.subtotal_linea).toLocaleString('es-MX', { minimumFractionDigits: 2 })}`,
        colX.subtotal - 5, y + 5
      );

      y += 20;
    });

    // Línea separadora
    doc.moveTo(50, y).lineTo(562, y).stroke('#dddddd');
    y += 10;

    // ============ TOTALES ============
    const totalesX = 400;
    const totalesValueX = 500;

    // Subtotal
    doc.font('Helvetica').fontSize(9).fillColor(grayColor);
    doc.text('Subtotal:', totalesX, y, { width: 80, align: 'right' });
    doc.font('Helvetica').fontSize(9).fillColor(primaryColor);
    doc.text(
      `
$$
{Number(cotizacion.subtotal).toLocaleString('es-MX', { minimumFractionDigits: 2 })} ${cotizacion.moneda}`,
      totalesValueX, y, { width: 62, align: 'right' }
    );
    y += 16;

    // Descuento
    if (parseFloat(cotizacion.porcentaje_descuento) > 0) {
      doc.font('Helvetica').fontSize(9).fillColor(grayColor);
      doc.text(`Descuento (${cotizacion.porcentaje_descuento}%):`, totalesX, y, { width: 80, align: 'right' });
      doc.font('Helvetica').fontSize(9).fillColor(accentColor);
      doc.text(
        `-
$$
{Number(cotizacion.monto_descuento).toLocaleString('es-MX', { minimumFractionDigits: 2 })}`,
        totalesValueX, y, { width: 62, align: 'right' }
      );
      y += 16;
    }

    // IVA
    doc.font('Helvetica').fontSize(9).fillColor(grayColor);
    doc.text(`IVA (${cotizacion.iva_porcentaje}%):`, totalesX, y, { width: 80, align: 'right' });
    doc.font('Helvetica').fontSize(9).fillColor(primaryColor);
    doc.text(
      `
$$
{Number(cotizacion.iva_monto).toLocaleString('es-MX', { minimumFractionDigits: 2 })} ${cotizacion.moneda}`,
      totalesValueX, y, { width: 62, align: 'right' }
    );
    y += 20;

    // Total
    doc.rect(totalesX - 10, y - 4, 182, 26).fill(primaryColor);
    doc.font('Helvetica-Bold').fontSize(11).fillColor('#ffffff');
    doc.text('TOTAL:', totalesX, y + 2, { width: 80, align: 'right' });
    doc.font('Helvetica-Bold').fontSize(11).fillColor(accentColor);
    doc.text(
      `
$$
{Number(cotizacion.total).toLocaleString('es-MX', { minimumFractionDigits: 2 })} ${cotizacion.moneda}`,
      totalesValueX - 10, y + 2, { width: 72, align: 'right' }
    );

    y += 40;

    // ============ CONDICIONES ============
    if (cotizacion.condiciones_pago || cotizacion.notas) {
      if (y > 650) {
        doc.addPage();
        y = 50;
      }

      doc.rect(50, y, 512, 22).fill(primaryColor);
      doc.font('Helvetica-Bold').fontSize(10).fillColor('#ffffff');
      doc.text('CONDICIONES Y NOTAS', 58, y + 6);
      y += 30;

      if (cotizacion.condiciones_pago) {
        doc.font('Helvetica-Bold').fontSize(9).fillColor(primaryColor);
        doc.text('Condiciones de Pago:', 58, y);
        doc.font('Helvetica').fontSize(9).fillColor(grayColor);
        doc.text(cotizacion.condiciones_pago, 180, y);
        y += 16;
      }

      if (cotizacion.notas) {
        doc.font('Helvetica-Bold').fontSize(9).fillColor(primaryColor);
        doc.text('Notas:', 58, y);
        doc.font('Helvetica').fontSize(9).fillColor(grayColor);
        doc.text(cotizacion.notas, 180, y, { width: 370 });
        y += 30;
      }
    }

    // ============ PIE DE PÁGINA ============
    y = doc.page.height - 80;
    doc.moveTo(50, y).lineTo(562, y).stroke('#dddddd');

    doc.font('Helvetica').fontSize(7).fillColor('#999999');
    doc.text(
      'Este documento es una cotización y no representa un compromiso de venta. Los precios están sujetos a cambios sin previo aviso.',
      50, y + 10,
      { width: 512, align: 'center' }
    );
    doc.text(
      `Cotización generada el ${new Date().toLocaleString('es-MX')} | Sistema de Cotizaciones`,
      50, y + 25,
      { width: 512, align: 'center' }
    );

    // Firma
    doc.moveTo(100, y - 20).lineTo(250, y - 20).stroke(grayColor);
    doc.font('Helvetica').fontSize(8).fillColor(grayColor);
    doc.text('Firma del vendedor', 120, y - 15);

    doc.moveTo(350, y - 20).lineTo(500, y - 20).stroke(grayColor);
    doc.text('Firma del cliente', 380, y - 15);

    // Finalizar
    doc.end();

  } catch (error) {
    console.error('Error al generar PDF:', error);
    res.status(500).json({ message: 'Error al generar PDF' });
  }
};

module.exports = { generarPDF };