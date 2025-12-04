import { useState } from "react";
import { motion } from "framer-motion";
import { Upload, FileText, Activity, CheckCircle, Download } from "lucide-react";
import axios from "axios";
import jsPDF from "jspdf";
import "jspdf-autotable";
import Navbar from "../components/Navbar";
import "../dashboard.css";

// Replace with your ngrok public URL (example: https://abcd1234.ngrok-free.app)
const API_URL = "https://6213a0a73eee.ngrok-free.app";

function UserDashboard() {
  const [file, setFile] = useState(null);
  const [notes, setNotes] = useState("");
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [dragActive, setDragActive] = useState(false);

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      setFile(e.dataTransfer.files[0]);
    }
  };

  const upload = async () => {
    if (!file) return alert("Please choose an image");
    setLoading(true);

    const fd = new FormData();
    fd.append("image", file);
    fd.append("notes", notes);
    fd.append("email", localStorage.getItem("email") || "unknown@user.com");

    try {
      // Send to the Colab/ngrok backend which exposes `/predict`
      const res = await axios.post(`${API_URL}/predict`, fd, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      // Backend returns { report: "...long radiology report..." }
      const reportText = res.data?.report || "";

      setResult({
        reportText,
        // Use a local preview for the uploaded image
        imagePreview: URL.createObjectURL(file),
      });
    } catch (error) {
      console.error(error);
      alert("Analysis failed. Check the ngrok URL and backend logs.");
    } finally {
      setLoading(false);
    }
  };

  const saveReport = async () => {
    if (!result?.reportText) return alert("No report to save");
    // Saving reports to history is not implemented in this demo frontend.
    // You can POST `result.reportText` to your backend to persist it.
    alert("Save to history not implemented. Implement backend save to persist reports.");
  };

  const downloadPDF = (reportData) => {
    const doc = new jsPDF();

    // Use reportData or fallback to current result state
    const data = reportData || {
      _id: "Unsaved",
      userEmail: localStorage.getItem("email"),
      createdAt: new Date(),
      reportText: result?.reportText || "",
      notes: notes,
    };

    // Header
    doc.setFontSize(20);
    doc.setTextColor(255, 77, 0); // Accent color
    doc.text("CXR MedGamma Report", 14, 22);

    doc.setFontSize(10);
    doc.setTextColor(100);
    doc.text(`Generated on: ${new Date().toLocaleString()}`, 14, 30);

    // Patient/Report Info
    doc.autoTable({
      startY: 40,
      head: [['Field', 'Value']],
      body: [
        ['Report ID', data._id || "Pending Save"],
        ['Patient Email', data.userEmail || "Unknown"],
        ['Date', new Date(data.createdAt || Date.now()).toLocaleString()],
        ['Confidence', `N/A`],
      ],
      theme: 'grid',
      headStyles: { fillColor: [255, 77, 0] },
    });

    // Findings
    doc.setFontSize(14);
    doc.setTextColor(0);
    doc.text("AI Findings", 14, doc.lastAutoTable.finalY + 15);

    doc.setFontSize(12);
    // Write the full report; split into lines to avoid overflow
    const splitReport = doc.splitTextToSize(data.reportText || "No report returned.", 180);
    doc.text(splitReport, 14, doc.lastAutoTable.finalY + 25);

    // Notes
    if (data.notes) {
      doc.setFontSize(14);
      doc.text("Clinical Notes", 14, doc.lastAutoTable.finalY + 40);
      doc.setFontSize(12);
      doc.text(data.notes, 14, doc.lastAutoTable.finalY + 50);
    }

    doc.save(`report-${(data._id || "unsaved").slice(-6)}.pdf`);
  };

  return (
    <div className="dashboard-page">
      <Navbar />

      <div className="dashboard-container">
        <header className="dashboard-header">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <h1>New Analysis</h1>
            <p>Upload a chest X-ray to generate an AI-powered diagnostic report.</p>
          </motion.div>
        </header>

        <div className="dashboard-grid">
          <motion.div
            className="upload-section"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
          >
            <div
              className={`upload-zone ${dragActive ? 'active' : ''} ${file ? 'has-file' : ''}`}
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
            >
              <input
                type="file"
                id="file-upload"
                className="hidden-input"
                onChange={(e) => setFile(e.target.files[0])}
                accept="image/*"
              />

              <label htmlFor="file-upload" className="upload-label">
                {file ? (
                  <div className="file-preview">
                    <CheckCircle className="success-icon" size={48} />
                    <p className="file-name">{file.name}</p>
                    <span className="change-text">Click or drag to replace</span>
                  </div>
                ) : (
                  <div className="empty-state">
                    <Upload className="upload-icon" size={48} />
                    <h3>Upload X-Ray Image</h3>
                    <p>Drag & drop or click to browse</p>
                    <span className="file-types">Supports JPG, PNG, DICOM</span>
                  </div>
                )}
              </label>
            </div>

            <div className="notes-section">
              <label>Clinical Notes (Optional)</label>
              <textarea
                placeholder="Add any relevant patient symptoms or history..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
              />
            </div>

            <button
              className="analyze-btn"
              onClick={upload}
              disabled={loading || !file}
            >
              {loading ? (
                <>
                  <Activity className="spin" size={20} />
                  Analyzing...
                </>
              ) : (
                <>
                  <Activity size={20} />
                  Generate Report
                </>
              )}
            </button>
          </motion.div>

          {result && (
            <motion.div
              className="report-section"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5 }}
            >
              <div className="report-card">
                <div className="report-header">
                  <FileText size={24} className="text-accent" />
                  <h2>Analysis Results</h2>
                  <span className="confidence-badge">
                    {result?.reportText ? "Report Received" : "N/A"}
                  </span>
                </div>

                <div className="report-content">
                  <div className="finding-box">
                    <h3>Primary Finding</h3>
                    <div className="finding-text">
                      <pre style={{ whiteSpace: 'pre-wrap', margin: 0 }}>{result.reportText}</pre>
                    </div>
                  </div>

                  <div className="image-preview">
                    <img
                      src={result.imagePreview || `${API_URL}/${result.report?.imagePath || ''}`}
                      alt="Analyzed X-Ray"
                    />
                    <div className="scan-overlay"></div>
                  </div>

                  <div className="report-details">
                    <div className="detail-row">
                      <span className="label">Patient Notes</span>
                      <span className="value">{notes || result.report?.notes || "None provided"}</span>
                    </div>
                    <div className="detail-row">
                      <span className="label">Analysis Time</span>
                      <span className="value">{new Date().toLocaleString()}</span>
                    </div>
                  </div>

                  <div className="report-actions">
                    <button
                      className="action-btn secondary"
                      onClick={saveReport}
                      disabled={!result?.reportText}
                    >
                      <CheckCircle size={18} />
                      {result?.reportText ? "Save to History" : "Save to History"}
                    </button>
                    <button className="action-btn primary" onClick={() => downloadPDF()}>
                      <Download size={18} />
                      Download PDF
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </div>
      </div>
    </div>
  );
}

export default UserDashboard;
