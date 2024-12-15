const express = require("express");
const axios = require("axios");

const router = express.Router();

// POST: Compute descriptors for an existing image
router.post("/compute", async (req, res) => {
  try {
    const { filename } = req.body;

    if (!filename) {
      return res.status(400).json({ error: "No filename provided" });
    }

    // Send request to Flask API with filename
    const flaskUrl = `http://localhost:5001/compute-descriptors`;
    const response = await axios.post(flaskUrl, { filename });

    res.status(200).json(response.data);
  } catch (err) {
    console.error("Error computing descriptors:", err);
    res.status(500).json({ error: "Failed to compute descriptors" });
  }
});

module.exports = router;
