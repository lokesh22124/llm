import React, { useEffect, useState } from "react";
import axios from "axios";
import "./App.css";

function App() {
  const [originalNews, setOriginalNews] = useState([]);
  const [filteredNews, setFilteredNews] = useState([]);

  const [search, setSearch] = useState("");
  const [state, setState] = useState("all");
  const [category, setCategory] = useState("all");

  const [visible, setVisible] = useState(20);

  // 🔥 LOAD NEWS
  useEffect(() => {
    loadNews();
  }, []);

  async function loadNews() {
    try {
      const res = await axios.get("http://localhost:5000/news");

      const data = res.data.news || [];

      // Normalize values
      const clean = data.map(n => ({
        ...n,
        state: (n.state || "india").toLowerCase(),
        category: (n.category || "general").toLowerCase()
      }));

      setOriginalNews(clean);
      setFilteredNews(clean);

    } catch (err) {
      console.log("Error loading news:", err.message);
    }
  }

  // 🔥 APPLY FILTERS
  useEffect(() => {
    let data = [...originalNews];

    if (state !== "all") {
      data = data.filter(n => n.state === state);
    }

    if (category !== "all") {
      data = data.filter(n => n.category === category);
    }

    if (search) {
      data = data.filter(n =>
        (n.title || "").toLowerCase().includes(search.toLowerCase())
      );
    }

    setFilteredNews(data);
    setVisible(20);

  }, [search, state, category, originalNews]);

  // 🔄 INFINITE SCROLL
  useEffect(() => {
    const handleScroll = () => {
      if (
        window.innerHeight + window.scrollY >=
        document.body.offsetHeight - 100
      ) {
        setVisible(prev => prev + 20);
      }
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);

  }, []);

  return (
    <div className="app">

      {/* HEADER */}
      <div className="header">
        <h2>🧠 AI News</h2>

        <input
          placeholder="Search..."
          onChange={(e) => setSearch(e.target.value)}
        />

        {/* STATE FILTER */}
        <select onChange={(e) => setState(e.target.value)}>
          <option value="all">All States</option>
          <option value="india">India</option>
          <option value="tamil nadu">Tamil Nadu</option>
          <option value="andhra pradesh">Andhra Pradesh</option>
          <option value="karnataka">Karnataka</option>
          <option value="kerala">Kerala</option>
          <option value="telangana">Telangana</option>
        </select>

        {/* CATEGORY FILTER */}
        <select onChange={(e) => setCategory(e.target.value)}>
          <option value="all">All Categories</option>
          <option value="sports">Sports</option>
          <option value="technology">Technology</option>
          <option value="politics">Politics</option>
          <option value="business">Business</option>
          <option value="general">General</option>
        </select>
      </div>

      {/* EMPTY MESSAGE */}
      {filteredNews.length === 0 && (
        <h3 style={{ textAlign: "center" }}>
          ❌ No news found
        </h3>
      )}

      {/* NEWS GRID */}
      <div className="grid">
        {filteredNews.slice(0, visible).map((n, i) => (
          <div key={i} className="card">

            <img src={n.image || "https://via.placeholder.com/300"} alt="" />

            <div className="content">
              <h3>{n.title}</h3>
              <p>{n.summary}</p>

              <div className="meta">
                <span>{n.category}</span>
                <span>{n.state}</span>
              </div>

              <a href={n.url} target="_blank" rel="noreferrer">
                Read →
              </a>
            </div>

          </div>
        ))}
      </div>

    </div>
  );
}

export default App;