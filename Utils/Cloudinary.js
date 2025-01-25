const cloudinary = require('cloudinary').v2;

// require('dotenv').config();
cloudinary.config({
  cloud_name: process.env.CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

const uploadMultiDocuments = async (documents,folderName,userId) => {
  try {
    const uploadPromises = documents?.map((document) => {
      return cloudinary.uploader.upload(document, {
        resource_type: 'image',
        folder: `${folderName}/${userId}`
      });
    });

    const results = await Promise.all(uploadPromises);
    return results.map((result) => result.secure_url);
  } catch (error) {
    console.error(error);
    throw error;
  }
};

const uploadSingleDocument = async (document,folderName,userId) => {
  try {
    const result = await cloudinary.uploader.upload(document, {
      resource_type: 'image',
      folder: `${folderName}/${userId}`
    });
    return result.secure_url;
  } catch (error) {
    console.error(error);
    throw error;
  }
};

module.exports = { uploadMultiDocuments, uploadSingleDocument };