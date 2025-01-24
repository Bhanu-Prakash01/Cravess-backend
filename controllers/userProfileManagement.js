const User = require("../models/userModel");
const UserAddresses = require("../models/AddUserAddress");
exports.updateUser = async (req, res) => {
  try {
    const userId = req.params.id;
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    const { email, userName, phoneNumber } = req.body;
    user.email = email;
    user.userName = userName;
    user.phoneNumber = phoneNumber;

    const updatedUser = await user.save();
    res.json({ success: true, message: "User updated successfully", data: updatedUser });
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
    res.status(200).json({ success: true, message: "User fetched successfully", data: user });
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
      .json({ success: true, message: "Address added successfully", data: newAddress });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Error adding address" });
  }
};

exports.updateUserAddress = async (req, res) => {
  try {
    const addressId = req.params.addressId;
    const { userId, name, phoneNumber, addressLine1, addressLine2, landmark, city, state, pincode } = req.body;

    // Find the user by their ID
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    // Find the address by its ID
    const address = await UserAddresses.findById(addressId);
    if (!address) {
      return res.status(404).json({ message: "Address not found" });
    }
    // Use object destructuring to update only provided fields
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
    res.status(200).json({ success: true, message: "Address updated successfully", data: updatedAddress });
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
    res.status(200).json({ success: true, message: "Address fetched successfully", data: addresses });
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
    res.status(200).json({ success: true, message: "Addresses fetched successfully", data: addresses });
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
    res.status(200).json({success: true, message: "All addresses deleted successfully" });
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
    res.status(200).json({ success: true, message: "Address deleted successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Error deleting address" });
  }

}