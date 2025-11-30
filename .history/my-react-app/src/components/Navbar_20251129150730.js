import { useNavigate } from "react-router-dom";
import "./Navbar.css";

function Navbar() {
  const nav = useNavigate();

  const logout = () => {
    localStorage.removeItem("email");
    nav("/");
  };

  return (
    <div className="navbar premium-fade">
      <div className="nav-left">
        🩺 <span>CXR MedGamma</span>
      </div>

      <div className="nav-right">
        <a className="nav-btn" href="https://github.com" target="_blank" rel="noreferrer">GitHub</a>
        <button className="logout-btn" onClick={logout}>Logout</button>
      </div>
    </div>
  );
}

export default Navbar;
