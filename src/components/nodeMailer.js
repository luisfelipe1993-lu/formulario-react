const nodemailer = require('nodemailer');

// Configurações do transporte de e-mail
const transporter = nodemailer.createTransport({
  host: 'email-ssl.com.br', // Substitua pelo servidor SMTP do seu provedor de e-mail
  port: 465, // Substitua pela porta do servidor SMTP do seu provedor de e-mail
  secure: true, // Use true se o seu provedor de e-mail suportar SSL, caso contrário, use false
  auth: {
    user: 'pmo@oliveira.mg.gov.br', // Substitua pelo seu endereço de e-mail
    pass: 'Vasco33313193%', // Substitua pela sua senha de e-mail
  },
});

module.exports = transporter;