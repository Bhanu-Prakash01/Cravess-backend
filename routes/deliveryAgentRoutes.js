const express = require("express");
const router = express.Router();
const {
  createDeliveryAgent,
  updateDeliveryAgentProfile,
  getDeliveryAgentDetailsById,
  changeAvailabilityStatus,
  agentAcceptOrDecline,
  confirmOrderDelivery,
  getOrderRequestByAgentId,
  getAcceptedOrderDetails,
  deliveryAgentDashboardCounts,
  orderHistory
} = require("../controllers/DeliveryAgentController");

const { 
  multipleFileUpload,
  uploadSingleFile
} = require("../controllers/restaurantController");

const {
  updateUser,
} = require("../controllers/userProfileManagement");

const { auth, isDeliveryAgent} = require("../middlewares/RBAC");

router.put("/updateProfileDetails/:id",auth,isDeliveryAgent, updateUser);
router.post("/createDeliveryAgent",auth,isDeliveryAgent, createDeliveryAgent);
// router.put("/UpdateDeliveryAgent/:id",auth,isDeliveryAgent, updateDeliveryAgentProfile);

router.get("/getDeliveryAgent/:id", getDeliveryAgentDetailsById);
router.put("/availability/:id", auth, isDeliveryAgent, changeAvailabilityStatus);

router.get("/getOrderRequestByAgentId/:agentId", auth, isDeliveryAgent, getOrderRequestByAgentId)
router.post("/acceptOrDeclineOrder", auth, isDeliveryAgent, agentAcceptOrDecline);
router.get("/getAcceptedOrderDetails/:orderId", auth, isDeliveryAgent, getAcceptedOrderDetails);
router.post("/confirmOrderDelivery", auth, isDeliveryAgent, confirmOrderDelivery);

router.get("/deliveryAgentDashboardCounts/:id", auth, isDeliveryAgent, deliveryAgentDashboardCounts);
router.get('/orderHistory/:id', auth, isDeliveryAgent, orderHistory);

router.post("/multipleFileUpload",auth, multipleFileUpload);

router.post("/uploadSingleFile",auth,  uploadSingleFile);

module.exports = router;
