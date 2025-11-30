import axios from "axios";
import { useState } from "react";
import { API_URL } from "../api";
import { useNavigate } from "react-router-dom";
import "../auth.css";

function Register() {
  const nav = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isRegistering, setIsRegistering] = useState(false);

  const registerUser = async () => {
    try {
      const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!email || !password) return alert("Please provide email and password");
      if (!emailPattern.test(email)) return alert("Please enter a valid email address");
      if (password.length < 6) return alert("Password must be at least 6 characters");

      setIsRegistering(true);
      await axios.post(`${API_URL}/api/auth/register`, { email, password });
      // Auto-login after successful registration to improve UX
      try {
        const res = await axios.post(`${API_URL}/api/auth/login`, { email, password });
        localStorage.setItem("email", email);
        localStorage.setItem("role", res.data.role || "user");
        if (res.data.role === "doctor") nav("/doctor");
        else nav("/user");
      } catch (loginErr) {
        // If auto-login fails, fallback to redirect to login; show notification
        alert("Registered successfully! Please login to continue.");
        nav("/");
      }
    } catch (err) {
      const msg = err?.response?.data?.error || "Failed to register.";
      alert(msg);
    } finally {
      setIsRegistering(false);
    }
  };

  return (
    <div className="dashboard-bg">
      <div className="premium-container">
        <div className="auth-card pop-in">
        <h1 className="ashom-title">🩺 CXR MedGamma</h1>
        <h2>Register</h2>

        <input className="auth-input" placeholder="Email" value={email} onChange={(e)=>setEmail(e.target.value)} />
        <input className="auth-input" type="password" placeholder="Password" value={password} onChange={(e)=>setPassword(e.target.value)} />

        <button className="auth-btn" onClick={registerUser} disabled={isRegistering}>{isRegistering ? "Registering…" : "Register"}</button>

        <p className="switch-text">
          Already have an account? <span className="link" onClick={()=>nav("/")}>Login</span>
        </p>
        </div>
      </div>
    </div>
  );
}

export default Register;
