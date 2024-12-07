const fs = require("fs");
const path = require("path");
const Image = require("../models/imageModel");
const Category = require("../models/categoryModel");

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
const uploadImage = async (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ error: "No files uploaded" });
    }

    const { categoryName } = req.body;

    if (!categoryName) {
      return res.status(400).json({ error: "Category is required" });
    }

    // Find the category by name
    const category = await Category.findOne({ name: categoryName });
    if (!category) {
      return res.status(400).json({ error: "Invalid category" });
    }

    const images = req.files.map((file) => ({
      filename: file.filename,
      path: file.path,
      size: file.size,
      uploadDate: new Date(),
      category: category._id, // Assign the category ObjectId
    }));

    const savedImages = await Image.insertMany(images);
    res.status(200).json({
      message: "Images uploaded successfully!",
      files: req.files,
      dbRecords: savedImages,
    });
  } catch (err) {
    console.error("Error uploading images:", err);
    res.status(500).json({ error: "Failed to upload images" });
  }
};

// List Images sorted by Category

const listImages = async (req, res) => {
  try {
    const { category } = req.query;

    let filter = {};
    if (category && category !== 'All') {
      const categoryDoc = await Category.findOne({ name: category });
      if (!categoryDoc) {
        return res.status(400).json({ error: 'Invalid category' });
      }
      filter.category = categoryDoc._id;
    }

    const images = await Image.find(filter).populate('category'); // Ensure 'category' is populated
    res.status(200).json({ images });
  } catch (err) {
    console.error('Error fetching images:', err);
    res.status(500).json({ error: 'Failed to fetch images' });
  }
};


// Delete Image
const deleteImage = async (req, res) => {
  const imageId = req.params.id; // This is now the MongoDB _id

  try {
    // Find the image document by _id
    const image = await Image.findById(imageId);

    if (!image) {
      return res.status(404).json({ error: "Image not found" });
    }

    const imagePath = path.join(__dirname, "../uploads", image.filename);

    if (fs.existsSync(imagePath)) {
      fs.unlinkSync(imagePath);
    }

    // Delete the image document from the database
    await Image.deleteOne({ _id: imageId });

    res.status(200).json({ message: "Image deleted successfully" });
  } catch (err) {
    console.error("Error during deletion:", err);
    res.status(500).json({ error: "Failed to delete image" });
  }
};

// Assign Category to Image
const assignCategory = async (req, res) => {
  try {
    const { imageId, categoryName } = req.body;

    if (!imageId || !categoryName) {
      return res
        .status(400)
        .json({ error: "Image ID and Category Name are required." });
    }

    // Find the category by name
    const category = await Category.findOne({ name: categoryName });
    if (!category) {
      return res.status(400).json({ error: "Invalid category name." });
    }

    // Update the image's category
    const updatedImage = await Image.findByIdAndUpdate(
      imageId,
      { category: category._id },
      { new: true }
    ).populate("category"); // Populate the category field for the response

    if (!updatedImage) {
      return res.status(404).json({ error: "Image not found." });
    }

    res.status(200).json({ updatedImage });
  } catch (err) {
    console.error("Error assigning category:", err);
    res.status(500).json({ error: "Failed to assign category." });
  }
};


// Filter Images by Category
const filterByCategory = async (req, res) => {
  const { category } = req.query;

  if (!allowedCategories.includes(category)) {
    return res.status(400).json({
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

const deleteMultipleImages = async (req, res) => {
  const { imageIds } = req.body; // Expecting an array of image IDs

  if (!Array.isArray(imageIds) || imageIds.length === 0) {
    return res.status(400).json({ error: "No images selected for deletion" });
  }

  try {
    // Find the images to delete by their IDs
    const imagesToDelete = await Image.find({ _id: { $in: imageIds } });

    if (imagesToDelete.length === 0) {
      return res.status(404).json({ error: "No images found" });
    }

    // Delete the image files from the filesystem
    imagesToDelete.forEach((image) => {
      const imagePath = path.join(__dirname, "../uploads", image.filename);
      if (fs.existsSync(imagePath)) {
        fs.unlinkSync(imagePath);
      }
    });

    // Delete images from the database
    await Image.deleteMany({ _id: { $in: imageIds } });

    res.status(200).json({ message: "Images deleted successfully" });
  } catch (err) {
    console.error("Error deleting images:", err);
    res.status(500).json({ error: "Failed to delete images" });
  }
};

module.exports = {
  uploadImage,
  listImages,
  deleteImage,
  assignCategory,
  filterByCategory,
  deleteMultipleImages,
};
