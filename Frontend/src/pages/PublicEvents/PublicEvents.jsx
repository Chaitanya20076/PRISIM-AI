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

// Supports common ID shapes returned by Firestore-backed event APIs.
function getEventId(event) {
  const value =
    event?.id ??
    event?.eventId ??
    event?._id ??
    event?.documentId ??
    event?.docId ??
    event?.firestoreId ??
    event?.event_id ??
    "";

  return value == null ? "" : String(value).trim();
}

function getEventCategory(event) {
  return event.customCategory || event.category || event.type || "PRISM AI Event";
}

function isHackathonEvent(event) {
  const typeText = [
    event?.eventType, event?.type, event?.category, event?.customCategory,
    event?.slug, event?.name, event?.title,
  ].filter(Boolean).join(" ").toLowerCase().replace(/[^a-z0-9]+/g, " ");

  return /\bhack ?athons?\b/.test(typeText);
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
  if (!event) {
    return {
      eyebrow: "The PRISM experience",
      headline: "Where curiosity",
      subline: "A space for builders, thinkers and curious minds. Discover workshops, hackathons, talks and experiences curated by PRISM AI.",
    };
  }

  const typeText = [
    event.eventType,
    event.type,
    event.category,
    event.customCategory,
    event.slug,
    event.name,
    event.title,
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ");

  const categoryCopy = [
    {
      match: /\bhack ?athons?\b/,
      upcoming: [
        ["Build beyond the ordinary.", "Bring your boldest ideas. Build with a team. Make something that matters."],
        ["Big ideas. Bigger challenges.", "Step into the challenge, collaborate with creators and turn your solution into reality."],
        ["Think fast. Build fearless.", "A hands-on challenge for curious minds ready to experiment, create and compete."],
      ],
      ongoing: [
        ["The build is happening now.", "Teams are creating, testing and pushing ideas further. Be part of the action."],
        ["Innovation is in full swing.", "The challenge is live. Explore the energy and see what teams are building."],
      ],
      past: [
        ["Ideas became real here.", "Revisit the teams, breakthroughs and moments that made this challenge memorable."],
        ["A challenge worth remembering.", "Look back at the creativity, collaboration and solutions brought to life."],
      ],
    },
    {
      match: /\bworkshops?\b/,
      upcoming: [
        ["Learn it. Try it. Build it.", "Get hands-on, explore new tools and leave with skills you can put to work."],
        ["Make room for new skills.", "A practical learning experience designed to turn curiosity into confidence."],
        ["Your next skill starts here.", "Explore, experiment and learn by doing alongside a community of creators."],
      ],
      ongoing: [
        ["Learning is happening live.", "Join the experience and discover ideas through hands-on exploration."],
        ["Curiosity in action.", "The workshop is underway. Step in, learn something new and get involved."],
      ],
      past: [
        ["A session full of discovery.", "Take a look back at the skills explored, ideas shared and things created."],
        ["Learning that leaves a mark.", "Revisit the moments and takeaways from this hands-on experience."],
      ],
    },
    {
      match: /\bseminars?\b/,
      upcoming: [
        ["A fresh perspective awaits.", "Make time for thoughtful conversations, new insights and ideas worth exploring."],
        ["Listen. Question. Discover.", "Join a focused exchange of knowledge and perspectives with the PRISM community."],
        ["Ideas are better shared.", "Explore a session built to spark questions, deepen understanding and inspire action."],
      ],
      ongoing: [
        ["The conversation is live.", "Tune in to fresh perspectives and ideas being shared right now."],
        ["Knowledge is being shared.", "Be part of the discussion and discover a new point of view."],
      ],
      past: [
        ["Conversations that stay with us.", "Revisit the insights, perspectives and moments shared at this session."],
        ["A closer look at what we learned.", "Explore the highlights from a gathering of ideas and thoughtful discussion."],
      ],
    },
    {
      match: /\bwebinars?\b/,
      upcoming: [
        ["A world of insight, one session away.", "Connect, learn and explore ideas with experts and curious minds."],
        ["Tune in to something new.", "Make space for fresh knowledge and conversations from wherever you are."],
        ["Your next insight is calling.", "Join an online experience made for learning, sharing and discovery."],
      ],
      ongoing: [
        ["The session is live.", "Join the conversation and catch the ideas being shared right now."],
        ["Insight is just a click away.", "The webinar is underway. Tune in and be part of it."],
      ],
      past: [
        ["Worth another look.", "Revisit the ideas, takeaways and conversations from this online session."],
        ["Knowledge travels further.", "Look back at the insights shared with our online community."],
      ],
    },
    {
      match: /\bboot ?camps?\b/,
      upcoming: [
        ["Go deeper. Grow faster.", "Commit to learning, put ideas into practice and level up through an immersive experience."],
        ["A focused journey starts here.", "Build momentum through practical learning, collaboration and real challenges."],
        ["Ready for an intensive learning sprint?", "Step into a focused experience designed to stretch your skills and thinking."],
      ],
      ongoing: [
        ["The learning sprint is underway.", "Keep building, keep experimenting and make every moment count."],
        ["Progress happens by doing.", "The bootcamp is live. Join the journey and take your skills further."],
      ],
      past: [
        ["Progress made. Skills gained.", "Look back at the learning journey, practical work and milestones achieved."],
        ["A journey worth celebrating.", "Revisit the effort, growth and ideas that shaped this bootcamp."],
      ],
    },
    {
      match: /\bcompetitions?\b/,
      upcoming: [
        ["Bring your best to the table.", "Put your skills to the test, take on a challenge and show what you can do."],
        ["A chance to prove your ideas.", "Compete, create and challenge yourself alongside ambitious minds."],
        ["Your moment to make a mark.", "Step up, think differently and turn your preparation into performance."],
      ],
      ongoing: [
        ["The challenge is on.", "The action is live. See what's unfolding and be part of the excitement."],
        ["Talent meets the test.", "Participants are putting their skills into action right now."],
      ],
      past: [
        ["The results tell a story.", "Celebrate the effort, creativity and standout moments from this competition."],
        ["Challenge accepted. Memories made.", "Look back at the performances and ideas that made this event special."],
      ],
    },
  ];

  const selectedCategory = categoryCopy.find((item) => item.match.test(typeText));
  const genericCopy = {
    upcoming: [
      ["Something exciting is taking shape.", "Discover a new opportunity to connect, explore ideas and make your next move."],
      ["Your next experience starts here.", "Find new perspectives, meet curious minds and make the most of what’s ahead."],
      ["Make your next move count.", "Explore this PRISM AI experience and find a place to learn, create and connect."],
      ["A new idea is waiting.", "Step into an experience designed to bring people, curiosity and creativity together."],
    ],
    ongoing: [
      ["The experience is unfolding.", "Discover what’s happening and join the energy of the PRISM AI community."],
      ["The moment is happening now.", "Take a closer look at this event and be part of the experience."],
      ["Ideas are turning into action.", "See what the community is creating, sharing and exploring right now."],
    ],
    past: [
      ["Every experience leaves a story.", "Revisit the people, ideas and moments that brought this event to life."],
      ["A moment worth looking back on.", "Explore the highlights and memories created by the PRISM AI community."],
      ["The experience lives on.", "Take a look back at the moments, connections and ideas from this event."],
    ],
  };

  // Pick a repeatable line per event, so the copy changes with the hero event
  // but does not randomly flicker on every render.
  const hashInput = `${getEventId(event)}-${getEventName(event)}-${getEventCategory(event)}`;
  const hash = [...hashInput].reduce((value, char) => (value * 31 + char.charCodeAt(0)) >>> 0, 7);
  const choices = selectedCategory?.[status] || genericCopy[status] || genericCopy.upcoming;
  const [headline, subline] = choices[hash % choices.length];

  const customHeadline = event.heroHeadline || event.tagline || event.shortHeadline;
  const customSubline = event.heroSubline || event.heroDescription || event.shortDescription;

  const statusEyebrow = {
    upcoming: "Coming up at PRISM",
    ongoing: "Happening now",
    past: "From the archive",
  };

  return {
    eyebrow: event.heroEyebrow || statusEyebrow[status] || "At PRISM AI",
    headline: customHeadline || headline,
    subline: customSubline || getEventDescription(event) || subline,
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
  const [showHackathonSignIn, setShowHackathonSignIn] = useState(false);
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
    if (!selectedEvent && !showHackathonSignIn) return undefined;

    const onKeyDown = (event) => {
      if (event.key === "Escape") {
        setSelectedEvent(null);
        setShowHackathonSignIn(false);
      }
    };

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [selectedEvent, showHackathonSignIn]);

  const heroEvent = heroEvents[heroIndex] || null;
  const heroStatus = heroEvent?._displayStatus || "upcoming";
  const heroCopy = getHeroCopy(heroEvent, heroStatus);
  const heroImage = heroEvent ? getEventImage(heroEvent) : "";

  const selectedStatus = selectedEvent
    ? getEventStatus(selectedEvent, today)
    : null;
  const selectedImage = selectedEvent ? getEventImage(selectedEvent) : "";

  // Send visitors directly to the registration form for the event type.
  // Keep the event ID in the URL so it survives refreshes and copied links.
  const getRegistrationPath = (event) => {
    const typeText = [
      event.eventType,
      event.type,
      event.category,
      event.customCategory,
      event.slug,
      event.name,
      event.title,
    ]
      .filter(Boolean)
      .join(" ")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, " ");

    if (/\bseminar\b/.test(typeText)) return "/public/seminar/forms";
    if (/\bwebinar\b/.test(typeText)) return "/public/webinar/forms";
    if (/\bworkshop\b/.test(typeText)) return "/public/workshop/forms";
    if (/\bboot ?camp\b/.test(typeText)) return "/public/bootcamp/forms";
    if (/\bcompetition\b/.test(typeText)) return "/public/competition/forms";
    if (/\bhack ?athon(s)?\b/.test(typeText)) return "/public/hackathon/forms";
    if (/\bother event(s)?\b/.test(typeText)) return "/public/other-event/forms";

    return "/public/events/forms";
  };

  const openRegistration = (event) => {
    // Hackathon registrations are gated behind compulsory sign-in.
    // All other event categories keep their existing registration routes.
    if (isHackathonEvent(event)) {
      setShowHackathonSignIn(true);
      return;
    }

    const eventId = getEventId(event);
    const registrationPath = getRegistrationPath(event);
    const destination = eventId
      ? `${registrationPath}?eventId=${encodeURIComponent(eventId)}`
      : registrationPath;

    navigate(destination, {
      state: {
        eventId,
        eventName: getEventName(event),
        eventType: event.eventType || event.type || event.category || "",
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
              key={getEventId(heroEvent || {}) || "events-intro"}
            >
              <div className="events-hero__copy">
                <div className="events-eyebrow">
                  <span className="events-eyebrow__line" aria-hidden="true" />
                  {heroEvent ? heroCopy.eyebrow : "The PRISM experience"}
                </div>

                <h1
                  className={
                    !heroEvent
                      ? "events-hero__title"
                      : `events-hero__title ${
                          `${heroCopy.headline} ${getEventName(heroEvent)}`.length > 72
                            ? "events-hero__title--long"
                            : `${heroCopy.headline} ${getEventName(heroEvent)}`.length > 44
                              ? "events-hero__title--medium"
                              : ""
                        }`
                  }
                >
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
                    ? heroCopy.subline
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
                    <Button arrow="ne" onClick={() => openRegistration(heroEvent)}>
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
                      key={getEventId(event) || event.slug || `${name}-${index}`}
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
                              onClick={() => openRegistration(event)}
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
                    onClick={() => openRegistration(selectedEvent)}
                  >
                    Register now
                  </Button>
                )}
              </div>
            </section>
          </div>
        )}

        {/* ============== HACKATHON COMPULSORY SIGN-IN NOTICE ============== */}
        {showHackathonSignIn && (
          <div
            className="event-modal-backdrop hackathon-signin-backdrop"
            role="presentation"
            onMouseDown={(event) => {
              if (event.target === event.currentTarget) {
                setShowHackathonSignIn(false);
              }
            }}
          >
            <section
              className="hackathon-signin-modal"
              role="dialog"
              aria-modal="true"
              aria-labelledby="hackathon-signin-title"
            >
              <button
                className="event-modal__close hackathon-signin__close"
                type="button"
                onClick={() => setShowHackathonSignIn(false)}
                aria-label="Close sign-in notice"
              >
                <X size={18} />
              </button>

              <div className="hackathon-signin__icon">
                <CheckCircle2 size={30} />
              </div>

              <span className="events-eyebrow">
                <span className="events-eyebrow__line" aria-hidden="true" />
                PRISM AI · HACKATHON
              </span>

              <h2 id="hackathon-signin-title">
                Sign-in is <em>required.</em>
              </h2>

              <p>
                Hackathon registration requires compulsory sign-in. Please
                sign in to your PRISM AI account before continuing.
              </p>

              <div className="hackathon-signin__actions">
                <Button
                  arrow="ne"
                  onClick={() => {
                    setShowHackathonSignIn(false);
                    navigate("/login", {
                      state: {
                        from: "/public/events",
                        intent: "hackathon-registration",
                      },
                    });
                  }}
                >
                  Sign in to continue
                </Button>

                <Button
                  variant="ghost"
                  onClick={() => setShowHackathonSignIn(false)}
                >
                  Maybe later
                </Button>
              </div>
            </section>
          </div>
        )}
      </main>
    </>
  );
}