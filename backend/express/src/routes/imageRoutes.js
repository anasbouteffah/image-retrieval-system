// src/routes/imageRoutes.js

const express = require("express");
const router = express.Router();
const multer = require("multer");
const path = require("path");
const fs = require("fs");

const {
  uploadImage,
  listImages,
  deleteImage,
  assignCategory, // Import the assignCategory controller
  deleteMultipleImages,
} = require("../controllers/imageController");

// Setup multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadPath = path.join(__dirname, "../uploads");
    if (!fs.existsSync(uploadPath)) {
      fs.mkdirSync(uploadPath, { recursive: true });
    }
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    cb(null, `${Date.now()}-${file.originalname}`);
  },
});

const upload = multer({ storage });

// Routes
router.post("/upload", upload.array("images", 10), uploadImage); // Handle multiple files with category
router.get("/list", listImages); // Fetch images, optionally filtered by category
router.post("/delete-multiple", deleteMultipleImages);
router.delete("/:id", deleteImage);
router.post("/assign-category", assignCategory); // Category assignment route

module.exports = router;
