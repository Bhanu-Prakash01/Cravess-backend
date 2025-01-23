const mongoose = require("mongoose");
const CONSTANTS = require("../constants/constants");

const AddNewAddress = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "users",
    required: true,
  },
  name: {
    type: String,
    enum: CONSTANTS.ENUM.USER_ADDRESS_TYPE,
    required: true,
  },
  addressLine1: {
    type: String,
    required: true,
  },
  addressLine2: {
    type: String,
  },
  landmark: {
    type: String,
    required: true,
  },
  city: {
    type: String,
    required: true,
  },
  state: {
    type: String,
    required: true,
  },
  //   country: {
  //     type: String,
  //     required: true,
  //   },
  phoneNumber: {
    type: Number,
  },
  pincode: {
    type: Number,
    required: true,
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }

});

module.exports = mongoose.model("userAddresses", AddNewAddress,"userAddresses");