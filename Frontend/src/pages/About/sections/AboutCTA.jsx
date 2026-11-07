import React from "react";
import { Link } from "react-router-dom";
import { ArrowRight, ArrowUpRight, Sparkles, Users, MessageCircle } from "lucide-react";
import "./about-cta.css";

const AboutCTA = () => {
  return (
    <section className="about-cta" id="about-cta">
      <div className="about-cta-glow about-cta-glow-one" />
      <div className="about-cta-glow about-cta-glow-two" />
      <div className="about-cta-grid" />

      <div className="about-cta-container">
        <div className="about-cta-topline">
          <span className="about-cta-eyebrow-icon"><Sparkles size={15} /></span>
          <span>YOUR NEXT CHAPTER STARTS HERE</span>
        </div>

        <div className="about-cta-main">
          <div className="about-cta-copy">
            <h2 className="about-cta-title">
              Curious minds
              <span>belong here.</span>
            </h2>
            <p className="about-cta-description">
              Every great idea starts with a question. Bring your curiosity,
              explore what interests you, and discover what we can create
              together at PRISM AI.
            </p>
            <div className="about-cta-actions">
              <Link to="/events" className="about-cta-primary">
                Explore our events <ArrowRight size={17} />
              </Link>
              <Link to="/projects" className="about-cta-secondary">
                Discover our projects <ArrowUpRight size={17} />
              </Link>
            </div>
          </div>

          <div className="about-cta-visual" aria-hidden="true">
            <div className="about-cta-orbit cta-orbit-one" />
            <div className="about-cta-orbit cta-orbit-two" />
            <div className="about-cta-orbit cta-orbit-three" />
            <div className="about-cta-center">
              <Users size={39} strokeWidth={1.35} />
              <span>CREATE</span>
              <span>TOGETHER</span>
            </div>
            <span className="about-cta-spark cta-spark-one">✳</span>
            <span className="about-cta-spark cta-spark-two">✦</span>
            <span className="about-cta-spark cta-spark-three">+</span>
            <div className="about-cta-floating-note">
              <MessageCircle size={15} />
              <span>Every perspective matters.</span>
            </div>
          </div>
        </div>

        <div className="about-cta-bottom">
          <span>PRISM AI</span>
          <span className="about-cta-bottom-line" />
          <span>EXPLORE. INNOVATE. IMPACT.</span>
        </div>
      </div>
    </section>
  );
};

export default AboutCTA;
