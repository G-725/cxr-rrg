import { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import { FileText, Download, Calendar, Search, Trash2, Trash, User } from "lucide-react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import Navbar from "../components/Navbar";
import "./history.css";
import ReportModal from "../components/ReportModal";

const API_URL = "http://127.0.0.1:5000";

function History() {
    const [reports, setReports] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    const [selectedReport, setSelectedReport] = useState(null); // For modal
    const nav = useNavigate();
    const email = localStorage.getItem("email");

    const fetchHistory = useCallback(async () => {
        try {
            const res = await axios.get(`${API_URL}/api/history?email=${email}`);
            setReports(res.data);
        } catch (err) {
            console.error("Failed to fetch history", err);
        } finally {
            setLoading(false);
        }
    }, [email]);

    useEffect(() => {
        if (!email) {
            nav("/login");
            return;
        }
        fetchHistory();
    }, [email, nav, fetchHistory]);

    const deleteReport = async (id) => {
        if (!window.confirm("Are you sure you want to delete this report?")) return;
        try {
            await axios.delete(`${API_URL}/api/history/${id}`);
            setReports(reports.filter((r) => r._id !== id));
        } catch (err) {
            console.error("Failed to delete report", err);
            alert("Failed to delete report");
        }
    };

    const clearHistory = async () => {
        if (!window.confirm("Are you sure you want to clear ALL history? This cannot be undone.")) return;
        try {
            await axios.delete(`${API_URL}/api/history/clear/all?email=${email}`);
            setReports([]);
        } catch (err) {
            console.error("Failed to clear history", err);
            alert("Failed to clear history");
        }
    };

    const downloadPDF = async (report) => {
        const doc = new jsPDF();

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
                ['Report ID', report._id],
                ['Patient Name', report.patientName],
                ['ECT Number', report.ectNumber || "N/A"],
                ['User/Doctor', report.userName || "Unknown"],
                ['User Email', report.userEmail],
                ['Date', new Date(report.createdAt).toLocaleString()],
                ['Confidence', `${(report.aiReport.confidence * 100).toFixed(1)}%`],
            ],
            theme: 'grid',
            headStyles: { fillColor: [255, 77, 0] },
        });

        let currentY = doc.lastAutoTable.finalY + 15;

        // --- Add Image Logic ---
        if (report.imagePath) {
            try {
                // 1. Construct URL
                const p = String(report.imagePath || '');
                const s = p.replace(/\\/g, '/');
                const idx = s.indexOf('uploads/');
                const rel = idx !== -1 ? s.slice(idx) : 'uploads/' + s.split('/').slice(-1)[0];
                const imgUrl = `${API_URL}/${rel.replace(/^\/+/, '')}`;

                // 2. Fetch Blob
                const res = await fetch(imgUrl);
                if (!res.ok) throw new Error("Failed to fetch image");
                const blob = await res.blob();

                // 3. Convert to DataURL
                const base64Img = await new Promise((resolve, reject) => {
                    const reader = new FileReader();
                    reader.onload = (e) => resolve(e.target.result);
                    reader.onerror = reject;
                    reader.readAsDataURL(blob);
                });

                // 4. Add to PDF
                const MAX_WIDTH = 100;
                const MAX_HEIGHT = 100;

                const imgProps = doc.getImageProperties(base64Img);
                let imgWidth = imgProps.width;
                let imgHeight = imgProps.height;

                const ratio = Math.min(MAX_WIDTH / imgWidth, MAX_HEIGHT / imgHeight);
                imgWidth *= ratio;
                imgHeight *= ratio;

                doc.addImage(base64Img, 'JPEG', 14, currentY, imgWidth, imgHeight);
                currentY += imgHeight + 15;

            } catch (imgErr) {
                console.error("PDF Image Error:", imgErr);
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
        currentY = addTextWithPagination(report.aiReport.finding || "No findings.", currentY, 12);

        // Notes
        if (report.notes) {
            currentY += 10;

            if (currentY > 270) {
                doc.addPage();
                currentY = 20;
            }
            doc.setFontSize(14);
            doc.text("Clinical Notes", 14, currentY);
            currentY += 10;

            // Write Notes
            currentY = addTextWithPagination(report.notes, currentY, 12);
        }

        doc.save(`report-${report._id.slice(-6)}.pdf`);
    };

    const filteredReports = reports.filter(r =>
        r.aiReport.finding.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (r.notes && r.notes.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (r.patientName && r.patientName.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (r.ectNumber && r.ectNumber.toLowerCase().includes(searchTerm.toLowerCase()))
    );

    return (
        <div className="history-page">
            <Navbar />

            <div className="history-container">
                <header className="history-header">
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5 }}
                    >
                        <h1>Report History</h1>
                        <p>Access and manage your past diagnostic reports.</p>
                    </motion.div>
                    {reports.length > 0 && (
                        <button className="clear-btn" onClick={clearHistory}>
                            <Trash2 size={18} />
                            Clear History
                        </button>
                    )}
                </header>

                <div className="history-controls">
                    <div className="search-bar">
                        <Search size={20} />
                        <input
                            type="text"
                            placeholder="Search findings, notes, or patient name..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                </div>

                {loading ? (
                    <div className="loading-state">Loading history...</div>
                ) : filteredReports.length === 0 ? (
                    <div className="empty-history">
                        <FileText size={48} />
                        <h3>No reports found</h3>
                        <p>Upload an X-ray in the dashboard to generate your first report.</p>
                        <button className="btn-primary" onClick={() => nav('/dashboard')}>
                            Go to Dashboard
                        </button>
                    </div>
                ) : (
                    <div className="reports-grid">
                        {filteredReports.map((report, index) => (
                            <motion.div
                                key={report._id}
                                className="report-card-mini"
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: index * 0.05 }}
                            >
                                <div className="card-header">
                                    <span className="date-badge">
                                        <Calendar size={14} />
                                        {new Date(report.createdAt).toLocaleDateString()}
                                    </span>
                                    <span className="confidence-pill">
                                        {(report.aiReport.confidence * 100).toFixed(0)}% Conf.
                                    </span>
                                </div>

                                <div className="card-body">
                                    <h5
                                        className="patient-name-link"
                                        onClick={() => setSelectedReport(report)}
                                        title="Click to view full report"
                                        style={{ fontSize: '1.1rem', cursor: 'pointer' }}
                                    >
                                        <User size={16} style={{ marginRight: '8px' }} />
                                        {report.patientName || "Unknown Patient"}
                                        {report.ectNumber && <span style={{ fontSize: '0.9rem', color: '#a1a1aa', marginLeft: '8px' }}>({report.ectNumber})</span>}
                                    </h5>
                                    <div style={{ fontSize: '0.8rem', color: '#71717a', marginTop: '0.2rem', marginLeft: '24px' }}>
                                        Uploaded by: <span style={{ color: '#e4e4e7' }}>{report.userName && report.userName !== "Unknown User" ? report.userName : report.userEmail.split('@')[0]}</span>
                                    </div>
                                    <p style={{ fontSize: '0.85rem', color: '#a1a1aa', marginTop: '0.5rem' }}>
                                        Click to view report details
                                    </p>
                                </div>

                                <div className="card-footer">
                                    <button
                                        className="download-btn"
                                        onClick={() => downloadPDF(report)}
                                    >
                                        <Download size={16} />
                                        Download PDF
                                    </button>
                                    <button
                                        className="delete-btn"
                                        onClick={() => deleteReport(report._id)}
                                        title="Delete Report"
                                    >
                                        <Trash size={16} />
                                    </button>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                )}
            </div>


            {selectedReport && (
                <ReportModal
                    report={selectedReport}
                    onClose={() => setSelectedReport(null)}
                    API_URL={API_URL}
                />
            )}
        </div>
    );
}

export default History;
