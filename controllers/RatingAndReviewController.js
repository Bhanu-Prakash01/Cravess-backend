const RestaurantDetails = require("../models/restaurantDetailsModel");
const DeliveryAgent = require('../models/DeliveryAgentDetails');
const Review = require('../models/RatingAndReviewsModel');
const Order = require('../models/orderSchema');
const Dish = require('../models/dishSchema');

exports.createReview = async (req, res) => {
    const { userId, orderId, ratingDeliveryAgent, ratingRestaurant, ratingDish, reviewText } = req.body;
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
        const dishId = order.items[0]?.dishId;

        // Create the review
        const newReview = new Review({
            userId,
            orderId,
            ratingDeliveryAgent,
            ratingRestaurant,
            ratingDish,
            reviewText,
            restaurantId,
            deliveryAgentId,
            dishId
        });

       
        try {
            // Handle restaurant rating
            if (restaurantId) {
                const restaurantRatings = await RestaurantDetails.findOne({ _id: restaurantId });
                const ratings = restaurantRatings.ratingAndReview;
                const isFirstRestaurantRating = ratings?.length < 1; // **Check if it's the first review**
                const averageRestaurantRating = isFirstRestaurantRating
                    ? ratingRestaurant // First review sets the current rating directly
                    : (ratings?.reduce((acc, review) => acc + review.rating, 0) + ratingRestaurant) / (ratings?.length + 1);
                await RestaurantDetails.findByIdAndUpdate(
                    restaurantId,
                    {
                        $set: { current_rating: averageRestaurantRating },
                      $push: { ratingAndReview: { _id: newReview._id, rating:ratingRestaurant } },
                    },
                    { new: true }
                );
            }

            // Handle delivery agent rating
            if (deliveryAgentId) {
                const deliveryAgentRatings = await DeliveryAgent.findOne({ _id: deliveryAgentId });
                const ratings = deliveryAgentRatings.ratingAndReview;
                const isFirstDeliveryAgentRating = ratings?.length < 1; // **Check if it's the first review**
                const averageDeliveryAgentRating = isFirstDeliveryAgentRating
                    ? ratingDeliveryAgent // First review sets the current rating directly
                    : (ratings?.reduce((acc, review) => acc + review.rating, 0) + ratingDeliveryAgent) / (ratings?.length + 1);
                await DeliveryAgent.findByIdAndUpdate(
                    deliveryAgentId,
                    {
                        $set: { current_rating: averageDeliveryAgentRating },
                        $push: { ratingAndReview: { _id: newReview._id, rating: ratingDeliveryAgent } },
                    },
                    { new: true }

                );
            }

            if(dishId){
                const dishRatings = await Dish.findOne({ _id: dishId });
                const ratings = dishRatings.ratingAndReview;
                const isFirstDishRating = ratings?.length < 1; // **Check if it's the first review**
                const averageDishRating = isFirstDishRating
                    ? ratingDish // First review sets the current rating directly
                    : (ratings?.reduce((acc, review) => acc + review.rating, 0) + ratingDish) / (ratings?.length + 1);
                await Dish.findByIdAndUpdate(
                    dishId,
                    {
                        $set: { current_rating: averageDishRating },
                        $push: { ratingAndReview: { _id: newReview._id, rating: ratingDish } },
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

exports.getAllRatingAndReviews = async (req, res) => {
    try {
        const reviews = await Review.find()
        .populate('userId', 'userName') 
        .populate('restaurantId', 'restaurantDetails.restaurantName')
        .populate('dishId', 'dishName')
        .exec();
      const reviewsWithAdditionalInfo = reviews.map(review => {
        const averageRating = (review.ratingDeliveryAgent + review.ratingRestaurant + review.ratingDish) / 3;
        return {
          userName: review.userId.userName,
          restaurantName: review.restaurantId.restaurantDetails.restaurantName,
          dishName: review.dishId.dishName,
          averageRating,
          ratingDeliveryAgent: review.ratingDeliveryAgent,
          ratingRestaurant: review.ratingRestaurant,
          ratingDish: review.ratingDish,
          createdAt: review.createdAt,
          reviewText: review.reviewText
        };
      });
  
      res.status(200).json({ success: true, message: 'Reviews fetched successfully', data: reviewsWithAdditionalInfo });
    } catch (error) {
        res.status(500).json({ error: 'An error occurred while processing the request', details: error.message });
    }
}
