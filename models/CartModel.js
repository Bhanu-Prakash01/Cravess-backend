const mongoose = require('mongoose');
const { Schema } = mongoose;

const cartItemSchema = new Schema({
   dishId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'dishes', // Refers to the `Dish` collection
    required: true,
  },
  quantity: {
    type: Number,
    required: true,
    default: 1,
  },
  price:{
    type: Number,
    required: true
  },
  dishName:{
    type: String,
    required: true
  },
  restaurant:{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'RestaurantDetails',
    required: true
  }
});

const cartSchema = new Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'users', // Refers to the `User` collection
    required: true,
    unique: true, // Ensure each user has only one cart
  },
  items: [cartItemSchema], // Array of items in the cart
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

// Middleware to update the `updatedAt` field automatically
cartSchema.pre('save', function (next) {
  this.updatedAt = Date.now();
  next();
});

module.exports = mongoose.model('carts', cartSchema);
