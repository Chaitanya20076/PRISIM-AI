import { useEffect, useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  Eye,
  EyeOff,
  Moon,
  Sun,
  ShieldCheck,
  LockKeyhole,
  UserRound,
  Fingerprint,
  Users,
  CalendarDays,
  Settings,
  Activity,
  X,
  RefreshCw,
} from "lucide-react";
import "./AdminLogin.css";

const API_BASE_URL = (
  import.meta.env.VITE_API_URL ||
  import.meta.env.VITE_API_BASE_URL ||
  "http://localhost:5000"
).replace(/\/+$/, "");

const ADMIN_SLIDES = [
  {
    eyebrow: "THE PRISM AI CONTROL ROOM",
    title: "Lead the vision. Shape the future.",
    description:
      "A dedicated space to guide the people, ideas and initiatives moving PRISM AI forward.",
    accent: "future.",
  },
  {
    eyebrow: "PEOPLE. PROJECTS. POSSIBILITIES.",
    title: "Great communities are built together.",
    description:
      "Bring members together, support brilliant teams and help turn promising ideas into meaningful work.",
    accent: "together.",
  },
  {
    eyebrow: "MAKE EVERY INITIATIVE COUNT",
    title: "From planning to real impact.",
    description:
      "Coordinate events, share announcements and keep every club initiative moving with purpose.",
    accent: "impact.",
  },
  {
    eyebrow: "YOUR ADMINISTRATIVE WORKSPACE",
    title: "The next chapter starts with you.",
    description:
      "Sign in to access the tools that help manage and grow the PRISM AI community at RNSIT.",
    accent: "you.",
  },
];

