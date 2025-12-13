import { motion } from "framer-motion";
import { Activity, History, FileText, Shield, Moon, Database } from "lucide-react";
import Navbar from "../components/Navbar";
import "../index.css";

function Features() {
    const features = [
        {
            icon: <Activity size={32} className="text-accent" />,
            title: "AI-Powered Analysis",
            description: "Utilizes the advanced MedGamma model to detect cardiopulmonary abnormalities in chest X-rays with high accuracy."
        },
        {
            icon: <History size={32} className="text-accent" />,
            title: "Patient History",
            description: "Securely save and track past diagnostic reports. Access patient history anytime from the dedicated dashboard."
        },
        {
            icon: <FileText size={32} className="text-accent" />,
            title: "PDF Reports",
            description: "Generate professional, downloadable PDF reports containing analysis findings, confidence scores, and clinical notes."
        },
        {
            icon: <Shield size={32} className="text-accent" />,
            title: "Secure Authentication",
            description: "Robust JWT-based authentication ensures that patient data and medical records remain private and secure."
        },
        {
            icon: <Moon size={32} className="text-accent" />,
            title: "Adaptive Theming",
            description: "Choose between a sleek Dark Mode for low-light environments or a crisp Light Mode for clinical settings."
        },
        {
            icon: <Database size={32} className="text-accent" />,
            title: "Cloud Storage",
            description: "All reports and images are safely stored in MongoDB Atlas, ensuring data persistence and reliability."
        }
    ];

    return (
        <div className="features-page" style={{ minHeight: "100vh", paddingTop: "100px" }}>
            <Navbar />

            <div className="container">
                <motion.div
                    className="features-header"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6 }}
                    style={{ textAlign: "center", marginBottom: "4rem" }}
                >
                    <h1 style={{ fontSize: "3rem", fontWeight: "800", marginBottom: "1rem" }}>
                        Advanced <span className="text-accent">Features</span>
                    </h1>
                    <p style={{ color: "var(--text-secondary)", fontSize: "1.2rem", maxWidth: "600px", margin: "0 auto" }}>
                        Discover the tools that make CXR MedGamma a powerful assistant for medical professionals.
                    </p>
                </motion.div>

                <div
                    className="features-grid"
                    style={{
                        display: "grid",
                        gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
                        gap: "2rem",
                        paddingBottom: "4rem"
                    }}
                >
                    {features.map((feature, index) => (
                        <motion.div
                            key={index}
                            className="glass-card feature-card"
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.5, delay: index * 0.1 }}
                            whileHover={{ y: -5, transition: { duration: 0.2 } }}
                            style={{ padding: "2rem", display: "flex", flexDirection: "column", gap: "1rem" }}
                        >
                            <div className="feature-icon-wrapper" style={{ marginBottom: "0.5rem" }}>
                                {feature.icon}
                            </div>
                            <h3 style={{ fontSize: "1.5rem", fontWeight: "600" }}>{feature.title}</h3>
                            <p style={{ color: "var(--text-secondary)", lineHeight: "1.6" }}>
                                {feature.description}
                            </p>
                        </motion.div>
                    ))}
                </div>
            </div>
        </div>
    );
}

export default Features;
