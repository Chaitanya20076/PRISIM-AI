import React from "react";
import { ArrowUpRight, Blocks, Rocket, Code2 } from "lucide-react";
import "./projects.css";

export default function Projects() {
  return (
    <section
      className="feature-row feature-row--projects"
      id="feature-projects"
    >
      <div className="feature-copy">
        <span className="feature-kicker">03 / CREATE</span>

        <h2>
          Don't just learn it.
          <br />
          <em>Build it.</em>
        </h2>

        <p className="feature-lead">
          The best way to understand technology is to make something with it.
          Take an idea from a sketch to a prototype, then keep improving it
          with your team.
        </p>

        <div className="project-stats">
          <div>
            <Blocks size={20} />
            <strong>Explore</strong>
            <span>Find a problem worth solving.</span>
          </div>

          <div>
            <Rocket size={20} />
            <strong>Prototype</strong>
            <span>Build, test and iterate.</span>
          </div>

          <div>
            <Code2 size={20} />
            <strong>Showcase</strong>
            <span>Share your work with the world.</span>
          </div>
        </div>

        <a className="feature-inline-link" href="/projects">
          Discover student projects
          <ArrowUpRight size={16} />
        </a>
      </div>

      <div className="feature-visual feature-visual--projects">
        <img
          src="/images/features/feature-projects.png"
          alt="Student team collaborating on a technology project"
        />

        <div className="project-side-note">
          <span>FROM CONCEPT</span>
          <b>TO CREATION</b>
          <i />
        </div>
      </div>
    </section>
  );
}