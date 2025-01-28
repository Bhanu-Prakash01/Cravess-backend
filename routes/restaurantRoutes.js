// Import necessary modules
const express = require("express");
const router = express.Router();

// Import the restaurant controllers
const {
  addRestaurantDetails,
  updateRestaurantProfile,
  getRestaurantDetailsById,
  changeAvailabilityStatus,
  addDish,
  getDishesByRestaurant,
  getAllDishes,
  getDishById,
  getAllRestaurants,
  deleteDishesById,
 
  updateDish
} = require("../controllers/restaurantController");
const { auth, isRestaurant } = require("../middlewares/RBAC");

// Route to get a restaurant
router.get("/GetRestaurant/:id", getRestaurantDetailsById);

// Route to create a new restaurant
router.post("/AddRestaurant", auth, isRestaurant, addRestaurantDetails);

router.get("/getAllRestaurants",getAllRestaurants )

// Route to update a restaurant by ID
router.put("/UpdateRestaurant/:id", auth, isRestaurant, updateRestaurantProfile);

// Route to update restaurant Time by Id
router.put("/availability/:id", auth, isRestaurant, changeAvailabilityStatus);     

// Route to dish of a restaurant
router.post("/addDish", auth, isRestaurant, addDish);

router.put("/updateDish/:id", auth, isRestaurant, updateDish);

// Route to get dishes of a restaurant
router.get("/getDish/:restaurantId", getDishesByRestaurant);

router.get("/getAllDishes",getAllDishes);

router.get("/getDishById/:id",getDishById);

router.delete("/deleteDishes/:id",auth, isRestaurant, deleteDishesById);



module.exports = router;