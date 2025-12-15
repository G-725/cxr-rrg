import { useState } from "react";
import { motion } from "framer-motion";
import { Upload, FileText, Activity, CheckCircle, Download } from "lucide-react";
import axios from "axios";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import Navbar from "../components/Navbar";
import "../dashboard.css";

// Replace with your ngrok public URL (example: https://abcd1234.ngrok-free.app)
const API_URL = "https://2e37bf15f194.ngrok-free.app"

function UserDashboard() {
  const [file, setFile] = useState(null);
  const [notes, setNotes] = useState("");
  const [patientName, setPatientName] = useState("");
  const [ectNumber, setEctNumber] = useState("");
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

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
    fd.append("patientName", patientName);
    fd.append("ectNumber", ectNumber);
    fd.append("email", localStorage.getItem("email") || "unknown@user.com");

    try {
      // Send to the Colab/ngrok backend which exposes `/predict`
      console.log(`Uploading to: ${API_URL}/predict`);
      const res = await axios.post(`${API_URL}/predict`, fd, {
        headers: { "Content-Type": "multipart/form-data" },
        timeout: 120000, // 120 seconds for model inference
      });

      // Backend returns { report: "...long radiology report..." }
      const reportText = res.data?.report || "";

      setResult({
        reportText,
        // Use a local preview for the uploaded image
        imagePreview: URL.createObjectURL(file),
      });
    } catch (error) {
      console.error("Upload error full object:", error);
      console.error("Error code:", error?.code);
      console.error("Error response:", error?.response);
      console.error("API_URL being used:", API_URL);

      let serverMsg = "Network Error";
      if (error?.response?.data?.error) {
        serverMsg = error.response.data.error;
      } else if (error?.response?.data) {
        serverMsg = JSON.stringify(error.response.data);
      } else if (error?.code === "ECONNABORTED") {
        serverMsg = "Request timeout (120s). Model may be slow or ngrok tunnel down.";
      } else if (error?.code === "ERR_NETWORK") {
        serverMsg = `Network Error: ngrok URL unreachable. Check: 1) URL is correct, 2) Colab cell is running, 3) ngrok tunnel active. Using URL: ${API_URL}`;
      } else if (error?.message) {
        serverMsg = error.message;
      }

      alert(`Analysis failed: ${serverMsg}`);
    } finally {
      setLoading(false);
    }
  };


  const saveReport = async () => {
    if (!result?.reportText) return alert("No report to save");

    // Connect to local backend for saving
    const BACKEND_URL = "http://127.0.0.1:5000";

    if (!patientName.trim()) return alert("Please enter a Patient Name before saving.");

    const fd = new FormData();
    fd.append("image", file); // Re-upload the image file to save it locally in backend
    fd.append("notes", notes);
    fd.append("patientName", patientName);
    fd.append("ectNumber", ectNumber);
    const storedUserName = localStorage.getItem("userName");
    const userEmail = localStorage.getItem("email") || "unknown@user.com";
    const displayName = (storedUserName && storedUserName !== "User" && storedUserName !== "Unknown User")
      ? storedUserName
      : userEmail.split('@')[0];

    fd.append("email", userEmail);
    fd.append("userName", displayName); // Send User Name or Email Prefix
    fd.append("reportText", result.reportText);

    try {
      await axios.post(`${BACKEND_URL}/api/save-report`, fd, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      alert("Report saved to history successfully!");
    } catch (err) {
      console.error("Save error:", err);
      alert("Failed to save report to history.");
    }
  };

  const downloadPDF = async (reportData) => {
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
    doc.text("CXR-RRG Report", 14, 22);

    doc.setFontSize(10);
    doc.setTextColor(100);
    doc.text(`Generated on: ${new Date().toLocaleString()}`, 14, 30);

    // Patient/Report Info
    autoTable(doc, {
      startY: 40,
      head: [['Field', 'Value']],
      body: [
        ['Report ID', data._id || "Pending Save"],
        ['Patient Name', patientName || "Unknown"],
        ['ECT Number', ectNumber || "N/A"],
        ['User/Doctor', data.userName || localStorage.getItem("userName") || "Unknown"],
        ['User Email', data.userEmail || "Unknown"],
        ['Date', new Date(data.createdAt || Date.now()).toLocaleString()],
        ['Confidence', `N/A`],
      ],
      theme: 'grid',
      headStyles: { fillColor: [255, 77, 0] },
    });

    let currentY = doc.lastAutoTable.finalY + 15;

    // --- Add X-Ray Image ---
    if (file) {
      try {
        const base64Img = await new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = (e) => resolve(e.target.result);
          reader.onerror = reject;
          reader.readAsDataURL(file);
        });

        // Calculate available width/height
        const MAX_WIDTH = 100; // max width in mm
        const MAX_HEIGHT = 100; // max height in mm

        const imgProps = doc.getImageProperties(base64Img);
        let imgWidth = imgProps.width;
        let imgHeight = imgProps.height;

        // Scale logic
        const ratio = Math.min(MAX_WIDTH / imgWidth, MAX_HEIGHT / imgHeight);
        imgWidth = imgWidth * ratio;
        imgHeight = imgHeight * ratio;

        doc.addImage(base64Img, 'JPEG', 14, currentY, imgWidth, imgHeight);
        currentY += imgHeight + 15;
      } catch (err) {
        console.error("Error adding image to PDF:", err);
      }
    }
    // -----------------------

    // --- Helper function for text pagination ---
    const addTextWithPagination = (text, yPos, fontSize = 12) => {
      doc.setFontSize(fontSize);
      const lines = doc.splitTextToSize(text || "", 180);
      const lineHeight = fontSize * 0.3527 * 1.5; // convert pt to mm (approx) and add spacing

      for (let i = 0; i < lines.length; i++) {
        if (yPos > 280) { // Check for bottom of page
          doc.addPage();
          yPos = 20; // Reset Y to top margin
        }
        doc.text(lines[i], 14, yPos);
        yPos += lineHeight;
      }
      return yPos;
    };
    // ------------------------------------------

    // Findings
    doc.setFontSize(14);
    doc.setTextColor(0);

    if (currentY > 270) {
      doc.addPage();
      currentY = 20;
    }
    doc.text("AI Findings", 14, currentY);
    currentY += 10;

    // Write Findings
    currentY = addTextWithPagination(data.reportText || "No report returned.", currentY, 12);

    // Notes
    if (data.notes) {
      currentY += 10; // Spacing before notes header

      if (currentY > 270) {
        doc.addPage();
        currentY = 20;
      }
      doc.setFontSize(14);
      doc.text("Clinical Notes", 14, currentY);
      currentY += 10;

      // Write Notes
      currentY = addTextWithPagination(data.notes, currentY, 12);
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
              <label>Patient Name / Identifier</label>
              <input
                type="text"
                placeholder="Ex. John Doe, Patient #123"
                value={patientName}
                onChange={(e) => setPatientName(e.target.value)}
                style={{
                  width: '100%',
                  padding: '1rem',
                  background: 'rgba(255, 255, 255, 0.03)',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  borderRadius: '12px',
                  color: 'var(--text-primary)',
                  marginBottom: '1rem'
                }}
              />

              <label>ECT Number</label>
              <input
                type="text"
                placeholder="Ex. ECT-12345"
                value={ectNumber}
                onChange={(e) => setEctNumber(e.target.value)}
                style={{
                  width: '100%',
                  padding: '1rem',
                  background: 'rgba(255, 255, 255, 0.03)',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  borderRadius: '12px',
                  color: 'var(--text-primary)',
                  marginBottom: '1rem'
                }}
              />

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
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                      <h3>Primary Finding</h3>
                      <button
                        onClick={() => setIsEditing(!isEditing)}
                        style={{
                          background: 'none',
                          border: 'none',
                          color: '#ff4d00',
                          fontSize: '0.8rem',
                          cursor: 'pointer',
                          textDecoration: 'underline'
                        }}
                      >
                        {isEditing ? 'Done' : 'Edit'}
                      </button>
                    </div>
                    <div
                      className="finding-text"
                      style={{
                        position: 'relative',
                        border: isEditing ? '1px solid rgba(255, 77, 0, 0.5)' : '1px solid transparent',
                        borderRadius: '8px',
                        transition: 'border-color 0.2s'
                      }}
                    >
                      <div
                        contentEditable={isEditing}
                        suppressContentEditableWarning={true}
                        onBlur={(e) => setResult({ ...result, reportText: e.currentTarget.innerText })}
                        style={{
                          whiteSpace: 'pre-wrap',
                          margin: 0,
                          fontFamily: 'inherit',
                          fontSize: '1rem',
                          lineHeight: '1.6',
                          color: '#e4e4e7',
                          padding: '0.5rem',
                          outline: 'none',
                          minHeight: '100px'
                        }}
                      >
                        {result.reportText}
                      </div>
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
