const mongoose = require("mongoose");
const CONSTANTS = require("../constants/constants");

const AddNewAddress = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
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
    type: String,
  zipCode: {
    type: String,
    required: true,
  },
    required: true,
  },
});

module.exports = mongoose.model("userAddresses", AddNewAddress,"userAddresses");