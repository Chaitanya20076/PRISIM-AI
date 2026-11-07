import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "../../components/Navbar/Navbar";
import {
  ArrowDown,
  ArrowRight,
  ArrowUpRight,
  CalendarDays,
  CheckCircle2,
  Clock3,
  MapPin,
  Search,
  Sparkles,
  Users,
  X,
} from "lucide-react";
import "./PublicEvents.css";

const API_BASE_URL = (
  import.meta.env.VITE_API_URL ||
  import.meta.env.VITE_API_BASE_URL ||
  "http://localhost:5000"
).replace(/\/+$/, "");

const EVENTS_ENDPOINT = `${API_BASE_URL}/api/events?type=all`;
const REFRESH_INTERVAL = 30_000;
const HERO_INTERVAL = 6_500;

const FILTERS = [
  { id: "all", label: "All events" },
  { id: "upcoming", label: "Upcoming" },
  { id: "ongoing", label: "Ongoing" },
  { id: "past", label: "Past" },
];

const STATUS_LABELS = {
  upcoming: "Upcoming",
  ongoing: "Live now",
  past: "Past",
};

/* ------------------------------------------------------------------ */
/* Helpers                                                             */
/* ------------------------------------------------------------------ */

function localDateString(date = new Date()) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function getEventStatus(event, today = localDateString()) {
  const start = event.startDate || event.date || "";
  const end = event.endDate || event.startDate || event.date || "";

  if (start && end && end < today) return "past";
  if (start && start > today) return "upcoming";
  if (start && end && start <= today && end >= today) return "ongoing";

  return "upcoming";
}

