const Professional = require("../models/Professional");
const jwt = require("jsonwebtoken");
const User = require("../models/User");
const sgMail = require("@sendgrid/mail");
sgMail.setApiKey(process.env.SENDGRID_API_KEY);

//generateToken
const generateToken = (email) => {
  const secretKey = "shhhhhh";
  const token = jwt.sign({ email }, secretKey, { expiresIn: "1h" });
  return token;
};
//verify expiration of token xD
const checkIfTokenExpired = (token) => {
  try {
    const secretKey = "shhhhhh";
    const decodedToken = jwt.verify(token, secretKey);
    const expiryDate = new Date(decodedToken.exp * 1000);

    // Obtén la fecha actual
    const currentDate = new Date();

    // Compara la fecha actual con la fecha de expiración del token
    if (currentDate > expiryDate) {
      // El token ha expirado
      return true;
    }

    // El token no ha expirado
    return false;
  } catch (error) {
    // Ocurrió un error al verificar el token
    // Aquí puedes manejar el error según tus necesidades
    console.error("Error al verificar el token:", error);
    return true; // Consideramos que el token ha expirado en caso de error
  }
};

//get all professionals
const getProfessionalDetails = async (req, res) => {
  try {
    const professional = await Professional.find();
    return res.json({ professional });
  } catch (error) {
    return res.json({ error });
  }
};

//get professionalById
const getProfessionalById = async (req, res) => {
  try {
    const professional = await Professional.findById(req.params.id).populate(
      "comentarios"
    );
    if (!professional) {
      return res.status(404).json({ error: "Profesional no encontrado" });
    }
    return res.status(200).json(professional);
  } catch (error) {
    return res.status(500).json({ error: "Server error" });
  }
};

//add professional
const addProfessional = async (req, res) => {
  try {
    const {
      email,
      nombre,
      apellido,
      profesion,
      foto,
      calificacion,
      disponible,
      contacto,
      referencias,
      zona,
      expLaboral,
      educacion,
      habilidades,
      comentarios,
    } = req.body;
    const addProfessional = new Professional({
      email,
      nombre,
      apellido,
      profesion,
      foto,
      calificacion,
      disponible,
      contacto,
      referencias,
      zona,
      expLaboral,
      educacion,
      habilidades,
      comentarios,
    });
    await addProfessional.save();
    return res.status(201).json({ ok: true });
  } catch (error) {
    return res.status(501).json({ error: "Hubo un problema en el Servidor!" });
  }
};

//add comment
const addComment = async (req, res) => {
  const { nombrePersona, descripcion, calificacionComentario } = req.body;
  const professionalId = req.params.id;

  try {
    const professional = await Professional.findById(professionalId);
    if (!professional) {
      return res.status(404).json({ error: "Profesional no encontrado" });
    }

    const nuevoComentario = {
      titulo: "",
      descripcion,
      nombrePersona,
      fotoPersona: "",
      calificacionComentario,
    };

    professional.comentarios.push(nuevoComentario);

    await professional.save();

    return res.json({ ok: "Comentario Agregado! 🥂" });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "Error del servidor" });
  }
};

