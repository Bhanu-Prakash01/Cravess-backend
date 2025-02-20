const RestaurantDetails = require("../models/restaurantDetailsModel");
const DeliveryAgent = require('../models/DeliveryAgentDetails');
const Review = require('../models/RatingAndReviewsModel');
const Order = require('../models/orderSchema');
const Dish = require('../models/dishSchema');
const User = require('../models/userModel');

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
        const restaurantId = order.items[0]?.restaurant;
        const agentId = order.assignedAgent;
        const dishId = order.items[0]?.dishId;
      
        const deliveryAgent = await User.findOne({ _id: agentId });
        const deliveryAgentId = deliveryAgent?.additionalDetail
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
                        $push: { ratingAndReview: { _id: newReview._id, rating: ratingRestaurant } },
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

            if (dishId) {
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
        res.status(201).json({ success: true, message: 'Review created and added successfully', data: newReview });
    } catch (error) {
        res.status(500).json({ error: 'An error occurred while processing the request', details: error.message });
    }
};

exports.getAllRatingAndReviews = async (req, res) => {
    try {
        const reviews = await Review.find()
            .populate('userId', 'userName image')
            .populate('restaurantId', 'restaurantDetails.restaurantName')
            .populate('dishId', 'dishName image')
            .exec();
        const reviewsWithAdditionalInfo = reviews.map(review => {
            const averageRating = (review.ratingDeliveryAgent + review.ratingRestaurant + review.ratingDish) / 3;
            return {
                userName: review.userId.userName,
                image: review.userId.image,
                restaurantName: review.restaurantId.restaurantDetails.restaurantName,
                dishName: review.dishId.dishName,
                dishImage: review.dishId.image,
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
};


exports.getAllReviewsBreakdown = async (req, res) => {
    try {
        const { fromDate, toDate } = req.query; // Read date range from query params

        // Build match filter based on provided dates
        let matchFilter = {
            ratingDeliveryAgent: { $gte: 0, $lte: 5 },
            ratingRestaurant: { $gte: 0, $lte: 5 },
            ratingDish: { $gte: 0, $lte: 5 },
        };

        if (fromDate && toDate) {
            matchFilter.createdAt = {
                $gte: new Date(fromDate),
                $lte: new Date(toDate),
            };
        }

        // Aggregation pipeline
        const summary = await Review.aggregate([
            { $match: matchFilter },
            {
                $project: {
                    individualAverage: {
                        $avg: [
                            "$ratingDeliveryAgent",
                            "$ratingRestaurant",
                            "$ratingDish"
                        ]
                    }
                }
            },
            {
                $addFields: {
                    roundedRating: { $round: ["$individualAverage", 0] }
                }
            },
            {
                $group: {
                    _id: "$roundedRating",
                    count: { $sum: 1 },
                    averageRating: { $avg: "$individualAverage" }
                }
            },
            {
                $project: {
                    _id: 0,
                    averageRating: { $round: ["$averageRating", 0] },
                    count: 1
                }
            },
            { $sort: { averageRating: -1 } }
        ]);

        // Ensure all ratings (0-5) are included
        const allRatings = [0, 1, 2, 3, 4, 5].map(rating => {
            const existing = summary.find(item => item.averageRating === rating);
            return existing || { count: 0, averageRating: rating };
        });

        // Calculate overall average rating
        const overallSummary = await Review.aggregate([
            { $match: matchFilter },
            {
                $project: {
                    individualAverage: {
                        $avg: [
                            "$ratingDeliveryAgent",
                            "$ratingRestaurant",
                            "$ratingDish"
                        ]
                    }
                }
            },
            {
                $group: {
                    _id: null,
                    overallAverage: { $avg: "$individualAverage" },
                    totalReviews: { $sum: 1 }
                }
            },
            {
                $project: {
                    _id: 0,
                    overallAverage: { $round: ["$overallAverage", 0] },
                    totalReviews: 1
                }
            }
        ]);

        const totalReviews = overallSummary.length ? overallSummary[0].totalReviews : 0;
        const averageRating = overallSummary.length ? overallSummary[0].overallAverage : 0;

        res.json({
            success: true,
            message: "Review summary fetched successfully",
            data: {
                totalReviews,
                averageRating,
                ratingsSummary: allRatings
            },
        });

    } catch (error) {
        console.error("Error fetching review summary:", error);
        res.status(500).json({ error: "Internal server error" });
    }
};

exports.getRestaurantReviewBreakdown = async (req, res) => {
    try {
        const { restaurantId } = req.params;
        const user = await User.findById(restaurantId);
        const restaurant = user.additionalDetail?.restaurantId;
        const { fromDate, toDate } = req.query;

        if (!restaurant) {
            return res.status(400).json({ error: "Restaurant ID is required" });
        }

        let matchFilter = {
            restaurantId: restaurant,
            ratingRestaurant: { $gte: 0, $lte: 5 },
        };

        if (fromDate && toDate) {
            matchFilter.createdAt = {
                $gte: new Date(fromDate),
                $lte: new Date(toDate),
            };
        }

        // Fetch all ratings
        const rawRatings = await Review.find(matchFilter).select("ratingRestaurant");

        // Step 1: Compute the exact average rating
        const totalReviews = rawRatings.length;
        const exactAverage = totalReviews
            ? rawRatings.reduce((sum, review) => sum + review.ratingRestaurant, 0) / totalReviews
            : 0;

        const averageRating = Math.round(exactAverage * 10) / 10; // Round to 1 decimal place

        // Step 2: Group ratings into whole numbers after rounding each individual rating
        const ratingCounts = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0, 0: 0 };

        rawRatings.forEach((review) => {
            const roundedRating = Math.round(review.ratingRestaurant); // Round each rating
            if (ratingCounts.hasOwnProperty(roundedRating)) {
                ratingCounts[roundedRating]++;
            }
        });

        // Step 3: Format ratings summary
        const ratingsSummary = Object.entries(ratingCounts)
            .map(([rating, count]) => ({
                rating: Number(rating),
                count,
            }))


        res.json({
            success: true,
            message: "Restaurant review breakdown fetched successfully",
            data: {
                totalReviews,
                averageRating,
                ratingsSummary,
            },
        });

    } catch (error) {
        console.error("Error fetching restaurant review summary:", error);
        res.status(500).json({ error: "Internal server error" });
    }
};

exports.getAgentReviewBreakdown = async (req, res) => {
    try {
        const { agentId } = req.params;
        const user = await User.findById(agentId);
        const agent = user.additionalDetail;
        const { fromDate, toDate } = req.query;
        if (!agent) {
            return res.status(400).json({ error: "agent ID is required" });
        }

        let matchFilter = {
            deliveryAgentId: agent,
            ratingDeliveryAgent: { $gte: 0, $lte: 5 },
        };

        if (fromDate && toDate) {
            matchFilter.createdAt = {
                $gte: new Date(fromDate),
                $lte: new Date(toDate),
            };
        }

        // Fetch all ratings
        const rawRatings = await Review.find(matchFilter).select("ratingDeliveryAgent");

        // Step 1: Compute the exact average rating
        const totalReviews = rawRatings.length;
        const exactAverage = totalReviews
            ? rawRatings.reduce((sum, review) => sum + review.ratingDeliveryAgent, 0) / totalReviews
            : 0;

        const averageRating = Math.round(exactAverage * 10) / 10; // Round to 1 decimal place

        // Step 2: Group ratings into whole numbers after rounding each individual rating
        const ratingCounts = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0, 0: 0 };

        rawRatings.forEach((review) => {
            const roundedRating = Math.round(review.ratingDeliveryAgent); // Round each rating
            if (ratingCounts.hasOwnProperty(roundedRating)) {
                ratingCounts[roundedRating]++;
            }
        });

        // Step 3: Format ratings summary
        const ratingsSummary = Object.entries(ratingCounts)
            .map(([rating, count]) => ({
                rating: Number(rating),
                count,
            }))


        res.json({
            success: true,
            message: "Agent review breakdown fetched successfully",
            data: {
                totalReviews,
                averageRating,
                ratingsSummary,
            },
        });

    } catch (error) {
        console.error("Error fetching restaurant review summary:", error);
        res.status(500).json({ error: "Internal server error" });
    }
};

exports.getMonthlyReviewsBreakdown = async (req, res) => {
    try {
        const { fromDate, toDate } = req.query;

        let matchFilter = {
            ratingDeliveryAgent: { $gte: 0, $lte: 5 },
            ratingRestaurant: { $gte: 0, $lte: 5 },
            ratingDish: { $gte: 0, $lte: 5 },
        };

        if (fromDate && toDate) {
            matchFilter.createdAt = {
                $gte: new Date(fromDate),
                $lte: new Date(toDate),
            };
        }

        const monthlySummary = await Review.aggregate([
            { $match: matchFilter },
            {
                $project: {
                    date: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
                    averageRating: {
                        $avg: ["$ratingDeliveryAgent", "$ratingRestaurant", "$ratingDish"]
                    }
                }
            },
            {
                $addFields: {
                    reviewType: {
                        $cond: { if: { $gte: ["$averageRating", 3] }, then: "positive", else: "negative" }
                    }
                }
            },
            {
                $group: {
                    _id: { date: "$date", reviewType: "$reviewType" },
                    count: { $sum: 1 }
                }
            },
            {
                $group: {
                    _id: "$_id.date",
                    positive: {
                        $sum: { $cond: [{ $eq: ["$_id.reviewType", "positive"] }, "$count", 0] }
                    },
                    negative: {
                        $sum: { $cond: [{ $eq: ["$_id.reviewType", "negative"] }, "$count", 0] }
                    }
                }
            },
            {
                $project: {
                    _id: 0,
                    date: "$_id",
                    positive: 1,
                    negative: 1
                }
            },
            { $sort: { date: 1 } }
        ]);

        res.json({
            success: true,
            message: "Monthly review breakdown fetched successfully",
            data: monthlySummary
        });

    } catch (error) {
        console.error("Error fetching review summary:", error);
        res.status(500).json({ error: "Internal server error" });
    }
};

