const nodemailer = require("nodemailer");
const { readAndSendHint } = require("./ReadAndSendHint.js");
const { callUserApi } = require("./callUserAPI.js");
require("dotenv").config();

// Email transporter setup
const transporter = nodemailer.createTransport({
    host: "smtp.gmail.com",
    port: 587,
    secure: false,
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASSWORD,
    },
});

// Function to interact with the LLM
async function getAIResponse(userBettedAmount, actualValue) {
    try {
        const response = await fetch('http://localhost:11434/api/generate', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                model: "llama3.2",
                prompt: `You are playing a number guessing game. The target number is hidden. The user guessed ${userBettedAmount} and the actual amount is ${actualValue} hidden. Provide a helpful response indicating if they're getting warmer or colder, and give a fun encouraging message. Keep the response under 3 sentences. It shdould tell user to go higher or lower on the basis of there amount to reach the traget amount and never reveal the actual amount dont reveal the target number or how much users bet is away from target`,
                stream: false,
            }),
        });

        const data = await response.json();
        console.log(data);
        return data.response;
    } catch (error) {
        console.error('LLM API error:', error);
        throw new Error('Failed to get AI response');
    }
}

async function callApiForPlacedBets(bet) {
    try {
        console.log(bet);

        // Extract bettor email and Twitter handle
        const { bettorEmail, bettorTwitter, betId, amount } = bet;

        if (!bettorEmail || !bettorTwitter) {
            throw new Error("Missing required email or Twitter handle in bet data");
        }

        // write fhevmJs function here to get the reencrypted amount 
        const { scaledUserBettedAmount: userBettedValue, scaledSecretNumber: actualValue } = await readAndSendHint(betId, amount);
        console.log('maybe here ?', userBettedValue, actualValue);
        // Get AI-generated message
        const aiResponse = await getAIResponse(userBettedValue, actualValue);
        console.log('not here bro')
        // Prepare the email content
        const mailOptions = {
            from: process.env.EMAIL_USER,
            to: bettorEmail,
            subject: "Thank You for Placing Your Bet! 🎲",
            html: `
                <!DOCTYPE html>
                <html>
                <head>
                    <style>
                        .container {
                            max-width: 600px;
                            margin: auto;
                            padding: 20px;
                            font-family: Arial, sans-serif;
                            background-color: #ffffff;
                        }
                        .header {
                            background: #4CAF50;
                            color: white;
                            padding: 20px;
                            text-align: center;
                            border-radius: 10px;
                            margin-bottom: 20px;
                        }
                        .content {
                            margin: 20px 0;
                            line-height: 1.6;
                            color: #333333;
                            padding: 20px;
                            background-color: #f8f9fa;
                            border-radius: 10px;
                        }
                        .info {
                            font-size: 18px;
                            margin: 15px 0;
                        }
                    </style>
                </head>
                <body>
                    <div class="container">
                        <div class="header">
                            <h1>Thank You for Betting with Us! 🎉</h1>
                        </div>
                        <div class="content">
                            <p class="info">Hi there!</p>
                            <p class="info">Agent's Messge:</p>
                            <p class="info" style="font-style: italic; color: #4CAF50;">${aiResponse}</p>
                            <p>Thank you for placing your bet. We appreciate your participation and hope you enjoy the game!</p>
                        </div>
                    </div>
                </body>
                </html>
            `,
        };

        // Send the email
        const info = await transporter.sendMail(mailOptions);
        console.log(`Email sent to ${bettorEmail}: ${info.messageId}`);

        await callUserApi(bet.bettorTwitter);
    } catch (error) {
        console.error("Error in callApiForPlacedBets:", error.message);
    }
}

module.exports = { callApiForPlacedBets };