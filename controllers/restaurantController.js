const RestaurantDetails = require("../models/restaurantDetailsModel");
const AccountDetails = require("../models/BankDetailsModel");
const User = require("../models/userModel");
const Dish = require("../models/dishSchema")
const Order = require("../models/orderSchema");
const DeliveryAgent = require("../models/DeliveryAgentDetails");
const { uploadMultiDocuments, uploadSingleDocument } = require("../Utils/Cloudinary");
const { findNearestAgent, assignAgentWithTimeout } = require("../Helper/assignAgents");
const mongoose = require("mongoose");
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


    const folderName = 'restaurant-documents';
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
    res.status(200).json({ success: true, message: "Restaurant details fetched successfully", data: restaurant });
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
    const folderName = 'restaurant-documents-updated';
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
    res.status(200).json({ success: true, message: 'Restaurants fetched successfully', data: restaurants });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Add a new dish
exports.addDish = async (req, res) => {
  const { restaurant, dishName, price, description, available, dishType, category, image } = req.body;

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
    res.status(200).json({ success: true, message: 'Dishes fetched successfully', data: dishes });
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

exports.AddRecommendedDish = async (req, res) => {
  try {
    const { restaurantId, dishIds } = req.body;

    if (!restaurantId || !dishIds || !Array.isArray(dishIds)) {
      return res.status(400).json({ error: "Restaurant ID and an array of Dish IDs are required." });
    }

    // Update dishes to set isRecommended to true
    const updatedDishes = await Dish.updateMany(
      { _id: { $in: dishIds }, restaurant: restaurantId },
      { $set: { isReccomended: true } }
    );

    if (updatedDishes.modifiedCount === 0) {
      return res.status(404).json({ message: "No dishes updated. Ensure the dish IDs belong to the restaurant." });
    }

    res.status(200).json({
      success: true,
      message: `${updatedDishes.modifiedCount} dish(es) marked as recommended.`,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.RemoveRecommendedDish = async (req, res) => {
  try {
    const { restaurantId, dishIds } = req.body;

    if (!restaurantId || !dishIds || !Array.isArray(dishIds)) {
      return res.status(400).json({ error: "Restaurant ID and an array of Dish IDs are required." });
    }

    // Update dishes to set isRecommended to false
    const updatedDishes = await Dish.updateMany(
      { _id: { $in: dishIds }, restaurant: restaurantId },
      { $set: { isReccomended: false } }
    );

    if (updatedDishes.modifiedCount === 0) {
      return res.status(404).json({ message: "No dishes updated. Ensure the dish IDs belong to the restaurant." });
    }

    res.status(200).json({
      success: true,
      message: `${updatedDishes.modifiedCount} dish(es) unmarked as recommended.`,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.AddSpecialDish = async (req, res) => {
  try {
    const { restaurantId, dishIds } = req.body;

    if (!restaurantId || !dishIds || !Array.isArray(dishIds)) {
      return res.status(400).json({ error: "Restaurant ID and an array of Dish IDs are required." });
    }

    // Update dishes to set isRecommended to true
    const updatedDishes = await Dish.updateMany(
      { _id: { $in: dishIds }, restaurant: restaurantId },
      { $set: { isSpecial: true } }
    );

    if (updatedDishes.modifiedCount === 0) {
      return res.status(404).json({ message: "No dishes updated. Ensure the dish IDs belong to the restaurant." });
    }

    res.status(200).json({
      success: true,
      message: `${updatedDishes.modifiedCount} dish(es) marked as special.`,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.RemoveSpecialDish = async (req, res) => {
  try {
    const { restaurantId, dishIds } = req.body;

    if (!restaurantId || !dishIds || !Array.isArray(dishIds)) {
      return res.status(400).json({ error: "Restaurant ID and an array of Dish IDs are required." });
    }

    // Update dishes to set isRecommended to false
    const updatedDishes = await Dish.updateMany(
      { _id: { $in: dishIds }, restaurant: restaurantId },
      { $set: { isSpecial: false } }
    );

    if (updatedDishes.modifiedCount === 0) {
      return res.status(404).json({ message: "No dishes updated. Ensure the dish IDs belong to the restaurant." });
    }

    res.status(200).json({
      success: true,
      message: `${updatedDishes.modifiedCount} dish(es) unmarked as special.`,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getAllOrderReceived = async (req, res) => {
  try {
    const restaurantId = req.params.id;
    const restaurant = await User.findById({_id:restaurantId});
    const orders = await Order.find({ orderStatus: "Placed", "items.restaurant": restaurant.additionalDetail?.restaurantId, }).select("-__v  -estimatedDeliveryTime -deliveryDetails");
    res.status(200).json({ success: true, message: "Orders fetched successfully", data: orders });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getAllOrdersByRestaurant = async (req, res) => {
  try {
    const restaurantId = req.params.id;
    const restaurant = await User.findById({_id:restaurantId});
    const orders = await Order.find({ "items.restaurant": restaurant.additionalDetail?.restaurantId }).select("-__v  -estimatedDeliveryTime -deliveryDetails");
    res.status(200).json({ success: true, message: "Orders fetched successfully", data: orders });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

exports.acceptOrDeclineOrder = async (req, res) => {
  const { orderId } = req.params;
  const { restaurantId, decision } = req.body; // decision: "Accepted" or "Cancelled"
  try {
    const order = await Order.findById({_id:orderId});
    if (!order) return res.status(404).json({ error: "Order not found." });
    if (order.items[0]?.restaurant?.toString('hex') !== restaurantId) {
      return res.status(403).json({ error: "Unauthorized access. Order does not belong to this restaurant." });
    }
    if (order.orderStatus !== "Placed") {
      return res.status(400).json({ error: "Order is already processed or not placed" });
    }

    if (decision === "Accepted") {
      order.orderStatus = "Accepted";
      await order.save();
      await assignDeliveryAgent(orderId);
      res.json({ success: true, message: "Order accepted successfully.Assigning Delivery Agent." });
    } else if (decision === "Cancelled") {
      order.orderStatus = "Cancelled";
      await order.save();
      res.json({ success: true, message: "Order declined by restaurant." });
    } else {
      res.status(400).json({ error: "Invalid decision." });
    }
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const assignDeliveryAgent = async (orderId) => {
  try {
    const order = await Order.findById({ _id: orderId }).populate("deliveryDetails.deliveryAddress");
    if (!order || order.orderStatus !== "Accepted") {
      return { error: "Order is not ready for assignment." };
    }
    order.orderStatus = "Assigning";
    await order.save();

    const availableAgentIds = await DeliveryAgent.find(
      { availabilityStatus: "Available" },
      { _id: 1 } 
    ).lean();

    if (availableAgentIds.length === 0) {
      return { error: "No available agents." };
    }
    const agentIds = availableAgentIds.map(agent => agent._id);
    const nearestAgentId = await findNearestAgent(agentIds, order.deliveryDetails.deliveryAddress.location);

    if (!nearestAgentId) {
      return { error: "No available agents." };
    }
    await assignAgentWithTimeout(order, nearestAgentId);

    return { success: true, message: "Assigning delivery agent..." };
  } catch (err) {
    console.error("Error in assignDeliveryAgent:", err);
    return { error: err.message };
  }
};

exports.handedOverOrder = async (req, res) => {
  const { orderId } = req.body;
  try {
    const order = await Order.findById({_id:orderId});
    if (!order) return res.status(404).json({ error: "Order not found." });

    if (order.orderStatus !== "Processing") {
      return res.status(400).json({ error: "Order is not ready for dispatching." });
    }

    order.orderStatus = "Dispatched";
    await order.save();
    return res.status(200).json({ success: true, message: "Order handed over successfully." });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }


};

exports.dashboardCounts = async (req, res) => {
  const  id = req.params.id;
  const restaurant = await User.findById({_id:id});
  const restaurantId = restaurant.additionalDetail?.restaurantId;
  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);

  const startOfWeek = new Date();
  startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay());
  startOfWeek.setHours(0, 0, 0, 0);

  const startOfMonth = new Date();
  startOfMonth.setDate(1);
  startOfMonth.setHours(0, 0, 0, 0);
  const restaurantObjectId =new mongoose.Types.ObjectId(restaurantId);
  try {
    const [todayOrders, weekOrders, monthOrders, statusCounts, itemsSoldToday] = await Promise.all([
      Order.find({
        'items.restaurant':restaurantId,
        createdAt: { $gte: startOfDay },
      }).select("_id discountedPrice orderStatus"),
      Order.find({
        'items.restaurant': restaurantId,
        createdAt: { $gte: startOfWeek },
      }).select("_id discountedPrice orderStatus"),
      Order.find({
        'items.restaurant': restaurantId,
        createdAt: { $gte: startOfMonth },
      }).select("_id discountedPrice orderStatus"),
      Order.aggregate([
        {
          $match: {
            'items.restaurant': restaurantObjectId,
          },
        },
        {
          $group: {
            _id: "$orderStatus",
            count: { $sum: 1 },
          },
        },
      ]),
      Order.aggregate([
        {
          $match: {
            'items.restaurant':restaurantObjectId,
            createdAt: { $gte: startOfDay },
          },
        },
        { $unwind: "$items" },
        {
          $group: {
            _id: null,
            totalItems: { $sum: "$items.quantity" },
          },
        },
      ]),
    ]);
   
    const totalOrdersToday = todayOrders.length;
    const totalAmountToday = todayOrders.reduce((sum, order) => sum + order.discountedPrice, 0);
    const averageOrderValue = totalOrdersToday > 0 ? (totalAmountToday / totalOrdersToday).toFixed(2) : 0;

    const totalOrdersThisWeek = weekOrders.length;
    const totalOrdersThisMonth = monthOrders.length;

    const pendingOrders = statusCounts.find(status => status._id === 'Pending')?.count || 0;
    const processingOrders = statusCounts.find(status => status._id === 'Processing')?.count || 0;
    const deliveredOrders = statusCounts.find(status => status._id === 'Delivered')?.count || 0;

    const totalItemsSoldToday = itemsSoldToday[0]?.totalItems || 0;

    res.json({
      totalOrdersToday,
      averageOrderValue,
      totalOrdersThisWeek,
      totalOrdersThisMonth,
      pendingOrders,
      processingOrders,
      deliveredOrders,
      totalItemsSoldToday,
    });

  } catch (error) {
    console.error('Error fetching dashboard data:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
}
