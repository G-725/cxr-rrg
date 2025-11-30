import { useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import "../auth.css";

const API_URL = "http://127.0.0.1:5000"; // change if needed

function Register() {
  const nav = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const registerUser = async () => {
    try {
      await axios.post(`${API_URL}/api/auth/register`, {
        email,
        password,
      });

      alert("Registered successfully!");
      nav("/");
    } catch (err) {
      alert("Registration failed");
    }
  };

  return (
    <div className="auth-dark-bg">
      <div className="auth-dark-card">
        <h1 className="auth-title">🩺 CXR MedGamma</h1>
        <h2 className="auth-subtitle">Register</h2>

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

        <button className="auth-btn" onClick={registerUser}>
          Register
        </button>

        <p className="switch-text">
          Already have an account?{" "}
          <span className="switch-link" onClick={() => nav("/")}>
            Login
          </span>
        </p>
      </div>
    </div>
  );
}

export default Register;
