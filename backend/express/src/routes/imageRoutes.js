const express = require("express");
const router = express.Router();
const {
  uploadImage,
  listImages,
  deleteImage,
} = require("../controllers/imageController");

// Routes
router.post("/upload", uploadImage); // Upload an image
router.get("/list", listImages); // List all images
router.delete("/:id", deleteImage); // Delete an image by ID

module.exports = router;
