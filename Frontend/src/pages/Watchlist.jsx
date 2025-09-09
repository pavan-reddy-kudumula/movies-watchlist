import API from "../api"
import { useEffect, useState, useContext } from 'react';
import { AuthContext } from "../context/AuthContext";
import { Navigate } from "react-router-dom";
import "./Watchlist.css"

function Watchlist()
{
    const [movies, setMovies] = useState([]);
    const { user } = useContext(AuthContext)

    useEffect(() => {
        getMovie();
    }, []);

    const getMovie = () => {
        API.get(`/auth/getMovie`)
        .then(res => 
            {
                console.log(res.data)
                setMovies(res.data.movies)
            })
        .catch(err => console.log(err));
    };

    const deleteMovie = (id) => {
        API.delete(`/auth/deleteMovie/${id}`)
        .then((res) => 
            {
            console.log(res.data)
            getMovie()
            })
        .catch((err) => console.log(err))
    }
    
    return(
      <>
        { user ? (
        <div className="movie-list">
            {movies.map((movie, index) => (
              <div key={index} className="flip-card">
                <div className="flip-card-inner">
                  <div className="flip-card-front">
                    {/* <h3 className="card-title">{movie.title}</h3> */}
                    <img src={movie.poster} alt={movie.title} />
                  </div>
                  <div className="flip-card-back">
                    <h3 className="card-title">{movie.title}</h3>
                    <div className="card-details">
                      <p><strong>Director:</strong> {movie.director}</p>
                      <p><strong>Actors:</strong> {movie.actors}</p>
                      <p><strong>IMDb:</strong> {movie.imdb}</p>
                      <p>{movie.plot}</p>
                    </div>
                    <button onClick={() => deleteMovie(movie._id)}>Delete</button>
                  </div>
                </div>
              </div>
            ))}
        </div>) :
         (<Navigate to="/" />)}
      </>
      )
}

export default Watchlist