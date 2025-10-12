import { useContext } from "react";
import { Link } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";
import { useTheme } from "../context/ThemeContext.jsx"; //
import "./Navbar.css";

export default function Navbar() {
  const { user, logout } = useContext(AuthContext);
  const { darkMode, toggleDarkMode } = useTheme();

  return (
    <nav className="navbar">
      {/* Brand / Logo */}
      <span className="logo">Movies Watchlist</span>

      {/* Links */}
      <ul>
        {!user ? (
          <></>
        ) : (
          <>
            <li>
              <Link to="/profile">Profile</Link>
            </li>
            <li>
              <Link to="/addmovies">AddMovies</Link>
            </li>
            <li>
              <Link to="/watchlist">Watchlist</Link>
            </li>
            <li>
              <Link to="/recommendations">AI Recommendations</Link>
            </li>
            <li>
              <button className="auth-btn" onClick={logout}>
                Logout
              </button>
            </li>
          </>
        )}
      </ul>

      {/* Toggle Switch */}
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
    </nav>
  );
}