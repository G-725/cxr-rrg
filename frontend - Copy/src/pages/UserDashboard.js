import { useState } from "react";
import axios from "axios";
import "../dashboard.css";
import Navbar from "../components/Navbar";

const API_URL = "http://127.0.0.1:5000"; // change if needed

function UserDashboard() {
  const [file, setFile] = useState(null);
  const [notes, setNotes] = useState("");
  const [result, setResult] = useState(null);

  const upload = async () => {
    if (!file) return alert("Please choose an image");

    const fd = new FormData();
    fd.append("image", file);
    fd.append("notes", notes);
    fd.append("email", localStorage.getItem("email") || "unknown@user.com");

    try {
      const res = await axios.post(`${API_URL}/api/upload`, fd);
      setResult(res.data);
    } catch (error) {
      alert("Upload failed");
    }
  };

  return (
    <div className="dashboard-bg">
      <Navbar />

      {/* PAGE TITLE */}
      <h2 className="page-title">🩺 AI Chest X-Ray Analyzer</h2>

      {/* 2-COLUMN LAYOUT */}
      <div className="dashboard-layout">

        {/* LEFT: UPLOAD CARD */}
        <div className="left-panel">
          <div className="card upload-card">
            <h3 className="card-heading">Upload X-Ray</h3>

            <input
              type="file"
              className="file-upload"
              onChange={(e) => setFile(e.target.files[0])}
            />

            <textarea
              className="notes-input"
              placeholder="Any symptoms or notes?"
              onChange={(e) => setNotes(e.target.value)}
            ></textarea>

            <button className="analyze-btn" onClick={upload}>
              Analyze X-Ray
            </button>
          </div>
        </div>

        {/* RIGHT: REPORT CARD */}
        {result && (
          <div className="right-panel">
            <div className="card diagnosis-card">

              <div className="diagnosis-header">✨ AI Diagnosis Report</div>

              <div className="diagnosis-row">
                <span className="label">Finding:</span>
                <span className="value">{result.report.aiReport.finding}</span>
              </div>

              <div className="diagnosis-row">
                <span className="label">Confidence:</span>
                <span className="value">
                  {(result.report.aiReport.confidence * 100).toFixed(1)}%
                </span>
              </div>

              <div className="diagnosis-row">
                <span className="label">Notes:</span>
                <span className="value">
                  {result.report.notes || "No notes provided"}
                </span>
              </div>

              <img
                src={`${API_URL}/${result.report.imagePath}`}
                alt="X-Ray"
                className="diagnosis-img"
              />

              <p className="timestamp">
                Generated: {new Date(result.report.createdAt).toLocaleString()}
              </p>

            </div>
          </div>
        )}

      </div>
    </div>
  );
}

export default UserDashboard;
