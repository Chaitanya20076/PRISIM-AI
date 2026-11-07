import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  ArrowDown,
  ArrowRight,
  ArrowUpRight,
  CalendarDays,
  Clock3,
  MapPin,
  Search,
  SlidersHorizontal,
  Trophy,
  Users,
  X,
  Sparkles,
  ExternalLink,
  Moon,
  Sun,
} from "lucide-react";
import "./LandingOverview.css";

const EVENT_STORAGE_KEY = "prism-admin-events";
const HACKATHON_STORAGE_KEY = "prism-hackathons-v1";
const API_BASE_URL = (
  import.meta.env.VITE_API_URL ||
  import.meta.env.VITE_API_BASE_URL ||
  "http://localhost:5000"
).replace(/\/$/, "");

function readList(key) {
  try {
    const value = JSON.parse(localStorage.getItem(key) || "[]");
    return Array.isArray(value) ? value : [];
  } catch {
    return [];
  }
}

function getSavedTheme() {
  try {
    const saved = localStorage.getItem("prism-theme");
    if (saved === "dark" || saved === "light") return saved;

    const current = document.documentElement.dataset.theme;
    if (current === "dark" || current === "light") return current;
  } catch {
    // Fall back to light mode.
  }

  return "light";
}

function applyTheme(theme) {
  document.documentElement.dataset.theme = theme;
  document.documentElement.style.colorScheme = theme;

  try {
    localStorage.setItem("prism-theme", theme);
  } catch {
    // Theme still applies for this session.
  }

  window.dispatchEvent(
    new CustomEvent("prism-theme-change", {
      detail: { theme },
    })
  );
}

function safeDate(value, endOfDay = false) {
  if (!value) return null;

  const normalized =
    typeof value === "string" && value.length === 10
      ? `${value}T${endOfDay ? "23:59:59" : "12:00:00"}`
      : value;

  const date = new Date(normalized);
  return Number.isNaN(date.getTime()) ? null : date;
}

