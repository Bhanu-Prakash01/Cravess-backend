const RestaurantDetails = require("../models/restaurantDetailsModel");
const AccountDetails = require("../models/BankDetailsModel");
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
  console.log(req.body);
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
    console.log(existingAccount,"existingAccount a");
    if (existingAccount) {
      console.log(existingAccount,"existingAccount b");
      savedAccountDetails = existingAccount;
    } else {
      // Save new account details
      const newAccountDetails = new AccountDetails(accountDetails);
      console.log(newAccountDetails,"newAccountDetails");
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
    res.status(200).json({ data: restaurant });
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
      message: "Restaurant profile updated successfully",
      data: savedRestaurant,
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

exports.changeAvailabilityStatus = async (req, res) => {
  const { availabilityStatus } = req.body;
  console.log(availabilityStatus);

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
    res.status(200).json({ message: 'Availability status updated successfully', restaurant });
  } catch (error) {
    console.error('Error updating availability status:', error);
    res.status(500).json({ message: 'An error occurred while updating the availability status' });
  }
};


// Add a new dish
exports.addDish = async (req, res) => {
  const { restaurant, dishName, price, description, available, dishType } = req.body;

  try {
      const newDish = new Dish({
          restaurant,
          dishName,
          price,
          description,
          available,
          dishType,
      });

      await newDish.save();
      res.status(201).json({ message: 'Dish created successfully', dish: newDish });
  } catch (err) {
      res.status(500).json({ error: err.message });
  }
};

// Fetch all dishes for a specific restaurant
exports.getDishesByRestaurant = async (req, res) => {
  const { restaurantId } = req.params;

  try {
      const dishes = await Dish.find({ restaurant: restaurantId });
      res.status(200).json(dishes);
  } catch (err) {
      res.status(500).json({ error: err.message });
  }
};