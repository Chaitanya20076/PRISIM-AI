import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import {
  CalendarDays,
  Clock3,
  Megaphone,
  Pin,
  Sprout,
  ArrowUpRight,
  RefreshCw,
} from "lucide-react";

import "./announcements.css";

// Public homepage announcements are served by the backend from Firestore.
// Set VITE_API_URL in Frontend/.env if your backend is not running on localhost:5000.
const API_BASE_URL = (
  import.meta.env.VITE_API_URL ||
  import.meta.env.VITE_API_BASE_URL ||
  "http://localhost:5000"
).replace(/\/+$/, "");

const PUBLIC_ANNOUNCEMENTS_URL = `${API_BASE_URL}/api/announcements/public`;

function parseDate(value) {
  if (!value) return null;

  // Firestore Timestamp objects are serialized by the backend, but this also
  // supports ISO strings and timestamp-shaped values if the API returns them.
  if (typeof value === "object" && typeof value.seconds === "number") {
    const date = new Date(value.seconds * 1000);
    return Number.isNaN(date.getTime()) ? null : date;
  }

  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

function normalizeAnnouncements(payload) {
  const records = Array.isArray(payload)
    ? payload
    : Array.isArray(payload?.announcements)
      ? payload.announcements
      : Array.isArray(payload?.data?.announcements)
        ? payload.data.announcements
        : [];

  const now = Date.now();

  return records
    .filter((item) => {
      if (!item?.title?.trim()) return false;

      const status = String(item.status || "published").toLowerCase();
      if (status !== "published") return false;

      const publishDate = parseDate(item.date);
      if (publishDate && publishDate.getTime() > now) return false;

      const expiryDate = parseDate(item.expiryDate || item.expiresAt);
      if (expiryDate && expiryDate.getTime() <= now) return false;

      return true;
    })
    .sort((a, b) => {
      if (Boolean(a.pinned) !== Boolean(b.pinned)) {
        return a.pinned ? -1 : 1;
      }

      return (
        (parseDate(b.date)?.getTime() || 0) -
        (parseDate(a.date)?.getTime() || 0)
      );
    })
    .map((item, index) => ({
      ...item,
      sourceId: item.id || `${item.title}-${item.date || index}`,
      body: item.body || item.message || "",
    }));
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
  const date = parseDate(value);
  if (!date) return "Time not specified";

  return date.toLocaleTimeString("en-IN", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
}

function Announcements() {
  const navigate = useNavigate();

  const [announcements, setAnnouncements] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState("");

  const refreshAnnouncements = useCallback(async () => {
    try {
      const response = await fetch(PUBLIC_ANNOUNCEMENTS_URL, {
        method: "GET",
        headers: { Accept: "application/json" },
        cache: "no-store",
      });

      const result = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(
          result.message ||
            result.error ||
            `Unable to load announcements (${response.status}).`
        );
      }

      setAnnouncements(normalizeAnnouncements(result));
      setLoadError("");
    } catch (error) {
      console.error("Homepage announcements could not be loaded:", error);
      setLoadError(
        error.message || "Could not connect to the announcements server."
      );
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    let active = true;
    let requestInProgress = false;

    const load = async () => {
      if (requestInProgress) return;
      requestInProgress = true;

      try {
        const response = await fetch(PUBLIC_ANNOUNCEMENTS_URL, {
          method: "GET",
          headers: { Accept: "application/json" },
          cache: "no-store",
        });

        const result = await response.json().catch(() => ({}));

        if (!response.ok) {
          throw new Error(
            result.message ||
              result.error ||
              `Unable to load announcements (${response.status}).`
          );
        }

        if (!active) return;
        setAnnouncements(normalizeAnnouncements(result));
        setLoadError("");
      } catch (error) {
        if (!active) return;
        console.error("Homepage announcements could not be loaded:", error);
        setLoadError(
          error.message || "Could not connect to the announcements server."
        );
      } finally {
        requestInProgress = false;
        if (active) setIsLoading(false);
      }
    };

    load();

    // Refresh Firestore-backed content periodically and when visitors return.
    const syncInterval = window.setInterval(load, 30000);
    const handleFocus = () => load();
    const handleOnline = () => load();

    window.addEventListener("focus", handleFocus);
    window.addEventListener("online", handleOnline);

    return () => {
      active = false;
      window.clearInterval(syncInterval);
      window.removeEventListener("focus", handleFocus);
      window.removeEventListener("online", handleOnline);
    };
  }, []);

  const visibleAnnouncements = announcements.slice(0, 3);

  return (
    <section className="prism-announcements" id="announcements">
      {/* Background atmosphere */}
      <div className="announcements-atmosphere" aria-hidden="true">
        <span className="announcements-orbit announcements-orbit-one" />
        <span className="announcements-orbit announcements-orbit-two" />
        <span className="announcements-particle announcements-particle-one" />
        <span className="announcements-particle announcements-particle-two" />
        <span className="announcements-particle announcements-particle-three" />
        <span className="announcements-aurora" />
      </div>

      <div className="announcements-shell">
        {/* Heading */}
        <header className="announcements-heading">
          <div className="announcements-heading-copy">
            <span className="announcements-eyebrow">
              <span className="announcements-live-dot" />
              THE LATEST FROM PRISM
            </span>

            <h2>
              Good things are
              <br />
              <span>worth sharing.</span>
            </h2>

            <p>
              Updates, opportunities, important dates, and everything
              happening in our AI community.
            </p>
          </div>

          <div className="announcements-heading-mark" aria-hidden="true">
            <Megaphone size={34} strokeWidth={1.5} />
            <span>PRISM / UPDATES</span>
          </div>
        </header>

        {/* Section bar */}
        <div className="announcements-section-bar">
          <div>
            <span className="announcements-bar-number">02</span>
            <span>Announcements</span>
          </div>

          <span className="announcements-count" aria-live="polite">
            {isLoading
              ? "SYNCING..."
              : `${String(announcements.length).padStart(2, "0")} ${
                  announcements.length === 1 ? "UPDATE" : "UPDATES"
                }`}
          </span>
        </div>

        {/* Announcement list */}
        {visibleAnnouncements.length > 0 ? (
          <>
            <div className="announcements-list" aria-live="polite">
              {visibleAnnouncements.map((item, index) => (
                <article
                  className={`announcement-card ${
                    item.pinned ? "announcement-card-pinned" : ""
                  }`}
                  key={item.sourceId}
                  style={{ "--announcement-index": index }}
                >
                  <div className="announcement-card-marker">
                    {item.pinned ? (
                      <Pin size={19} strokeWidth={1.8} />
                    ) : (
                      <span>{String(index + 1).padStart(2, "0")}</span>
                    )}
                  </div>

                  <div className="announcement-card-content">
                    <div className="announcement-card-topline">
                      <div className="announcement-labels">
                        {item.pinned && (
                          <span className="announcement-pinned-label">
                            <Pin size={12} />
                            PINNED
                          </span>
                        )}

                        {item.category && (
                          <span className="announcement-event-label">
                            {item.category}
                          </span>
                        )}
                      </div>

                      <ArrowUpRight
                        className="announcement-arrow"
                        size={19}
                        aria-hidden="true"
                      />
                    </div>

                    <h3>{item.title}</h3>

                    {item.body && (
                      <p className="announcement-body">{item.body}</p>
                    )}

                    <div className="announcement-meta">
                      <span>
                        <CalendarDays size={15} />
                        {formatDate(item.date)}
                      </span>

                      <span>
                        <Clock3 size={15} />
                        {formatTime(item.date)}
                      </span>
                    </div>
                  </div>
                </article>
              ))}
            </div>

            {announcements.length > 3 && (
              <button
                type="button"
                className="announcements-view-more"
                onClick={() => navigate("/news-and-updates")}
              >
                View all announcements
                <ArrowUpRight size={17} />
              </button>
            )}
          </>
        ) : (
          <div className="announcements-empty">
            <div className="announcements-empty-icon">
              {isLoading ? (
                <RefreshCw size={27} strokeWidth={1.5} />
              ) : (
                <Sprout size={29} strokeWidth={1.5} />
              )}
            </div>

            <span className="announcements-empty-kicker">
              {isLoading
                ? "CONNECTING TO PRISM"
                : loadError
                  ? "UPDATES TEMPORARILY UNAVAILABLE"
                  : "A LITTLE QUIET FOR NOW"}
            </span>

            <h3>
              {isLoading
                ? "Loading announcements..."
                : loadError
                  ? "We couldn't load the latest updates."
                  : "No announcements yet."}
            </h3>

            <p>
              {isLoading
                ? "Fetching the latest published announcements."
                : loadError
                  ? "Please check back in a moment. Published updates will appear here once the connection is restored."
                  : "Nothing new to share just yet. When PRISM AI publishes an announcement, it will show up here."}
            </p>

            {loadError && (
              <button
                type="button"
                className="announcements-view-more"
                onClick={() => {
                  setIsLoading(true);
                  refreshAnnouncements();
                }}
              >
                Try again
                <RefreshCw size={15} />
              </button>
            )}

            {!isLoading && !loadError && (
              <span className="announcements-empty-footer">
                GOOD IDEAS ARE GROWING <span>✳</span>
              </span>
            )}
          </div>
        )}

        {/* Footer */}
        <footer className="announcements-footer">
          <span>STAY CURIOUS. STAY IN THE LOOP.</span>
          <span className="announcements-footer-symbol">P.</span>
        </footer>
      </div>
    </section>
  );
}

export default Announcements;
