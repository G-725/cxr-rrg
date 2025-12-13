import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, FileText, Download } from 'lucide-react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

const ReportModal = ({ report, onClose, API_URL }) => {
    const [isEditing, setIsEditing] = React.useState(false);
    const [editData, setEditData] = React.useState({
        patientName: report?.patientName || "",
        finding: report?.aiReport?.finding || "",
        notes: report?.notes || ""
    });
    const [currentReport, setCurrentReport] = React.useState(report);
    const [isSaving, setIsSaving] = React.useState(false);

    React.useEffect(() => {
        if (report) {
            setCurrentReport(report);
            setEditData({
                patientName: report.patientName || "",
                finding: report.aiReport?.finding || "",
                notes: report.notes || ""
            });
        }
    }, [report]);

    if (!currentReport) return null;

    const handleSave = async () => {
        setIsSaving(true);
        try {
            const response = await fetch(`${API_URL}/api/history/${currentReport._id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    patientName: editData.patientName,
                    notes: editData.notes,
                    finding: editData.finding
                }),
            });

            if (response.ok) {
                const updatedReportResult = await response.json();
                setCurrentReport(updatedReportResult.report);
                setIsEditing(false);
            } else {
                alert("Failed to save changes");
            }
        } catch (error) {
            console.error("Error saving report:", error);
            alert("Error saving report");
        } finally {
            setIsSaving(false);
        }
    };

    const downloadPDF = () => {
        try {
            const doc = new jsPDF();
            const data = {
                _id: currentReport._id,
                userEmail: currentReport.userEmail,
                createdAt: currentReport.createdAt,
                reportText: editData.finding || "",
                notes: editData.notes || "",
                patientName: editData.patientName || "",
                confidence: currentReport?.aiReport?.confidence
            };

            // Header
            doc.setFontSize(20);
            doc.setTextColor(255, 77, 0);
            doc.text("CXR MedGamma Report", 14, 22);

            doc.setFontSize(10);
            doc.setTextColor(100);
            doc.text(`Generated on: ${new Date().toLocaleString()}`, 14, 30);

            // Patient/Report Info
            autoTable(doc, {
                startY: 40,
                head: [['Field', 'Value']],
                body: [
                    ['Report ID', data._id],
                    ['Patient Name', data.patientName || "Unknown"],
                    ['Date', new Date(data.createdAt).toLocaleString()],
                    ['Confidence', (data.confidence !== undefined && data.confidence !== null) ? `${(data.confidence * 100).toFixed(1)}%` : 'N/A'],
                ],
                theme: 'grid',
                headStyles: { fillColor: [255, 77, 0] },
            });

            // Findings
            doc.setFontSize(14);
            doc.setTextColor(0);
            const finalY = doc.lastAutoTable ? doc.lastAutoTable.finalY : 50;
            doc.text("AI Findings", 14, finalY + 15);

            doc.setFontSize(12);
            // Write the full report; split into lines to avoid overflow
            const splitReport = doc.splitTextToSize(data.reportText || "No report returned.", 180);
            doc.text(splitReport, 14, finalY + 25);

            // Notes
            if (data.notes) {
                // Calculate Y position based on previous text height
                // approximate height: lines * line height
                const findingHeight = splitReport.length * 7;
                const notesY = finalY + 25 + findingHeight + 10;

                // check if new page needed (simplified check)
                if (notesY > 250) {
                    doc.addPage();
                    doc.text("Clinical Notes", 14, 20);
                    doc.setFontSize(12);
                    doc.text(data.notes, 14, 30);
                } else {
                    doc.setFontSize(14);
                    doc.text("Clinical Notes", 14, notesY);
                    doc.setFontSize(12);
                    doc.text(data.notes, 14, notesY + 10);
                }
            }

            doc.save(`report-${data._id.slice(-6)}.pdf`);
        } catch (err) {
            console.error("PDF Download Error:", err);
            alert("Failed to download PDF. check console for details.");
        }
    };

    return (
        <AnimatePresence>
            <motion.div
                className="modal-overlay"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={onClose}
                style={{
                    position: 'fixed',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    background: 'rgba(0,0,0,0.8)',
                    zIndex: 1000,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: '2rem'
                }}
            >
                <motion.div
                    className="modal-content"
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0.9, opacity: 0 }}
                    onClick={(e) => e.stopPropagation()}
                    style={{
                        background: '#18181b', // Dark theme matching app
                        border: '1px solid rgba(255,255,255,0.1)',
                        borderRadius: '20px',
                        width: '100%',
                        maxWidth: '800px',
                        maxHeight: '90vh',
                        overflowY: 'auto',
                        padding: '2rem',
                        position: 'relative'
                    }}
                >
                    <button
                        onClick={onClose}
                        style={{
                            position: 'absolute',
                            top: '1.5rem',
                            right: '1.5rem',
                            background: 'transparent',
                            border: 'none',
                            color: 'var(--text-secondary)',
                            cursor: 'pointer'
                        }}
                    >
                        <X size={24} />
                    </button>

                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '2rem', paddingRight: '2rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                            <FileText size={24} color="#ff4d00" />
                            <h2 style={{ fontSize: '1.5rem', margin: 0, color: 'white' }}>Analysis Report</h2>
                        </div>
                        <button
                            onClick={() => isEditing ? handleSave() : setIsEditing(true)}
                            disabled={isSaving}
                            style={{
                                background: isEditing ? '#10b981' : 'rgba(255,255,255,0.1)',
                                color: 'white',
                                border: 'none',
                                padding: '0.5rem 1rem',
                                borderRadius: '8px',
                                cursor: 'pointer',
                                fontSize: '0.9rem',
                                fontWeight: 500
                            }}
                        >
                            {isSaving ? "Saving..." : isEditing ? "Save Changes" : "Edit Report"}
                        </button>
                    </div>

                    <div className="report-content-wrapper" style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
                        {/* Top Section: Image and Patient Details */}
                        <div className="top-section" style={{ display: 'flex', gap: '2rem', flexWrap: 'wrap' }}>
                            <div className="image-container" style={{ flex: '1 1 300px' }}>
                                <img
                                    src={`${API_URL}/${currentReport.imagePath}`} // Serve from backend
                                    alt="X-ray"
                                    style={{
                                        width: '100%',
                                        borderRadius: '12px',
                                        border: '1px solid rgba(255,255,255,0.1)'
                                    }}
                                />
                            </div>

                            <div className="details-container" style={{ flex: '1 1 300px' }}>
                                <div style={{ background: 'rgba(255,255,255,0.03)', padding: '1.5rem', borderRadius: '12px', height: '100%' }}>
                                    <h3 style={{ color: '#ff4d00', fontSize: '1.1rem', marginBottom: '1.5rem' }}>Patient Details</h3>

                                    <div style={{ marginBottom: '1rem' }}>
                                        <span style={{ color: '#a1a1aa', display: 'block', fontSize: '0.85rem', marginBottom: '0.25rem' }}>Patient Name</span>
                                        {isEditing ? (
                                            <input
                                                type="text"
                                                value={editData.patientName}
                                                onChange={(e) => setEditData({ ...editData, patientName: e.target.value })}
                                                style={{
                                                    width: '100%',
                                                    background: 'rgba(0,0,0,0.2)',
                                                    border: '1px solid rgba(255,255,255,0.2)',
                                                    borderRadius: '4px',
                                                    padding: '0.5rem',
                                                    color: 'white'
                                                }}
                                            />
                                        ) : (
                                            <span style={{ color: 'white', fontWeight: 500, fontSize: '1.1rem' }}>{currentReport.patientName || "Unknown"}</span>
                                        )}
                                    </div>

                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                                        <div>
                                            <span style={{ color: '#a1a1aa', display: 'block', fontSize: '0.85rem', marginBottom: '0.25rem' }}>Date</span>
                                            <span style={{ color: 'white', fontWeight: 500 }}>{new Date(currentReport.createdAt).toLocaleDateString()}</span>
                                        </div>
                                        <div>
                                            <span style={{ color: '#a1a1aa', display: 'block', fontSize: '0.85rem', marginBottom: '0.25rem' }}>Confidence</span>
                                            <span style={{ color: '#10b981', fontWeight: 500 }}>{currentReport.aiReport.confidence ? (currentReport.aiReport.confidence * 100).toFixed(0) + '%' : 'N/A'}</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Bottom Section: Primary Finding, Notes, Actions */}
                        <div className="bottom-section" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                            <div style={{
                                background: 'rgba(255, 77, 0, 0.05)',
                                border: '1px solid rgba(255, 77, 0, 0.1)',
                                borderRadius: '12px',
                                padding: '1rem',
                                marginBottom: '1.5rem'
                            }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                                    <h3 style={{
                                        color: '#ff4d00',
                                        fontSize: '0.9rem',
                                        margin: 0, // Reset margin since flex container handles alignment
                                        textTransform: 'uppercase',
                                        letterSpacing: '0.05em'
                                    }}>Primary Finding</h3>

                                    {/* Small Edit Button inside the box header, matching dashboard */}
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
                                        onBlur={(e) => setEditData({ ...editData, finding: e.currentTarget.innerText })}
                                        style={{
                                            whiteSpace: 'pre-wrap',
                                            margin: 0,
                                            fontFamily: 'inherit',
                                            fontSize: '1rem',
                                            lineHeight: '1.6',
                                            color: '#e4e4e7', // var(--text-primary)
                                            padding: '0.5rem',
                                            outline: 'none',
                                            minHeight: '100px'
                                        }}
                                    >
                                        {editData.finding}
                                    </div>
                                </div>
                            </div>

                            <div style={{ background: 'rgba(255,255,255,0.03)', padding: '1.5rem', borderRadius: '12px' }}>
                                <h4 style={{ color: '#a1a1aa', fontSize: '0.9rem', marginBottom: '0.5rem' }}>Clinical Notes</h4>
                                {isEditing ? (
                                    <textarea
                                        value={editData.notes}
                                        onChange={(e) => setEditData({ ...editData, notes: e.target.value })}
                                        style={{
                                            width: '100%',
                                            minHeight: '100px',
                                            background: 'rgba(0,0,0,0.2)',
                                            border: '1px solid rgba(255,255,255,0.2)',
                                            borderRadius: '8px',
                                            padding: '0.5rem',
                                            color: 'white',
                                            fontFamily: 'inherit'
                                        }}
                                        placeholder="Add notes..."
                                    />
                                ) : (
                                    <p style={{ color: 'white', fontStyle: 'italic' }}>"{currentReport.notes || "No notes available"}"</p>
                                )}
                            </div>

                            <button
                                onClick={downloadPDF}
                                style={{
                                    width: '100%',
                                    background: '#ff4d00',
                                    color: 'white',
                                    border: 'none',
                                    padding: '1rem',
                                    borderRadius: '12px',
                                    fontWeight: 600,
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    gap: '10px',
                                    cursor: 'pointer',
                                    marginTop: '1rem'
                                }}
                            >
                                <Download size={20} />
                                Download PDF Report
                            </button>
                        </div>
                    </div>
                </motion.div>
            </motion.div>
        </AnimatePresence>
    );
};

export default ReportModal;