async function postJson(endpoint, body) {
  let response;
  try {
    response = await fetch(`${API_BASE_URL}${endpoint}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
  } catch {
    throw new Error(
      "Cannot connect to the PRISM AI backend. Check that your backend is running."
    );
  }

  const data = await response.json().catch(() => ({}));
  if (!response.ok || !data.success) {
    throw new Error(data.message || "Unable to sign in. Please try again.");
  }
  return data;
}

export default function AdminLogin() {
  const [theme, setTheme] = useState(() => {
    try {
      return localStorage.getItem("prism-theme") || "light";
    } catch {
      return "light";
    }
  });
  const [slideIndex, setSlideIndex] = useState(0);
  const [name, setName] = useState("");
  const [memberId, setMemberId] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState("error");

  useEffect(() => {
    const timer = window.setInterval(() => {
      setSlideIndex((current) => (current + 1) % ADMIN_SLIDES.length);
    }, 4800);
    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem("prism-theme", theme);
    } catch {
      // Theme preference is optional.
    }
    document.documentElement.dataset.theme = theme;
    window.dispatchEvent(
      new CustomEvent("prism-theme-change", { detail: theme })
    );
  }, [theme]);

  const currentSlide = ADMIN_SLIDES[slideIndex];

  const showMessage = (text, type = "error") => {
    setMessage(text);
    setMessageType(type);
  };

  const handleLogin = async (event) => {
    event.preventDefault();
    setMessage("");

    if (!name.trim() || !memberId.trim() || !password) {
      showMessage("Please enter your name, Member ID and password.");
      return;
    }

    setLoading(true);
    try {
      const data = await postJson("/api/admin/login", {
        name: name.trim(),
        memberId: memberId.trim(),
        password,
      });

      if (!data.token) {
        throw new Error("The server did not return an admin access token.");
      }

      sessionStorage.setItem("prism-admin-token", data.token);
      window.location.assign("/admin/dashboard");
    } catch (error) {
      showMessage(error.message || "Unable to sign in. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main
      className={`prism-admin-auth-page ${
        theme === "dark" ? "prism-admin-auth-dark" : "prism-admin-auth-light"
      }`}
    >
      <button
        className="prism-admin-back-button"
        type="button"
        onClick={() => window.location.assign("/")}
        aria-label="Back to PRISM AI home"
      >
        <ArrowLeft size={17} />
        <span>Back to home</span>
      </button>

      <button
        className="prism-admin-theme-toggle"
        type="button"
        onClick={() => setTheme((current) => (current === "dark" ? "light" : "dark"))}
        aria-label={`Switch to ${theme === "dark" ? "light" : "dark"} mode`}
      >
        {theme === "dark" ? <Sun size={17} /> : <Moon size={17} />}
        <span>{theme === "dark" ? "Light mode" : "Dark mode"}</span>
      </button>

      <section className="prism-admin-promo" aria-label="PRISM AI administration">
        <div className="prism-admin-orb prism-admin-orb-one" />
        <div className="prism-admin-orb prism-admin-orb-two" />
        <div className="prism-admin-grid" />
        <div className="prism-admin-starfield" aria-hidden="true">
          {Array.from({ length: 18 }, (_, index) => (
            <i
              key={index}
              className={`prism-admin-star prism-admin-star-${(index % 5) + 1}`}
              style={{
                left: `${(index * 37 + 8) % 96}%`,
                top: `${(index * 53 + 7) % 94}%`,
                animationDelay: `${(index % 7) * -0.65}s`,
              }}
            />
          ))}
        </div>

        <a className="prism-admin-brand" href="/" aria-label="PRISM AI home">
          <span className="prism-admin-brand-mark" aria-hidden="true">
            <i /><i /><i />
          </span>
          <span className="prism-admin-brand-copy">
            <strong>PRISM AI</strong>
            <small>RNS INSTITUTE OF TECHNOLOGY</small>
          </span>
        </a>

        <div
          className={`prism-admin-promo-content prism-admin-promo-content-${slideIndex}`}
          key={slideIndex}
        >
          <div className="prism-admin-eyebrow">
            <span className="prism-admin-eyebrow-dot" />
            {currentSlide.eyebrow}
          </div>
          <h1>
            {currentSlide.title.slice(0, currentSlide.title.length - currentSlide.accent.length)}
            <span>{currentSlide.accent}</span>
          </h1>
          <p>{currentSlide.description}</p>

          <div className="prism-admin-feature-row">
            <span><Users size={15} /> Manage members</span>
            <span><CalendarDays size={15} /> Host events</span>
            <span><Activity size={15} /> Track activity</span>
          </div>

          <div className="prism-admin-slide-controls" aria-label="Admin information slides">
            {ADMIN_SLIDES.map((slide, index) => (
              <button
                key={slide.eyebrow}
                type="button"
                className={index === slideIndex ? "is-active" : ""}
                onClick={() => setSlideIndex(index)}
                aria-label={`Show slide ${index + 1}: ${slide.eyebrow}`}
                aria-pressed={index === slideIndex}
              />
            ))}
          </div>
        </div>

        <div className="prism-admin-promo-footer">
          <span>EXPLORE. INNOVATE. IMPACT.</span>
          <span className="prism-admin-footer-divider" />
          <span>PRISM AI · RNSIT</span>
        </div>

        <div className="prism-admin-floating-card prism-admin-floating-card-top">
          <span className="prism-admin-floating-icon"><ShieldCheck size={17} /></span>
          <span><strong>One secure workspace</strong><small>Built for authorised admins.</small></span>
        </div>
        <div className="prism-admin-floating-card prism-admin-floating-card-bottom">
          <span className="prism-admin-floating-icon"><Settings size={17} /></span>
          <span><strong>Keep things moving</strong><small>Manage what happens next.</small></span>
        </div>
      </section>

      <section className="prism-admin-form-side">
        <div className="prism-admin-form-wrap">
          <a className="prism-admin-mobile-brand" href="/" aria-label="PRISM AI home">
            <span className="prism-admin-brand-mark" aria-hidden="true"><i /><i /><i /></span>
            <span className="prism-admin-brand-copy">
              <strong>PRISM AI</strong>
              <small>RNS INSTITUTE OF TECHNOLOGY</small>
            </span>
          </a>

          <div className="prism-admin-form-heading">
            <div className="prism-admin-welcome-icon"><ShieldCheck size={20} /></div>
            <span className="prism-admin-form-kicker">ADMINISTRATOR ACCESS</span>
            <h2>Welcome, admin.</h2>
            <p>Sign in to manage the people and initiatives behind PRISM AI.</p>
          </div>

          <div className="prism-admin-security-note">
            <span className="prism-admin-security-icon"><LockKeyhole size={16} /></span>
            <span>
              <strong>Protected admin workspace</strong>
              <small>Only authorised PRISM AI administrators can continue.</small>
            </span>
          </div>

          <form className="prism-admin-form" onSubmit={handleLogin}>
            <label className="prism-admin-field">
              <span>Full name</span>
              <div className="prism-admin-input-wrap">
                <UserRound size={17} />
                <input
                  type="text"
                  name="name"
                  autoComplete="name"
                  placeholder="Enter your full name"
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                  required
                />
              </div>
            </label>

            <label className="prism-admin-field">
              <span>Member ID</span>
              <div className="prism-admin-input-wrap">
                <Fingerprint size={17} />
                <input
                  type="text"
                  name="memberId"
                  autoComplete="username"
                  placeholder="Enter your admin Member ID"
                  value={memberId}
                  onChange={(event) => setMemberId(event.target.value)}
                  required
                />
              </div>
            </label>

            <label className="prism-admin-field">
              <span>Password</span>
              <div className="prism-admin-input-wrap">
                <LockKeyhole size={17} />
                <input
                  type={showPassword ? "text" : "password"}
                  name="password"
                  autoComplete="current-password"
                  placeholder="Enter your admin password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  required
                />
                <button
                  className="prism-admin-password-toggle"
                  type="button"
                  onClick={() => setShowPassword((visible) => !visible)}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? <EyeOff size={17} /> : <Eye size={17} />}
                </button>
              </div>
            </label>

            {message && (
              <div className="prism-admin-message" role="alert" data-type={messageType}>
                <span>{message}</span>
                <button type="button" onClick={() => setMessage("")} aria-label="Dismiss message">
                  <X size={15} />
                </button>
              </div>
            )}

            <button className="prism-admin-submit" type="submit" disabled={loading}>
              <span>{loading ? "Authenticating..." : "Access admin console"}</span>
              {loading ? <RefreshCw className="prism-admin-spinner" size={18} /> : <ArrowRight size={18} />}
            </button>
          </form>

          <div className="prism-admin-form-bottom">
            <span className="prism-admin-bottom-line" />
            <span><ShieldCheck size={12} /> AUTHORISED PERSONNEL ONLY</span>
            <span className="prism-admin-bottom-line" />
          </div>
          <p className="prism-admin-form-note">
            Having trouble accessing the console? Contact the PRISM AI technical team.
          </p>
        </div>
      </section>
    </main>
  );
}
