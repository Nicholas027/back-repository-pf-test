const mongoose = require("mongoose");
const bcryptjs = require("bcryptjs");

const userSchema = new mongoose.Schema(
  {
    nombre: {
      type: String,
      required: true,
    },
    apellido: {
      type: String,
      required: true,
    },
    numeroContacto: {
      type: String,
      required: true,
    },
    email: {
      type: String,
      required: true,
      trim: true,
      unique: true,
      lowercase: true,
      index: { unique: true },
    },
    password: {
      type: String,
      required: true,
    },
    roles: {
      type: [String],
      default: ["Cliente"],
    },
    active: {
      type: Boolean,
      default: true,
    },
    tokenConfirm: {
      type: "string",
      default: null,
    },
    cuentaConfirmada: {
      type: "boolean",
      default: false,
    },
    codigoVerificacion: {
      type: "string",
      default: null,
    },
    misSolicitudes: [
      {
        _id: {
          type: "ObjectId",
        },
        profesionalId: {
          type: "ObjectId",
        },
        profesional: {
          type: String,
          default: null,
        },
        profesion: {
          type: String,
          default: null,
        },
        descripcion: {
          type: String,
          default: null,
        },
        fecha: {
          type: String,
          default: null,
        },
        horario: {
          type: String,
          default: null,
        },
        aceptado: {
          type: Boolean,
          default: null,
        },
      },
    ],
  },
  {
    versionKey: false,
  }
);

userSchema.pre("save", async function (next) {
  const user = this;

  if (!user.isModified("password")) return next();

  try {
    const salt = await bcryptjs.genSalt(10);
    user.password = await bcryptjs.hash(user.password, salt);
    next();
  } catch (error) {
    console.log(error);
    throw new Error("Hash Failed: " + error.message);
  }
});

userSchema.methods.comparePassword = async function (candidatePassword) {
  return await bcryptjs.compare(candidatePassword, this.password);
};

module.exports = mongoose.model("User", userSchema);
