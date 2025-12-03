import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowRight, CheckCircle2 } from "lucide-react";
import Navbar from "../components/Navbar";
import "./welcome.css";

export default function Welcome() {
  const nav = useNavigate();

  return (
    <div className="welcome-page">
      <Navbar />

      <main className="hero-section">
        <div className="hero-content">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="pill-badge"
          >
            <span className="pill-new">NEW</span>
            <span>AI-Powered Radiology Analysis</span>
          </motion.div>

          <motion.h1
            className="hero-title"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
          >
            All your X-ray analysis<br />
            pulled into one <span className="gradient-text">powerful place</span>
          </motion.h1>

          <motion.p
            className="hero-subtitle"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            Organize scans, generate reports, and collaborate in one connected,
            accessible platform designed for modern healthcare.
          </motion.p>

          <motion.div
            className="hero-actions"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
          >
            <button className="btn-primary" onClick={() => nav('/register')}>
              Get started
            </button>
            <button className="btn-secondary" onClick={() => nav('/login')}>
              Sign in
            </button>
          </motion.div>
        </div>

        <motion.div
          className="hero-visual"
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8, delay: 0.4 }}
        >
          <div className="glow-effect"></div>
          <img
            src={require("../assets/dashboard-preview.png")}
            alt="Dashboard Preview"
            className="dashboard-preview-img"
          />
        </motion.div>
      </main>

      <section className="features-section">
        <div className="container">
          <div className="features-grid">
            {[
              "Instant AI Analysis",
              "Secure Cloud Storage",
              "Team Collaboration",
              "Automated Reporting"
            ].map((feature, index) => (
              <motion.div
                key={index}
                className="feature-item"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
              >
                <CheckCircle2 className="feature-icon" size={20} />
                <span>{feature}</span>
              </motion.div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
