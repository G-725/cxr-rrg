import { useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import "../auth.css";

const API_URL = "http://127.0.0.1:5000"; // backend URL

function Login() {
  const nav = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const loginUser = async () => {
    try {
      await axios.post(`${API_URL}/api/auth/login`, { email, password });
      localStorage.setItem("email", email);
      nav("/dashboard");
    } catch (err) {
      alert("Invalid credentials");
    }
  };

  return (
    <div className="auth-dark-bg">
      <div className="auth-dark-card">
        <h1 className="auth-title">🩺 CXR MedGamma</h1>
        <h2 className="auth-subtitle">Login</h2>

        <input
          className="auth-input"
          placeholder="Email"
          onChange={(e) => setEmail(e.target.value)}
        />

        <input
          className="auth-input"
          type="password"
          placeholder="Password"
          onChange={(e) => setPassword(e.target.value)}
        />

        <button className="auth-btn" onClick={loginUser}>
          Login
        </button>

        <p className="switch-text">
          Don’t have an account?{" "}
          <span className="switch-link" onClick={() => nav("/register")}>
            Register
          </span>
        </p>
      </div>
    </div>
  );
}

export default Login;
