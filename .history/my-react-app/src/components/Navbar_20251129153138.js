import { useNavigate } from "react-router-dom";
import "./Navbar.css";

function Navbar() {
  const nav = useNavigate();

  const logout = () => {
    localStorage.removeItem("email");
    nav("/");
  };

  return (
    <div className="navbar">
      <div className="nav-left">
        🩺 CXR MedGamma
      </div>

      <div className="nav-right">
        <button className="nav-btn" onClick={() => nav("/about")}>About</button>

        <button
          className="nav-btn"
          onClick={() => window.open("https://github.com", "_blank")}
        >
          GitHub
        </button>

        <button className="logout-btn" onClick={logout}>
          Logout
        </button>
      </div>
    </div>
  );
}

export default Navbar;
