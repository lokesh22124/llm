const express = require("express");
const axios = require("axios");
const cors = require("cors");
require("dotenv").config();

const app = express();
app.use(cors());
app.use(express.json());

let bookmarks = [];


// 🔥 AI CLASSIFICATION (SAFE)
async function classifyAI(text) {
  try {
    const res = await axios.post("http://localhost:8000/classify", { text });
    return res.data;
  } catch (err) {
    console.log("AI ERROR:", err.message);

    return {
      category: "general",
      state: "india",
      summary: text.slice(0, 120)
    };
  }
}


// 🔥 FETCH NEWS (STABLE + NO EMPTY)
async function fetchNews() {
  try {
    const url = `https://newsapi.org/v2/everything?q=india OR technology OR sports&sortBy=publishedAt&pageSize=30&apiKey=${process.env.NEWS_API_KEY}`;

    const res = await axios.get(url);

    console.log("NewsAPI status:", res.data.status);

    if (res.data.status !== "ok") {
      console.log("API ERROR:", res.data);
      return [];
    }

    return res.data.articles || [];

  } catch (err) {
    console.log("FETCH ERROR:", err.response?.data || err.message);
    return [];
  }
}


// 📰 MAIN NEWS API
app.get("/news", async (req, res) => {
  try {
    const articles = await fetchNews();

    console.log("Articles fetched:", articles.length);

    if (!articles.length) {
      return res.json({
        news: [],
        message: "No news found (check API key or limit)"
      });
    }

    const processed = await Promise.all(
      articles.map(async (a, i) => {
        const text = `${a.title || ""} ${a.description || ""}`;

        let ai = {
          category: "general",
          state: "india",
          summary: text.slice(0, 120)
        };

        // 🔥 Limit AI calls (avoid overload)
        if (i < 20) {
          ai = await classifyAI(text);
        }

        return {
          title: a.title || "No title",
          image: a.urlToImage || "https://via.placeholder.com/300",
          url: a.url,
          description: a.description || "",
          summary: ai.summary,
          category: (ai.category || "general").toLowerCase(),
          state: (ai.state || "india").toLowerCase()
        };
      })
    );

    // 📊 STATS
    const stats = {
      total: processed.length,
      states: {},
      categories: {}
    };

    processed.forEach(n => {
      stats.states[n.state] = (stats.states[n.state] || 0) + 1;
      stats.categories[n.category] = (stats.categories[n.category] || 0) + 1;
    });

    res.json({ news: processed, stats });

  } catch (err) {
    console.log("SERVER ERROR:", err.message);
    res.status(500).json({ error: err.message });
  }
});


// ❤️ SAVE BOOKMARK
app.post("/bookmark", (req, res) => {
  bookmarks.push(req.body);
  res.json({ message: "Saved successfully" });
});


// ❤️ GET BOOKMARKS
app.get("/bookmarks", (req, res) => {
  res.json(bookmarks);
});


// 🌐 TRANSLATE (OPTIONAL)
app.post("/translate", async (req, res) => {
  const { text, lang } = req.body;

  try {
    const response = await axios.post("https://libretranslate.de/translate", {
      q: text,
      source: "en",
      target: lang,
      format: "text"
    });

    res.json({ translated: response.data.translatedText });

  } catch (err) {
    console.log("Translate error:", err.message);
    res.json({ translated: text });
  }
});


// 🚀 START SERVER
app.listen(5000, () => {
  console.log("✅ Server running on http://localhost:5000");
});