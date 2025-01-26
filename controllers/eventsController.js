// File: controllers/eventsController.js
const { ethers } = require("ethers");
const fs = require("fs");
const path = require("path");
const eventHandlers = require("../handlers/eventHandlers"); // Import event handlers

// Contract and RPC Configuration
const CONTRACT_ADDRESS = process.env.CONTRACT_ADDRESS; // Replace with your contract address
const ABI = [
  "event BetCreated(uint256 betId, uint256 amount, string hostTwitter, address host, uint256 endTimeStamp, string privateKey, string hostEmail)",
  "event BetActivated(uint256 betId, string tokenURI)",
  "event BetPlaced(uint256 betId, address bettor, string bettorTwitter, string bettorEmail, uint256 amount)",
  "event BetClosed(uint256 betId, address winner, string winnerTwitter, string winnerEmail, uint256 actualAmount)",
  "event BetCancelled(uint256 betId, address host)"
]; // Contract ABI

const RPC_URL = process.env.RPC_URL; // Replace with your RPC URL
const OUTPUT_FILE = path.join(__dirname, "../data/IndexedEvents.json");
const provider = new ethers.JsonRpcProvider(RPC_URL);
const contract = new ethers.Contract(CONTRACT_ADDRESS, ABI, provider);

let lastBlockScanned = 0;
const MAX_BLOCK_RANGE = 10000; // Maximum block range to avoid errors

// Ensure the data directory and file exist
const ensureDataFileExists = () => {
  if (!fs.existsSync(OUTPUT_FILE)) {
    fs.writeFileSync(OUTPUT_FILE, JSON.stringify([], null, 2), "utf-8");
  }
};

// Check if an event already exists in the file
const isEventIndexed = (event) => {
  const existingData = JSON.parse(fs.readFileSync(OUTPUT_FILE, "utf-8"));
  return existingData.some(
    (e) => e.transactionHash === event.transactionHash && e.eventName === event.eventName
  );
};

// Save new events to the file
const saveEvents = (newEvents) => {
  const existingData = JSON.parse(fs.readFileSync(OUTPUT_FILE, "utf-8"));
  const updatedData = [...existingData, ...newEvents.map(event => ({
    ...event,
    args: Object.fromEntries(
      Object.entries(event.args).map(([key, value]) =>
        typeof value === 'bigint' ? [key, value.toString()] : [key, value]
      )
    )
  }))];
  fs.writeFileSync(OUTPUT_FILE, JSON.stringify(updatedData, null, 2), "utf-8");
};

// Fetch and process contract events
const fetchAndIndexEvents = async () => {
  try {
    console.log("Polling contract events...");

    const currentBlock = await provider.getBlockNumber();
    const fromBlock = Math.max(currentBlock - MAX_BLOCK_RANGE, lastBlockScanned + 1);
    const toBlock = currentBlock;

    if (fromBlock > toBlock) {
      console.log("No new blocks to process.");
      return;
    }

    const filters = [
      { name: "BetCreated", filter: contract.filters.BetCreated() },
      { name: "BetActivated", filter: contract.filters.BetActivated() },
      { name: "BetPlaced", filter: contract.filters.BetPlaced() },
      { name: "BetClosed", filter: contract.filters.BetClosed() },
      { name: "BetCancelled", filter: contract.filters.BetCancelled() },
    ];

    let newEvents = [];

    for (const { name, filter } of filters) {
      const events = await contract.queryFilter(filter, fromBlock, toBlock);
      events.forEach((event) => {
        const parsedEvent = {
          transactionHash: event.transactionHash,
          blockNumber: event.blockNumber,
          eventName: name,
          args: event.args,
        };
        if (!isEventIndexed(parsedEvent)) {
          newEvents.push(parsedEvent);

          // Call specific handler based on event name
          if (eventHandlers[name]) {
            eventHandlers[name](parsedEvent);
          } else {
            console.warn(`No handler defined for event: ${name}`);
          }
        }
      });
    }

    if (newEvents.length > 0) {
      console.log(`Indexing ${newEvents.length} new events...`);
      saveEvents(newEvents);
    } else {
      console.log("No new events to index.");
    }

    lastBlockScanned = toBlock; // Update last scanned block
  } catch (error) {
    console.error("Error polling events:", error);
  }
};

function startPolling() {
  // Start periodic polling
  setInterval(fetchAndIndexEvents, 5000); // Poll every 5 seconds
}

// Ensure file exists on startup
ensureDataFileExists();

module.exports = { startPolling };
