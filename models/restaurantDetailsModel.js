const mongoose = require('mongoose');
const discountSchema = require("./discountSchema");
const dishSchema = require('./dishSchema');
const CONSTANTS = require('../constants/constants');
const restaurantDetailsSchema = new mongoose.Schema({
    restaurantDetails: {
            restaurantName: {
                type: String,
                // required: true,
            },
      
    },
    full_restaurant_address:{
        addressLine1: String,
        addressLine2: String,
        landmark: String,
        city: String,
        state: String,
        pincode: Number
      },
      document: [{ type: String }],
        // required: true,,
    accountDetails: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "AccountDetails",
        required: false,
    },
    availabilityStatus: {
        type: String,
        enum: CONSTANTS.ENUM.AVAILABILITY_STATUS,
        default: "Available",
    },
    location: {
        type: {
            type: String,
            enum: CONSTANTS.ENUM.LOCATION,
            // required: true,
        },
        coordinates: {
            type: [Number],
            // required: true,
        },
    },
    img: String,
        // required: true,,
    openingTime: String,
        // required: true,,
    closingTime:String,
    // dishes:[dishSchema],
    discounts: [discountSchema],
    dishTypes: {
        type: [String],
        enum: CONSTANTS.ENUM.DISH_TYPE,
        // required: true,
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
    createdAt: {
        type: Date,
        default: Date.now,
    },
    updatedAt: {
        type: Date,
        default: Date.now,
    },
});
// restaurantDetailsSchema.index({
//     name: "text",
//     description: "text",
//     tags: "text",
//   });
module.exports = mongoose.model('restaurantdetails', restaurantDetailsSchema);
