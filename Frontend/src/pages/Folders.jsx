import { useCallback, useContext, useEffect, useMemo, useState } from "react";
import { Navigate } from "react-router-dom";
import { toast } from "react-toastify";
import API from "../api";
import { AuthContext } from "../context/AuthContext";
import "./Folders.css";
import { Trash2, Pencil } from "lucide-react";

const defaultFolderForm = { name: "" };

function Folders() {
  const { user, likedMovies, setLikedMovies } = useContext(AuthContext);

  const [loading, setLoading] = useState(true);
  const [folders, setFolders] = useState([]);
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

  const currentFolder = useMemo(
    () => folders.find((folder) => folder.id === selectedFolderId) || null,
    [folders, selectedFolderId]
  );

  const fetchLikedMovies = useCallback(async () => {
    const likedRes = await API.get("/auth/liked");
    const liked = likedRes.data || [];
    setLikedMovies(liked);
    return liked;
  }, [setLikedMovies]);

  const fetchFolders = useCallback(async () => {
    const foldersRes = await API.get("/auth/folders");
    const fetchedFolders = foldersRes.data?.folders || [];
    setFolders(fetchedFolders);
    return fetchedFolders;
  }, []);

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
    const [fetchedFolders] = await Promise.all([
      fetchFolders(),
      fetchWatchlistMovies(),
      fetchLikedMovies()
    ]);

    if (!fetchedFolders.length) {
      setSelectedFolderId("");
      return;
    }

    const currentSelectionIsValid = fetchedFolders.some(
      (folder) => folder.id === selectedFolderId
    );

    if (!selectedFolderId || !currentSelectionIsValid) {
      const preferred = fetchedFolders.find((folder) => folder.isDefault) || fetchedFolders[0];
      setSelectedFolderId(preferred.id);
    }
  }, [fetchFolders, fetchLikedMovies, fetchWatchlistMovies, selectedFolderId]);

  useEffect(() => {
    const bootstrap = async () => {
      setLoading(true);
      try {
        await refreshData();
      } catch (err) {
        console.error("Failed loading folders page", err);
        toast.error("Failed to load folders");
      } finally {
        setLoading(false);
      }
    };

    if (user) {
      bootstrap();
    }
  }, [refreshData, user]);

  useEffect(() => {
    const loadSelectedFolderItems = async () => {
      try {
        await fetchFolderItems(selectedFolderId);
      } catch (err) {
        console.error("Failed loading folder items", err);
        toast.error("Failed to load folder items");
      }
    };

    if (selectedFolderId) {
      loadSelectedFolderItems();
    }
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

      await refreshData();
      if (createdFolder?.id) {
        setSelectedFolderId(createdFolder.id);
      }
    } catch (err) {
      toast.error(err.response?.data?.message || "Could not create folder");
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
      await API.patch(`/auth/folders/${folderId}`, { name: editingName.trim() });
      toast.success("Folder renamed");
      cancelRename();
      await refreshData();
    } catch (err) {
      toast.error(err.response?.data?.message || "Could not rename folder");
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

      await refreshData();
    } catch (err) {
      toast.error(err.response?.data?.message || "Could not delete folder");
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
      toast.error(err.response?.data?.message || "Could not add items");
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
      toast.error(err.response?.data?.message || "Could not remove items");
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
              {folders.map((folder) => (
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
            <button type="button" onClick={addSelectedItemsToFolder} disabled={!selectedFolderId}>
              Add selected unassigned items
            </button>
            <button
              type="button"
              className="ghost-btn"
              onClick={removeSelectedItemsFromFolder}
              disabled={!selectedFolderId}
            >
              Remove selected folder items
            </button>
          </div>

          <div className="items-columns">
            <div className="items-group">
              <h3>Unassigned Watchlist Movies</h3>
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
              <h3>Unassigned Favorites</h3>
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
              <h3>Movies in this folder</h3>
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
              <h3>Favorites in this folder</h3>
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