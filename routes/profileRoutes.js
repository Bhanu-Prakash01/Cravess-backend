const express = require("express");
const router = express.Router();
const {
  createDeliveryAgent,
  updateDeliveryAgentProfile,
  getDeliveryAgentDetailsById,
} = require("../controllers/DeliveryAgentController");
const { auth } = require("../controllers/RBAC");
const {
  updateUser,
  getUserById,
  addUserAddress,
  getUserAddress,
} = require("../controllers/userProfileManagement");

router.put("/updatePreProfileDetails/:id", updateUser);
router.get("/getUserById/:id", getUserById);
router.post("/addUserAddress/:id", addUserAddress);
router.get("/getUserAddress/:id", getUserAddress);
router.post("/createDeliveryAgent", createDeliveryAgent);
router.put("/UpdateDeliveryAgent/:id", updateDeliveryAgentProfile);

router.get("/getDeliveryAgent/:id", getDeliveryAgentDetailsById);

module.exports = router;
