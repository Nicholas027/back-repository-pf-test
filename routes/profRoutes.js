const express = require("express");
const router = express.Router();
const professionalController = require("../controllers/professionalController");

router
  .route("/professionals")
  .get(professionalController.getProfessionalDetails);

router
  .route("/professionals/:id")
  .get(professionalController.getProfessionalById);

router.route("/professionals/add").post(professionalController.addProfessional);

router
  .route("/professionals/addComment/:id")
  .post(professionalController.addComment);

router
  .route("/professionals/commentAndRatingMail/:id")
  .post(professionalController.commentAndRating);

router
  .route("/professionals/acceptForm/:mailCli/:nombreProfesional/:id")
  .get(professionalController.acceptForm);

router
  .route("/professionals/accepted")
  .post(professionalController.acceptedWork);

router
  .route("/professionals/rejected/:mailCli/:nombreProfesional/:id")
  .get(professionalController.rejectedWork);

module.exports = router;
