const express = require("express");
const router = express.Router();
const authController = require("../controllers/authController");
const loginLimiter = require("../middleware/loginLimiter");
const { body } = require("express-validator"); //body validators

router
  .route("/") //login route
  .post(
    loginLimiter,
    [
      body("email", "Ingrese un email valido")
        .trim()
        .isEmail()
        .normalizeEmail(),
      body("password", "Ingrese una contraseña valida de minimo 6 caracteres")
        .trim()
        .isLength(6)
        .escape(),
    ],
    authController.login
  );

router.route("/refresh").get(authController.refresh); //refreshToken route

router.route("/logout").post(authController.logout); //logout route

router.route("/register").post(
  [
    body("nombreCompleto", "Ingrese un nombre valido")
      .trim()
      .notEmpty()
      .escape(),
    body("email", "Ingrese un email valido").trim().isEmail().normalizeEmail(),
    body("password", "Ingrese una contraseña valida de minimo 6 caracteres")
      .trim()
      .isLength({ min: 6 })
      .escape()
      .custom((value, { req }) => {
        if (value !== req.body.repassword) {
          throw new Error("Las contraseñas no coinciden");
        } else {
          return value;
        }
      }),
  ],
  authController.register
); //register route

router.route("/:token").get(authController.confirmarCuenta); //confirm account route

router.route("/passwordRecoveryMail").post(authController.passwordRecoveryMail); //send password recovery mail route

router.route("/verifyCode").post(authController.verifyVerificationCode); //verify the code

router.route("/getInfo/:email").get(authController.getInfo); //get user info

router.route("/getInfoSoli/:email/:idSoli").get(authController.getInfoSoli); //get user's works info

router.route("/deleteSoli/:id").post(authController.eliminarSolicitud); //delete work when is "waiting"

router.route("/deleteProp/:id").post(authController.cancelarPropuesta) //delete work when the prof has been accepted

router.route("/deleteSoliCompleted/:id").post(authController.deleteSoliCompleted) //delete work when the flux has been completed (all states)

router.route("/acceptProp/:id").post(authController.aceptarPropuesta) //accept prof's work (cash and comment)

module.exports = router;
