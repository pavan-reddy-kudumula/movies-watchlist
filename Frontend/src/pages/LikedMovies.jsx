import React, { useEffect, useState, useContext } from 'react';
import API from '../api';
import { AuthContext } from '../context/AuthContext';
import { Navigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import ConfirmModal from "../components/ConfirmModal";
import './LikedMovies.css';

// --- Sub-Component: Individual Liked Card ---
const LikedMovieCard = ({ movie, onRemoveClick, onUpdateReview }) => {
  const [isFlipped, setIsFlipped] = useState(false);
  const [review, setReview] = useState(movie.review || "");

  useEffect(() => {
    setReview(movie.review || "");
  }, [movie.review]);

  const handleCardClick = () => setIsFlipped(!isFlipped);
  const handleReviewChange = (e) => setReview(e.target.value);

  const handleSave = (e) => {
    e.stopPropagation(); 
    onUpdateReview(movie.localId, review);
  };

  const handleRemove = (e) => {
    e.stopPropagation(); 
    onRemoveClick(movie);
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

    const [modalConfig, setModalConfig] = useState({
      isOpen: false,
      localId: null,
      movieTitle: ""
    });
    
    if (!user) return <Navigate to="/login" />;

    const initiateRemove = (movie) => {
      setModalConfig({
        isOpen: true,
        localId: movie.localId,
        movieTitle: movie.title
      });
    };

    const confirmRemove = async () => {
      if (!modalConfig.localId) return;

      try {
          const safeId = encodeURIComponent(modalConfig.localId);
          await API.delete(`/auth/like/${safeId}`);
          setLikedMovies(prev => prev.filter(m => m.localId !== modalConfig.localId));
          toast.info("Movie removed from favorites");
      } catch (err) {
          console.error(err);
          toast.error("Failed to remove movie");
      } finally {
          setModalConfig({ isOpen: false, localId: null, movieTitle: "" });
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
    <div className="liked-movie-list">
      
      <h1 className="liked-header">❤️ Your Favorites</h1>

      {likedMovies.length === 0 ? (
        <div className="empty-state">
          <p>You haven't liked any movies yet.</p>
        </div>
      ) : (
        likedMovies.map((movie) => (
          <LikedMovieCard 
            key={movie.localId} 
            movie={movie} 
            onRemoveClick={initiateRemove}
            onUpdateReview={handleUpdateReview}
          />
        ))
      )}

      <ConfirmModal 
        isOpen={modalConfig.isOpen}
        title="Remove Favorite?"
        message={`Are you sure you want to remove "${modalConfig.movieTitle}" from your favorites?`}
        onClose={() => setModalConfig({ ...modalConfig, isOpen: false })}
        onConfirm={confirmRemove}
      />
    </div>
  );
}

export default LikedMovies;