//add register of professional's work
const didYouContactHim = async (req, res) => {
  try {
    const { id } = req.params;
    const foundProf = await Professional.findById(id);

    if (!foundProf) {
      return res.status(404).json({
        error: "No se encontró ningún profesional con el ID proporcionado",
      });
    }

    const { nombre, apellido, profesion } = foundProf;
    const { nombreCliente, apellidoCliente, emailCliente } = req.body;

    if (!nombreCliente || !apellidoCliente || !emailCliente) {
      return res.status(400).json({ error: "Faltan datos del cliente" });
    }

    const token = generateToken(emailCliente);
    const alt = profesion;
    const link = `https://datazotest.netlify.app/dash/professionals/${alt}/${id}/${token}`;

    const foundCli = await User.findOne({ email: emailCliente });

    if (!foundCli) {
      return res.status(404).json({
        error:
          "No se encontró ningún cliente con el correo electrónico proporcionado",
      });
    }

    foundCli.tokenContacto.push({ token });
    await foundCli.save();

    //Aquí se envia el correo
    console.log(
      `Hola ${nombreCliente} ${apellidoCliente}, ¿has podido contactarte con ${nombre} ${apellido} quien se desempeña como ${profesion}? Si es así, visita este enlace: ${link}`
    );
    const msg = {
      to: emailCliente,
      from: "soportetecnicodatazo@gmail.com",
      subject: "Has contactado un profesional",
      html: `<p>Estimado(a) ${nombreCliente} ${apellidoCliente},</p>
      <br>
      <p>Esperamos que te encuentres bien. En primer lugar, queremos agradecerte por utilizar nuestra aplicación y mostrarnos tu interés en contactar a ${nombre} ${apellido}.</p>
      <br>
      <p>Nos gustaría saber si has logrado establecer el contacto deseado. Si has tenido éxito en este sentido, te pedimos que hagas clic en el siguiente enlace para completar tu experiencia: <a href="${link}">Haz click aquí!</a>.</p>
      <br>
      <p>Por otro lado, si aún no has podido concretar el contacto con ${nombre} ${apellido}, lamentamos cualquier inconveniente que esto haya causado. Sabemos lo importante que es para ti encontrar la opción adecuada en nuestro catálogo. Te alentamos a que sigas explorando las alternativas disponibles y estamos seguros de que encontrarás una opción que se ajuste a tus necesidades. Puedes acceder a nuestro catálogo completo a través del siguiente enlace: <a href="http://localhost:3000/dash/professionals/${alt}">Catálogo</a>.</p>
      <br>
      <p>En caso de que necesites ayuda adicional o tengas alguna pregunta, no dudes en contactarnos. Estamos aquí para brindarte asistencia y asegurarnos de que tengas la mejor experiencia posible en nuestra plataforma.</p>
      <br>
      <p>Agradecemos tu comprensión y apoyo continuo. Esperamos seguir siendo tu aliado confiable en tus búsquedas de profesionales.</p>
      <br>
      <p>¡Que tengas un excelente día!</p>
      <br>
      <p>Atentamente,</p>
      <p>DATAZO</p>
      <img src="https://i.ibb.co/s5M2hB8/datazologo.png" alt="datazologo" border="0" />`,
    };
    sgMail
      .send(msg)
      .then(() => console.log("Se ha enviado el mail de contacto"))
      .catch((error) => console.error(error));

    res.status(200).json({
      success: true,
      message: "Se ha enviado el mensaje correctamente",
    });
  } catch (error) {
    console.error("Error en didYouContactHim:", error);
    res.status(500).json({ error: "Se produjo un error en el servidor" });
  }
};

//get token for validate user interface for work register form
const didYouContactHimGetToken = async (req, res) => {
  try {
    const { email, token } = req.body;

    if (!email || !token) {
      return res
        .status(400)
        .json({ error: "Falta el correo electrónico o el token guardado" });
    }

    const foundUser = await User.findOne({ email });

    if (!foundUser) {
      return res.status(404).json({
        error:
          "No se encontró ningún usuario con el correo electrónico proporcionado",
      });
    }

    const matchingToken = foundUser.tokenContacto.find(
      (obj) => obj.token === token
    );

    if (!matchingToken) {
      return res.status(404).json({
        error: "No se encontró ningún token válido que coincida",
      });
    }

    const isTokenExpired = checkIfTokenExpired(token);
    if (isTokenExpired) {
      // El token ha expirado, eliminarlo de la base de datos
      foundUser.tokenContacto = foundUser.tokenContacto.filter(
        (item) => item.token !== token
      );
      await foundUser.save();
      return res.status(400).json({
        error: "El enlace ha expirado. Por favor, solicita un nuevo enlace.",
      });
    }

    res.json(matchingToken.token);
  } catch (error) {
    console.error("Error en didYouContactHimGetToken:", error);
    res.status(500).json({ error: "Se produjo un error en el servidor" });
  }
};

