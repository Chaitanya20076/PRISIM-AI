import React from "react";
import "./about-story.css";

const values = [
  {
    number: "01",
    title: "Stay curious",
    description:
      "Ask better questions, explore unfamiliar ideas and keep learning beyond the classroom.",
  },
  {
    number: "02",
    title: "Experiment boldly",
    description:
      "Turn concepts into prototypes, test possibilities and learn by building together.",
  },
  {
    number: "03",
    title: "Grow together",
    description:
      "Share knowledge, support different perspectives and make progress as a community.",
  },
];

export default function AboutStory() {
  return (
    <section className="about-story" id="about-story">
      <div className="about-story__inner">
        <div className="about-story__copy">
          <span className="about-story__eyebrow">
            <span className="about-story__eyebrow-line" />
            OUR STORY
          </span>

          <h2>
            Not just learning about the future.
            <span> Building it together.</span>
          </h2>

          <p className="about-story__intro">
            PRISM AI brings curious minds together to explore artificial
            intelligence, experiment with emerging technologies and turn
            ambitious ideas into meaningful work.
          </p>

          <p className="about-story__body">
            We believe innovation grows when people learn from one another.
            Through collaboration, hands-on exploration and shared experiences,
            we create a space where students can question, create and grow.
          </p>

          <div className="about-story__values">
            {values.map((value) => (
              <article className="about-story__value" key={value.number}>
                <span className="about-story__value-number">{value.number}</span>
                <div>
                  <h3>{value.title}</h3>
                  <p>{value.description}</p>
                </div>
              </article>
            ))}
          </div>
        </div>

        <div className="about-story__visual">
          <div className="about-story__image-frame">
            <img
              src="/images/about/about-story.png"
              alt="Students collaborating on ideas and technology in a university workspace"
              loading="lazy"
            />
            <div className="about-story__image-shade" />
            <div className="about-story__image-caption">
              <span className="about-story__caption-dot" />
              <span>Ideas grow when we build together.</span>
            </div>
          </div>
          <div className="about-story__image-note">
            <span className="about-story__note-mark">✳</span>
            <span>Curiosity is where it begins.</span>
          </div>
          <span className="about-story__visual-index">PRISM AI · COMMUNITY</span>
        </div>
      </div>
    </section>
  );
}
