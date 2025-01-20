const User = require("../models/userModel");
const UserAddresses = require("../models/AddUserAddress");
exports.updateUser = async (req, res) => {
  try {
    const userId = req.params.id;
    // Find user by ID
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    // Use object destructuring to update only provided fields
    const { email, userName, addressLine1, city, country, addressLine2 } =
      req.body;
    // Update user details if provided, or retain current values
    user.email = email;
    user.userName = userName;
    user.addressLine1 = addressLine1;
    user.city = city;
    user.country = country;
    user.addressLine2 = addressLine2;
    // Save the updated user
    const updatedUser = await user.save();
    console.log(updatedUser, "user", user);
    // Respond with the updated user details
    res.json({ message: "User updated successfully", user: updatedUser });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Error updating user" });
  }
};

exports.getUserById = async (req, res) => {
  try {
    const userId = req.params.id;
    // Find the user by their ID
    const user = await User.findById(userId);
    // If user is not found, return a 404 error
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    res.json({ user });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Error fetching user details" });
  }
};

exports.addUserAddress = async (req, res) => {
  try {
    const userId = req.params.id;
    console.log(userId);
    // Find the user by their ID
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    // Create a new address document
    const newAddress = new UserAddresses({
      ...req.body,
      user: userId,
    });
    console.log(newAddress);
    // Save the new address document
    await newAddress.save();
    // Add the address reference to the user's addresses array
    user.addresses.push(newAddress._id);
    // Save the user with the updated addresses array
    await user.save();
    res
      .status(201)
      .json({ message: "Address added successfully", address: newAddress });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Error adding address" });
  }
};

exports.getUserAddress = async (req, res) => {
  try {
    const userId = req.params.id;
    // Find the user by their ID
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    // Find the address by its ID
    const addressId = req.params.addressId;
    const address = user.addresses.find(
      (address) => address.toString() === addressId
    );
    if (!address) {
      return res.status(404).json({ message: "Address not found" });
    }
    res.json({ address });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Error fetching address details" });
  }
};
