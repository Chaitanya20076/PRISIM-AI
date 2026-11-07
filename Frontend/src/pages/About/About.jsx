import React from "react";

import Navbar from "../../components/Navbar/Navbar";

import AboutHero from "./sections/AboutHero";
import AboutStory from "./sections/AboutStory";
import AboutMission from "./sections/AboutMission";
import AboutDomains from "./sections/AboutDomains";
import AboutTeam from "./sections/AboutTeam";
import AboutCTA from "./sections/AboutCTA";

const About = () => {
  return (
    <>
      <Navbar />

      <main className="about-page">
        <AboutHero />
        <AboutStory />
        <AboutMission />
        <AboutDomains />
        <AboutTeam />
        <AboutCTA />
      </main>
    </>
  );
};

export default About;