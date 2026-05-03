import express from "express"
const router = express.Router()
import mongoose from "mongoose"
import UserModel from "../models/User.js"
import MovieModel from "../models/Movie.js"
import authMiddleware from "./auth.js"
import { GoogleGenAI } from "@google/genai";
import authRouter from "./authRoutes.js"
import likedRouter from "./likedRoutes.js"
import folderRouter from "./folders.js"
import watchlistRouter from "./watchlistRoutes.js"
import sitemapRouter from "./sitemap.js"

const genAI = new GoogleGenAI({});

router.get("/api/ping", (req, res) => {
    res.status(200).json({ message: "pong" });
});

router.use((req, res, next) => {
    if (req.path === "/api/ping") {
        return next();
    }

    if (mongoose.connection.readyState !== 1) {
        return res.status(503).json({
            error: "Database temporarily unavailable",
            retryAfter: 30
        });
    }

    next();
});

router.use(authRouter);
router.use(likedRouter);
router.use(folderRouter);
router.use(watchlistRouter);
router.use(sitemapRouter);

router.get("/api/auth/recommendations", authMiddleware, async (req, res) => {
      try {
        // 1. Fetch Watchlist (Limit to last 20 to save tokens/latency)
        const userWatchlist = await MovieModel.find({ userId: req.user._id })
            .sort({ _id: -1 })
            .limit(20);

        // 2. Fetch User's Liked Movies
        const userProfile = await UserModel.findById(req.user._id).select('likedMovies');
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

export default router