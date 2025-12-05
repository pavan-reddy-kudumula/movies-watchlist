import { useState, useContext, useEffect } from 'react'; // 1. Import useEffect
import API from '../api';
import { AuthContext } from '../context/AuthContext';
import { Navigate } from 'react-router-dom';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import './Recommendations.css';

function Recommendations() {
    const { user } = useContext(AuthContext);
    
    // 2. Initialize state by reading from sessionStorage first.
    // This is a "lazy initializer" - it only runs on the first render.
    const [recommendations, setRecommendations] = useState(() => {
        const saved = sessionStorage.getItem('recommendations');
        return saved ? JSON.parse(saved) : [];
    });
    const [addedMovies, setAddedMovies] = useState(() => {
        const saved = sessionStorage.getItem('addedMovies');
        return saved ? JSON.parse(saved) : [];
    });
    
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const [addingMovieTitle, setAddingMovieTitle] = useState(null);

    // 3. Use useEffect to SAVE data to sessionStorage whenever state changes.
    useEffect(() => {
        // We store the data as a JSON string because storage can only hold strings.
        sessionStorage.setItem('recommendations', JSON.stringify(recommendations));
    }, [recommendations]);

    useEffect(() => {
        sessionStorage.setItem('addedMovies', JSON.stringify(addedMovies));
    }, [addedMovies]);

    const handleGetRecommendations = async () => {
        setIsLoading(true);
        setError('');
        // Clear previous state when fetching new recommendations
        setRecommendations([]);
        setAddedMovies([]);

        try {
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
        setAddingMovieTitle(title);
        try {
            await API.post(`/auth/postMovie/${title}`);
            toast.success(`"${title}" was added to your watchlist!`);
            setAddedMovies(prevAdded => [...prevAdded, title]);
        } catch (err) {
            const errorMsg = err.response?.data?.msg || `Failed to add "${title}"`;
            toast.error(errorMsg);
        } finally {
            setAddingMovieTitle(null);
        }
    };

    if (!user) {
        return <Navigate to="/login" />;
    }

    // The rest of your JSX remains exactly the same.
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
            <ToastContainer position="bottom-right" autoClose={2000} theme="colored" />
        </div>
    );
}

export default Recommendations;