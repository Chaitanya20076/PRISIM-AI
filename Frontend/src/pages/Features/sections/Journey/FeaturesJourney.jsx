import React from "react";
import {
  Compass,
  BookOpen,
  Code2,
  Award,
  ArrowRight,
} from "lucide-react";

import "./features-journey.css";

const stages = [
  {
    number: "01",
    icon: Compass,
    title: "Discover",
    text: "Find a topic that sparks your curiosity.",
    label: "THE BEGINNING",
  },
  {
    number: "02",
    icon: BookOpen,
    title: "Learn",
    text: "Build the knowledge and confidence to begin.",
    label: "GAIN KNOWLEDGE",
  },
  {
    number: "03",
    icon: Code2,
    title: "Build",
    text: "Turn what you learn into something real.",
    label: "MAKE IT REAL",
  },
  {
    number: "04",
    icon: Award,
    title: "Showcase",
    text: "Share your work and inspire what comes next.",
    label: "MAKE AN IMPACT",
  },
];

export default function FeaturesJourney() {
  return (
    <section className="features-journey">

      {/* Heading */}
      <div className="features-journey__heading">
        <span className="feature-kicker">
          THE PRISM PATH
        </span>

        <div className="features-journey__heading-content">
          <h2>
            One step leads
            <br />
            <em>to the next.</em>
          </h2>

          <p>
            There's no single way to grow here. Start somewhere,
            stay curious and keep moving. Every experience takes
            you a little further.
          </p>
        </div>
      </div>

      {/* Timeline */}
      <div className="features-timeline">

        {/* Permanent thin line + travelling light */}
        <div className="features-timeline__track">
          <div className="features-timeline__progress" />
        </div>

        {/* Milestones */}
        <div className="features-timeline__milestones">

          {stages.map(({ number, icon: Icon, title, text, label }, index) => (
            <article
              className="features-timeline__milestone"
              key={number}
              style={{ "--milestone-index": index }}
            >

              {/* Timeline node */}
              <div className="features-timeline__node-wrap">

                <div className="features-timeline__node">
                  <Icon size={23} strokeWidth={1.8} />
                </div>

                <span className="features-timeline__number">
                  {number}
                </span>

              </div>

              {/* Content */}
              <div className="features-timeline__content">

                <span className="features-timeline__label">
                  {label}
                </span>

                <h3>{title}</h3>

                <p>{text}</p>

              </div>

              {/* Arrow */}
              {index !== stages.length - 1 && (
                <div className="features-timeline__connector">
                  <ArrowRight size={19} />
                </div>
              )}

            </article>
          ))}

        </div>
      </div>

      {/* Footer */}
      <div className="features-journey__footer">
        <span className="features-journey__footer-line" />

        <p>
          Your journey. Your ideas. Your impact.
        </p>

        <span className="features-journey__footer-line" />
      </div>

    </section>
  );
}