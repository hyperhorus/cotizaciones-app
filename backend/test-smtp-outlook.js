const nodemailer = require('nodemailer');
require('dotenv').config();

async function testSMTP() {
  console.log('Probando SMTP Outlook...');
  console.log('HOST:', process.env.SMTP_HOST);
  console.log('PORT:', process.env.SMTP_PORT);
  console.log('USER:', process.env.SMTP_USER);
  console.log('PASS:', process.env.SMTP_PASS ? '********' : 'NO CONFIGURADA');

  try {
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
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

    await transporter.verify();
    console.log('✅ Conexión SMTP OK');

    const info = await transporter.sendMail({
      from: process.env.SMTP_USER,
      to: process.env.SMTP_USER,
      subject: 'Prueba SMTP Outlook',
      text: 'Si recibes este correo, SMTP funciona correctamente.'
    });

    console.log('✅ Correo enviado');
    console.log('Message ID:', info.messageId);
  } catch (error) {
    console.error('❌ Error SMTP completo:');
    console.error(error);
  }
}

testSMTP();