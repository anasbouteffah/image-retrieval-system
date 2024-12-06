const fs = require("fs");
const path = require("path");
const Image = require("../models/imageModel");

// Allowed categories for images
const allowedCategories = [
  "Resident",
  "Forest",
  "Industry",
  "Agriculture",
  "Park",
  "Urban",
  "River",
];

// Upload Image
const uploadImage = (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: "No file uploaded" });
  }

  try {
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
  const imageName = req.params.id;
  const imagePath = path.join(__dirname, "../uploads", imageName);

  if (!fs.existsSync(imagePath)) {
    return res.status(404).json({ error: "Image not found" });
  }

  try {
    fs.unlinkSync(imagePath);
    await Image.deleteOne({ filename: imageName });

    res.status(200).json({ message: "Image deleted successfully" });
  } catch (err) {
    console.error("Error during deletion:", err);
    res.status(500).json({ error: "Failed to delete image" });
  }
};

// Assign Category to Image
const assignCategory = async (req, res) => {
  const { imageId, category } = req.body;

  if (!allowedCategories.includes(category)) {
    return res
      .status(400)
      .json({
        error: `Invalid category. Allowed categories are: ${allowedCategories.join(
          ", "
        )}`,
      });
  }

  try {
    const updatedImage = await Image.findByIdAndUpdate(
      imageId,
      { category },
      { new: true } // Return the updated document
    );

    if (!updatedImage) {
      return res.status(404).json({ error: "Image not found" });
    }

    res
      .status(200)
      .json({ message: "Category assigned successfully", updatedImage });
  } catch (err) {
    console.error("Error assigning category:", err);
    res.status(500).json({ error: "Failed to assign category" });
  }
};

// Filter Images by Category
const filterByCategory = async (req, res) => {
  const { category } = req.query;

  if (!allowedCategories.includes(category)) {
    return res
      .status(400)
      .json({
        error: `Invalid category. Allowed categories are: ${allowedCategories.join(
          ", "
        )}`,
      });
  }

  try {
    const images = await Image.find({ category });
    res.status(200).json({ images });
  } catch (err) {
    console.error("Error filtering by category:", err);
    res.status(500).json({ error: "Failed to filter images" });
  }
};

module.exports = {
  uploadImage,
  listImages,
  deleteImage,
  assignCategory,
  filterByCategory,
};
