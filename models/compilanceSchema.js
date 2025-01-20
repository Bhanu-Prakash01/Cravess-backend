const mongoose = require("mongoose");
const CONSTANTS = require("../constants/constants");

const complianceSchema = new mongoose.Schema({
  restaurantId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "RestaurantDetails",
    required: true,
  },
  complianceType: {
    type: String,
    enum: CONSTANTS.ENUM.COMPLIANCE_TYPE,
    required: true,
  },
  status: {
    type: String,
    enum: CONSTANTS.ENUM.COMPLIANCE_STATUS,
    default: "Pending",
  },
  lastChecked: {
    type: Date,
    default: Date.now,
  },
  comments: {
    type: String,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model("compliances", complianceSchema);
