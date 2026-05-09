import API from "../api"
import { useState, useContext, useEffect } from 'react';
import { AuthContext } from "../context/AuthContext"
import { Navigate } from "react-router-dom";
import {toast} from "react-toastify"
import "react-toastify/dist/ReactToastify.css"
import "./AddMovies.css"

const AddMovies = () => {
  const [inputText, setinputText] = useState("")
  const [year, setYear] = useState("");
  const [folders, setFolders] = useState([]);
  const [selectedFolderId, setSelectedFolderId] = useState("");
  const [isAdding, setIsAdding] = useState(false);
  const { user } = useContext(AuthContext)

useEffect(() => {
  const loadFolders = async () => {
    try {
      const res = await API.get("/auth/folders");
      const fetchedFolders = res.data?.folders || [];
      setFolders(fetchedFolders);

      if (fetchedFolders.length > 0) {
        const defaultFolder = fetchedFolders.find((folder) => folder.isDefault) || fetchedFolders[0];
        setSelectedFolderId(defaultFolder.id);
      }
    } catch (err) {
      console.error("Failed to load folders", err);
    }
  };

  if (user) {
    loadFolders();
  }
}, [user]);

const addMovie = async () => {
  setIsAdding(true)
  try {
    const payload = {
      title: inputText,
      folderId: selectedFolderId || null,
      year: year.trim() || null
    };
    // let url = `/auth/postMovie/${inputText}`;

    // if (year.trim()) {
    //   url += `?year=${year.trim()}`;
    // }

    // const payload = selectedFolderId ? { folderId: selectedFolderId } : {};
    const res = await API.post('/auth/postMovie', payload);
    toast.success(res.data.msg)
  } catch (err) {
    console.log(err);
    toast.error(err.response?.data?.msg)
  } finally {
    setIsAdding(false)
    setinputText("")
    setYear("")
  }
};

  return (
    <>
    {user ? (
      <div className="add-movies-container">
      <h1>Add Movies To Watchlist</h1>

        <div className="input-container">

          <input 
            type="text" 
            value={inputText} 
            onChange={(e) => setinputText(e.target.value)} 
            onKeyDown={(e) => {
              if (e.key === 'Enter' && inputText.trim()) {
                addMovie();
              }
            }}
            placeholder="Enter movie name"
          />

          <input
              type="text"
              value={year}
              onChange={(e) => setYear(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && inputText.trim()) {
                  addMovie();
                }
              }}
              placeholder="Year (optional)"
              // style={{ marginLeft: "10px", width: "120px" }}
          />

          <select
            value={selectedFolderId}
            onChange={(e) => setSelectedFolderId(e.target.value)}
            className="folder-select"
          >
            {folders.length === 0 ? (
              <option value="">Default Folder</option>
            ) : (
              folders.map((folder) => (
                <option key={folder.id} value={folder.id}>
                  {folder.name}
                </option>
              ))
            )}
          </select>

          <button onClick={addMovie} disabled={isAdding  || !inputText.trim()}>
            {isAdding ? "Adding" : "Add"}
          </button>
        </div>
      </div>) : (<Navigate to="/login" />)}
    </>
  );
};

export default AddMovies;