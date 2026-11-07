import React from "react";
import Navbar from "../../components/Navbar/Navbar";
import "./features.css";

import Workshops from "./sections/Workshops/Workshops";
import Hackathons from "./sections/Hackathons/Hackathons";
import Projects from "./sections/Projects/Projects";
import Research from "./sections/Research/Research";
import Mentorship from "./sections/Mentorship/Mentorship";
import Community from "./sections/Community/Community";
import FeaturesJourney from "./sections/Journey/FeaturesJourney";
import FeaturesCTA from "./sections/CTA/FeaturesCTA";

export default function Features() {
  return (
    <>
      <Navbar />
      <main className="prism-features-page">
        <section className="prism-features-intro">
          <div className="prism-features-intro__content">
            <span className="prism-features-eyebrow"><i /> THE PRISM EXPERIENCE</span>
            <h1>More than a club.<br /><span>A place to build what’s next.</span></h1>
            <p>Learn together. Build fearlessly. Make an impact. Discover the experiences that bring our community to life.</p>
            <a className="features-text-link" href="#feature-workshops">Explore the experience <span>↓</span></a>
          </div>
          <div className="prism-features-intro__note">
            <span className="intro-note-number">01 — 06</span>
            <span>Ways to learn,<br />create and grow.</span>
          </div>
        </section>

        <div className="prism-features-sections">
          <Workshops />
          <Hackathons />
          <Projects />
          <Research />
          <Mentorship />
          <Community />
        </div>
        <FeaturesJourney />
        <FeaturesCTA />
      </main>
    </>
  );
}