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
  getAllAddressByUser,
  deleteAllAddressByUser,
  deleteAddressByUser
} = require("../controllers/userProfileManagement");

router.put("/updatePreProfileDetails/:id", updateUser);
router.get("/getUserById/:id", getUserById);
router.post("/addUserAddress", addUserAddress);
router.get("/getUserAddress/:userId/:addressId", getUserAddress);
router.get("/getAllAddressByUser/:id", getAllAddressByUser);
router.delete("/deleteAllAddressByUser/:id", deleteAllAddressByUser);
router.delete("/deleteAddressByUser/:userId/:addressId",deleteAddressByUser);

router.post("/createDeliveryAgent", createDeliveryAgent);
router.put("/UpdateDeliveryAgent/:id", updateDeliveryAgentProfile);

router.get("/getDeliveryAgent/:id", getDeliveryAgentDetailsById);

module.exports = router;
