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
    const {userId, name,phoneNumber, addressLine1, addressLine2, landmark, city, state, pincode } = req.body;
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    if(user.role !== 'User'){
      return res.status(401).json({ message: "Unauthorized" });
    }
    const newAddress = new UserAddresses({
      name,
      phoneNumber,
      addressLine1,
      addressLine2,
      landmark,
      city,
      state,
      pincode,
      user: userId,
    });
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

exports.updateUserAddress = async (req, res) => {
  try {
    const userId = req.params.userId;
    const addressId = req.params.addressId;
    // Find the user by their ID
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    // Find the address by its ID
    const address = user.addresses.find(
      (address) => address.toString() === addressId 
    );
    if (!address) {
      return res.status(404).json({ message: "Address not found" });
    }
    // Use object destructuring to update only provided fields
    const { name, phoneNumber, addressLine1, addressLine2, landmark, city, state, pincode } = req.body;
    // Update address details if provided, or retain current values
    address.name = name;
    address.phoneNumber = phoneNumber;
    address.addressLine1 = addressLine1;    
    address.addressLine2 = addressLine2;
    address.landmark = landmark;
    address.city = city;
    address.state = state;
    address.pincode = pincode;
    // Save the updated address
    const updatedAddress = await address.save();
    // Respond with the updated address details
    res.json({ message: "Address updated successfully", address: updatedAddress });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Error updating address" });
  }
};

exports.getUserAddress = async (req, res) => {
  try {
    const userId = req.params.userId;
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
    const addresses = await UserAddresses.find({ _id: { $in: address } });
    res.json({ address: addresses });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Error fetching address details" });
  }
};

exports.getAllAddressByUser = async (req, res) => {
  try {
    const userId = req.params.id;
    // Find the user by their ID
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    // Fetch the addresses from the userAddress collection
    const addresses = await UserAddresses.find({ _id: { $in: user.addresses } });
    res.json({ address: addresses });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Error fetching address details" });
  }
};

exports.deleteAllAddressByUser = async (req, res) => {
  try {
    const userId = req.params.id;
    // Find the user by their ID
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    
    user.addresses = [];
    await user.save();
    res.json({ message: "All addresses deleted successfully" });
  } catch (err) {
    console.error(err); 
    res.status(500).json({ message: "Error deleting address" });
  }
};

exports.deleteAddressByUser = async(req, res) => {
  try {
    const userId = req.params.userId;
    const addressId = req.params.addressId;
    // Find the user by their ID
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Find the address by its ID
    const address = user.addresses.find(
      (address) => address.toString() === addressId
    );
    if (!address) {
      return res.status(404).json({ message: "Address not found" });
    }
    user.addresses.pull(address);
    await user.save();
    res.json({ message: "Address deleted successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Error deleting address" });
  }

}