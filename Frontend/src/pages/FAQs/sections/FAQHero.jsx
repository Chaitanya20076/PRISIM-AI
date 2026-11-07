import React from "react";
import { ArrowDown, MessageCircleQuestion, Sparkles } from "lucide-react";
import "./faq-hero.css";

export default function FAQHero() {
  const scrollToFAQs = () => {
    document.getElementById("faq-content")?.scrollIntoView({
      behavior: "smooth",
      block: "start",
    });
  };

  return (
    <section className="faq-hero">
      <div className="faq-hero__orb faq-hero__orb--one" />
      <div className="faq-hero__orb faq-hero__orb--two" />

      <div className="faq-hero__inner">
        <div className="faq-hero__eyebrow">
          <Sparkles size={14} />
          <span>PRISM AI · HELP CENTRE</span>
        </div>

        <div className="faq-hero__icon">
          <MessageCircleQuestion size={31} strokeWidth={1.4} />
        </div>

        <h1>
          Questions?
          <br />
          <span>We've got answers.</span>
        </h1>

        <p>
          Curious about PRISM AI, our events, projects or how to get
          involved? Find everything you need to know right here.
        </p>

        <button className="faq-hero__scroll" onClick={scrollToFAQs}>
          <span>Explore frequently asked questions</span>
          <ArrowDown size={16} />
        </button>

        <div className="faq-hero__bottom-note">
          <span className="faq-hero__line" />
          <span>EXPLORE · LEARN · GET INVOLVED</span>
          <span className="faq-hero__line" />
        </div>
      </div>
    </section>
  );
}