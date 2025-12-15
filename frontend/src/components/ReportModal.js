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
    const [imageFailed, setImageFailed] = React.useState(false);

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

    const downloadPDF = async () => {
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
            doc.text("CXR-RRG Report", 14, 22);

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
                    ['User/Doctor', currentReport.userName || "Unknown"],
                    ['User Email', data.userEmail],
                    ['Date', new Date(data.createdAt).toLocaleString()],
                    ['Confidence', (data.confidence !== undefined && data.confidence !== null) ? `${(data.confidence * 100).toFixed(1)}%` : 'N/A'],
                ],
                theme: 'grid',
                headStyles: { fillColor: [255, 77, 0] },
            });

            let currentY = doc.lastAutoTable.finalY + 15;

            // --- Add Image Logic ---
            if (currentReport.imagePath && !imageFailed) {
                try {
                    // 1. Construct URL
                    const p = String(currentReport.imagePath || '');
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
            currentY = addTextWithPagination(data.reportText || "No report returned.", currentY, 12);

            // Notes
            if (data.notes) {
                currentY += 10;

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
                                {currentReport.imagePath && !imageFailed ? (
                                    <img
                                        src={(() => {
                                            const p = String(currentReport.imagePath || '');
                                            const s = p.replace(/\\/g, '/');
                                            const idx = s.indexOf('uploads/');
                                            const rel = idx !== -1 ? s.slice(idx) : 'uploads/' + s.split('/').slice(-1)[0];
                                            return `${API_URL}/${rel.replace(/^\/+/, '')}`;
                                        })()}
                                        alt="X-ray"
                                        onError={() => setImageFailed(true)}
                                        style={{
                                            width: '100%',
                                            borderRadius: '12px',
                                            border: '1px solid rgba(255,255,255,0.1)'
                                        }}
                                    />
                                ) : (
                                    <div style={{
                                        width: '100%',
                                        height: '220px',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        borderRadius: '12px',
                                        border: '1px solid rgba(255,255,255,0.06)',
                                        color: '#a1a1aa'
                                    }}>{imageFailed ? 'Image failed to load' : 'No image available'}</div>
                                )}
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
                                        <div style={{ gridColumn: '1 / -1' }}>
                                            <span style={{ color: '#a1a1aa', display: 'block', fontSize: '0.85rem', marginBottom: '0.25rem' }}>Uploaded by</span>
                                            <span style={{ color: 'white', fontWeight: 500 }}>{currentReport.userName || "Unknown"} <span style={{ fontSize: '0.8em', color: '#71717a' }}>({currentReport.userEmail})</span></span>
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
