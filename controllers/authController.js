const User = require("../models/User");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
require("dotenv").config();
const { nanoid } = require("nanoid");
//const sgMail = require("@sendgrid/mail");
const crypto = require("crypto");
const Professional = require("../models/Professional");
const transporter = require("../helpers/mailer");

//sgMail.setApiKey(process.env.SENDGRID_API_KEY);

// @desc Register
// @route POST /auth
// @access Public
const register = async (req, res) => {
  const { nombre, apellido, numeroContacto, email, password } = req.body;
  try {
    //validación#2
    let user = await User.findOne({ email });
    if (user) throw { code: 11000 };
    user = new User({
      nombre,
      apellido,
      numeroContacto,
      email,
      password,
      tokenConfirm: nanoid(),
    });
    await user.save();

    /**const msg = {
      to: user.email, // El correo electrónico del destinatario
      from: "soportetecnicodatazo@gmail.com", // El correo electrónico del remitente
      subject: "Verificacion de Usuario Datazo",
      html: `<a href="http://localhost:3500/auth/${user.tokenConfirm}">Haga click aquí para verificar su cuenta</a>
            <p>⚠ Aguarda un siguiente mail avisandote que has confirmado correctamente su cuenta una vez haya hecho click en el link!</p>
            <img src="https://i.ibb.co/s5M2hB8/datazologo.png" alt="datazologo" border="0" />`,
      dynamicTemplateData: {
        token: user.tokenConfirm, // Token generado para el usuario
        expirationDate: "2023-04-20 23:59:59", // Fecha de expiración del token
      },
    };
    sgMail
      .send(msg)
      .then(() =>
        console.log(
          "Correo electrónico enviado, guardado en base de datos exitoso!"
        )
      )
      .catch((error) => console.error(error)); */

    //bloque Nodemailer (?)
    const result = await transporter
      .sendMail({
        from: `Soporte Tecnico Datazo ${process.env.NODEMAILER_USER}`,
        to: user.email,
        subject: "Verificacion de Usuario Datazo",
        html: `<a href="https://datazobacktest.onrender.com/auth/${user.tokenConfirm}">Haga click aquí para verificar su cuenta</a>
            <p>⚠ Aguarda un siguiente mail avisandote que has confirmado correctamente su cuenta una vez haya hecho click en el link!</p>
            <img src="https://i.ibb.co/s5M2hB8/datazologo.png" alt="datazologo" border="0" />`,
        dynamicTemplateData: {
          token: user.tokenConfirm, // Token generado para el usuario
          expirationDate: "2023-04-20 23:59:59", // Fecha de expiración del token
        },
      })
      .catch((error) => {
        console.log(error);
      });

    return res.status(201).json({
      ok: "El mail de verificación ha sido enviado",
      tokenConfirm: user.tokenConfirm,
    });
  } catch (error) {
    console.log(error);
    //validación#1
    if (error.code === 11000) {
      return res
        .status(400)
        .json({ error: "Ya existe un usuario registrado con ese email" });
    }
    return res.status(500).json({ error: "Error de Servidor" });
  }
};
//Inside the Register Feature => Confirm Account with Sendgrid - @route GET default of Browser
//{
const confirmarCuenta = async (req, res) => {
  const { token } = req.params;
  try {
    const user = await User.findOne({ tokenConfirm: token });

    if (!user) throw new Error("No existe este usuario");

    user.cuentaConfirmada = true;
    user.tokenConfirm = null;

    await user.save();

    // sendgrid mail confirm
    /** const msg = {
      to: user.email,
      from: "soportetecnicodatazo@gmail.com",
      subject: "Verificacion de Usuario Datazo",
      html: `${user.nombre} ${user.apellido} tu cuenta ha sido confirmada correctamente, ya puedes iniciar sesion`,
    };
    sgMail
      .send(msg)
      .then(() => console.log("La confirmación de la cuenta ha sido exitosa!"))
      .catch((error) => console.error(error)); */

    //Nodemailer Bloque de Confirmación
    const result = await transporter
      .sendMail({
        from: `Soporte Tecnico Datazo ${process.env.NODEMAILER_USER}`,
        to: user.email,
        subject: "Verificacion de Usuario Datazo",
        html: `${user.nombre} ${user.apellido} tu cuenta ha sido confirmada correctamente, ya puedes iniciar sesion`,
      })
      .catch((error) => {
        console.log(error);
      });

    /**const msgWelcome = {
      to: user.email,
      from: "soportetecnicodatazo@gmail.com",
      subject: "Bienvenid@ a Datazo!",
      html: `<p>¡Hola! <b>${user.nombre} ${user.apellido}</b></p>
  
        <p>¡Bienvenido/a! Estamos encantados de que te hayas unido a nuestra plataforma para encontrar a los mejores profesionales de oficio. Regístrate o inicia sesión para empezar a explorar nuestro catálogo.</p>
        
        <p>Si necesitas ayuda, contáctanos.</p>
        
        <p>¡Gracias por unirte a nuestra comunidad!</p>
        
        <p>Saludos,</p>
        
        <p>El equipo de Datazo.com</p>
        <img src="https://i.ibb.co/s5M2hB8/datazologo.png" alt="datazologo" border="0" />`,
    };
    sgMail
      .send(msgWelcome)
      .then(() => {
        console.log("Mail de bienvenida enviado");
        res.redirect("http://localhost:3000/login");
      })
      .catch((error) => console.error(error)); */

    //Nodemailer Bloque de Bienvenida
    const resultTwo = await transporter
      .sendMail({
        from: `Soporte Tecnico Datazo ${process.env.NODEMAILER_USER}`,
        to: user.email,
        subject: "Bienvenid@ a Datazo!",
        html: `<p>¡Hola! <b>${user.nombre} ${user.apellido}</b></p>
  
        <p>¡Bienvenido/a! Estamos encantados de que te hayas unido a nuestra plataforma para encontrar a los mejores profesionales de oficio. Regístrate o inicia sesión para empezar a explorar nuestro catálogo.</p>
        
        <p>Si necesitas ayuda, contáctanos.</p>
        
        <p>¡Gracias por unirte a nuestra comunidad!</p>
        
        <p>Saludos,</p>
        
        <p>El equipo de Datazo.com</p>
        <img src="https://i.ibb.co/s5M2hB8/datazologo.png" alt="datazologo" border="0" />`,
      })
      .then(() => {
        console.log("Mail de bienvenida enviado");
        res.redirect("https://datazo.netlify.app/login");
      })
      .catch((error) => {
        console.log(error);
      });

    const response = new Promise((resolve) => {
      setTimeout(() => {
        resolve({ ok: "Cuenta verificada. Ya puedes iniciar sesión!" });
      }, 3000);
    });

    return res.json(await response);
  } catch (error) {
    res.json({ ok: "Cuenta Verificada" });
    return res.redirect("/auth/login");
  }
};

