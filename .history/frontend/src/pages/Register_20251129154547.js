import { useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import "../auth.css";

function Register() {
  const nav = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const registerUser = async () => {
    try {
      await axios.post("http://127.0.0.1:5000/api/auth/register", {
        email,
        password,
      });

      alert("Registered Successfully!");
      nav("/");
    } catch (err) {
      alert("Registration failed");
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <h1 className="auth-title">🩺 CXR MedGamma</h1>
        <h2 className="form-title">Register</h2>

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
          <span className="link" onClick={() => nav("/")}>
            Login
          </span>
        </p>
      </div>
    </div>
  );
}

export default Register;
