import API from "../api";
import { useEffect, useMemo, useState, useContext } from "react";
import { AuthContext } from "../context/AuthContext";
import { Navigate } from "react-router-dom";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import ConfirmModal from "../components/ConfirmModal";
import MoveMoviesModal from "../components/MoveMoviesModal";
import FolderFilter from "../components/FolderFilter";
import "./Watchlist.css";
import { Trash2, Heart, Folder } from "lucide-react";
import useMovieSelection from "../hooks/useMovieSelection";

// --- New Sub-Component for individual cards ---
const MovieCard = ({
  movie,
  onDeleteClick,
  isSelectionMode,
  isSelected,
  onSelect,
}) => {
  const [isFlipped, setIsFlipped] = useState(false);
  const { likedMovies, setLikedMovies } = useContext(AuthContext);

  const handleCardClick = () => {
    if (isSelectionMode) {
      onSelect();
    } else {
      setIsFlipped(!isFlipped);
    }
  };

  const localId = `${movie.title.trim().toLowerCase()}#${movie.director.trim().toLowerCase()}`;

  const isLiked = likedMovies.some((m) => m.localId === localId);

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

      toast.info("Removed from Favorites");

      setLikedMovies((prev) => prev.filter((m) => m.localId !== localId));
      return;
    }

    await API.post(`/auth/like/${movie._id}`, {
      folderId: movie.folderId || undefined,
    });
    toast.success("Added to Favorites");
    const newLiked = {
      localId,
      title: movie.title,
      poster: movie.poster,
      review: "",
      folderId: movie.folderId || null,
    };

    setLikedMovies((prev) => [...prev, newLiked]);
  };

  return (
    <div
      className={`flip-card ${isFlipped ? "flipped" : ""} ${isSelected ? "selected-glow" : ""}`}
      onClick={handleCardClick}
    >
      <div className="flip-card-inner">
        {/* --- ABSOLUTE CHECKBOX (Top Right) --- */}
        {isSelectionMode && (
          <div
            className="selection-overlay"
            onClick={(e) => e.stopPropagation()}
          >
            <input
              type="checkbox"
              className="card-main-checkbox"
              checked={isSelected}
              onChange={onSelect}
              hidden
            />
          </div>
        )}

        {/* Front */}
        <div className="flip-card-front" title="click to see details">
          <img src={movie.poster} alt={movie.title} />
        </div>

        {/* Back */}
        <div className="flip-card-back" title="click to see poster">
          {/* --- LIKE ICON BUTTON (Top Left) --- */}
          <button
            className="like-icon-btn"
            onClick={handleLikeClick}
            title="Like Movie"
          >
            {isLiked ? <Heart fill="#ef4444" stroke="#ef4444" /> : <Heart />}
          </button>

          {/* --- TRASH ICON BUTTON (Top Right) --- */}
          <button
            className="delete-icon-btn"
            onClick={handleDeleteClick}
            title="Delete Movie"
          >
            <Trash2 />
          </button>

          <h3 className="card-title">{movie.title}</h3>

          <div className="card-details">
            <p>
              <strong>Director:</strong> {movie.director}
            </p>
            <p>
              <strong>Actors:</strong> {movie.actors}
            </p>
            <p>
              <strong>IMDb:</strong> {movie.imdb}
            </p>
            <p>{movie.plot}</p>
          </div>
        </div>
      </div>
    </div>
  );
};

const WatchlistSkeletonCards = ({ count = 6 }) => (
  <>
    {Array.from({ length: count }).map((_, idx) => (
      <div key={idx} className="flip-card skeleton-card" aria-hidden="true">
        <div className="flip-card-inner">
          <div className="flip-card-front skeleton-face">
            <div className="watchlist-skeleton-shimmer" />
          </div>
        </div>
      </div>
    ))}
  </>
);

