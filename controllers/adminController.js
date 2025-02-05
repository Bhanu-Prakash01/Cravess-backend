const User = require("../models/userModel");
const DeliveryAgentDetails = require("../models/DeliveryAgentDetails");
const Order = require("../models/orderSchema");

exports.getAllUsersList = async (req, res) => {
    try {
      const { page, limit } = req.query;
      const currentPage = page ? parseInt(page) : 1;
      const itemsPerPage = limit ? parseInt(limit) : 10;
  
      const users = await User.find({ role: "User" }, {
        role: 1,
        phone: 1,
        userName: 1,
        email: 1,
        image: 1,
        createdAt: 1,
        additionalDetail: 1,
        additionalDetailModel: 1
      })
        .populate({
          path: "additionalDetail",
          select: "totalOrders totalAmountSpent"
        })
        .skip((currentPage - 1) * itemsPerPage)
        .limit(itemsPerPage);
  
      const totalCount = await User.countDocuments({ role: "User" });
  
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

exports.getAllRestaurantsList = async (req, res) => {
    try {
      const { page, limit } = req.query;
      const currentPage = page ? parseInt(page) : 1;
      const itemsPerPage = limit ? parseInt(limit) : 10;
  
      const users = await User.find({ role: "Restaurant" })
        .populate({
          path: "additionalDetail.restaurantId",
          select: "restaurantDetails full_restaurant_address"
        })
        .skip((currentPage - 1) * itemsPerPage)
        .limit(itemsPerPage);
  
      const totalCount = await User.countDocuments({ role: "Restaurant" });
  
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

exports.getAllDeliveryAgentsList = async (req, res) => {
    try {
      const { page, limit } = req.query;
      const currentPage = page ? parseInt(page) : 1;
      const itemsPerPage = limit ? parseInt(limit) : 10;
  
      const users = await User.find({ role: "DeliveryAgent" })
        .populate({
          path: "additionalDetail",
          select: "full_address"
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
          select: "current_rating dishName image"
        })
        .skip((currentPage - 1) * itemsPerPage)
        .limit(itemsPerPage);
  
      const totalCount = await Order.countDocuments();
  
      if (!order) {
        return res.status(404).json({ error: "order not found" });
      }
  
      res.status(200).json({
        success: true,
        message: "Users fetched successfully",
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

 exports.verifyAgents = async (req, res) => {
    try {
      const { agentId } = req.body; // Assuming agentId is sent in the request body
  
      if (!agentId) {
        return res.status(400).json({ error: 'Agent ID is required' });
      }
      const agent = await User.findById(agentId);
      if (!agent) {
        return res.status(404).json({ error: 'Agent not found' });
      }
      // Assuming you're using Mongoose and have an Agent model
      const agentDetails = await DeliveryAgentDetails.findByIdAndUpdate(
        agent.additionalDetail,
        { isVerified: true },
        { new: true } // This returns the updated document
      );
  
      if (!agentDetails) {
        return res.status(404).json({ error: 'Agent not found' });
      }
  
      res.status(200).json({ message: 'Agent verified successfully', agentDetails });
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  };

exports.getUnderVerificationList = async (req, res) => {
    try {
        const agents = await User.find({ role: "DeliveryAgent" })
        .populate({
            path: "additionalDetail",
            select: "isVerified vehicleDetails"
        });
    
    const unverifiedAgents = agents.filter(agent => agent.additionalDetail && !agent.additionalDetail.isVerified);
    
    if (unverifiedAgents.length === 0) {
        return res.status(404).json({ error: "No agents found under verification" });
    }
    
    res.status(200).json({ 
        success: true, 
        message: "Agents fetched successfully", 
        data: unverifiedAgents 
    });
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
}
      