//}

// @desc Login
// @route POST /auth
// @access Public
const login = async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ message: "All fields are required" });
  }

  const foundUser = await User.findOne({ email }).exec();

  if (!foundUser)
    return res
      .status(401)
      .json({ message: "No existe cuenta con el mail proporcionado" });

  if (foundUser.cuentaConfirmada === false)
    res.status(401).json({ message: "Cuenta no confirmada por mail" });

  if (!foundUser || !foundUser.active) {
    return res
      .status(401)
      .json({ message: "Acceso no autorizado, verifique lo que ha ingresado" });
  }

  const match = await bcrypt.compare(password, foundUser.password);

  if (!match) return res.status(401).json({ message: "Contraseña Incorrecta" });

  const accessToken = jwt.sign(
    {
      UserInfo: {
        email: foundUser.email,
        roles: foundUser.roles,
        nombre: foundUser.nombre,
        apellido: foundUser.apellido,
        numeroContacto: foundUser.numeroContacto,
      },
    },
    process.env.ACCESS_TOKEN_SECRET,
    { expiresIn: "15m" }
  );

  const refreshToken = jwt.sign(
    { email: foundUser.email },
    process.env.REFRESH_TOKEN_SECRET,
    { expiresIn: "7d" }
  );

  // Create secure cookie with refresh token
  res.cookie("jwt", refreshToken, {
    httpOnly: true, //accessible only by web server
    secure: true, //https
    sameSite: "None", //cross-site cookie
    maxAge: 7 * 24 * 60 * 60 * 1000, //cookie expiry: set to match rT
  });

  // Send accessToken containing email and roles
  res.json({ accessToken });
};

