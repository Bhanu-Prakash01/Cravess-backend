const User = require("../models/userModel");
const UserDetails = require("../models/userDetailsSchema");

exports.getAllUsersList = async (req, res) => {
    try {
        const users = await User.find({ role: "User" },{
            role: 1,
            phone: 1,
            userName: 1,
            email: 1,
            image: 1,
            createdAt: 1,
            additionalDetail: 1,
            additionalDetailModel: 1
        }).populate(
            {
              path: "additionalDetail",
              select: "totalOrders totalAmountSpent"
            }
          );
        if (!users) {
            return res.status(404).json({ error: "Users not found" });
        }
        res.status(200).json({ success: true, message: "Users fetched successfully", data: users });
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
};

exports.getAllRestaurantsList = async (req, res) => {
    try {
        const users = await User.find({ role: "Restaurant" }).populate(
            {
              path: "additionalDetail.restaurantId",
              select: "restaurantDetails full_restaurant_address "
            }
          );
        if (!users) {
            return res.status(404).json({ error: "Users not found" });
        }
        res.status(200).json({ success: true, message: "Users fetched successfully", data: users });
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
};

exports.getAllDeliveryAgentsList = async (req, res) => {
    try {
        const users = await User.find({ role: "Delivery Agent" }).populate(
            {
              path: "additionalDetail",
              select: "full_address"
            }
          );
        if (!users) {
            return res.status(404).json({ error: "Users not found" });
        }
        res.status(200).json({ success: true, message: "Users fetched successfully", data: users });
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
};


