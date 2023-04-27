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

router.route("/passwordRecoveryMail").post(authController.passwordRecoveryMail);

router.route("/verifyCode").post(authController.verifyVerificationCode);

module.exports = router;
