// seedCategories.js
const mongoose = require("mongoose");
const Category = require("./models/categoryModel");
require("dotenv").config();

const categories = [
  "Resident",
  "Forest",
  "Industry",
  "Agriculture",
  "Park",
  "Urban",
  "River",
  "autre"
];

mongoose
  .connect("mongodb://localhost:27017/imagesDB")
  .then(async () => {
    console.log("Connected to MongoDB for seeding categories.");
    for (const cat of categories) {
      const exists = await Category.findOne({ name: cat });
      if (!exists) {
        await Category.create({ name: cat });
        console.log(`Category '${cat}' added.`);
      } else {
        console.log(`Category '${cat}' already exists.`);
      }
    }
    mongoose.disconnect();
  })
  .catch((err) => {
    console.error("Error connecting to MongoDB:", err);
  });
