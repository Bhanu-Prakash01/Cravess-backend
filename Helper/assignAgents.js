const Order = require("../models/orderSchema");
const DeliveryAgent = require("../models/DeliveryAgentDetails");


function haversineDistance(coord1, coord2) {
  const R = 6371; 
  const toRadians = (degree) => degree * (Math.PI / 180);

  const lat1 = coord1[0];
  const lon1 = coord1[1];
  const lat2 = coord2[0];
  const lon2 = coord2[1];

  const dLat = toRadians(lat2 - lat1);
  const dLon = toRadians(lon2 - lon1);

  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(toRadians(lat1)) * Math.cos(toRadians(lat2)) *
            Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c; // Distance in km
}

async function findNearestAgent(availableAgents, userLocation) {
  if (!availableAgents || availableAgents.length === 0) {
      console.log("No available agents found.");
      return null;
  }
  const availableAgentDetails = await DeliveryAgent.find({ _id: { $in: availableAgents } }, { _id: 1, location: 1 });

    if (!availableAgentDetails || availableAgentDetails.length === 0) {
        console.log("No agents found in database.");
        return null;
    }


  let nearestAgent = null;
  let minDistance = Infinity;

  for (const agent of availableAgentDetails) {
      const distance = haversineDistance(agent.location.coordinates, userLocation.coordinates);
      console.log(`Distance to agent ${agent._id}: ${distance} km`);

      if (distance < minDistance) {
          minDistance = distance;
          nearestAgent = agent;
      }
  }
  return nearestAgent;
}


async function assignAgentWithTimeout(order, agent) {
  if (!agent) {
      return;
  }
  await sendOrderRequestToAgent(agent, order._id);

  setTimeout(async () => {
      const updatedOrder = await Order.findById(order._id).populate("deliveryDetails.deliveryAddress");
      if (updatedOrder.orderStatus === "Assigning") {
          const nextAgent = await findNearestAgent(
              await DeliveryAgent.find({ availabilityStatus: "Available", _id: { $ne: agent._id } }),
              updatedOrder.deliveryDetails.deliveryAddress.location
          );
          if (nextAgent) {
              await assignAgentWithTimeout(updatedOrder, nextAgent);
          } else {
              console.log("No other agents available.");
          }
      }
  }, 3 * 60 * 1000); // 3 minutes timeout
}

async function sendOrderRequestToAgent(agent, orderId) {
    try {  
      await DeliveryAgent.findByIdAndUpdate(agent._id, {
        availabilityStatus: "Available",
        $push: { requestedOrders: orderId }, // Add order ID to requestedOrders
      });
  
      await Order.findByIdAndUpdate(orderId, { deliveryAgent: agent._id });
        setTimeout(async () => {
        const order = await Order.findById(orderId);
        if (order && order.orderStatus === "Assigning") {
          await DeliveryAgent.findByIdAndUpdate(agent._id, {
            $pull: { requestedOrders: orderId }, // Remove order from requestedOrders
          });
        }
      }, 5 * 60 * 1000); // 5 minutes timeout
  
      return { success: true, message: `Order ${orderId} sent to agent ${agent._id}` };
    } catch (error) {
      return { error: error.message };
    }
  }
  

module.exports = {
  findNearestAgent,
  assignAgentWithTimeout
};