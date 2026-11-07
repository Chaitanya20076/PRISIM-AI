
import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  ArrowLeft,
  ArrowUpRight,
  BellRing,
  CalendarDays,
  Clock3,
  Search,
  X,
  Moon,
  Sun,
} from "lucide-react";

import "./NewsAndUpdates.css";

const API_BASE_URL = (
  import.meta.env.VITE_API_URL ||
  import.meta.env.VITE_API_BASE_URL ||
  "http://localhost:5000"
).replace(/\/$/, "");

const PUBLIC_ANNOUNCEMENTS_URL = `${API_BASE_URL}/api/announcements/public`;


function getSavedTheme() {
  if (typeof window === "undefined") return "light";

  try {
    const savedTheme = localStorage.getItem("prism-theme");
    if (savedTheme === "light" || savedTheme === "dark") return savedTheme;
  } catch {
    // Continue with the document theme if storage is unavailable.
  }

  return document.documentElement.dataset.theme === "dark" ? "dark" : "light";
}

function applyTheme(theme) {
  document.documentElement.dataset.theme = theme;
  document.documentElement.style.colorScheme = theme;
  try {
    localStorage.setItem("prism-theme", theme);
  } catch {
    // Keep the selected theme active for this session.
  }
  window.dispatchEvent(
    new CustomEvent("prism-theme-change", { detail: { theme } })
  );
}

function getAnnouncementDate(item) {
  return item.date || item.publishDate || item.publishedAt || item.createdAt || "";
}

function getAnnouncementTime(item) {
  return item.time || item.publishTime || item.createdTime || "";
}

function getAnnouncementBody(item) {
  return item.body || item.message || item.description || "";
}

function getAnnouncementCategory(item) {
  return item.category || item.type || "General";
}

