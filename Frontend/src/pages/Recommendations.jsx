import { useState, useContext } from 'react';
import API from '../api';
import { AuthContext } from '../context/AuthContext';
import { Navigate } from 'react-router-dom';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import './Recommendations.css';

function Recommendations() {
    const { user } = useContext(AuthContext);
    const [recommendations, setRecommendations] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const [addingMovieTitle, setAddingMovieTitle] = useState(null);
    const [addedMovies, setAddedMovies] = useState([]);

    const handleGetRecommendations = async () => {
        setIsLoading(true);
        setError('');
        setRecommendations([]);
        setAddedMovies([]);

        try {
            // Send a GET request. The server knows who the user is from the token.
            const response = await API.get('/auth/recommendations');
            setRecommendations(response.data.recommendations);
        } catch (err) {
            const errorMsg = err.response?.data?.message || 'Could not fetch recommendations.';
            setError(errorMsg);
            console.error(err);
        } finally {
            setIsLoading(false);
        }
    };

    const handleAddMovie = async (title) => {
        setAddingMovieTitle(title); // Set loading state for this specific button
        try {
            // Your existing backend endpoint is perfect for this
            await API.post(`/auth/postMovie/${title}`);
            toast.success(`"${title}" was added to your watchlist!`);
            setAddedMovies(prevAdded => [...prevAdded, title]);
        } catch (err) {
            const errorMsg = err.response?.data?.msg || `Failed to add "${title}"`;
            toast.error(errorMsg); // Show specific error like "Movie already in watchlist"
        } finally {
            setAddingMovieTitle(null); // Reset loading state for the button
        }
    };

    if (!user) {
        return <Navigate to="/login" />;
    }

return (
        <div className="recommendations-container">
            <h1>AI Movie Recommender</h1>
            <p>Click the button to get movie recommendations based on your personal watchlist.</p>
            
            <button className="recommend-btn" onClick={handleGetRecommendations} disabled={isLoading}>
                {isLoading ? '🤖 Analyzing your taste...' : '✨ Find My Next Movie'}
            </button>

            {error && <p className="error-message">{error}</p>}

            {recommendations.length > 0 && (
                <div className="recommendations-list">
                    <h2>Here are some movies you might like:</h2>
                    <ul>
                        {recommendations.map((movie, index) => {
                            // ✨ 4. Check the status for each movie to determine button text and state
                            const isAdded = addedMovies.includes(movie.title);
                            const isAdding = addingMovieTitle === movie.title;

                            return (
                                <li key={index} className="recommendation-card">
                                    <div className="recommendation-details">
                                        <h3>{movie.title}</h3>
                                        <p>{movie.reason}</p>
                                    </div>
                                    <button
                                        className={`add-btn ${isAdded ? 'added' : ''}`}
                                        onClick={() => !isAdded && handleAddMovie(movie.title)}
                                        disabled={isAdding || isAdded}
                                    >
                                        {isAdded ? 'Added' : (isAdding ? 'Adding...' : 'Add to Watchlist')}
                                    </button>
                                </li>
                            );
                        })}
                    </ul>
                </div>
            )}
            <ToastContainer position="bottom-right" autoClose={3000} theme="colored" />
        </div>
    );
}

export default Recommendations;