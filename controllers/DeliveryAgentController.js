const DeliveryAgentDetails = require("../models/DeliveryAgentDetails");
const AccountDetails = require("../models/BankDetailsModel");
const User = require("../models/userModel");
const mongoose = require('mongoose');
const Order = require("../models/orderSchema");
const moment = require("moment"); // Ensure moment is installed
const { uploadMultiDocuments, uploadSingleDocument } = require("../Utils/Cloudinary");// Helper function to validate required fields
const { findNearestAgent, assignAgentWithTimeout } = require("../Helper/assignAgents");

const validateFields = (fields, requiredFields) => {
  for (const field of requiredFields) {
    if (!fields[field]) {
      return `Field ${field} is required.`;
    }
  }
  return null;
};

// Create a delivery agent

exports.createDeliveryAgent = async (req, res) => {
  const {
    agent_name,
    vehicle_type,
    vehicle_number,
    vehicle_owner_name,
    vehicle_age_years,
    emission_norm,
    fuel_type,
    vehicle_reg_authority,
    addressLine1,
    addressLine2,
    landmark,
    city,
    state,
    pincode,
    t_shirt_size,
    document,
    accountDetails,
    assignedOrders,
    availabilityStatus,
    location,
    userId,
    gender,
    aadharNumber,
    panNumber,
    dateOfBirth,
    image
  } = req.body;

  // Validate required fields
  const requiredFields = [
    // "vehicleType",
    // "vehicleNumber",
    // "vehicleModel",
    // "document",
    // "location",
    "agent_name",
    "userId",
    "gender",
    "aadharNumber",
    "panNumber",
    "dateOfBirth"
  ];

  for (const field of requiredFields) {
    if (!req.body[field]) {
      return res.status(400).json({ error: `${field} is required.` });
    }
  }
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const user = await User.findById(userId).session(session);

    if (!user) {
      await session.abortTransaction();
      return res.status(404).json({ error: "User not found" });
    }

    if (image) {
      const folder = 'agent-images';
      const imgUrl = await uploadSingleDocument(image, folder, user._id);
      if (!imgUrl) {
        await session.abortTransaction();
        return res.status(400).json({ error: 'No image uploaded or failed to upload image' });
      }
      user.image = imgUrl;
    }
    // Ensure dateOfBirth is valid and formatted correctly
    const formattedDateOfBirth = moment(dateOfBirth, moment.ISO_8601, true);
    if (!formattedDateOfBirth.isValid()) {
      await session.abortTransaction();
      return res.status(400).json({ error: "Invalid date format for date of birth" });
    }
    // Calculate age
    const age = moment().diff(formattedDateOfBirth, "years");
    if (age < 18) {
      await session.abortTransaction();
      return res
        .status(400)
        .json({ error: "Agent must be at least 18 years old." });
    }
    // Save account details
    const newAccountDetails = new AccountDetails(accountDetails);
    const savedAccountDetails = await newAccountDetails.save({ session });

    // for documents
    const folderName = 'agent-documents';
    const documentUrl = await uploadMultiDocuments(document, folderName, userId);
    if (!documentUrl) {
      await session.abortTransaction();
      return res.status(400).json({ error: 'No document uploaded or failed to upload document' });
    }

    // Create new delivery agent details
    const newAgent = new DeliveryAgentDetails({
      agent_name,
      vehicleDetails: {
        vehicle_type,
        vehicle_number,
        vehicle_owner_name,
        vehicle_age_years,
        emission_norm,
        fuel_type,
        vehicle_reg_authority,
      },
      full_address: {
        addressLine1,
        addressLine2,
        landmark,
        city,
        state,
        pincode
      },
      t_shirt_size,
      document: documentUrl,
      accountDetails: savedAccountDetails._id,
      assignedOrders: [],
      availabilityStatus,
      location,
      gender,
      aadharNumber,
      panNumber,
      dateOfBirth: formattedDateOfBirth.toISOString(), // Save formatted date
    });

    const savedAgent = await newAgent.save({ session });

    // user.additionalDetail = user.additionalDetail || [];
    user.additionalDetail = savedAgent._id;
    user.userName = agent_name;
    await user.save({ session });

    // Commit the transaction if everything is successful
    await session.commitTransaction();
    session.endSession();
    res.status(201).json({
      success: true,
      message: "Delivery agent created successfully",
      data: savedAgent,
    });
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    res.status(400).json({ error: error.message });
  }
};


