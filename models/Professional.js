const mongoose = require("mongoose");

const professionalSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: true,
      trim: true,
      unique: true,
      lowercase: true,
      index: { unique: true },
    },
    nombre: {
      type: String,
      required: true,
    },
    apellido: {
      type: String,
      required: true,
    },
    profesion: {
      type: String,
      required: true,
    },
    foto: {
      type: String,
      default: null,
    },
    calificacion: {
      type: String,
      required: false,
    },
    disponible: {
      type: String,
      required: false,
    },
    contacto: {
      type: String,
      required: false,
    },
    referencias: {
      type: String,
      required: false,
      maxlenght: 140,
    },
    zona: {
      type: String,
      required: false,
    },
    expLaboral: [
      {
        empresa: {
          type: String,
          required: false,
        },
        cargo: {
          type: String,
          required: false,
        },
        periodo: {
          type: String,
          required: false,
        },
      },
    ],
    educacion: [
      {
        institucion: {
          type: String,
          required: false,
        },
        titulo: {
          type: String,
          required: false,
        },
        periodo: {
          type: String,
          required: false,
        },
      },
    ],
    habilidades: [
      {
        habilidad: {
          type: String,
          required: false,
        },
      },
    ],
    comentarios: [
      {
        titulo: {
          type: String,
          required: false,
        },
        descripcion: {
          type: String,
          required: false,
        },
        nombrePersona: {
          type: String,
          required: false,
        },
        calificacionComentario: {
          type: String,
          required: false,
        },
      },
    ],
  },
  {
    versionKey: false,
  }
);

module.exports = mongoose.model("Professional", professionalSchema);
