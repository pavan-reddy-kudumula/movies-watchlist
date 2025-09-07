import API from "../api"
import { useState, useContext } from 'react';
import { AuthContext } from "../context/AuthContext"
import { Navigate } from "react-router-dom";
import "./AddMovies.css"

const AddMovies = () => {
  const [inputText, setinputText] = useState("")
  const { user } = useContext(AuthContext)

  const addMovie = () => {
    API.post(`/auth/postMovie/${inputText}`)
      .then(res => {
        console.log(res.data);
        setinputText("")
      })
      .catch(err => 
      {
        setinputText("")
        console.log(err)
      })
  };

  return (
    <>
    {user ? (
      <div className="add-movies-container">
      <h1>🎬 Movies Watchlist</h1>
        <div className="input-container">
          <input type="text" value={inputText} onChange={(e) => setinputText(e.target.value)} placeholder="Enter movie name"/>
          <button onClick={addMovie}>Add</button>
        </div>
      </div>) : (<Navigate to="/login" />)}
    </>
  );
};

export default AddMovies;