// @desc Refresh
// @route GET /auth/refresh
// @access Public - because access token has expired
const refresh = (req, res) => {
  const cookies = req.cookies;

  if (!cookies?.jwt)
    return res.status(401).json({ message: "Acceso no Autorizado!" });

  const refreshToken = cookies.jwt;

  jwt.verify(
    refreshToken,
    process.env.REFRESH_TOKEN_SECRET,
    async (err, decoded) => {
      if (err) return res.status(403).json({ message: "Forbidden" });

      const foundUser = await User.findOne({ email: decoded.email }).exec();

      if (!foundUser) return res.status(401).json({ message: "Unauthorized" });

      const accessToken = jwt.sign(
        {
          UserInfo: {
            email: foundUser.email,
            roles: foundUser.roles,
            nombre: foundUser.nombre,
            apellido: foundUser.apellido,
            numeroContacto: foundUser.numeroContacto,
          },
        },
        process.env.ACCESS_TOKEN_SECRET,
        { expiresIn: "15m" }
      );

      res.json({ accessToken });
    }
  );
};

// @desc Logout
// @route POST /auth/logout
// @access Public - just to clear cookie if exists
const logout = (req, res) => {
  const cookies = req.cookies;
  if (!cookies?.jwt) return res.sendStatus(204); //No content
  res.clearCookie("jwt", { httpOnly: true, sameSite: "None", secure: true });
  res.json({ message: "Cookie cleared" });
};

// @desc passwordRecoveryMail
// @access Public - just recovery de user's password if exists and if is verified
const passwordRecoveryMail = async (req, res) => {
  const { email } = req.body;

  // Buscar al usuario en la base de datos
  const user = await User.findOne({ email });
  if (!user) {
    return res
      .status(400)
      .json({ error: "No existe un usuario con ese correo electrónico" });
  }
  if (!user.cuentaConfirmada)
    return res.status(400).json({
      error: "El email proporcionado corresponde a una cuenta no verificada",
    });

  const verificationCode = crypto.randomBytes(3).toString("hex");

  user.codigoVerificacion = verificationCode;
  await user.save();
  try {
    /* const msg = {
      to: user.email,
      from: "soportetecnicodatazo@gmail.com",
      subject: "Recuperación de contraseña | Datazo",
      html: `
      <p>Estás recibiendo este correo electrónico porque solicitaste recuperar tu contraseña en nuestra aplicación.</p>
      <p>Ingresa el siguiente código de verificación en la aplicación:</p>
      <h2 style="margin-top: 0;">${user.codigoVerificacion}</h2>
      <p>Este código es válido por 15 minutos. Si no lo usas en ese tiempo, deberás generar uno nuevo.</p>
      <p>Si no solicitaste recuperar tu contraseña, puedes ignorar este mensaje.</p>
      <p>Atentamente,</p>
      <p>El equipo de Datazo</p>
      <img src="https://i.ibb.co/s5M2hB8/datazologo.png" alt="datazologo" border="0" />
    `,
    };

    await sgMail.send(msg); */

    //Bloque de envio de codigo de verificacion con Nodemailer
    const result = await transporter
      .sendMail({
        from: `Soporte Tecnico Datazo ${process.env.NODEMAILER_USER}`,
        to: user.email,
        subject: "Recuperación de contraseña | Datazo",
        html: `
      <p>Estás recibiendo este correo electrónico porque solicitaste recuperar tu contraseña en nuestra aplicación.</p>
      <p>Ingresa el siguiente código de verificación en la aplicación:</p>
      <h2 style="margin-top: 0;">${user.codigoVerificacion}</h2>
      <p>Este código es válido por 15 minutos. Si no lo usas en ese tiempo, deberás generar uno nuevo.</p>
      <p>Si no solicitaste recuperar tu contraseña, puedes ignorar este mensaje.</p>
      <p>Atentamente,</p>
      <p>El equipo de Datazo</p>
      <img src="https://i.ibb.co/s5M2hB8/datazologo.png" alt="datazologo" border="0" />
    `,
      })
      .catch((error) => {
        console.log(error);
      });

    await user.save();

    res.json({
      mensaje:
        "Se ha enviado un código de verificación por correo electrónico.",
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      error: "Ha ocurrido un error al intentar recuperar la contraseña.",
    });
  }
};

