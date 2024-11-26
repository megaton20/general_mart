// quoteService.js
const axios = require('axios');
const cron = require('node-cron');

let dailyQuote = null; // Variable to hold the daily quote

// Define function to fetch the daily quote
async function getDailyQuote() {
  try {
    const response = await axios.get('https://api.forismatic.com/api/1.0/?method=getQuote&format=json&lang=en');
    const quote = response.data;
    dailyQuote = quote;  // Update the stored daily quote
  } catch (error) {
    console.error("Error fetching the quote:", error.message);
    dailyQuote = {
      quoteText:"",
      quoteAuthor:""
    };  // Reset to null if there's an error
  }
}

// Initialize the daily quote when the module is first loaded
(async () => {
  await getDailyQuote();
})();

// Schedule the task to run every day at 8 AM to update `dailyQuote`
cron.schedule('0 8 * * *', async () => {
  console.log("Fetching new daily quote...");
  await getDailyQuote();
});

// Export the daily quote and the function
module.exports = {
  getDailyQuote,
  getCurrentDailyQuote: () => dailyQuote
};