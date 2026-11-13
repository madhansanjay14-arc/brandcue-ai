import { useState } from "react";
import "./App.css";

function App() {
  const [activePage, setActivePage] = useState("Dashboard");
  const [contentTitle, setContentTitle] = useState("");
  const [contentType, setContentType] = useState("Social Media");
  const [content, setContent] = useState("");

  const menuItems = [
    "Dashboard",
    "Brand Guidelines",
    "Content Checker",
    "Review Queue",
    "History",
  ];

  function handleSubmit(e) {
    e.preventDefault();

    if (!contentTitle.trim() || !content.trim()) {
      alert("Please enter a title and content.");
      return;
    }

    alert("Content submitted successfully! AI integration is our next step.");
  }

  return (
    <div className="app-container">

      {/* SIDEBAR */}
      <aside className="sidebar">

        <div className="logo">
          <span className="logo-icon">B</span>
          <div>
            <h2>BrandCue AI</h2>
            <p>Brand Intelligence</p>
          </div>
        </div>

        <p className="menu-label">WORKSPACE</p>

        <nav>
          {menuItems.map((item) => (
            <button
              key={item}
              className={`nav-item ${
                activePage === item ? "active" : ""
              }`}
              onClick={() => setActivePage(item)}
            >
              <span>
                {{
                  Dashboard: "▦",
                  "Brand Guidelines": "◈",
                  "Content Checker": "✧",
                  "Review Queue": "☷",
                  History: "◷",
                }[item]}
              </span>

              {item}
            </button>
          ))}
        </nav>

        <div className="sidebar-bottom">
          <div className="profile">
            <div className="avatar">MS</div>

            <div>
              <strong>Madhan Sanjay</strong>
              <p>Administrator</p>
            </div>
          </div>
        </div>

      </aside>

      {/* MAIN CONTENT */}
      <main className="main-content">

        <header className="topbar">

          <div>
            <p className="breadcrumb">
              Workspace / {activePage}
            </p>

            <h2>{activePage}</h2>
          </div>

          <div className="topbar-right">
            <span className="status-indicator">
              ● System Online
            </span>

            <div className="avatar">MS</div>
          </div>

        </header>

        <section className="dashboard-content">

          {/* DASHBOARD PAGE */}
          {activePage === "Dashboard" && (

            <>
              <div className="welcome-section">

                <div>
                  <h1>Welcome to BrandCue AI 👋</h1>

                  <p>
                    Keep every piece of content consistent with your brand.
                  </p>
                </div>

                <button
                  className="primary-button"
                  onClick={() => setActivePage("Content Checker")}
                >
                  + Check New Content
                </button>

              </div>

              <div className="stats-grid">

                <div className="stat-card">
                  <p>Total Content Checked</p>
                  <h2>0</h2>
                  <span>All-time submissions</span>
                </div>

                <div className="stat-card">
                  <p>Compliant Content</p>
                  <h2>0</h2>
                  <span className="success-text">
                    Awaiting analysis
                  </span>
                </div>

                <div className="stat-card">
                  <p>Issues Detected</p>
                  <h2>0</h2>
                  <span className="warning-text">
                    Awaiting analysis
                  </span>
                </div>

                <div className="stat-card">
                  <p>Pending Reviews</p>
                  <h2>0</h2>
                  <span>Awaiting submissions</span>
                </div>

              </div>

              <div className="content-card">

                <div className="section-heading">
                  <div>
                    <h2>Recent Content Checks</h2>
                    <p>
                      Your latest brand compliance activity.
                    </p>
                  </div>

                  <button
                    className="text-button"
                    onClick={() => setActivePage("History")}
                  >
                    View History →
                  </button>
                </div>

                <p className="empty-state">
                  No content submissions yet. Start by checking your first
                  piece of content.
                </p>

              </div>
            </>

          )}

          {/* CONTENT CHECKER PAGE */}
          {activePage === "Content Checker" && (

            <div className="checker-container">

              <div className="welcome-section">
                <div>
                  <h1>Content Compliance Checker</h1>

                  <p>
                    Analyse your content against your approved brand guidelines.
                  </p>
                </div>
              </div>

              <form
                className="content-card checker-form"
                onSubmit={handleSubmit}
              >

                <div className="form-heading">
                  <h2>Submit Your Content</h2>

                  <p>
                    Enter the content you want to check.
                  </p>
                </div>

                <div className="form-group">

                  <label>Content Title</label>

                  <input
                    type="text"
                    placeholder="e.g. Summer Marketing Campaign"
                    value={contentTitle}
                    onChange={(e) => setContentTitle(e.target.value)}
                  />

                </div>

                <div className="form-group">

                  <label>Content Type</label>

                  <select
                    value={contentType}
                    onChange={(e) => setContentType(e.target.value)}
                  >
                    <option>Social Media</option>
                    <option>Advertisement</option>
                    <option>Email</option>
                    <option>Website Copy</option>
                    <option>Marketing Document</option>
                  </select>

                </div>

                <div className="form-group">

                  <label>Content to Analyse</label>

                  <textarea
                    placeholder="Paste your marketing content here..."
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    rows={9}
                    maxLength={10000}
                  />

                  <div className="character-count">
                    {content.length} / 10000 characters
                  </div>

                </div>

                <div className="checker-info">
                  <span>✦</span>

                  Your content will be checked against your organisation's
                  approved brand guidelines.
                </div>

                <button
                  type="submit"
                  className="primary-button analyze-button"
                >
                  ✦ Submit for Analysis
                </button>

              </form>

            </div>

          )}

          {/* OTHER PAGES */}
          {!["Dashboard", "Content Checker"].includes(activePage) && (

            <div className="content-card">
              <h2>{activePage}</h2>

              <p className="empty-state">
                This module is under development.
              </p>
            </div>

          )}

          <footer>
            BrandCue AI © 2026 · Every Content. One Consistent Brand.
          </footer>

        </section>

      </main>

    </div>
  );
}

export default App;