import { useCallback, useContext, useEffect, useMemo, useState } from "react";
import { Navigate } from "react-router-dom";
import { toast } from "react-toastify";
import API, { getApiErrorMessage } from "../api";
import { AuthContext } from "../context/AuthContext";
import "./Folders.css";
import { Trash2, Pencil } from "lucide-react";

const defaultFolderForm = { name: "" };

function Folders() {
  const { user, likedMovies, setLikedMovies, userFolders, setUserFolders } = useContext(AuthContext);

  const [loading, setLoading] = useState(true);
  const [movies, setMovies] = useState([]);
  const [selectedFolderId, setSelectedFolderId] = useState("");
  const [selectedFolderItems, setSelectedFolderItems] = useState({
    movies: [],
    likedMovies: []
  });

  const [createForm, setCreateForm] = useState(defaultFolderForm);
  const [editingFolderId, setEditingFolderId] = useState("");
  const [editingName, setEditingName] = useState("");

  const [deleteModal, setDeleteModal] = useState({
    isOpen: false,
    folderId: "",
    folderName: ""
  });
  const [deleteItems, setDeleteItems] = useState(false);

  const [addMovieSelection, setAddMovieSelection] = useState([]);
  const [addLikedSelection, setAddLikedSelection] = useState([]);
  const [removeMovieSelection, setRemoveMovieSelection] = useState([]);
  const [removeLikedSelection, setRemoveLikedSelection] = useState([]);

  const sortFolders = useCallback(
    (list) => [...list].sort((a, b) => a.name.localeCompare(b.name)),
    []
  );

  const currentFolder = useMemo(
    () => userFolders.find((folder) => folder.id === selectedFolderId) || null,
    [userFolders, selectedFolderId]
  );

  const fetchLikedMovies = useCallback(async () => {
    const likedRes = await API.get("/auth/liked");
    const liked = likedRes.data || [];
    setLikedMovies(liked);
    return liked;
  }, [setLikedMovies]);

  const fetchWatchlistMovies = useCallback(async () => {
    const moviesRes = await API.get("/auth/getMovie");
    const fetchedMovies = moviesRes.data?.movies || [];
    setMovies(fetchedMovies);
    return fetchedMovies;
  }, []);

  const fetchFolderItems = useCallback(async (folderId) => {
    if (!folderId) {
      setSelectedFolderItems({ movies: [], likedMovies: [] });
      return;
    }

    const itemsRes = await API.get(`/auth/folders/${folderId}/items`);
    setSelectedFolderItems({
      movies: itemsRes.data?.movies || [],
      likedMovies: itemsRes.data?.likedMovies || []
    });
  }, []);

  const refreshData = useCallback(async () => {
    await Promise.all([fetchWatchlistMovies(), fetchLikedMovies()]);

    if (!userFolders.length) {
      setSelectedFolderId("");
      return;
    }

    const currentSelectionIsValid = userFolders.some(
      (folder) => folder.id === selectedFolderId
    );

    if (!selectedFolderId || !currentSelectionIsValid) {
      const preferred = userFolders.find((folder) => folder.isDefault) || userFolders[0];
      setSelectedFolderId(preferred.id);
    }
  }, [fetchLikedMovies, fetchWatchlistMovies, selectedFolderId, userFolders]);

  useEffect(() => {
    const bootstrap = async () => {
      setLoading(true);
      try {
        await refreshData();
      } catch (err) {
        console.error("Failed loading folders page", err);
        toast.error(getApiErrorMessage(err, "Failed to load folders"));
      } finally {
        setLoading(false);
      }
    };

    if (user) {
      bootstrap();
    }
  }, [refreshData, user]);

  useEffect(() => {
    if (!userFolders.length) {
      setSelectedFolderId("");
      return;
    }

    const currentSelectionIsValid = userFolders.some(
      (folder) => folder.id === selectedFolderId
    );

    if (!selectedFolderId || !currentSelectionIsValid) {
      const preferred = userFolders.find((folder) => folder.isDefault) || userFolders[0];
      setSelectedFolderId(preferred.id);
    }
  }, [selectedFolderId, userFolders]);

  useEffect(() => {
    const loadSelectedFolderItems = async () => {
      try {
        await fetchFolderItems(selectedFolderId);
      } catch (err) {
        console.error("Failed loading folder items", err);
        toast.error(getApiErrorMessage(err, "Failed to load folder items"));
      }
    };

    loadSelectedFolderItems();
  }, [fetchFolderItems, selectedFolderId]);

  const unassignedMovies = useMemo(
    () => movies.filter((movie) => !movie.folderId),
    [movies]
  );

  const unassignedLikedMovies = useMemo(
    () => likedMovies.filter((movie) => !movie.folderId),
    [likedMovies]
  );

  const toggleSelection = (value, setSelectedValues) => {
    setSelectedValues((prev) =>
      prev.includes(value) ? prev.filter((item) => item !== value) : [...prev, value]
    );
  };

  const areAllSelected = (items, key, selectedValues) => {
    const itemIds = items.map((item) => item[key]);
    return itemIds.length > 0 && itemIds.every((id) => selectedValues.includes(id));
  };

  const toggleSelectAllItems = (items, key, setSelectedValues) => {
    const itemIds = items.map((item) => item[key]);

    if (!itemIds.length) return;

    setSelectedValues((prev) => {
      const shouldClear = itemIds.every((id) => prev.includes(id));
      if (shouldClear) {
        return prev.filter((id) => !itemIds.includes(id));
      }

      return [...new Set([...prev, ...itemIds])];
    });
  };

  const handleCreateFolder = async (event) => {
    event.preventDefault();

    if (!createForm.name.trim()) {
      toast.error("Folder name is required");
      return;
    }

    try {
      const response = await API.post("/auth/folders", { name: createForm.name.trim() });
      const createdFolder = response.data?.folder;

      setCreateForm(defaultFolderForm);
      toast.success("Folder created");

      if (createdFolder?.id) {
        setUserFolders((prev) => sortFolders([...prev, createdFolder]));
        setSelectedFolderId(createdFolder.id);
      }
    } catch (err) {
      toast.error(getApiErrorMessage(err, "Could not create folder"));
    }
  };

  const startRename = (folder) => {
    setEditingFolderId(folder.id);
    setEditingName(folder.name);
  };

  const cancelRename = () => {
    setEditingFolderId("");
    setEditingName("");
  };

  const submitRename = async (folderId) => {
    if (!editingName.trim()) {
      toast.error("Folder name is required");
      return;
    }

    try {
      const response = await API.patch(`/auth/folders/${folderId}`, { name: editingName.trim() });
      const updatedFolder = response.data?.folder;

      if (updatedFolder?.id) {
        setUserFolders((prev) =>
          sortFolders(prev.map((folder) => (folder.id === folderId ? updatedFolder : folder)))
        );
      }

      toast.success("Folder renamed");
      cancelRename();
    } catch (err) {
      toast.error(getApiErrorMessage(err, "Could not rename folder"));
    }
  };

  const openDeleteModal = (folder) => {
    setDeleteItems(false);
    setDeleteModal({ isOpen: true, folderId: folder.id, folderName: folder.name });
  };

  const closeDeleteModal = () => {
    setDeleteItems(false);
    setDeleteModal({ isOpen: false, folderId: "", folderName: "" });
  };

  const confirmDeleteFolder = async () => {
    if (!deleteModal.folderId) return;

    try {
      await API.delete(`/auth/folders/${deleteModal.folderId}`, {
        params: { deleteItems }
      });
      toast.success(deleteItems ? "Folder and items deleted" : "Folder deleted");
      closeDeleteModal();

      setAddMovieSelection([]);
      setAddLikedSelection([]);
      setRemoveMovieSelection([]);
      setRemoveLikedSelection([]);

      setUserFolders((prev) => {
        const updatedFolders = prev.filter((folder) => folder.id !== deleteModal.folderId);

        if (selectedFolderId === deleteModal.folderId) {
          const preferred =
            updatedFolders.find((folder) => folder.isDefault) || updatedFolders[0] || null;
          setSelectedFolderId(preferred ? preferred.id : "");
        }

        return updatedFolders;
      });

      await Promise.all([fetchWatchlistMovies(), fetchLikedMovies()]);
    } catch (err) {
      toast.error(getApiErrorMessage(err, "Could not delete folder"));
    }
  };

  const addSelectedItemsToFolder = async () => {
    if (!selectedFolderId) {
      toast.error("Select a folder first");
      return;
    }

    if (!addMovieSelection.length && !addLikedSelection.length) {
      toast.error("Select at least one item");
      return;
    }

    try {
      await API.post(`/auth/folders/${selectedFolderId}/items`, {
        movieIds: addMovieSelection,
        likedLocalIds: addLikedSelection
      });

      toast.success("Items added to folder");
      setAddMovieSelection([]);
      setAddLikedSelection([]);

      await Promise.all([fetchWatchlistMovies(), fetchLikedMovies(), fetchFolderItems(selectedFolderId)]);
    } catch (err) {
      toast.error(getApiErrorMessage(err, "Could not add items"));
    }
  };

  const removeSelectedItemsFromFolder = async () => {
    if (!selectedFolderId) {
      toast.error("Select a folder first");
      return;
    }

    if (!removeMovieSelection.length && !removeLikedSelection.length) {
      toast.error("Select at least one item");
      return;
    }

    try {
      await API.delete(`/auth/folders/${selectedFolderId}/items`, {
        data: {
          movieIds: removeMovieSelection,
          likedLocalIds: removeLikedSelection
        }
      });

      toast.success("Items removed from folder");
      setRemoveMovieSelection([]);
      setRemoveLikedSelection([]);

      await Promise.all([fetchWatchlistMovies(), fetchLikedMovies(), fetchFolderItems(selectedFolderId)]);
    } catch (err) {
      toast.error(getApiErrorMessage(err, "Could not remove items"));
    }
  };

  if (!user) return <Navigate to="/login" />;

  if (loading) {
    return (
      <div className="folders-page">
        <h1 className="folders-title">Folders</h1>
        <p className="folders-status">Loading your folders...</p>
      </div>
    );
  }

  return (
    <div className="folders-page">
      <h1 className="folders-title">Manage Folders</h1>

      <form className="folders-create-form" onSubmit={handleCreateFolder}>
        <input
          type="text"
          placeholder="Create a new folder"
          maxLength={25}
          value={createForm.name}
          onChange={(event) => setCreateForm({ name: event.target.value })}
        />
        <button type="submit">Create</button>
      </form>

      <div className="folders-layout">
        <section className="folders-selector-panel">
          <div className="folder-selector-header">
            <select
              value={selectedFolderId}
              onChange={(e) => setSelectedFolderId(e.target.value)}
              className="folder-dropdown"
            >
              {userFolders.map((folder) => (
                <option key={folder.id} value={folder.id}>
                  {folder.name}{folder.isDefault ? " (Default)" : ""}
                </option>
              ))}
            </select>
            
            {currentFolder && !currentFolder.isDefault && (
              <div className="folder-action-buttons">
                {editingFolderId === currentFolder.id ? (
                  <>
                    <input
                      type="text"
                      value={editingName}
                      maxLength={25}
                      onChange={(event) => setEditingName(event.target.value)}
                      className="folder-edit-input"
                      placeholder="Folder name"
                    />
                    <button
                      type="button"
                      className="action-btn save-btn"
                      onClick={() => submitRename(currentFolder.id)}
                      title="Save"
                    >
                      ✓
                    </button>
                    <button
                      type="button"
                      className="action-btn cancel-btn"
                      onClick={cancelRename}
                      title="Cancel"
                    >
                      ✕
                    </button>
                  </>
                ) : (
                  <>
                    <button
                      type="button"
                      className="action-btn rename-btn"
                      onClick={() => startRename(currentFolder)}
                      title="Rename folder"
                    >
                      <Pencil size={18} />
                    </button>
                    <button
                      type="button"
                      className="action-btn delete-btn"
                      onClick={() => openDeleteModal(currentFolder)}
                      title="Delete folder"
                    >
                      <Trash2 size={18} />
                    </button>
                  </>
                )}
              </div>
            )}
          </div>
        </section>

        <section className="folders-panel">
          <h2>{currentFolder ? currentFolder.name : "Select a folder"}</h2>

          <div className="folder-items-actions">
            <button
              type="button"
              className="add-items-btn"
              onClick={addSelectedItemsToFolder}
              disabled={!selectedFolderId}
            >
              Add selected folder items
            </button>
            <button
              type="button"
              className="remove-items-btn"
              onClick={removeSelectedItemsFromFolder}
              disabled={!selectedFolderId}
            >
              Remove selected folder items
            </button>
          </div>

          <div className="items-columns">
            <div className="items-group">
              <div className="items-group-header">
                <h3>Unassigned Watchlist Movies</h3>
                <button
                  type="button"
                  className="select-all-btn"
                  disabled={!unassignedMovies.length}
                  onClick={() => toggleSelectAllItems(unassignedMovies, "_id", setAddMovieSelection)}
                >
                  {areAllSelected(unassignedMovies, "_id", addMovieSelection) ? "Deselect all" : "Select all"}
                </button>
              </div>
              {unassignedMovies.length === 0 ? (
                <p className="items-empty">No unassigned watchlist movies.</p>
              ) : (
                <ul>
                  {unassignedMovies.map((movie) => (
                    <li key={movie._id}>
                      <label>
                        <input
                          type="checkbox"
                          checked={addMovieSelection.includes(movie._id)}
                          onChange={() => toggleSelection(movie._id, setAddMovieSelection)}
                        />
                        <span>{movie.title}</span>
                      </label>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <div className="items-group">
              <div className="items-group-header">
                <h3>Unassigned Favorites</h3>
                <button
                  type="button"
                  className="select-all-btn"
                  disabled={!unassignedLikedMovies.length}
                  onClick={() =>
                    toggleSelectAllItems(unassignedLikedMovies, "localId", setAddLikedSelection)
                  }
                >
                  {areAllSelected(unassignedLikedMovies, "localId", addLikedSelection)
                    ? "Deselect all"
                    : "Select all"}
                </button>
              </div>
              {unassignedLikedMovies.length === 0 ? (
                <p className="items-empty">No unassigned favorites.</p>
              ) : (
                <ul>
                  {unassignedLikedMovies.map((movie) => (
                    <li key={movie.localId}>
                      <label>
                        <input
                          type="checkbox"
                          checked={addLikedSelection.includes(movie.localId)}
                          onChange={() => toggleSelection(movie.localId, setAddLikedSelection)}
                        />
                        <span>{movie.title}</span>
                      </label>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>

          <div className="items-columns">
            <div className="items-group">
              <div className="items-group-header">
                <h3>Movies in this folder</h3>
                <button
                  type="button"
                  className="select-all-btn"
                  disabled={!selectedFolderItems.movies.length}
                  onClick={() =>
                    toggleSelectAllItems(selectedFolderItems.movies, "_id", setRemoveMovieSelection)
                  }
                >
                  {areAllSelected(selectedFolderItems.movies, "_id", removeMovieSelection)
                    ? "Deselect all"
                    : "Select all"}
                </button>
              </div>
              {selectedFolderItems.movies.length === 0 ? (
                <p className="items-empty">No watchlist movies in this folder.</p>
              ) : (
                <ul>
                  {selectedFolderItems.movies.map((movie) => (
                    <li key={movie._id}>
                      <label>
                        <input
                          type="checkbox"
                          checked={removeMovieSelection.includes(movie._id)}
                          onChange={() => toggleSelection(movie._id, setRemoveMovieSelection)}
                        />
                        <span>{movie.title}</span>
                      </label>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <div className="items-group">
              <div className="items-group-header">
                <h3>Favorites in this folder</h3>
                <button
                  type="button"
                  className="select-all-btn"
                  disabled={!selectedFolderItems.likedMovies.length}
                  onClick={() =>
                    toggleSelectAllItems(
                      selectedFolderItems.likedMovies,
                      "localId",
                      setRemoveLikedSelection
                    )
                  }
                >
                  {areAllSelected(selectedFolderItems.likedMovies, "localId", removeLikedSelection)
                    ? "Deselect all"
                    : "Select all"}
                </button>
              </div>
              {selectedFolderItems.likedMovies.length === 0 ? (
                <p className="items-empty">No favorites in this folder.</p>
              ) : (
                <ul>
                  {selectedFolderItems.likedMovies.map((movie) => (
                    <li key={movie.localId}>
                      <label>
                        <input
                          type="checkbox"
                          checked={removeLikedSelection.includes(movie.localId)}
                          onChange={() => toggleSelection(movie.localId, setRemoveLikedSelection)}
                        />
                        <span>{movie.title}</span>
                      </label>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </section>
      </div>

      {deleteModal.isOpen ? (
        <div className="folder-modal-overlay" onClick={closeDeleteModal}>
          <div className="folder-modal" onClick={(event) => event.stopPropagation()}>
            <h3>Delete folder</h3>
            <p>
              Delete <strong>{deleteModal.folderName}</strong>? You can keep items unassigned or remove them.
            </p>

            <label className="folder-modal-checkbox">
              <input
                type="checkbox"
                checked={deleteItems}
                onChange={(event) => setDeleteItems(event.target.checked)}
              />
              <span>Also delete movies and favorites inside this folder</span>
            </label>

            <div className="folder-modal-actions">
              <button type="button" className="ghost-btn" onClick={closeDeleteModal}>
                Cancel
              </button>
              <button type="button" className="danger-btn" onClick={confirmDeleteFolder}>
                Delete folder
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}

export default Folders;