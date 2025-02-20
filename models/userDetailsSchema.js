
const mongoose = require("mongoose");
const CONSTANTS = require("../constants/constants");

const userDetailsSchema = new mongoose.Schema({
  addresses: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "UserAddresses",
    },
  ],
  totalOrders : Number,
  totalAmountSpent : Number,
  preferences: [String],
  loyaltyPoints: Number, 
  loyaltyPointsLog: [
    {
      pointsEarned: Number,
      earnedFrom: {
        type: String,
        enum:CONSTANTS.ENUM.EARNED_FROM
      },
      earnedOn: {
        type: Date,
        default: Date.now, // Timestamp of when points were earned
      },
    },
  ],
  favoriteRestaurants: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "RestaurantDetails",
    },
  ],
  favoriteDishes: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "dishes", 
    },
  ],
  createdAt: {
    type: Date,
    default: Date.now,
},
updatedAt: {
    type: Date,
    default: Date.now,
},
},{ timestamps: true });

module.exports = mongoose.model("UserDetails", userDetailsSchema,"UserDetails");
