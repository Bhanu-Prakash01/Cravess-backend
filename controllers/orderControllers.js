const Order = require("../models/orderSchema");
const User = require("../models/userModel");
const mongoose = require("mongoose");
const { ObjectId } = mongoose.Types;
const { awardPoints, redeemPoints } = require("./LoyaltyReward");
const Offer = require("../models/OfferSchema")
const Coupon = require("../models/CouponSchema")
const Dish = require("../models/dishSchema");
const calculateDistance = require("../Utils/CalculateDistance");
const DeliveryAgent = require("../models/DeliveryAgentDetails");
const CONSTANTS = require("../constants/constants");

const getUserPoints = async (userId) => {
  try {
    const user = await User.findOne({ _id: userId });
    if (!user) {
      throw new Error("User not found");
    }
    return user.points;
  } catch (err) {
    throw new Error(`Error fetching user points: ${err.message}`);
  }
};

exports.placeOrder = async (req, res) => {
  const {
    customer,
    items,
    deliveryDetails,
    couponCode,
    redeemedPoints,
  } = req.body;

  try {
    let totalPrice = 0;
    let discountAmount = 0;
    let finalPrice = 0;
    let appliedCoupon = null;
    // Check if all dishes are available
    const unavailableDishes = [];
    for (const item of items) {
      const dish = await Dish.findOne({
        _id: item.dishId,
        restaurant: item.restaurant,
        available: true,
      });

      if (!dish) {
        unavailableDishes.push(item.dishName);
      }
    }

    if (unavailableDishes.length > 0) {
      return res.status(400).json({
        error: "Some dishes are unavailable.",
        unavailableDishes,
      });
    }

    // Process each item and apply offer
    const processedItems = await Promise.all(
      items.map(async (item) => {
        let finalItemPrice = item.price;
        if (item?.offer && item.offer !== null) {
          const offer = await Offer.findById(item.offer);
          if (offer) {
            const itemDiscount = (item.price * offer.discountPercentage) / 100;
            finalItemPrice -= itemDiscount;
          }
        }
        totalPrice += finalItemPrice * item.quantity;
        return {
          ...item,
          totalPrice,
        };
      })
    );

    finalPrice = totalPrice;
 
    // Validate and apply the coupon
if (couponCode) {
  const coupon = await Coupon.findOne({ code: couponCode, restaurantId: items[0].restaurant });
  if (coupon) {
    const currentDate = new Date();
    if (currentDate >= coupon.validFrom && currentDate <= coupon.validUntil) {
      if (totalPrice >= coupon.minOrderValue) {
        let discountAmount=0;
        if (coupon.discountType === 'Percentage') {
          discountAmount = (totalPrice * coupon.discountValue) / 100;
        } else if (coupon.discountType === 'Flat') {
          discountAmount = coupon.discountValue;
        }
        else{
          return res.status(400).json({ error: "Invalid discount type." });
        }
        finalPrice = Math.max(finalPrice - discountAmount, 0);
        appliedCoupon = { code: coupon.code, discountAmount };
        // Check if the user has already redeemed the coupon
        if (!coupon.redeemedUsers.includes(customer.user)) {
          // Mark the coupon as redeemed for the user
          await Coupon.updateOne({ code: couponCode }, { $push: { redeemedUsers: customer.user } });
        } else {
          return res.status(400).json({ error: "You have already redeemed this coupon." });
        }

      } else {
        return res.status(400).json({ error: "Minimum order value not met for this coupon." });
      }
    } else {
      return res.status(400).json({ error: "Coupon is not valid or has expired." });
    }
  } else {
    return res.status(400).json({ error: "Invalid coupon code or coupon not available for this restaurant." });
  }
}

    // Apply loyalty points if redeemed
    if (redeemedPoints && redeemedPoints > 0) {
      const userPoints = await getUserPoints(
        new mongoose.Types.ObjectId(customer.user)
      );
      if (userPoints >= redeemedPoints) {
        finalPrice = Math.max(finalPrice - redeemedPoints, 0);
        await redeemPoints(
          new mongoose.Types.ObjectId(customer.user),
          redeemedPoints
        );
      } else {
        return res
          .status(400)
          .json({ error: "Insufficient points for redemption." });
      }
    }

     // Find an available delivery agent
     const availableAgent = await DeliveryAgent.findOneAndUpdate(
      { availabilityStatus: "Available" },
      { availabilityStatus: "Unavailable" }, // Mark as busy
      { new: true }
    );

    if (!availableAgent) {
      return res
        .status(400)
        .json({ error: "No delivery agent is available at the moment." });
    }

    
     // Calculate estimated delivery time
    //  const travelTime = await calculateDistance(
    //   availableAgent?.location, // Agent's location
    //   deliveryDetails?.deliveryAddress         // Customer's delivery address
    // );

    const preparationTime = 10; // Example: 10 minutes for packaging
    const bufferTime = 15; // Example: 15 minutes buffer
    const estimatedDeliveryTime = 30 + preparationTime + bufferTime;

    const newOrder = new Order({
      customer,
      items: processedItems,
      totalPrice,
      discountedPrice: finalPrice,
      coupon: appliedCoupon,
      paymentStatus: "Pending", 
      deliveryDetails,
      orderStatus: "Placed",
      assignedAgent: {
        id: availableAgent._id,
        name: availableAgent?.agent_name,
        contact: availableAgent?.contact,
      },
      estimatedDeliveryTime: new Date(Date.now() + estimatedDeliveryTime * 60000), // Add minutes to current time
    });

    await newOrder.save();

    if (customer && customer.user) {
      const result = await awardPoints(
        new mongoose.Types.ObjectId(customer.user),
        finalPrice
      );
      res.status(201).json({
        message:
          "Order placed successfully, discounts applied, and points awarded.",
        order: newOrder,
        points: result.points,
      });
    } else {
      res.status(201).json({
        message: "Order placed successfully and discounts applied.",
        order: newOrder,
      });
    }
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
exports.trackOrder = async (req, res) => {
  try {
    const orderId = req.params.id;
    const order = await Order.findById(orderId)
      .populate("customer.user")
      .populate("items");
    if (!order) {
      return res.status(404).json({ error: "Order not found" });
    }
    res.json(order);
  } catch (error) {
    console.error("Error tracking order:", error);
    res.status(400).json({ error: error.message });
  }
};

exports.updateOrder = async (req, res) => {
  try {
    const order = await Order.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
    });
    // console.log(order);
    if (!order) {
      return res.status(404).json({ error: "Order not found" });
    }
    res.json(order);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

// exports.cancelOrder = async (req, res) => {
//   try {
//     const orderId = req.params.id;
//     // console.log(orderId);

//     const order = await Order.findByIdAndDelete(orderId);

//     if (!order) {
//       return res.status(404).json({ error: "Order not found" });
//     }

//     res.json({ message: "Order deleted successfully" });
//   } catch (error) {
//     res.status(400).json({ error: error.message });
//   }
// };

exports.cancelOrder = async (req, res) => {
  try {
    const {userId} = req.body;
    console.log(userId,"userId");
    const orderId = req.params.id;
    const order = await Order.findById(orderId);

    if (!order) {
      return res.status(404).json({ error: "Order not found" });
    }
    const user = await User.findById(userId);
    console.log(user);
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }
    
    const currentTime = new Date();
    const orderCreationTime = order.createdAt;

    // Check if user is trying to cancel within 120 seconds
    if (user.role === 'User' && (currentTime - orderCreationTime) / 1000 > 120) {
      return res.status(403).json({ error: "Order cancellation time has expired" });
    }

    // Check if restaurant is trying to cancel within 15 minutes
    if (user.role === 'Restaurant' && (currentTime - orderCreationTime) / 60000 > 15) {
      return res.status(403).json({ error: "Order cancellation time has expired" });
    }

    await Order.findByIdAndDelete(orderId);
    res.json({ message: "Order Cancelled successfully" });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

// exports.cancelOrder = async (req, res) => {
//   try {
//     const { userId } = req.body;
//     const orderId = req.params.id;

//     // Fetch the order using the orderId
//     const order = await Order.findById(orderId);
//     if (!order) {
//       return res.status(404).json({ error: "Order not found" });
//     }

//     // Fetch the user using the userId
//     const user = await User.findById(userId).populate('additionalDetail');
//     if (!user) {
//       return res.status(404).json({ error: "User not found" });
//     }

//     const currentTime = new Date();
//     const orderCreationTime = order.createdAt;

//     // Check if the user is a regular User and validate cancellation time
//     if (user.role === "User") {
//       if (!user._id.equals(order.customer.user)) {
//         return res.status(403).json({ error: "Unauthorized cancellation attempt" });
//       }

//       // Ensure cancellation is within 120 seconds
//       if ((currentTime - orderCreationTime) / 1000 > 120) {
//         return res
//           .status(403)
//           .json({ error: "Order cancellation time has expired" });
//       }
//     }

//     // Check if the user is a Restaurant and validate cancellation time
//     if (user.role === "Restaurant") {
//       if (!user.additionalDetail || !user.additionalDetail._id.equals(order.restaurant)) {
//         return res.status(403).json({ error: "Unauthorized cancellation attempt" });
//       }

//       // Ensure cancellation is within 15 minutes
//       if ((currentTime - orderCreationTime) / 60000 > 15) {
//         return res
//           .status(403)
//           .json({ error: "Order cancellation time has expired" });
//       }
//     }

//     // Cancel the order by deleting it
//     await Order.findByIdAndDelete(orderId);

//     res.json({ message: "Order cancelled successfully" });
//   } catch (error) {
//     res.status(400).json({ error: error.message });
//   }
// };
