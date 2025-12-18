/*
* This module provides functions for fetching and processing movie data
 * Functions:
 * - `createMovieObjectFromID` and `createMovieObjectFromName`: Create a movie object from TMDb ID or title.
 * - `landingPageMovies`: Fetches and returns a shuffled list of trending and top-rated movies.
 * - `getRandomPopularMovies`: Fetches and returns 10 random popular movies from the database.
 * - `oneMovie`: Returns a list of movie objects for a set of predefined movie IDs.
 */

import Database from "better-sqlite3";
import {
  getMovieById,
  getMovieByTitle,
  getStreamingProvider,
  getTrendingMovies,
  getTopRatedMovies,
} from "./fetchMovieInfo.js";
import {getYoutubeId} from "./fetchYouTubeInfo.js";

// Extracts basic movie info (id, title, release date, vote average, backdrop path)
function extractMovieInfo(movie) {
  return {
    id: movie.id,
    title: movie.title,
    release_date: movie.release_date,
    vote_average: movie.vote_average,
    backdrop_path: movie.backdrop_path,
  };
}

// Builds a complete movie object with additional data like YouTube ID and streaming provider
async function buildMovieObject(movie) {
  const youtubeId = await getYoutubeId(`${movie.title} trailer`);
  const streamingProvider = await getStreamingProvider(movie.id);
  return {
    ...extractMovieInfo(movie),
    youtubeId,
    streamingProvider,
  };
}

// Creates a movie object using a movie's TMDb ID
export async function createMovieObjectFromID(tmdbId) {
  const movie = await getMovieById(tmdbId);
  return buildMovieObject(movie);
}

// Creates a movie object using a movie's title
export async function createMovieObjectFromName(title) {
  const movie = await getMovieByTitle(title);
  return buildMovieObject(movie);
}

// Selects a specified number of random items from an array
function getRandomItems(array, count) {
  const shuffled = [...array].sort(() => 0.5 - Math.random());
  return shuffled.slice(0, count);
}

// Shuffle an array randomly
function shuffleArray(array) {
  return [...array].sort(() => 0.5 - Math.random());
}

// Fetches a combination of random trending and top-rated movies for the landing page
export async function landingPageMovies() {
  // Fetch raw movies
  const trending = await getTrendingMovies();
  const topRated = await getTopRatedMovies();

  // Select random ones
  const trendingSample = getRandomItems(trending, 8);
  const topRatedSample = getRandomItems(topRated, 2);

  // Combine and shuffle them
  const combined = [...trendingSample, ...topRatedSample];
  const shuffled = shuffleArray(combined);

  // Build movie objects
  const movieObjects = await Promise.all(
    shuffled.map((movie) => buildMovieObject(movie))
  );

  return movieObjects;
}

// Fetches random popular movies from a SQLite database
export async function getRandomPopularMovies() {
  const db = new Database("./movieInfo/movies.db");

  // Select top 100 most popular movies
  const topMovies = db
    .prepare("SELECT * FROM movies ORDER BY popularity DESC LIMIT 1000")
    .all();

  // Shuffle and pick 10 at random
  const shuffled = topMovies.sort(() => 0.5 - Math.random());
  const randomIds = shuffled.slice(0, 10).map((movie) => movie.id);

  db.close();

  // Build movie objects in parallel
  const movieObjects = await Promise.all(
    randomIds.map((id) => createMovieObjectFromID(id))
  );

  return movieObjects;
}
