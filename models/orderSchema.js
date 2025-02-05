const mongoose = require("mongoose");
const CONSTANTS = require("../constants/constants");


// Define the schema for an order item
const orderItemSchema = new mongoose.Schema({
  dishName: String,
  dishId: String,
  quantity: Number,
  price: Number,
  restaurant: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "RestaurantDetails",
  },
  offer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Offer", // Reference to the applied offer
  },
  finalItemPrice: Number, // Price after applying the offer
});
// Define the schema for customer information
const customerInfoSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "users",
    required: true,
  },
  // address: String,
  phone: String,
});
// Define the schema for delivery details
const deliveryDetailsSchema = new mongoose.Schema({
  deliveryAddress: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "userAddresses",
    required: true,
  },

  orderTime: {
    type: Date,
    default: Date.now,
  },
  deliveryStatus: {
    type: String,
    enum: CONSTANTS.ENUM.DELIVERY_STATUS,
    default: "Pending",
  },
});
// Define the schema for applied coupon
const appliedCouponSchema = new mongoose.Schema({
  code: String,
  discountAmount: Number,
});

// Define the schema for an order
const orderSchema = new mongoose.Schema({
  customer: customerInfoSchema,
  items: [orderItemSchema],
  totalPrice: Number,
  discountedPrice: Number,
  coupon: appliedCouponSchema,
  paymentStatus: {
    type: String,
    enum: CONSTANTS.ENUM.PAYMENT_STATUS,
    default: "Pending",
  },
  paymentMode:{
    type: String,
    enum: CONSTANTS.ENUM.PAYMENT_MODE,
  },
  deliveryDetails: deliveryDetailsSchema,
  orderStatus: {
    type: String,
    enum: CONSTANTS.ENUM.ORDER_STATUS,
    default: "Placed",
  },
  assignedAgent: Object,
  estimatedDeliveryTime: Date, // New field
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

// Export the Order model
module.exports = mongoose.model("orders", orderSchema);
