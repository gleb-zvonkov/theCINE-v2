/**
 * App.tsx
 * 
 * This is the main entry point for the frontend application of the movie website. 
 * It handles the display and interaction of various components, including:
 * - Movie grid: Displays a list of trending movies and updates the list when a search is performed.
 * - Search functionality: Allows the user to search for movies based on a query, sending the query to the backend.
 * - Login functionality: Opens or closes a login popup when the user's avatar is clicked.
 * - Infinite scroll: Automatically fetches and adds more movies as the user scrolls to the bottom of the page.
 **/

import "./App.css";
import { useState, useEffect, useRef} from "react";

// shadcn/ui
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";

// my components
import AvatarDemo from "@/parts/avatar";
import AuthenticationCard from "@/parts/authenticationCard";
import MovieCard from "@/parts/movieCard";

// hooks
import { useYouTubePlayers } from "@/hooks/useYoutubePlayer";
import { useMovieLoader } from "@/hooks/useMovieLoader";
import { useInfiniteScroll } from "./hooks/useInfiniteScroll";

//BACKEND Server Url
const BACKEND_URL = import.meta.env.VITE_BACKEND_URL;

function App() {
  const { movies, setMovies, fetchAndAddMovie } = useMovieLoader(); // Loads and manages the movie list (initial + incremental loading)
  const [loading, setLoading] = useState(true); // Controls the loading state for both initial movie grid and search results
  const [showDelayedMessage, setShowDelayedMessage] = useState(false);   //controls the visibility of server statup message 
  const isInitialLoad = useRef(true);  //track wether this is intial load or not
  const playerRefs = useYouTubePlayers(movies, loading); // Initializes and stores references to YouTube players using movie IDs
  const [showLogin, setShowLogin] = useState(false); // Controls whether the login popup is visible
  const [searchQuery, setSearchQuery] = useState(""); // Tracks the input text for the search

  // Load trending movies initially
  useEffect(() => {
    fetch(`${BACKEND_URL}/api/trending`)
      .then((res) => res.json())
      .then((data) => {
        setMovies(data); // once the movies are fetched
        setLoading(false); // no longer show the loading state
      })
      .catch((err) => {
        console.error("Error loading trending movies:", err);
        setLoading(false);
      });
  }, []);

  // Show delayed message if the loading state persists for more than 5 seconds
  useEffect(() => {
    let timer: number;

    if (loading && isInitialLoad.current) {
      timer = window.setTimeout(() => {
        setShowDelayedMessage(true);
      }, 5000);
    }

    if (!loading) {
      setShowDelayedMessage(false);
      isInitialLoad.current = false; // Prevent future triggers
    }

    return () => clearTimeout(timer);
  }, [loading]);


  useInfiniteScroll(fetchAndAddMovie); // Attaches a scroll listener and loads a new movie from the backend when the user nears the bottom of the page.

  // Function to handle search button click
  const handleSearch = () => {
    if (searchQuery.trim()) {
      setLoading(true); // Start loading movies during search
      fetch(`${BACKEND_URL}/api/gpt`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ query: searchQuery }), // Send the input query to the backend
      })
        .then((res) => res.json())
        .then((data) => {
          setMovies(data); // Update the movie list with the fetched movies
          setLoading(false); // Stop loading state once movies are fetched
        })
        .catch((err) => {
          console.error("Error fetching movies from GPT:", err);
          setLoading(false); // Stop loading state in case of error
        });
    }
  };

  return (
    <div style={{ padding: "20px" }}>
      {/* Avatar when clicked makes the login popup*/}
      <div
        style={{ position: "absolute", top: "20px", left: "20px", zIndex: 999 }}
      >
        <AvatarDemo onClick={() => setShowLogin(!showLogin)} />
      </div>

      {/* Login popup: Opens or closes the login card when clicked. */}
      {showLogin && <AuthenticationCard />}

      {/* Search Bar */}
      <div style={{ display: "flex", gap: "8px", marginBottom: "20px" }}>
        <Input
          style={{ flex: 1, height: "50px", fontSize: "16px" }}
          placeholder="What type of movie are you looking for ..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)} // Update the searchQuery state
          onKeyDown={(e) => {              //if the user presses enter then run search
            if (e.key === "Enter") {
              handleSearch();
            }
          }}
        />
        <Button
          style={{ height: "50px" }}
          onClick={handleSearch} // Handle button click to trigger search
        >
          Enter
        </Button>
      </div>

      {/* Movie Grid */}
      {/* Shows loading skeletons while movies are loading. */}
      {loading ? (
        <div>
          {showDelayedMessage && (
            <div
              style={{
                marginBottom: "16px",
                padding: "12px",
                backgroundColor: "#f8d7da", // light red
                border: "1px solid #f5c2c7", // slightly darker red border
                borderRadius: "8px",
                color: "#000000", // black text
                fontSize: "16px",
              }}
            >
              Waking up the server... This may take up to 60 seconds on first
              load.
            </div>
          )}

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(500px, 1fr))",
              gap: "16px",
            }}
          >
            {Array.from({ length: 8 }).map((_, i) => (
              <Skeleton key={i} className="w-full h-[300px] rounded-xl" />
            ))}
          </div>
        </div>
      ) : (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(500px, 1fr))",
            gap: "16px",
          }}
        >
          {/* Displays each movie in a MovieCard */}
          {movies.map((movie) => (
            <MovieCard
              key={movie.id}
              movie={movie}
              onHover={() => playerRefs.current[movie.id]?.playVideo()}
              onLeave={() => playerRefs.current[movie.id]?.pauseVideo()}
            />
          ))}
          <Skeleton className="w-full h-[300px] rounded-xl" />
        </div>
      )}
    </div>
  );
}

export default App;
