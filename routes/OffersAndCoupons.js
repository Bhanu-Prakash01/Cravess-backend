const express = require("express")
const router = express.Router()

const {
    createOffer,
    removeOfferFromDishes,
    // addOfferToDish,
    // removeOfferFromDish,
    createCoupon,
    updateCoupon,
    deleteCoupon,
    getAllCoupons,
    getAllCouponsByRestaurantId,
    getCouponById
} = require("../controllers/offersAndCoupons")

const { auth, isRestaurant } = require("../middlewares/RBAC");

// Route to create a new offer
router.post("/createOffer", auth, isRestaurant, createOffer)

router.post("/removeOfferFromDishes", auth, isRestaurant, removeOfferFromDishes)
// Route to replace offers
// router.put('/offers/:offerId/restaurants/:restaurantId/dishes/:dishId', auth, isRestaurant, addOfferToDish);

// Route to delete the offers
// router.delete('/offers/:offerId/restaurants/:restaurantId/dishes/:dishId', auth, isRestaurant, removeOfferFromDish);

// Route to create a new coupon
router.post("/createCoupon",auth, isRestaurant, createCoupon)

// Route to update a coupon
router.put("/updateCoupon/:id",auth, isRestaurant, updateCoupon)

// Route to delete a coupon
router.delete("/deleteCoupon/:id", auth, isRestaurant, deleteCoupon)

router.get("/getAllCoupons", getAllCoupons)

router.get("/getCouponById/:id", getCouponById)

router.get("/getAllCouponsByRestaurant/:id", getAllCouponsByRestaurantId)

module.exports = router