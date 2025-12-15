require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const bcrypt = require("bcryptjs");
const multer = require("multer");
const path = require("path");

const User = require("./models/User");
const Report = require("./models/Report");

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Serve uploaded images
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// Multer config for file upload
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "uploads/");
  },
  filename: function (req, file, cb) {
    const uniqueName = Date.now() + "-" + file.originalname;
    cb(null, uniqueName);
  }
});

const upload = multer({ storage });

// MongoDB connect
if (process.env.MONGO_URI) {
  mongoose
    .connect(process.env.MONGO_URI)
    .then(() => console.log("✅ MongoDB connected"))
    .catch((err) => console.error("Mongo error:", err));
} else {
  console.warn("⚠️  MONGO_URI not set. Skipping MongoDB connection (server will run without DB).");
}

// ---------------- AUTH ROUTES ----------------

// POST /api/auth/register  (only user registration)
app.post("/api/auth/register", async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password)
      return res.status(400).json({ error: "Email and password required" });

    const existing = await User.findOne({ email });
    if (existing) {
      return res.status(400).json({ error: "User already exists" });
    }

    const hashed = await bcrypt.hash(password, 10);

    const user = await User.create({
      email,
      password: hashed,
      name: req.body.name || "",
      role: "user"
    });

    res.json({ message: "User registered", user: { email: user.email, role: user.role } });
  } catch (err) {
    console.error("Register error:", err);
    res.status(500).json({ error: "Registration failed" });
  }
});

// POST /api/auth/login (user + doctor)
app.post("/api/auth/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    // Doctor fixed login from .env
    if (
      email === process.env.DOCTOR_EMAIL &&
      password === process.env.DOCTOR_PASSWORD
    ) {
      return res.json({
        message: "Doctor login success",
        role: "doctor",
        email: process.env.DOCTOR_EMAIL
      });
    }

    // Normal user login
    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ error: "Invalid email or password" });

    const ok = await bcrypt.compare(password, user.password);
    if (!ok) return res.status(400).json({ error: "Invalid email or password" });

    res.json({
      message: "User login success",
      role: user.role || "user",
      email: user.email,
      name: user.name || "User" // Send name back
    });
  } catch (err) {
    console.error("Login error:", err);
    res.status(500).json({ error: "Login failed" });
  }
});

// ---------------- UPLOAD ROUTE ----------------

// POST /api/upload - image + notes -> store + dummy MedGamma result
app.post("/api/upload", upload.single("image"), async (req, res) => {
  try {
    const { notes, email, patientName, ectNumber } = req.body;
    const file = req.file;

    if (!file) {
      return res.status(400).json({ error: "Image file is required" });
    }

    // Dummy MedGamma result
    const aiReport = {
      model: "CXR-RRG-demo",
      finding: "No acute cardiopulmonary abnormality detected.",
      confidence: 0.92
    };

    const report = await Report.create({
      userEmail: email || "unknown@user.com",
      userName: req.body.userName || "Unknown User", // Added userName
      patientName: patientName || "Unknown Patient",
      ectNumber: ectNumber || "",
      notes: notes || "",
      // Ensure URL-safe, forward-slash path for browser use (avoid Windows backslashes)
      imagePath: path.posix.join('uploads', file.filename),
      aiReport
    });

    res.json({
      message: "Image analyzed and saved",
      report, // Contains the full saved report
      result: aiReport, // For frontend compatibility if needed
      imagePath: path.posix.join('uploads', file.filename)
    });
  } catch (err) {
    console.error("Upload error:", err);
    res.status(500).json({ error: "Upload failed" });
  }
});

// POST /api/save-report - accept image + reportText from external AI (Colab/ngrok)
app.post("/api/save-report", upload.single("image"), async (req, res) => {
  try {
    const { notes, email, reportText, patientName, ectNumber } = req.body;
    const file = req.file;

    if (!file) {
      return res.status(400).json({ error: "Image file is required to save report" });
    }

    const aiReport = {
      model: "MedGamma-extern",
      finding: reportText || "",
      confidence: null,
    };

    const report = await Report.create({
      userEmail: email || "unknown@user.com",
      userName: req.body.userName || "Unknown User", // Added userName
      patientName: patientName || "Unknown Patient",
      ectNumber: ectNumber || "",
      notes: notes || "",
      // Store a forward-slash path suitable for constructing URLs
      imagePath: path.posix.join('uploads', file.filename),
      aiReport,
    });

    res.json({ message: "Report saved", report });
  } catch (err) {
    console.error("Save report error:", err);
    res.status(500).json({ error: "Failed to save report" });
  }
});

// ---------------- DOCTOR ROUTE ----------------

// GET /api/reports - list of all reports
app.get("/api/reports", async (req, res) => {
  try {
    const reports = await Report.find().sort({ createdAt: -1 });
    res.json(reports);
  } catch (err) {
    console.error("Reports error:", err);
    res.status(500).json({ error: "Failed to fetch reports" });
  }
});

// GET /api/history - list of reports for a specific user
app.get("/api/history", async (req, res) => {
  try {
    const { email } = req.query;
    if (!email) {
      return res.status(400).json({ error: "Email query parameter required" });
    }
    const reports = await Report.find({ userEmail: email }).sort({ createdAt: -1 });
    res.json(reports);
  } catch (err) {
    console.error("History error:", err);
    res.status(500).json({ error: "Failed to fetch history" });
  }
});

// PUT /api/history/:id - update a report
app.put("/api/history/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { patientName, notes, finding, ectNumber } = req.body;

    const report = await Report.findById(id);
    if (!report) {
      return res.status(404).json({ error: "Report not found" });
    }

    if (patientName !== undefined) report.patientName = patientName;
    if (ectNumber !== undefined) report.ectNumber = ectNumber;
    if (notes !== undefined) report.notes = notes;
    if (finding !== undefined && report.aiReport) report.aiReport.finding = finding;

    await report.save();
    res.json({ message: "Report updated", report });
  } catch (err) {
    console.error("Update error:", err);
    res.status(500).json({ error: "Failed to update report" });
  }
});

// DELETE /api/history/:id - delete a specific report
app.delete("/api/history/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const deleted = await Report.findByIdAndDelete(id);
    if (!deleted) {
      return res.status(404).json({ error: "Report not found" });
    }
    res.json({ message: "Report deleted successfully" });
  } catch (err) {
    console.error("Delete error:", err);
    res.status(500).json({ error: "Failed to delete report" });
  }
});

// DELETE /api/history/clear - delete all reports for a user
app.delete("/api/history/clear/all", async (req, res) => {
  try {
    const { email } = req.query;
    if (!email) {
      return res.status(400).json({ error: "Email query parameter required" });
    }
    const result = await Report.deleteMany({ userEmail: email });
    res.json({ message: "History cleared", count: result.deletedCount });
  } catch (err) {
    console.error("Clear history error:", err);
    res.status(500).json({ error: "Failed to clear history" });
  }
});

// ---------------- START SERVER ----------------

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`✅ Server running on port ${PORT}`);
});
