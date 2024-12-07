// routes/categoryRoutes.js
const express = require("express");
const router = express.Router();
const Category = require("../models/categoryModel");

// Get all categories
router.get("/", async (req, res) => {
  try {
    const categories = await Category.find().sort({ name: 1 }); // Sort alphabetically
    res.status(200).json({ categories });
  } catch (err) {
    console.error("Error fetching categories:", err);
    res.status(500).json({ error: "Failed to fetch categories" });
  }
});

module.exports = router;
