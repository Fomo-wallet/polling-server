const axios = require("axios");

// Utility function to store blob on Pinata
async function storeBlob(data) {
  try {
    // Verify data is provided
    if (!data) {
      throw new Error("No data provided to storeBlob");
    }

    // Prepare payload for Pinata
    const payload = {
      pinataOptions: {
        cidVersion: 1,
      },
      pinataMetadata: {
        name: `encrypted-pack-${Date.now()}`,
        keyvalues: {
          type: "encrypted-card-pack",
        },
      },
      pinataContent: data,
    };

    // Pinata API request configuration
    const config = {
      method: "post",
      url: "https://api.pinata.cloud/pinning/pinJSONToIPFS",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.PINATA_JWT}`, // Use JWT from environment variables
      },
      data: JSON.stringify(payload),
    };

    // Send request to Pinata
    const response = await axios(config);

    // Retrieve and log IPFS hash
    const ipfsHash = response.data.IpfsHash;
    console.log(`Stored blob on IPFS with hash: ${ipfsHash}`);
    return ipfsHash;
  } catch (error) {
    console.error("Error storing blob on Pinata:", error.message);
    throw error;
  }
}

module.exports = { storeBlob };
