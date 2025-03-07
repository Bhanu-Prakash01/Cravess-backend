const mongoose = require('mongoose');
const discountSchema = require("./discountSchema");
const dishSchema = require('./dishSchema');
const CONSTANTS = require('../constants/constants');
const restaurantDetailsSchema = new mongoose.Schema({
    restaurantDetails: {
        restaurantName: {
            type: String,
            required: true,
        },
        ownerName: {
            type: String,
            required: true,
        },
        ownerDOB: {
            type: Date,
        },
        ownerGender: {
            type: String,
            enum: CONSTANTS.ENUM.GENDER,
        },
        openingTime: {
            type: String,
            required: true
        },
        closingTime: {
            type: String,
            required: true
        },
        email:{
            type: String,
        }

    },
    full_restaurant_address: {
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
    description: String,
    discounts: [discountSchema],
    dishTypes: {
        type: [String],
        enum: CONSTANTS.ENUM.DISH_TYPE,
        // required: true,
    },
    ratingAndReview: [
        {
            review: {
                type: mongoose.Schema.Types.ObjectId,
                ref: "RatingAndReview",
            },
            rating: { type: Number, required: true },
        },
    ],
    current_rating: {
        type: Number,
        default: 0,
        validate: {
            validator: function (value) {
                return !isNaN(value); // Ensure the value is not NaN
            },
            message: "Invalid value for current_rating. Must be a valid number.",
        },
    },
    totalProducts: Number,
    totalSales: Number,
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
module.exports = mongoose.model('RestaurantDetails', restaurantDetailsSchema, "RestaurantDetails");
