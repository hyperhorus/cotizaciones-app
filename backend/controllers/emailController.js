const nodemailer = require('nodemailer');
const PDFDocument = require('pdfkit');
const pool = require('../config/db');

// Configurar transporter
const createTransporter = () => {
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: process.env.SMTP_PORT || 587,
    secure: false,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS
    }
  });
};

// Generar PDF en buffer
const generarPDFBuffer = async (id) => {
  return new Promise(async (resolve, reject) => {
    try {
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
        return reject(new Error('Cotización no encontrada'));
      }

      const cotizacion = cotRows[0];

      const [detalle] = await pool.query(`
        SELECT 
          dc.*, p.codigo_sku, p.nombre AS producto_nombre, p.unidad_medida
        FROM detalle_cotizacion dc
        JOIN productos p ON dc.id_producto = p.id_producto
        WHERE dc.id_cotizacion = ?
        ORDER BY dc.id_detalle ASC
      `, [id]);

      // Crear PDF en memoria
      const doc = new PDFDocument({ size: 'LETTER', margin: 50 });
      const chunks = [];

      doc.on('data', (chunk) => chunks.push(chunk));
      doc.on('end', () => resolve({ buffer: Buffer.concat(chunks), cotizacion, detalle }));

      // ============ CONTENIDO PDF (simplificado para email) ============
      const primaryColor = '#1a1a2e';
      const accentColor = '#e94560';
      const grayColor = '#666666';

      // Header
      doc.rect(0, 0, doc.page.width, 100).fill(primaryColor);
      doc.font('Helvetica-Bold').fontSize(20).fillColor('#ffffff')
        .text('MI EMPRESA S.A. DE C.V.', 50, 25);
      doc.font('Helvetica').fontSize(9).fillColor('#cccccc')
        .text('Tel: (55) 1234-5678 | ventas@miempresa.com', 50, 50);
      doc.font('Helvetica-Bold').fontSize(14).fillColor(accentColor)
        .text(cotizacion.folio, 400, 25, { align: 'right', width: 162 });
      doc.font('Helvetica').fontSize(9).fillColor('#cccccc')
        .text(`Fecha: ${new Date(cotizacion.fecha_cotizacion).toLocaleDateString('es-MX')}`, 400, 50, { align: 'right', width: 162 });

      let y = 120;

      // Cliente
      doc.font('Helvetica-Bold').fontSize(10).fillColor(primaryColor)
        .text('Cliente:', 50, y);
      doc.font('Helvetica').fontSize(10).fillColor(grayColor)
        .text(cotizacion.cliente_nombre, 110, y);
      y += 20;

      // Tabla de productos
      doc.rect(50, y, 512, 18).fill('#e8e8e8');
      doc.font('Helvetica-Bold').fontSize(8).fillColor(primaryColor);
      doc.text('#', 55, y + 5);
      doc.text('Producto', 75, y + 5);
      doc.text('Cant.', 340, y + 5);
      doc.text('P. Unit.', 390, y + 5);
      doc.text('Subtotal', 480, y + 5);
      y += 22;

      detalle.forEach((item, index) => {
        const bgColor = index % 2 === 0 ? '#ffffff' : '#fafafa';
        doc.rect(50, y, 512, 18).fill(bgColor);
        doc.font('Helvetica').fontSize(8).fillColor(grayColor);
        doc.text((index + 1).toString(), 55, y + 5);
        doc.text(`${item.codigo_sku} - ${item.producto_nombre}`, 75, y + 5, { width: 250 });
        doc.text(item.cantidad.toString(), 345, y + 5);
        doc.text(`
$$
{Number(item.precio_unitario).toLocaleString('es-MX', { minimumFractionDigits: 2 })}`, 385, y + 5);
        doc.font('Helvetica-Bold').fontSize(8).fillColor(primaryColor);
        doc.text(`
$$
{Number(item.subtotal_linea).toLocaleString('es-MX', { minimumFractionDigits: 2 })}`, 475, y + 5);
        y += 20;
      });

      y += 10;

      // Totales
      doc.font('Helvetica').fontSize(9).fillColor(grayColor)
        .text('Subtotal:', 400, y, { width: 70, align: 'right' });
      doc.text(`
$$
{Number(cotizacion.subtotal).toLocaleString('es-MX', { minimumFractionDigits: 2 })}`, 480, y, { width: 80, align: 'right' });
      y += 15;

      doc.text(`IVA (${cotizacion.iva_porcentaje}%):`, 400, y, { width: 70, align: 'right' });
      doc.text(`
$$
{Number(cotizacion.iva_monto).toLocaleString('es-MX', { minimumFractionDigits: 2 })}`, 480, y, { width: 80, align: 'right' });
      y += 20;

      doc.rect(390, y - 4, 172, 24).fill(primaryColor);
      doc.font('Helvetica-Bold').fontSize(11).fillColor('#ffffff')
        .text('TOTAL:', 400, y + 2, { width: 70, align: 'right' });
      doc.fillColor(accentColor)
        .text(`
$$
{Number(cotizacion.total).toLocaleString('es-MX', { minimumFractionDigits: 2 })} ${cotizacion.moneda}`, 475, y + 2, { width: 85, align: 'right' });

      doc.end();
    } catch (error) {
      reject(error);
    }
  });
};

