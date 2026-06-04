import React, { useEffect, useState } from "react";
import API, { getApiErrorMessage } from "../api";
import { toast } from "react-toastify";
import "./MoveMoviesModal.css";

const MoveMoviesModal = ({
  isOpen,
  onClose,
  folders,
  selectedMovieIds,
  selectedLikedIds,
  currentFolderId,
  onSuccess
}) => {
  const [selectedFolderId, setSelectedFolderId] = useState(null);
  const [isMoving, setIsMoving] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setSelectedFolderId(null);
      setIsMoving(false);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleMove = async () => {
    if (!selectedFolderId) {
      toast.warning("Please select a folder");
      return;
    }

    if (selectedFolderId === currentFolderId) {
      toast.info("Items are already in this folder");
      onClose();
      return;
    }

    setIsMoving(true);
    try {
      const payload = {
        movieIds: selectedMovieIds || [],
        likedLocalIds: selectedLikedIds || []
      };

      await API.post(
        `/auth/folders/${selectedFolderId}/items`,
        payload
      );

      toast.success("Movies moved successfully!");
      onSuccess?.();
      onClose();
    } catch (err) {
      console.error(err);
      toast.error(getApiErrorMessage(err, "Failed to move movies"));
    } finally {
      setIsMoving(false);
    }
  };

  const handleOverlayClick = (e) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <div className="modal-overlay" onClick={handleOverlayClick}>
      <div className="move-modal-content">
        <h2>Move Movies to Folder</h2>
        
        <div className="folders-list">
          {folders.map((folder) => {
            const isCurrentFolder = folder.id === currentFolderId;
            const isSelected = folder.id === selectedFolderId;

            return (
              <button
                key={folder.id}
                className={`folder-option ${isSelected ? "selected" : ""} ${
                  isCurrentFolder ? "current-folder" : ""
                }`}
                onClick={() => !isCurrentFolder && setSelectedFolderId(folder.id)}
                disabled={isCurrentFolder}
                title={isCurrentFolder ? "Items are currently in this folder" : ""}
              >
                <div className="folder-option-content">
                  <span className="folder-name">{folder.name}</span>
                  {isCurrentFolder && (
                    <span className="current-badge">Current Folder</span>
                  )}
                  {isSelected && <span className="selected-checkmark">✓</span>}
                </div>
              </button>
            );
          })}
        </div>

        <div className="modal-actions">
          <button
            className="modal-btn cancel"
            onClick={onClose}
            disabled={isMoving}
          >
            Cancel
          </button>
          <button
            className="modal-btn confirm"
            onClick={handleMove}
            disabled={isMoving || !selectedFolderId}
          >
            {isMoving ? "Moving..." : "Move"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default MoveMoviesModal;
