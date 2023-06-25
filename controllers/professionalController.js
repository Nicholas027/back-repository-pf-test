const Professional = require("../models/Professional");
const mongoose = require("mongoose");
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

  let {
    nombreCliente,
    apellidoCliente,
    fechaTrabajo,
    descripcionTrabajo,
    emailProf,
    nombreProfesional,
    emailCli,
  } = req.body;

  if (!nombreCliente || !apellidoCliente || !fechaTrabajo) {
    return res.status(400).json({ error: "Faltan datos del cliente" });
  }

  const foundUser = await User.findOne({ email: emailCli });

  if (descripcionTrabajo == "") {
    descripcionTrabajo = `trabajo corriente de ${profesion}`;
  }

  const encabezadoLink = "https://datazobacktest.onrender.com";
  const solicitudId = mongoose.Types.ObjectId();
  const linkAceptar = `${encabezadoLink}/professionals/accepted/${emailCli}/${nombreProfesional}/${solicitudId}`;
  const linkRechazar = `${encabezadoLink}/professionals/rejected/${emailCli}/${nombreProfesional}/${solicitudId}`;

  //Aquí se envía el correo con Sendgrid
  const msg = {
    to: emailProf,
    from: "soportetecnicodatazo@gmail.com",
    subject: "Te han contactado desde Datazo!",
    html: `<p>¡${nombreProfesional}! Te ha contactado ${nombreCliente} ${apellidoCliente} para solicitar de tus servicios como ${profesion}!</p>
    <p>El solicitante necesita de ${descripcionTrabajo} para la fecha ${fechaTrabajo}</p>
    <p>En caso de aceptar el trabajo solicitado: <a href="${linkAceptar}" target="_blank">haz click aquí</a></p>
    <p>En caso de negarlo, puedes <a href="${linkRechazar}" target="_blank">hacer click aquí</a></p></p>
    <p>Gracias por confiar en nosotros! Atentamente, el equipo de Datazo!</p>
    <br>
    <img src="https://i.ibb.co/s5M2hB8/datazologo.png" alt="datazologo" border="0" />`,
  };
  sgMail
    .send(msg)
    .then(() => console.log("Se ha enviado el mail para contactar"))
    .catch((error) => console.error(error));
  //Fin de bloque mail

  const nombreDeProfesional = nombre + " " + apellido;

  const nuevoTrabajo = {
    _id: solicitudId,
    profesionalId: id,
    profesional: nombreDeProfesional,
    profesion: profesion,
    descripcion: descripcionTrabajo,
    fecha: fechaTrabajo, //Esto debe ser un rango de fechas hasta tener el frontend
    horario: "Tarde", //Hasta tener el frontend
    aceptado: null, // Estado en espera: Null
  };

  foundUser.misSolicitudes.push(nuevoTrabajo);
  await foundUser.save();

  res.status(200).json({
    success: true,
    message:
      "Se ha enviado el mensaje correctamente, generado la solicitud y guardada",
  });
};

const acceptedWork = async (req, res) => {
  const { mailCli, nombreProfesional, id } = req.params;

  if (!mailCli) {
    return res.status(400).json({ error: "No se ha detectado un mail valido" });
  }

  if (!nombreProfesional) {
    return res
      .status(400)
      .json({ error: "No se ha detectado el nombre de un profesional" });
  }

  if (!id) {
    return res
      .status(400)
      .json({ error: "No se ha detectado un ID de solicitud válido" });
  }

  const foundUser = await User.findOne({ email: mailCli });

  if (!foundUser) {
    return res.status(404).json({
      error: "No se encontró ningún usuario con el correo proporcionado",
    });
  }

  const solicitud = foundUser.misSolicitudes.find(
    (s) => s._id.toString() === id
  );

  if (!solicitud) {
    return res.status(404).json({
      error: "No se encontró ninguna solicitud con el ID proporcionado",
    });
  }

  const decodedNombreProfesional = decodeURIComponent(
    nombreProfesional.replace(/\+/g, " ")
  );

  const msg = {
    to: mailCli,
    from: "soportetecnicodatazo@gmail.com",
    subject: "Tu solicitud ha sido aceptada!",
    html: `<p>${decodedNombreProfesional} ha aceptado tu solicitud de trabajo!</p>
    <p>Se ha aceptado ${solicitud.descripcion} para la fecha ${solicitud.fecha} en horario de la ${solicitud.horario}.</p>
    <p>Recuerda que puedes seguir monitoreando tus otras solicitudes en "Mis Solicitudes", muchas gracias por confiar en nosotros!</p>
    <p>Atentamente, el equipo de Datazo</p>
    <br>
    <img src="https://i.ibb.co/s5M2hB8/datazologo.png" alt="datazologo" border="0" />`,
  };
  sgMail
    .send(msg)
    .then(() => console.log("Se ha enviado el mail de aceptacion de trabajo"))
    .catch((error) => console.error(error));

  // Actualizar el estado de aceptado a true = solicitud aceptada
  solicitud.aceptado = true;

  await foundUser.save();

  res.render("accepted");
};

const rejectedWork = async (req, res) => {
  const { mailCli, nombreProfesional, id } = req.params;

  if (!mailCli) {
    return res.status(400).json({ error: "No se ha detectado un mail valido" });
  }

  if (!nombreProfesional) {
    return res
      .status(400)
      .json({ error: "No se ha detectado el nombre de un profesional" });
  }

  if (!id) {
    return res
      .status(400)
      .json({ error: "No se ha detectado un ID de solicitud válido" });
  }

  const decodedNombreProfesional = decodeURIComponent(
    nombreProfesional.replace(/\+/g, " ")
  );

  const msg = {
    to: mailCli,
    from: "soportetecnicodatazo@gmail.com",
    subject: "Tu solicitud ha sido rechazada",
    html: `${decodedNombreProfesional} ha rechazado lamentablemente tu solicitud de trabajo!
    <p>Puedes optar por probar otra fecha dentro del formulario de contacto en el perfil suyo. Si lo deseas puedes <a href="https://datazotest.netlify.app" target="_blank">volver a Datazo</a>.</p>
    <p>Gracias por confiar en nosotros. Atentamente, el equipo de Datazo!</p>
    <br>
    <img src="https://i.ibb.co/s5M2hB8/datazologo.png" alt="datazologo" border="0" />`,
  };
  sgMail
    .send(msg)
    .then(() => console.log("Se ha enviado el mail de rechazo de trabajo"))
    .catch((error) => console.error(error));

  const foundUser = await User.findOne({ email: mailCli });

  if (!foundUser) {
    return res.status(404).json({
      error: "No se encontró ningún usuario con el correo proporcionado",
    });
  }

  const solicitud = foundUser.misSolicitudes.find(
    (s) => s._id.toString() === id
  );

  if (!solicitud) {
    return res.status(404).json({
      error: "No se encontró ninguna solicitud con el ID proporcionado",
    });
  }

  // Actualizar el estado de aceptado a false = solicitud rechazada
  solicitud.aceptado = false;

  await foundUser.save();

  res.render("rejected");
};

module.exports = {
  getProfessionalDetails,
  getProfessionalById,
  addProfessional,
  addComment,
  commentAndRating,
  acceptedWork,
  rejectedWork,
};
