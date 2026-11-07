import React from "react";
import { Link } from "react-router-dom";
import {
  ArrowDown,
  ArrowUpRight,
  Sparkles,
  Orbit,
  Lightbulb,
} from "lucide-react";

import "./about-hero.css";

const AboutHero = () => {
  const scrollToStory = () => {
    document.getElementById("about-story")?.scrollIntoView({
      behavior: "smooth",
    });
  };

  return (
    <section className="about-hero">
      <div className="about-hero-grid" />
      <div className="about-hero-glow about-hero-glow-one" />
      <div className="about-hero-glow about-hero-glow-two" />

      <div className="about-hero-container">
        <div className="about-hero-content">
          <div className="about-hero-eyebrow">
            <span className="about-hero-eyebrow-icon">
              <Sparkles size={14} />
            </span>
            <span>GET TO KNOW US</span>
            <span className="about-hero-eyebrow-line" />
          </div>

          <h1 className="about-hero-title">
            We see
            <span className="about-hero-title-highlight">possibility.</span>
            <span className="about-hero-title-last">
              We build what's next.
            </span>
          </h1>

          <p className="about-hero-description">
            We are PRISM AI — a community of curious minds exploring
            artificial intelligence, experimenting with ideas, and
            building technology that creates meaningful impact.
          </p>

          <div className="about-hero-actions">
            <button
              className="about-hero-primary-btn"
              onClick={scrollToStory}
              type="button"
            >
              Discover our story
              <ArrowDown size={17} />
            </button>

            <Link to="/projects" className="about-hero-secondary-btn">
              Explore our work
              <ArrowUpRight size={17} />
            </Link>
          </div>

          <div className="about-hero-bottom-note">
            <span className="about-hero-note-dot" />
            <span>Explore. Innovate. Impact.</span>
          </div>
        </div>

        <div className="about-hero-visual" aria-label="PRISM AI visual">
          <div className="about-hero-orbit orbit-one" />
          <div className="about-hero-orbit orbit-two" />
          <div className="about-hero-orbit orbit-three" />

          <div className="about-hero-orbit-dot orbit-dot-one" />
          <div className="about-hero-orbit-dot orbit-dot-two" />
          <div className="about-hero-orbit-dot orbit-dot-three" />

          <div className="about-hero-prism-wrap">
            <div className="about-hero-prism-glow" />
            <div className="about-hero-prism">
              <div className="about-hero-prism-face prism-face-left" />
              <div className="about-hero-prism-face prism-face-right" />
              <div className="about-hero-prism-face prism-face-bottom" />
              <div className="about-hero-prism-highlight" />
            </div>

            <div className="about-hero-prism-label">
              <span>PRISM</span>
              <span>AI</span>
            </div>
          </div>

          <div className="about-hero-float-card float-card-one">
            <div className="about-hero-card-icon">
              <Lightbulb size={18} />
            </div>
            <div>
              <span className="about-hero-card-title">Think beyond</span>
              <span className="about-hero-card-subtitle">
                Question everything
              </span>
            </div>
          </div>

          <div className="about-hero-float-card float-card-two">
            <div className="about-hero-card-icon card-icon-purple">
              <Orbit size={18} />
            </div>
            <div>
              <span className="about-hero-card-title">Build together</span>
              <span className="about-hero-card-subtitle">
                Ideas into innovation
              </span>
            </div>
          </div>

          <div className="about-hero-floating-spark spark-one">✳</div>
          <div className="about-hero-floating-spark spark-two">✦</div>
          <div className="about-hero-floating-spark spark-three">+</div>
        </div>
      </div>

      <div className="about-hero-scroll-indicator">
        <span>SCROLL TO EXPLORE</span>
        <div className="about-hero-scroll-line" />
      </div>
    </section>
  );
};

export default AboutHero;