function formatDate(value) {
  const date = safeDate(value);
  if (!date) return "Date to be announced";

  return date.toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function dateRange(item) {
  const start = item.startDate;
  const end = item.endDate;

  if (!start && !end) return "Dates to be announced";

  if (start && end && start !== end) {
    return `${formatDate(start)} — ${formatDate(end)}`;
  }

  return formatDate(start || end);
}

// Read all three fields independently.
// This prevents a Workshop from being misclassified because another
// field contains a different value.
function eventTypeValues(event = {}) {
  return [event.type, event.category, event.customCategory]
    .filter(Boolean)
    .map((value) => String(value).trim().toLowerCase());
}

function hasEventType(event, pattern) {
  return eventTypeValues(event).some((value) => pattern.test(value));
}

// Hackathons are managed and displayed in their own category.
// Firestore's public events endpoint can return them alongside other events,
// so identify them by every available type field before splitting the data.
function isHackathonRecord(event = {}) {
  return (
    event.kind === "hackathon" ||
    eventTypeValues(event).some((value) =>
      /^(hackathon|hackathons)$/i.test(value)
    )
  );
}

function isPublishedPublicEvent(event = {}) {
  const status = String(event.status || "").trim().toLowerCase();
  const visibility = String(event.visibility || "Public").trim().toLowerCase();

  return status === "published" && visibility === "public";
}

function categoryOf(event) {
  if (isHackathonRecord(event)) return "Hackathon";

  if (hasEventType(event, /^workshop$/i)) return "Workshop";
  if (hasEventType(event, /^seminar$/i)) return "Seminar";
  if (hasEventType(event, /^webinar$/i)) return "Webinar";
  if (hasEventType(event, /^bootcamp$/i)) return "Bootcamp";
  if (hasEventType(event, /competition|contest|ideathon/i)) {
    return "Competition";
  }

  return event.category === "Others" && event.customCategory
    ? event.customCategory
    : event.customCategory || event.category || event.type || "Event";
}

function imageOf(_item) {
  return "";
}

function eventIsPast(item) {
  const end = safeDate(item.endDate || item.startDate, true);
  return Boolean(end && end.getTime() < Date.now());
}

function registrationClosed(item) {
  if (item.kind === "hackathon") {
    const closes = safeDate(item.registrationCloses);
    const opens = safeDate(item.registrationOpens);

    if (
      item.status === "Archived" ||
      eventIsPast(item) ||
      (closes && closes.getTime() < Date.now())
    ) {
      return true;
    }

    if (opens && opens.getTime() > Date.now()) return false;

    return false;
  }

  const deadline = safeDate(item.registrationDeadline, true);

  return (
    eventIsPast(item) ||
    Boolean(deadline && deadline.getTime() < Date.now())
  );
}

function statusOf(item) {
  if (registrationClosed(item)) return "Registrations closed";

  if (item.kind === "hackathon") {
    const opens = safeDate(item.registrationOpens);

    if (opens && opens.getTime() > Date.now()) return "Opens soon";

    return "Registration open";
  }

  const start = safeDate(item.startDate);

  if (start && start.getTime() > Date.now()) return "Upcoming";

  return "Registration open";
}

function slugOf(item) {
  return String(
    item.slug || item.id || item.name || item.title || "hackathon"
  );
}

function publishedHackathon(item = {}) {
  const status = String(item.status || "").trim().toLowerCase();
  const visibility = String(item.visibility || "Public").trim().toLowerCase();

  return !["draft", "archived"].includes(status) && visibility === "public";
}

function makeUnifiedItems(events, hackathons) {
  const eventItems = events
    .filter(isPublishedPublicEvent)
    .filter((event) => !isHackathonRecord(event))
    .map((event, index) => ({
      ...event,
      kind: "event",
      unifiedId: `event-${event.id || event.name || event.title || index}`,
      displayName: event.name || event.title || "Untitled event",
      displayDescription:
        event.caption ||
        event.description ||
        "Explore this PRISM AI opportunity.",
      startDate: event.startDate || event.date || "",
      endDate: event.endDate || event.startDate || event.date || "",
    }));

  const hackathonItems = hackathons
    .filter(publishedHackathon)
    .map((item, index) => ({
      ...item,
      kind: "hackathon",
      unifiedId: `hackathon-${item.id || item.slug || index}`,
      displayName: item.name || item.title || "Untitled hackathon",
      displayDescription:
        item.shortDescription ||
        item.tagline ||
        item.description ||
        "Explore the challenge, choose a track and build something meaningful.",
      venue:
        item.venue ||
        (item.mode === "Online"
          ? "Online"
          : item.mode === "In-person"
            ? "Venue to be announced"
            : item.mode),
    }));

  return [...eventItems, ...hackathonItems].sort((a, b) => {
    const aPast = eventIsPast(a);
    const bPast = eventIsPast(b);

    if (aPast !== bPast) return aPast ? 1 : -1;

    return String(a.startDate || "9999-12-31").localeCompare(
      String(b.startDate || "9999-12-31")
    );
  });
}

function isWebinar(item) {
  return hasEventType(item, /webinar/i);
}

function isSeminar(item) {
  return hasEventType(item, /seminar|talk/i);
}

function isWorkshop(item) {
  return hasEventType(item, /workshop/i);
}

function isBootcamp(item) {
  return hasEventType(item, /bootcamp/i);
}

function isCompetition(item) {
  return hasEventType(item, /competition|contest|ideathon/i);
}

function isOtherEvent(item) {
  // Never classify a Hackathon as an Other Event, regardless of its source
  // or whether it was tagged with kind="event" by the public API.
  if (isHackathonRecord(item)) return false;

  const values = eventTypeValues(item);

  return (
    values.some((value) =>
      /^(other|others|other events?)$/i.test(value)
    ) ||
    (item.kind !== "hackathon" &&
      !isBootcamp(item) &&
      !isCompetition(item) &&
      !isWebinar(item) &&
      !isSeminar(item) &&
      !isWorkshop(item))
  );
}

function eventPath(item) {
  const slug = encodeURIComponent(slugOf(item));

  if (item.kind === "hackathon") {
    return `/events/hackathons/${slug}`;
  }

  if (isBootcamp(item)) return `/events/bootcamps/${slug}`;
  if (isCompetition(item)) return `/events/competitions/${slug}`;
  if (isOtherEvent(item)) return `/events/other/${slug}`;
  if (isWebinar(item)) return `/events/webinars/${slug}`;
  if (isSeminar(item)) return `/events/seminars/${slug}`;
  if (isWorkshop(item)) return `/events/workshops/${slug}`;

  return `/events/other/${slug}`;
}

function toneClass(item, index = 0) {
  if (item.kind === "hackathon") return "program-tone-hackathon";
  if (isBootcamp(item)) return "program-tone-bootcamp";
  if (isCompetition(item)) return "program-tone-competition";
  if (isOtherEvent(item)) return "program-tone-other-event";
  if (isWebinar(item)) return "program-tone-webinar";
  if (isSeminar(item)) return "program-tone-seminar";
  if (isWorkshop(item)) return "program-tone-workshop";

  return `program-tone-${index % 4}`;
}

function slideClass(item) {
  if (!item) return "is-default-slide";
  if (item.kind === "hackathon") return "is-hackathon-slide";
  if (isBootcamp(item)) return "is-bootcamp-slide";
  if (isCompetition(item)) return "is-competition-slide";
  if (isOtherEvent(item)) return "is-other-event-slide";
  if (isWebinar(item)) return "is-webinar-slide";
  if (isSeminar(item)) return "is-seminar-slide";
  if (isWorkshop(item)) return "is-workshop-slide";

  return "is-other-slide";
}

function EventArtwork({ item, index = 0, featured = false }) {
  const tone = toneClass(item, index);

  const label =
    item.kind === "hackathon"
      ? "HACKATHON"
      : isBootcamp(item)
        ? "BOOTCAMP"
        : isCompetition(item)
          ? "COMPETITION"
          : isOtherEvent(item)
            ? "OTHER EVENTS"
            : isWebinar(item)
              ? "WEBINAR"
              : isSeminar(item)
                ? "SEMINAR"
                : isWorkshop(item)
                  ? "WORKSHOP"
                  : categoryOf(item).toUpperCase();

  return (
    <div
      className={`program-art-fallback ${tone} ${
        featured ? "is-featured" : ""
      }`}
    >
      <span>PRISM AI · OPPORTUNITIES</span>
      <b>{label}</b>
      {!featured && <i>Explore. Innovate. Impact.</i>}
      <em aria-hidden="true">✳</em>
    </div>
  );
}

function EventDetailsModal({ item, onClose }) {
  useEffect(() => {
    if (!item) return undefined;

    const onKeyDown = (event) => {
      if (event.key === "Escape") onClose();
    };

    document.addEventListener("keydown", onKeyDown);
    document.body.style.overflow = "hidden";

    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = "";
    };
  }, [item, onClose]);

  if (!item) return null;

  const closed = registrationClosed(item);

  const highlights = Array.isArray(item.highlights)
    ? item.highlights.filter(Boolean)
    : String(item.highlights || "")
        .split(/\n|;/)
        .map((value) => value.trim())
        .filter(Boolean);

  return (
    <div
      className="program-modal-backdrop"
      role="presentation"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <article
        className="program-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="program-modal-title"
      >
        <button
          className="program-modal-close"
          onClick={onClose}
          aria-label="Close event details"
        >
          <X size={20} />
        </button>

        <div className="program-modal-art">
          <EventArtwork item={item} featured />
        </div>

        <div className="program-modal-content">
          <div className="program-modal-kicker">
            <span>{categoryOf(item)}</span>
            <i />
            <b className={closed ? "is-closed" : ""}>
              {statusOf(item)}
            </b>
          </div>

          <h2 id="program-modal-title">{item.displayName}</h2>

          {item.caption && (
            <p className="program-modal-caption">{item.caption}</p>
          )}

          <div className="program-modal-facts">
            <div>
              <CalendarDays size={17} />
              <span>DATE</span>
              <b>{dateRange(item)}</b>
            </div>

            <div>
              <Clock3 size={17} />
              <span>TIME</span>
              <b>
                {[item.startTime, item.endTime]
                  .filter(Boolean)
                  .join(" – ") || "To be announced"}
              </b>
            </div>

            <div>
              <MapPin size={17} />
              <span>VENUE</span>
              <b>{item.venue || "To be announced"}</b>
            </div>

            <div>
              <Users size={17} />
              <span>REGISTRATION DEADLINE</span>
              <b>
                {item.registrationDeadline
                  ? formatDate(item.registrationDeadline)
                  : "To be announced"}
              </b>
            </div>
          </div>

          {item.description && (
            <section className="program-modal-section">
              <h3>About this opportunity</h3>
              <p>{item.description}</p>
            </section>
          )}

          {highlights.length > 0 && (
            <section className="program-modal-section">
              <h3>What to expect</h3>
              <ul>
                {highlights.map((highlight, index) => (
                  <li key={`${highlight}-${index}`}>{highlight}</li>
                ))}
              </ul>
            </section>
          )}

          {(item.contactName || item.contactEmail) && (
            <div className="program-modal-contact">
              <span>QUESTIONS?</span>
              {item.contactName && <b>{item.contactName}</b>}
              {item.contactEmail && (
                <a href={`mailto:${item.contactEmail}`}>
                  {item.contactEmail}
                </a>
              )}
            </div>
          )}

          <div className="program-modal-actions">
            {closed ? (
              <span className="program-action-disabled">
                Registrations closed
              </span>
            ) : item.onPlatformRegistration ? (
              <span className="program-action-disabled">
                Registration through PRISM AI · Coming soon
              </span>
            ) : item.registrationLink ? (
              <a
                className="program-action-primary"
                href={item.registrationLink}
                target="_blank"
                rel="noreferrer"
              >
                Register now <ArrowUpRight size={16} />
              </a>
            ) : (
              <span className="program-action-disabled">
                Registration details to be announced
              </span>
            )}

            {item.website && (
              <a
                className="program-action-secondary"
                href={item.website}
                target="_blank"
                rel="noreferrer"
              >
                Event website <ExternalLink size={15} />
              </a>
            )}
          </div>
        </div>
      </article>
    </div>
  );
}

