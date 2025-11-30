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
      alert("Registration failed.");
    }
  };

  return (
    <div className="auth-container fade">
      <div className="auth-card slide-up">
        <h1 className="logo-title">🩺 CXR MedGamma</h1>
        <h2>Register</h2>

        <input
          className="auth-input"
          placeholder="Email"
          onChange={(e) => setEmail(e.target.value)}
        />

        <input
          type="password"
          className="auth-input"
          placeholder="Password"
          onChange={(e) => setPassword(e.target.value)}
        />

        <button className="auth-btn" onClick={registerUser}>
          Register
        </button>

        <p className="switch-text">
          Already have an account?{" "}
          <span onClick={() => nav("/")} className="link-text">
            Login
          </span>
        </p>
      </div>
    </div>
  );
}

export default Register;
