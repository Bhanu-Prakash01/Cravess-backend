const User = require("../models/userModel");
const UserAddresses = require("../models/AddUserAddress");
const Dish = require("../models/dishSchema")
const UserDetails = require("../models/userDetailsSchema");
const RestaurantDetails = require("../models/restaurantDetailsModel");
const { uploadSingleDocument } = require("../Utils/Cloudinary");
const DeliveryAgentDetails = require("../models/DeliveryAgentDetails");

exports.updateUser = async (req, res) => {
  try {
    const userId = req.params.id;
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    const { email, userName, phoneNumber,image } = req.body;
    user.email = email;
    user.userName = userName;
    user.phone = phoneNumber;

    if(image){
      const folder = 'user-images';
      const imgUrl = await uploadSingleDocument(image, folder, user._id);
      if (!imgUrl) {
        return res.status(400).json({ error: 'No image uploaded or failed to upload image' });
      }
      user.image = imgUrl;
    }

    if(user.role === "DeliveryAgent"){
      const agentDetails = await DeliveryAgentDetails.findById({_id:user.additionalDetail});
      console.log(agentDetails,"agent Details");
      agentDetails.agent_name = userName;
      await agentDetails.save();
    }

    const updatedUser = await user.save();
    res.json({ success: true, message: "User updated successfully", data: updatedUser });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Error updating user" });
  }
};

exports.getUserById = async (req, res) => {
  try {
    const userId = req.params.id;
    // Find the user by their ID
    const user = await User.findById(userId).select("-__v -additionalDetail -additionalDetailModel");
    // If user is not found, return a 404 error
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    res.status(200).json({ success: true, message: "User fetched successfully", data: user });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Error fetching user details" });
  }
};

exports.addUserAddress = async (req, res) => {
  try {
    const {userId, name,phoneNumber, addressLine1, addressLine2, landmark, city, state, pincode } = req.body;
    const user = await User.findById(userId);
    
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    if(user.role !== 'User'){
      return res.status(401).json({ message: "Unauthorized" });
    }
    const newAddress = new UserAddresses({
      name,
      phoneNumber,
      addressLine1,
      addressLine2,
      landmark,
      city,
      state,
      pincode,
      user: userId,
    });
    await newAddress.save();

    let userDetails = await UserDetails.findById(user.additionalDetail);
    console.log(userDetails,"userDetails");
    if (!userDetails) {
      userDetails = new UserDetails({
        addresses: [newAddress._id],
        preferences: [],
        loyaltyPoints: 0,
        favoriteRestaurants: [],
        favoriteDishes: [],
      });
      await userDetails.save();

      // Associate the newly created UserDetails with the user
      user.additionalDetail = userDetails._id;
      user.additionalDetailModel = "UserDetails";
      await user.save();
    }
    else {
      userDetails.addresses.push(newAddress._id);
      await userDetails.save();
    }

    await user.save();
    res
      .status(201)
      .json({ success: true, message: "Address added successfully", data: newAddress });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Error adding address" });
  }
};

exports.updateUserAddress = async (req, res) => {
  try {
    const addressId = req.params.addressId;
    const { userId, name, phoneNumber, addressLine1, addressLine2, landmark, city, state, pincode } = req.body;

    // Find the user by their ID
    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    // Find the address by its ID
    const address = await UserAddresses.findById(addressId);
    if (!address) {
      return res.status(404).json({ message: "Address not found" });
    }
    // Use object destructuring to update only provided fields
    // Update address details if provided, or retain current values
    address.name = name;
    address.phoneNumber = phoneNumber;
    address.addressLine1 = addressLine1;    
    address.addressLine2 = addressLine2;
    address.landmark = landmark;
    address.city = city;
    address.state = state;
    address.pincode = pincode;
    // Save the updated address
    const updatedAddress = await address.save();
    // Respond with the updated address details
    res.status(200).json({ success: true, message: "Address updated successfully", data: updatedAddress });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Error updating address" });
  }
};

