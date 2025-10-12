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

        const token = jwt.sign({id: user._id, username: user.username, email: user.email}, JWT_SECRET, {expiresIn: "1h"})
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
    const response = await axios.get(url + `${req.params.title}`)
    if (response.data.Response === "False") {
      return res.status(404).json({ msg: "Movie not found" });
    }

    const movieData = {
      title: response.data.Title,
      director: response.data.Director,
      actors: response.data.Actors,
      plot: response.data.Plot,
      imdb: response.data.imdbRating,
      poster: response.data.Poster,
      userId: req.user.id
    };

    const movie = new MovieModel(movieData);
    await movie.save();
    res.status(200).json({ msg: 'Movie added successfully!', movie });
  } 
  catch (err) {
    if (err.code === 11000) {
      return res.status(400).json({ msg: "Movie already in your watchlist" });
    }
    console.error("Error adding movie:", err.message);
    res.status(500).json({ msg: "Server error" });
  }
});

router.get("/api/auth/recommendations", authMiddleware, async (req, res) => {
        try {
        const userWatchlist = await MovieModel.find({ userId: req.user.id });

        if (!userWatchlist || userWatchlist.length === 0) {
            return res.status(404).json({ message: "Your watchlist is empty. Add some movies first!" });
        }

        const prompt = `
            You are a movie recommendation expert. Based on the user's watchlist below, recommend 5 new movies.

            - Your response MUST be a valid JSON array of objects.
            - Each object must have TWO keys:
              1. "title": The exact, official movie title as it would appear in a database like IMDb. Do not abbreviate or add the year".
              2. "reason": A short, compelling reason for the recommendation.

            - Example of a good title: "The Lord of the Rings: The Fellowship of the Ring" or "RRR"
            - Example of a bad title: "Lord of the Rings 1" or "The Fellowship of the Ring (2001)" or RRR (Rise, Roar, Revolt)

            Here is the user's watchlist:
            ${JSON.stringify(userWatchlist.map(movie => ({
                title: movie.title,
                director: movie.director,
                actors: movie.actors,
                plot: movie.plot
            })))}
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