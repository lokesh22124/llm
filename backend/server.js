// server.js

const express = require("express");
const axios = require("axios");
const cors = require("cors");
const Parser = require("rss-parser");

require("dotenv").config();

const app = express();

const parser = new Parser({

  customFields:{
    item:[
      ["media:content","media:content"],
      ["media:thumbnail","media:thumbnail"]
    ]
  }

});

app.use(cors());

app.use(express.json());

/* =====================================
   FALLBACK IMAGES
===================================== */

const fallbackImages = [

  "https://images.unsplash.com/photo-1504711434969-e33886168f5c",

  "https://images.unsplash.com/photo-1495020689067-958852a7765e",

  "https://images.unsplash.com/photo-1523995462485-3d171b5c8fa9",

  "https://images.unsplash.com/photo-1585829365295-ab7cd400c167",

  "https://images.unsplash.com/photo-1516321318423-f06f85e504b3"

];

function getRandomImage(){

  return fallbackImages[
    Math.floor(
      Math.random() *
      fallbackImages.length
    )
  ];

}

/* =====================================
   GET BEST IMAGE
===================================== */

function extractImage(item){

  try{

    /* enclosure */

    if(
      item.enclosure?.url &&
      item.enclosure.url.startsWith("http")
    ){

      return item.enclosure.url;

    }

    /* thumbnail */

    if(
      item.thumbnail &&
      item.thumbnail.startsWith("http")
    ){

      return item.thumbnail;

    }

    /* media content */

    if(
      item.media?.content?.url &&
      item.media.content.url.startsWith("http")
    ){

      return item.media.content.url;

    }

    /* media:content */

    if(
      item["media:content"]?.["$"]?.url &&
      item["media:content"]["$"].url.startsWith("http")
    ){

      return item["media:content"]["$"].url;

    }

    /* media:thumbnail */

    if(
      item["media:thumbnail"]?.["$"]?.url &&
      item["media:thumbnail"]["$"].url.startsWith("http")
    ){

      return item["media:thumbnail"]["$"].url;

    }

    /* image from html content */

    if(item.content){

      const match =
      item.content.match(
        /<img.*?src=["'](.*?)["']/i
      );

      if(
        match &&
        match[1] &&
        match[1].startsWith("http")
      ){

        return match[1];

      }

    }

    /* image from content:encoded */

    if(item["content:encoded"]){

      const match =
      item["content:encoded"].match(
        /<img.*?src=["'](.*?)["']/i
      );

      if(
        match &&
        match[1] &&
        match[1].startsWith("http")
      ){

        return match[1];

      }

    }

    return getRandomImage();

  }catch{

    return getRandomImage();

  }

}

/* =====================================
   RSS FEEDS
===================================== */

const RSS_FEEDS = [

  {
    state: "tamil nadu",

    source: "The Hindu Tamil",

    url:
    "https://www.thehindu.com/news/national/tamil-nadu/feeder/default.rss"
  },

  {
    state: "andhra pradesh",

    source: "The Hindu Andhra",

    url:
    "https://www.thehindu.com/news/national/andhra-pradesh/feeder/default.rss"
  },

  {
    state: "telangana",

    source: "The Hindu Telangana",

    url:
    "https://www.thehindu.com/news/national/telangana/feeder/default.rss"
  },

  {
    state: "kerala",

    source: "The Hindu Kerala",

    url:
    "https://www.thehindu.com/news/national/kerala/feeder/default.rss"
  },

  {
    state: "karnataka",

    source: "The Hindu Karnataka",

    url:
    "https://www.thehindu.com/news/national/karnataka/feeder/default.rss"
  }

];

/* =====================================
   REMOVE DUPLICATES
===================================== */

function removeDuplicates(news){

  const seen = new Set();

  return news.filter((item)=>{

    const title =
    (
      item.title || ""
    ).toLowerCase();

    if(seen.has(title)){

      return false;

    }

    seen.add(title);

    return true;

  });

}

/* =====================================
   AI CLASSIFIER
===================================== */

async function classifyAI(article){

  try{

    const response =
    await axios.post(
      `${process.env.AI_SERVER_URL}/classify`,
      {

        title:
        article.title || "",

        description:
        article.description || "",

        content:
        article.content || ""

      }
    );

    return response.data;

  }catch(err){

    console.log(
      "AI ERROR:",
      err.message
    );

    return {

      category:"general",

      state:
      article.state || "world",

      summary:
      (
        article.description ||
        article.title ||
        ""
      ).slice(0,500)

    };

  }

}

/* =====================================
   NEWS API
===================================== */

async function fetchNewsAPI(){

  const queries = [

    "India politics OR parliament",

    "India AI OR technology",

    "India cricket OR IPL",

    "India business OR market",

    "India health",

    "India entertainment OR movie",

    "Tamil Nadu Chennai",

    "Andhra Pradesh Visakhapatnam",

    "Telangana Hyderabad",

    "Kerala Kochi",

    "Karnataka Bengaluru"

  ];

  let allArticles = [];

  for(const query of queries){

    try{

      const response =
      await axios.get(
        "https://newsapi.org/v2/everything",
        {

          params:{

            q:query,

            language:"en",

            sortBy:"publishedAt",

            pageSize:8,

            apiKey:
            process.env.NEWS_API_KEY

          }

        }
      );

      allArticles = [

        ...allArticles,

        ...response.data.articles

      ];

    }catch(err){

      console.log(
        "NEWS API ERROR:",
        err.message
      );

    }

  }

  return allArticles;

}

/* =====================================
   RSS NEWS
===================================== */

async function fetchRSSNews(){

  let rssNews = [];

  for(const feed of RSS_FEEDS){

    try{

      const parsed =
      await parser.parseURL(
        feed.url
      );

      const articles =
      parsed.items.map((item)=>({

        title:
        item.title || "No Title",

        description:
        item.contentSnippet || "",

        content:
        item.contentSnippet || "",

        url:
        item.link || "#",

        /* UPDATED IMAGE HANDLING */

        urlToImage:
        extractImage(item),

        source:{
          name:feed.source
        },

        state:feed.state

      }));

      rssNews = [

        ...rssNews,

        ...articles

      ];

    }catch(err){

      console.log(
        "RSS ERROR:",
        err.message
      );

    }

  }

  return rssNews;

}

/* =====================================
   MERGE NEWS
===================================== */

async function fetchAllNews(){

  const apiNews =
  await fetchNewsAPI();

  const rssNews =
  await fetchRSSNews();

  return removeDuplicates([

    ...apiNews,

    ...rssNews

  ]);

}

/* =====================================
   NEWS ROUTE
===================================== */

app.get("/", (req, res) => {
  res.json({
    status: "Backend Running",
    message: "Go to /news to get news data"
  });
});

app.get("/news", async (req, res) => {
  try {
    const articles = await fetchAllNews();

    const processed = await Promise.all(
      articles.map(async (article) => {
        const ai = await classifyAI(article);

        return {
          title: article.title || "No Title",

          image:
            article.urlToImage &&
            article.urlToImage.startsWith("http")
              ? article.urlToImage
              : getRandomImage(),

          url: article.url || "#",

          source: article.source?.name || "Unknown",

          summary: ai.summary || article.description,

          category: ai.category || "general",

          state: ai.state || article.state || "world"
        };
      })
    );

    res.json({
      total: processed.length,
      news: processed
    });

  } catch (err) {
    console.error("NEWS ROUTE ERROR:", err);

    res.status(500).json({
      news: [],
      error: err.message
    });
  }
});
/* =====================================
   START SERVER
===================================== */

app.listen(5000,()=>{

  console.log(
    "Server running at http://localhost:5000"
  );

});