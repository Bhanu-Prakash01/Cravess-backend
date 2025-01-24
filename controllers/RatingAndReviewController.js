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
            restaurantId,
            deliveryAgentId
        });

       
        try {
            // Handle restaurant rating
            if (restaurantId) {
                const restaurantRatings = await RestaurantDetails.findOne({ _id: restaurantId });
                const ratings = restaurantRatings.ratingAndReview;
                const isFirstRestaurantRating = ratings?.length < 1; // **Check if it's the first review**
                const averageRestaurantRating = isFirstRestaurantRating
                    ? rating // First review sets the current rating directly
                    : (ratings?.reduce((acc, review) => acc + review.rating, 0) + rating) / (ratings?.length + 1);
                await RestaurantDetails.findByIdAndUpdate(
                    restaurantId,
                    {
                        $set: { current_rating: averageRestaurantRating },
                      $push: { ratingAndReview: { _id: newReview._id, rating } },
                    },
                    { new: true }
                );
            }

            // Handle delivery agent rating
            if (deliveryAgentId) {
                const deliveryAgentRatings = await DeliveryAgent.findOne({_id: deliveryAgentId });
                const ratings = deliveryAgentRatings.ratingAndReview;
                const isFirstDeliveryAgentRating = ratings?.length < 1; // **Check if it's the first review**
                const averageDeliveryAgentRating = isFirstDeliveryAgentRating
                    ? rating // First review sets the current rating directly
                    : (ratings?.reduce((acc, review) => acc + review.rating, 0) + rating) / (ratings?.length + 1);
                await DeliveryAgent.findByIdAndUpdate(
                    deliveryAgentId,
                    {
                        $set: { current_rating: averageDeliveryAgentRating },
                        $push: { ratingAndReview: { _id: newReview._id, rating } },
                    },
                    { new: true }

                );
            }
        } catch (error) {
            console.error(error);
            return res.status(500).json({ error: 'Error updating restaurant or delivery agent document' });
        }

        await newReview.save();
        res.status(201).json({success: true,  message: 'Review created and added successfully', data: newReview });
    } catch (error) {
        res.status(500).json({ error: 'An error occurred while processing the request', details: error.message });
    }
};

