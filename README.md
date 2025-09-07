# 🎬 Movies Watchlist App

A full-stack **MERN** application to search, save, and manage your favorite movies using the TMDB API.  
Built to demonstrate skills in **React, Node.js, Express, and MongoDB**, with authentication and a clean, responsive UI.

---

## 🚀 Features
- 🔐 **Authentication** – Signup & Login with JWT (JSON Web Tokens)
- 🎥 **Movie Search** – Fetch movies from the TMDB API
- 📌 **Personal Watchlist** – Add or remove movies to your account
- 📱 **Responsive UI** – Works on desktop and mobile
- 🌙 **Dark Mode** – Modern, elegant design

---

## 🛠 Tech Stack
**Frontend:** React (Vite), Tailwind CSS  
**Backend:** Node.js, Express.js  
**Database:** MongoDB (Mongoose)  
**Authentication:** JWT  
**API:** [OMDB](https://www.themoviedb.org/documentation/api)  

---

## 📂 Project Structure

Movies Watchlist/
│── Backend/ # Express + MongoDB server
│ ├── models/ # Database models
│ ├── routes/ # API routes
│ └── server.js # Entry point
│
│── Frontend/ # React app
│ ├── src/
│ │ ├── components/ # Reusable components
│ │ ├── context/ # Auth context
│ │ └── pages/ # App pages
│ └── vite.config.js
│
│── .gitignore
│── README.md