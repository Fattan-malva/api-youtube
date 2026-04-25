const express = require("express");
const cors = require("cors");
const axios = require("axios");

const app = express();
const port = 1402;

// Enable CORS for all origins
app.use(cors());

// Serve static files
app.use(express.static(__dirname));

// Helper function to fetch raw YouTube search data
const fetchYouTubeSearch = async (query) => {
  try {
    const searchURL = `https://www.youtube.com/results?search_query=${encodeURIComponent(
      query
    )}`;
    const response = await axios.get(searchURL, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/114.0.0.0 Safari/537.36",
      },
    });

    const html = response.data;
    const jsonDataStart = html.indexOf("var ytInitialData =") + 20; // Start of JSON data
    const jsonDataEnd = html.indexOf(";</script>", jsonDataStart); // End of JSON data
    const jsonString = html.substring(jsonDataStart, jsonDataEnd);

    const parsedData = JSON.parse(jsonString);

    const videos = [];
    const contents =
      parsedData.contents.twoColumnSearchResultsRenderer.primaryContents
        .sectionListRenderer.contents[0].itemSectionRenderer.contents;

    contents.forEach((item) => {
      const video = item.videoRenderer;
      if (video) {
        const videoId = video.videoId;
        const channelName = video.ownerText?.runs[0]?.text || "Unknown";
        const channelId =
          video.ownerText?.runs[0]?.navigationEndpoint?.browseEndpoint
            ?.browseId || "";
        const duration = video.lengthText?.simpleText || "Unknown";
        const views = video.viewCountText?.simpleText || "Unknown";
        const releaseDate = video.publishedTimeText?.simpleText || "Unknown";

        videos.push({
          title: video.title.runs[0].text,
          videoId,
          link: `https://www.youtube.com/watch?v=${videoId}`,
          thumbnail: `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`, // Thumbnail URL
          channelName,
          duration,
          views,
          releaseDate,
        });
      }
    });

    return videos;
  } catch (error) {
    console.error("Error fetching YouTube search data:", error.message);
    throw error;
  }
};

// API endpoint to get YouTube search results
app.get("/search", async (req, res) => {
  const query = req.query.q;
  if (!query) {
    return res.status(400).json({ error: 'Query parameter "q" is required' });
  }

  try {
    const results = await fetchYouTubeSearch(query);
    res.json(results);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch YouTube search results" });
  }
});

// Start the server
app.listen(port, () => {
  console.log(`API is running at http://localhost:${port}/search?q=`);
  console.log(`Player is running at http://localhost:${port}/?videoId=`);
});
