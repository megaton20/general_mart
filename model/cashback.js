// models/cashback.js

function calculateCashback(amountSpent) {
    let cashback = 0;

    if (amountSpent > 20000) {
        cashback = 60.00;  // NGN 10 cashback for items above NGN 20,000
    } else if (amountSpent > 10000) {
        cashback = 40.00;   // NGN 5 cashback for items between NGN 10,001 and NGN 20,000
    } else if (amountSpent > 5000) {
        cashback = 10.00;   // NGN 2 cashback for items between NGN 5,001 and NGN 10,000
    } else {
        cashback = 5.00;   // NGN 1 cashback for items below NGN 5,000
    }

    return cashback;
}

module.exports = calculateCashback;
