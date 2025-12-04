import API from "../api";
import { useEffect, useState, useContext } from 'react';
import { AuthContext } from "../context/AuthContext";
import { Navigate } from "react-router-dom";
import "./Watchlist.css";

// --- New Sub-Component for individual cards ---
const MovieCard = ({ movie, onDelete }) => {
  const [isFlipped, setIsFlipped] = useState(false);
  const [isLiked, setIsLiked] = useState(false); // New State for Like

  const handleCardClick = () => {
    setIsFlipped(!isFlipped);
  };

  const handleDeleteClick = (e) => {
    e.stopPropagation(); 
    if(window.confirm("Are you sure you want to delete this movie?")) {
        onDelete(movie._id);
    }
  };

  const handleLikeClick = (e) => {
    e.stopPropagation(); // 🛑 Stops card from flipping
    setIsLiked(!isLiked);
    // Here you would typically make an API call to save the "like" to the database
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

  useEffect(() => {
    getMovie();
  }, []);

  const getMovie = () => {
    API.get(`/auth/getMovie`)
      .then(res => {
        console.log(res.data);
        setMovies(res.data.movies);
      })
      .catch(err => console.log(err));
  };

  const deleteMovie = (id) => {
    API.delete(`/auth/deleteMovie/${id}`)
      .then((res) => {
        console.log(res.data);
        getMovie(); // Refresh list after delete
      })
      .catch((err) => console.log(err));
  };

  return (
    <>
      {user ? (
        <div className="movie-list">
          {movies.map((movie, index) => (
            // We pass the movie data and the delete function down as props
            <MovieCard 
              key={movie._id || index} 
              movie={movie} 
              onDelete={deleteMovie} 
            />
          ))}
        </div>
      ) : (
        <Navigate to="/" />
      )}
    </>
  );
}

export default Watchlist;