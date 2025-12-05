import { useContext } from "react";
// Import NavLink instead of Link to handle active styles
import { NavLink } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";
import { useTheme } from "../context/ThemeContext.jsx";
import "./Navbar.css";

export default function Navbar() {
  const { user, logout } = useContext(AuthContext);
  const { darkMode, toggleDarkMode } = useTheme();

  return (
    <nav className="navbar">
      <span className="logo">Movies Watchlist</span>

      {/* Centered navigation links */}
      <ul>
        {/* Use NavLink for all links. The "end" prop on Home is important! */}
        <li><NavLink to="/" end>Home</NavLink></li>
        {user ? (
          <>
            <li><NavLink to="/profile">Profile</NavLink></li>
            <li><NavLink to="/addmovies">Add movies</NavLink></li>
            <li><NavLink to="/watchlist">Watchlist</NavLink></li>
            <li><NavLink to="/recommendations">AI Recommendations</NavLink></li>
            <li><NavLink to="/favorites">Favorites</NavLink></li>
          </>
        ) : (
          <>
            <li><NavLink to="/login">Login</NavLink></li>
            <li><NavLink to="/signup">Sign up</NavLink></li>
          </>
        )}
      </ul>

      {/* Group all actions (toggle, buttons) on the right side */}
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
        {user && (
          <button className="auth-btn" onClick={logout}>
            Logout
          </button>
        )}
      </div>
    </nav>
  );
}