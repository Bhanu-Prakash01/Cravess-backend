const express = require("express");
const router = express.Router();
const {
  updateUser,
  getUserById,
  addUserAddress,
  updateUserAddress,
  getUserAddress,
  getAllAddressByUser,
  deleteAllAddressByUser,
  deleteAddressByUser,
  addFavouriteDish,
  addFavouriteRestaurant,
  getAllFavouriteDishes,
  getAllFavouriteRestaurants,
  removeFavouriteDish,
  removeFavouriteRestaurant
} = require("../controllers/userProfileManagement");
const { auth, isUser } = require("../middlewares/RBAC");

router.put("/updateProfileDetails/:id",auth,isUser, updateUser);
router.get("/getUserById/:id", getUserById);
router.post("/addUserAddress",auth,isUser, addUserAddress);
router.put("/updateUserAddress/:addressId",auth,isUser, updateUserAddress);
router.get("/getUserAddress/:userId/:addressId",auth,isUser, getUserAddress);
router.get("/getAllAddressByUser/:id",auth,isUser, getAllAddressByUser);
router.delete("/deleteAllAddressByUser/:id",auth,isUser, deleteAllAddressByUser);
router.delete("/deleteAddressByUser/:userId/:addressId",auth,isUser, deleteAddressByUser);

router.post("/addFavouriteDish",auth,isUser,addFavouriteDish);

router.post("/addFavouriteRestaurant",auth,isUser,addFavouriteRestaurant);

router.get("/getFavouriteDishes/:id", auth,isUser,getAllFavouriteDishes);

router.get("/getFavouriteRestaurants/:id", auth,isUser,getAllFavouriteRestaurants);

router.delete("/deleteFavouriteDish/:userId/dish/:dishId", auth,isUser,removeFavouriteDish);

router.delete("/deleteFavouriteRestaurant/:userId/restaurant/:restaurantId", auth,isUser,removeFavouriteRestaurant);

module.exports = router;
