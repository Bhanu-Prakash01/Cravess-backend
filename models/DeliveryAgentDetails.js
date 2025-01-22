const mongoose = require("mongoose");
const CONSTANTS = require("../constants/constants");

const deliveryAgentDetailsSchema = new mongoose.Schema({
 
  agent_name: String,
  t_shirt_size:{
    type: String,    
    enum:CONSTANTS.ENUM.T_SHIRT_SIZE ,
  },
  vehicleDetails: {
    vehicle_type: String,
    vehicle_number: String,
    vehicle_owner_name: String,
    vehicle_age_years: Number,
    emission_norm: String,
    fuel_type: String,
    vehicle_reg_authority: String,
  },
  full_address:{
    addressLine1: String,
    addressLine2: String,
    landmark: String,
    city: String,
    state: String,
    pincode: Number
  },
  document: [{ type: String }],
  accountDetails: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "AccountDetails",
  },
  assignedOrders: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Order",
    },
  ],
  availabilityStatus: {
    type: String,
    enum: CONSTANTS.ENUM.DELIVERY_AGENT_AVAILABILITY_STATUS,
    default: "Available",
  },
  location: {
    type: {
      type: String,
      enum: CONSTANTS.ENUM.LOCATION,
      //   required: true,
    },
    coordinates: {
      type: [Number],
      //   required: true,
    },
  },
  ratingAndReview: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "RatingAndReview",
    },
  ],
  current_rating: {
    type: Number,
    default: 0
},
  gender: {
    type: String,
    enum: CONSTANTS.ENUM.GENDER,
    // required: true,
    default: "Male",
  },
  aadharNumber: {
    type: Number,
    // required: true,
    unique: true,
    validate: {
      validator: function (v) {
        return /^[0-9]{12}$/.test(v);
      },
      message: "Aadhar number should be 12 digits long.",
    },
  },
  panNumber: {
    type: String,
    // required: true,
    unique: true,
    validate: {
      validator: function (v) {
        return /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/.test(v);
      },
      message: "PAN number should be in the format ABCDE1234A.",
    },
  },
  dateOfBirth:{
    type: Date,
    // required: true,
    // validate: {
    //   validator: function (v) {
    //     return moment(v).isValid();
    //   },
    //   message: "Date of birth should be a valid date.",
    // },
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

module.exports = mongoose.model(
  "deliveryagentdetails",
  deliveryAgentDetailsSchema,
);
