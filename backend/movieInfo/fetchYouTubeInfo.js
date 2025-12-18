
/**
 * Fetches the YouTube video ID for a given search query.
 * - Constructs a YouTube search URL from the query.
 * - Makes a GET request to fetch the HTML of the search results page.
 * - Extracts the video ID from the HTML using a simple string search.
 * 
 * Note: This method is a hacky workaround and may break if YouTube changes their page structure.
 */
import fs from "fs";

import axios from "axios";

export async function getYoutubeId(searchQuery) {
  const searchUrl = `https://www.youtube.com/results?search_query=${encodeURIComponent(
    searchQuery
  )}`; // construct the Youtube search URL with encode movieName
  const response = await axios.get(searchUrl); //make a get request to the url using axious
  const html = response.data; //get the html from the response


  const match = html.match(/"videoId":"([a-zA-Z0-9_-]{11})"/);     // find the video

  if (!match) {
    console.log("No videoId found");
    return null;
  }

  const videoId = match[1];   // get the first match 

  return videoId; //return the video id
}