exports.getUserAddress = async (req, res) => {
  try {
    const userId = req.params.userId;
    const user = await User.findById(userId);
    const userDetails = await UserDetails.findById(user.additionalDetail);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    const addressId = req.params.addressId;
    const address = userDetails.addresses.find(
      (address) => address.toString() === addressId
    );
    if (!address) {
      return res.status(404).json({ message: "Address not found" });
    }
    const addresses = await UserAddresses.find({ _id: { $in: address } }).select("-__v -createdAt -updatedAt");
    res.status(200).json({ success: true, message: "Address fetched successfully", data: addresses });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Error fetching address details" });
  }
};

exports.getAllAddressByUser = async (req, res) => {
  try {
    const userId = req.params.id;
    const user = await User.findById(userId);
    const userDetails = await UserDetails.findById(user.additionalDetail);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    const addresses = await UserAddresses.find({ _id: { $in: userDetails.addresses } }).select("-__v -createdAt -updatedAt");
    res.status(200).json({ success: true, message: "Addresses fetched successfully", data: addresses });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Error fetching address details" });
  }
};

exports.deleteAllAddressByUser = async (req, res) => {
  try {
    const userId = req.params.id;
    // Find the user by their ID
    const user = await User.findById(userId);
    const userDetails = await UserDetails.findById(user.additionalDetail);
    console.log(userDetails,"userDetails");
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    if(!userDetails){
      return res.status(404).json({ message: "UserDetails not found" });
    }
    await UserAddresses.deleteMany({ user: userId });
    userDetails.addresses = [];
    await userDetails.save();
    
    res.status(200).json({success: true, message: "All addresses deleted successfully" });
  } catch (err) {
    console.error(err); 
    res.status(500).json({ message: "Error deleting address" });
  }
};

exports.deleteAddressByUser = async(req, res) => {
  try {
    const userId = req.params.userId;
    const addressId = req.params.addressId;
    // Find the user by their ID
    const user = await User.findById(userId);
    const userDetails = await UserDetails.findById(user.additionalDetail);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    const addressIndex = userDetails.addresses.indexOf(addressId);
    if (addressIndex === -1) {
      return res.status(404).json({ message: "Address not found" });
    }

    userDetails.addresses.splice(addressIndex, 1);
    await userDetails.save();

    const address = await UserAddresses.findByIdAndDelete(addressId);
    if (!address) {
      return res.status(404).json({ message: "Address not found" });
    }

    res.status(200).json({ success: true, message: "Address deleted successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Error deleting address" });
  }

}

