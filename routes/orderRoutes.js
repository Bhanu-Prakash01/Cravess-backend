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
    removeFromCart,
    removeOneFromCart
} = require("../controllers/orderControllers");
const { auth, isUser } = require("../middlewares/RBAC");

// Route to place an order
router.post('/placeOrder',auth,isUser, placeOrder)           // user will use this api   //user

// Route to track an order
router.get("/trackOrder/:id", trackOrder)        // user or restaurant or delivery agent  will use this api //user,restaurant

// Route to update an order
// router.put('/updateOrder/:id',auth,isUser, updateOrder)      // user,restaurant will use this api

// Route to cancel an order
router.delete('/cancelOrder/:id', cancelOrder)    // user, restaurant will use this api  //user&restaurant

router.get('/getOrdersByUser/:id', auth, isUser, getOrdersByUserId)  //public

router.post("/addToCart", auth, isUser, addToCart);

router.post('/switchRestaurant', auth, isUser, switchRestaurant)

router.delete("/removeOneFromCart", auth, isUser, removeOneFromCart)

router.delete("/removeFromCart",auth, isUser, removeFromCart)

router.get("/getAddedItemsInCart/:id",auth, isUser, getAddedItemsInCartByUser)

module.exports = router;