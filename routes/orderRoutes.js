const express = require('express');
const router = express.Router();

// Import the necessary controllers
const {
    placeOrder,
    updateOrder,
    cancelOrder,
    trackOrder,
    getOrdersByUserId,
    addToCart,
    getAddedItemsInCartByUser,
    switchRestaurant,
    removeFromCart
} = require("../controllers/orderControllers");
const { add } = require('../models/discountSchema');

// Route to place an order
router.post('/placeOrder', placeOrder)           // user will use this api   //user

// Route to track an order
router.get("/trackOrder/:id", trackOrder)        // user or restaurant or delivery agent  will use this api //user,restaurant

// Route to update an order
router.put('/updateOrder/:id', updateOrder)      // user,restaurant will use this api

// Route to cancel an order
router.delete('/cancelOrder/:id', cancelOrder)    // user, restaurant will use this api  //user&restaurant

router.get('/getOrdersByUser/:id',getOrdersByUserId)  //public

router.post("/addToCart", addToCart);

router.post('/switchRestaurant',switchRestaurant)

router.delete("/removeFromCart",removeFromCart)

router.get("/getAddedItemsInCart/:id",getAddedItemsInCartByUser)

module.exports = router;