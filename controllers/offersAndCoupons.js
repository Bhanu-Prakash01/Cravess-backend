const Offer = require("../models/OfferSchema");
const Dish = require("../models/dishSchema");
const Restaurant = require("../models/restaurantDetailsModel");
const Coupon = require('../models/CouponSchema');

exports.createOffer = async (req, res) => {
  try {
    const {
      title,
      description,
      offerType,           // FLAT, PERCENTAGE, BOGO
      discountValue,       // e.g., 100 for FLAT, 10 for 10% in PERCENTAGE
      validFrom,
      validUntil,
      termsAndConditions,
      restaurantId,
      dishIds,
    } = req.body;
    if (!['FLAT', 'PERCENTAGE', 'BOGO'].includes(offerType)) {
      return res.status(400).json({ message: "Invalid offer type provided." });
    }

    if ((offerType === 'FLAT' || offerType === 'PERCENTAGE') && !discountValue) {
      return res.status(400).json({ message: "Discount value is required for FLAT and PERCENTAGE offers." });
    }

    // Check if the restaurant exists
    const restaurant = await Restaurant.findById({_id:restaurantId});
    if (!restaurant) {
      return res.status(404).json({ message: "Restaurant not found" });
    }

    // Check if dishes exist and belong to the restaurant
    const dishes = await Dish.find({
      _id: { $in: dishIds },
      restaurant: restaurantId
    });

    if (dishes.length !== dishIds.length) {
      return res.status(404).json({
        message: "One or more dishes not found or do not belong to the restaurant"
      });
    }

    const conflictingDishes = await Dish.find({
      _id: { $in: dishIds },
      offerApplied: { $ne: null }
    }).select('_id dishName restaurant');

    if (conflictingDishes.length > 0) {
      return res.status(400).json({
        message: "One or more dishes already have an active offer applied.",
        conflictingDishes
      });
    }
    const offer = new Offer({
      title,
      description,
      offerType,
      discountValue,
      validFrom,
      validUntil,
      termsAndConditions,
      restaurantId: restaurantId,
      dishIds: dishIds,
      isActive: true
    });

    await offer.save();
    for (const dish of dishes) {
      let revisedPrice = dish.price;

      if (offerType === 'FLAT') {
        revisedPrice = Math.max(0, dish.price - discountValue);  // Prevent negative pricing
      } else if (offerType === 'PERCENTAGE') {
        revisedPrice = Math.max(0, dish.price - (dish.price * discountValue / 100));
      } else if (offerType === 'BOGO') {
        // BOGO doesn't affect price directly but can be handled at checkout
        revisedPrice = dish.price;
      }

      // dish.offerApplied = offer._id;
      // dish.revisedPrice = revisedPrice;
      // await dish.save();
      await Dish.findByIdAndUpdate(dish._id, {
        offerApplied: offer._id,
        revisedPrice: revisedPrice,
      });
    }
    res.status(201).json({
      success: true,
      message: "Offer created and applied successfully",
      data: offer
    });
  } catch (error) {
    res.status(500).json({ message: "Error creating offer", error: error.message });
  }
};

exports.removeOfferFromDishes = async (req, res) => {
  try {
    const { dishIds } = req.body;

    // Check if the dishIds array is provided and not empty
    if (!Array.isArray(dishIds) || dishIds.length === 0) {
      return res.status(400).json({ message: "Dish IDs must be provided." });
    }

    // Find all dishes with the given dishIds
    const dishes = await Dish.find({
      _id: { $in: dishIds }
    });

    // Check if all dishes exist
    if (dishes.length !== dishIds.length) {
      return res.status(404).json({
        message: "One or more dishes not found"
      });
    }

    // Check for active offers on the dishes
    const conflictingDishes = dishes.filter(dish => dish.offerApplied);

    if (conflictingDishes.length === 0) {
      return res.status(400).json({ message: "No active offers found on the given dishes." });
    }

    // Remove the offer from the dishes
    await Dish.updateMany(
      { _id: { $in: dishIds } },
      { $set: { offerApplied: null, revisedPrice: "" } }
    );

    res.status(200).json({
      success: true,
      message: "Offer removed from dishes successfully."
    });
  } catch (error) {
    console.error('Error removing offer from dishes:', error);
    res.status(500).json({ message: "Error removing offer from dishes", error: error.message });
  }
};



// exports.addOfferToDish = async (req, res) => {
//   try {
//     const { offerId, restaurantId, dishId } = req.params;

//     // Find the offer by ID
//     const offer = await Offer.findById(offerId);
//     if (!offer) {
//       return res.status(404).json({ message: "Offer not found" });
//     }

