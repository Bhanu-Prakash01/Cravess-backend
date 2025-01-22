
const mongoose = require("mongoose");

const userDetailsSchema = new mongoose.Schema({
  preferences: [String],
  loyaltyPoints: Number,
});

module.exports = mongoose.model("userdetails", userDetailsSchema);