//send email with link for protected interface for user comment and rating
const commentAndRating = async (req, res) => {
  const { id } = req.params;
  const foundProf = await Professional.findById(id);

  if (!foundProf) {
    return res.status(404).json({
      error: "No se encontró ningún profesional con el ID proporcionado",
    });
  }

  const { nombre, apellido, profesion } = foundProf;
  const {
    nombreCliente,
    apellidoCliente,
    fechaTrabajo,
    descripcionTrabajo,
    emailCliente,
  } = req.body;

  if (
    !nombreCliente ||
    !apellidoCliente ||
    !emailCliente ||
    !fechaTrabajo ||
    !descripcionTrabajo
  ) {
    return res.status(400).json({ error: "Faltan datos del cliente" });
  }

  const token = generateToken(emailCliente);
  const alt = profesion;
  const link = `https://datazotest.netlify.app/dash/professionals/${alt}/${id}/${token}/calificacion`;

  const foundCli = await User.findOne({ email: emailCliente });

  if (!foundCli) {
    return res.status(404).json({
      error:
        "No se encontró ningún cliente con el correo electrónico proporcionado",
    });
  }

  foundCli.tokenCalificacion.push({ token });
  await foundCli.save();

  //Aquí se envia el correo con Nodemailer
  console.log(
    `Hola ${nombreCliente} ${apellidoCliente}!, queremos saber como te fué contratando los servicios de ${nombre} ${apellido} cuyo ${profesion} has requerido de sus servicios, estariamos encantados de que califiques y comentes su atención, si lo deseas, puedes hacer click en el siguiente link para hacerlo: ${link}`
  );
  console.log(
    `Su trabajo se registró para el ${fechaTrabajo} el cual consistía en ${descripcionTrabajo} según lo que usted introdujo`
  );
  const msg = {
    to: emailCliente,
    from: "soportetecnicodatazo@gmail.com",
    subject: "Califica al profesional",
    html: `Hola ${nombreCliente} ${apellidoCliente}!, queremos saber como te fué contratando los servicios de ${nombre} ${apellido} cuyo ${profesion} has requerido de sus servicios: ${descripcionTrabajo} acordando para el dia ${fechaTrabajo} según los datos que nos aportaste, estaríamos encantados de que califiques y comentes su atención, si lo deseas, puedes hacer <a href="${link}">click aquí</a> para hacerlo, de lo contrario, ignora este mail`,
  };
  sgMail
    .send(msg)
    .then(() => console.log("Se ha enviado el mail de calificación"))
    .catch((error) => console.error(error));

  res.status(200).json({
    success: true,
    message: "Se ha enviado el mensaje correctamente",
  });
};

//get token for validate user interface protected route
const commentAndRatingGet = async (req, res) => {
  try {
    const { email, token } = req.body;

    if (!email || !token) {
      return res
        .status(400)
        .json({ error: "Falta el correo electrónico o el token" });
    }

    const foundUser = await User.findOne({ email });

    if (!foundUser) {
      return res.status(404).json({
        error:
          "No se encontró ningún usuario con el correo electrónico proporcionado",
      });
    }

    const matchingToken = foundUser.tokenCalificacion.find(
      (obj) => obj.token === token
    );

    if (matchingToken.length === 0) {
      return res
        .status(404)
        .json({ error: "No se encontró ningún token que coincida" });
    }

    const isTokenExpired = checkIfTokenExpired(token);
    if (isTokenExpired) {
      // El token ha expirado, eliminarlo de la base de datos
      foundUser.tokenContacto = foundUser.tokenContacto.filter(
        (item) => item.token !== token
      );
      await foundUser.save();
      return res.status(400).json({
        error: "El enlace ha expirado. Por favor, solicita un nuevo enlace.",
      });
    }

    res.json(matchingToken.token);
  } catch (error) {
    console.error("Error en commentAndRatingGet:", error);
    res.status(500).json({ error: "Se produjo un error en el servidor" });
  }
};

module.exports = {
  getProfessionalDetails,
  getProfessionalById,
  addProfessional,
  addComment,
  didYouContactHim,
  didYouContactHimGetToken,
  commentAndRating,
  commentAndRatingGet,
};
