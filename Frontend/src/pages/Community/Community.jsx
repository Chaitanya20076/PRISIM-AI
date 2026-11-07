import { useEffect, useState } from "react";
import {
  ArrowLeft,
  ArrowUpRight,
  CheckCircle2,
  Heart,
  Lightbulb,
  MessageCircle,
  ShieldCheck,
  Sparkles,
  Sun,
  Moon,
  Users,
} from "lucide-react";
import { Link } from "react-router-dom";
import "./Community.css";

const WHATSAPP_INVITE_URL =
  "https://chat.whatsapp.com/Baj6EZKxQ6O03Yk37zlahH?s=cl&p=i&mlu=4&ilr=4&iam=2";

function getInitialTheme() {
  if (typeof window === "undefined") return "light";

  try {
    return (
      localStorage.getItem("prism-theme") ||
      localStorage.getItem("prism-dashboard-theme") ||
      document.documentElement.dataset.theme ||
      "light"
    );
  } catch {
    return document.documentElement.dataset.theme || "light";
  }
}

export default function Community() {
  const [theme, setTheme] = useState(getInitialTheme);

  useEffect(() => {
    const syncTheme = (event) => {
      const eventTheme =
        typeof event?.detail === "string"
          ? event.detail
          : event?.detail?.theme;
      let storedTheme = null;
      try {
        storedTheme =
          localStorage.getItem("prism-theme") ||
          localStorage.getItem("prism-dashboard-theme");
      } catch {
        storedTheme = null;
      }
      const nextTheme =
        eventTheme ||
        document.documentElement.dataset.theme ||
        storedTheme ||
        "light";
      setTheme(nextTheme === "dark" ? "dark" : "light");
    };

    syncTheme();
    window.addEventListener("storage", syncTheme);
    window.addEventListener("prism-theme-change", syncTheme);

    const observer = new MutationObserver(syncTheme);
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["data-theme"],
    });

    return () => {
      window.removeEventListener("storage", syncTheme);
      window.removeEventListener("prism-theme-change", syncTheme);
      observer.disconnect();
    };
  }, []);

  const toggleTheme = () => {
    const nextTheme = theme === "dark" ? "light" : "dark";
    try {
      localStorage.setItem("prism-theme", nextTheme);
      localStorage.setItem("prism-dashboard-theme", nextTheme);
    } catch {
      // Theme still updates for this page if storage is unavailable.
    }
    document.documentElement.dataset.theme = nextTheme;
    document.documentElement.style.colorScheme = nextTheme;
    setTheme(nextTheme);
    window.dispatchEvent(
      new CustomEvent("prism-theme-change", { detail: { theme: nextTheme } })
    );
  };

  const isDark = theme === "dark";

  return (
    <main className={`prism-community-page ${isDark ? "is-dark" : "is-light"}`}>
      <div className="prism-community-noise" aria-hidden="true" />
      <div className="prism-community-particles" aria-hidden="true">
        {Array.from({ length: 18 }, (_, index) => (
          <i key={index} />
        ))}
      </div>

      <header className="prism-community-topbar">
        <Link to="/" className="prism-community-brand" aria-label="PRISM AI home">
          <img
            src={isDark ? "/images/prism-logo-dark.png" : "/images/prism-logo-light.png"}
            alt="PRISM AI"
          />
        </Link>

        <nav className="prism-community-nav" aria-label="Main navigation">
          <Link to="/"></Link>
          <a href="#community-benefits-title"></a>
        </nav>

        <div className="prism-community-actions">
          <Link to="/dashboard" className="prism-community-back">
            <ArrowLeft size={16} />
            <span>Back to Dashboard</span>
          </Link>
          <button
            type="button"
            className="prism-community-theme-toggle"
            onClick={toggleTheme}
            aria-label={`Switch to ${isDark ? "light" : "dark"} mode`}
            title={`Switch to ${isDark ? "light" : "dark"} mode`}
          >
            {isDark ? <Sun size={17} /> : <Moon size={17} />}
            <span>{isDark ? "Light mode" : "Dark mode"}</span>
          </button>
        </div>
      </header>

      <section className="prism-community-hero">
        <div className="prism-community-copy">
          <div className="prism-community-eyebrow">
            <span className="prism-community-live-dot" />
            YOUR PEOPLE. YOUR IDEAS. YOUR COMMUNITY.
          </div>

          <h1>
            Great ideas get <span>better together.</span>
          </h1>
          <p className="prism-community-intro">
            Join the PRISM AI WhatsApp community to connect with fellow innovators,
            stay in the loop with club updates, discover opportunities, and build
            something meaningful together.
          </p>

          <a
            className="prism-community-join-button"
            href={WHATSAPP_INVITE_URL}
            target="_blank"
            rel="noopener noreferrer"
          >
            <img src="/images/whatsapp.png" alt="" className="prism-community-whatsapp-icon" />
            <span>Join WhatsApp Community</span>
            <ArrowUpRight size={18} />
          </a>
          <p className="prism-community-link-note">
            Opens WhatsApp in a new tab. You can review the group before joining.
          </p>

          <div className="prism-community-trust-row">
            <span><ShieldCheck size={16} /> Stay connected</span>
            <span><Users size={16} /> Grow together</span>
          </div>
        </div>

        <div className="prism-community-art" aria-hidden="true">
          <div className="prism-community-orbit orbit-one" />
          <div className="prism-community-orbit orbit-two" />
          <div className="prism-community-orbit orbit-three" />
          <div className="prism-community-glow" />
          <div className="prism-community-glass-card">
            <div className="prism-community-art-icon">
              <MessageCircle size={39} strokeWidth={1.6} />
            </div>
            <div className="prism-community-art-spark"><Sparkles size={19} /></div>
            <div className="prism-community-art-lines"><i /><i /><i /></div>
            <div className="prism-community-art-caption">IDEAS CONNECT HERE</div>
          </div>
          <span className="prism-community-float float-one"><Users size={19} /></span>
          <span className="prism-community-float float-two"><Lightbulb size={19} /></span>
          <span className="prism-community-float float-three"><Heart size={18} /></span>
        </div>
      </section>

      <section className="prism-community-benefits" aria-labelledby="community-benefits-title">
        <div className="prism-community-section-heading">
          <span>WHY JOIN US?</span>
          <h2 id="community-benefits-title">More than a group chat.</h2>
          <p>A place to stay connected with the people building what's next.</p>
        </div>

        <div className="prism-community-benefit-grid">
          <article className="prism-community-benefit-card">
            <span className="benefit-icon benefit-violet"><MessageCircle size={21} /></span>
            <h3>Club updates</h3>
            <p>Keep up with important announcements, activities, and community news.</p>
          </article>
          <article className="prism-community-benefit-card">
            <span className="benefit-icon benefit-green"><Lightbulb size={21} /></span>
            <h3>Ideas & opportunities</h3>
            <p>Discover projects, events, learning opportunities, and things worth exploring.</p>
          </article>
          <article className="prism-community-benefit-card">
            <span className="benefit-icon benefit-blue"><Users size={21} /></span>
            <h3>Build together</h3>
            <p>Meet curious minds, exchange ideas, and find people who share your interests.</p>
          </article>
        </div>
      </section>

      <footer className="prism-community-footer">
        <span><Sparkles size={14} /> PRISM AI</span>
        <span>Explore. Innovate. Impact.</span>
        <span><CheckCircle2 size={14} /> Community starts with you</span>
      </footer>
    </main>
  );
}
