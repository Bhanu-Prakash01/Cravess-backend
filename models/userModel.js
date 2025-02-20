// Import the Mongoose library
const mongoose = require("mongoose");
const crypto = require("crypto");
const CONSTANTS = require("../constants/constants");
require('dotenv').config();
const encryptionKey = crypto.createHash('sha256').update(process.env.ENCRYPTION_KEY).digest();
const iv = crypto.randomBytes(16); 

const userSchema = new mongoose.Schema(
  {
    userName: {
      type: String,
    },
    email: {
      type: String,
      set: (val) => encrypt(val), 
      get: (val) => decrypt(val), 
    },
    phone: {
      type: String,
      required: true,
      minlength: 10, 
      // set: (val) => encrypt(val), 
      // get: (val) => decrypt(val), 
    },
    image: {
      type: String,
    },
    role: {
      type: String,
      enum: CONSTANTS.ENUM.ROLES,
      required: true,
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
  
    createdAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
    toJSON: { getters: true },
    toObject: { getters: true }, 
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
  if (!text) return "";
  const cipher = crypto.createCipheriv('aes-256-cbc', encryptionKey, iv);
  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  const encryptedData = iv.toString('hex') + ':' + encrypted;
  return encryptedData;
}

// Function to decrypt the value
function decrypt(encryptedText) {
  if (!encryptedText) return "";
  // Split the stored value to extract IV and encrypted data
  const [ivHex, encrypted] = encryptedText.split(':');
  const iv = Buffer.from(ivHex, 'hex');
  const decipher = crypto.createDecipheriv('aes-256-cbc', encryptionKey, iv);
  let decrypted = decipher.update(encrypted, 'hex', 'utf8');
  decrypted += decipher.final('utf8');
  return decrypted;
}


module.exports = mongoose.model("users", userSchema);
