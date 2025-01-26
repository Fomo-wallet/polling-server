const { ethers } = require("ethers");
const axios = require("axios");
const crypto = require("crypto");
require("dotenv").config();
const contractABI = require("../helpers/contractAbi.json");
const { decryptAES } = require("./decryptAES");

const getIpfsData = async (hash) => {
    try {
        const response = await axios.get(`https://gateway.pinata.cloud/ipfs/${hash}`);
        return response.data;
    } catch (error) {
        console.error("Error fetching from IPFS:", error.message);
        throw error;
    }
};

const readAndSendHint = async (betId, userBettedAmount) => {
    try {
        const privateKey = process.env.PRIVATE_KEY;
        const signer = new ethers.Wallet(privateKey, new ethers.JsonRpcProvider(process.env.RPC_URL));
        const contract = new ethers.Contract(process.env.CONTRACT_ADDRESS, contractABI, signer);

        // Fetch the IPFS hash from the contract
        const ipfsHash = await contract.betsToUrl(betId);
        console.log(`Retrieved IPFS hash: ${ipfsHash}`);

        // Retrieve encrypted metadata from IPFS
        const metadata = await getIpfsData(ipfsHash);

        const { iv, encryptedData } = metadata;
        const aesKey = "AGENT_KEY"; // Shared AES key

        // Decrypt the secret number
        const secretNumber = decryptAES(encryptedData, iv, aesKey);
        console.log(`Decrypted secret number: ${secretNumber}`);

        // Compare the decrypted secret number with the user's bet amount
        const scaledSecretNumber = Math.floor(Number(secretNumber));
        const scaledUserBettedAmount = Math.floor(Number(userBettedAmount) / 1e18);

        const threshold = Math.floor(scaledSecretNumber);
        console.log("The scaled secret number is:", scaledSecretNumber);
        console.log("The threshold is:", threshold);
        console.log("The scaled User Betted amount is:", scaledUserBettedAmount);

        const result = scaledUserBettedAmount === threshold
            ? "User guessed correctly!"
            : "User guessed incorrectly.";

        console.log(result);

        return {scaledUserBettedAmount , scaledSecretNumber };
    } catch (error) {
        console.error("Error in readAndSendHint:", error.message);
        throw error;
    }
};

module.exports = {
    readAndSendHint,
};
