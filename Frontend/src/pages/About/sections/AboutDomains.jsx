import React from "react";
import "./about-domains.css";

const domains = [
  {
    number: "01",
    title: "Artificial Intelligence",
    description:
      "Explore intelligent systems, machine learning and the ideas shaping how technology thinks.",
    tag: "INTELLIGENCE",
  },
  {
    number: "02",
    title: "Software Development",
    description:
      "Design and build useful digital experiences through code, collaboration and experimentation.",
    tag: "BUILD",
  },
  {
    number: "03",
    title: "Data & Intelligence",
    description:
      "Discover patterns, work with information and turn data into meaningful insights.",
    tag: "DISCOVERY",
  },
  {
    number: "04",
    title: "Computer Vision",
    description:
      "Explore how machines interpret images, understand visual information and perceive the world.",
    tag: "PERCEPTION",
  },
  {
    number: "05",
    title: "Emerging Technologies",
    description:
      "Stay curious about new tools, evolving platforms and technologies creating new possibilities.",
    tag: "WHAT'S NEXT",
  },
  {
    number: "06",
    title: "Creative Problem Solving",
    description:
      "Bring different perspectives together to approach challenges with imagination and purpose.",
    tag: "IMAGINATION",
  },
];

export default function AboutDomains() {
  return (
    <section className="about-domains" id="about-domains">
      <div className="about-domains__inner">
        <header className="about-domains__header">
          <div>
            <span className="about-domains__eyebrow">
              <span />
              WHAT WE EXPLORE
            </span>
            <h2>
              Curious about
              <span> what's possible?</span>
            </h2>
          </div>

          <p>
            Technology doesn't stand still, and neither do we. These are some
            of the spaces where our curiosity takes us.
          </p>
        </header>

        <div className="about-domains__feature">
          <div className="about-domains__feature-image">
            <img
              src="/images/about/about-domains.png"
              alt="Students exploring artificial intelligence, robotics and emerging technologies in a university innovation lab"
              loading="lazy"
            />
            <div className="about-domains__feature-overlay" />
            <div className="about-domains__feature-caption">
              <span className="about-domains__feature-kicker">
                EXPLORE · EXPERIMENT · CREATE
              </span>
              <h3>Many disciplines. Endless possibilities.</h3>
            </div>
          </div>

          <div className="about-domains__feature-side">
            <span className="about-domains__side-symbol">✳</span>
            <p>
              We make room for ideas that cross boundaries. Start with an
              interest, follow a question and discover where it can lead.
            </p>
            <span className="about-domains__side-index">01 — 06</span>
          </div>
        </div>

        <div className="about-domains__grid">
          {domains.map((domain) => (
            <article className="about-domains__card" key={domain.number}>
              <div className="about-domains__card-top">
                <span className="about-domains__number">{domain.number}</span>
                <span className="about-domains__tag">{domain.tag}</span>
              </div>
              <h3>{domain.title}</h3>
              <p>{domain.description}</p>
              <span className="about-domains__card-line" />
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
