const express = require("express");
const router = express.Router()
const {
    getAllUsersList,
    getAllRestaurantsList,
    getAllDeliveryAgentsList,
    getAllOrdersList,
    verifyAgents,
    getUnderVerificationList,
    getDashCounts,
    getAllDishesList,
    getOrderGraphData,
} = require("../controllers/adminController");

const { redeemPoints } = require("../controllers/LoyaltyReward");
const { orderHistory } = require("../controllers/DeliveryAgentController");
const { getAllOrdersByRestaurant } = require("../controllers/restaurantController");
const {
    getAllRatingAndReviews,
    getAllReviewsBreakdown,
    getRestaurantReviewBreakdown,
    getAgentReviewBreakdown,
    getMonthlyReviewsBreakdown
} = require("../controllers/RatingAndReviewController");
const { auth, isAdmin } = require("../middlewares/RBAC");

router.get('/getAllUsersList', auth, isAdmin, getAllUsersList)
router.get('/getAllRestaurantsList', auth, isAdmin, getAllRestaurantsList)
router.get('/getAllDeliveryAgentsList', auth, isAdmin, getAllDeliveryAgentsList)

router.get('/getAllRatingAndReviews', auth, isAdmin, getAllRatingAndReviews)
router.get('/getAllOrdersList', auth, isAdmin, getAllOrdersList)
router.post('/verifyAgents', auth, isAdmin, verifyAgents)
router.get("/getUnderVerificationList", auth, isAdmin, getUnderVerificationList);

router.get("/reviews/summary", auth, isAdmin, getAllReviewsBreakdown);
router.get("/reviews/monthlySummary", auth, isAdmin, getMonthlyReviewsBreakdown);

router.get("/reviews/summary/:restaurantId", auth, isAdmin, getRestaurantReviewBreakdown);
router.get("/reviews/agentsummary/:agentId", auth, isAdmin, getAgentReviewBreakdown);
router.get("/getDashCounts", auth, isAdmin, getDashCounts);
router.get("/getAllDishesList", auth, isAdmin, getAllDishesList);
router.get('/getAgentOrderHistory/:id', auth, isAdmin, orderHistory);
router.get("/getRestaurantOrderHistory/:id", auth, isAdmin, getAllOrdersByRestaurant);
router.get('/getOrderGraphData', auth, isAdmin, getOrderGraphData);

router.post('/redeemPoints', auth, isAdmin, redeemPoints);

module.exports = router;