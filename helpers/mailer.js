const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
  host: "smtp.office365.com",
  port: 587,
  secure: false,
  auth: {
    user: "datazosoporte@outlook.com",
    pass: "datazo123",
  },
});

module.exports = transporter;

//En caso de necesitar Nodemailer, aquí está la configuración para usarlo en caso
// de que Sendgrid ya no se pueda utilizar. (Configuración con Outlook)
