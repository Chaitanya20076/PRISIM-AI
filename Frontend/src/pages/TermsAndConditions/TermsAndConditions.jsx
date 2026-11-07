import React from "react";
import Navbar from "../../components/Navbar/Navbar";
import "./terms-and-conditions.css";

import TermsHero from "./sections/TermsHero";
import TermsContent from "./sections/TermsContent";

export default function TermsAndConditions() {
  return (
    <>
      <Navbar />

      <main className="prism-terms-page">
        <TermsHero />
        <TermsContent />
      </main>
    </>
  );
}