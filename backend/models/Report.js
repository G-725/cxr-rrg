const mongoose = require("mongoose");

const reportSchema = new mongoose.Schema(
  {
    userEmail: { type: String, required: true },
    userName: { type: String }, // Added to store user's display name
    patientName: { type: String, required: true }, // Added patient name
    ectNumber: { type: String }, // Added ECT Number
    notes: { type: String },
    imagePath: { type: String, required: true },
    aiReport: { type: Object, required: true } // can store any JSON from MedGamma
  },
  { timestamps: true }
);

module.exports = mongoose.model("Report", reportSchema);
