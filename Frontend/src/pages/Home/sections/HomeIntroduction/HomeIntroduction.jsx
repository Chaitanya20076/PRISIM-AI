import {
  ArrowDownRight,
  ArrowUpRight,
  BookOpen,
  BrainCircuit,
  Code2,
  Compass,
  FlaskConical,
  Lightbulb,
} from "lucide-react";
import "./homeIntroduction.css";

const pillars = [
  {
    number: "01",
    icon: BookOpen,
    title: "Learn beyond the classroom.",
    description:
      "Explore artificial intelligence through learning resources, technical sessions, workshops and shared knowledge.",
    label: "LEARN",
    colour: "sage",
  },
  {
    number: "02",
    icon: Code2,
    title: "Turn ideas into reality.",
    description:
      "Build practical AI projects, experiment with emerging technologies and solve problems that matter.",
    label: "BUILD",
    colour: "terracotta",
  },
  {
    number: "03",
    icon: FlaskConical,
    title: "Question what is possible.",
    description:
      "Discover new approaches through research, experimentation, hackathons and collaborative innovation.",
    label: "DISCOVER",
    colour: "gold",
  },
];

const focusAreas = [
  "Generative AI",
  "Machine Learning",
  "AI Agents",
  "Computer Vision",
  "Natural Language Processing",
  "AI Automation",
];

export default function HomeIntroduction() {
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

  return (
    <section
      className="prism-intro-section"
      id="home-introduction"
      aria-labelledby="prism-intro-title"
    >
      <div className="prism-intro-atmosphere" aria-hidden="true">
        <span className="prism-intro-orbit prism-intro-orbit-one" />
        <span className="prism-intro-orbit prism-intro-orbit-two" />
        <span className="prism-intro-particle prism-intro-particle-one" />
        <span className="prism-intro-particle prism-intro-particle-two" />
        <span className="prism-intro-particle prism-intro-particle-three" />
        <span className="prism-intro-aurora" />
      </div>

      <div className="prism-intro-inner">
        <div className="prism-intro-topline">
          <div className="prism-intro-eyebrow">
            <span className="prism-intro-line" />
            <span>01 / WHO WE ARE</span>
          </div>

          <span className="prism-intro-location">
            PRISM AI <span>·</span> RNSIT, BENGALURU
          </span>
        </div>

        <div className="prism-intro-main">
          <div className="prism-intro-heading-column">
            <span className="prism-intro-small-label">
              INTELLIGENCE MEETS IMAGINATION
            </span>

            <h2
              className="prism-intro-title"
              id="prism-intro-title"
            >
              We don't just
              <br />
              <span className="prism-intro-highlight">
                study intelligence.
              </span>
              <br />
              We build with it.
            </h2>

            <div className="prism-intro-heading-bottom">
              <span className="prism-intro-heading-marker">
                <BrainCircuit size={19} strokeWidth={1.5} />
              </span>

              <span>
                A student community for the curious,
                <br className="prism-intro-desktop-break" />
                the creative and the technically driven.
              </span>
            </div>
          </div>

          <div className="prism-intro-description-column">
            <span className="prism-intro-description-number">
              A LITTLE ABOUT US
            </span>

            <p className="prism-intro-description">
              PRISM AI is the artificial intelligence club at
              RNS Institute of Technology. We bring students
              together to explore intelligent systems, experiment
              with emerging technologies and turn promising
              ideas into meaningful projects.
            </p>

            <p className="prism-intro-description secondary">
              From machine learning and generative AI to research
              and real-world applications, we believe the best
              way to understand technology is to build, question
              and create together.
            </p>

            <button
              type="button"
              className="prism-intro-text-link"
              onClick={() => scrollTo("about")}
            >
              GET TO KNOW US
              <ArrowUpRight size={16} />
            </button>
          </div>
        </div>

        <div className="prism-pillars-heading">
          <div>
            <span className="prism-intro-small-label">
              HOW WE MOVE FORWARD
            </span>
            <h3>Three ways to make an impact.</h3>
          </div>

          <span className="prism-pillars-index">01 — 03</span>
        </div>

        <div className="prism-pillars-grid">
          {pillars.map((pillar) => {
            const Icon = pillar.icon;

            return (
              <article
                key={pillar.number}
                className={`prism-pillar prism-pillar-${pillar.colour}`}
              >
                <div className="prism-pillar-top">
                  <span className="prism-pillar-icon">
                    <Icon size={23} strokeWidth={1.5} />
                  </span>

                  <span className="prism-pillar-number">
                    {pillar.number}
                  </span>
                </div>

                <span className="prism-pillar-label">
                  {pillar.label}
                </span>

                <h4>{pillar.title}</h4>
                <p>{pillar.description}</p>

                <div className="prism-pillar-bottom">
                  <span className="prism-pillar-rule" />
                  <span className="prism-pillar-arrow">
                    <ArrowDownRight size={19} />
                  </span>
                </div>
              </article>
            );
          })}
        </div>

        <div className="prism-intro-focus">
          <div className="prism-intro-focus-heading">
            <span className="prism-intro-small-label">
              AREAS WE EXPLORE
            </span>

            <h3>
              One field.
              <br />
              <span>Endless possibilities.</span>
            </h3>

            <p>
              From the foundations of machine learning to the
              next generation of autonomous systems.
            </p>
          </div>

          <div className="prism-focus-tags">
            {focusAreas.map((area, index) => (
              <span
                className={`prism-focus-tag prism-focus-tag-${index + 1}`}
                key={area}
              >
                <span className="prism-focus-tag-dot" />
                {area}
              </span>
            ))}
          </div>

          <div
            className="prism-focus-decoration"
            aria-hidden="true"
          >
            <Compass size={74} strokeWidth={0.7} />
            <Lightbulb size={24} strokeWidth={1.1} />
          </div>
        </div>

        <div className="prism-intro-footer">
          <span>
            <span className="prism-intro-footer-mark">P.</span>
            CURIOUS MINDS. MEANINGFUL WORK.
          </span>

          <button
            type="button"
            className="prism-intro-next"
            onClick={() => scrollTo("events")}
          >
            WHAT'S HAPPENING
            <ArrowDownRight size={17} />
          </button>
        </div>
      </div>
    </section>
  );
}