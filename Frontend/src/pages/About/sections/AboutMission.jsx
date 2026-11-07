import React from "react";
import {
  Target,
  Telescope,
  Rocket,
  ArrowUpRight,
  Sparkles,
} from "lucide-react";

import "./about-mission.css";

const pillars = [
  {
    icon: <Telescope size={21} strokeWidth={1.7} />,
    number: "01",
    title: "Explore",
    description:
      "Discover the ideas, tools, and possibilities shaping artificial intelligence. Stay open to new perspectives and keep asking questions.",
    tone: "mission-pillar-explore",
  },
  {
    icon: <Target size={21} strokeWidth={1.7} />,
    number: "02",
    title: "Innovate",
    description:
      "Move beyond theory. Experiment, collaborate, and transform promising ideas into thoughtful projects and practical solutions.",
    tone: "mission-pillar-innovate",
  },
  {
    icon: <Rocket size={21} strokeWidth={1.7} />,
    number: "03",
    title: "Impact",
    description:
      "Use what we learn and build to create value, share knowledge, and contribute positively to the world around us.",
    tone: "mission-pillar-impact",
  },
];

const AboutMission = () => {
  return (
    <section className="about-mission" id="about-mission">
      <div className="about-mission-noise" />
      <div className="about-mission-glow mission-glow-one" />
      <div className="about-mission-glow mission-glow-two" />

      <div className="about-mission-container">
        <div className="about-mission-heading">
          <div className="about-mission-eyebrow">
            <span className="about-mission-eyebrow-icon">
              <Sparkles size={14} />
            </span>
            <span>OUR PURPOSE</span>
          </div>

          <h2 className="about-mission-title">
            A vision that moves
            <span>ideas into action.</span>
          </h2>

          <p className="about-mission-intro">
            Our purpose is to create an environment where curiosity becomes
            capability, collaboration fuels creativity, and technology is
            explored with purpose.
          </p>
        </div>

        <div className="about-mission-statement">
          <div className="about-mission-statement-mark">“</div>
          <div className="about-mission-statement-content">
            <span className="about-mission-statement-label">OUR MISSION</span>
            <p>
              To inspire exploration, encourage innovation, and empower
              people to create meaningful impact through artificial
              intelligence.
            </p>
          </div>
          <div className="about-mission-statement-orbit" aria-hidden="true" />
        </div>

        <div className="about-mission-pillars-heading">
          <span>HOW WE MOVE FORWARD</span>
          <span className="about-mission-heading-rule" />
        </div>

        <div className="about-mission-pillars">
          {pillars.map((pillar) => (
            <article
              className={`about-mission-pillar ${pillar.tone}`}
              key={pillar.number}
            >
              <div className="about-mission-pillar-top">
                <div className="about-mission-pillar-icon">{pillar.icon}</div>
                <span className="about-mission-pillar-number">
                  {pillar.number}
                </span>
              </div>

              <h3>{pillar.title}</h3>
              <p>{pillar.description}</p>

              <div className="about-mission-pillar-bottom">
                <span>PRISM AI</span>
                <ArrowUpRight size={17} />
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
};

export default AboutMission;
