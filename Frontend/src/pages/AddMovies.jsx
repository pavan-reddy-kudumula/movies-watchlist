import API from "../api"
import { useState, useContext } from 'react';
import { AuthContext } from "../context/AuthContext"
import { Navigate } from "react-router-dom";
import {toast} from "react-toastify"
import "react-toastify/dist/ReactToastify.css"
import "./AddMovies.css"

const AddMovies = () => {
  const [inputText, setinputText] = useState("")
  const [year, setYear] = useState("");
  const [isAdding, setIsAdding] = useState(false);
  const { user } = useContext(AuthContext)

const addMovie = async () => {
  setIsAdding(true)
  try {
    let url = `/auth/postMovie/${inputText}`;

    if (year.trim()) {
      url += `?year=${year.trim()}`;
    }

    const res = await API.post(url);
    console.log(res.data);
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

          <button onClick={addMovie} disabled={isAdding  || !inputText.trim()}>
            {isAdding ? "Adding" : "Add"}
          </button>
        </div>
      </div>) : (<Navigate to="/login" />)}
    </>
  );
};

export default AddMovies;