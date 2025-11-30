import axios from "axios";
import { useState } from "react";
import { API_URL } from "../api";
import Navbar from "../components/Navbar";
import "../dashboard.css";

function UserDashboard() {
  const [file, setFile] = useState(null);
  const [notes, setNotes] = useState("");
  const [result, setResult] = useState(null);

  const upload = async () => {
    if (!file) {
      alert("Please choose an image");
      return;
    }

    const fd = new FormData();
    fd.append("image", file);
    fd.append("notes", notes);
    fd.append("email", localStorage.getItem("email"));

    try {
      const res = await axios.post(`${API_URL}/api/upload`, fd);
      setResult(res.data);
    } catch (err) {
      alert("Upload failed");
    }
  };

  return (
    <div className="dashboard-bg">
      <Navbar />

      <div className="premium-container">
        <h2 className="dash-title">🩺 AI Chest X-Ray Analyzer</h2>

        <div className="upload-card">
          <h3 className="card-title">Upload X-Ray</h3>

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

          <button className="analyze-btn glow-btn" onClick={upload}>
            Analyze X-Ray
          </button>
        </div>

        {result && (
          <div className="diagnosis-card premium-slide">
            <div className="diagnosis-header">✨ AI Diagnosis Report</div>

            <div className="diagnosis-content">
              <div className="diagnosis-item">
                <span className="label">Finding:</span>
                <span className="value">
                  {result.report.aiReport.finding}
                </span>
              </div>

              <div className="diagnosis-item">
                <span className="label">Confidence:</span>
                <span className="value">
                  {(result.report.aiReport.confidence * 100).toFixed(1)}%
                </span>
              </div>

              <div className="diagnosis-item">
                <span className="label">Notes:</span>
                <span className="value">
                  {result.report.notes || "No notes provided"}
                </span>
              </div>

              <img
                src={`${API_URL}/${result.report.imagePath}`}
                className="diagnosis-img"
                alt=""
              />

              <p className="timestamp">
                Generated:{" "}
                {new Date(result.report.createdAt).toLocaleString()}
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default UserDashboard;