exports.addFavouriteDish = async (req, res) => {
  const { dishId, userId } = req.body;

  try {
    // Find the user by ID
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Check if the user has a valid additionalDetail reference
    let userDetails = null;
    if (
      user.additionalDetail &&
      typeof user.additionalDetail === "object" &&
      user.additionalDetailModel === "UserDetails"
    ) {
      userDetails = await UserDetails.findById(user.additionalDetail);
    }

    // Create a new UserDetails document if none exists
    if (!userDetails) {
      userDetails = new UserDetails({
        preferences: [],
        loyaltyPoints: 0,
        favoriteRestaurants: [],
        favoriteDishes: [],
      });
      await userDetails.save();

      // Associate the newly created UserDetails with the user
      user.additionalDetail = userDetails._id;
      user.additionalDetailModel = "UserDetails";
      await user.save();
    }

    // Find the dish
    const dish = await Dish.findById(dishId);
    if (!dish) {
      return res.status(404).json({ message: "Dish not found" });
    }

    // Add the dish to favoriteDishes if not already present
    if (!userDetails.favoriteDishes.includes(dishId)) {
      userDetails.favoriteDishes.push(dishId);
      userDetails.updatedAt = new Date(); // Update the timestamp
      await userDetails.save();
    }

    res.status(200).json({ success: true, message: "Dish added to favourites" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Add Favorite Restaurant
exports.addFavouriteRestaurant = async (req, res) => {
  const { restaurantId,userId } = req.body;

  try {
    // Find the user by ID
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Ensure the user has a "UserDetails" or create one if it doesn't exist
    let userDetails = null;
    if (
      user.additionalDetail &&
      typeof user.additionalDetail === "object" &&
      user.additionalDetailModel === "UserDetails"
    ) {
      userDetails = await UserDetails.findById(user.additionalDetail);
    }

    // Create a new UserDetails document if it doesn't exist
    if (!userDetails) {
      userDetails = new UserDetails({
        preferences: [],
        loyaltyPoints: 0,
        favoriteRestaurants: [],
        favoriteDishes: [],
      });
      await userDetails.save();

      // Associate the newly created UserDetails with the user
      user.additionalDetail = userDetails._id;
      user.additionalDetailModel = "UserDetails";
      await user.save();
    }

    // Find the restaurant
    const restaurant = await RestaurantDetails.findById(restaurantId);
    if (!restaurant) {
      return res.status(404).json({ message: "Restaurant not found" });
    }

    // Add the restaurant to favoriteRestaurants if not already present
    if (!userDetails.favoriteRestaurants.includes(restaurantId)) {
      userDetails.favoriteRestaurants.push(restaurantId);
      userDetails.updatedAt = new Date(); // Update the timestamp
      await userDetails.save();
    }

    res.status(200).json({ success: true, message: "Restaurant added to favourites" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getAllFavouriteDishes = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    if (!user.additionalDetail) {
      return res.status(404).json({ message: "User has no additional details" });
    }
    const userDetails = await UserDetails.findById(user.additionalDetail).populate({
      path: "favoriteDishes",
      select: "-createdAt -updatedAt -__v -ratingAndReview ",
    });
    if (!userDetails) {
      return res.status(404).json({ message: "UserDetails not found" });
    }
    res.status(200).json({ success: true, message: "Favourite dishes fetched successfully", data: userDetails.favoriteDishes });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};


exports.getAllFavouriteRestaurants = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    if (!user.additionalDetail) {
      return res.status(404).json({ message: "User has no additional details" });
    }
    const userDetails = await UserDetails.findById(user.additionalDetail).populate({
      path: "favoriteRestaurants",
      select: "-createdAt -updatedAt -__v -accountDetails -ratingAndReview -document -discounts -full_restaurant_address",
    });
    if (!userDetails) {
      return res.status(404).json({ message: "UserDetails not found" });
    }
    res.status(200).json({ success: true, message: "Favourite restaurants fetched successfully", data: userDetails.favoriteRestaurants });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};


exports.removeFavouriteDish = async (req, res) => {
  const { dishId, userId } = req.params;
  try {
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    
     const  userDetails = await UserDetails.findById(user.additionalDetail);
  
    if (!userDetails) {
      return res.status(404).json({ message: "User has no additional details" });
    }

    // Remove the dish from favoriteDishes if present
    if (userDetails.favoriteDishes.includes(dishId)) {
      userDetails.favoriteDishes.pull(dishId);
      userDetails.updatedAt = new Date(); // Update the timestamp
      await userDetails.save();
    }

    res.status(200).json({ success: true, message: "Dish removed from favourites" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.removeFavouriteRestaurant = async (req, res) => {
  const { restaurantId, userId } = req.params;
  try {
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    
     const  userDetails = await UserDetails.findById(user.additionalDetail);
  
    if (!userDetails) {
      return res.status(404).json({ message: "User has no additional details" });
    }

    // Remove the restaurant from favoriteRestaurants if present
    if (userDetails.favoriteRestaurants.includes(restaurantId)) {
      userDetails.favoriteRestaurants.pull(restaurantId);
      userDetails.updatedAt = new Date(); // Update the timestamp
      await userDetails.save();
    }

    res.status(200).json({ success: true, message: "Restaurant removed from favourites" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};