// --- Main Watchlist Component ---
export default function Watchlist() {
  const [movies, setMovies] = useState([]);
  const [isloading, setIsLoading] = useState(false);
  const [folderFilter, setFolderFilter] = useState("all");
  const { user, userFolders } = useContext(AuthContext);

  const visibleMovies = useMemo(() => {
    if (folderFilter === "all") {
      return movies;
    }

    if (folderFilter === "unassigned") {
      return movies.filter((movie) => !movie.folderId);
    }

    return movies.filter((movie) => movie.folderId === folderFilter);
  }, [movies, folderFilter]);

  const {
    isSelectionMode,
    selectedIds,
    toggleSelectionMode,
    toggleSelect,
    handleSelectAll,
    isSelected,
  } = useMovieSelection(visibleMovies);

  const [modalConfig, setModalConfig] = useState({
    isOpen: false,
    movieId: null,
    movieTitle: "",
  });
  const [isDeleting, setIsDeleting] = useState(false);

  const [moveModalConfig, setMoveModalConfig] = useState({
    isOpen: false,
  });

  useEffect(() => {
    const fetchMovies = async () => {
      setIsLoading(true);
      try {
        const res = await API.get(`/auth/getMovie`);
        setMovies(res.data.movies);
      } catch (err) {
        console.error("Error fetching movies:", err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchMovies();
  }, []);

  const initiateDelete = (movie) => {
    setModalConfig({
      isOpen: true,
      movieId: movie._id,
      movieTitle: movie.title,
    });
  };

  const handleDeleteSelected = async () => {
    if (selectedIds.length === 0) {
      toast.warning("Please select movies to delete");
      return;
    }

    setModalConfig({
      isOpen: true,
      movieId: "bulk",
      movieTitle: `${selectedIds.length} movie${selectedIds.length > 1 ? "s" : ""}`,
    });
  };

  const confirmDelete = async () => {
    if (!modalConfig.movieId) return;

    setIsDeleting(true);

    try {
      // Handle bulk delete
      if (modalConfig.movieId === "bulk") {
        await API.delete(`/auth/delete/items`, { data: { movieIds: selectedIds } });
        setMovies((prev) =>
          prev.filter((movie) => !selectedIds.includes(movie._id))
        );
        toast.info(`Removed ${selectedIds.length} movie${selectedIds.length > 1 ? "s" : ""} from Watchlist`);
        toggleSelectionMode();
      } else {
        // Handle single delete
        await API.delete(`/auth/deleteMovie/${modalConfig.movieId}`);
        setMovies((prev) =>
          prev.filter((movie) => movie._id !== modalConfig.movieId),
        );
        toast.info("Removed from Watchlist");
      }
    } catch (err) {
      console.error("Error deleting movie:", err);
      toast.error("Failed to delete movie");
    } finally {
      setIsDeleting(false);
      // Close modal
      setModalConfig({ isOpen: false, movieId: null, movieTitle: "" });
    }
  };

  const initiateMove = () => {
    if (selectedIds.length === 0) {
      toast.warning("Please select movies to move");
      return;
    }

    setMoveModalConfig({
      isOpen: true,
    });
  };

  const handleMoveSuccess = async () => {
    // Refresh movies after successful move
    try {
      const res = await API.get(`/auth/getMovie`);
      setMovies(res.data.movies);
      toggleSelectionMode(); // Exit selection mode
    } catch (err) {
      console.error("Error refreshing movies:", err);
    }
  };

  if (!user) return <Navigate to="/login" />;

  const activeFolderId =
    folderFilter === "all" || folderFilter === "unassigned"
      ? null
      : folderFilter;

  return (
    <div className="watchlist-container">
      {movies.length > 0 && (
        <div className="watchlist-controls-bar">
          <h1 className="watchlist-header">🎬 Your Watchlist</h1>
          <div className="selection-buttons">
            <FolderFilter
              folders={userFolders}
              value={folderFilter}
              onChange={setFolderFilter}
            />

            <button
              className={`action-btn ${isSelectionMode ? "cancel-btn" : "select-btn"}`}
              onClick={toggleSelectionMode}
            >
              {isSelectionMode ? "Cancel" : "Select"}
            </button>

            {isSelectionMode && (
              <button
                className="action-btn select-all"
                onClick={handleSelectAll}
              >
                {selectedIds.length === visibleMovies.length
                  ? "Deselect All"
                  : "Select All"}
              </button>
            )}

            <div className="action-wrapper show">
              <button 
                className="folder-btn" 
                title="Move to Folder"
                onClick={initiateMove}
                disabled={selectedIds.length === 0}
              >
                <div className="icon-container">
                  <Folder size={20} strokeWidth={2.5} />
                  <span className="folder-badge">{selectedIds.length}</span>
                </div>
                <span className="btn-label">Move</span>
              </button>

              <button className="delete-btn" title="Delete selected" onClick={handleDeleteSelected}>
                <div className="icon-container">
                  <Trash2 size={20} strokeWidth={2.5} />
                  <span className="delete-badge">{selectedIds.length}</span>
                </div>
                <span className="btn-label">Delete</span>
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="movie-list">
        {isloading ? (
          <WatchlistSkeletonCards />
        ) : visibleMovies.length === 0 ? (
          <div className="empty-state">
            <p>
              {folderFilter === "all"
                ? "Your watchlist is empty."
                : folderFilter === "unassigned"
                  ? "No unassigned movies found."
                  : "No movies found in this folder."}
            </p>
          </div>
        ) : (
          visibleMovies.map((movie) => (
            <MovieCard
              key={movie._id}
              movie={movie}
              onDeleteClick={initiateDelete}
              isSelectionMode={isSelectionMode}
              isSelected={isSelected(movie._id)}
              onSelect={() => toggleSelect(movie._id)}
            />
          ))
        )}
      </div>

      <ConfirmModal
        isOpen={modalConfig.isOpen}
        title="Remove Movie?"
        message={`Are you sure you want to remove "${modalConfig.movieTitle}" from your watchlist?`}
        onClose={() => setModalConfig({ ...modalConfig, isOpen: false })}
        onConfirm={confirmDelete}
        isProcessing={isDeleting}
      />

      <MoveMoviesModal
        isOpen={moveModalConfig.isOpen}
        onClose={() => setMoveModalConfig({ isOpen: false })}
        folders={userFolders}
        selectedMovieIds={selectedIds}
        selectedLikedIds={[]}
        currentFolderId={activeFolderId}
        onSuccess={handleMoveSuccess}
      />
    </div>
  );
}
