import API from "../api"
import { useState, useContext } from 'react';
import { AuthContext } from "../context/AuthContext"
import { Navigate } from "react-router-dom";
import {toast, ToastContainer} from "react-toastify"
import "./AddMovies.css"

const AddMovies = () => {
  const [inputText, setinputText] = useState("")
  const [isAdding, setIsAdding] = useState(false);
  const { user } = useContext(AuthContext)

const addMovie = async () => {
  setIsAdding(true)
  try {
    const res = await API.post(`/auth/postMovie/${inputText}`);
    console.log(res.data);
    toast.success(res.data.msg)
  } catch (err) {
    console.log(err);
    toast.error(err.response?.data?.msg)
  } finally {
    setIsAdding(false)
    setinputText("")
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
          <button onClick={addMovie} disabled={isAdding  || !inputText.trim()}>
            {isAdding ? "Adding" : "Add"}
          </button>
        </div>
        <ToastContainer position="top-right" autoClose={3000} />
      </div>) : (<Navigate to="/" />)}
    </>
  );
};

export default AddMovies;