🎬 Movies Watchlist App
A full-stack MERN application to search, save, and manage your favorite movies. Built to demonstrate skills in React, Node.js, Express, and MongoDB, this app features JWT authentication, a clean UI, and intelligent movie recommendations powered by Google's Gemini API.

🚀 Features
🔐 Authentication – Secure Signup & Login with JWT (JSON Web Tokens).

🤖 AI Recommendations – Get personalized movie suggestions based on your watchlist, powered by the Google Gemini API.

🎥 Movie Search – Fetch movie details from the OMDB API.

📌 Personal Watchlist – Add or remove movies from your user-specific list.

📱 Responsive UI – A seamless experience on both desktop and mobile devices.

🌙 Dark Mode – A sleek, eye-friendly dark theme.

🛠 Tech Stack
Frontend: React (Vite), CSS

Backend: Node.js, Express.js

Database: MongoDB (Mongoose)

Authentication: JWT, Bcrypt.js

APIs:

OMDB API for movie data.

Google Gemini API for AI recommendations.

📂 Project Structure
Movies Watchlist/
│
├── Backend/              # Express + MongoDB server
│   ├── models/           # Mongoose schemas (User, Movie)
│   ├── routes/           # API routes (auth, movies, recommendations)
│   └── index.js          # Server entry point
│
├── Frontend/             # React application
│   └── src/
│       ├── components/   # Reusable UI components (Navbar, etc.)
│       ├── context/      # Global state (AuthContext, ThemeContext)
│       ├── pages/        # Route components (Login, Watchlist, etc.)
│       ├── api.js        # Centralized Axios instance
│       └── App.jsx       # Main router setup
│
├── .env                  # Environment variables (API keys, DB URI)
├── .gitignore
└── README.md