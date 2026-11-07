
import { useEffect, useState } from "react";
import {
  ArrowDownRight,
  ArrowUpRight,
  CalendarDays,
  Sparkles,
} from "lucide-react";
import { Link } from "react-router-dom";
import "./hero.css";

const focusAreas = [
  {
    number: "01",
    title: "Artificial Intelligence",
    description: "Exploring models, methods and emerging AI systems.",
    accent: "lime",
  },
  {
    number: "02",
    title: "Research & Discovery",
    description: "Turning questions into experiments and new ideas.",
    accent: "coral",
  },
  {
    number: "03",
    title: "Projects & Innovation",
    description: "Building practical solutions to real-world problems.",
    accent: "gold",
  },
  {
    number: "04",
    title: "Community & Learning",
    description: "Growing through collaboration and shared knowledge.",
    accent: "sage",
  },
];

const API_BASE_URL = (
  import.meta.env.VITE_API_URL ||
  import.meta.env.VITE_API_BASE_URL ||
  "http://localhost:5000"
).replace(/\/+$/, "");

const PUBLIC_EVENTS_ENDPOINT = `${API_BASE_URL}/api/events?type=all`;
const EVENT_REFRESH_MS = 30_000;
const EVENT_ROTATION_MS = 6_500;

const normalizeText = (value) =>
  String(value || "").trim().toLowerCase();

const parseEventDate = (value) => {
  if (!value) return null;

  if (value instanceof Date) {
    return Number.isNaN(value.getTime()) ? null : value;
  }

  if (typeof value === "object") {
    if (typeof value.seconds === "number") {
      const date = new Date(value.seconds * 1000);
      return Number.isNaN(date.getTime()) ? null : date;
    }

    if (typeof value._seconds === "number") {
      const date = new Date(value._seconds * 1000);
      return Number.isNaN(date.getTime()) ? null : date;
    }
  }

  const raw = String(value).trim();
  if (!raw) return null;

  // Date-only values are interpreted in the visitor's local timezone.
  const date = new Date(/^\d{4}-\d{2}-\d{2}$/.test(raw) ? `${raw}T12:00:00` : raw);
  return Number.isNaN(date.getTime()) ? null : date;
};

const getEventStartDate = (event) =>
  parseEventDate(event.startDate || event.date);

const isPublishedPublicEvent = (event = {}) =>
  normalizeText(event.status) === "published" &&
  normalizeText(event.visibility || "public") === "public";

const isUpcomingEvent = (event) => {
  const startDate = getEventStartDate(event);
  if (!startDate || !isPublishedPublicEvent(event)) return false;

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const startDay = new Date(startDate);
  startDay.setHours(0, 0, 0, 0);

  return startDay >= today;
};

const eventSlug = (event) =>
  String(
    event.slug ||
      event.id ||
      event.title ||
      event.name ||
      ""
  ).trim();

const eventPublicPath = (event) => {
  const slug = encodeURIComponent(eventSlug(event));
  const type = normalizeText(
    event.type || event.category || event.customCategory
  );

  if (!slug) return "/events";
  if (event.kind === "hackathon" || type.includes("hackathon")) {
    return `/events/hackathons/${slug}`;
  }
  if (type.includes("bootcamp")) return `/events/bootcamps/${slug}`;
  if (type.includes("webinar")) return `/events/webinars/${slug}`;
  if (
    /seminar|technical talk|talk\s*\/\s*seminar|guest lecture/.test(type)
  ) {
    return `/events/seminars/${slug}`;
  }

  return `/events/workshops/${slug}`;
};

