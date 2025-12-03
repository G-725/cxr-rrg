import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Activity, ArrowLeft } from "lucide-react";
import axios from "axios";
import "../auth.css";

const API_URL = "http://127.0.0.1:5000";

function Register() {
  const nav = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const registerUser = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await axios.post(`${API_URL}/api/auth/register`, {
        email,
        password,
      });

      alert("Registered successfully!");
      nav("/login");
    } catch (err) {
      alert("Registration failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <motion.div
        className="auth-container"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <button className="back-btn" onClick={() => nav('/')}>
          <ArrowLeft size={20} />
          Back
        </button>

        <div className="auth-header">
          <Activity className="brand-icon-lg" size={40} />
          <h2>Create an account</h2>
          <p>Start your journey with CXR MedGamma today</p>
        </div>

        <form className="auth-form" onSubmit={registerUser}>
          <div className="form-group">
            <label>Email</label>
            <input
              type="email"
              placeholder="name@company.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <label>Password</label>
            <input
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          <button type="submit" className="btn-primary full-width" disabled={loading}>
            {loading ? "Creating account..." : "Create account"}
          </button>
        </form>

        <div className="auth-footer">
          <p>
            Already have an account?{" "}
            <span className="link-text" onClick={() => nav("/login")}>
              Sign in
            </span>
          </p>
        </div>
      </motion.div>
    </div>
  );
}

export default Register;
