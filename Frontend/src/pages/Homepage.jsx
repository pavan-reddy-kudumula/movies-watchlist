// HomePage.jsx
import React, { useState, useEffect } from "react";
import "./HomePage.css";

// Home ("/") route with dark/light mode toggle
export default function HomePage() {
  const [darkMode, setDarkMode] = useState(() => {
    // Load preference from localStorage if available
    return localStorage.getItem("darkMode") === "true";
  });

  useEffect(() => {
    localStorage.setItem("darkMode", darkMode);
  }, [darkMode]);

  return (
    <div className={`homepage ${darkMode ? "dark" : "light"}`}>
      <header className="homepage-header">
        <h1 className="homepage-title">🎬 Movies Watchlist</h1>
        <button
          className="toggle-btn"
          onClick={() => setDarkMode((prev) => !prev)}
        >
          {darkMode ? "☀️ Light Mode" : "🌙 Dark Mode"}
        </button>
      </header>

      <main className="homepage-main">
        <section className="intro">
          <h2>Welcome!</h2>
          <p>
            Movies Watchlist is your personal movie companion. You can search for
            your favorite movies, add them to your watchlist, and keep track of
            what you want to watch later.
          </p>
          <p>
            The project is built with the MERN stack and uses the TMDB API to
            fetch movie data.
          </p>
        </section>

        <section className="features">
          <h2>Features</h2>
          <ul>
            <li>🔍 Search for movies easily.</li>
            <li>➕ Add movies to your personal watchlist.</li>
            <li>📌 Keep track of what you’ve already watched.</li>
            <li>🌓 Clean, modern, and responsive design.</li>
          </ul>
        </section>

        <section className="getting-started">
          <h2>Getting Started</h2>
          <p>
            To begin, sign up or log in, then start searching for movies to add
            to your watchlist.
          </p>
        </section>
      </main>

      <footer className="homepage-footer">
        <p>Made with ❤️ for movie lovers.</p>
      </footer>
    </div>
  );
}