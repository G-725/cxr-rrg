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
      email: user.email
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
    const { notes, email } = req.body; // email can be passed from frontend later
    const file = req.file;

    if (!file) {
      return res.status(400).json({ error: "Image file is required" });
    }

    // TODO: replace this with a real MedGamma model call to analyze images.
    // For now, we return a static example report so the flow can be tested.
    const aiReport = {
      model: "MedGamma-demo",
      finding: "No acute cardiopulmonary abnormality detected.",
      confidence: 0.92
    };

    const report = await Report.create({
      userEmail: email || "unknown@user.com",
      notes: notes || "",
      imagePath: file.path,
      aiReport
    });

    res.json({
      message: "Image analyzed",
      report
    });
  } catch (err) {
    console.error("Upload error:", err);
    res.status(500).json({ error: "Upload failed" });
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

// ---------------- START SERVER ----------------

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`✅ Server running on port ${PORT}`);
});
