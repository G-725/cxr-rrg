import axios from "axios";
import { useState } from "react";
import { API_URL } from "../api";
import { useNavigate } from "react-router-dom";
import "../auth.css";

function Login() {
  const nav = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLogging, setIsLogging] = useState(false);

  const loginUser = async () => {
    try {
      const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!email || !password) return alert("Please enter email and password");
      if (!emailPattern.test(email)) return alert("Please enter a valid email address");
      setIsLogging(true);

      const res = await axios.post(`${API_URL}/api/auth/login`, { email, password });

      // persist email + role
      localStorage.setItem("email", email);
      localStorage.setItem("role", res.data.role || "user");

      if (res.data.role === "doctor") nav("/doctor");
      else nav("/user");
    } catch (err) {
      const message = err?.response?.data?.error || "Invalid credentials";
      alert(message);
    } finally {
      setIsLogging(false);
    }
  };

  return (
    <div className="dashboard-bg">
      <div className="premium-container">
        <div className="auth-card pop-in">
        <h1 className="ashom-title">🩺 CXR MedGamma</h1>
        <h2>Login</h2>

        <input className="auth-input" placeholder="Email" value={email} onChange={(e)=>setEmail(e.target.value)} />
        <input className="auth-input" type="password" placeholder="Password" value={password} onChange={(e)=>setPassword(e.target.value)} />

        <button className="auth-btn" onClick={loginUser} disabled={isLogging}>{isLogging ? "Logging in…" : "Login"}</button>

        <p className="switch-text">
          Don't have an account? <span className="link" onClick={()=>nav("/register")}>Register</span>
        </p>
        </div>
      </div>
    </div>
  );
}

export default Login;
