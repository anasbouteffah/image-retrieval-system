const express = require("express");
const router = express.Router();
const multer = require("multer");
const path = require("path");
const fs = require("fs");

const {
  uploadImage,
  listImages,
  deleteImage,
  assignCategory,
  filterByCategory,
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
router.post("/upload", upload.single("image"), uploadImage);
router.get("/list", listImages);
router.delete("/:id", deleteImage);
router.post("/assign-category", assignCategory); // New route
router.get("/filter", filterByCategory); // New route

module.exports = router;
