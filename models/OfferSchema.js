const mongoose = require('mongoose');

const offerSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
  },
  description: {
    type: String,
    required: true,
  },
  offerType: {
    type: String,
    enum: ['PERCENTAGE', 'FLAT', 'BOGO'],
    required: true,
  },
  discountValue: {
    type: Number,
    // required: true,
  },
  validFrom: {
    type: Date,
    required: true,
  },
  validUntil: {
    type: Date,
    required: true,
  },
  termsAndConditions: {
    type: String,
    required: false,
  },
  isActive: {
    type: Boolean,
    default: true,
  },
  restaurantId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'RestaurantDetails',
    required: true,
  },
  dishIds: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'dishes',
    required: true,
  }],
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  }
});

const Offer = mongoose.model('offers', offerSchema);
module.exports = Offer;