// Enviar cotización por email
const enviarCotizacionEmail = async (req, res) => {
  try {
    const { id } = req.params;
    const { email_destino, asunto, mensaje } = req.body;

    if (!email_destino) {
      return res.status(400).json({ message: 'El email de destino es requerido' });
    }

    // Generar PDF
    const { buffer, cotizacion } = await generarPDFBuffer(id);

    // Crear transporter
    const transporter = createTransporter();

    // HTML del email
    const htmlEmail = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: 'Segoe UI', sans-serif; color: #333; }
          .header { background-color: #1a1a2e; padding: 20px 30px; color: #fff; }
          .header h1 { margin: 0; font-size: 20px; }
          .header .folio { color: #e94560; font-size: 16px; margin-top: 5px; }
          .content { padding: 30px; }
          .info-box { background: #f8f9fa; border-radius: 8px; padding: 16px; margin: 16px 0; }
          .total-box { background: #1a1a2e; color: #fff; border-radius: 8px; padding: 16px; text-align: center; margin: 20px 0; }
          .total-amount { font-size: 28px; font-weight: bold; color: #e94560; }
          .footer { background: #f5f5f5; padding: 16px 30px; font-size: 12px; color: #888; text-align: center; }
          .btn { display: inline-block; background: #e94560; color: #fff; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: bold; }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>MI EMPRESA S.A. DE C.V.</h1>
          <div class="folio">${cotizacion.folio}</div>
        </div>
        <div class="content">
          <p>Estimado(a) <strong>${cotizacion.cliente_nombre}</strong>,</p>
          <p>${mensaje || 'Le hacemos llegar la siguiente cotización para su consideración.'}</p>
          
          <div class="info-box">
            <strong>Detalles de la cotización:</strong><br/>
            📋 Folio: <strong>${cotizacion.folio}</strong><br/>
            📅 Fecha: ${new Date(cotizacion.fecha_cotizacion).toLocaleDateString('es-MX')}<br/>
            ⏰ Vigencia: ${new Date(cotizacion.fecha_vigencia).toLocaleDateString('es-MX')}<br/>
            💳 Condiciones: ${cotizacion.condiciones_pago || 'N/A'}<br/>
            💱 Moneda: ${cotizacion.moneda}
          </div>

          <div class="total-box">
            <div style="font-size: 14px; margin-bottom: 8px;">TOTAL DE LA COTIZACIÓN</div>
            <div class="total-amount">
$$
{Number(cotizacion.total).toLocaleString('es-MX', { minimumFractionDigits: 2 })} ${cotizacion.moneda}
            </div>
          </div>

          <p>Adjunto encontrará el PDF con el detalle completo de la cotización.</p>
          <p>Quedamos atentos a sus comentarios.</p>

          <br/>
          <p>Saludos cordiales,<br/>
          <strong>${cotizacion.vendedor_nombre || 'Departamento de Ventas'}</strong><br/>
          MI EMPRESA S.A. DE C.V.</p>
        </div>
        <div class="footer">
          Este correo fue enviado desde el Sistema de Cotizaciones.<br/>
          Av. Principal #123, Col. Centro, Ciudad de México | Tel: (55) 1234-5678
        </div>
      </body>
      </html>
    `;

    // Enviar email
    const mailOptions = {
      from: `"MI EMPRESA" <${process.env.SMTP_USER}>`,
      to: email_destino,
      subject: asunto || `Cotización ${cotizacion.folio} - MI EMPRESA`,
      html: htmlEmail,
      attachments: [
        {
          filename: `cotizacion-${cotizacion.folio}.pdf`,
          content: buffer,
          contentType: 'application/pdf'
        }
      ]
    };

    await transporter.sendMail(mailOptions);

    // Actualizar estatus a ENVIADA si está en BORRADOR
    const [currentStatus] = await pool.query(`
      SELECT ec.clave, c.id_estatus 
      FROM cotizaciones c 
      JOIN estatus_cotizacion ec ON c.id_estatus = ec.id_estatus
      WHERE c.id_cotizacion = ?
    `, [id]);

    if (currentStatus[0]?.clave === 'BORRADOR') {
      const [enviada] = await pool.query(`
        SELECT id_estatus FROM estatus_cotizacion WHERE clave = 'ENVIADA'
      `);

      if (enviada.length > 0) {
        await pool.query(`
          UPDATE cotizaciones SET id_estatus = ? WHERE id_cotizacion = ?
        `, [enviada[0].id_estatus, id]);

        await pool.query(`
          INSERT INTO historial_cotizacion 
            (id_cotizacion, id_estatus_anterior, id_estatus_nuevo, comentario, usuario)
          VALUES (?, ?, ?, ?, ?)
        `, [id, currentStatus[0].id_estatus, enviada[0].id_estatus,
          `Cotización enviada por email a ${email_destino}`, 'Sistema']);
      }
    }

    res.json({
      message: `Cotización enviada exitosamente a ${email_destino}`,
      folio: cotizacion.folio
    });

  } catch (error) {
    console.error('Error al enviar email:', error);
    res.status(500).json({
      message: 'Error al enviar el email',
      error: error.message
    });
  }
};

module.exports = { enviarCotizacionEmail };