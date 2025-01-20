const axios = require("axios");

async function calculateDistance(origin, destination) {
  try {
    // const response = await axios.get("https://maps.googleapis.com/maps/api/distancematrix/json", {
    //   params: {
    //     origins: origin,
    //     destinations: destination,
    //     key: "YOUR_GOOGLE_MAPS_API_KEY",
    //   },
    // });

    const travelTime = response.data.rows[0].elements[0].duration.value; // Travel time in seconds
    return Math.ceil(travelTime / 60); // Convert to minutes
  } catch (err) {
    throw new Error("Failed to calculate distance: " + err.message);
  }
}

module.exports = calculateDistance;