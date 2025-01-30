const mongoose = require("mongoose");

const ratingAndReviewSchema = new mongoose.Schema({
	userId: {
		type: mongoose.Schema.Types.ObjectId,
		required: true,
		ref: "users",
	},
	orderId: {
		type: mongoose.Schema.Types.ObjectId,
		required: true,
		ref: "orders",
	},
	restaurantId: {
		type: mongoose.Schema.Types.ObjectId,
		ref: "RestaurantDetails", // Reference to the restaurant being reviewed
	},
	deliveryAgentId: {
		type: mongoose.Schema.Types.ObjectId,
		ref: "DeliveryAgentDetails", // Reference to the delivery agent being reviewed
	},
	dishId: {
		type: mongoose.Schema.Types.ObjectId,
		ref: "dishes",
	},
	ratingDeliveryAgent: {
		type: Number,
	},
	ratingRestaurant: {
		type: Number,
	},
	ratingDish: {
		type: Number,
	},
	reviewText: {
		type: String,
		required: true,
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

// Export the RatingAndReview model
module.exports = mongoose.model("RatingAndReview", ratingAndReviewSchema);