//Route => Verification of Authentication Code
const verifyVerificationCode = async (req, res) => {
  const { email, verificationCode, newPassword } = req.body;

  // Buscar al usuario en la base de datos
  const user = await User.findOne({ email });
  if (!user) {
    return res
      .status(400)
      .json({ error: "No existe un usuario con ese correo electrónico" });
  }

  if (user.codigoVerificacion !== verificationCode) {
    return res
      .status(400)
      .json({ error: "El código de verificación es incorrecto" });
  }

  user.password = newPassword;
  user.codigoVerificacion = null;
  await user.save();

  /** const msg = {
    to: user.email,
    from: "soportetecnicodatazo@gmail.com",
    subject: "Verificacion Exitosa",
    html: `
    <p>Tu contraseña ha sido actualizada correctamente, gracias por confiar en nosotros!.</p>
    <p>Atentamente,</p>
    <p>El equipo de Datazo</p>
    <img src="https://i.ibb.co/s5M2hB8/datazologo.png" alt="datazologo" border="0" />
  `,
  };
  
  await sgMail.send(msg); */

  //Bloque de verificacion exitosa con Nodemailer
  const result = await transporter
    .sendMail({
      from: `Soporte Tecnico Datazo ${process.env.NODEMAILER_USER}`,
      to: user.email,
      subject: "Verificacion Exitosa",
      html: `
    <p>Tu contraseña ha sido actualizada correctamente, gracias por confiar en nosotros!.</p>
    <p>Atentamente,</p>
    <p>El equipo de Datazo</p>
    <img src="https://i.ibb.co/s5M2hB8/datazologo.png" alt="datazologo" border="0" />
  `,
    })
    .catch((error) => {
      console.log(error);
    });

  res.status(200).json({ message: "Contraseña actualizada correctamente" });
};

const getInfo = async (req, res) => {
  try {
    const { email } = req.params;
    if (!email) return res.status(400).json({ error: "Sin email recibido" });
    const user = await User.findOne({ email: email });
    if (!user) return res.status(404).json({ error: "Usuario no encontrado" });

    res.status(200).json(user);
  } catch (error) {
    console.log(error);
    res.status(500).json({ error: "Error en el servidor" });
  }
};

const getInfoSoli = async (req, res) => {
  try {
    const { email, idSoli } = req.params;
    if (!email) return res.status(400).json({ error: "Sin email recibido" });
    const user = await User.findOne({ email: email });
    if (!user) return res.status(404).json({ error: "Usuario no encontrado" });

    const solicitud = user.misSolicitudes.find(
      (s) => s._id.toString() === idSoli
    );

    if (!solicitud) {
      return res.status(404).json({
        error: "No se encontró ninguna solicitud con el ID proporcionado",
      });
    }

    /** const solicitudIndex = user.misSolicitudes.findIndex(
      (solicitud) => solicitud._id.toString() === idSoli
    );
    if (solicitudIndex === -1) {
      return res.status(404).json({ error: "La solicitud no existe" });
    } */

    res.status(200).json(solicitud);
  } catch (error) {
    console.log(error);
    res.status(500).json({ error: "Error en el servidor" });
  }
};

