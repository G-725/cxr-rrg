import axios from "axios";
import { useState } from "react";
import { API_URL } from "../api";
import { useNavigate } from "react-router-dom";
import "../auth.css";

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
    <div className="auth-container">
      <div className="auth-card">
        <h1 className="ashom-title">🩺 CXR MedGamma</h1>
        <h2>Register</h2>

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

        <button className="auth-btn" onClick={registerUser}>
          Register
        </button>

        <p className="switch-text">
          Already have an account?{" "}
          <span className="link" onClick={() => nav("/")}>
            Login
          </span>
        </p>
      </div>
    </div>
  );
}

export default Register;
