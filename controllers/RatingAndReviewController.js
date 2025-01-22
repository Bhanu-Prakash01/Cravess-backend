const RestaurantDetails = require("../models/restaurantDetailsModel");
const DeliveryAgent = require('../models/DeliveryAgentDetails');
const Review = require('../models/RatingAndReviewsModel');
const Order = require('../models/orderSchema');

exports.createReview = async (req, res) => {
    const { userId, orderId, rating, reviewText } = req.body;
    try {
        // Ensure one of the IDs is provided
        if (!orderId) {
            return res.status(400).json({ error: 'orderId must be provided' });
        }

        // Check if a review already exists for the order
        const existingReview = await Review.findOne({ orderId });
        if (existingReview) {
            return res.status(400).json({ error: 'Review already exists for this order' });
        }

        // Fetch the order and items
        const order = await Order.findById(orderId);
        if (!order) {
            return res.status(404).json({ error: 'Order not found' });
        }

        // Get the restaurantId and deliveryAgentId from the order
        const restaurantId = order.items[0]?.restaurant;
        const deliveryAgentId = order.assignedAgent?.id;

        // Create the review
        const newReview = new Review({
            userId,
            orderId,
            rating,
            reviewText,
        });

        await newReview.save();
        const restaurantRatings = await Review.find({ restaurantId: restaurantId });
        const restaurantRatingSum = restaurantRatings.reduce((acc, review) => acc + review.rating, 0);
        const averageRestaurantRating = restaurantRatingSum / restaurantRatings.length;

        const deliveryAgentRatings = await Review.find({ deliveryAgentId: deliveryAgentId });
        const deliveryAgentRatingSum = deliveryAgentRatings.reduce((acc, review) => acc + review.rating, 0);
        const averageDeliveryAgentRating = deliveryAgentRatingSum / deliveryAgentRatings.length;
        try {
            // Determine where to push the reviewId
            if (restaurantId) {
                await RestaurantDetails.findByIdAndUpdate(
                    restaurantId,
                    { $set: { current_rating: averageRestaurantRating } },
                    { $push: { ratingAndReview: newReview._id } },
                    { new: true }
                );
            }

            if (deliveryAgentId) {
                await DeliveryAgent.findByIdAndUpdate(
                    deliveryAgentId,
                    { $set: { current_rating: averageDeliveryAgentRating } },
                    { $push: { ratingAndReview: newReview._id } },
                    { new: true }
                );
            }
        } catch (error) {
            console.error(error);
            return res.status(500).json({ error: 'Error updating restaurant or delivery agent document' });
        }


        res.status(201).json({ message: 'Review created and added successfully', review: newReview });
    } catch (error) {
        res.status(500).json({ error: 'An error occurred while processing the request', details: error.message });
    }
};

