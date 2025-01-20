const express = require('express');
const router = express.Router();

// Import the necessary controllers
const {
    placeOrder,
    updateOrder,
    cancelOrder,
    trackOrder
} = require("../controllers/orderControllers")

// Route to place an order
router.post('/placeOrder', placeOrder)           // user will use this api

// Route to track an order
router.get("/trackOrder/:id", trackOrder)        // user or restaurant or delivery agent  will use this api 

// Route to update an order
router.put('/updateOrder/:id', updateOrder)      // restaurant will use this api

// Route to cancel an order
router.delete('/cancelOrder/:id', cancelOrder)    // user, restaurant will use this api

module.exports = router;