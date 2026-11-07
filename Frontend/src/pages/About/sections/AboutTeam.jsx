import React from "react";
import "./about-team.css";

const contributions = [
  {
    number: "01",
    title: "Technology & Development",
    description:
      "Turning ideas into working products, prototypes and technical experiences.",
  },
  {
    number: "02",
    title: "Research & Innovation",
    description:
      "Exploring new concepts, asking questions and discovering better approaches.",
  },
  {
    number: "03",
    title: "Design & Community",
    description:
      "Shaping experiences, sharing knowledge and bringing people together.",
  },
];

export default function AboutTeam() {
  return (
    <section className="about-team" id="about-team">
      <div className="about-team__inner">
        <div className="about-team__heading">
          <span className="about-team__eyebrow">
            <span />
            THE PEOPLE BEHIND THE POSSIBILITIES
          </span>
          <h2>
            Different minds.
            <span> One shared curiosity.</span>
          </h2>
          <p>
            PRISM AI is powered by people who bring different interests,
            perspectives and skills to the same table. What connects us is the
            desire to learn, create and make an impact together.
          </p>
        </div>

        <div className="about-team__photo-wrap">
          <div className="about-team__photo">
            <img
              src="/images/about/about-team.png"
              alt="Members of the PRISM AI student community"
              loading="lazy"
            />
            <div className="about-team__photo-overlay" />
            <div className="about-team__photo-caption">
              <span>ONE COMMUNITY</span>
              <strong>Many perspectives. Shared ambition.</strong>
            </div>
          </div>
          <div className="about-team__photo-side-note">
            <span className="about-team__asterisk">✳</span>
            <span>Everyone brings something different.</span>
          </div>
        </div>

        <div className="about-team__bottom">
          <div className="about-team__bottom-intro">
            <span className="about-team__small-label">HOW WE CONTRIBUTE</span>
            <h3>There is a place for every kind of curious mind.</h3>
          </div>

          <div className="about-team__contributions">
            {contributions.map((item) => (
              <article className="about-team__contribution" key={item.number}>
                <span className="about-team__contribution-number">
                  {item.number}
                </span>
                <div>
                  <h4>{item.title}</h4>
                  <p>{item.description}</p>
                </div>
              </article>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
