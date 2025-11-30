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
      const res = await axios.post(`${API_URL}/api/auth/login`, {
        email,
        password,
      });

      localStorage.setItem("email", email);

      if (res.data.role === "doctor") nav("/doctor");
      else nav("/user");
    } catch (err) {
      alert("Invalid credentials");
    }
  };

  return (
    <div className="auth-container fade">
      <div className="auth-card slide-up">
        <h1 className="logo-title">🩺 CXR MedGamma</h1>
        <h2>Login</h2>

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

        <button className="auth-btn" onClick={loginUser}>
          Login
        </button>

        <p className="switch-text">
          Don't have an account?{" "}
          <span onClick={() => nav("/register")} className="link-text">
            Register
          </span>
        </p>
      </div>
    </div>
  );
}

export default Login;
