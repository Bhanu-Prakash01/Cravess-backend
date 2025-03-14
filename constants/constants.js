const CONSTANTS = {

    ENUM:{
        ROLES:["Admin", "DeliveryAgent", "Restaurant", "User"],
        ORDER_STATUS:["Placed","Accepted","Assigning", "Processing","Dispatched", "Delivered", "Cancelled"],
        DELIVERY_STATUS:["Pending", "Out for Delivery", "Delivered", "Cancelled"],
        PAYMENT_STATUS:["Pending", "Completed", "Failed"],
        PAYMENT_MODE:["Cash", "Card", "UPI","Wallet","Online"],
        DISH_TYPE:["Appetizer", "Main Course", "Dessert", "Beverage","Starters", "Salads", "Sides", "Soups", "Breads", "Bakery", "Other"],
        DISH_CATEGORY:["Veg", "NonVeg"],
        LOCATION:["Point"],
        GENDER:["Male", "Female", "Other"],
        AVAILABILITY_STATUS:["Available", "Unavailable"],
        DELIVERY_AGENT_AVAILABILITY_STATUS:["Available", "Unavailable", "On Delivery"],
        COMPLIANCE_TYPE: ["Health", "Safety", "Licensing"],
        COMPLIANCE_STATUS: ["Compliant", "Non-Compliant", "Pending"],
        T_SHIRT_SIZE:["2xs","xs","s", "m", "l", "xl", "2xl"],
        SUPPORT_ISSUE_TYPE:["Technical", "Billing", "General"],
        SUPPORT_TICKET_PRIORITIES: ["High", "Medium", "Low"],
        SUPPORT_TICKET_STATUS:["Open", "In Progress", "Resolved", "Closed"],
        USER_ADDRESS_TYPE: ["Home","Office","Other",],
        DISCOUNT_TYPE:["Percentage", "Flat"],
        EARNED_FROM:["Order", "Promotion", "Referral", "Other"],
    }

};

module.exports = CONSTANTS;

