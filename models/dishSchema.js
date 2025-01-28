const mongoose = require('mongoose');
const CONSTANTS = require('../constants/constants');

const dishSchema = new mongoose.Schema({
    restaurant: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'RestaurantDetails',
        required: true
    },
    dishName: {
        type: String,
        required: true,
    },
    price: {
        type: Number,
        required: true,
    },
    description: {
        type: String,
    },
    available: {
        type: Boolean,
        default: true,
    },
    dishType: {
        type: String,
        enum: CONSTANTS.ENUM.DISH_TYPE,
        required: true,
    },
    category: {
        type: String,
        enum: CONSTANTS.ENUM.DISH_CATEGORY,
        required: true,
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
    image: {
        type: String,
    },
    createdAt: {
        type: Date,
        default: Date.now,
    },
    updatedAt: {
        type: Date,
        default: Date.now,
    }
});
dishSchema.index({
    name: "text",
    description: "text",
    tags: "text",
  });
module.exports = mongoose.model('dishes', dishSchema);