function parseDate(value) {
  if (!value) return null;

  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

function formatDate(value) {
  const date = parseDate(value);

  if (!date) return "Date not specified";

  return date.toLocaleDateString("en-IN", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

function formatTime(value) {
  if (!value) return "";

  const match = String(value).match(/^(\d{1,2}):(\d{2})$/);

  if (match) {
    const date = new Date();
    date.setHours(Number(match[1]), Number(match[2]), 0, 0);

    return date.toLocaleTimeString("en-IN", {
      hour: "numeric",
      minute: "2-digit",
    });
  }

  return String(value);
}

function getUniqueKey(item, index) {
  return (
    item.id ||
    `${item.title || "announcement"}-${getAnnouncementDate(item)}-${index}`
  );
}

function isPublicAnnouncement(item) {
  const status = String(item.status || "published").toLowerCase();

  if (["draft", "archived", "deleted", "unpublished"].includes(status)) {
    return false;
  }

  if (status === "scheduled") {
    const publishDate = parseDate(getAnnouncementDate(item));
    if (publishDate && publishDate > new Date()) return false;
  }

  const publishDate = parseDate(getAnnouncementDate(item));

  if (publishDate && publishDate > new Date()) {
    return false;
  }

  const expiry = parseDate(item.expiryDate || item.expiresAt);

  if (expiry && expiry < new Date()) {
    return false;
  }

  return Boolean(item.title && getAnnouncementBody(item));
}

function normalizeAnnouncements(payload) {
  const records = Array.isArray(payload)
    ? payload
    : Array.isArray(payload?.announcements)
      ? payload.announcements
      : Array.isArray(payload?.data?.announcements)
        ? payload.data.announcements
        : [];

  return records
    .filter(isPublicAnnouncement)
    .sort((a, b) => {
      if (Boolean(a.pinned) !== Boolean(b.pinned)) {
        return a.pinned ? -1 : 1;
      }

      const dateA = parseDate(getAnnouncementDate(a))?.getTime() || 0;
      const dateB = parseDate(getAnnouncementDate(b))?.getTime() || 0;
      return dateB - dateA;
    });
}

export default function NewsAndUpdates() {
  const [announcements, setAnnouncements] = useState([]);
  const [isLoadingAnnouncements, setIsLoadingAnnouncements] = useState(true);
  const [announcementError, setAnnouncementError] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [expandedId, setExpandedId] = useState(null);
  const [theme, setTheme] = useState(getSavedTheme);

  useEffect(() => {
    applyTheme(theme);
  }, [theme]);

  useEffect(() => {
    const syncTheme = (event) => {
      const nextTheme =
        event?.detail?.theme ||
        localStorage.getItem("prism-theme") ||
        document.documentElement.dataset.theme ||
        "light";
      if (nextTheme === "light" || nextTheme === "dark") setTheme(nextTheme);
    };

    const observer = new MutationObserver(() => {
      const nextTheme = document.documentElement.dataset.theme;
      if ((nextTheme === "light" || nextTheme === "dark") && nextTheme !== theme) {
        setTheme(nextTheme);
      }
    });

    window.addEventListener("storage", syncTheme);
    window.addEventListener("prism-theme-change", syncTheme);
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["data-theme"],
    });

    return () => {
      window.removeEventListener("storage", syncTheme);
      window.removeEventListener("prism-theme-change", syncTheme);
      observer.disconnect();
    };
  }, [theme]);

  useEffect(() => {
    let isMounted = true;

    const refreshAnnouncements = async () => {
      try {
        const response = await fetch(PUBLIC_ANNOUNCEMENTS_URL, {
          method: "GET",
          headers: { Accept: "application/json" },
          cache: "no-store",
        });

        const result = await response.json().catch(() => ({}));

        if (!response.ok) {
          throw new Error(
            result.message || result.error ||
            `Unable to load announcements (${response.status}).`
          );
        }

        if (!isMounted) return;
        setAnnouncements(normalizeAnnouncements(result));
        setAnnouncementError("");
      } catch (error) {
        if (!isMounted) return;
        setAnnouncementError(
          error.message || "Could not connect to the announcements server."
        );
      } finally {
        if (isMounted) setIsLoadingAnnouncements(false);
      }
    };

    refreshAnnouncements();
    const interval = window.setInterval(refreshAnnouncements, 30000);
    window.addEventListener("focus", refreshAnnouncements);

    return () => {
      isMounted = false;
      window.clearInterval(interval);
      window.removeEventListener("focus", refreshAnnouncements);
    };
  }, []);

  const categories = useMemo(() => {
    return [
      "All",
      ...new Set(announcements.map(getAnnouncementCategory)),
    ];
  }, [announcements]);

  const filteredAnnouncements = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();

    return announcements.filter((item) => {
      const matchesCategory =
        selectedCategory === "All" ||
        getAnnouncementCategory(item) === selectedCategory;

      const searchableText = [
        item.title,
        getAnnouncementBody(item),
        getAnnouncementCategory(item),
      ]
        .join(" ")
        .toLowerCase();

      return matchesCategory && searchableText.includes(query);
    });
  }, [announcements, searchQuery, selectedCategory]);

  return (
    <main className="prism-news-page">
      <div className="prism-news-background" aria-hidden="true">
        <span />
        <span />
      </div>

      <header className="prism-news-topbar">
        <Link to="/" className="prism-news-topbar-brand" aria-label="PRISM AI home">
          <img
            className="prism-news-topbar-logo"
            src={theme === "dark" ? "/images/prism-logo-dark.png" : "/images/prism-logo-light.png"}
            alt="PRISM AI Club"
          />
        </Link>

        <nav className="prism-news-nav" aria-label="Main navigation">
          <Link to="/"></Link>
          <a href="#news-list"></a>
        </nav>

        <div className="prism-news-topbar-actions">
          <Link to="/" className="prism-news-dashboard-link">
            <ArrowLeft size={15} />
            <span>Back to Home</span>
          </Link>
          <button
            type="button"
            className="prism-news-theme-toggle"
            onClick={() => setTheme((current) => (current === "dark" ? "light" : "dark"))}
            aria-label={`Switch to ${theme === "dark" ? "light" : "dark"} mode`}
            title={`Switch to ${theme === "dark" ? "light" : "dark"} mode`}
          >
            {theme === "dark" ? <Sun size={17} /> : <Moon size={17} />}
            <span>{theme === "dark" ? "Light mode" : "Dark mode"}</span>
          </button>
        </div>
      </header>

      <div className="prism-news-shell">

        <header className="prism-news-hero">
          <div className="prism-news-eyebrow">
            <span className="prism-news-live-dot" />
            PRISM AI · THE LATEST
          </div>

          <div className="prism-news-hero-content">
            <div>
              <h1>
                News &amp;
                <br />
                <span>Updates.</span>
              </h1>

              <p>
                Important notices, club milestones, opportunities and
                everything happening in the PRISM AI community.
              </p>
            </div>

            <div className="prism-news-hero-art" aria-hidden="true">
              <span className="prism-news-art-ring ring-one" />
              <span className="prism-news-art-ring ring-two" />
              <span className="prism-news-art-center">
                <BellRing size={34} strokeWidth={1.5} />
              </span>
              <span className="prism-news-art-spark">✳</span>
            </div>
          </div>

          <div className="prism-news-summary">
            <div>
              <strong>{announcements.length.toString().padStart(2, "0")}</strong>
              <span>Published announcements</span>
            </div>
            <span className="prism-news-summary-line" />
            <p>Stay informed. Stay involved.</p>
          </div>
        </header>

        <section className="prism-news-list-section" id="news-list">
          <div className="prism-news-section-heading">
            <div>
              <span className="prism-news-kicker">FROM OUR COMMUNITY</span>
              <h2>What’s happening</h2>
            </div>

            <span className="prism-news-results-count">
              {filteredAnnouncements.length}{" "}
              {filteredAnnouncements.length === 1 ? "update" : "updates"}
            </span>
          </div>

          <div className="prism-news-controls">
            <label className="prism-news-search">
              <Search size={18} />
              <input
                type="search"
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
                placeholder="Search announcements..."
                aria-label="Search announcements"
              />

              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery("")}
                  aria-label="Clear search"
                >
                  <X size={16} />
                </button>
              )}
            </label>

            <div className="prism-news-categories" aria-label="Filter by category">
              {categories.map((category) => (
                <button
                  key={category}
                  type="button"
                  className={
                    selectedCategory === category ? "is-active" : ""
                  }
                  onClick={() => setSelectedCategory(category)}
                >
                  {category}
                </button>
              ))}
            </div>
          </div>

          {filteredAnnouncements.length > 0 ? (
            <div className="prism-news-list">
              {filteredAnnouncements.map((item, index) => {
                const key = getUniqueKey(item, index);
                const body = getAnnouncementBody(item);
                const expanded = expandedId === key;
                const time = getAnnouncementTime(item);

                return (
                  <article
                    className={`prism-news-card ${
                      item.pinned ? "is-pinned" : ""
                    }`}
                    key={key}
                  >
                    <div className="prism-news-card-index">
                      {String(index + 1).padStart(2, "0")}
                    </div>

                    <div className="prism-news-card-main">
                      <div className="prism-news-card-meta">
                        <span className="prism-news-category">
                          {getAnnouncementCategory(item)}
                        </span>

                        {item.pinned && (
                          <span className="prism-news-pinned">
                            PINNED
                          </span>
                        )}
                      </div>

                      <h3>{item.title}</h3>

                      <div
                        className={`prism-news-body ${
                          expanded ? "is-expanded" : ""
                        }`}
                      >
                        {body}
                      </div>

                      {body.length > 220 && (
                        <button
                          type="button"
                          className="prism-news-read-more"
                          onClick={() =>
                            setExpandedId(expanded ? null : key)
                          }
                        >
                          {expanded ? "Show less" : "Read full announcement"}
                          <ArrowUpRight size={15} />
                        </button>
                      )}

                      <div className="prism-news-card-footer">
                        <span>
                          <CalendarDays size={15} />
                          {formatDate(getAnnouncementDate(item))}
                        </span>

                        {time && (
                          <span>
                            <Clock3 size={15} />
                            {formatTime(time)}
                          </span>
                        )}
                      </div>
                    </div>

                    <span className="prism-news-card-arrow" aria-hidden="true">
                      <ArrowUpRight size={20} />
                    </span>
                  </article>
                );
              })}
            </div>
          ) : (
            <div className="prism-news-empty">
              <span className="prism-news-empty-icon">
                <BellRing size={25} />
              </span>

              <h3>
                {isLoadingAnnouncements
                  ? "Loading announcements..."
                  : announcementError
                    ? "Announcements couldn't be loaded"
                    : announcements.length === 0
                      ? "No announcements right now"
                      : "No matching announcements"}
              </h3>

              <p>
                {isLoadingAnnouncements
                  ? "Fetching the latest updates from PRISM AI."
                  : announcementError
                    ? `${announcementError} Please check the backend server and try again.`
                    : announcements.length === 0
                      ? "There are no published updates at the moment. Check back soon!"
                      : "Try another search term or choose a different category."}
              </p>

              {(searchQuery || selectedCategory !== "All") && (
                <button
                  type="button"
                  onClick={() => {
                    setSearchQuery("");
                    setSelectedCategory("All");
                  }}
                >
                  Clear filters
                </button>
              )}
            </div>
          )}
        </section>

        <footer className="prism-news-footer">
          <Link to="/" className="prism-news-footer-brand">
            PRISM AI<span>.</span>
          </Link>

          <p>Explore. Innovate. Impact.</p>

          <span>RNS INSTITUTE OF TECHNOLOGY · BENGALURU</span>
        </footer>
      </div>
    </main>
  );
}
