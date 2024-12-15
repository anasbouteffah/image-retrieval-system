const fs = require("fs");
const path = require("path");
const mongoose = require("mongoose");
const axios = require("axios"); // Use Axios for HTTP requests
const Image = require("./models/imageModel");
const Category = require("./models/categoryModel");
require("dotenv").config();

mongoose
  .connect("mongodb://localhost:27017/imagesDB", {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(async () => {
    console.log("Connected to MongoDB for image seeding.");

    const categoryMapping = {
      aGrass: "Agriculture",
      bField: "Urban",
      cIndustry: "Industry",
      dRiverLake: "River",
      eForest: "Forest",
      fResident: "Resident",
      gParking: "Park",
    };

    const baseDir = path.join(__dirname, "RSSCN7-master");

    for (const [folderName, categoryName] of Object.entries(categoryMapping)) {
      const categoryDir = path.join(baseDir, folderName);

      if (!fs.existsSync(categoryDir)) {
        console.error(
          `Directory for folder '${folderName}' not found. Skipping.`
        );
        continue;
      }

      // Ensure the category exists in the database
      let categoryDoc = await Category.findOne({ name: categoryName });
      if (!categoryDoc) {
        console.error(`Category '${categoryName}' does not exist. Skipping.`);
        continue;
      }

      const files = fs.readdirSync(categoryDir);

      for (const file of files) {
        const filePath = path.join(categoryDir, file);
        const stats = fs.statSync(filePath);

        // Check if the image already exists in the database
        const existingImage = await Image.findOne({ filename: file });
        if (existingImage) {
          console.log(`Image '${file}' already exists. Skipping.`);
          continue;
        }

        // Save the image metadata in MongoDB
        try {
          const image = new Image({
            filename: file,
            path: filePath,
            size: stats.size,
            category: categoryDoc._id,
          });
          await image.save();

          // Send image to Flask API for descriptor computation
          const response = await axios.post(
            "http://localhost:5001/api/descriptors/compute",
            {
              filename: filePath,
            }
          );

          if (response.data && response.data.descriptors) {
            // Update the image with the computed descriptors
            image.descriptors = response.data.descriptors;
            await image.save();
            console.log(`Descriptors for '${file}' computed and saved.`);
          } else {
            console.error(`Failed to compute descriptors for '${file}'.`);
          }
        } catch (error) {
          console.error(`Error processing image '${file}':`, error);
        }
      }
    }

    mongoose.disconnect();
    console.log("Image seeding process completed.");
  })
  .catch((err) => {
    console.error("Error connecting to MongoDB:", err);
  });