const eliminarSolicitud = async (req, res) => {
  const userId = req.body.userId;
  const solicitudId = req.params.id;
  const professionalId = req.body.professionalId;

  try {
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ error: "El usuario no existe" });
    }

    const profesional = await Professional.findById(professionalId);
    if (!profesional) {
      return res.status(404).json({ error: "El profesional no existe" });
    }

    const solicitud = user.misSolicitudes.find(
      (s) => s._id.toString() === solicitudId
    );

    if (!solicitud) {
      return res.status(404).json({
        error: "No se encontró ninguna solicitud con el ID proporcionado",
      });
    }

    const date1 = new Date(solicitud.fecha[0]);
    const date2 = new Date(solicitud.fecha[1]);

    /** const msg = {
      to: profesional.email,
      from: "soportetecnicodatazo@gmail.com",
      subject: "Han eliminado una solicitud que estaba en espera",
      html: `
      <p>${profesional.nombre} ${
        profesional.apellido
      }! Te contactamos para avisarte que ${user.nombre} ${
        user.apellido
      }, ha rechazado la orden de trabajo</p>
      <p>Tal orden consistía en ${
        solicitud.descripcion
      } para las fechas entre ${date1.getFullYear()}-${(date1.getMonth() + 1)
        .toString()
        .padStart(2, "0")}-${date1
        .getDate()
        .toString()
        .padStart(2, "0")} y ${date2.getFullYear()}-${(date2.getMonth() + 1)
        .toString()
        .padStart(2, "0")}-${date2.getDate().toString().padStart(2, "0")}.</p>
      <p>Te vamos a estar avisando cuando tengas otra orden de trabajo, muchas gracias por confiar en nosotros!</p>
      <p>Atentamente,</p>
      <p>El equipo de Datazo</p>
      <img src="https://i.ibb.co/s5M2hB8/datazologo.png" alt="datazologo" border="0" />
    `,
    };

    await sgMail.send(msg); **/

    //Bloque de notificacion de eliminacion de solicitud al profesional con Nodemailer
    const result = await transporter
      .sendMail({
        from: `Soporte Tecnico Datazo ${process.env.NODEMAILER_USER}`,
        to: profesional.email,
        subject: "Han eliminado una solicitud que estaba en espera",
        html: `
      <p>${profesional.nombre} ${
          profesional.apellido
        }! Te contactamos para avisarte que ${user.nombre} ${
          user.apellido
        }, ha rechazado la orden de trabajo</p>
      <p>Tal orden consistía en ${
        solicitud.descripcion
      } para las fechas entre ${date1.getFullYear()}-${(date1.getMonth() + 1)
          .toString()
          .padStart(2, "0")}-${date1
          .getDate()
          .toString()
          .padStart(2, "0")} y ${date2.getFullYear()}-${(date2.getMonth() + 1)
          .toString()
          .padStart(2, "0")}-${date2.getDate().toString().padStart(2, "0")}.</p>
      <p>Te vamos a estar avisando cuando tengas otra orden de trabajo, muchas gracias por confiar en nosotros!</p>
      <p>Atentamente,</p>
      <p>El equipo de Datazo</p>
      <img src="https://i.ibb.co/s5M2hB8/datazologo.png" alt="datazologo" border="0" />
    `,
      })
      .catch((error) => {
        console.log(error);
      });

    const solicitudIndex = user.misSolicitudes.findIndex(
      (solicitud) => solicitud._id.toString() === solicitudId
    );
    if (solicitudIndex === -1) {
      return res.status(404).json({ error: "La solicitud no existe" });
    }

    user.misSolicitudes.splice(solicitudIndex, 1);

    await user.save();

    res.json({ mensaje: "Solicitud eliminada correctamente" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error al eliminar la solicitud" });
  }
};

