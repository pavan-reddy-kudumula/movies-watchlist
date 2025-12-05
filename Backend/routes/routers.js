import express from "express"
const router = express.Router()
import bcrypt from "bcrypt"
import jwt from "jsonwebtoken"
import UserModel from "../models/User.js"
import MovieModel from "../models/Movie.js"
import authMiddleware from "./auth.js"
import axios from "axios"
import { GoogleGenAI } from "@google/genai";


const JWT_SECRET = process.env.JWT_SECRET
const API_KEY = process.env.API_KEY;
const url = `http://www.omdbapi.com/?apikey=${API_KEY}&t=`;

const genAI = new GoogleGenAI({});

router.post('/api/auth/signup', async (req, res)=>{
    try{
        const {username, email, password} = req.body
    
        const normalizedEmail = email.trim().toLowerCase();
        const existingEmail = await UserModel.findOne({ email: normalizedEmail });
        if (existingEmail) {
            return res.status(400).json({ msg: "Email already in use" });
        }

        const existingUsername = await UserModel.findOne({ username });
        if (existingUsername) {
            return res.status(400).json({ msg: "Username already taken" });
        }

        const salt = await bcrypt.genSalt(10)
        const hashedPassword = await bcrypt.hash(password, salt)
    
        const newUser = new UserModel({username, email: normalizedEmail, displayEmail: email.trim(), password: hashedPassword})
        await newUser.save()
        res.json({msg: "User created successfully"})
    }
    catch(err){
        console.error(err)
        if (err.code === 11000) {
            console.log("keypattern :", err.keyPattern)
            if (err.keyPattern?.email) {
                return res.status(400).json({ msg: "Email already in use" })
            }
            if (err.keyPattern?.username) {
                return res.status(400).json({ msg: "Username already taken" })
            }
            return res.status(400).json({ msg: "Duplicate field value" })
        }
        res.status(500).json({msg: "Server error"})
    }
})

router.post("/api/auth/login", async (req, res)=>{
    try
    {
        const {email, password} = req.body

        const normalizedEmail = email.trim().toLowerCase();
        const user = await UserModel.findOne({email: normalizedEmail})
        if(!user) return res.status(400).json({msg: "No account found with this email"})

        const isMatch = await bcrypt.compare(password, user.password)
        if(!isMatch) return res.status(400).json({msg: "Invalid password"})

        const token = jwt.sign({id: user._id, username: user.username, email: user.email}, JWT_SECRET, {expiresIn: "7d"})
        res.json({
            token,
            user: {
                id: user._id,
                username: user.username,
                email: user.displayEmail,
            }
        });
    }
    catch(err){
        res.status(500).json({msg: "Server error"})
    }    
})

router.get("/api/auth/profile", authMiddleware, async (req, res)=>{
    try {
        const user = await UserModel.findById(req.user.id);
        if (!user) return res.status(404).json({ msg: "User not found" });

        res.json({ username: user.username, email: user.email });
    } catch (err) {
        res.status(500).json({ msg: err.message });
    }
})

router.get('/api/auth/getMovie', authMiddleware, async (req, res) => {
  try {
    const response = await MovieModel.find({ userId: req.user.id });
    res.status(200).json({ movies: response });
  } catch (error) {
    res.status(400).json({ msg: error.message });
  }
});

