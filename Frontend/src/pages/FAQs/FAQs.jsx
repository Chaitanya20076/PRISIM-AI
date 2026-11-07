import React from "react";
import Navbar from "../../components/Navbar/Navbar";
import FAQHero from "./sections/FAQHero";
import FAQContent from "./sections/FAQContent";
import "./faqs.css";

export default function FAQs() {
  return (
    <>
      <Navbar />

      <main className="prism-faq-page">
        <FAQHero />
        <FAQContent />
      </main>
    </>
  );
}