function formatDate(value) {
  if (!value) return "";
  const date = new Date(`${value}T12:00:00`);
  if (Number.isNaN(date.getTime())) return String(value);

  return date.toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function formatDateRange(event) {
  const start = event.startDate || event.date;
  const end = event.endDate;

  if (!start && !end) return "Date to be announced";
  if (!end || start === end) return formatDate(start || end);
  return `${formatDate(start)} — ${formatDate(end)}`;
}

function getPhotoSource(photo) {
  if (!photo) return "";
  if (typeof photo === "string") return photo;
  return photo.url || photo.src || photo.data || photo.imageUrl || "";
}

function getEventImage(event) {
  const photos = Array.isArray(event.photos) ? event.photos : [];
  const firstPhoto = photos.map(getPhotoSource).find(Boolean);

  return (
    firstPhoto ||
    event.coverImage ||
    event.bannerImage ||
    event.imageUrl ||
    event.image ||
    ""
  );
}

function getEventName(event) {
  return event.name || event.title || "Untitled event";
}

function getEventCategory(event) {
  return event.customCategory || event.category || event.type || "PRISM AI Event";
}

function getEventDescription(event) {
  return event.description || event.caption || "";
}

function getEventTime(event) {
  if (event.startTime && event.endTime) {
    return `${event.startTime} – ${event.endTime}`;
  }
  return event.startTime || event.time || "";
}

function getEventCapacity(event) {
  const value = event.capacity || event.participantCapacity;
  return value ? `${value} seats` : "";
}

function getHeroCopy(event, status) {
  if (status === "ongoing") {
    return {
      eyebrow: "Happening now",
      headline: "Ideas in motion.",
      subline: "Step into the energy of what’s happening at PRISM AI.",
    };
  }

  if (status === "past") {
    return {
      eyebrow: "From the archive",
      headline: "Moments that move us.",
      subline: "A look back at the ideas, people and experiences we brought to life.",
    };
  }

  return {
    eyebrow: "Up next at PRISM",
    headline: "Your next big idea starts here.",
    subline: "Discover what’s coming up and find your place in the experience.",
  };
}

/* ------------------------------------------------------------------ */
/* Small UI pieces                                                     */
/* ------------------------------------------------------------------ */

const ARROWS = { ne: ArrowUpRight, e: ArrowRight, s: ArrowDown };

/**
 * Arrow that swaps with a second copy of itself inside its own box.
 * Triggered by hovering any ancestor with the `pe-swap-host` class.
 */
function ArrowSwap({ dir = "ne" }) {
  const Icon = ARROWS[dir] || ArrowUpRight;

  return (
    <span className="pe-swap" data-dir={dir} aria-hidden="true">
      <Icon className="pe-swap__a" size={16} />
      <Icon className="pe-swap__b" size={16} />
    </span>
  );
}

/**
 * Shared button. Every variant animates inside its own bounds:
 * a colour fill rises from the bottom and the arrow slides out / in.
 */
function Button({
  variant = "primary",
  size = "md",
  arrow,
  onClick,
  type = "button",
  className = "",
  children,
}) {
  return (
    <button
      type={type}
      className={`pe-btn pe-btn--${variant} pe-btn--${size} pe-swap-host ${className}`.trim()}
      onClick={onClick}
    >
      <span className="pe-btn__label">{children}</span>
      {arrow && <ArrowSwap dir={arrow} />}
    </button>
  );
}

function Fact({ icon: Icon, children }) {
  return (
    <span>
      <Icon size={15} />
      <em>{children}</em>
    </span>
  );
}

/* ------------------------------------------------------------------ */
/* Page                                                                */
/* ------------------------------------------------------------------ */

export default function Events() {
  const navigate = useNavigate();

  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [activeFilter, setActiveFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [heroIndex, setHeroIndex] = useState(0);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);

  const fetchEvents = useCallback(async ({ silent = false } = {}) => {
    if (!silent) setLoading(true);
    setError("");

    try {
      const response = await fetch(EVENTS_ENDPOINT, {
        method: "GET",
        headers: { Accept: "application/json" },
        cache: "no-store",
      });

      if (!response.ok) {
        throw new Error(`Events could not be loaded (${response.status}).`);
      }

      const payload = await response.json();

      const records = Array.isArray(payload)
        ? payload
        : Array.isArray(payload.events)
          ? payload.events
          : Array.isArray(payload.data?.events)
            ? payload.data.events
            : [];

      const publishedEvents = records.filter((event) => {
        const status = String(event.status || "").trim().toLowerCase();
        const visibility = String(event.visibility || "Public")
          .trim()
          .toLowerCase();

        return status === "published" && visibility === "public";
      });

      publishedEvents.sort((a, b) => {
        const dateA = a.startDate || a.date || "9999-12-31";
        const dateB = b.startDate || b.date || "9999-12-31";
        return String(dateA).localeCompare(String(dateB));
      });

      setEvents(publishedEvents);
      setLastUpdated(new Date());

      setHeroIndex((current) =>
        publishedEvents.length ? current % publishedEvents.length : 0
      );
    } catch (fetchError) {
      setError(
        fetchError.message || "Something went wrong while loading events."
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchEvents();

    const interval = window.setInterval(
      () => fetchEvents({ silent: true }),
      REFRESH_INTERVAL
    );

    const refreshWhenVisible = () => {
      if (document.visibilityState === "visible") {
        fetchEvents({ silent: true });
      }
    };

    window.addEventListener("focus", refreshWhenVisible);
    document.addEventListener("visibilitychange", refreshWhenVisible);
    window.addEventListener("online", refreshWhenVisible);

    return () => {
      window.clearInterval(interval);
      window.removeEventListener("focus", refreshWhenVisible);
      document.removeEventListener("visibilitychange", refreshWhenVisible);
      window.removeEventListener("online", refreshWhenVisible);
    };
  }, [fetchEvents]);

  const today = localDateString();

  const categorizedEvents = useMemo(
    () =>
      events.map((event) => ({
        ...event,
        _displayStatus: getEventStatus(event, today),
      })),
    [events, today]
  );

  const filteredEvents = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();

    return categorizedEvents.filter((event) => {
      const matchesFilter =
        activeFilter === "all" || event._displayStatus === activeFilter;

      const searchable = [
        getEventName(event),
        getEventCategory(event),
        event.venue,
        event.description,
        event.caption,
        event.audience,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      return matchesFilter && (!query || searchable.includes(query));
    });
  }, [categorizedEvents, activeFilter, searchQuery]);

  const counts = useMemo(
    () => ({
      all: categorizedEvents.length,
      upcoming: categorizedEvents.filter(
        (event) => event._displayStatus === "upcoming"
      ).length,
      ongoing: categorizedEvents.filter(
        (event) => event._displayStatus === "ongoing"
      ).length,
      past: categorizedEvents.filter(
        (event) => event._displayStatus === "past"
      ).length,
    }),
    [categorizedEvents]
  );

  const heroEvents = useMemo(
    () =>
      categorizedEvents
        .filter((event) => event._displayStatus !== "past")
        .concat(
          categorizedEvents.filter((event) => event._displayStatus === "past")
        ),
    [categorizedEvents]
  );

  useEffect(() => {
    if (heroEvents.length < 2) return undefined;

    const interval = window.setInterval(
      () => setHeroIndex((current) => (current + 1) % heroEvents.length),
      HERO_INTERVAL
    );

    return () => window.clearInterval(interval);
  }, [heroEvents.length]);

  /* Close the modal with Escape and lock page scroll while it is open */
  useEffect(() => {
    if (!selectedEvent) return undefined;

    const onKeyDown = (event) => {
      if (event.key === "Escape") setSelectedEvent(null);
    };

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [selectedEvent]);

  const heroEvent = heroEvents[heroIndex] || null;
  const heroStatus = heroEvent?._displayStatus || "upcoming";
  const heroCopy = getHeroCopy(heroEvent, heroStatus);
  const heroImage = heroEvent ? getEventImage(heroEvent) : "";

  const selectedStatus = selectedEvent
    ? getEventStatus(selectedEvent, today)
    : null;
  const selectedImage = selectedEvent ? getEventImage(selectedEvent) : "";

  const openLogin = (event) => {
    navigate("/login", {
      state: {
        from: "/public/events",
        intent: "event-registration",
        eventId: event.id,
        eventName: getEventName(event),
      },
    });
  };

  const scrollToEvents = () => {
    document.getElementById("prism-events-list")?.scrollIntoView({
      behavior: "smooth",
      block: "start",
    });
  };

  return (
    <>
      <Navbar />

      <main className="prism-events-page">
        {/* ============================== HERO ============================== */}
        <section className="events-hero" aria-label="PRISM AI events">
          <div className="events-hero__glow" aria-hidden="true" />

          <div className="events-wrap">
            <div
              className="events-hero__content"
              key={heroEvent?.id || "events-intro"}
            >
              <div className="events-hero__copy">
                <div className="events-eyebrow">
                  <span className="events-eyebrow__line" aria-hidden="true" />
                  {heroEvent ? heroCopy.eyebrow : "The PRISM experience"}
                </div>

                <h1>
                  {heroEvent ? (
                    <>
                      <span className="events-hero__lead">
                        {heroCopy.headline}
                      </span>
                      <span className="events-hero__event-name">
                        {getEventName(heroEvent)}
                      </span>
                    </>
                  ) : (
                    <>
                      <span className="events-hero__lead">
                        Where curiosity
                      </span>
                      <span className="events-hero__event-name">
                        becomes creation.
                      </span>
                    </>
                  )}
                </h1>

                <p className="events-hero__text">
                  {heroEvent
                    ? getEventDescription(heroEvent) || heroCopy.subline
                    : "A space for builders, thinkers and curious minds. Discover workshops, hackathons, talks and experiences curated by PRISM AI."}
                </p>

                {heroEvent && (
                  <div className="events-hero__meta">
                    <span>
                      <CalendarDays size={15} />
                      {formatDateRange(heroEvent)}
                    </span>

                    {heroEvent.venue && (
                      <span>
                        <MapPin size={15} />
                        {heroEvent.venue}
                      </span>
                    )}
                  </div>
                )}

                <div className="events-hero__actions">
                  {heroEvent && heroStatus !== "past" ? (
                    <Button arrow="ne" onClick={() => openLogin(heroEvent)}>
                      Register now
                    </Button>
                  ) : (
                    <Button arrow="s" onClick={scrollToEvents}>
                      Explore events
                    </Button>
                  )}

                  <Button variant="ghost" arrow="e" onClick={scrollToEvents}>
                    Browse all events
                  </Button>
                </div>
              </div>

              <div className="events-hero__visual">
                <div className="events-hero__frame">
                  {heroImage ? (
                    <img src={heroImage} alt={getEventName(heroEvent)} />
                  ) : (
                    <div className="events-hero__placeholder">
                      <span className="events-hero__placeholder-core">
                        <Sparkles size={34} />
                      </span>
                      <span className="events-hero__placeholder-word">
                        Ideas · Into · Impact
                      </span>
                    </div>
                  )}

                  <div className="events-hero__shade" />

                  {heroEvent && (
                    <span
                      className={`event-card__status event-card__status--${heroStatus}`}
                    >
                      {STATUS_LABELS[heroStatus]}
                    </span>
                  )}

                  <div className="events-hero__caption">
                    <span>
                      {heroEvent
                        ? getEventCategory(heroEvent)
                        : "The PRISM experience"}
                    </span>
                    <strong>
                      {heroEvent
                        ? getEventName(heroEvent)
                        : "A community of curious minds"}
                    </strong>
                  </div>
                </div>

                <div className="events-hero__index">
                  <span>
                    {String(heroEvents.length ? heroIndex + 1 : 1).padStart(
                      2,
                      "0"
                    )}
                    {" — "}
                    {String(Math.max(heroEvents.length, 1)).padStart(2, "0")}
                  </span>

                  <i className="events-hero__progress" aria-hidden="true">
                    {heroEvents.length > 1 && (
                      <b
                        key={heroIndex}
                        style={{ "--hero-interval": `${HERO_INTERVAL}ms` }}
                      />
                    )}
                  </i>

                  <small>Ways to learn, create and grow.</small>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ============================ DISCOVER ============================ */}
        <section className="events-discover" id="prism-events-list">
          <div className="events-wrap">
            <div className="events-section-heading">
              <div>
                <span className="events-eyebrow">
                  <span className="events-eyebrow__line" aria-hidden="true" />
                  The PRISM calendar
                </span>
                <h2>
                  Find your <em>next experience.</em>
                </h2>
                <p>
                  From hands-on workshops to ambitious hackathons — there’s
                  always something happening.
                </p>
              </div>

              <div className="events-live-status">
                <span className="events-live-status__dot" />
                <span>Live event listings</span>
                {lastUpdated && (
                  <small>
                    Updated{" "}
                    {lastUpdated.toLocaleTimeString("en-IN", {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </small>
                )}
              </div>
            </div>

            <div className="events-toolbar">
              <div
                className="events-filters"
                role="tablist"
                aria-label="Filter events"
              >
                {FILTERS.map((filter) => (
                  <button
                    key={filter.id}
                    type="button"
                    role="tab"
                    aria-selected={activeFilter === filter.id}
                    className={`events-filter${
                      activeFilter === filter.id ? " is-active" : ""
                    }`}
                    onClick={() => setActiveFilter(filter.id)}
                  >
                    <span className="events-filter__label">{filter.label}</span>
                    <span className="events-filter__count">
                      {counts[filter.id]}
                    </span>
                  </button>
                ))}
              </div>

              <label className="events-search">
                <Search size={17} />
                <input
                  type="search"
                  value={searchQuery}
                  onChange={(event) => setSearchQuery(event.target.value)}
                  placeholder="Search events, categories…"
                  aria-label="Search events"
                />
                {searchQuery && (
                  <button
                    type="button"
                    className="events-search__clear"
                    onClick={() => setSearchQuery("")}
                    aria-label="Clear search"
                  >
                    <X size={14} />
                  </button>
                )}
              </label>
            </div>

            {loading && events.length === 0 ? (
              <div className="events-state">
                <div className="events-loader">
                  <span />
                  <span />
                  <span />
                </div>
                <h3>Gathering the good stuff.</h3>
                <p>Loading published events from PRISM AI…</p>
              </div>
            ) : error && events.length === 0 ? (
              <div className="events-state events-state--error">
                <h3>We couldn’t load the events just yet.</h3>
                <p>{error}</p>
                <Button arrow="e" onClick={() => fetchEvents()}>
                  Try again
                </Button>
              </div>
            ) : filteredEvents.length === 0 ? (
              <div className="events-state">
                <div className="events-state__icon">
                  <CalendarDays size={26} />
                </div>
                <h3>
                  {searchQuery
                    ? "No matching events."
                    : "Nothing on this page. Yet."}
                </h3>
                <p>
                  {searchQuery
                    ? "Try another keyword or clear your search."
                    : "Published events will appear here as soon as they are announced."}
                </p>

                {(searchQuery || activeFilter !== "all") && (
                  <Button
                    arrow="e"
                    onClick={() => {
                      setSearchQuery("");
                      setActiveFilter("all");
                    }}
                  >
                    Show all events
                  </Button>
                )}
              </div>
            ) : (
              <div className="events-grid">
                {filteredEvents.map((event, index) => {
                  const status = event._displayStatus;
                  const image = getEventImage(event);
                  const isPast = status === "past";
                  const name = getEventName(event);
                  const description = getEventDescription(event);
                  const time = getEventTime(event);
                  const capacity = getEventCapacity(event);

                  return (
                    <article
                      className={`event-card${
                        isPast ? " event-card--past" : ""
                      }`}
                      key={event.id || event.slug || `${name}-${index}`}
                      style={{ "--event-card-index": index }}
                    >
                      <button
                        type="button"
                        className="event-card__media pe-swap-host"
                        onClick={() => setSelectedEvent(event)}
                        aria-label={`View details for ${name}`}
                      >
                        <span className="event-card__image">
                          {image ? (
                            <img src={image} alt={name} loading="lazy" />
                          ) : (
                            <span className="event-card__image-placeholder">
                              <Sparkles size={30} />
                              <span>PRISM AI</span>
                            </span>
                          )}
                        </span>

                        <span
                          className={`event-card__status event-card__status--${status}`}
                        >
                          {STATUS_LABELS[status]}
                        </span>

                        <span className="event-card__chip">
                          <ArrowSwap dir="ne" />
                        </span>
                      </button>

                      <div className="event-card__body">
                        <div className="event-card__category">
                          {getEventCategory(event)}
                        </div>

                        <h3>{name}</h3>

                        <p className="event-card__description">
                          {description ||
                            "Discover the details of this PRISM AI experience."}
                        </p>

                        <div className="event-card__facts">
                          <Fact icon={CalendarDays}>
                            {formatDateRange(event)}
                          </Fact>
                          {time && <Fact icon={Clock3}>{time}</Fact>}
                          {event.venue && <Fact icon={MapPin}>{event.venue}</Fact>}
                          {capacity && <Fact icon={Users}>{capacity}</Fact>}
                        </div>

                        <div className="event-card__footer">
                          <Button
                            variant="text"
                            size="sm"
                            arrow="e"
                            onClick={() => setSelectedEvent(event)}
                          >
                            Event details
                          </Button>

                          {isPast ? (
                            <span className="event-card__past-label">
                              Event concluded
                            </span>
                          ) : (
                            <Button
                              size="sm"
                              arrow="ne"
                              onClick={() => openLogin(event)}
                            >
                              Register
                            </Button>
                          )}
                        </div>
                      </div>
                    </article>
                  );
                })}
              </div>
            )}

            {error && events.length > 0 && (
              <p className="events-stale-note">
                Could not refresh the latest listings. Showing the last
                successfully loaded events.
              </p>
            )}
          </div>
        </section>

        {/* ============================== CTA =============================== */}
        <section className="events-bottom-cta-wrap">
          <div className="events-wrap">
            <div className="events-bottom-cta">
              <span className="events-eyebrow events-eyebrow--on-accent">
                <span className="events-eyebrow__line" aria-hidden="true" />
                Be part of what’s next
              </span>
              <h2>
                Curiosity looks good <em>on you.</em>
              </h2>
              <p>
                Meet people who build, question, experiment and make things
                happen.
              </p>
              <Button
                variant="inverse"
                arrow="ne"
                onClick={() =>
                  navigate("/login", {
                    state: {
                      from: "/public/events",
                      intent: "join-community",
                    },
                  })
                }
              >
                Join the PRISM community
              </Button>
            </div>
          </div>
        </section>

        {/* ============================= MODAL ============================== */}
        {selectedEvent && (
          <div
            className="event-modal-backdrop"
            role="presentation"
            onMouseDown={(event) => {
              if (event.target === event.currentTarget) {
                setSelectedEvent(null);
              }
            }}
          >
            <section
              className="event-modal"
              role="dialog"
              aria-modal="true"
              aria-labelledby="event-modal-title"
            >
              <button
                className="event-modal__close"
                type="button"
                onClick={() => setSelectedEvent(null)}
                aria-label="Close event details"
              >
                <X size={18} />
              </button>

              <div
                className={`event-modal__cover${
                  selectedStatus === "past" ? " event-modal__cover--past" : ""
                }`}
              >
                {selectedImage ? (
                  <img src={selectedImage} alt={getEventName(selectedEvent)} />
                ) : (
                  <div className="event-modal__cover-placeholder">
                    <Sparkles size={36} />
                  </div>
                )}

                <span
                  className={`event-card__status event-card__status--${selectedStatus}`}
                >
                  {STATUS_LABELS[selectedStatus]}
                </span>
              </div>

              <div className="event-modal__content">
                <span className="event-card__category">
                  {getEventCategory(selectedEvent)}
                </span>

                <h2 id="event-modal-title">{getEventName(selectedEvent)}</h2>

                {getEventDescription(selectedEvent) && (
                  <p className="event-modal__description">
                    {getEventDescription(selectedEvent)}
                  </p>
                )}

                <div className="event-modal__facts">
                  <span>
                    <CalendarDays size={16} />
                    {formatDateRange(selectedEvent)}
                  </span>

                  {getEventTime(selectedEvent) && (
                    <span>
                      <Clock3 size={16} />
                      {getEventTime(selectedEvent)}
                    </span>
                  )}

                  {selectedEvent.venue && (
                    <span>
                      <MapPin size={16} />
                      {selectedEvent.venue}
                    </span>
                  )}

                  {selectedEvent.eventMode && (
                    <span>
                      <CheckCircle2 size={16} />
                      {selectedEvent.eventMode}
                    </span>
                  )}

                  {selectedEvent.audience && (
                    <span>
                      <Users size={16} />
                      {selectedEvent.audience}
                    </span>
                  )}

                  {selectedEvent.participationFee && (
                    <span>
                      <CheckCircle2 size={16} />
                      {selectedEvent.participationFee}
                    </span>
                  )}

                  {getEventCapacity(selectedEvent) && (
                    <span>
                      <Users size={16} />
                      {getEventCapacity(selectedEvent)}
                    </span>
                  )}
                </div>

                {selectedEvent.highlights?.filter(Boolean).length > 0 && (
                  <div className="event-modal__section">
                    <h3>What to expect</h3>
                    <ul>
                      {selectedEvent.highlights
                        .filter(Boolean)
                        .map((item, index) => (
                          <li key={`${item}-${index}`}>{item}</li>
                        ))}
                    </ul>
                  </div>
                )}

                {selectedEvent.agenda && (
                  <div className="event-modal__section">
                    <h3>Agenda</h3>
                    <p>{selectedEvent.agenda}</p>
                  </div>
                )}

                {selectedEvent.eligibility && (
                  <div className="event-modal__section">
                    <h3>Eligibility</h3>
                    <p>{selectedEvent.eligibility}</p>
                  </div>
                )}

                {selectedEvent.prerequisites && (
                  <div className="event-modal__section">
                    <h3>Prerequisites</h3>
                    <p>{selectedEvent.prerequisites}</p>
                  </div>
                )}

                {selectedEvent.registrationDeadline && (
                  <div className="event-modal__section">
                    <h3>Registration deadline</h3>
                    <p>{formatDate(selectedEvent.registrationDeadline)}</p>
                  </div>
                )}

                {(selectedEvent.contactName || selectedEvent.contactEmail) && (
                  <div className="event-modal__section">
                    <h3>Event contact</h3>
                    <p>
                      {selectedEvent.contactName || ""}
                      {selectedEvent.contactName && selectedEvent.contactEmail
                        ? " · "
                        : ""}
                      {selectedEvent.contactEmail || ""}
                    </p>
                  </div>
                )}

                {selectedStatus !== "past" && (
                  <Button
                    arrow="ne"
                    className="event-modal__register"
                    onClick={() => openLogin(selectedEvent)}
                  >
                    Register now
                  </Button>
                )}
              </div>
            </section>
          </div>
        )}
      </main>
    </>
  );
}