router.post('/api/auth/postMovie/:title', authMiddleware, async (req, res) => {
  try {
    const title = req.params.title;
    const year = req.query.year; 

    // 1. FIX: Encode the title to handle spaces, '&', '?', etc.
    // Assuming 'url' is something like "http://www.omdbapi.com/?apikey=XYZ&t="
    let apiUrl = `${url}${encodeURIComponent(title)}`;
    
    if (year) {
      apiUrl += `&y=${year}`;
    }
    
    const response = await axios.get(apiUrl);
    
    if (response.data.Response === "False") {
      return res.status(404).json({ msg: "Movie not found" });
    }

    const movieTitle = response.data.Title;
    const movieDirector = response.data.Director;

    // Build stable localId for likedMovies
    const localId = `${movieTitle.trim().toLowerCase()}#${movieDirector.trim().toLowerCase()}`;

    // 🔍 1. CHECK IF THIS MOVIE IS ALREADY LIKED
    const likedExists = await UserModel.findOne({
      _id: req.user.id,
      "likedMovies.localId": localId
    });

    // 2. CHECK DUPLICATES (Using the OFFICIAL title from API)
    // We check both Title AND Director to allow remakes with the same name
    const existingMovie = await MovieModel.findOne({
      userId: req.user.id,
      title: movieTitle,
      director: movieDirector
    });

    if (existingMovie) {
      return res.status(400).json({ msg: "Movie already in your watchlist", liked: Boolean(likedExists) });
    }

    // 3. HANDLE MISSING POSTERS
    // OMDb returns "N/A" string if no poster exists. This breaks <img> tags.
    // You can replace it with a placeholder or keep it as is.
    const posterImage = response.data.Poster === "N/A" 
      ? "https://via.placeholder.com/300x450?text=No+Poster" // Optional placeholder
      : response.data.Poster;

    const movieData = {
      title: response.data.Title,
      director: response.data.Director,
      actors: response.data.Actors,
      plot: response.data.Plot,
      imdb: response.data.imdbRating,
      poster: posterImage,
      userId: req.user.id
    };

    const movie = new MovieModel(movieData);
    await movie.save();

    res.status(200).json({ msg: 'Movie added successfully!', movie, liked: Boolean(likedExists) });
  } 
  catch (err) {
    if (err.code === 11000) {
      return res.status(400).json({ msg: "Movie already in your watchlist" });
    }
    console.error("Error adding movie:", err.message);
    res.status(500).json({ msg: "Server error" });
  }
});