function ProgramCard({ item, index }) {
  return (
    <Link
      className={`program-card ${
        isCompetition(item)
          ? "program-card--competition"
          : isOtherEvent(item)
            ? "program-card--other-event"
            : isBootcamp(item)
              ? "program-card--bootcamp"
              : isWebinar(item)
                ? "program-card--webinar"
                : isSeminar(item)
                  ? "program-card--seminar"
                  : ""
      }`}
      to={eventPath(item)}
      aria-label={`View ${item.displayName}`}
    >
      <div className="program-card-art">
        <EventArtwork item={item} index={index} />

        <span className="program-card-category">
          {categoryOf(item)}
        </span>

        <span
          className={`program-card-status ${
            registrationClosed(item) ? "is-closed" : ""
          }`}
        >
          {statusOf(item)}
        </span>

        <span className="program-card-arrow">
          <ArrowUpRight size={18} />
        </span>
      </div>

      <div className="program-card-body">
        <div className="program-card-date">
          <CalendarDays size={14} />
          {dateRange(item)}
        </div>

        <h3>{item.displayName}</h3>
        <p>{item.displayDescription}</p>

        <div className="program-card-bottom">
          <span>
            <MapPin size={14} />
            {item.venue ||
              (item.mode === "Online"
                ? "Online"
                : "Venue to be announced")}
          </span>

          <strong>
            VIEW DETAILS <ArrowUpRight size={14} />
          </strong>
        </div>
      </div>
    </Link>
  );
}

