const path = require("path");
const fs = require("fs");

const multer = require("multer");
const path = require("path");

// Configure storage
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads/"); // Save images to 'uploads' folder
  },
  filename: (req, file, cb) => {
    cb(null, `${Date.now()}-${file.originalname}`);
  },
});

const upload = multer({ storage });

// Upload an image
const uploadImage = (req, res) => {
  upload.single("image")(req, res, (err) => {
    if (err) {
      return res.status(400).json({ error: err.message });
    }
    res
      .status(200)
      .json({ message: "Image uploaded successfully!", file: req.file });
  });
};


// List all images
const listImages = (req, res) => {
  res.status(200).json({ images: ["image1.jpg", "image2.png"] });
};

// Delete an image
const deleteImage = (req, res) => {
  const { id } = req.params;
  res.status(200).json({ message: `Image with ID ${id} deleted.` });
};

module.exports = { uploadImage, listImages, deleteImage };
