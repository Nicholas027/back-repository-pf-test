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
  .route("/professionals/contactHim/:id")
  .post(professionalController.didYouContactHim);
router
  .route("/professionals/contactHimGet/:id")
  .post(professionalController.didYouContactHimGetToken);

router
  .route("/professionals/commentAndRatingMail/:id")
  .post(professionalController.commentAndRating);

router
  .route("/professionals/commentAndRatingMailGet/:id")
  .post(professionalController.commentAndRatingGet);

module.exports = router;
