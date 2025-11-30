import axios from "axios";
import { useState } from "react";
import { API_URL } from "../api";
import { useNavigate } from "react-router-dom";
import "../auth.css";

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
    <div className="auth-container">
      <div className="auth-card">
        <h1 className="ashom-title">🩺 CXR MedGamma</h1>
        <h2>Login</h2>

        <input
          className="auth-input"
          placeholder="Email"
          onChange={(e) => setEmail(e.target.value)}
        />

        <input
          className="auth-input"
          placeholder="Password"
          type="password"
          onChange={(e) => setPassword(e.target.value)}
        />

        <button className="auth-btn" onClick={loginUser}>
          Login
        </button>

        <p className="switch-text">
          Don’t have an account?{" "}
          <span className="link" onClick={() => nav("/register")}>
            Register
          </span>
        </p>
      </div>
    </div>
  );
}

export default Login;
