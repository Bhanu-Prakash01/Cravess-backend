const express = require("express");
const router = express.Router();
const {
  registerUser,
  loginUser,
  changePassword,
} = require("../controllers/userController");

router.post("/register", registerUser);
router.post("/changePassword", changePassword);
router.post("/loginUser", loginUser);


module.exports = router;