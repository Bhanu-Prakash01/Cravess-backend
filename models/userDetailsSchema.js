
const mongoose = require("mongoose");

const userDetailsSchema = new mongoose.Schema({
  preferences: [String],
  loyaltyPoints: Number, 
  favoriteRestaurants: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "restaurantdetails",
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
});

module.exports = mongoose.model("userdetails", userDetailsSchema);