const formatDate = (value) => {
  const date = parseEventDate(value);
  if (!date) return "";

  return new Intl.DateTimeFormat("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(date);
};

export default function Hero() {
  const [events, setEvents] = useState([]);
  const [activeEventIndex, setActiveEventIndex] = useState(0);

  // Fetch only public events from the existing backend endpoint.
  // The backend reads Firestore and excludes drafts/private events.
  useEffect(() => {
    let active = true;
    let requestInProgress = false;

    const fetchUpcomingEvents = async () => {
      if (requestInProgress) return;
      requestInProgress = true;

      try {
        const response = await fetch(PUBLIC_EVENTS_ENDPOINT, {
          method: "GET",
          headers: { Accept: "application/json" },
          cache: "no-store",
        });

        const payload = await response.json().catch(() => ({}));

        if (!response.ok || payload.success === false) {
          throw new Error(
            payload.message || `Could not fetch events (${response.status}).`
          );
        }

        const publicEvents = Array.isArray(payload.events)
          ? payload.events
          : Array.isArray(payload)
            ? payload
            : [];

        const upcoming = publicEvents
          .filter(isUpcomingEvent)
          .sort(
            (a, b) =>
              getEventStartDate(a).getTime() -
              getEventStartDate(b).getTime()
          );

        if (active) {
          setEvents(upcoming);
          setActiveEventIndex((current) =>
            upcoming.length ? current % upcoming.length : 0
          );
        }
      } catch (error) {
        console.error("PRISM homepage upcoming events:", error);
        // Keep the last successfully fetched list visible during temporary
        // network outages instead of abruptly removing the event bar.
      } finally {
        requestInProgress = false;
      }
    };

    fetchUpcomingEvents();

    const refreshInterval = window.setInterval(
      fetchUpcomingEvents,
      EVENT_REFRESH_MS
    );

    const refreshOnFocus = () => {
      if (document.visibilityState === "visible") fetchUpcomingEvents();
    };

    window.addEventListener("focus", refreshOnFocus);
    document.addEventListener("visibilitychange", refreshOnFocus);

    return () => {
      active = false;
      window.clearInterval(refreshInterval);
      window.removeEventListener("focus", refreshOnFocus);
      document.removeEventListener("visibilitychange", refreshOnFocus);
    };
  }, []);

  // Rotate through all eligible published events when more than one exists.
  useEffect(() => {
    if (events.length <= 1) {
      setActiveEventIndex(0);
      return undefined;
    }

    const rotationInterval = window.setInterval(() => {
      setActiveEventIndex((current) => (current + 1) % events.length);
    }, EVENT_ROTATION_MS);

    return () => window.clearInterval(rotationInterval);
  }, [events.length]);

  const featuredEvent = events[activeEventIndex] || null;

  const scrollTo = (id) => {
    document.getElementById(id)?.scrollIntoView({
      behavior: window.matchMedia(
        "(prefers-reduced-motion: reduce)"
      ).matches
        ? "auto"
        : "smooth",
      block: "start",
    });
  };

  const eventUrl = featuredEvent
    ? eventPublicPath(featuredEvent)
    : "/events";

  return (
    <main className="prism-home-hero" id="home">
      <div className="prism-atmosphere" aria-hidden="true">
        <span className="prism-orbit prism-orbit-one" />
        <span className="prism-orbit prism-orbit-two" />
        <span className="prism-atmosphere-dot" />
        <span className="prism-grid-glow" />
        <span className="prism-glass-orb prism-glass-orb-one" />
        <span className="prism-glass-orb prism-glass-orb-two" />
        <span className="prism-glass-orb prism-glass-orb-three" />
        <span className="prism-glass-shimmer" />
        <span className="prism-glass-cross prism-glass-cross-one">✳</span>
        <span className="prism-glass-cross prism-glass-cross-two">✳</span>
      </div>

      {featuredEvent && (
        <Link
          className="prism-event-ribbon"
          to={eventUrl}
          aria-label={`View event: ${featuredEvent.title || featuredEvent.name || "Upcoming PRISM AI event"}`}
          title="Open published event"
        >
          <span className="prism-event-ribbon-mark">
            <Sparkles size={15} />
          </span>

          <span className="prism-event-ribbon-label">
            UPCOMING EVENT
            {events.length > 1 && (
              <span className="prism-event-ribbon-count">
                {String(activeEventIndex + 1).padStart(2, "0")} / {String(events.length).padStart(2, "0")}
              </span>
            )}
          </span>

          <span className="prism-event-ribbon-title">
            {featuredEvent.name ||
              featuredEvent.title ||
              "Upcoming PRISM AI event"}
          </span>

          {(featuredEvent.startDate || featuredEvent.date) && (
            <span className="prism-event-ribbon-date">
              <CalendarDays size={14} />
              {formatDate(featuredEvent.startDate || featuredEvent.date)}
            </span>
          )}

          <span className="prism-event-ribbon-link">
            View event <ArrowUpRight size={15} />
          </span>
        </Link>
      )}

      <section className="prism-hero-content">
        <div className="prism-hero-left">
          <div className="prism-eyebrow">
            <span className="prism-eyebrow-line" />
            THE ARTIFICIAL INTELLIGENCE COMMUNITY AT RNSIT
          </div>

          <h1 className="prism-hero-title">
            <span
              className="prism-word prism-word-explore"
              data-text="Explore."
            >
              Explore.
            </span>

            <span
              className="prism-word prism-word-innovate"
              data-text="Innovate."
            >
              Innovate.
            </span>

            <span
              className="prism-word prism-word-impact"
              data-text="Impact."
            >
              Impact.
            </span>
          </h1>

          <p className="prism-hero-description">
            A community of curious minds exploring artificial
            intelligence, developing thoughtful solutions, and turning
            ideas into meaningful work through research, collaboration
            and hands-on building.
          </p>

          <div className="prism-hero-actions">
            <button
              type="button"
              className="prism-primary-button"
              onClick={() => scrollTo("home-introduction")}
            >
              Discover PRISM AI <ArrowUpRight size={17} />
            </button>

            <Link to="/events" className="prism-secondary-button">
              Explore events <ArrowDownRight size={17} />
            </Link>
          </div>

          <div className="prism-hero-caption" aria-label="Our approach">
            <span>LEARN WITH PURPOSE</span>
            <span className="prism-caption-divider" />
            <span>BUILD WITH INTENT</span>
            <span className="prism-caption-divider" />
            <span>CREATE IMPACT</span>
          </div>
        </div>

        <aside
          className="prism-hero-aside"
          aria-label="PRISM AI focus areas"
        >
          <div className="prism-aside-heading">
            <span>INSIDE PRISM</span>
            <span className="prism-aside-index">01 — 04</span>
          </div>

          <div className="prism-aside-intro">
            <span className="prism-aside-kicker">
              CURIOSITY IN ACTION
            </span>

            <h2>
              Ideas don't
              <br />
              stay <span>ideas.</span>
            </h2>

            <p>
              We question, experiment, collaborate and create things
              that move beyond the screen.
            </p>
          </div>

          <div className="prism-focus-list">
            {focusAreas.map((area) => (
              <article
                key={area.number}
                className={`prism-focus-item prism-focus-${area.accent}`}
              >
                <span className="prism-focus-number">
                  {area.number}
                </span>

                <div className="prism-focus-copy">
                  <h3>{area.title}</h3>
                  <p>{area.description}</p>
                </div>

                <span
                  className="prism-focus-indicator"
                  aria-hidden="true"
                />
              </article>
            ))}
          </div>

          <div className="prism-aside-footer">
            <span className="prism-footer-mark">P.</span>

            <div className="prism-footer-copy">
              <strong>Explore. Innovate. Impact.</strong>
              <span>STUDENT-LED · FUTURE-FOCUSED</span>
            </div>

            <span className="prism-footer-index">RNSIT / BLR</span>
          </div>
        </aside>
      </section>

      <footer className="prism-hero-footer">
        <span>
          PRISM AI <span className="prism-footer-separator">/</span>{" "}
          RNSIT, BENGALURU
        </span>

        <button
          type="button"
          className="prism-scroll-link"
          onClick={() => scrollTo("home-introduction")}
        >
          SCROLL TO DISCOVER <span aria-hidden="true">↓</span>
        </button>
      </footer>
    </main>
  );
}
