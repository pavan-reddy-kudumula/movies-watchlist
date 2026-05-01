import React, { useEffect, useState, useContext } from "react";
import API from "../api";
import { AuthContext } from "../context/AuthContext";
import { Navigate } from "react-router-dom";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import ConfirmModal from "../components/ConfirmModal";
import MoveMoviesModal from "../components/MoveMoviesModal";
import FolderFilter from "../components/FolderFilter";
import "./LikedMovies.css";
import { useMemo } from "react";
import useMovieSelection from "../hooks/useMovieSelection";
import { Folder, Trash2 } from "lucide-react";

// --- Sub-Component: Individual Liked Card ---
const LikedMovieCard = ({
  movie,
  onRemoveClick,
  onUpdateReview,
  isSelectionMode,
  isSelected,
  onSelect,
}) => {
  const [isFlipped, setIsFlipped] = useState(false);
  const [review, setReview] = useState(movie.review || "");

  useEffect(() => {
    setReview(movie.review || "");
  }, [movie.review]);

  const handleCardClick = () => {
    if (isSelectionMode) {
      onSelect();
    } else {
      setIsFlipped(!isFlipped);
    }
  };

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
        {/* FRONT: Poster Only */}
        <div className="flip-card-front">
          <img src={movie.poster} alt={movie.title} />
        </div>

        {/* BACK: Title + Editable Review */}
        <div className="flip-card-back">
          {/* Delete Icon Top Right */}
          <button
            className="delete-like-btn"
            onClick={handleRemove}
            title="Remove from Favorites"
          >
            <Trash2 />
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

const LikedMoviesSkeletonCards = ({ count = 6 }) => (
  <>
    {Array.from({ length: count }).map((_, idx) => (
      <div key={idx} className="flip-card skeleton-card" aria-hidden="true">
        <div className="flip-card-inner">
          <div className="flip-card-front skeleton-face">
            <div className="liked-skeleton-shimmer" />
          </div>
        </div>
      </div>
    ))}
  </>
);

// --- Main Page Component ---
function LikedMovies() {
  const { user, loading, likedMovies, setLikedMovies, userFolders } =
    useContext(AuthContext);

  const [folderFilter, setFolderFilter] = useState("all");

  const visibleLikedMovies = useMemo(() => {
    if (folderFilter === "all") {
      return likedMovies;
    }

    if (folderFilter === "unassigned") {
      return likedMovies.filter((movie) => !movie.folderId);
    }

    return likedMovies.filter((movie) => movie.folderId === folderFilter);
  }, [likedMovies, folderFilter]);

  const [modalConfig, setModalConfig] = useState({
    isOpen: false,
    localId: null,
    movieTitle: "",
  });
  const [isDeleting, setIsDeleting] = useState(false);

  const [moveModalConfig, setMoveModalConfig] = useState({
    isOpen: false,
  });

  const {
    isSelectionMode,
    selectedIds,
    toggleSelectionMode,
    toggleSelect,
    handleSelectAll,
    isSelected,
  } = useMovieSelection(visibleLikedMovies);

  const initiateRemove = (movie) => {
    setModalConfig({
      isOpen: true,
      localId: movie.localId,
      movieTitle: movie.title,
    });
  };

  const handleDeleteSelected = () => {
    if (selectedIds.length === 0) {
      toast.warning("Please select movies to delete");
      return;
    }

    setModalConfig({
      isOpen: true,
      localId: "bulk",
      movieTitle: `${selectedIds.length} movie${selectedIds.length > 1 ? "s" : ""}`,
    });
  };

  const confirmRemove = async () => {
    if (!modalConfig.localId) return;

    setIsDeleting(true);

    try {
      // Handle bulk delete
      if (modalConfig.localId === "bulk") {
        await API.delete(`/auth/like/delete/items`, { data: { movieIds: selectedIds } });
        setLikedMovies((prev) =>
          prev.filter((m) => !selectedIds.includes(m.localId))
        );
        toast.info(`Removed ${selectedIds.length} movie${selectedIds.length > 1 ? "s" : ""} from Favorites`);
        toggleSelectionMode();
      } else {
        // Handle single delete
        const safeId = encodeURIComponent(modalConfig.localId);
        await API.delete(`/auth/like/${safeId}`);
        setLikedMovies((prev) =>
          prev.filter((m) => m.localId !== modalConfig.localId),
        );
        toast.info("Movie removed from favorites");
      }
    } catch (err) {
      console.error(err);
      toast.error("Failed to remove movie");
    } finally {
      setIsDeleting(false);
      setModalConfig({ isOpen: false, localId: null, movieTitle: "" });
    }
  };

  const handleUpdateReview = async (localId, reviewText) => {
    try {
      const safeId = encodeURIComponent(localId);
      await API.patch(`/auth/like/${safeId}/review`, { review: reviewText });

      setLikedMovies((prev) =>
        prev.map((m) =>
          m.localId === localId ? { ...m, review: reviewText } : m,
        ),
      );

      toast.success("Review updated! 📝");
    } catch (err) {
      console.error(err);
      toast.error("Failed to update review");
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
    // Refresh liked movies after successful move
    try {
      const res = await API.get(`/auth/liked`);
      setLikedMovies(res.data);
      toggleSelectionMode(); // Exit selection mode
    } catch (err) {
      console.error("Error refreshing liked movies:", err);
    }
  };

  if (!user) return <Navigate to="/login" />;

  return (
    <div className="liked-movies-container">
      {likedMovies.length > 0 && (
        <div className="liked-movies-controls-bar">
          <h1 className="liked-header">❤️ Your Favorites</h1>
          <div className="selection-buttons">
            <FolderFilter
              folders={userFolders}
              value={folderFilter}
              onChange={setFolderFilter}
            />

            <button
              className={`action-btn select-btn`}
              onClick={toggleSelectionMode}
            >
              {isSelectionMode ? "Cancel" : "Select"}
            </button>

            {isSelectionMode && (
              <button
                className="action-btn select-all"
                onClick={handleSelectAll}
              >
                {selectedIds.length === visibleLikedMovies.length
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

              <button
                className="delete-btn"
                title="Delete selected"
                onClick={handleDeleteSelected}
                disabled={selectedIds.length === 0}
              >
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

      <div className="liked-movie-list">
        {loading ? (
          <LikedMoviesSkeletonCards />
        ) : visibleLikedMovies.length === 0 ? (
          <div className="empty-state">
            <p>
              {folderFilter === "all"
                ? "You haven't liked any movies yet."
                : folderFilter === "unassigned"
                  ? "No unassigned favorites found."
                  : "No favorites found in this folder."}
            </p>
          </div>
        ) : (
          visibleLikedMovies.map((movie) => (
            <LikedMovieCard
              key={movie.localId}
              movie={movie}
              onRemoveClick={initiateRemove}
              onUpdateReview={handleUpdateReview}
              isSelectionMode={isSelectionMode}
              isSelected={isSelected(movie.localId)}
              onSelect={() => toggleSelect(movie.localId)}
            />
          ))
        )}
      </div>

      <ConfirmModal
        isOpen={modalConfig.isOpen}
        title="Remove Favorite?"
        message={`Are you sure you want to remove "${modalConfig.movieTitle}" from your favorites?`}
        onClose={() => setModalConfig({ ...modalConfig, isOpen: false })}
        onConfirm={confirmRemove}
        isProcessing={isDeleting}
      />

      <MoveMoviesModal
        isOpen={moveModalConfig.isOpen}
        onClose={() => setMoveModalConfig({ isOpen: false })}
        folders={userFolders}
        selectedMovieIds={[]}
        selectedLikedIds={selectedIds}
        currentFolderId={
          folderFilter === "all" || folderFilter === "unassigned"
            ? null
            : folderFilter
        }
        onSuccess={handleMoveSuccess}
      />
    </div>
  );
}

export default LikedMovies;