const cancelarPropuesta = async (req, res) => {
  const userId = req.body.userId;
  const solicitudId = req.params.id;
  const professionalId = req.body.professionalId;

  try {
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ error: "El usuario no existe" });
    }

    const profesional = await Professional.findById(professionalId);
    if (!profesional) {
      return res.status(404).json({ error: "El profesional no existe" });
    }

    const solicitud = user.misSolicitudes.find(
      (s) => s._id.toString() === solicitudId
    );

    if (!solicitud) {
      return res.status(404).json({
        error: "No se encontró ninguna solicitud con el ID proporcionado",
      });
    }

    /** const msg = {
      to: profesional.email,
      from: "soportetecnicodatazo@gmail.com",
      subject: "Han rechazado tu propuesta de trabajo",
      html: `
      <p>${profesional.nombre} ${profesional.apellido}! Te contactamos para avisarte que ${user.nombre} ${user.apellido}, ha rechazado la propuesta de orden de trabajo</p>
      <p>Tal orden consistía en ${solicitud.descripcion} para las fechas entre ${solicitud.fechaElegida[0]} y ${solicitud.fechaElegida[1]} a la ${solicitud.horario},</p>
      <p>Tu habías elegido la fecha ${solicitud.fechaElegida} cuyo presupuesto era de: $${solicitud.presupuesto}</p>
      <p>Te vamos a estar avisando cuando tengas otra orden de trabajo, muchas gracias por confiar en nosotros!</p>
      <p>Atentamente,</p>
      <p>El equipo de Datazo</p>
      <img src="https://i.ibb.co/s5M2hB8/datazologo.png" alt="datazologo" border="0" />
    `,
    };

    await sgMail.send(msg); **/

    //bloque de notificacion de rechazo de propuesta de trabajo con Nodemailer
    const result = await transporter.sendMail({
      from: `Soporte Tecnico Datazo ${process.env.NODEMAILER_USER}`,
      to: profesional.email,
      subject: "Han rechazado tu propuesta de trabajo",
      html: `
      <p>${profesional.nombre} ${profesional.apellido}! Te contactamos para avisarte que ${user.nombre} ${user.apellido}, ha rechazado la propuesta de orden de trabajo</p>
      <p>Tal orden consistía en ${solicitud.descripcion} para las fechas entre ${solicitud.fechaElegida[0]} y ${solicitud.fechaElegida[1]} a la ${solicitud.horario},</p>
      <p>Tu habías elegido la fecha ${solicitud.fechaElegida} cuyo presupuesto era de: $${solicitud.presupuesto}</p>
      <p>Te vamos a estar avisando cuando tengas otra orden de trabajo, muchas gracias por confiar en nosotros!</p>
      <p>Atentamente,</p>
      <p>El equipo de Datazo</p>
      <img src="https://i.ibb.co/s5M2hB8/datazologo.png" alt="datazologo" border="0" />
    `,
    }).catch((error) => {
      console.log(error);
    });

    const solicitudIndex = user.misSolicitudes.findIndex(
      (solicitud) => solicitud._id.toString() === solicitudId
    );
    if (solicitudIndex === -1) {
      return res.status(404).json({ error: "La solicitud no existe" });
    }

    user.misSolicitudes.splice(solicitudIndex, 1);

    await user.save();

    res.json({ mensaje: "Propuesta eliminada correctamente" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error al eliminar la solicitud" });
  }
};

