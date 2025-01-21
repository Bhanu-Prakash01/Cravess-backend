const mongoose = require("mongoose");

const ratingAndReviewSchema = new mongoose.Schema({
	userId: {
		type: mongoose.Schema.Types.ObjectId,
		required: true,
		ref: "User",
	},
	orderId: {
		type: mongoose.Schema.Types.ObjectId,
		required: true,
		ref: "Order",
	  },
	rating: {
		type: Number,
		required: true,
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