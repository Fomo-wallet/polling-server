const axios = require('axios');
require('dotenv').config();

async function callApiForCreatedBets(bet) {
    try {
        const apiUrl = "http://localhost:8000/api/tweet/send"; // Replace with your API URL
        console.log(bet.betId, bet.amount, bet.hostTwitter);
        // Build the payload
        const payload = {
            username: bet.hostTwitter, // Ensure this field exists and is correct
            amount: Number(bet.amount), // Divide by 1e6 to adjust for 6 decimals and round down
            betid: Number(bet.betId),
            chainid: 5003,
            contractAddress: "0x8Ee9cE6002cc654c59AE7eA36Cf25226bb8cD73C",
        };

        // Log the payload for debugging
        console.log("Payload:", payload);

        // Make the API call
        const response = await axios.post(apiUrl, payload);

        console.log(`API Response for Bet ID ${bet.betId}:`, response.data);
    } catch (error) {
        console.error(
            `Error calling API for Bet ID ${bet.betId}:`,
            error.response?.data || error.message
        );
    }
}

module.exports = { callApiForCreatedBets };