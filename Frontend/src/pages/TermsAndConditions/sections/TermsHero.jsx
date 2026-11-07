import React from "react";
import { FileText, ArrowDown, Sparkles } from "lucide-react";
import "./terms-hero.css";

export default function TermsHero() {
  const scrollToTerms = () => {
    document.getElementById("acceptance")?.scrollIntoView({
      behavior: "smooth",
      block: "start",
    });
  };

  return (
    <section className="terms-hero">
      <div className="terms-hero__orb terms-hero__orb--one" />
      <div className="terms-hero__orb terms-hero__orb--two" />

      <div className="terms-hero__inner">
        <div className="terms-hero__eyebrow">
          <Sparkles size={14} />
          <span>PRISM AI · LEGAL</span>
        </div>

        <div className="terms-hero__icon">
          <FileText size={30} strokeWidth={1.4} />
        </div>

        <h1>
          Clear terms.
          <br />
          <span>Better experiences.</span>
        </h1>

        <p>
          A transparent understanding of how you can access and use
          the PRISM AI platform, services and community.
        </p>

        <div className="terms-hero__meta">
          <span>Terms & Conditions</span>
          <span className="terms-hero__dot" />
          <span>Last updated: November 2026</span>
        </div>

        <button
          className="terms-hero__scroll"
          onClick={scrollToTerms}
          aria-label="Read terms and conditions"
        >
          <span>Explore the terms</span>
          <ArrowDown size={16} />
        </button>
      </div>
    </section>
  );
}