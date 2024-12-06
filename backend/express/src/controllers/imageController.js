const fs = require("fs");
const path = require("path");
const Image = require("../models/imageModel"); // Image model to save data to MongoDB

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

    // Save image metadata to the database
    image
      .save()
      .then((savedImage) => {
        console.log("Uploaded file:", req.file);
        res.status(200).json({
          message: "Image uploaded successfully!",
          file: req.file,
          dbRecord: savedImage, // Return saved metadata
        });
      })
      .catch((dbErr) => {
        console.error("Error saving to database:", dbErr);
        res
          .status(500)
          .json({ error: "Failed to save image metadata to database" });
      });
  } catch (err) {
    console.error("Error during upload:", err);
    res.status(400).json({ error: err.message });
  }
};

// List Images
const listImages = async (req, res) => {
  try {
    // Retrieve images from MongoDB
    const images = await Image.find({});

    // Map over the images and add a URL field for each image
    const imagesWithUrls = images.map((image) => ({
      filename: image.filename,
      url: `http://localhost:${process.env.PORT || 5000}/uploads/${
        image.filename
      }`,
      size: image.size,
      uploadDate: image.uploadDate,
    }));

    res.status(200).json({ images: imagesWithUrls });
  } catch (err) {
    console.error("Error fetching images:", err);
    res.status(500).json({ error: "Failed to fetch images from the database" });
  }
};

// Delete Image
const deleteImage = (req, res) => {
  const imagePath = path.join(__dirname, "../uploads", req.params.id);

  if (!fs.existsSync(imagePath)) {
    return res.status(404).json({ error: "File not found" });
  }

  fs.unlink(imagePath, (err) => {
    if (err) {
      return res.status(500).json({ error: "Failed to delete file" });
    }

    res.status(200).json({ message: "Image deleted successfully" });
  });
};

module.exports = { uploadImage, listImages, deleteImage };
