const Professional = require("../models/Professional");

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

module.exports = {
  getProfessionalDetails,
  getProfessionalById,
  addProfessional,
};
