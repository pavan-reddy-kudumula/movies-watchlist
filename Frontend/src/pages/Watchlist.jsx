import API from "../api";
import { useEffect, useState, useContext } from 'react';
import { AuthContext } from "../context/AuthContext";
import { Navigate } from "react-router-dom";
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import ConfirmModal from "../components/ConfirmModal"
import "./Watchlist.css";

// --- New Sub-Component for individual cards ---
const MovieCard = ({ movie, onDeleteClick }) => {
  const [isFlipped, setIsFlipped] = useState(false);
  const { likedMovies, setLikedMovies } = useContext(AuthContext);

  const handleCardClick = () => {
    setIsFlipped(!isFlipped);
  };

  const localId = `${movie.title.trim().toLowerCase()}#${movie.director.trim().toLowerCase()}`;

  const isLiked = likedMovies.some(m => m.localId === localId);

  const handleDeleteClick = (e) => {
    e.stopPropagation(); 
    onDeleteClick(movie);
  };

  const handleLikeClick = async (e) => {
    e.stopPropagation(); // 🛑 Stops card from flipping
    if (isLiked) {
      // UNLIKE
      const safeId = encodeURIComponent(localId);
      await API.delete(`/auth/like/${safeId}`);

      toast.info("Removed from Favorites")

      setLikedMovies(prev => prev.filter(m => m.localId !== localId));
      return;
    } 

    await API.post(`/auth/like/${movie._id}`);
    toast.success("Added to Favorites")
    const newLiked = {
      localId,
      title: movie.title,
      poster: movie.poster,
      review: ""
    };

    setLikedMovies(prev => [...prev, newLiked]);

  };

  return (
    <div 
      className={`flip-card ${isFlipped ? "flipped" : ""}`} 
      onClick={handleCardClick}
    >
      <div className="flip-card-inner">
        {/* Front */}
        <div className="flip-card-front" title="click to see details">
          <img src={movie.poster} alt={movie.title} />
        </div>

        {/* Back */}
        <div className="flip-card-back" title="click to see poster">
          
          {/* --- LIKE ICON BUTTON (Top Left) --- */}
          <button className="like-icon-btn" onClick={handleLikeClick} title="Like Movie">
            <svg 
              xmlns="http://www.w3.org/2000/svg" 
              width="24" 
              height="24" 
              viewBox="0 0 24 24" 
              // If liked, fill with red. If not, transparent (outline only)
              fill={isLiked ? "#ef4444" : "none"} 
              // If liked, stroke is red. If not, stroke is grey (outline)
              stroke={isLiked ? "#ef4444" : "currentColor"} 
              strokeWidth="2" 
              strokeLinecap="round" 
              strokeLinejoin="round"
            >
              <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
            </svg>
          </button>

          {/* --- TRASH ICON BUTTON (Top Right) --- */}
          <button className="delete-icon-btn" onClick={handleDeleteClick} title="Delete Movie">
            <svg 
              xmlns="http://www.w3.org/2000/svg" 
              width="20" 
              height="20" 
              viewBox="0 0 24 24" 
              fill="none" 
              stroke="currentColor" 
              strokeWidth="2" 
              strokeLinecap="round" 
              strokeLinejoin="round"
            >
              <polyline points="3 6 5 6 21 6"></polyline>
              <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
              <line x1="10" y1="11" x2="10" y2="17"></line>
              <line x1="14" y1="11" x2="14" y2="17"></line>
            </svg>
          </button>

          <h3 className="card-title">{movie.title}</h3>
          
          <div className="card-details">
            <p><strong>Director:</strong> {movie.director}</p>
            <p><strong>Actors:</strong> {movie.actors}</p>
            <p><strong>IMDb:</strong> {movie.imdb}</p>
            <p>{movie.plot}</p>
          </div>
        </div>
      </div>
    </div>
  );
};

// --- Main Watchlist Component ---
function Watchlist() {
  const [movies, setMovies] = useState([]);
  const { user } = useContext(AuthContext);

  const [modalConfig, setModalConfig] = useState({
    isOpen: false,
    movieId: null,
    movieTitle: ""
  });

  useEffect(() => {
    // We define the async function inside useEffect to handle the promise
    const fetchMovies = async () => {
      try {
        const res = await API.get(`/auth/getMovie`);
        setMovies(res.data.movies);
      } catch (err) {
        console.error("Error fetching movies:", err);
      }
    };

    fetchMovies();
  }, []);

  const initiateDelete = (movie) => {
    setModalConfig({
      isOpen: true,
      movieId: movie._id,
      movieTitle: movie.title
    });
  };

  const confirmDelete = async () => {
    if (!modalConfig.movieId) return;
    
    try {
      await API.delete(`/auth/deleteMovie/${modalConfig.movieId}`);
      setMovies(prev => prev.filter(movie => movie._id !== modalConfig.movieId));
      toast.info("Removed from Watchlist");
    } catch (err) {
      console.error("Error deleting movie:", err);
      toast.error("Failed to delete movie");
    } finally {
      // Close modal
      setModalConfig({ isOpen: false, movieId: null, movieTitle: "" });
    }
  };

  if (!user) return <Navigate to="/" />;

  return (
    <div className="movie-list">

      <h1 className="watchlist-header">🎬 Your Watchlist</h1>

      {movies.length === 0 && (
         <div className="empty-state">
           <p>Your watchlist is empty.</p>
         </div>
      )}

      {movies.map(movie => (
        <MovieCard 
            key={movie._id} 
            movie={movie} 
            onDeleteClick={initiateDelete}
        />
      ))}

      <ConfirmModal 
        isOpen={modalConfig.isOpen}
        title="Remove Movie?"
        message={`Are you sure you want to remove "${modalConfig.movieTitle}" from your watchlist?`}
        onClose={() => setModalConfig({ ...modalConfig, isOpen: false })}
        onConfirm={confirmDelete}
      />

      <ToastContainer position="bottom-right" theme="colored" autoClose={2000} />
    </div>
  );
}

export default Watchlist;