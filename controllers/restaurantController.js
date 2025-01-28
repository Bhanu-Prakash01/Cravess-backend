const RestaurantDetails = require("../models/restaurantDetailsModel");
const AccountDetails = require("../models/BankDetailsModel");
const User = require("../models/userModel");
const Dish = require("../models/dishSchema")
const { uploadMultiDocuments, uploadSingleDocument } = require("../Utils/Cloudinary");
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
    description,
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
    const folder = 'restaurant-images';
    const imgUrl = await uploadSingleDocument(img, folder, userId);
    if (!imgUrl) {
      return res.status(400).json({ error: 'No image uploaded or failed to upload image' });
    }


    const folderName =  'restaurant-documents';
    const documentUrl = await uploadMultiDocuments(document, folderName, userId);
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
      description,
      // dishes,
      discounts,
      img: imgUrl,
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
if (!user.additionalDetail || typeof user.additionalDetail !== "object") {
  user.additionalDetail = {};
}

user.additionalDetail = {
  ...user.additionalDetail,
  restaurantId: savedRestaurant._id,
};

user.image = imgUrl;


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
  const { restaurant, dishName, price, description, available, dishType, category,image } = req.body;

  try {
    const folder = 'dish-images';
    const imgUrl = await uploadSingleDocument(image, folder, restaurant);
    if (!imgUrl) {
      return res.status(400).json({ error: 'No image uploaded or failed to upload image' });
    }
      const newDish = new Dish({
          restaurant,
          dishName,
          price,
          description,
          available,
          dishType,
          category,
          image: imgUrl
      });
     

      await newDish.save();
      res.status(201).json({ success: true, message: 'Dish created successfully', data: newDish });
  } catch (err) {
      res.status(500).json({ error: err.message });
  }
};

exports.updateDish = async (req, res) => {
  const { id } = req.params;
  const { dishName, price, description, available, dishType, category, image } = req.body;

  try {
      const dish = await Dish.findById(id);
      if (!dish) {
          return res.status(404).json({ error: 'Dish not found' });
      }

      dish.dishName = dishName;
      dish.price = price;
      dish.description = description;
      dish.available = available;
      dish.dishType = dishType;
      dish.category = category;

      if (image) {
        const folder = 'dish-images';
        const imgUrl = await uploadSingleDocument(image, folder, dish.restaurant);
        if (!imgUrl) {
          return res.status(400).json({ error: 'No image uploaded or failed to upload image' });
        }
        dish.image = imgUrl;
      }

      await dish.save();
      res.status(200).json({ success: true, message: 'Dish updated successfully', data: dish });
  } catch (err) {
      res.status(500).json({ error: err.message });
  }
}

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
      const restaurant = await RestaurantDetails.findById(dish.restaurant);
      
      const restaurantName = restaurant?.restaurantDetails?.restaurantName;
      if (!dish) {
          return res.status(404).json({ error: 'Dish not found' });
      }
      const dishDetails = {
        ...dish._doc,
        restaurantName: restaurantName
      }
      res.status(200).json({ success: true, message: 'Dish fetched successfully', data: dishDetails });
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