export default function LandingOverview() {
  const [events, setEvents] = useState(() =>
    readList(EVENT_STORAGE_KEY).filter(isPublishedPublicEvent)
  );

  const [hackathons, setHackathons] = useState(() =>
    readList(HACKATHON_STORAGE_KEY).filter(publishedHackathon)
  );

  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState("All opportunities");
  const [sort, setSort] = useState("Soonest");
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [featuredIndex, setFeaturedIndex] = useState(0);

  const [theme, setTheme] = useState(getSavedTheme);
  const dark = theme === "dark";

  // Keep the saved theme applied when this page opens.
  useEffect(() => {
    applyTheme(theme);
  }, [theme]);

  // Synchronize with theme changes made by other PRISM AI pages.
  useEffect(() => {
    const syncTheme = (event) => {
      const eventTheme = event?.detail?.theme;

      if (eventTheme === "dark" || eventTheme === "light") {
        setTheme(eventTheme);
        return;
      }

      setTheme(getSavedTheme());
    };

    const observer = new MutationObserver(() => {
      const current = document.documentElement.dataset.theme;

      if (current === "dark" || current === "light") {
        setTheme(current);
      }
    });

    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["data-theme"],
    });

    window.addEventListener("storage", syncTheme);
    window.addEventListener("prism-theme-change", syncTheme);

    return () => {
      observer.disconnect();
      window.removeEventListener("storage", syncTheme);
      window.removeEventListener("prism-theme-change", syncTheme);
    };
  }, []);

  const toggleTheme = () => {
    const nextTheme = dark ? "light" : "dark";

    applyTheme(nextTheme);
    setTheme(nextTheme);
  };

  // Fetch all public published event types from Firestore.
  useEffect(() => {
    let active = true;

    const refresh = async () => {
      // Keep all published public legacy events supported as a fallback.
      // Firestore records are merged afterwards and take precedence on matching IDs.
      const legacyRecords = readList(EVENT_STORAGE_KEY).filter(
        isPublishedPublicEvent
      );
      const legacyEvents = legacyRecords.filter(
        (event) => !isHackathonRecord(event)
      );

      const savedHackathons = readList(
        HACKATHON_STORAGE_KEY
      ).filter(publishedHackathon);

      try {
        const response = await fetch(
          `${API_BASE_URL}/api/events?type=all`,
          {
            method: "GET",
            headers: { Accept: "application/json" },
            cache: "no-store",
          }
        );

        const data = await response.json();

        if (!response.ok || !data.success) {
          throw new Error(
            data.message ||
              `Could not load published events (${response.status}).`
          );
        }

        // The public backend already returns published/public events.
        // Apply the same check client-side as a safeguard. This includes
        // Webinar records exactly like Seminar and Workshop records.
        const firestoreRecords = Array.isArray(data.events)
          ? data.events.filter(isPublishedPublicEvent)
          : [];

        // Split Hackathons out before building the normal event list.
        // They live in Firestore too, but must appear only in the Hackathons
        // category and must never be counted as Other Events.
        const firestoreHackathons = firestoreRecords.filter(
          isHackathonRecord
        );
        const firestoreEvents = firestoreRecords.filter(
          (event) => !isHackathonRecord(event)
        );

        // De-duplicate normal events using Firestore document ID or slug.
        const combinedEvents = new Map();
        [...legacyEvents, ...firestoreEvents].forEach(
          (event, index) => {
            const key = String(
              event.id ||
                event.slug ||
                `${event.name || event.title || "event"}-${index}`
            );
            combinedEvents.set(key, event);
          }
        );

        // Firestore is the source of truth for newly created Hackathons.
        // Keep legacy localStorage Hackathons as a fallback, then let
        // Firestore records override matching IDs/slugs.
        const combinedHackathons = new Map();
        [...savedHackathons, ...firestoreHackathons].forEach(
          (item, index) => {
            const key = String(
              item.id ||
                item.slug ||
                `${item.name || item.title || "hackathon"}-${index}`
            );
            combinedHackathons.set(key, item);
          }
        );

        if (active) {
          setEvents(Array.from(combinedEvents.values()));
          setHackathons(
            Array.from(combinedHackathons.values()).filter(
              publishedHackathon
            )
          );
        }
      } catch (error) {
        console.error(
          "Could not load public Firestore events:",
          error
        );

        if (active) {
          setEvents(legacyEvents);
          setHackathons(savedHackathons);
        }
      }
    };

    refresh();

    window.addEventListener("storage", refresh);
    window.addEventListener("focus", refresh);

    // Pick up newly published events even if the page remains open.
    const refreshInterval = window.setInterval(refresh, 30000);

    return () => {
      active = false;
      window.clearInterval(refreshInterval);
      window.removeEventListener("storage", refresh);
      window.removeEventListener("focus", refresh);
    };
  }, []);

  const allItems = useMemo(
    () => makeUnifiedItems(events, hackathons),
    [events, hackathons]
  );

  const visibleItems = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    return [...allItems]
      .filter((item) => {
        const searchable = [
          item.displayName,
          item.displayDescription,
          item.description,
          item.venue,
          categoryOf(item),
          item.eligibility,
          ...(item.themes || []).map(
            (itemTheme) =>
              `${itemTheme.name || ""} ${
                itemTheme.description || ""
              } ${itemTheme.problemStatement || ""}`
          ),
        ]
          .filter(Boolean)
          .join(" ")
          .toLowerCase();

        const past = eventIsPast(item);

        const matchFilter =
          filter === "All opportunities" ||
          (filter === "Upcoming" && !past) ||
          (filter === "Registration open" &&
            !registrationClosed(item)) ||
          (filter === "Past" && past);

        return (
          searchable.includes(normalizedQuery) && matchFilter
        );
      })
      .sort((a, b) => {
        if (sort === "Newest") {
          return String(
            b.updatedAt || b.createdAt || ""
          ).localeCompare(
            String(a.updatedAt || a.createdAt || "")
          );
        }

        if (sort === "Past first") {
          return String(b.startDate || "").localeCompare(
            String(a.startDate || "")
          );
        }

        return String(
          a.startDate || "9999-12-31"
        ).localeCompare(
          String(b.startDate || "9999-12-31")
        );
      });
  }, [allItems, filter, query, sort]);

  const featuredPool = visibleItems.length
    ? visibleItems
    : allItems;

  useEffect(() => {
    setFeaturedIndex(0);
  }, [query, filter, sort, allItems.length]);

  useEffect(() => {
    if (featuredPool.length < 2) return undefined;

    const timer = window.setInterval(() => {
      setFeaturedIndex(
        (current) => (current + 1) % featuredPool.length
      );
    }, 5000);

    return () => window.clearInterval(timer);
  }, [featuredPool.length]);

  const featured = featuredPool.length
    ? featuredPool[featuredIndex % featuredPool.length]
    : null;

  const openCount = allItems.filter(
    (item) => !registrationClosed(item)
  ).length;

  const closeModal = () => {
    setSelectedEvent(null);
    window.history.replaceState(null, "", "/events");
  };

  return (
    <main className="prism-programs-page" id="top">
      {/* Page header and persistent theme toggle */}
      <div className="programs-page-topbar">
        <Link className="programs-page-brand" to="/">
          PRISM AI<span>.</span>
        </Link>

        <button
          type="button"
          className="programs-theme-toggle"
          onClick={toggleTheme}
          aria-label={`Switch to ${dark ? "light" : "dark"} mode`}
          title={`Switch to ${dark ? "light" : "dark"} mode`}
        >
          {dark ? (
            <Sun size={16} aria-hidden="true" />
          ) : (
            <Moon size={16} aria-hidden="true" />
          )}

          <span>{dark ? "Light mode" : "Dark mode"}</span>
        </button>
      </div>

      <section className={`programs-hero ${slideClass(featured)}`}>
        <div className="programs-hero-grid" aria-hidden="true" />

        <div className="programs-hero-copy">
          <span className="programs-eyebrow">
            <i /> PRISM AI · RNSIT
          </span>

          <h1>
            Discover your next <em>opportunity.</em>
          </h1>

          <p>
            Hackathons, competitions, workshops, talks and student-led
            experiences. Find something worth showing up for — and build
            what comes next.
          </p>

          <div className="programs-hero-search">
            <Search size={19} />

            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search events, hackathons, topics…"
              aria-label="Search all PRISM AI opportunities"
            />

            <a href="#program-list" aria-label="Browse opportunities">
              <ArrowRight size={19} />
            </a>
          </div>

          <a className="programs-browse-link" href="#program-list">
            Browse all opportunities <ArrowDown size={15} />
          </a>

          <div className="programs-hero-stats">
            <div>
              <b>{String(allItems.length).padStart(2, "0")}</b>
              <span>OPPORTUNITIES</span>
            </div>

            <div>
              <b>{String(openCount).padStart(2, "0")}</b>
              <span>OPEN NOW</span>
            </div>

            <div>
              <b>
                {String(
                  allItems.filter(
                    (item) => item.kind === "hackathon"
                  ).length
                ).padStart(2, "0")}
              </b>
              <span>HACKATHONS</span>
            </div>

            <div>
              <b>
                {String(
                  allItems.filter((item) =>
                    isCompetition(item)
                  ).length
                ).padStart(2, "0")}
              </b>
              <span>COMPETITIONS</span>
            </div>
          </div>
        </div>

        <div className="programs-feature-wrap">
          {featured ? (
            <div
              key={featured.unifiedId}
              className={`programs-feature-card ${slideClass(
                featured
              )}`}
            >
              <Link
                className="programs-feature-visual"
                to={eventPath(featured)}
                aria-label={`Open ${featured.displayName}`}
              >
                <EventArtwork item={featured} featured />

                <span className="programs-featured-ribbon">
                  <Sparkles size={13} /> FEATURED
                </span>

                <span className="programs-feature-overlay">
                  <b>{featured.displayName}</b>
                  <small>
                    {categoryOf(featured)} · {statusOf(featured)}
                  </small>
                </span>
              </Link>

              <div className="programs-feature-info">
                <span>
                  <CalendarDays size={14} />
                  {dateRange(featured)}
                </span>

                <span>
                  <MapPin size={14} />
                  {featured.venue || "Venue to be announced"}
                </span>

                <Link to={eventPath(featured)}>
                  Explore opportunity <ArrowUpRight size={16} />
                </Link>
              </div>

              {featuredPool.length > 1 && (
                <div
                  className="programs-feature-dots"
                  aria-label="Featured opportunity position"
                >
                  {featuredPool.map((item, index) => (
                    <button
                      type="button"
                      key={item.unifiedId}
                      className={
                        index ===
                        featuredIndex % featuredPool.length
                          ? "active"
                          : ""
                      }
                      onClick={() => setFeaturedIndex(index)}
                      aria-label={`Show featured item ${index + 1}`}
                    />
                  ))}
                </div>
              )}
            </div>
          ) : (
            <div className="programs-feature-empty">
              <Sparkles size={25} />
              <span>YOUR NEXT BUILD STARTS HERE</span>
              <h2>
                Something good
                <br />
                is taking shape.
              </h2>
              <p>Published opportunities will appear here.</p>
            </div>
          )}
        </div>
      </section>

      <section className="program-browser" id="program-list">
        <div className="program-browser-bar">
          <div
            className="program-filter-chips"
            aria-label="Filter opportunities"
          >
            {[
              "All opportunities",
              "Upcoming",
              "Registration open",
              "Past",
            ].map((value) => (
              <button
                type="button"
                key={value}
                className={filter === value ? "active" : ""}
                onClick={() => setFilter(value)}
              >
                {value}
              </button>
            ))}
          </div>

          <div className="program-browser-tools">
            <span>{visibleItems.length} opportunities</span>

            <label>
              <SlidersHorizontal size={15} />

              <select
                value={sort}
                onChange={(event) => setSort(event.target.value)}
                aria-label="Sort opportunities"
              >
                <option>Soonest</option>
                <option>Newest</option>
                <option>Past first</option>
              </select>
            </label>
          </div>
        </div>

        {visibleItems.length ? (
          <div className="program-grid">
            {visibleItems.map((item, index) => (
              <ProgramCard
                key={item.unifiedId}
                item={item}
                index={index}
              />
            ))}
          </div>
        ) : (
          <div className="programs-empty">
            <Search size={25} />

            <h2>
              {allItems.length
                ? "No matching opportunities"
                : "The next opportunity is on its way."}
            </h2>

            <p>
              {allItems.length
                ? "Try another search or filter to find what you're looking for."
                : "New PRISM AI events, competitions and hackathons will appear here when published."}
            </p>

            {allItems.length > 0 && (
              <button
                onClick={() => {
                  setQuery("");
                  setFilter("All opportunities");
                }}
              >
                Clear filters
              </button>
            )}
          </div>
        )}
      </section>

      <footer className="programs-footer">
        <Link to="/">
          PRISM AI<span>.</span>
        </Link>

        <span>EXPLORE. INNOVATE. IMPACT.</span>

        <span>RNS INSTITUTE OF TECHNOLOGY · BENGALURU</span>

        <button
          onClick={() =>
            window.scrollTo({ top: 0, behavior: "smooth" })
          }
        >
          BACK TO TOP ↑
        </button>
      </footer>

      <EventDetailsModal
        item={selectedEvent}
        onClose={closeModal}
      />
    </main>
  );
}