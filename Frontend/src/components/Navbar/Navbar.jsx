import { useEffect, useState } from "react";
import {
  ArrowUpRight,
  ChevronDown,
  Menu,
  Moon,
  Sun,
  X,
  Sparkles,
} from "lucide-react";
import { Link, NavLink, useLocation } from "react-router-dom";
import "./navbar.css";

const primaryLinks = [
  { label: "Home", to: "/" },
  { label: "About", to: "/about" },
  { label: "Features", to: "/features" },
  { label: "Events", to: "/public/events" },
];

const moreLinks = [
  { label: "Privacy Policy", to: "/privacy-policy" },
  { label: "Terms and Conditions", to: "/terms-and-conditions" },
  { label: "FAQs", to: "/faqs" },
  { label: "News & Updates", to: "/news-and-updates" },
  { label: "Support", to: "/support" },
  { label: "Team", href: "http://localhost:5173/team", external: true },
];

function readInitialTheme() {
  if (typeof window === "undefined") return "light";

  try {
    const savedTheme = localStorage.getItem("prism-theme");
    const documentTheme = document.documentElement.dataset.theme;

    return savedTheme || documentTheme || "light";
  } catch {
    return document.documentElement.dataset.theme || "light";
  }
}

export default function Navbar() {
  const [theme, setTheme] = useState(readInitialTheme);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [moreOpen, setMoreOpen] = useState(false);

  const location = useLocation();

  // Apply and persist the selected theme.
  useEffect(() => {
    document.documentElement.dataset.theme = theme;

    try {
      localStorage.setItem("prism-theme", theme);
    } catch {
      // Theme remains functional for the current session.
    }

    window.dispatchEvent(
      new CustomEvent("prism-theme-change", {
        detail: { theme },
      })
    );
  }, [theme]);

  // Close menus whenever the route changes.
  useEffect(() => {
    setMobileOpen(false);
    setMoreOpen(false);
  }, [location.pathname, location.search]);

  // Close menus using Escape.
  useEffect(() => {
    const closeOnEscape = (event) => {
      if (event.key === "Escape") {
        setMobileOpen(false);
        setMoreOpen(false);
      }
    };

    window.addEventListener("keydown", closeOnEscape);

    return () => {
      window.removeEventListener("keydown", closeOnEscape);
    };
  }, []);

  // Close menus when clicking outside the navbar.
  useEffect(() => {
    if (!mobileOpen && !moreOpen) return undefined;

    const closeOnOutsideClick = (event) => {
      if (!event.target.closest?.(".prism-navbar")) {
        setMobileOpen(false);
        setMoreOpen(false);
      }
    };

    document.addEventListener("pointerdown", closeOnOutsideClick);

    return () => {
      document.removeEventListener("pointerdown", closeOnOutsideClick);
    };
  }, [mobileOpen, moreOpen]);

  const toggleTheme = () => {
    setTheme((current) => (current === "dark" ? "light" : "dark"));
  };

  const linkClass = ({ isActive }) =>
    `prism-nav-link${isActive ? " is-active" : ""}`;

  const isMoreActive = moreLinks.some(
    (item) =>
      !item.external &&
      (location.pathname === item.to ||
        location.pathname.startsWith(`${item.to}/`))
  );

  const logoSrc =
    theme === "dark"
      ? "/images/prism-logo-dark.png"
      : "/images/prism-logo-light.png";

  const renderThemeButton = (mobile = false) => (
    <button
      type="button"
      className={`prism-theme-toggle${
        mobile ? " prism-theme-toggle--mobile" : ""
      }`}
      onClick={toggleTheme}
      aria-label={`Switch to ${theme === "dark" ? "light" : "dark"} mode`}
      title={`Switch to ${theme === "dark" ? "light" : "dark"} mode`}
    >
      <span className="prism-theme-toggle__icon" aria-hidden="true">
        {theme === "dark" ? <Sun size={16} /> : <Moon size={16} />}
      </span>

      <span>
        {mobile
          ? `Switch to ${theme === "dark" ? "light" : "dark"} mode`
          : theme === "dark"
            ? "Light"
            : "Dark"}
      </span>
    </button>
  );

  const renderAdminLink = () => (
    <Link
      to="/admin"
      className="prism-navbar__admin"
      onClick={() => setMobileOpen(false)}
    >
      <Sparkles size={14} strokeWidth={1.9} />
      <span>Admin</span>
      <ArrowUpRight className="prism-action-arrow" size={14} />
    </Link>
  );

  const renderAuthLink = () => (
    <Link
      to="/login"
      className="prism-navbar__auth"
      onClick={() => setMobileOpen(false)}
    >
      <span>Login / Sign Up</span>
      <ArrowUpRight className="prism-action-arrow" size={15} />
    </Link>
  );

  return (
    <header className={`prism-navbar prism-navbar--${theme}`}>
      {/* Ambient background effects */}
      <div
        className="prism-navbar__ambient prism-navbar__ambient--one"
        aria-hidden="true"
      />
      <div
        className="prism-navbar__ambient prism-navbar__ambient--two"
        aria-hidden="true"
      />

      <div className="prism-navbar__inner">
        {/* Logo */}
        <Link
          to="/"
          className="prism-navbar__brand"
          aria-label="PRISM AI home"
          onClick={() => setMobileOpen(false)}
        >
          <img
            className="prism-navbar__logo"
            src={logoSrc}
            alt="PRISM AI Club logo"
            onError={(event) => {
              event.currentTarget.style.visibility = "hidden";
              console.error(`PRISM logo could not be loaded: ${logoSrc}`);
            }}
          />
        </Link>

        {/* Desktop Navigation */}
        <nav className="prism-navbar__links" aria-label="Main navigation">
          {primaryLinks.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === "/"}
              className={({ isActive }) =>
                `${linkClass({ isActive })}${
                  item.to === "/events" ? " prism-nav-link--events" : ""
                }`
              }
            >
              <span>{item.label}</span>
              <span className="prism-nav-link__glint" aria-hidden="true" />
            </NavLink>
          ))}

          {/* More dropdown */}
          <div className="prism-navbar__more">
            <button
              className={`prism-nav-link prism-navbar__more-trigger${
                isMoreActive ? " is-active" : ""
              }`}
              type="button"
              aria-expanded={moreOpen}
              aria-haspopup="true"
              onClick={() => setMoreOpen((open) => !open)}
            >
              <span>More</span>
              <ChevronDown size={15} strokeWidth={2} />
            </button>

            {moreOpen && (
              <div className="prism-navbar__dropdown">
                <div className="prism-navbar__dropdown-heading">
                  <span className="prism-navbar__dropdown-kicker">
                    DISCOVER
                  </span>
                  <span>More from PRISM</span>
                </div>

                {moreLinks.map((item) =>
                  item.external ? (
                    <a
                      key={item.href}
                      href={item.href}
                      className="prism-nav-link"
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={() => setMoreOpen(false)}
                    >
                      <span>{item.label}</span>
                      <ArrowUpRight size={14} strokeWidth={1.8} />
                    </a>
                  ) : (
                    <NavLink
                      key={item.to}
                      to={item.to}
                      className={linkClass}
                      onClick={() => setMoreOpen(false)}
                    >
                      <span>{item.label}</span>
                      <ArrowUpRight size={14} strokeWidth={1.8} />
                    </NavLink>
                  )
                )}
              </div>
            )}
          </div>
        </nav>

        {/* Desktop Actions */}
        <div className="prism-navbar__actions">
          {renderThemeButton()}
          {renderAdminLink()}
          {renderAuthLink()}

          {/* Mobile menu toggle */}
          <button
            type="button"
            className="prism-navbar__mobile-toggle"
            aria-label={
              mobileOpen
                ? "Close navigation menu"
                : "Open navigation menu"
            }
            aria-expanded={mobileOpen}
            onClick={() => setMobileOpen((open) => !open)}
          >
            {mobileOpen ? <X size={21} /> : <Menu size={21} />}
          </button>
        </div>
      </div>

      {/* Mobile Navigation */}
      {mobileOpen && (
        <div className="prism-navbar__mobile-panel">
          <div className="prism-navbar__mobile-topline">
            <span className="prism-navbar__mobile-eyebrow">
              EXPLORE PRISM AI
            </span>
            <span className="prism-navbar__live-dot" />
          </div>

          <nav aria-label="Mobile navigation">
            {primaryLinks.map((item, index) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.to === "/"}
                className={({ isActive }) =>
                  `${linkClass({ isActive })}${
                    item.to === "/events" ? " prism-nav-link--events" : ""
                  }`
                }
                style={{ "--nav-item-index": index }}
                onClick={() => setMobileOpen(false)}
              >
                <span>{item.label}</span>
                <ArrowUpRight size={16} strokeWidth={1.8} />
              </NavLink>
            ))}

            <div className="prism-navbar__mobile-section-label">
              Explore more
            </div>

            {moreLinks.map((item, index) =>
              item.external ? (
                <a
                  key={item.href}
                  href={item.href}
                  className="prism-nav-link"
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    "--nav-item-index": index + primaryLinks.length,
                  }}
                  onClick={() => setMobileOpen(false)}
                >
                  <span>{item.label}</span>
                  <ArrowUpRight size={16} strokeWidth={1.8} />
                </a>
              ) : (
                <NavLink
                  key={item.to}
                  to={item.to}
                  className={linkClass}
                  style={{
                    "--nav-item-index": index + primaryLinks.length,
                  }}
                  onClick={() => setMobileOpen(false)}
                >
                  <span>{item.label}</span>
                  <ArrowUpRight size={16} strokeWidth={1.8} />
                </NavLink>
              )
            )}

            {/* Mobile Actions */}
            <div className="prism-navbar__mobile-actions">
              {renderThemeButton(true)}
              {renderAdminLink()}
              {renderAuthLink()}
            </div>
          </nav>
        </div>
      )}
    </header>
  );
}
