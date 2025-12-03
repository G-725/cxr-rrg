import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ThemeProvider } from "./context/ThemeContext";
import Login from "./pages/Login";
import Register from "./pages/Register";
import UserDashboard from "./pages/UserDashboard";
import Welcome from "./pages/Welcome";
import History from "./pages/History";
import Features from "./pages/Features";

function App() {
  return (
    <ThemeProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Welcome />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/dashboard" element={<UserDashboard />} />
          <Route path="/history" element={<History />} />
          <Route path="/features" element={<Features />} />
        </Routes>
      </BrowserRouter>
    </ThemeProvider>
  );
}

export default App;
