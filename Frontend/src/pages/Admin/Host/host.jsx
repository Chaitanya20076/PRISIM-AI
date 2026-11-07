import React from "react";
import { useNavigate } from "react-router-dom";
import {
  CalendarPlus,
  Presentation,
  Video,
  GraduationCap,
  Trophy,
  Sparkles,
  Code2,
  ArrowUpRight,
  ArrowLeft,
} from "lucide-react";
import "./host.css";

const eventTypes = [
  {
    title: "Workshop",
    description: "Create hands-on sessions, practical learning experiences and guided activities.",
    icon: CalendarPlus,
    color: "amber",
    type: "Workshop",
  },
  {
    title: "Talk / Seminar",
    description: "Host guest lectures, expert talks, panel discussions and knowledge sessions.",
    icon: Presentation,
    color: "blue",
    type: "Technical Talk",
  },
  {
    title: "Webinar",
    description: "Run online sessions with speakers, live discussions and virtual participation.",
    icon: Video,
    color: "violet",
    type: "Webinar",
  },
  {
    title: "Bootcamp",
    description: "Organise multi-session learning programmes and intensive training.",
    icon: GraduationCap,
    color: "teal",
    type: "Bootcamp",
  },
  {
    title: "Competition",
    description: "Set up contests, challenges and engaging student activities.",
    icon: Trophy,
    color: "green",
    type: "Competition",
  },
  {
    title: "Hackathon Management",
    description: "Build hackathons, configure tracks and registrations, review submissions and manage judging.",
    icon: Code2,
    color: "indigo",
    isHackathon: true,
  },
  {
    title: "Other Event",
    description: "Create club meetups, networking events or a custom event type.",
    icon: Sparkles,
    color: "pink",
    type: "Other",
  },
];

export default function Host() {
  const navigate = useNavigate();

  
const chooseEvent = (event) => {
  if (event.isHackathon) {
    navigate("/admin/hackathons");
    return;
  }

  if (event.title === "Talk / Seminar") {
    navigate("/admin/host/seminar");
    return;
  }

  if (event.title === "Webinar") {
    navigate("/admin/host/webinar");
    return;
  }

  if (event.title === "Bootcamp") {
    navigate("/admin/host/bootcamp");
    return;
  }

  if (event.title === "Competition") {
    navigate("/admin/host/competition");
    return;
  }

  // Other Events — handle both possible card titles
  if (
    event.title === "Other Events" ||
    event.title === "Other" ||
    event.type === "Other"
  ) {
    navigate("/admin/host/other");
    return;
  }

  navigate(`/admin/host/create?type=${encodeURIComponent(event.type)}`);
};


  return (
    <main className="host-event-page">
      <div className="host-event-shell">
        <button
          type="button"
          className="host-back-button"
          onClick={() => navigate("/admin/dashboard")}
        >
          <ArrowLeft size={17} aria-hidden="true" />
          <span>Back to dashboard</span>
        </button>

        <header className="host-event-header">
          <span className="host-event-eyebrow">EVENT MANAGEMENT</span>
          <h1>Which event do you want to host?</h1>
          <p>Choose an event type to get started.</p>
        </header>

        <section className="host-event-grid" aria-label="Choose an event type">
          {eventTypes.map((event) => {
            const Icon = event.icon;
            return (
              <button
                type="button"
                key={event.title}
                className={`host-event-card host-event-card--${event.color}`}
                onClick={() => chooseEvent(event)}
              >
                <span className="host-event-card-icon">
                  <Icon size={23} strokeWidth={1.9} aria-hidden="true" />
                </span>
                <span className="host-event-card-open" aria-hidden="true">
                  <ArrowUpRight size={19} />
                </span>
                <span className="host-event-card-content">
                  <span className="host-event-card-eyebrow">{event.isHackathon ? "HACKATHONS" : "EVENT TYPE"}</span>
                  <span className="host-event-card-title">{event.title}</span>
                  <span className="host-event-card-description">{event.description}</span>
                </span>
                <span className="host-event-card-footer">
                  <span>{event.isHackathon ? "Manage hackathons" : "Choose event"}</span>
                  <ArrowUpRight size={16} aria-hidden="true" />
                </span>
              </button>
            );
          })}
        </section>
      </div>
    </main>
  );
}
