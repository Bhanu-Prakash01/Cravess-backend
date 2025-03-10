const express = require("express");
const router = express.Router();
const {
  registerUser,
  loginUser,
  changePassword,
} = require("../controllers/userController");

const { 
  multipleFileUpload,
  uploadSingleFile
} = require("../controllers/restaurantController");

const { auth } = require("../middlewares/RBAC");

router.post("/register", registerUser);
router.post("/changePassword", changePassword);
router.post("/loginUser", loginUser);
router.post("/multipleFileUpload",auth, multipleFileUpload);

router.post("/uploadSingleFile",auth,  uploadSingleFile);

module.exports = router;