import React, { useEffect, useState, useContext } from 'react';
import API from '../api';
import { AuthContext } from '../context/AuthContext';
import { Navigate } from 'react-router-dom';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import './LikedMovies.css';

// --- Sub-Component: Individual Liked Card ---
const LikedMovieCard = ({ movie, onRemove, onUpdateReview }) => {
  const [isFlipped, setIsFlipped] = useState(false);
  const [review, setReview] = useState(movie.review || "");

  useEffect(() => {
    setReview(movie.review || "");
  }, [movie.review]);

  // Toggle Flip
  const handleCardClick = () => {
    setIsFlipped(!isFlipped);
  };

  // Handle Review Text Change
  const handleReviewChange = (e) => {
    setReview(e.target.value);
  };

  // Save Review to Backend
  const handleSave = (e) => {
    e.stopPropagation(); // 🛑 Don't flip card
    onUpdateReview(movie.localId, review);
  };

  // Remove Movie
  const handleRemove = (e) => {
    e.stopPropagation(); // 🛑 Don't flip card
    if (window.confirm("Remove this movie from your favorites?")) {
      onRemove(movie.localId);
    }
  };

  return (
    <div className={`flip-card ${isFlipped ? "flipped" : ""}`} onClick={handleCardClick}>
      <div className="flip-card-inner">
        
        {/* FRONT: Poster Only */}
        <div className="flip-card-front">
          <img src={movie.poster} alt={movie.title} />
        </div>

        {/* BACK: Title + Editable Review */}
        <div className="flip-card-back">
          {/* Delete Icon Top Right */}
          <button className="delete-like-btn" onClick={handleRemove} title="Remove from Favorites">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path><line x1="10" y1="11" x2="10" y2="17"></line><line x1="14" y1="11" x2="14" y2="17"></line></svg>
          </button>

          <h3>{movie.title}</h3>

          <textarea 
            className="review-textarea"
            placeholder="Write your review here..."
            value={review}
            onChange={handleReviewChange}
            onClick={(e) => e.stopPropagation()} // 🛑 Allows typing without flipping
          />

          <button className="save-btn" onClick={handleSave}>
            Save Review
          </button>
        </div>
      </div>
    </div>
  );
};

// --- Main Page Component ---
function LikedMovies() {
    const { user, likedMovies, setLikedMovies } = useContext(AuthContext);
    
    if (!user) return <Navigate to="/login" />;

    const handleRemoveMovie = async (localId) => {
    try {
        const safeId = encodeURIComponent(localId);
        await API.delete(`/auth/like/${safeId}`);
        
        setLikedMovies(prev => prev.filter(m => m.localId !== localId));

        toast.info("Movie removed from favorites");
    } catch (err) {
        console.error(err);
        toast.error("Failed to remove movie");
    }
    };

    const handleUpdateReview = async (localId, reviewText) => {
    try {
        const safeId = encodeURIComponent(localId);
        await API.patch(`/auth/like/${safeId}/review`, { review: reviewText });

        setLikedMovies(prev =>
        prev.map(m =>
            m.localId === localId ? { ...m, review: reviewText } : m
        )
        );

        toast.success("Review updated! 📝");
    } catch (err) {
        console.error(err);
        toast.error("Failed to update review");
    }
    };


  return (
    <div className="liked-container">
      <h1>❤️ Your Favorites</h1>

      {likedMovies.length === 0 ? (
        <div className="empty-state">
          <p>You haven't liked any movies yet.</p>
        </div>
      ) : (
        <div className="liked-grid">
          {likedMovies.map((movie) => (
            <LikedMovieCard 
              key={movie.localId} 
              movie={movie} 
              onRemove={handleRemoveMovie}
              onUpdateReview={handleUpdateReview}
            />
          ))}
        </div>
      )}
      <ToastContainer position="bottom-right" theme="colored" autoClose={2000} />
    </div>
  );
}

export default LikedMovies;