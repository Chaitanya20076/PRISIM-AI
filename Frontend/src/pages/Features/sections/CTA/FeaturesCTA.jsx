import React from "react";
import { ArrowUpRight, Sparkles } from "lucide-react";
import "./features-cta.css";

export default function FeaturesCTA() {
  return (
    <section className="features-cta">

      {/* Animated Prism Orb */}
      <div className="features-cta__orb" aria-hidden="true">
        <div className="features-cta__orbit features-cta__orbit--one" />
        <div className="features-cta__orbit features-cta__orbit--two" />
        <div className="features-cta__orbit features-cta__orbit--three" />

        <div className="features-cta__core">
          <div className="features-cta__core-inner">
            <Sparkles size={35} />
          </div>
        </div>

        {/* Floating particles */}
        <span className="features-cta__particle particle-one" />
        <span className="features-cta__particle particle-two" />
        <span className="features-cta__particle particle-three" />
        <span className="features-cta__particle particle-four" />
        <span className="features-cta__particle particle-five" />
        <span className="features-cta__particle particle-six" />
      </div>

      {/* CTA Content */}
      <div className="features-cta__content">

        <span className="features-cta__eyebrow">
          <Sparkles size={14} />
          YOUR NEXT CHAPTER STARTS HERE
        </span>

        <h2>
          Curiosity looks
          <br />
          <em>good on you.</em>
        </h2>

        <p>
          Bring your questions, your ideas and your ambition.
          There's a place for you at PRISM AI.
        </p>

        <div className="features-cta__actions">
          <a href="/login">
            Join PRISM AI
            <ArrowUpRight size={17} />
          </a>

          <a
            className="features-cta__secondary"
            href="/events"
          >
            Explore events
            <ArrowUpRight size={17} />
          </a>
        </div>

      </div>

      <span className="features-cta__signature">
        EXPLORE. INNOVATE. IMPACT.
      </span>

    </section>
  );
}