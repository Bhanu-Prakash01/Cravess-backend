const express = require("express");
const router = express.Router()
const {
    getAllUsersList,
    getAllRestaurantsList,
    getAllDeliveryAgentsList,
    getAllOrdersList,
    verifyAgents,
    getUnderVerificationList
} = require("../controllers/adminController");

const { getAllRatingAndReviews } = require("../controllers/RatingAndReviewController");
const { auth, isAdmin } = require("../middlewares/RBAC");

router.get('/getAllUsersList', auth, isAdmin, getAllUsersList)
router.get('/getAllRestaurantsList', auth, isAdmin, getAllRestaurantsList)
router.get('/getAllDeliveryAgentsList', auth, isAdmin, getAllDeliveryAgentsList)

router.get('/getAllRatingAndReviews', auth, isAdmin, getAllRatingAndReviews)
router.get('/getAllOrdersList', auth, isAdmin, getAllOrdersList)
router.post('/verifyAgents', auth, isAdmin, verifyAgents)
router.get("/getUnderVerificationList", auth, isAdmin, getUnderVerificationList);

module.exports = router;