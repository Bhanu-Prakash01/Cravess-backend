const express = require("express");
const { getAllUsersList, getAllRestaurantsList, getAllDeliveryAgentsList } = require("../controllers/adminController");
const { getAllRatingAndReviews } = require("../controllers/RatingAndReviewController");
const router = express.Router()
const { auth, isAdmin } = require("../middlewares/RBAC");

router.get('/getAllUsersList', auth, isAdmin, getAllUsersList)
router.get('/getAllRestaurantsList', auth, isAdmin, getAllRestaurantsList)
router.get('/getAllDeliveryAgentsList', auth, isAdmin, getAllDeliveryAgentsList)

router.get('/getAllRatingAndReviews', auth, isAdmin, getAllRatingAndReviews)

module.exports = router;