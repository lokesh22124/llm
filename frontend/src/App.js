// App.js

import React,{
  useEffect,
  useMemo,
  useState
} from "react";

import axios from "axios";

import "./App.css";

/* =====================================
   LANGUAGES
===================================== */

const languages = [
  "en",
  "te",
  "ta",
  "kn",
  "hi",
  "ml"
];

const languageNames = {

  en:"English",
  te:"తెలుగు",
  ta:"தமிழ்",
  kn:"ಕನ್ನಡ",
  hi:"हिन्दी",
  ml:"മലയാളം"

};

/* =====================================
   RANDOM FALLBACK IMAGES
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

function App(){

  /* =====================================
     STATES
  ===================================== */

  const [news,setNews] =
  useState([]);

  const [loading,setLoading] =
  useState(true);

  const [search,setSearch] =
  useState("");

  const [state,setState] =
  useState("all");

  const [category,setCategory] =
  useState("all");

  /* =====================================
     LOAD NEWS
  ===================================== */

  useEffect(()=>{

    loadNews();

  },[]);

  async function loadNews(){

    try{

      setLoading(true);

      const res = await axios.get(
  `${process.env.REACT_APP_BACKEND_URL}/news`
);

console.log("BACKEND RESPONSE:", res.data);

const enhanced = (res.data.news || []).map(
        (n,index)=>({

          ...n,

          image:
          n.image ||
          getRandomImage(),

          id:
          n.id ||
          n.url ||
          `${n.title}-${index}`,

          langIndex:0,

          displayTitle:
          n.title,

          displaySummary:
          n.summary,

          displaySource:
          n.source,

          displayState:
          n.state,

          displayCategory:
          n.category,

          translations:{}

        })
      );

      setNews(enhanced);

    }catch(err){

  console.error(
    "LOAD NEWS ERROR:",
    err.response?.data || err.message
  );

}finally{

      setLoading(false);

    }

  }

  /* =====================================
     TRANSLATE CARD
  ===================================== */

  async function translateCard(cardId){

    const updated = [...news];

    const cardIndex =
    updated.findIndex(
      item => item.id === cardId
    );

    if(cardIndex === -1){
      return;
    }

    const card =
    updated[cardIndex];

    let nextIndex =
    card.langIndex + 1;

    if(
      nextIndex >=
      languages.length
    ){
      nextIndex = 0;
    }

    const lang =
    languages[nextIndex];

    card.langIndex =
    nextIndex;

    /* =====================================
       ENGLISH RESET
    ===================================== */

    if(lang === "en"){

      card.displayTitle =
      card.title;

      card.displaySummary =
      card.summary;

      card.displaySource =
      card.source;

      card.displayState =
      card.state;

      card.displayCategory =
      card.category;

      setNews([...updated]);

      return;

    }

    /* =====================================
       CACHE
    ===================================== */

    if(
      card.translations?.[lang]
    ){

      const cached =
      card.translations[lang];

      card.displayTitle =
      cached.title;

      card.displaySummary =
      cached.summary;

      card.displaySource =
      cached.source;

      card.displayState =
      cached.state;

      card.displayCategory =
      cached.category;

      setNews([...updated]);

      return;

    }

    /* =====================================
       TRANSLATE API
    ===================================== */

    try{

      const response =
      await axios.post(
        `${process.env.REACT_APP_AI_URL}/translate`,
        {

          title:
          card.title,

          summary:
          card.summary,

          source:
          card.source,

          state:
          card.state,

          category:
          card.category,

          target_lang:lang

        }
      );

      const translated =
      response.data;

      if(
        !card.translations
      ){

        card.translations = {};

      }

      card.translations[lang] =
      translated;

      card.displayTitle =
      translated.title;

      card.displaySummary =
      translated.summary;

      card.displaySource =
      translated.source;

      card.displayState =
      translated.state;

      card.displayCategory =
      translated.category;

      setNews([...updated]);

    }catch(err){

      console.log(
        "TRANSLATION ERROR:",
        err
      );

    }

  }

  /* =====================================
     FILTERS
  ===================================== */

  const filtered = useMemo(()=>{

    let data = [...news];

    /* STATE FILTER */

    if(state !== "all"){

      data = data.filter(
        n => (

          n.state === state ||

          n.displayState === state

        )
      );

    }

    /* CATEGORY FILTER */

    if(category !== "all"){

      data = data.filter(
        n => (

          n.category === category ||

          n.displayCategory === category

        )
      );

    }

    /* SEARCH FILTER */

    if(search.trim()){

      const q =
      search.toLowerCase();

      data = data.filter(n=>

        (
          n.displayTitle || ""
        ).toLowerCase().includes(q)

        ||

        (
          n.displaySummary || ""
        ).toLowerCase().includes(q)

      );

    }

    return data;

  },[
    news,
    state,
    category,
    search
  ]);

  /* =====================================
     CATEGORY COLORS
  ===================================== */

  function getBadgeClass(cat){

    switch(cat){

      case "sports":
        return "sports";

      case "technology":
        return "technology";

      case "politics":
        return "politics";

      case "business":
        return "business";

      case "health":
        return "health";

      case "entertainment":
        return "entertainment";

      default:
        return "general";

    }

  }

  /* =====================================
     UI
  ===================================== */

  return(

    <div className="app">

      {/* =====================================
          NAVBAR
      ===================================== */}

      <div className="navbar">

        <div className="logo">

          Go2News

        </div>

        <div className="controls">

          {/* SEARCH */}

          <input
            type="text"
            placeholder="Search news..."
            value={search}
            onChange={(e)=>
              setSearch(
                e.target.value
              )
            }
          />

          {/* STATE */}

          <select
            value={state}
            onChange={(e)=>
              setState(
                e.target.value
              )
            }
          >

            <option value="all">
              All Locations
            </option>

            <option value="world">
              World
            </option>

            <option value="india">
              India
            </option>

            <option value="tamil nadu">
              Tamil Nadu
            </option>

            <option value="andhra pradesh">
              Andhra Pradesh
            </option>

            <option value="telangana">
              Telangana
            </option>

            <option value="kerala">
              Kerala
            </option>

            <option value="karnataka">
              Karnataka
            </option>

          </select>

          {/* CATEGORY */}

          <select
            value={category}
            onChange={(e)=>
              setCategory(
                e.target.value
              )
            }
          >

            <option value="all">
              All Categories
            </option>

            <option value="technology">
              Technology
            </option>

            <option value="politics">
              Politics
            </option>

            <option value="sports">
              Sports
            </option>

            <option value="business">
              Business
            </option>

            <option value="health">
              Health
            </option>

            <option value="entertainment">
              Entertainment
            </option>

            <option value="general">
              General
            </option>

          </select>

        </div>

      </div>

      {/* =====================================
          HERO
      ===================================== */}

      <div className="hero">

        <h1>

          Smart AI News Platform

        </h1>

        <p>

          AI Classified, Summarized & Multi-Language News

        </p>

      </div>

      {/* =====================================
          LOADER
      ===================================== */}

      {loading && (

        <div className="loader-container">

          <div className="loader"></div>

        </div>

      )}

      {/* =====================================
          EMPTY
      ===================================== */}

      {!loading &&
      filtered.length === 0 && (

        <div className="empty">

          ❌ No News Found

        </div>

      )}

      {/* =====================================
          NEWS GRID
      ===================================== */}

      <div className="news-grid">

        {filtered.map((n)=>{

          const currentLang =
          languages[n.langIndex];

          return(

            <div
              className="card"
              key={n.id}
            >

              {/* =====================================
                  LANGUAGE BUTTON
              ===================================== */}

              <button
                className="lang-btn"
                onClick={()=>
                  translateCard(n.id)
                }
              >

                🌐 {
                  languageNames[
                    currentLang
                  ]
                }

              </button>

              {/* =====================================
                  IMAGE
              ===================================== */}

              <div className="image-box">

                <img

                  loading="lazy"

                  src={n.image}

                  alt="news"

                  onError={(e)=>{

                    e.target.onerror = null;

                    e.target.src =
                    getRandomImage();

                  }}

                />

                <div
  className={
    `badge ${getBadgeClass(
      n.category
    )}`
  }
>

  {
    (
      n.displayCategory ||
      n.category ||
      "general"
    ).toUpperCase()
  }

</div>

              </div>

              {/* =====================================
                  CONTENT
              ===================================== */}

              <div className="content">

                {/* META */}

                <div className="meta">

                  <span>

                    📍 {
                      n.displayState
                    }

                  </span>

                  <span>

                    {
                      n.displaySource
                    }

                  </span>

                </div>

                {/* TITLE */}

                <h2>

                  {
                    n.displayTitle
                  }

                </h2>

                {/* SUMMARY */}

                <div className="summary-scroll">

                  <p>

                    {
                      n.displaySummary
                    }

                  </p>

                </div>

                {/* LINK */}

                <a
                  href={n.url}
                  target="_blank"
                  rel="noreferrer"
                >

                  Read Full →

                </a>

              </div>

            </div>

          );

        })}

      </div>

    </div>

  );

}

export default App;