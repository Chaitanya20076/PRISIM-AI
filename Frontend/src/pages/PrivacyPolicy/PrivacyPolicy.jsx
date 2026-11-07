
import React from "react";
import Navbar from "../../components/Navbar/Navbar";
import "./privacy-policy.css";

import PrivacyHero from "./sections/PrivacyHero.jsx";
import PrivacyContent from "./sections/PrivacyContent.jsx";

export default function PrivacyPolicy() {
  return (
    <>
      <Navbar />

      <main className="prism-privacy-page">
        <PrivacyHero />
        <PrivacyContent />
      </main>
    </>
  );
}