const aceptarPropuesta = async (req, res) => {
  try {
    const userId = req.body.userId;
    const solicitudId = req.params.id;
    const professionalId = req.body.professionalId;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ error: "El usuario no existe" });
    }

    const profesional = await Professional.findById(professionalId);
    if (!profesional) {
      return res.status(404).json({ error: "El profesional no existe" });
    }

    const solicitud = user.misSolicitudes.find(
      (s) => s._id.toString() === solicitudId
    );

    if (!solicitud) {
      return res.status(404).json({
        error: "No se encontró ninguna solicitud con el ID proporcionado",
      });
    }

    const solicitudIndex = user.misSolicitudes.findIndex(
      (solicitud) => solicitud._id.toString() === solicitudId
    );
    if (solicitudIndex === -1) {
      return res.status(404).json({ error: "La solicitud no existe" });
    }

    // Cambiar la propiedad `propAceptada` a `true`
    solicitud.propAceptada = true;

    // Guardar los cambios en la base de datos
    await user.save();

    /** const msg = {
      to: profesional.email,
      from: "soportetecnicodatazo@gmail.com",
      subject: "Te han aceptado una propuesta desde Datazo!",
      html: `${profesional.nombre} ${profesional.apellido} han respondido a tu propuesta de trabajo!
    <p>La misma ha sido registrada y guardada en tu sistema de reservas en Datazo!</p>
    <p><b>Recuerda</b> revisar siempre tu registro de solicitudes para mantener continuo control sobre tus ordenes de trabajo!</p>
    <p>La propuesta consistia en ${solicitud.descripcion} para el dia ${solicitud.fechaElegida} a la ${solicitud.horario}.</p>
    <p>El presupuesto era de ${solicitud.presupuesto} para el cliente ${user.nombre} ${user.apellido}.</p>
    <p>Le hemos facilitado de tu numero de contacto para en caso que tu seas contactado para refinar detalles sobre el trabajo.</p>
    <p>Gracias por confiar en nosotros. Atentamente, el equipo de Datazo!</p>
    <br>
    <img src="https://i.ibb.co/s5M2hB8/datazologo.png" alt="datazologo" border="0" />`,
    };
    sgMail
      .send(msg)
      .then(() => console.log("Se ha enviado el mail propuesta de trabajo"))
      .catch((error) => console.error(error)); **/

    //Bloque de notificacion de aceptacion de propuesta con Nodemailer
    const result = await transporter.sendMail({
      from: `Soporte Tecnico Datazo ${process.env.NODEMAILER_USER}`,
      to: profesional.email,
      subject: "Te han aceptado una propuesta desde Datazo!",
      html: `${profesional.nombre} ${profesional.apellido} han respondido a tu propuesta de trabajo!
    <p>La misma ha sido registrada y guardada en tu sistema de reservas en Datazo!</p>
    <p><b>Recuerda</b> revisar siempre tu registro de solicitudes para mantener continuo control sobre tus ordenes de trabajo!</p>
    <p>La propuesta consistia en ${solicitud.descripcion} para el dia ${solicitud.fechaElegida} a la ${solicitud.horario}.</p>
    <p>El presupuesto era de ${solicitud.presupuesto} para el cliente ${user.nombre} ${user.apellido}.</p>
    <p>Le hemos facilitado de tu numero de contacto para en caso que tu seas contactado para refinar detalles sobre el trabajo.</p>
    <p>Gracias por confiar en nosotros. Atentamente, el equipo de Datazo!</p>
    <br>
    <img src="https://i.ibb.co/s5M2hB8/datazologo.png" alt="datazologo" border="0" />`,
    }).catch((error) => {
      console.log(error);
    });

    return res
      .status(200)
      .json({ message: "Propuesta del Profesional aceptada correctamente" });
  } catch (error) {
    console.error(error);
    return res
      .status(500)
      .json({ error: "Ocurrió un error al aceptar la propuesta" });
  }
};

//delete work when the flux has been completed (trash icon)
const deleteSoliCompleted = async (req, res) => {
  const userId = req.body.userId;
  const solicitudId = req.params.id;
  const professionalId = req.body.professionalId;

  try {
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ error: "El usuario no existe" });
    }

    const profesional = await Professional.findById(professionalId);
    if (!profesional) {
      return res.status(404).json({ error: "El profesional no existe" });
    }

    const solicitud = user.misSolicitudes.find(
      (s) => s._id.toString() === solicitudId
    );

    if (!solicitud) {
      return res.status(404).json({
        error: "No se encontró ninguna solicitud con el ID proporcionado",
      });
    }

    const solicitudIndex = user.misSolicitudes.findIndex(
      (solicitud) => solicitud._id.toString() === solicitudId
    );
    if (solicitudIndex === -1) {
      return res.status(404).json({ error: "La solicitud no existe" });
    }

    user.misSolicitudes.splice(solicitudIndex, 1);

    await user.save();

    res.json({
      mensaje: "Solicitud cuyo flujo completado eliminado correctamente",
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error al eliminar la solicitud" });
  }
};

module.exports = {
  login,
  refresh,
  logout,
  register,
  confirmarCuenta,
  passwordRecoveryMail,
  verifyVerificationCode,
  getInfo,
  getInfoSoli,
  eliminarSolicitud,
  aceptarPropuesta,
  deleteSoliCompleted,
  cancelarPropuesta,
};
