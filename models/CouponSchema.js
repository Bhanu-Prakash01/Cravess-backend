const mongoose = require('mongoose');
const CONSTANTS = require('../constants/constants');

const couponSchema = new mongoose.Schema({
  restaurantId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'RestaurantDetails',
    required: true,
  },
  code: {
    type: String,
    // required: true,
    // unique: true,
  },
  discountType:{
    type: String,
    enum: CONSTANTS.ENUM.DISCOUNT_TYPE,
    required: true,
  },
  discountValue: {
    type: Number,
    // required: true,
  },
  
  minOrderValue: {
    type: Number,
    // required: true,
  },
  validFrom: {
    type: Date,
    // required: true,
  },
  validUntil: {
    type: Date,
    // required: true,
  },
  isRedeemed: {
    type: Boolean,
    default: false,
  },
  redeemedUsers: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'users',
      default: [],
    },
  ],
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  }
});

couponSchema.index({ restaurantId: 1, code: 1 }, { unique: true });

const Coupon = mongoose.model('coupons', couponSchema);
module.exports = Coupon;
