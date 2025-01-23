// Import the Mongoose library
const mongoose = require("mongoose");
const crypto = require("crypto");
const CONSTANTS = require("../constants/constants");
require('dotenv').config();
const encryptionKey = crypto.createHash('sha256').update(process.env.ENCRYPTION_KEY).digest();
const iv = crypto.randomBytes(16); 

// const iv = Buffer.from('1234567890123456'); // Example IV (16 bytes for aes-256-cbc)
// const encryptionKey = crypto.createHash('sha256').update('craves_encryption_key').digest();
//Define the user Schema using the Mongoose Schema Constructor

const userSchema = new mongoose.Schema(
  {
    userName: {
      type: String,
      //   required: true,
    },
    password: {
      type: String,
      //   required: true,
    },
    token: {
      type: String,
    },
    userEmail: {
      type: String,
      // required: true,
      set: (val) => encrypt(val), // Encrypt email before saving
      get: (val) => decrypt(val), // Decrypt email when retrieving
    },
    phone: {
      type: String,
      required: true,
      minlength: 10, // Set minimum length to 10
      set: (val) => encrypt(val), // Encrypt Phone before saving
      get: (val) => decrypt(val), // Decrypt Phone when retrieving
    },
    image: {
      type: String,
      //   required: true,
    },
    role: {
      type: String,
      enum: CONSTANTS.ENUM.ROLES,
      required: true,
    },
    addressLine1: {
      type: String,
    },
    city: {
      type: String,
    },
    country: {
      type: String,
    },
    points: {
      type: Number,
      default: 0,
    },
    additionalDetail: {
      type: mongoose.Schema.Types.Mixed,
      refPath: "additionalDetailModel",
    },
    additionalDetailModel: {
      type: String,
      enum: [
        "AdminDetails",
        "DeliveryAgentDetails",
        "RestaurantDetails",
        "UserDetails",
      ],
    },
    addresses: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "UserAddresses",
      },
    ],
    createdAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

userSchema.pre("save", function (next) {
  switch (this.role) {
    case "Admin":
      this.additionalDetailModel = "AdminDetails";
      break;
    case "DeliveryAgent":
      this.additionalDetailModel = "DeliveryAgentDetails";
      break;
    case "Restaurant":
      this.additionalDetailModel = "RestaurantDetails";
      break;
    case "User":
      this.additionalDetailModel = "UserDetails";
      break;
    default:
      next(new Error("Invalid role specified"));
      return;
  }
  next();
});

// Function to encrypt the value
function encrypt(text) {
  const cipher = crypto.createCipheriv('aes-256-cbc', encryptionKey, iv);
  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  return encrypted;
}

// Function to decrypt the value
function decrypt(text) {
  const decipher = crypto.createDecipheriv('aes-256-cbc', encryptionKey, iv);
  let decrypted = decipher.update(text, 'hex', 'utf8');
  decrypted += decipher.final('utf8');
  return decrypted;
}

// Export the Mongoose model for the user schema, using the name "user"
module.exports = mongoose.model("users", userSchema);
