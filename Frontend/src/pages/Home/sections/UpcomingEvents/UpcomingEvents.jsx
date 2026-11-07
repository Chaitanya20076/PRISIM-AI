
import {
  ArrowDownRight,
  ArrowRight,
  ArrowUpRight,
  CalendarDays,
  Clock3,
  MapPin,
  Sparkles,
} from "lucide-react";
import "./upcomingEvents.css";

const events = [
  {
    id: "01",
    category: "WORKSHOP",
    title: "Build with Generative AI",
    description:
      "Explore how modern generative AI systems work and turn your first idea into a working prototype.",
    date: "DATE TO BE ANNOUNCED",
    time: "Schedule coming soon",
    venue: "RNSIT Campus",
    colour: "teal",
    status: "UPCOMING",
    featured: true,
    href: "#events",
  },
  {
    id: "02",
    category: "HACKATHON",
    title: "The AI Build Challenge",
    description:
      "Collaborate, experiment and build a solution to a meaningful problem.",
    date: "DATE TO BE ANNOUNCED",
    time: "Schedule coming soon",
    venue: "RNSIT Campus",
    colour: "blue",
    status: "COMING SOON",
    href: "#events",
  },
  {
    id: "03",
    category: "TECH SESSION",
    title: "Inside the World of AI Agents",
    description:
      "Discover agentic workflows, practical applications and the ideas shaping intelligent automation.",
    date: "DATE TO BE ANNOUNCED",
    time: "Schedule coming soon",
    venue: "Details to be announced",
    colour: "amber",
    status: "COMING SOON",
    href: "#events",
  },
];

export default function UpcomingEvents() {
  const featured = events[0];
  const otherEvents = events.slice(1);

  const scrollToEvents = () => {
    document.getElementById("events")?.scrollIntoView({
      behavior: "smooth",
      block: "start",
    });
  };

  return (
    <section
      className="prism-events-section"
      id="upcoming-events"
      aria-labelledby="prism-events-title"
    >
      <div className="prism-events-inner">
        {/* SECTION HEADER */}

        <div className="prism-events-topline">
          <div className="prism-events-eyebrow">
            <span className="prism-events-eyebrow-line" />
            <span>02 / WHAT'S HAPPENING</span>
          </div>

          <span className="prism-events-campus">
            <span className="prism-events-live-dot" />
            PRISM AI · RNSIT
          </span>
        </div>

        {/* TITLE */}

        <div className="prism-events-heading">
          <div>
            <span className="prism-events-kicker">
              LEARN SOMETHING. BUILD SOMETHING.
            </span>

            <h2 id="prism-events-title">
              Ideas come alive
              <br />
              <span>when we get together.</span>
            </h2>
          </div>

          <p className="prism-events-intro">
            Workshops, competitions and conversations that take
            your curiosity beyond the classroom.
          </p>
        </div>

        {/* FEATURED EVENT */}

        <div className="prism-events-layout">
          <article
            className={`prism-event-featured event-${featured.colour}`}
          >
            <div className="prism-event-featured-glow" aria-hidden="true" />

            <div className="prism-event-featured-top">
              <span className="prism-event-category">
                <Sparkles size={13} />
                {featured.category}
              </span>

              <span className="prism-event-number">
                EVENT / {featured.id}
              </span>
            </div>

            <div className="prism-event-featured-content">
              <span className="prism-event-overline">
                THE NEXT BIG IDEA STARTS HERE
              </span>

              <h3>{featured.title}</h3>

              <p>{featured.description}</p>

              <div className="prism-event-meta">
                <span>
                  <CalendarDays size={15} />
                  {featured.date}
                </span>

                <span>
                  <MapPin size={15} />
                  {featured.venue}
                </span>
              </div>

              <a
                className="prism-event-featured-link"
                href={featured.href}
                onClick={(event) => {
                  event.preventDefault();
                  scrollToEvents();
                }}
              >
                <span>EVENT DETAILS</span>
                <ArrowUpRight size={17} />
              </a>
            </div>

            <div className="prism-event-featured-footer">
              <span>EXPLORE. EXPERIMENT. CREATE.</span>
              <span className="prism-event-featured-mark">P.</span>
            </div>
          </article>

          {/* OTHER EVENTS */}

          <div className="prism-events-list">
            <div className="prism-events-list-heading">
              <span>ON THE RADAR</span>
              <span>02 ITEMS</span>
            </div>

            {otherEvents.map((event) => (
              <article
                key={event.id}
                className={`prism-event-row event-${event.colour}`}
              >
                <div className="prism-event-row-top">
                  <span className="prism-event-row-category">
                    {event.category}
                  </span>

                  <span className="prism-event-row-number">
                    {event.id}
                  </span>
                </div>

                <h3>{event.title}</h3>

                <p>{event.description}</p>

                <div className="prism-event-row-meta">
                  <span>
                    <CalendarDays size={13} />
                    {event.date}
                  </span>
                </div>

                <a
                  className="prism-event-row-link"
                  href={event.href}
                  onClick={(e) => {
                    e.preventDefault();
                    scrollToEvents();
                  }}
                  aria-label={`View details for ${event.title}`}
                >
                  <span>EXPLORE EVENT</span>
                  <ArrowRight size={15} />
                </a>
              </article>
            ))}
          </div>
        </div>

        {/* EVENT INFORMATION STRIP */}

        <div className="prism-events-info-strip">
          <div className="prism-events-info-icon">
            <Clock3 size={19} />
          </div>

          <div className="prism-events-info-copy">
            <strong>Stay in the loop.</strong>
            <span>
              Event dates, registration links and venue details
              will be published here when confirmed.
            </span>
          </div>

          <button
            type="button"
            className="prism-events-info-link"
            onClick={scrollToEvents}
          >
            ALL EVENTS
            <ArrowDownRight size={17} />
          </button>
        </div>

        {/* FOOTER */}

        <div className="prism-events-footer">
          <span>
            <span className="prism-events-footer-mark">03</span>
            MORE IDEAS. MORE EXPERIENCES.
          </span>

          <a href="#projects" className="prism-events-next">
            EXPLORE OUR PROJECTS
            <ArrowUpRight size={15} />
          </a>
        </div>
      </div>
    </section>
  );
}
