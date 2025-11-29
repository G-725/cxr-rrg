const mongoose = require("mongoose");

const reportSchema = new mongoose.Schema(
  {
    userEmail: { type: String, required: true },
    notes: { type: String },
    imagePath: { type: String, required: true },
    aiReport: { type: Object, required: true } // can store any JSON from MedGamma
  },
  { timestamps: true }
);

module.exports = mongoose.model("Report", reportSchema);
