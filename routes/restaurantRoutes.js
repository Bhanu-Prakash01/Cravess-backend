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
  addFavouriteDish,
  addFavouriteRestaurant,
  updateDish
} = require("../controllers/restaurantController");

// Route to get a restaurant
router.get("/GetRestaurant/:id", getRestaurantDetailsById);

// Route to create a new restaurant
router.post("/AddRestaurant", addRestaurantDetails);

router.get("/getAllRestaurants",getAllRestaurants )

// Route to update a restaurant by ID
router.put("/UpdateRestaurant/:id", updateRestaurantProfile);

// Route to update restaurant Time by Id
router.put("/availability/:id", changeAvailabilityStatus);     

// Route to dish of a restaurant
router.post("/addDish", addDish);

router.put("/updateDish/:id", updateDish);

// Route to get dishes of a restaurant
router.get("/getDish/:restaurantId", getDishesByRestaurant);

router.get("/getAllDishes",getAllDishes);

router.get("/getDishById/:id",getDishById);

router.delete("/deleteDishes/:id", deleteDishesById);

router.post("/addFavouriteDish",addFavouriteDish);

router.post("/addFavouriteRestaurant",addFavouriteRestaurant);

module.exports = router;