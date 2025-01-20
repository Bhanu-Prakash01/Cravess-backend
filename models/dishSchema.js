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