//     // Check if the dish exists and belongs to the specified restaurant
//     const dish = await Dish.findOne({ _id: dishId, restaurant: restaurantId });
//     if (!dish) {
//       return res.status(404).json({
//         message: "Dish not found or does not belong to the restaurant",
//       });
//     }

//     // Add the dish to the offer if it's not already included
//     if (!offer.dishes.includes(dishId)) {
//       offer.dishes.push(dishId);
//       await offer.save();
//     }

//     res.status(200).json(offer);
//   } catch (error) {
//     res
//       .status(500)
//       .json({ message: "Error adding offer to dish", error: error.message });
//   }
// };

// exports.removeOfferFromDish = async (req, res) => {
//   try {
//     const { offerId, restaurantId, dishId } = req.params;

//     // Find the offer by ID
//     const offer = await Offer.findById(offerId);
//     if (!offer) {
//       return res.status(404).json({ message: "Offer not found" });
//     }

//     // Check if the dish exists in the offer's dishes list and belongs to the specified restaurant
//     const dish = await Dish.findOne({ _id: dishId, restaurant: restaurantId });
//     if (!dish || !offer.dishes.includes(dishId)) {
//       return res
//         .status(404)
//         .json({
//           message:
//             "Dish not found in offer or does not belong to the restaurant",
//         });
//     }

//     offer.dishes.pull(dishId);
//     await offer.save();

//     res.status(200).json({ success: true, message: "Offer removed from dish", data: offer});
//   } catch (error) {
//     res
//       .status(500)
//       .json({
//         message: "Error removing offer from dish",
//         error: error.message,
//       });
//   }
// };


exports.createCoupon = async (req, res) => {
  try {
    const {  restaurantId, code, description, discountType,discountValue, validFrom, validUntil, minOrderValue } = req.body;

    const coupon = new Coupon({
      restaurantId,
      code,
      description,
      discountType,
      discountValue,
      validFrom,
      validUntil,
      minOrderValue,
      isActive: true,
      redeemedUsers:[],
    });

    await coupon.save();
    res.status(201).json(coupon);
  } catch (error) {
    if (error.code === 11000) {
      res.status(400).json({ message: 'Coupon code already exists for this restaurant' });
    } else {
      res.status(500).json({ message: 'Error creating coupon', error: error.message });
    } 
   }
};

exports.getAllCoupons = async (req, res) => {
  try {
    const coupons = await Coupon.find();
    res.status(200).json(coupons);
  } catch (error) {
    res.status(500).json({ message: 'Error retrieving coupons', error: error.message });
  }
};

exports.getAllCouponsByRestaurantId = async (req, res) => {
  try {
    const coupons = await Coupon.find({ restaurantId: req.params.id });
    if (!coupons) {
      return res.status(404).json({ message: 'No coupons found for this restaurant' });
    }
    res.status(200).json(coupons);
  } catch (error) {
    res.status(500).json({ message: 'Error retrieving coupons', error: error.message });
  }
};

exports.getCouponById = async (req, res) => {
  try {
    const coupon = await Coupon.findById(req.params.id);
    if (!coupon) {
      return res.status(404).json({ message: 'Coupon not found' });
    }
    res.status(200).json(coupon);
  } catch (error) {
    res.status(500).json({ message: 'Error retrieving coupon', error: error.message });
  }
};

exports.updateCoupon = async (req, res) => {
  try {
    const { code, description, discountType,discountValue, validFrom, validUntil, minOrderValue, isActive } = req.body;
    const coupon = await Coupon.findById(req.params.id);
    if (!coupon) {
      return res.status(404).json({ message: 'Coupon not found' });
    }

    coupon.code = code || coupon.code;
    coupon.description = description || coupon.description;
    coupon.discountType = discountType || coupon.discountType;
    coupon.discountValue = discountValue || coupon.discountValue;
    coupon.validFrom = validFrom || coupon.validFrom;
    coupon.validUntil = validUntil || coupon.validUntil;
    coupon.minOrderValue = minOrderValue || coupon.minOrderValue;
    coupon.isActive = isActive !== undefined ? isActive : coupon.isActive;
    coupon.updatedAt = Date.now();
    await coupon.save();
    res.status(200).json(coupon);
  } catch (error) {
    res.status(500).json({ message: 'Error updating coupon', error: error.message });
  }
};

exports.deleteCoupon = async (req, res) => {
  try {
    const coupon = await Coupon.findByIdAndDelete(req.params.id);
    if (!coupon) {
      return res.status(404).json({ message: 'Coupon not found' });
    }
    res.status(200).json({ message: 'Coupon deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting coupon', error: error.message });
  }
};
