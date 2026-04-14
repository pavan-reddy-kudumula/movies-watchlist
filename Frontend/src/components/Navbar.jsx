import { useContext, useState } from "react";
import { NavLink } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";
import { useTheme } from "../context/ThemeContext.jsx";
import "./Navbar.css";

export default function Navbar() {
  const { user, logout } = useContext(AuthContext);
  const { darkMode, toggleDarkMode } = useTheme();

  const [isOpen, setIsOpen] = useState(false);

  const toggleMenu = () => setIsOpen(!isOpen);
  const closeMenu = () => setIsOpen(false);

  return (
    <nav className="navbar">

      {/* --- HAMBURGER ICON (Visible only on mobile) --- */}
      <div className="hamburger" onClick={toggleMenu}>
        <div className="bar"></div>
        <div className="bar"></div>
        <div className="bar"></div>
      </div>

      <NavLink to="/" className="logo" onClick={closeMenu}>Movies Watchlist</NavLink>

      {/* --- NAVIGATION LINKS CONTAINER --- */}
      {/* We add the 'active' class if menu is open */}
      <div className={`nav-links-container ${isOpen ? "active" : ""}`}>
        
        {/* Close Button inside Sidebar */}
        <div className="close-icon" onClick={toggleMenu}>&times;</div>

        <ul>
          <li><NavLink to="/" end onClick={closeMenu}>Home</NavLink></li>
          {user ? (
            <>
              <li><NavLink to="/profile" onClick={closeMenu}>Profile</NavLink></li>
              <li><NavLink to="/addmovies" onClick={closeMenu}>Add movies</NavLink></li>
              <li><NavLink to="/watchlist" onClick={closeMenu}>Watchlist</NavLink></li>
              <li><NavLink to="/recommendations" onClick={closeMenu}>AI Recommendations</NavLink></li>
              <li><NavLink to="/favorites" onClick={closeMenu}>Favorites</NavLink></li>
            </>
          ) : (
            <>
              <li><NavLink to="/login" onClick={closeMenu}>Login</NavLink></li>
              <li><NavLink to="/signup" onClick={closeMenu}>Sign up</NavLink></li>
            </>
          )}
          <li>{user && (
            <button className="auth-btn" onClick={() => { logout(); closeMenu(); }}>
              Logout
            </button>
          )}</li>
        </ul>
      </div>

      {/* --- ACTIONS (Dark Mode / Logout) --- */}
      <div className="navbar-actions">
        <div className="toggle-container">
          <span className="toggle-label">{darkMode ? "Dark" : "Light"}</span>
          <label className="toggle-switch">
            <input
              type="checkbox"
              checked={darkMode}
              onChange={toggleDarkMode}
            />
            <span className="slider"></span>
          </label>
        </div>
      </div>

      {/* --- OVERLAY (Click outside to close) --- */}
      {isOpen && <div className="overlay" onClick={toggleMenu}></div>}
    </nav>
  );
}