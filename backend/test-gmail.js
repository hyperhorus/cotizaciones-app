const nodemailer = require('nodemailer');
require('dotenv').config();

async function testGmail() {
  console.log('=================================');
  console.log('🧪 Test SMTP Gmail');
  console.log('=================================\n');
  console.log('HOST:', process.env.SMTP_HOST);
  console.log('PORT:', process.env.SMTP_PORT);
  console.log('USER:', process.env.SMTP_USER);
  console.log('PASS:', process.env.SMTP_PASS ? '****' + process.env.SMTP_PASS.slice(-4) : '❌ NO CONFIGURADA');
  console.log('');

  try {
    // Crear transporter
    const transporter = nodemailer.createTransport({
      host: 'smtp.gmail.com',
      port: 587,
      secure: false,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS
      },
      tls: {
        rejectUnauthorized: false
      }
    });

    // 1. Verificar conexión
    console.log('🔌 Verificando conexión SMTP...');
    await transporter.verify();
    console.log('✅ Conexión SMTP exitosa!\n');

    // 2. Enviar correo de prueba
    console.log('📧 Enviando correo de prueba...');
    const info = await transporter.sendMail({
      from: `"Cotizaciones App" <${process.env.SMTP_USER}>`,
      to: process.env.SMTP_USER,
      subject: '🧪 Test Gmail SMTP - Cotizaciones App',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: #1a1a2e; color: #fff; padding: 20px; border-radius: 8px 8px 0 0;">
            <h1 style="margin: 0; font-size: 20px;">📋 Cotizaciones App</h1>
            <p style="color: #e94560; margin: 5px 0 0;">Test de Configuración SMTP</p>
          </div>
          <div style="padding: 20px; background: #fff; border: 1px solid #eee;">
            <h2 style="color: #2e7d32;">✅ ¡Gmail SMTP funciona correctamente!</h2>
            <p>Si estás leyendo este correo, la configuración es correcta.</p>
            <div style="background: #f8f9fa; padding: 16px; border-radius: 8px; margin: 16px 0;">
              <strong>📋 Detalles del test:</strong><br/>
              📅 Fecha: ${new Date().toLocaleString('es-MX')}<br/>
              📧 De: ${process.env.SMTP_USER}<br/>
              🖥️ Servidor: smtp.gmail.com:587
            </div>
            <div style="background: #1a1a2e; color: #fff; padding: 16px; border-radius: 8px; text-align: center;">
              <div style="font-size: 12px; opacity: 0.8;">EJEMPLO DE TOTAL</div>
              <div style="font-size: 28px; font-weight: bold; color: #e94560;">\$25,750.00 MXN</div>
            </div>
            <p style="margin-top: 20px; color: #666; font-size: 13px;">
              Ya puedes enviar cotizaciones por email desde tu aplicación. 🚀
            </p>
          </div>
          <div style="background: #f5f5f5; padding: 12px; text-align: center; font-size: 11px; color: #999; border-radius: 0 0 8px 8px;">
            Sistema de Cotizaciones | Test SMTP
          </div>
        </div>
      `
    });

    console.log('✅ ¡Correo enviado exitosamente!\n');
    console.log('   Message ID:', info.messageId);
    console.log('   Enviado a:', process.env.SMTP_USER);
    console.log('\n=================================');
    console.log('🎉 ¡Todo funciona correctamente!');
    console.log('   Revisa tu bandeja de entrada');
    console.log('=================================');

  } catch (error) {
    console.error('❌ Error:', error.message);
    console.log('\n=================================');
    console.log('🔧 POSIBLES SOLUCIONES:');
    console.log('=================================\n');

    if (error.message.includes('auth') || error.message.includes('login') || error.message.includes('credentials')) {
      console.log('1. ¿Usas la CONTRASEÑA DE APLICACIÓN (16 caracteres)?');
      console.log('   NO uses tu contraseña normal de Gmail');
      console.log('   Genera una en: https://myaccount.google.com/apppasswords\n');
      console.log('2. ¿La contraseña en .env tiene espacios o comillas?');
      console.log('   ❌ SMTP_PASS="abcd efgh ijkl mnop"');
      console.log('   ✅ SMTP_PASS=abcdefghijklmnop\n');
      console.log('3. ¿Tienes activada la Verificación en 2 pasos?');
      console.log('   Es OBLIGATORIA: https://myaccount.google.com/security\n');
    }

    if (error.message.includes('ECONNREFUSED') || error.message.includes('ENOTFOUND')) {
      console.log('1. Verifica tu conexión a internet');
      console.log('2. Revisa que no tengas un firewall bloqueando el puerto 587');
    }
  }
}

testGmail();