exports.getDeliveryAgentDetailsById = async (req, res) => {
  try {

    const userId = req.params.id;
    const user = await User.findById(userId).populate({
      path: 'additionalDetail',
      select: '-agent_name -accountDetails -ratingAndReview -__v -createdAt -updatedAt -id -document'
    }); if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    res.status(200).json({ success: true, message: "Delivery agent details fetched successfully", data: user });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

exports.updateDeliveryAgentProfile = async (req, res) => {
  const {
    vehicle_type,
    vehicle_number,
    document,
    accountDetails,
    assignedOrders,
    availabilityStatus,
    location,
    // userId,
  } = req.body;

  const validationError = validateFields(req.body, [
    "vehicle_type",
    "vehicle_number",
    "document",
    "location",
  ]);
  if (validationError) {
    return res.status(400).json({ error: validationError });
  }

  try {
    const agentId = req.params.id;
    const agent = await DeliveryAgentDetails.findById(agentId);
    if (!agent) {
      return res.status(404).json({ error: "Delivery agent not found" });
    }

    // Update vehicle details
    agent.vehicleDetails.vehicle_type = vehicle_type;
    agent.vehicleDetails.vehicle_number = vehicle_number;
    // agent.vehicleDetails.vehicleModel = vehicleModel;

    // Update document
    const folderName = 'agent-documents-updated';
    const documentUrl = await uploadDocuments(document, folderName, agentId);
    if (!documentUrl) {
      return res.status(400).json({ error: 'No document uploaded or failed to upload document' });
    }
    agent.document = documentUrl;

    // Update account details
    const updatedAccountDetails = await AccountDetails.findByIdAndUpdate(
      agent.accountDetails,
      { $set: accountDetails },
      { new: true }
    );

    // Update assigned orders
    agent.assignedOrders = assignedOrders;

    // Update availability status
    agent.availabilityStatus = availabilityStatus;

    // Update location
    agent.location = location;

    // Save the updated agent
    const savedAgent = await agent.save();

    res.status(200).json({
      success: true,
      message: "Delivery agent profile updated successfully",
      data: savedAgent,
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

exports.changeAvailabilityStatus = async (req, res) => {
  const { availabilityStatus } = req.body;
  try {
    const userId = req.params.id;
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    const deliveryAgent = await DeliveryAgentDetails.findById({ _id: user.additionalDetail }).select("-__v -document -accountDetails -assignedOrders -full_address -vehicleDetails -location -ratingAndReview -createdAt -updatedAt");
    if (!deliveryAgent) {
      return res.status(404).json({ message: 'Delivery agent not found' });
    } else {
      deliveryAgent.availabilityStatus = availabilityStatus;
    }

    await deliveryAgent.save();
    res.status(200).json({ success: true, message: 'Availability status updated successfully', data: deliveryAgent });
  } catch (error) {
    console.error('Error updating availability status:', error);
    res.status(500).json({ message: 'An error occurred while updating the availability status' });
  }
};

exports.getOrderRequestByAgentId = async (req, res) => {
  const { agentId } = req.params;
  try {
    const agent = await User.findById({ _id: agentId });
    const agentDetails = await DeliveryAgentDetails.findById({ _id: agent.additionalDetail }).populate('requestedOrders');
    if (!agentDetails) {
      return res.status(404).json({ error: "Agent not found." });
    }

    // Send the agent's orders as the response
    res.status(200).json({
      success: true,
      message: "Orders fetched successfully",
      data: agentDetails.requestedOrders,  // Send the orders assigned to this agent
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};


exports.agentAcceptOrDecline = async (req, res) => {
  const { orderId, agentId, decision } = req.body; // decision: "Accepted" or "Declined"

  try {
    const agent = await User.findById({ _id: agentId });
    const order = await Order.findById({ _id: orderId }).populate("deliveryDetails.deliveryAddress");
    if (!order || order.orderStatus !== "Assigning") {
      return res.status(400).json({ error: "Order is not available for assignment." });
    }

    if (decision === "Accepted") {
      order.orderStatus = "Processing";
      order.assignedAgent = agentId;
      await order.save();
      await DeliveryAgentDetails.findByIdAndUpdate({ _id: agent.additionalDetail }, {
        availabilityStatus: "Unavailable",
        $push: { assignedOrders: orderId },
        $pull: { requestedOrders: orderId },
      });

      await DeliveryAgentDetails.updateMany(
        { _id: { $ne: agent.additionalDetail } },
        { $pull: { requestedOrders: orderId } }
      );

      res.json({ success: true, message: "Order assigned successfully." });

    } else if (decision === "Declined") {
      await DeliveryAgentDetails.findByIdAndUpdate({ _id: agent.additionalDetail }, {
        $pull: { requestedOrders: orderId },
      });

      const nextAgent = await findNearestAgent(
        await DeliveryAgentDetails.find({ availabilityStatus: "Available", _id: { $ne: agent.additionalDetail } }),
        order.deliveryDetails.deliveryAddress.location
      );

      if (nextAgent) {
        assignAgentWithTimeout(order, nextAgent);
        res.json({ success: true, message: "Reassigning order to next agent..." });
      } else {
        res.json({ error: "No agents available." });
      }
    } else {
      res.status(400).json({ error: "Invalid decision." });
    }
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getAcceptedOrderDetails = async (req, res) => {
  const { orderId } = req.params;
  try {
    const order = await Order.findById({ _id: orderId }).select('_id customer items totalPrice discountedPrice deliveryDetails orderStatus createdAt paymentStatus')
      .populate({
        path: 'deliveryDetails.deliveryAddress',
        model: 'userAddresses'
      })
      .populate({
        path: 'items.restaurant',
        model: 'RestaurantDetails',
        select: 'location full_restaurant_address'
      })
      .exec();
    if (!order) {
      return res.status(404).json({ error: "Order not found." });
    }
    res.status(200).json({ success: true, message: "Order details fetched successfully", data: order });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

exports.confirmOrderDelivery = async (req, res) => {
  const { orderId, agentId } = req.body;

  try {
    const agent = await User.findById({ _id: agentId });
    const order = await Order.findById({ _id: orderId });
    if (!order || order.orderStatus !== "Dispatched") {
      return res.status(400).json({ error: "Order is not ready for delivery confirmation." });
    }
    if (order.assignedAgent !== agentId) {
      return res.status(403).json({ error: "Unauthorized agent." });
    }
    order.orderStatus = "Delivered";
    await order.save();

    await DeliveryAgentDetails.findByIdAndUpdate({ _id: agent.additionalDetail }, {
      availabilityStatus: "Available",
      $pull: { assignedOrders: orderId }
    });
    res.json({ success: true, message: "Order delivered successfully." });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.deliveryAgentDashboardCounts = async (req, res) => {
   const  deliveryAgentId = req.params.id;
  if (!mongoose.Types.ObjectId.isValid(deliveryAgentId)) {
    return res.status(400).json({ error: 'Invalid delivery agent ID' });
  }

  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);

  const startOfMonth = new Date();
  startOfMonth.setDate(1);
  startOfMonth.setHours(0, 0, 0, 0);

  try {
    const [deliveredToday, cashCollectedToday, cashCollectedThisMonth] = await Promise.all([
      Order.countDocuments({
        assignedAgent: deliveryAgentId,
        orderStatus: 'Delivered',
        createdAt: { $gte: startOfDay }
      }),

      Order.aggregate([
        {
          $match: {
            assignedAgent: deliveryAgentId,
            orderStatus: 'Delivered',
            paymentMode: 'Cash', 
            createdAt: { $gte: startOfDay }
          }
        },
        {
          $group: {
            _id: null,
            totalCollected: { $sum: '$discountedPrice' }
          }
        }
      ]),

      // Total Amount Collected This Month (only 'Cash' payments)
      Order.aggregate([
        {
          $match: {
            assignedAgent: deliveryAgentId,
            orderStatus: 'Delivered',
            paymentMode: 'Cash',  // Filter only 'Cash' payments
            createdAt: { $gte: startOfMonth }
          }
        },
        {
          $group: {
            _id: null,
            totalCollected: { $sum: '$discountedPrice' }
          }
        }
      ])
    ]);

    console.log(deliveredToday,cashCollectedToday,cashCollectedThisMonth)

    // Extract totals from aggregation results
    const totalCashCollectedToday = cashCollectedToday[0]?.totalCollected || 0;
    const totalCashCollectedThisMonth = cashCollectedThisMonth[0]?.totalCollected || 0;

    // Sending response
    res.json({
      totalOrdersDeliveredToday: deliveredToday,
      totalCashCollectedToday,
      totalCashCollectedThisMonth
    });

  } catch (error) {
    console.error('Error fetching delivery agent dashboard data:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};



