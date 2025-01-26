const express = require("express");
const cors = require("cors");
const { startPolling } = require("./controllers/eventsController");
require('dotenv').config();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Start polling when the server starts
startPolling();

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
