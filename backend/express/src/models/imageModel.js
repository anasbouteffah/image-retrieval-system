const mongoose = require("mongoose");

const imageSchema = new mongoose.Schema({
  filename: { type: String, required: true },
  path: { type: String, required: true },
  size: { type: Number, required: true },
  uploadDate: { type: Date, default: Date.now },
  category: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Category",
    required: true,
  },
  descriptors: { type: Object },
});

module.exports = mongoose.model("Image", imageSchema);
