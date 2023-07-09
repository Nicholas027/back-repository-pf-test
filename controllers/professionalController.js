const Professional = require("../models/Professional");
const mongoose = require("mongoose");
const User = require("../models/User");
//const sgMail = require("@sendgrid/mail");
const moment = require("moment");
//sgMail.setApiKey(process.env.SENDGRID_API_KEY);
const transporter = require("../helpers/mailer");

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
  const {
    nombrePersona,
    descripcion,
    calificacionComentario,
    idSoli,
    emailCliente,
  } = req.body;
  const professionalId = req.params.id;

  try {
    const professional = await Professional.findById(professionalId);
    if (!professional) {
      return res.status(404).json({ error: "Profesional no encontrado" });
    }

    const foundUser = await User.findOne({ email: emailCliente });

    if (!foundUser) {
      return res.status(404).json({
        error: "No se encontró ningún usuario con el correo proporcionado",
      });
    }

    const solicitud = foundUser.misSolicitudes.find(
      (s) => s._id.toString() === idSoli
    );

    if (!solicitud) {
      return res.status(404).json({
        error: "No se encontró ninguna solicitud con el ID proporcionado",
      });
    }

    solicitud.flujoCompleto = true;
    await foundUser.save();

    const nuevoComentario = {
      titulo: "",
      descripcion,
      nombrePersona,
      fotoPersona: "",
      calificacionComentario,
    };

    professional.comentarios.push(nuevoComentario);

    await professional.save();

    return res.json({
      ok: "Comentario Agregado y el usuario ya ha completado su flujo",
    });
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
  console.log(req.body);
  let {
    nombreCliente,
    apellidoCliente,
    fechaTrabajo,
    horarioTrabajo,
    descripcionTrabajo,
    emailProf,
    nombreProfesional,
    emailCli,
    numeroProfesional,
    direccionCliente,
  } = req.body;

  if (!nombreCliente || !apellidoCliente || !fechaTrabajo) {
    return res.status(400).json({ error: "Faltan datos del cliente" });
  }

  const foundUser = await User.findOne({ email: emailCli });

  const formattedFechaTrabajo = fechaTrabajo.map((date) => {
    const dateObj = new Date(date);
    const year = dateObj.getFullYear();
    const month = String(dateObj.getMonth() + 1).padStart(2, "0");
    const day = String(dateObj.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  });

  console.log(formattedFechaTrabajo);

  if (descripcionTrabajo == "") {
    descripcionTrabajo = `trabajo corriente de ${profesion}`;
  }

  const encabezadoLink = "https://datazobacktest.onrender.com";
  const solicitudId = mongoose.Types.ObjectId();
  const linkAceptar = `${encabezadoLink}/professionals/acceptForm/${emailCli}/${nombreProfesional}/${solicitudId}`;
  const linkRechazar = `${encabezadoLink}/professionals/rejected/${emailCli}/${nombreProfesional}/${solicitudId}`;
  const date1 = new Date(fechaTrabajo[0]);
  const date2 = new Date(fechaTrabajo[1]);

  //Aquí se envía el correo con Sendgrid
  /** const msg = {
    to: emailProf,
    from: "datazosoporte@outlook.com",
    subject: "Te han contactado desde Datazo!",
    html: `<p>¡${nombreProfesional}! Te ha contactado ${nombreCliente} ${apellidoCliente} para solicitar de tus servicios como ${profesion}!</p>
    <p>El solicitante necesita de ${descripcionTrabajo} para las fechas entre ${date1.getFullYear()}-${(
      date1.getMonth() + 1
    )
      .toString()
      .padStart(2, "0")}-${date1
      .getDate()
      .toString()
      .padStart(2, "0")} y ${date2.getFullYear()}-${(date2.getMonth() + 1)
      .toString()
      .padStart(2, "0")}-${date2
      .getDate()
      .toString()
      .padStart(2, "0")} en horario de la ${horarioTrabajo}</p>
    <p>En caso de aceptar la orden de trabajo: <a href="${linkAceptar}" target="_blank">haz click aquí</a></p>
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
  */

  //bloque de reserva Nodemailer (?)
  const result = await transporter
    .sendMail({
      from: `Soporte Tecnico Datazo ${process.env.NODEMAILER_USER}`,
      to: emailProf,
      subject: "Te han contactado desde Datazo!",
      html: `<p>¡${nombreProfesional}! Te ha contactado ${nombreCliente} ${apellidoCliente} para solicitar de tus servicios como ${profesion}!</p>
    <p>El solicitante necesita de ${descripcionTrabajo} para las fechas entre ${date1.getFullYear()}-${(
        date1.getMonth() + 1
      )
        .toString()
        .padStart(2, "0")}-${date1
        .getDate()
        .toString()
        .padStart(2, "0")} y ${date2.getFullYear()}-${(date2.getMonth() + 1)
        .toString()
        .padStart(2, "0")}-${date2
        .getDate()
        .toString()
        .padStart(2, "0")} en horario de la ${horarioTrabajo}</p>
    <p>En caso de aceptar la orden de trabajo: <a href="${linkAceptar}" target="_blank">haz click aquí</a></p>
    <p>En caso de negarlo, puedes <a href="${linkRechazar}" target="_blank">hacer click aquí</a></p></p>
    <p>Gracias por confiar en nosotros! Atentamente, el equipo de Datazo!</p>
    <br>
    <img src="https://i.ibb.co/s5M2hB8/datazologo.png" alt="datazologo" border="0" />`,
    })
    .then((result) => console.log(result))
    .catch((error) => console.log(error));

  const nombreDeProfesional = nombre + " " + apellido;

  const nuevoTrabajo = {
    _id: solicitudId,
    profesionalId: id,
    profesional: nombreDeProfesional,
    profesion: profesion,
    numeroProfesional: numeroProfesional,
    direccionCliente: direccionCliente,
    descripcion: descripcionTrabajo,
    fecha: formattedFechaTrabajo, //Esto debe ser un rango de fechas
    horario: horarioTrabajo,
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

//work form
const acceptForm = async (req, res) => {
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

  function getDatesInRange(startDate, endDate) {
    const dates = [];
    const current = moment(startDate);
    const last = moment(endDate);

    while (current <= last) {
      dates.push(current.format("YYYY-MM-DD"));
      current.add(1, "days");
    }

    return dates;
  }

  // Ejemplo de uso
  const startDate = solicitud.fecha[0];
  const endDate = solicitud.fecha[1];
  const descripcion = solicitud.descripcion;
  const horario = solicitud.horario;
  const cliente = foundUser.nombre + " " + foundUser.apellido;
  const idSolicitud = solicitud._id;
  const emailCliente = foundUser.email;
  const nombreProf = solicitud.profesional;
  const numeroProfesional = solicitud.numeroProfesional;
  const direccionCliente = solicitud.direccionCliente;

  if (solicitud.aceptado === true) {
    res.render("accepted");
  } else {
    res.render("acceptarTrabajoForm", {
      nombreProf,
      emailCliente,
      numeroProfesional,
      direccionCliente,
      idSolicitud,
      descripcion,
      horario,
      cliente,
      fechasRango: getDatesInRange(startDate, endDate),
    });
  }
};

//accepted work
const acceptedWork = async (req, res) => {
  const {
    presupuesto,
    fecha,
    comentario,
    idSolicitud,
    emailCliente,
    nombreProf,
    numeroProfesional,
  } = req.body;

  if (!emailCliente) {
    return res
      .status(400)
      .json({ error: "No se ha detectado un correo electrónico válido" });
  }

  if (!nombreProf) {
    return res
      .status(400)
      .json({ error: "No se ha detectado el nombre de un profesional" });
  }

  if (!idSolicitud) {
    return res
      .status(400)
      .json({ error: "No se ha detectado un ID de solicitud válido" });
  }

  try {
    const foundUser = await User.findOne({ email: emailCliente });

    if (!foundUser) {
      return res.status(404).json({
        error: "No se encontró ningún usuario con el correo proporcionado",
      });
    }

    const solicitud = foundUser.misSolicitudes.find(
      (s) => s._id.toString() === idSolicitud
    );

    if (!solicitud) {
      return res.status(404).json({
        error: "No se encontró ninguna solicitud con el ID proporcionado",
      });
    }

    // Actualizar los campos de la solicitud
    solicitud.presupuesto = presupuesto;
    solicitud.fechaElegida = fecha;
    solicitud.comentario = comentario;
    solicitud.numeroProfesional = numeroProfesional;
    solicitud.aceptado = true;

    await foundUser.save();

    const decodedNombreProfesional = decodeURIComponent(
      nombreProf.replace(/\+/g, " ")
    );

    /** const msg = {
      to: emailCliente,
      from: "soportetecnicodatazo@gmail.com",
      subject: "Te han respondido desde Datazo",
      html: `${decodedNombreProfesional} ha respondido a tu solicitud de trabajo!
    <p>Puedes fijarte en <b>"Mis Solicitudes"</b> la propuesta que ${decodedNombreProfesional} ha hecho sobre tu solicitud</p>
    <p><b>Recuerda</b> revisar siempre tu registro de solicitudes para mantener continuo control sobre tus solicitudes!</p>
    <p>En caso de aceptar su propuesta, debes presionar "Aceptar Propuesta", de lo contrario, simplemente puedes rechazarla!</p>
    <p>Gracias por confiar en nosotros. Atentamente, el equipo de Datazo!</p>
    <br>
    <img src="https://i.ibb.co/s5M2hB8/datazologo.png" alt="datazologo" border="0" />`,
    };
    sgMail
      .send(msg)
      .then(() => console.log("Se ha enviado el mail propuesta de trabajo"))
      .catch((error) => console.error(error)); */

    //Bloque de respuesta de solicitud de trabajo con Nodemailer
    const result = await transporter
      .sendMail({
        from: `Soporte Tecnico Datazo ${process.env.NODEMAILER_USER}`,
        to: emailCliente,
        subject: "Te han respondido desde Datazo",
        html: `${decodedNombreProfesional} ha respondido a tu solicitud de trabajo!
    <p>Puedes fijarte en <b>"Mis Solicitudes"</b> la propuesta que ${decodedNombreProfesional} ha hecho sobre tu solicitud</p>
    <p><b>Recuerda</b> revisar siempre tu registro de solicitudes para mantener continuo control sobre tus solicitudes!</p>
    <p>En caso de aceptar su propuesta, debes presionar "Aceptar Propuesta", de lo contrario, simplemente puedes rechazarla!</p>
    <p>Gracias por confiar en nosotros. Atentamente, el equipo de Datazo!</p>
    <br>
    <img src="https://i.ibb.co/s5M2hB8/datazologo.png" alt="datazologo" border="0" />`,
      })
      .then(() => console.log("Se ha enviado el mail de propuesta de trabajo"))
      .catch((error) => {
        console.log(error);
      });

    res.render("accepted");
  } catch (error) {
    console.error(error);
    res
      .status(500)
      .json({ error: "Ocurrió un error al procesar la propuesta" });
  }
};

//work rejected soli
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

  if (solicitud.aceptado === false) {
    res.render("beenRejected");
  } else {
    /** const msg = {
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
      .catch((error) => console.error(error)); */

    //Bloque de rechazo de solicitud de trabajo
    const result = await transporter
      .sendMail({
        from: `Soporte Tecnico Datazo ${process.env.NODEMAILER_USER}`,
        to: mailCli,
        subject: "Tu solicitud ha sido rechazada",
        html: `${decodedNombreProfesional} ha rechazado lamentablemente tu solicitud de trabajo!
      <p>Puedes optar por probar otra fecha dentro del formulario de contacto en el perfil suyo. Si lo deseas puedes <a href="https://datazotest.netlify.app" target="_blank">volver a Datazo</a>.</p>
      <p>Gracias por confiar en nosotros. Atentamente, el equipo de Datazo!</p>
      <br>
      <img src="https://i.ibb.co/s5M2hB8/datazologo.png" alt="datazologo" border="0" />`,
      })
      .then(() => console.log("Se ha enviado el mail de rechazo de trabajo"))
      .catch((error) => {
        console.log(error);
      });

    // Actualizar el estado de aceptado a false = solicitud rechazada
    solicitud.aceptado = false;

    await foundUser.save();

    res.render("rejected");
  }
};

module.exports = {
  getProfessionalDetails,
  getProfessionalById,
  addProfessional,
  addComment,
  commentAndRating,
  acceptForm,
  acceptedWork,
  rejectedWork,
};
