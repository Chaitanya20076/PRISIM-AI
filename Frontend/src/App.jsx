
import { useState } from "react";
import {
  BrowserRouter,
  Navigate,
  Route,
  Routes,
  Link,
} from "react-router-dom";

// Existing pages
import About from "./pages/About/About";
import Gallery from "./pages/Gallery/Gallery.jsx";
import Navbar from "./components/Navbar/Navbar.jsx";
import Home from "./pages/Home/Home.jsx";
import Admin from "./pages/Admin/Admin.jsx";
import Projects from "./pages/Projects/Projects.jsx";
import NewsAndUpdates from "./pages/News/NewsAndUpdates.jsx";
import AIToolOfWeek from "./pages/AIToolOfWeek/AIToolOfWeek.jsx";
import Login from "./pages/login/login.jsx";
import Dashboard from "./pages/Dashboard/Dashboard.jsx";
import Community from "./pages/Community/Community.jsx";
import Intro from "./pages/Intro/Intro.jsx";
import Features from "./pages/Features/Features";
import LandingOverview from "./pages/Events/LandingOverview.jsx";
import HackathonPublic from "./pages/Hackathons/HackathonPublic.jsx";
import Workshopspublic from "./pages/Workshops/Workshopspublic.jsx";
import SeminarPublic from "./pages/Seminar/seminarpublic.jsx";
import Webinarpublic from "./pages/Webinar/Webinarpublic.jsx";
import Bootcamppublic from "./pages/Bootcamp/Bootcamppublic.jsx";
import Competitionpublic from "./pages/Competition/Competitionpublic.jsx";
import PrivacyPolicy from "./pages/PrivacyPolicy/PrivacyPolicy";
import RecruitmentPortal from "./pages/Recruitments/RecruitmentPortal.jsx";
import TermsAndConditions from "./pages/TermsAndConditions/TermsAndConditions";
import FAQs from "./pages/FAQs/FAQs";
import Support from "./pages/Support/Support";
import Onboarding from "./pages/Onboarding/Onboarding";
import Help from "./pages/Help/Help";
import PublicEvents from "./pages/PublicEvents/PublicEvents.jsx";
/* --------------------------------------------------
   COMING SOON PAGE
-------------------------------------------------- */

function ComingSoon({ title, description }) {
  return (
    <div
      style={{
        minHeight: "75vh",
        display: "grid",
        placeItems: "center",
        padding: "32px 20px",
        background: "var(--dash-bg, #faf9ff)",
        color: "var(--dash-text, #24183d)",
        fontFamily: "Inter, system-ui, sans-serif",
      }}
    >
      <div style={{ maxWidth: 480, textAlign: "center" }}>
        <div
          style={{
            width: 64,
            height: 64,
            margin: "0 auto 20px",
            display: "grid",
            placeItems: "center",
            borderRadius: 20,
            background: "#eee7ff",
            color: "#7c3aed",
            fontSize: 28,
          }}
        >
          ✦
        </div>

        <p
          style={{
            color: "#8b5cf6",
            fontSize: 11,
            fontWeight: 800,
            letterSpacing: 2,
          }}
        >
          PRISM AI WORKSPACE
        </p>

        <h1 style={{ fontSize: 30, margin: "10px 0" }}>
          {title}
        </h1>

        <p style={{ color: "#81758f", lineHeight: 1.8 }}>
          {description}
        </p>

        <p style={{ color: "#81758f", fontSize: 12 }}>
          This section is ready for its feature implementation.
        </p>

        <Link
          to="/dashboard"
          style={{
            display: "inline-block",
            marginTop: 14,
            padding: "12px 20px",
            background: "#7c3aed",
            color: "#fff",
            textDecoration: "none",
            borderRadius: 12,
            fontSize: 13,
            fontWeight: 700,
          }}
        >
          Back to Dashboard
        </Link>
      </div>
    </div>
  );
}

/* --------------------------------------------------
   HOMEPAGE
-------------------------------------------------- */

function HomePage() {
  const [showIntro, setShowIntro] = useState(() => {
    try {
      return sessionStorage.getItem("prism-intro-seen") !== "true";
    } catch {
      return true;
    }
  });

  function finishIntro() {
    try {
      sessionStorage.setItem("prism-intro-seen", "true");
    } catch {
      // Continue if session storage is unavailable.
    }

    setShowIntro(false);
  }

  return (
    <>
      <Navbar />
      <Home />

      {showIntro && <Intro onComplete={finishIntro} />}
    </>
  );
}

/* --------------------------------------------------
   MAIN APPLICATION
-------------------------------------------------- */

function App() {
  return (
    <BrowserRouter>
      <Routes>

        {/* Homepage */}
        <Route path="/" element={<HomePage />} />

        {/* Authentication */}
        <Route path="/login" element={<Login />} />

        {/* User dashboard */}
        <Route path="/dashboard" element={<Dashboard />} />

        {/* News & Updates - Firestore announcements */}
        <Route
          path="/news-and-updates"
          element={<NewsAndUpdates />}
        />

        {/* Legacy news URL - redirects to the new route */}
        <Route
          path="/news"
          element={<Navigate to="/news-and-updates" replace />}
        />

        {/* Other dashboard sections */}
        <Route path="/projects" element={<Projects />} />

        <Route
          path="/ai-tool-of-the-week"
          element={<AIToolOfWeek />}
        />

        <Route path="/gallery" element={<Gallery />} />

        <Route path="/community" element={<Community />} />

        {/* Events */}
        <Route path="/events" element={<LandingOverview />} />

        <Route
          path="/events/hackathons"
          element={<HackathonPublic />}
        />

        <Route
          path="/events/hackathons/:slug"
          element={<HackathonPublic />}
        />

        <Route
          path="/events/workshops/:slug"
          element={<Workshopspublic />}
        />

        <Route
          path="/events/seminars/:slug"
          element={<SeminarPublic />}
        />

        <Route
          path="/events/webinars/:slug"
          element={<Webinarpublic />}
        />

        <Route
          path="/events/bootcamps/:slug"
          element={<Bootcamppublic />}
        />

        <Route
          path="/events/competitions/:slug"
          element={<Competitionpublic />}
        />

        {/* Recruitment */}
        <Route
          path="/recruitments"
          element={<RecruitmentPortal />}
        />

        {/* Dashboard placeholders */}
        <Route
          path="/knowledge-hub"
          element={
            <ComingSoon
              title="Knowledge Hub"
              description="Learning resources, tutorials, and curated technical content will live here."
            />
          }
        />

        <Route
          path="/leaderboard"
          element={
            <ComingSoon
              title="Leaderboard"
              description="A home for member achievements, participation, and community contributions."
            />
          }
        />

        {/* Admin */}
        <Route path="/admin/*" element={<Admin />} />

        {/* General pages */}
        <Route path="/about" element={<About />} />

        <Route path="/features" element={<Features />} />

        <Route
          path="/privacy-policy"
          element={<PrivacyPolicy />}
        />

        <Route
          path="/terms-and-conditions"
          element={<TermsAndConditions />}
        />

        <Route path="/support" element={<Support />} />

        <Route path="/faqs" element={<FAQs />} />

        <Route path="/onboarding" element={<Onboarding />} />

        <Route path="/help" element={<Help />} />

        {/* Unknown routes - always last */}
        <Route
          path="*"
          element={<Navigate to="/" replace />}
        />
        <Route path="/public/events" element={<PublicEvents />} />

      </Routes>
    </BrowserRouter>
  );
}

export default App;
