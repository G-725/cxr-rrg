import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Activity, Github, Sun, Moon, History, FileText, LogOut } from "lucide-react";
import { useTheme } from "../context/ThemeContext";
import "./navbar.css";

function Navbar() {
  const nav = useNavigate();
  const { theme, toggleTheme } = useTheme();
  const isLoggedIn = !!localStorage.getItem("email");

  const handleLogout = () => {
    localStorage.removeItem("email");
    nav("/");
  };

  return (
    <motion.nav
      className="nav"
      initial={{ y: -100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.8, ease: [0.6, 0.05, 0.01, 0.9] }}
    >
      <div className="nav-container">
        <div className="nav-left">
          <Activity className="brand-icon" size={24} />
          <span className="brand-name">CXR MedGamma</span>
        </div>

        <div className="nav-center">
          <div className="nav-links">
            <Link className="nav-link" to="/">Home</Link>
            <Link className="nav-link" to="/features">Features</Link>

            {isLoggedIn && (
              <>
                <Link className="nav-link" to="/dashboard">
                  <FileText size={16} style={{ marginRight: '6px' }} />
                  Reports
                </Link>
                <Link className="nav-link" to="/history">
                  <History size={16} style={{ marginRight: '6px' }} />
                  History
                </Link>
              </>
            )}

            <a
              className="nav-link"
              href="https://github.com/G-725/cxr-rrg"
              target="_blank"
              rel="noreferrer"
            >
              <Github size={16} style={{ marginRight: '6px' }} />
              GitHub
            </a>
          </div>
        </div>

        <div className="nav-right">
          <button className="theme-toggle" onClick={toggleTheme}>
            {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
          </button>

          {isLoggedIn ? (
            <motion.button
              className="cta-pill logout"
              onClick={handleLogout}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <LogOut size={16} style={{ marginRight: '6px' }} />
              Sign out
            </motion.button>
          ) : (
            <motion.button
              className="cta-pill"
              onClick={() => nav('/register')}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              Get started
            </motion.button>
          )}
        </div>
      </div>
    </motion.nav>
  );
}

export default Navbar;
