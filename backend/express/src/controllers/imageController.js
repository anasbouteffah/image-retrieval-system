const fs = require("fs");
const path = require("path");
const Image = require("../models/imageModel");

// Upload Image
const uploadImage = (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: "No file uploaded" });
  }

  try {
    // Save metadata to MongoDB
    const image = new Image({
      filename: req.file.filename,
      path: req.file.path,
      size: req.file.size,
    });

    image
      .save()
      .then((savedImage) => {
        res.status(200).json({
          message: "Image uploaded successfully!",
          file: req.file,
          dbRecord: savedImage,
        });
      })
      .catch((err) => {
        console.error("Error saving to database:", err);
        res
          .status(500)
          .json({ error: "Failed to save image metadata to database" });
      });
  } catch (err) {
    console.error("Error during upload:", err);
    res.status(500).json({ error: "Internal server error" });
  }
};

// List Images
const listImages = (req, res) => {
  Image.find()
    .then((images) => {
      res.status(200).json({ images });
    })
    .catch((err) => {
      console.error("Error fetching images:", err);
      res.status(500).json({ error: "Failed to fetch images" });
    });
};

// Delete Image
const deleteImage = async (req, res) => {
  const imageName = req.params.id; // Get the image filename from the URL parameter
  const imagePath = path.join(__dirname, "../uploads", imageName);

  if (!fs.existsSync(imagePath)) {
    return res.status(404).json({ error: "Image not found" });
  }

  try {
    // Delete the file from the filesystem
    fs.unlinkSync(imagePath);

    // Delete the image record from MongoDB
    await Image.deleteOne({ filename: imageName });

    res.status(200).json({ message: "Image deleted successfully" });
  } catch (err) {
    console.error("Error during deletion:", err);
    res.status(500).json({ error: "Failed to delete image" });
  }
};


// Delete Multiple Images
const deleteMultipleImages = async (req, res) => {
  const imagesToDelete = req.body.images;

  try {
    // Delete files from disk
    imagesToDelete.forEach((imageName) => {
      const imagePath = path.join(__dirname, "../uploads", imageName);
      if (fs.existsSync(imagePath)) {
        fs.unlinkSync(imagePath); // Delete file
      }
    });

    // Delete records from MongoDB
    await Image.deleteMany({ filename: { $in: imagesToDelete } });

    res.status(200).json({ message: "Images deleted successfully" });
  } catch (err) {
    console.error("Error during multiple deletions:", err);
    res.status(500).json({ error: "Failed to delete images" });
  }
};

module.exports = { uploadImage, listImages, deleteImage, deleteMultipleImages };
