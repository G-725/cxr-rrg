import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { FileText, Download, Calendar, Search, ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import jsPDF from "jspdf";
import "jspdf-autotable";
import Navbar from "../components/Navbar";
import "./history.css";

const API_URL = "http://127.0.0.1:5000";

function History() {
    const [reports, setReports] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    const nav = useNavigate();
    const email = localStorage.getItem("email");

    useEffect(() => {
        if (!email) {
            nav("/login");
            return;
        }
        fetchHistory();
    }, [email, nav]);

    const fetchHistory = async () => {
        try {
            const res = await axios.get(`${API_URL}/api/history?email=${email}`);
            setReports(res.data);
        } catch (err) {
            console.error("Failed to fetch history", err);
        } finally {
            setLoading(false);
        }
    };

    const downloadPDF = (report) => {
        const doc = new jsPDF();

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
                ['Report ID', report._id],
                ['Patient Email', report.userEmail],
                ['Date', new Date(report.createdAt).toLocaleString()],
                ['Confidence', `${(report.aiReport.confidence * 100).toFixed(1)}%`],
            ],
            theme: 'grid',
            headStyles: { fillColor: [255, 77, 0] },
        });

        // Findings
        doc.setFontSize(14);
        doc.setTextColor(0);
        doc.text("AI Findings", 14, doc.lastAutoTable.finalY + 15);

        doc.setFontSize(12);
        doc.text(report.aiReport.finding, 14, doc.lastAutoTable.finalY + 25);

        // Notes
        if (report.notes) {
            doc.setFontSize(14);
            doc.text("Clinical Notes", 14, doc.lastAutoTable.finalY + 40);
            doc.setFontSize(12);
            doc.text(report.notes, 14, doc.lastAutoTable.finalY + 50);
        }

        doc.save(`report-${report._id.slice(-6)}.pdf`);
    };

    const filteredReports = reports.filter(r =>
        r.aiReport.finding.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (r.notes && r.notes.toLowerCase().includes(searchTerm.toLowerCase()))
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
                </header>

                <div className="history-controls">
                    <div className="search-bar">
                        <Search size={20} />
                        <input
                            type="text"
                            placeholder="Search findings or notes..."
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
                                    <h4>{report.aiReport.finding}</h4>
                                    {report.notes && (
                                        <p className="report-notes">"{report.notes}"</p>
                                    )}
                                </div>

                                <div className="card-footer">
                                    <button
                                        className="download-btn"
                                        onClick={() => downloadPDF(report)}
                                    >
                                        <Download size={16} />
                                        Download PDF
                                    </button>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}

export default History;
