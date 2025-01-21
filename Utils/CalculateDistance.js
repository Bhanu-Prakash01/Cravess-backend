const axios = require("axios");

async function calculateDistance(origin, destination) {
  try {
    const response = await axios.get("https://api.olamaps.com/v1/distance", {
      params: {
        origin: origin,
        destination: destination,
        key: "YOUR_OLA_MAPS_API_KEY",
      },
    });

    const travelTime = response.data.routes[0].legs[0].duration.value; // Travel time in seconds
    return Math.ceil(travelTime / 60); // Convert to minutes
  } catch (err) {
    throw new Error("Failed to calculate distance: " + err.message);
  }
}

module.exports = calculateDistance;