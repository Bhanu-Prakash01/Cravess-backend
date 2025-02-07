const express = require("express");
const router = express.Router();

// Import necessary controllers
const {
  addRewards,
  activateReward,
  redeemPoints,
  getLoyaltyPointsByUser
} = require("../controllers/LoyaltyReward");
const { auth, isRestaurant, isAdmin, isDeliveryAgent, isUser } = require("../middlewares/RBAC");

// Route to add rewards
router.post("/addRewards",auth,isAdmin, addRewards);

// Route to activate a reward
router.patch('/api/rewards/:rewardId/activate', auth,isAdmin, activateReward);

// Route to redeem points for a reward
router.patch('redeem/:rewardId/:userId', auth,isUser, redeemPoints);

router.get("/loyalty-points-log/:userId",auth, isUser, getLoyaltyPointsByUser);

module.exports = router;