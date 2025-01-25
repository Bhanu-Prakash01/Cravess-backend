const RestaurantDetails = require("../models/restaurantDetailsModel");
const AccountDetails = require("../models/BankDetailsModel");
const UserDetails = require("../models/userDetailsSchema");
const User = require("../models/userModel");
const Dish = require("../models/dishSchema")
const { uploadDocuments } = require("../Utils/Cloudinary");// Helper function to validate required fields
const validateFields = (fields, requiredFields) => {
  for (const field of requiredFields) {
    if (!fields[field]) {
      return `Field ${field} is required.`;
    }
  }
  return null;
};

exports.addRestaurantDetails = async (req, res) => {
  const {
    restaurantDetails,
    addressLine1,
    addressLine2,
    landmark,
    city,
    state,
    pincode,
    document,
    accountDetails,
    availabilityStatus,
    location,
    userId,
    // dishes,
    discounts,
    img,
    openingTime,
    closingTime,
    dishTypes
  } = req.body;
  const validationError = validateFields(req.body, [
    "restaurantDetails",
    "document",
    // "location",
    "openingTime",
    "closingTime",
    "dishTypes"
  ]);
  if (validationError) {
    return res.status(400).json({ error: validationError });
  }

  try {
    // Check if the account number already exists
    let savedAccountDetails;
    const existingAccount = await AccountDetails.findOne({ accountNumber: accountDetails.accountNumber });
    if (existingAccount) {
      savedAccountDetails = existingAccount;
    } else {
      // Save new account details
      const newAccountDetails = new AccountDetails(accountDetails);
      savedAccountDetails = await newAccountDetails.save();
    }
    const folderName =  'restaurant-documents';
    const documentUrl = await uploadDocuments(document, folderName, userId);
  if (!documentUrl) {
    return res.status(400).json({ error: 'No document uploaded or failed to upload document' });
  }

    // Create new RestaurantDetails
    const newRestaurant = new RestaurantDetails({
      restaurantDetails,
      full_restaurant_address: {
        addressLine1,
        addressLine2,
        landmark,
        city,
        state,
        pincode
      },
      document: documentUrl,
      accountDetails: savedAccountDetails,
      availabilityStatus,
      location,
      // dishes,
      discounts,
      img,
      openingTime,
      closingTime,
      dishTypes
    });

    const savedRestaurant = await newRestaurant.save();

    // Get the user who created the restaurant
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    // // Add the saved restaurant to the user's additionalDetails
    // user.additionalDetail = user.additionalDetail || [];
    // user.additionalDetail.push(savedRestaurant._id);
    // await user.save();
// Add or update the additionalDetail field in the user object
if (!user.additionalDetail || typeof user.additionalDetail !== "object") {
  user.additionalDetail = {};
}

// Update additionalDetail to include the new restaurant details
user.additionalDetail = {
  ...user.additionalDetail,
  restaurantId: savedRestaurant._id, // Add the restaurant ID
};


    await user.save();
    res.status(201).json({
      success: true,
      message: "Restaurant Details created successfully",
      data: savedRestaurant,
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

// Get restaurant details by ID
exports.getRestaurantDetailsById = async (req, res) => {
  try {
    const restaurantId = req.params.id;
    const restaurant = await RestaurantDetails.findById(restaurantId);
    if (!restaurant) {
      return res.status(404).json({ error: "Restaurant not found" });
    }
    res.status(200).json({success: true, message: "Restaurant details fetched successfully", data: restaurant });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

// Update restaurant profile
exports.updateRestaurantProfile = async (req, res) => {
  const {
    restaurantDetails,
    addressLine1,
    addressLine2,
    landmark,
    city,
    state,
    pincode,
    document,
    accountDetails,
    availabilityStatus,
    location,
    // dishes,
    discounts,  
    img,  
    openingTime,  
    closingTime,  
  } = req.body;

  const validationError = validateFields(req.body, [
    "restaurantDetails",
    "document",
    // "location",
    "openingTime", 
    "closingTime", 
  ]);
  if (validationError) {
    return res.status(400).json({ error: validationError });
  }

  try {
    const restaurantId = req.params.id;
    const restaurant = await RestaurantDetails.findById(restaurantId);
    if (!restaurant) {
      return res.status(404).json({ error: "Restaurant not found" });
    }

    // Update restaurant details
    restaurant.restaurantDetails = restaurantDetails;

    restaurant.full_restaurant_address = {
      addressLine1,
      addressLine2,
      landmark,
      city,
      state,
      pincode
    }
    // Update document
    const folderName =  'restaurant-documents-updated';
    const documentUrl = await uploadDocuments(document, folderName, restaurantId);
  if (!documentUrl) {
    return res.status(400).json({ error: 'No document uploaded or failed to upload document' });
  }
    restaurant.document = documentUrl;

    // Update account details
    const updatedAccountDetails = await AccountDetails.findByIdAndUpdate(
      restaurant.accountDetails,
      { $set: accountDetails },
      { new: true }
    );

    // Update availability status
    restaurant.availabilityStatus = availabilityStatus;

    // Update location
    restaurant.location = location;

    // Update dishes
    // if (dishes && dishes.length > 0) {
    //   restaurant.dishes = dishes;
    // }

    // Update discounts
    restaurant.discounts = discounts;

    // Update image URL
    restaurant.img = img;

    // Update opening and closing time
    restaurant.openingTime = openingTime;
    restaurant.closingTime = closingTime;

    // Save the updated restaurant
    const savedRestaurant = await restaurant.save();

    res.status(200).json({
      success: true,
      message: "Restaurant profile updated successfully",
      data: savedRestaurant,
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

exports.changeAvailabilityStatus = async (req, res) => {
  const { availabilityStatus } = req.body;
  try {
    const restaurantId = req.params.id;

    // Find the restaurant by ID
    const restaurant = await RestaurantDetails.findById(restaurantId);
    
    if (!restaurant) {
      return res.status(404).json({ message: 'Restaurant not found' });
    }

    // Update the availability status if provided
    if (availabilityStatus) {
      restaurant.availabilityStatus = availabilityStatus;
    } else {
      return res.status(400).json({ message: 'Availability status is required' });
    }

    // Save the updated restaurant details
    await restaurant.save();

    // Send a success response
    res.status(200).json({ success: true, message: 'Availability status updated successfully', data: restaurant });
  } catch (error) {
    console.error('Error updating availability status:', error);
    res.status(500).json({ message: 'An error occurred while updating the availability status' });
  }
};

exports.getAllRestaurants = async (req, res) => {
  try {
    const restaurants = await RestaurantDetails.find();
    res.status(200).json({ success: true, message: 'Restaurants fetched successfully', data: restaurants});
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Add a new dish
exports.addDish = async (req, res) => {
  const { restaurant, dishName, price, description, available, dishType, category } = req.body;

  try {
      const newDish = new Dish({
          restaurant,
          dishName,
          price,
          description,
          available,
          dishType,
          category
      });

      await newDish.save();
      res.status(201).json({ success: true, message: 'Dish created successfully', data: newDish });
  } catch (err) {
      res.status(500).json({ error: err.message });
  }
};

// Fetch all dishes for a specific restaurant
exports.getDishesByRestaurant = async (req, res) => {
  const { restaurantId } = req.params;
  const { category } = req.query;
  try {
      const dishes = await Dish.find({
        $and: [
          { restaurant: restaurantId },
          { category: category ? category : { $exists: true } },
        ],
      });
      res.status(200).json({ success: true, message: 'Dishes fetched successfully',data: dishes});
  } catch (err) {
      res.status(500).json({ error: err.message });
  }
};

exports.getDishById = async (req, res) => {
  const { id } = req.params;
  try {
      const dish = await Dish.findById(id);
      if (!dish) {
          return res.status(404).json({ error: 'Dish not found' });
      }
      res.status(200).json({ success: true, message: 'Dish fetched successfully', data: dish });
  } catch (err) {
      res.status(500).json({ error: err.message });
  }
}

exports.deleteDishesById = async (req, res) => {
  const { id } = req.params;
  try {
      await Dish.findByIdAndDelete(id);
      res.status(200).json({ success: true, message: 'Dish deleted successfully' });
  } catch (err) {
      res.status(500).json({ error: err.message });
  }
};

exports.getAllDishes = async (req, res) => {
  const { category, dishName, dishType } = req.query;
  try {
      // const dishes = await Dish.find();
      const dishes = await Dish.find({
        $and: [
          { category: category ? category : { $exists: true } },
          { dishName: dishName ? { $regex: dishName, $options: 'i' } : { $exists: true } },
          { dishType: dishType ? dishType : { $exists: true } },
        ],
      });
  
      res.status(200).json({ success: true, message: 'Dishes fetched successfully', data: dishes });
  } catch (err) {
      res.status(500).json({ error: err.message });
  }
};


exports.addFavouriteDish = async (req, res) => {
  const { dishId } = req.body;
  const { userId } = req.params;

  try {
    // Find the user by ID
    const user = await User.findById(userId).populate("additionalDetail");
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Ensure the user has a "UserDetails" additionalDetail
    if (!user.additionalDetail || user.additionalDetailModel !== "UserDetails") {
      return res.status(400).json({ message: "User details not available for this user" });
    }

    // Find the dish
    const dish = await Dish.findById(dishId);
    if (!dish) {
      return res.status(404).json({ message: "Dish not found" });
    }

    // Add the dish to favoriteDishes
    const userDetails = await UserDetails.findById(user.additionalDetail);
    if (!userDetails.favoriteDishes.includes(dishId)) {
      userDetails.favoriteDishes.push(dishId);
      await userDetails.save();
    }

    res.status(200).json({ success: true, message: "Dish added to favourites" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};


// exports.addFavouriteRestaurant = async (req, res) => {
//   const { restaurantId } = req.body;
//   const { userId } = req.params;
//   try {
//       const user = await User.findById(userId);
//       if (!user) {
//           return res.status(404).json({ message: 'User not found' });
//       }
//       const restaurant = await RestaurantDetails.findById(restaurantId);
//       if (!restaurant) {
//           return res.status(404).json({ message: 'Restaurant not found' });
//       }
//       user.favoriteRestaurants.push(restaurantId);
//       await user.save();
//       res.status(200).json({ success: true, message: 'Restaurant added to favourites' });
//   } catch (err) {
//       res.status(500).json({ error: err.message });
//   }
// };

// Add Favorite Restaurant
exports.addFavouriteRestaurant = async (req, res) => {
  const { restaurantId } = req.body;
  const { userId } = req.params;

  try {
    // Find the user by ID
    const user = await User.findById(userId).populate("additionalDetail");
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Ensure the user has a "UserDetails" additionalDetail
    if (!user.additionalDetail || user.additionalDetailModel !== "UserDetails") {
      return res.status(400).json({ message: "User details not available for this user" });
    }

    // Find the restaurant
    const restaurant = await RestaurantDetails.findById(restaurantId);
    if (!restaurant) {
      return res.status(404).json({ message: "Restaurant not found" });
    }

    // Add the restaurant to favoriteRestaurants
    const userDetails = await UserDetails.findById(user.additionalDetail);
    if (!userDetails.favoriteRestaurants.includes(restaurantId)) {
      userDetails.favoriteRestaurants.push(restaurantId);
      await userDetails.save();
    }

    res.status(200).json({ success: true, message: "Restaurant added to favourites" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};