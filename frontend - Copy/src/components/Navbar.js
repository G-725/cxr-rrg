import { Link, useNavigate } from "react-router-dom";
import "./navbar.css";

function Navbar() {
  const nav = useNavigate();

  const logout = () => {
    localStorage.removeItem("email");
    nav("/");
  };

  return (
    <nav className="nav">
      {/* LEFT LOGO */}
      <div className="nav-left">
        <span className="brand-icon">🩺</span>
        <span className="brand-name">CXR MedGamma</span>
      </div>

      {/* RIGHT LINKS */}
      <div className="nav-right">
        <Link className="nav-link" to="/about">
          About
        </Link>

        <a
          className="nav-link"
          href="https://github.com/G-725/cxr-rrg"
          target="_blank"
          rel="noreferrer"
        >
          GitHub
        </a>

        <button className="logout-btn" onClick={logout}>
          Logout
        </button>
      </div>
    </nav>
  );
}

export default Navbar;
