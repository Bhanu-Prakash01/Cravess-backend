const Reward = require("../models/RewardSchema");
const User = require("../models/userModel");
const UserDetails = require("../models/userDetailsSchema");
const mongoose = require("mongoose");
exports.addRewards = async (req, res) => {
  const { rewardName, pointsRequired, description, expiryDate } = req.body;

  console.log(rewardName, pointsRequired, description, expiryDate);

  try {
    const newReward = new Reward({
      rewardName,
      pointsRequired,
      description,
      expiryDate,
    });

    console.log(newReward);

    await newReward.save();

    console.log("Reward saved successfully.");

    res.status(201).json({ message: "Reward created successfully." });
  } catch (err) {
    console.error("Error saving reward:", err);
    res.status(500).json({ error: err.message });
  }
};
exports.activateReward = async (req, res) => {
  const { rewardId } = req.params; // Assume rewardId is passed as a URL parameter

  try {
    const reward = await Reward.findById(rewardId);

    if (!reward) {
      return res.status(404).json({ error: "Reward not found." });
    }

    // Toggle the isActive status
    reward.isActive = !reward.isActive;
    await reward.save();

    res.status(200).json({
      message: `Reward ${
        reward.isActive ? "activated" : "deactivated"
      } successfully.`,
      reward,
    });
  } catch (err) {
    console.error("Error toggling reward status:", err);
    res.status(500).json({ error: err.message });
  }
};


exports.awardPoints = async (userId, amountSpent) => {
  try {
    // Calculate points based on the amount spent
    const pointsToAward = Math.floor(amountSpent / 100); // 1 point per 100 spent

    if (pointsToAward <= 0) {
      return { message: "No points awarded as the amount spent is less than 100", points: 0 };
    }

    // Find user
    const user = await User.findById(userId);

    if (!user) {
      throw new Error("User not found");
    }

    // Check if UserDetails exists for the user, else create it
    let userDetails = await UserDetails.findOne({ _id: user.additionalDetail});

    if (!userDetails) {
      userDetails = new UserDetails({
        preferences: [],
        user: userId,
        loyaltyPoints: 0, // Initialize loyalty points
        favoriteRestaurants: [],
        favoriteDishes: [],
        // loyaltyPointsLog: [],
      });
    }

    // Add points to UserDetails
    userDetails.loyaltyPoints += pointsToAward;
     // Log the loyalty points earned
     userDetails.loyaltyPointsLog.push({
      pointsEarned: pointsToAward,
      earnedFrom: "Order", // Since it's from an order
      earnedOn: new Date(),
    });
    await userDetails.save();

    return {
      message: `${pointsToAward} points awarded successfully`,
      totalLoyaltyPoints: userDetails.loyaltyPoints,
      loyaltyPointsLog: userDetails.loyaltyPointsLog.slice(-1)[0], 
    };
  } catch (err) {
    console.error("Error awarding points:", err.message);
    throw new Error(err.message);
  }
};


exports.redeemPoints = async (req,res) => {
  try {
    const { userId } = req.body;
   
    const user = await User.findById(userId);
    if (!user) {
      throw new Error("User not found");
    }
    const userDetails = await UserDetails.findOne({ _id: user.additionalDetail });
    if (userDetails) {
      userDetails.set({ loyaltyPoints: 0 });
      await userDetails.save(); // Save the updated userDetails
    }
    await user.save();
    res.status(200).json({ success: true, message: "All points redeemed successfully", data: user });
  } catch (error) {
    console.error("Error redeeming points:", error);
    res.status(500).json({ error: err.message });
  }
};



exports.getLoyaltyPointsByUser = async (req, res) => {
  try {
    const { userId } = req.params;
    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    // Find user details
    const userDetails = await UserDetails.findById({_id:user.additionalDetail}).select("loyaltyPointsLog loyaltyPoints");

    if (!userDetails) {
      return res.status(404).json({ message: "User not found" });
    }
    

    return res.status(200).json({
      success: true,
      message: "Loyalty points log retrieved successfully",
      data:{
        totalLoyaltyPoints: userDetails.loyaltyPoints,
        loyaltyPointsLog: userDetails.loyaltyPointsLog,
      }
     
    });
  } catch (error) {
    console.error("Error fetching loyalty points log:", error.message);
    return res.status(500).json({ message: "Internal server error" });
  }
};