router.post("/api/auth/like/:movieId", authMiddleware, async (req, res) => {
  try {
    const { movieId } = req.params;

    // 1. Get the movie from watchlist (ensure belongs to this user)
    const movie = await MovieModel.findOne({
      _id: movieId,
      userId: req.user.id
    });

    if (!movie) {
      return res.status(404).json({ message: "Movie not found" });
    }

    const movieTitle = movie.title;
    const movieDirector = movie.director;

    // 2. Create stable localId (title + director)
    const localId = `${movieTitle.trim().toLowerCase()}#${movieDirector.trim().toLowerCase()}`;

    // 3. Check if already liked
    const alreadyLiked = await UserModel.findOne({
      _id: req.user.id,
      "likedMovies.localId": localId
    });

    if (alreadyLiked) {
      return res.status(400).json({ message: "Movie already liked" });
    }

    // 4. Add to likedMovies
    await UserModel.findByIdAndUpdate(
      req.user.id,
      {
        $push: {
          likedMovies: {
            localId,
            title: movie.title,
            poster: movie.poster,
            review: ""
          }
        }
      }
    );

    res.json({ message: "Movie liked successfully" });

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});
  
router.delete("/api/auth/like/:localId", authMiddleware, async (req, res) => {
  try {
    const { localId } = req.params;

    const alreadyLiked = await UserModel.findOne({
      _id: req.user.id,
      "likedMovies.localId": localId
    });

    if (!alreadyLiked) {
      return res.status(400).json({ message: "Movie is not liked" });
    }

    await UserModel.findByIdAndUpdate(
      req.user.id,
      {
        $pull: {
          likedMovies: { localId }
        }
      }
    );

    res.json({ message: "Movie unliked" });

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

router.patch("/api/auth/like/:localId/review", authMiddleware, async (req, res) => {
  try {
    const { localId } = req.params;
    const { review } = req.body;

    const alreadyLiked = await UserModel.findOne({
      _id: req.user.id,
      "likedMovies.localId": localId
    });

    if (!alreadyLiked) {
      return res.status(400).json({ message: "Cannot update review. Movie not liked." });
    }

    await UserModel.updateOne(
      { _id: req.user.id, "likedMovies.localId": localId },
      { $set: { "likedMovies.$.review": review } }
    );

    res.json({ message: "Review updated" });

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

router.get("/api/auth/liked", authMiddleware, async (req, res) => {
  try {
    const user = await UserModel.findById(req.user.id).select("likedMovies");
    res.json(user.likedMovies || []);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

router.get("/api/auth/recommendations", authMiddleware, async (req, res) => {
      try {
        // 1. Fetch Watchlist (Limit to last 20 to save tokens/latency)
        const userWatchlist = await MovieModel.find({ userId: req.user.id })
            .sort({ _id: -1 })
            .limit(20);

        // 2. Fetch User's Liked Movies
        const userProfile = await UserModel.findById(req.user.id).select('likedMovies');
        // Get the last 20 liked movies (assuming new ones are pushed to end)
        const userLikes = userProfile ? userProfile.likedMovies.slice(-20) : [];

        // 3. Validation: Ensure at least ONE list has data
        if (userWatchlist.length === 0 && userLikes.length === 0) {
            return res.status(404).json({ 
                message: "Your watchlist and favorites are empty. Add movies to get recommendations!" 
            });
        }

        // 4. Format data for the AI
        // We add a 'status' field so the AI knows how to weight the movie
        const watchlistData = userWatchlist.map(m => ({
            title: m.title,
            director: m.director,
            status: "User plans to watch this (Interest)"
        }));

        const likedData = userLikes.map(m => ({
            title: m.title,
            review: m.review ? `User's review: "${m.review}"` : "User liked this",
            status: "User LOVED this movie (Strong Favorite)"
        }));

        const combinedData = [...watchlistData, ...likedData];

        const prompt = `
            You are a movie recommendation expert. Based on the user's movie history below, recommend 5 new movies.

            The data includes:
            1. "Favorites": Movies the user has already watched and loved. Treat these as strong indicators of taste.
            2. "Interest": Movies the user wants to watch. Treat these as curiosity indicators.

            RULES:
            - Do NOT recommend movies that are already in the list below.
            - Your response MUST be a valid JSON array of objects.
            - Each object must have TWO keys:
              1. "title": The exact, official movie title as it would appear in a database like IMDb. Do not abbreviate or add the year".
              2. "reason": A short, compelling reason for the recommendation.

            - Example of a good title: "The Lord of the Rings: The Fellowship of the Ring" or "RRR"
            - Example of a bad title: "Lord of the Rings 1" or "The Fellowship of the Ring (2001)" or RRR (Rise, Roar, Revolt)

            Here is the user's movie data:
            ${JSON.stringify(combinedData)}
        `;

        const result = await genAI.models.generateContent({
            model: "gemini-2.5-flash",
            contents: prompt,
            generationConfig: {
                response_mime_type: "application/json",
            }
        });
        
        const rawText = result.text;
        const cleanedText = rawText.replace(/^```json\s*|```$/g, '');
        const recommendations = JSON.parse(cleanedText);

        res.json({ recommendations });

    } catch (err) {
        console.error("Gemini recommendation error: ", err);
        res.status(500).json({ error: "Failed to generate AI recommendations." });
    }
});

router.delete('/api/auth/deleteMovie/:id', authMiddleware, async (req, res) => {
  try {
    const movie = await MovieModel.findById(req.params.id);
    if (!movie || movie.userId.toString() !== req.user.id)
      return res.status(403).json({ message: "Not allowed" });

    const response = await MovieModel.findByIdAndDelete(req.params.id);
    res.status(200).json({ msg: 'Movie deleted successfully!', movie: response });
  } catch (error) {
    res.status(400).json({ msg: error.message });
  }
});

export default router