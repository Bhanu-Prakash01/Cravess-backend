
const mongoose = require("mongoose");
const crypto = require("crypto");
require('dotenv').config();
const encryptionKey = crypto.createHash('sha256').update(process.env.ENCRYPTION_KEY).digest();
const iv = crypto.randomBytes(16);

const accountDetailsSchema = new mongoose.Schema({
  bankName: {
    type: String,
    required: true,
    trim: true,
    set: (val) => encrypt(val),
    get: (val) => decrypt(val),
  },

  accountHolderName: {
    type: String,
    // required: true,
    // trim: true,
    // set: (val) => encrypt(val),
    // get: (val) => decrypt(val),
  },
  accountNumber: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    set: (val) => encrypt(val),
    get: (val) => decrypt(val),
  },
  ifscCode: {
    type: String,
    required: true,
    trim: true,
    set: (val) => encrypt(val),
    get: (val) => decrypt(val),
  },
  branchName: {
    type: String,
    required: true,
    trim: true,
    set: (val) => encrypt(val),
    get: (val) => decrypt(val),
  },
  
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
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

function encrypt(text) {
  const cipher = crypto.createCipheriv('aes-256-cbc', encryptionKey, iv);
  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  const encryptedData = iv.toString('hex') + ':' + encrypted;
  return encryptedData;
}

// Function to decrypt the value
function decrypt(encryptedText) {
  // Split the stored value to extract IV and encrypted data
  const [ivHex, encrypted] = encryptedText.split(':');
  const iv = Buffer.from(ivHex, 'hex');
  const decipher = crypto.createDecipheriv('aes-256-cbc', encryptionKey, iv);
  let decrypted = decipher.update(encrypted, 'hex', 'utf8');
  decrypted += decipher.final('utf8');
  return decrypted;
}


module.exports = mongoose.model("accountdetails", accountDetailsSchema);
