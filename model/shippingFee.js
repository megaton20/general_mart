// models/shippingFee.js

function calculateShippingFee(location) {
    let shippingFee;

    switch (location.toLowerCase()) {
        // Cross River LGAs
        case 'calabar-municipal':
            shippingFee = 2000;  // Shipping fee for Calabar Municipal
            break;
        case 'calabar-south':
            shippingFee = 2500;  // Shipping fee for Calabar South
            break;
        case 'akpabuyo':
            shippingFee = 3000;  // Shipping fee for Akpabuyo
            break;

        // Lagos LGAs
        case 'ikeja':
            shippingFee = 4000;  // Shipping fee for Ikeja
            break;
        case 'surulere':
            shippingFee = 3500;  // Shipping fee for Surulere
            break;
        case 'lekki':
            shippingFee = 5000;  // Shipping fee for Lekki
            break;
        case 'victoria-island':
            shippingFee = 5500;  // Shipping fee for Victoria Island
            break;
        case 'yaba':
            shippingFee = 3000;  // Shipping fee for Yaba
            break;

        // Default for other known LGAs
        case 'uyo':
            shippingFee = 700;   // Shipping fee for Uyo
            break;

        // Error handling for unknown locations
        default:
            return shippingFee = 0; 
    }

    // Cap the shipping fee to a maximum of NGN 15,000 if necessary
    if (shippingFee > 15000) {
        shippingFee = 15000;
    }

    return shippingFee;
}

module.exports = calculateShippingFee;
