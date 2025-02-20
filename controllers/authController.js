const userSchema = require("../models/userModel");
const OTP = require("../models/OTPmodel");
const jwt = require('jsonwebtoken');
const otpGenerator = require("otp-generator");
const AdminDetails = require('../models/AdminDetails');
const DeliveryAgentDetails = require('../models/DeliveryAgentDetails');
const RestaurantDetails = require('../models/restaurantDetailsModel');
const UserDetails = require('../models/userDetailsSchema');  

exports.userAuth = async (req, res) => {
  const { email, phoneNumber, name, otp, role, additionalDetail } = req.body;
  if (!email && !phoneNumber) {
    return res.status(400).json({
      success: false,
      message: "Please provide either an email or phone number.",
    });
  }
  
  if (!otp) {
    return res.status(400).json({
      success: false,
      message: "Please provide the OTP.",
    });
  }

  try {
    const response = await OTP.findOne({ phone: phoneNumber, otp:otp });
    if (!response || otp !== response.otp) {
      return res.status(400).json({
        success: false,
        message: "The OTP is not valid.",
      });
    }
    await OTP.findByIdAndDelete(response._id);

    // Find the user by phoneNumber
    let user = await userSchema.findOne({ phone: phoneNumber });
    const token = jwt.sign({ role: user?.role || role, phoneNumber: user?.phone || phoneNumber }, process.env.JWT_SECRET_KEY, {
      expiresIn: '12h' // expires in 12h
    });

    if (user) {
      // User exists, proceed with login
      return res.status(200).cookie('token', token).json({
        success: true,
        message: "Login successful.",
        data: user,
        token
      });
    } else {
      // Ensure phoneNumber is defined before creating a user
      if (!phoneNumber) {
        return res.status(400).json({
          success: false,
          message: "Phone number cannot be undefined.",
        }); 
      }

      // Determine the additionalDetail schema based on the role
      let additionalDetailsData;
      if (role === "Admin") {
        additionalDetailsData = new AdminDetails(additionalDetail);
      } else if (role === "DeliveryAgent") {
        additionalDetailsData = new DeliveryAgentDetails(additionalDetail);
      } else if (role === "Restaurant") {
        additionalDetailsData = new RestaurantDetails(additionalDetail);
      } else if  (role === "User") {
        additionalDetailsData = new UserDetails(additionalDetail);
      } else {
        return res.status(400).json({
          success: false,
          message: "Invalid role provided.",
        });
      }

      user = new userSchema({
        phone: phoneNumber,
        role,
        email: email || "NA",
        userName: name || "NA",
        image: "NA",
        additionalDetail: additionalDetailsData,
      });

      await user.save();

      return res.status(200).cookie('token', token).json({
        success: true,
        message: "User registered and login successful.",
        data: user,
        token
      });
    }
  } catch (err) {
    console.error(err);
    return res.status(500).json({
      success: false,
      message: "Error in authentication.",
    });
  }
};


// exports.sendOtp = async (req, res) => {
//   const { phoneNumber } = req.body;
//   try {
//     // Generate a 6-digit numeric OTP
//     let otp;
//     let existingOtp;

//     do {
//       otp='0000'
//       // otp = otpGenerator.generate(4, {
//       //   upperCaseAlphabets: false,
//       //   lowerCaseAlphabets: false,
//       //   specialChars: false,
//       //   digits: true,
//       // });
//       existingOtp = await OTP.findOne({ otp: otp });
//     } while (existingOtp);

//     // Create OTP payload
//     const otpPayload = { phone: phoneNumber, otp };
//     const otpBody = await OTP.create(otpPayload);

//     // Log the OTP (you might want to remove this in production)
//     console.log(`OTP sent to ${phoneNumber}: ${otp}`);
//     // Respond with success
//     res.status(200).json({
//       success: true,
//       message: "OTP Sent Successfully",
//     });
//   } catch (err) {
//     console.error(err);
//     return res.status(500).json({
//       message: "Error sending OTP",
//       success: false,
//     });
//   }
// };

exports.sendOtp = async (req, res) => {
  const { phoneNumber } = req.body;
  try {
    // Validate phone number
    if (!phoneNumber) {
      return res.status(400).json({ error: 'Invalid phone number' });
    }
    // Generate OTP
    const otp = Math.floor(1000 + Math.random() * 9000);
    const existingOtp = await OTP.findOne({ phone: phoneNumber });
    if (existingOtp) {
      const updatedOtp = await OTP.findByIdAndUpdate(existingOtp._id, { otp, expiresAt: Date.now() + 300000 }, { new: true });
      return res.status(200).json({ success: true, message: 'OTP updated successfully', data: updatedOtp });
    }
    const otpPayload = { phone: phoneNumber, otp, expiresAt: Date.now() + 300000 }; // expires in 5 minutes
    const otpBody = await OTP.create(otpPayload);
   
    res.status(200).json({ success: true, message: 'OTP sent successfully', data: otpBody });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Error sending OTP' });
  }
};