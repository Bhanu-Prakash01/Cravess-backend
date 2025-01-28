const express = require("express");
const { createReview } = require("../controllers/RatingAndReviewController");
const router = express.Router()

const { auth, isUser } = require("../middlewares/RBAC");

router.post('/addRating',auth,isUser,createReview)      //user will use this api



module.exports=router;