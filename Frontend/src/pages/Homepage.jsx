// HomePage.jsx
import React, { useContext } from 'react';
import { Link } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext'; // Import the AuthContext
import './HomePage.css';

export default function HomePage() {
  // Get the user from the context
  const { user } = useContext(AuthContext);

  return (
    <div className="home-container">
      {user ? (
        // --- LOGGED-IN VIEW ---
        <div className="logged-in-view">
          <header className="logged-in-hero">
            <h1 className="welcome-message">Welcome back, {user.username}!</h1>
            <p className="hero-subtitle">What would you like to do next?</p>
          </header>
          <div className="quick-actions">
            <Link to="/addmovies" className="action-card">
              <h3>➕ Add Movies</h3>
              <p>Search for new movies to add to your list.</p>
            </Link>
            <Link to="/watchlist" className="action-card">
              <h3>🎬 View Watchlist</h3>
              <p>See all the movies you've saved to watch later.</p>
            </Link>
          </div>
        </div>
      ) : (
        // --- LOGGED-OUT VIEW ---
        <>
          <header className="hero-section">
            <h1 className="hero-title">🎬 Your Personal Movie Companion</h1>
            <p className="hero-subtitle">
              Search, track, and manage your movie watchlist all in one place.
            </p>
            <div className="cta-buttons">
              <Link to="/signup" className="cta-button">
                Get Started
              </Link>
              <Link to="/login" className="cta-button secondary">
                Login
              </Link>
            </div>
          </header>
          <main>
            <section className="features-section">
              <h2 className="section-title">Features</h2>
              <div className="features-grid">
                <div className="feature-card">
                  <h3>🔍 Effortless Search</h3>
                  <p>Find any movie you're looking for with our powerful search.</p>
                </div>
                <div className="feature-card">
                  <h3>➕ Personal Watchlist</h3>
                  <p>Add movies to your list with a single click to watch later.</p>
                </div>
                <div className="feature-card">
                  <h3>🌓 Modern Design</h3>
                  <p>Enjoy a clean, responsive interface with a beautiful dark mode.</p>
                </div>
              </div>
            </section>
          </main>
          <footer className="home-footer">
            <p>Made with ❤️ for movie lovers.</p>
          </footer>
        </>
      )}
    </div>
  );
}