const express = require("express");
const router = express.Router();
const {
  createDeliveryAgent,
  updateDeliveryAgentProfile,
  getDeliveryAgentDetailsById,
  changeAvailabilityStatus
} = require("../controllers/DeliveryAgentController");
const {
  updateUser,
} = require("../controllers/userProfileManagement");
const { auth, isDeliveryAgent} = require("../middlewares/RBAC");

router.put("/updateProfileDetails/:id",auth,isDeliveryAgent, updateUser);

router.post("/createDeliveryAgent",auth,isDeliveryAgent, createDeliveryAgent);
// router.put("/UpdateDeliveryAgent/:id",auth,isDeliveryAgent, updateDeliveryAgentProfile);

router.get("/getDeliveryAgent/:id", getDeliveryAgentDetailsById);
router.put("/availability/:id", auth, isDeliveryAgent, changeAvailabilityStatus);

module.exports = router;
