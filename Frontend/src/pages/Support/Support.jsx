import React from "react";
import Navbar from "../../components/Navbar/Navbar";

import SupportHero from "./sections/SupportHero";
import SupportForm from "./sections/SupportForm";
import SupportResources from "./sections/SupportResources";

import "./support.css";

export default function Support() {
  return (
    <>
      <Navbar />

      <main className="prism-support-page">
        <SupportHero />
        <SupportForm />
        <SupportResources />
      </main>
    </>
  );
}