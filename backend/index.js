/**
 * Server setup for handling various movie-related APIs and file uploads.
 *
 * This Express app provides the following routes:
 * - /api/trending: Fetches trending movies using the `trendingMoviesRouter`.
 * - /api/recommended: Fetches recommended movies using the `recommendedMoviesRouter`.
 * - /api/cloud_storage: Handles file uploads to DigitalOcean Spaces using `uploadRouter`.
 * - /api/gpt: Integrates with OpenAI's GPT model for movie recommendations using `gptRouter`.
 * - /api/auth/*: Handles authentication requests with BetterAuth.
 *
 * Middlewares:
 * - CORS enabled for frontend at http://localhost:5173 with credentials support.
 * - JSON body parsing with express.json().
 *
 * Follows Restful API principles
 * Stateless
 * Resources are identified via URIs
 * Use standard HTTP methods
 * Use HTTP status codes
 */

import express from "express";
import cors from "cors";

import { toNodeHandler } from "better-auth/node";
import { auth } from "./lib/auth.js";
import { uploadRouter } from "./routes/upload.js";
import { gptRouter } from "./routes/gpt.js";

import { trendingMoviesRouter } from "./routes/initialMovies.js";
import { recommendedMoviesRouter } from "./routes/recMovies.js";

const app = express();
const PORT = 5050;

// app.use(
//   cors({
//     origin: "http://localhost:5173",
//     credentials: true,
//   })
// );


app.use(
  cors({
    origin: function (origin, callback) {
      const allowedOrigins = [
        "http://localhost:5173",
        "https://coralwindow.ca",
        "https://gleb-zvonkov.github.io",
        "http://thecine.ca",
        "https://thecine.ca"
      ];
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error("Not allowed by CORS"));
      }
    },
    credentials: true,
  })
);

app.all("/api/auth/*splat", toNodeHandler(auth)); //for better auth

app.use(express.json()); // automatically parse incoming requests with a Content-Type of application/json

app.use("/api/trending", trendingMoviesRouter);

app.use("/api/recommended", recommendedMoviesRouter);

app.use("/api/cloud_storage", uploadRouter); //for upload images to deep ocean

app.use("/api/gpt", gptRouter); 

//Listen to incoming requests
app.listen(PORT, () => {
  console.log(`✅ Server running at http://localhost:${PORT}`);
});
