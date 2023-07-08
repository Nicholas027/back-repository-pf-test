const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
  host: "smtp.office365.com",
  port: 587,
  secure: false,
  auth: {
    user: process.env.NODEMAILER_USER,
    pass: process.env.NODEMAILER_PASS,
  },
});

module.exports = transporter;

//En caso de necesitar Nodemailer, aquí está la configuración para usarlo en caso
// de que Sendgrid ya no se pueda utilizar. (Configuración con Outlook)
