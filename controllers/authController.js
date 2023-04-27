const User = require("../models/User");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
require("dotenv").config();
const { nanoid } = require("nanoid");
const sgMail = require("@sendgrid/mail");
const crypto = require("crypto");
const { clearLine } = require("readline");

sgMail.setApiKey(process.env.SENDGRID_API_KEY);

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
    const msg = {
      to: user.email, // El correo electrónico del destinatario
      from: "nicholas0810152015@gmail.com", // El correo electrónico del remitente
      subject: "Verificacion de Usuario Datazo",
      html: `<a href="http://localhost:3500/auth/${user.tokenConfirm}">Haga click aquí para verificar su cuenta</a>
            <p>⚠ Aguarda un siguiente mail avisandote que has confirmado correctamente su cuenta una vez haya hecho click en el link!</p>`,
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
      .catch((error) => console.error(error));

    return res.status(201).json({
      ok: "El mail de verificación ha sido enviado",
      tokenConfirm: user.tokenConfirm,
    });
  } catch (error) {
    console.log(error);
    //validación#1
    if (error.code === 11000) {
      return res.status(400).json({ error: "Ya existe este usuario!" });
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
    //Messsage
    res.redirect("http://localhost:3000/login");
    const response = new Promise((resolve) => {
      setTimeout(() => {
        resolve({ ok: "Cuenta verificada. Ya puedes iniciar sesion!" });
      }, 3000);
    });
    //sendgrid mail confirm
    const msg = {
      to: user.email, // El correo electrónico del destinatario
      from: "nicholas0810152015@gmail.com", // El correo electrónico del remitente
      subject: "Verificacion de Usuario Datazo",
      html: `${user.nombre} ${user.apellido} tu cuenta ha sido confirmada correctamente, ya puedes iniciar sesion`,
    };
    sgMail
      .send(msg)
      .then(() => console.log("La confirmación de la cuenta ha sido exitosa!"))
      .catch((error) => console.error(error));
    return res.json(await response);
  } catch (error) {
    res.json({ error });
    return res.redirect("/auth/login");
    // return res.json({ error: error.message });
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
    const msg = {
      to: user.email,
      from: "nicholas0810152015@gmail.com",
      subject: "Recuperación de contraseña | Datazo",
      html: `
      <p>Estás recibiendo este correo electrónico porque solicitaste recuperar tu contraseña en nuestra aplicación.</p>
      <p>Ingresa el siguiente código de verificación en la aplicación:</p>
      <h2 style="margin-top: 0;">${user.codigoVerificacion}</h2>
      <p>Este código es válido por 15 minutos. Si no lo usas en ese tiempo, deberás generar uno nuevo.</p>
      <p>Si no solicitaste recuperar tu contraseña, puedes ignorar este mensaje.</p>
      <p>Atentamente,</p>
      <p>El equipo de Datazo</p>
    `,
    };

    await sgMail.send(msg);

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

  const msg = {
    to: user.email,
    from: "nicholas0810152015@gmail.com",
    subject: "Verificacion Exitosa",
    html: `
    <p>Tu contraseña ha sido actualizada correctamente, gracias por confiar en nosotros!.</p>
    <p>Atentamente,</p>
    <p>El equipo de Datazo</p>
  `,
  };

  await sgMail.send(msg);

  res.status(200).json({ message: "Contraseña actualizada correctamente" });
};

module.exports = {
  login,
  refresh,
  logout,
  register,
  confirmarCuenta,
  passwordRecoveryMail,
  verifyVerificationCode,
};
