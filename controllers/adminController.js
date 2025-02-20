const User = require("../models/userModel");
const DeliveryAgentDetails = require("../models/DeliveryAgentDetails");
const Order = require("../models/orderSchema");
const Dish = require("../models/dishSchema");

exports.getAllUsersList = async (req, res) => {
  try {
    const { page, limit } = req.query;
    const currentPage = page ? parseInt(page) : 1;
    const itemsPerPage = limit ? parseInt(limit) : 10;

    const threeMonthsAgo = new Date();
    threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3); // Get date 3 months ago

    const users = await User.find(
      { role: "User" },
      {
        role: 1,
        phone: 1,
        userName: 1,
        email: 1,
        image: 1,
        createdAt: 1,
        updatedAt: 1, // Fetch updatedAt for status calculation
        additionalDetail: 1,
        additionalDetailModel: 1
      }
    )
      .populate({
        path: "additionalDetail",
        select: "totalOrders totalAmountSpent loyaltyPoints loyaltyPointsLog"
      })
      .skip((currentPage - 1) * itemsPerPage)
      .limit(itemsPerPage);

    const totalCount = await User.countDocuments({ role: "User" });

    if (!users || users.length === 0) {
      return res.status(404).json({ error: "Users not found" });
    }

    // Add `status` field based on `updatedAt`
    const usersWithStatus = users.map(user => ({
      ...user.toObject(), // Convert Mongoose document to plain object
      status: user.updatedAt && user.updatedAt < threeMonthsAgo ? "Inactive" : "Active"
    }));

    res.status(200).json({
      success: true,
      message: "Users fetched successfully",
      data: usersWithStatus,
      pagination: {
        currentPage,
        itemsPerPage,
        totalCount,
        totalPages: Math.ceil(totalCount / itemsPerPage)
      }
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};


exports.getAllRestaurantsList = async (req, res) => {
    try {
      const { page, limit } = req.query;
      const currentPage = page ? parseInt(page) : 1;
      const itemsPerPage = limit ? parseInt(limit) : 10;
  
      const restaurants = await User.find({ role: "Restaurant" })
        .populate({
          path: "additionalDetail.restaurantId",
          select: "restaurantDetails full_restaurant_address"
        })
        .skip((currentPage - 1) * itemsPerPage)
        .limit(itemsPerPage)
        .lean();
  
      const totalCount = await User.countDocuments({ role: "Restaurant" });
  
      if (!restaurants.length) {
        return res.status(404).json({ error: "No restaurants found" });
      }
  
      // Fetch total dish count for each restaurant
      for (let restaurant of restaurants) {
        if (restaurant.additionalDetail?.restaurantId) {
          restaurant.totalDishes = await Dish.countDocuments({
            restaurant: restaurant.additionalDetail.restaurantId._id
          });
        } else {
          restaurant.totalDishes = 0;
        }
      }  
  
      res.status(200).json({
        success: true,
        message: "Restaurants fetched successfully",
        data: restaurants,
        pagination: {
          currentPage,
          itemsPerPage,
          totalCount,
          totalPages: Math.ceil(totalCount / itemsPerPage)
        }
      });
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  };

exports.getAllDeliveryAgentsList = async (req, res) => {
    try {
      const { page, limit } = req.query;
      const currentPage = page ? parseInt(page) : 1;
      const itemsPerPage = limit ? parseInt(limit) : 10;
  
      const users = await User.find({ role: "DeliveryAgent" })
        .populate({
          path: "additionalDetail",
          select: "full_address agent_name ratingAndReview totalEarnings ordersDelivered isVerified"
        })
        .skip((currentPage - 1) * itemsPerPage)
        .limit(itemsPerPage);
  
      const totalCount = await User.countDocuments({ role: "DeliveryAgent" });
  
      if (!users) {
        return res.status(404).json({ error: "Users not found" });
      }
  
      res.status(200).json({
        success: true,
        message: "Users fetched successfully",
        data: users,
        pagination: {
          currentPage,
          itemsPerPage,
          totalCount,
          totalPages: Math.ceil(totalCount / itemsPerPage)
        }
      });
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  };

exports.getAllOrdersList = async (req, res) => {
    try {
      const { page, limit } = req.query;
      const currentPage = page ? parseInt(page) : 1;
      const itemsPerPage = limit ? parseInt(limit) : 10;
  
      const order = await Order.find()
        .select("_id items orderStatus createdAt discountedPrice")
        .populate({
          path: "items.dishId",
          model: "dishes",
          select: "current_rating dishName image "
        })
        .skip((currentPage - 1) * itemsPerPage)
        .limit(itemsPerPage);
  
      const totalCount = await Order.countDocuments();
  
      if (!order) {
        return res.status(404).json({ error: "order not found" });
      }
  
      res.status(200).json({
        success: true,
        message: "Orders fetched successfully",
        data: order,
        pagination: {
          currentPage,
          itemsPerPage,
          totalCount,
          totalPages: Math.ceil(totalCount / itemsPerPage)
        }
      });
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
 };

exports.getAllDishesList = async (req, res) => {
    try {
      const { page, limit } = req.query;
      const currentPage = page ? parseInt(page) : 1;
      const itemsPerPage = limit ? parseInt(limit) : 10;
  
      const dish = await Dish.find()
        .select("_id dishName description dishType category current_rating ratingAndReview createdAt image")
        .populate({
          path: "restaurant",
          model: "RestaurantDetails",
          select: "restaurantDetails.restaurantName"
        })
        .skip((currentPage - 1) * itemsPerPage)
        .limit(itemsPerPage);
  
      const totalCount = await Dish.countDocuments();
  
      if (!dish) {
        return res.status(404).json({ error: "dish not found" });  
      }
  
      res.status(200).json({
        success: true,
        message: "Dishes fetched successfully",
        data: dish,
        pagination: {
          currentPage,
          itemsPerPage,
          totalCount,
          totalPages: Math.ceil(totalCount / itemsPerPage)
        }
      });
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  };

exports.verifyAgents = async (req, res) => {
  try {
    const { agentId, isVerified } = req.body; // agentId and isVerified are sent in the request body

    if (!agentId || typeof isVerified === 'undefined') {
      return res.status(400).json({ error: 'Agent ID and isVerified status are required' });
    }

    const agent = await User.findById(agentId);
    if (!agent) {
      return res.status(404).json({ error: 'Agent not found' });
    }

    // Assuming you're using Mongoose and have an Agent model
    const agentDetails = await DeliveryAgentDetails.findByIdAndUpdate(
      agent.additionalDetail,
      { isVerified: isVerified },
      { new: true } // This returns the updated document
    );

    if (!agentDetails) {
      return res.status(404).json({ error: 'Agent details not found' });
    }

    const action = isVerified ? 'verified' : 'Rejected';
    res.status(200).json({ success: true, message: `Agent ${action} successfully`, agentDetails });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

exports.getUnderVerificationList = async (req, res) => {
  try {
      const { page = 1, limit = 10 } = req.query; // Default page = 1, limit = 10

      const agents = await User.find({ role: "DeliveryAgent" })
          .populate({
              path: "additionalDetail",
              select: "isVerified vehicleDetails"
          });

      const unverifiedAgents = agents.filter(agent => agent.additionalDetail && agent.additionalDetail.isVerified === null);
      
      if (unverifiedAgents.length === 0) {
          return res.status(200).json({ success: true, message: "No agents found under verification", data: [] });
      }

      // Apply pagination
      const startIndex = (page - 1) * limit;
      const endIndex = startIndex + Number(limit);
      const paginatedAgents = unverifiedAgents.slice(startIndex, endIndex);

      res.status(200).json({ 
          success: true, 
          message: "Agents fetched successfully", 
          data: paginatedAgents ,
          pagination: {
          currentPage :Number(page),
          itemsPerPage: Number(limit),
          totalCount: unverifiedAgents.length,
          totalPages: Math.ceil(unverifiedAgents.length / limit),
        }
         
         
      });
  } catch (error) {
      res.status(400).json({ error: error.message });
  }
};

const getYesterdayCount = async (model, filter) => {
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  yesterday.setHours(0, 0, 0, 0); // Start of yesterday
  const endOfYesterday = new Date();
  endOfYesterday.setDate(endOfYesterday.getDate() - 1);
  endOfYesterday.setHours(23, 59, 59, 999); // End of yesterday
  return await model.countDocuments({ ...filter, createdAt: { $gte: yesterday, $lt: endOfYesterday } });
};


exports.getDashCounts = async (req, res) => {
  try {
      const totalUsers = await User.countDocuments({ role: "User" });
      const totalRestaurants = await User.countDocuments({ role: "Restaurant" });
      const totalDeliveryAgents = await User.countDocuments({ role: "DeliveryAgent" });
      const totalOrders = await Order.countDocuments();
      const deliveredOrders = await Order.countDocuments({ orderStatus: "Delivered" });

      // ✅ Total Earnings Calculation
      const totalEarnings = await Order.aggregate([
          { $match: { orderStatus: "Delivered" } },
          { $group: { _id: null, totalEarnings: { $sum: "$totalPrice" } } },
      ]).then((result) => (result.length > 0 ? result[0].totalEarnings : 0));

      // ✅ Yesterday's counts (with proper filtering)
      const yesterdayUsers = await getYesterdayCount(User, { role: "User" });
      const yesterdayRestaurants = await getYesterdayCount(User, { role: "Restaurant" });
      const yesterdayDeliveryAgents = await getYesterdayCount(User, { role: "DeliveryAgent" });
      const yesterdayOrders = await getYesterdayCount(Order, {});
      const yesterdayDeliveredOrders = await getYesterdayCount(Order, { orderStatus: "Delivered" });

      // ✅ Improved Percentage Change Formula
      const getPercentageChange = (today, yesterday) => {
        if (yesterday === 0) {
            return today > 0 ? "New" : "0"; // Mark as "New" if there is no data for yesterday
        }
        return (((today - yesterday) / yesterday) * 100).toFixed(2); // Safe percentage change calculation
    };
    


      res.status(200).json({
          success: true,
          message: "Counts fetched successfully",
          data: {
              totalUsers,
              totalUsersChange: getPercentageChange(totalUsers, yesterdayUsers),

              totalRestaurants,
              totalRestaurantsChange: getPercentageChange(totalRestaurants, yesterdayRestaurants),

              totalDeliveryAgents,
              totalDeliveryAgentsChange: getPercentageChange(totalDeliveryAgents, yesterdayDeliveryAgents),

              totalOrders,
              totalOrdersChange: getPercentageChange(totalOrders, yesterdayOrders),

              deliveredOrders,
              deliveredOrdersChange: getPercentageChange(deliveredOrders, yesterdayDeliveredOrders),

              totalEarnings,
          },
      });
  } catch (error) {
      res.status(400).json({ error: error.message });
  }
};

exports.getOrderGraphData = async (req, res) => {
  try {
      const orders = await Order.aggregate([
          {
              $group: {
                  _id: {
                      $dateToString: { format: "%Y-%m-%d", date: "$createdAt" }
                  },
                  value: { $sum: 1 } // Count number of orders per date
              }
          },
          { $sort: { _id: 1 } } // Sort by date ascending
      ]);

      // Format response data
      const chartData = orders.map(order => ({
          date: order._id,
          value: order.value
      }));

      res.status(200).json({
          success: true,
          message: "Order graph data fetched successfully",
          data: chartData
      });
  } catch (error) {
      res.status(500).json({ error: error.message });
  }
};
