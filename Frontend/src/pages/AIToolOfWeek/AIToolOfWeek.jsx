
import { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  ArrowLeft,
  ArrowUpRight,
  BookOpen,
  Check,
  ChevronRight,
  CircleAlert,
  Clock3,
  Code2,
  ExternalLink,
  Flame,
  Lightbulb,
  LoaderCircle,
  Moon,
  PlayCircle,
  RefreshCw,
  Sparkles,
  Sun,
  Tag,
  Users,
} from "lucide-react";
import "./AIToolOfWeek.css";

const API_BASE = (
  import.meta.env.VITE_API_BASE_URL || "http://localhost:5000"
).replace(/\/$/, "");

const PUBLIC_API = `${API_BASE}/api/ai-tool-of-week/public`;

function getSavedTheme() {
  try {
    const theme = localStorage.getItem("prism-theme");

    if (theme === "dark" || theme === "light") {
      return theme;
    }

    const documentTheme = document.documentElement.dataset.theme;

    if (documentTheme === "dark" || documentTheme === "light") {
      return documentTheme;
    }
  } catch {
    // Use light mode if browser storage is unavailable.
  }

  return "light";
}

function applyTheme(theme) {
  document.documentElement.dataset.theme = theme;
  document.documentElement.style.colorScheme = theme;

  try {
    localStorage.setItem("prism-theme", theme);
  } catch {
    // The theme still works for the current page if storage is unavailable.
  }

  window.dispatchEvent(new CustomEvent("prism-theme-change", {
    detail: { theme },
  }));
}

function formatDate(value) {
  if (!value) return "Not available";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return "Recently";

  return date.toLocaleDateString(undefined, {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function listify(value) {
  if (Array.isArray(value)) {
    return value
      .map((item) => String(item).trim())
      .filter(Boolean);
  }

  return String(value || "")
    .split(/\n|,/)
    .map((item) => item.trim())
    .filter(Boolean);
}

function safeUrl(value) {
  if (!value || typeof value !== "string") return "";

  try {
    const url = new URL(value);

    return ["http:", "https:"].includes(url.protocol)
      ? url.href
      : "";
  } catch {
    return "";
  }
}

function ResourceLink({
  href,
  icon: Icon = ExternalLink,
  children,
}) {
  const url = safeUrl(href);

  if (!url) return null;

  return (
    <a
      className="aotw-resource-link"
      href={url}
      target="_blank"
      rel="noopener noreferrer"
    >
      <Icon size={16} aria-hidden="true" />
      <span>{children}</span>
      <ArrowUpRight
        size={14}
        className="aotw-resource-arrow"
        aria-hidden="true"
      />
    </a>
  );
}

function ContentSection({
  title,
  children,
  icon: Icon = Sparkles,
}) {
  if (!children) return null;

  return (
    <section className="aotw-content-section">
      <div className="aotw-content-section-title">
        <span>
          <Icon size={17} />
        </span>
        <h3>{title}</h3>
      </div>

      {children}
    </section>
  );
}

export default function AIToolOfWeek() {
  const [tool, setTool] = useState(null);

  const [theme, setTheme] = useState(getSavedTheme);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showAllDetails, setShowAllDetails] = useState(false);

  const dark = theme === "dark";

  // Apply the saved theme and synchronize with the rest of the website.
  useEffect(() => {
    applyTheme(theme);
  }, [theme]);

  // Follow theme changes made by another page or its theme toggle.
  useEffect(() => {
    const syncTheme = () => {
      const nextTheme = getSavedTheme();
      setTheme(nextTheme);
    };

    const handleThemeChange = (event) => {
      const nextTheme = event.detail?.theme;

      if (nextTheme === "dark" || nextTheme === "light") {
        setTheme(nextTheme);
      } else {
        syncTheme();
      }
    };

    window.addEventListener("storage", syncTheme);
    window.addEventListener("prism-theme-change", handleThemeChange);

    const observer = new MutationObserver(syncTheme);

    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["data-theme"],
    });

    return () => {
      window.removeEventListener("storage", syncTheme);
      window.removeEventListener(
        "prism-theme-change",
        handleThemeChange
      );
      observer.disconnect();
    };
  }, []);

  const toggleTheme = () => {
    const nextTheme = dark ? "light" : "dark";

    // Save immediately so the preference survives navigation.
    applyTheme(nextTheme);
    setTheme(nextTheme);
  };

  const loadTool = useCallback(async (signal) => {
    setLoading(true);
    setError("");

    try {
      const response = await fetch(PUBLIC_API, {
        headers: { Accept: "application/json" },
        signal,
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(
          data.message ||
            `Could not load the weekly tool (${response.status}).`
        );
      }

      const publishedTool =
        data.published ??
        data.tool ??
        (data.name ? data : null);

      setTool(
        publishedTool && publishedTool.status !== "archived"
          ? publishedTool
          : null
      );
    } catch (err) {
      if (err.name !== "AbortError") {
        setError(
          `${err.message} Check that the PRISM AI backend is running.`
        );
      }
    } finally {
      if (!signal?.aborted) {
        setLoading(false);
      }
    }
  }, []);

  useEffect(() => {
    const controller = new AbortController();

    loadTool(controller.signal);

    return () => controller.abort();
  }, [loadTool]);

  const themeStyle = useMemo(
    () => ({
       // The featured spotlight keeps the reference card's purple/orange identity
      // in both global themes; only the surrounding page follows the global mode.
      "--aotw-accent": "#E87900",
      "--aotw-tool-surface": "#1B1429",
      "--aotw-tool-ink": "#F7F2FF",
    }),
    []
  );

  const features = listify(tool?.keyFeatures);
  const tags = listify(tool?.tags);
  const pros = listify(tool?.pros);
  const cons = listify(tool?.cons);
  const prompts = listify(tool?.examplePrompts);

  const sections = Array.isArray(tool?.sections)
    ? tool.sections.filter(
        (section) => section.title || section.content
      )
    : [];

  const updatedAt = tool?.updatedAt || tool?.publishedAt;

  return (
    <main
      className={`aotw-public ${
        dark ? "aotw-public-dark" : "aotw-public-light"
      }`}
    >
      <div className="aotw-public-glow aotw-public-glow-one" />
      <div className="aotw-public-glow aotw-public-glow-two" />

      <header className="aotw-public-header">
        <Link className="aotw-public-brand" to="/" aria-label="PRISM AI home">
          <img
            className="aotw-public-brand-logo"
            src={dark ? "/images/prism-logo-dark.png" : "/images/prism-logo-light.png"}
            alt="PRISM AI"
          />
        </Link>

        <nav className="aotw-public-nav" aria-label="Main navigation">
          <Link to="/"></Link>
          <a href="#tool-spotlight"></a>
        </nav>

        <div className="aotw-public-header-actions">
          <Link className="aotw-public-dashboard-link" to="/dashboard">
            <ArrowLeft size={15} aria-hidden="true" />
            <span>Back to Dashboard</span>
          </Link>

          <button
            type="button"
            className="aotw-public-theme-toggle"
            onClick={toggleTheme}
            aria-label={`Switch to ${
              dark ? "light" : "dark"
            } mode`}
            title={`Switch to ${dark ? "light" : "dark"} mode`}
          >
            {dark ? (
              <Sun size={16} aria-hidden="true" />
            ) : (
              <Moon size={16} aria-hidden="true" />
            )}

            <span>{dark ? "Light mode" : "Dark mode"}</span>
          </button>
        </div>
      </header>

      <div className="aotw-public-container">
        <section className="aotw-public-hero">
          <div className="aotw-public-hero-copy">
            <div className="aotw-public-eyebrow">
              <Flame size={15} />
              ONE TOOL. EVERY WEEK.
            </div>

            <h1>
              Meet your next
              <br />
              <em>favourite AI tool.</em>
            </h1>

            <p>
              One carefully featured AI tool to help you learn faster,
              create smarter and build something meaningful.
            </p>
          </div>

          <div
            className="aotw-public-hero-art"
            aria-hidden="true"
          >
            <div className="aotw-art-orbit aotw-art-orbit-a" />
            <div className="aotw-art-orbit aotw-art-orbit-b" />

            <div className="aotw-art-core">
              <Sparkles size={38} />
            </div>

            <span className="aotw-art-chip chip-top">AI / 01</span>
            <span className="aotw-art-chip chip-bottom">
              DISCOVER
            </span>
          </div>
        </section>

        {loading ? (
          <div className="aotw-public-state">
            <LoaderCircle
              size={28}
              className="aotw-public-spin"
            />
            <h2>Finding this week's tool…</h2>
            <p>Loading the latest feature from PRISM AI.</p>
          </div>
        ) : error ? (
          <div className="aotw-public-state aotw-public-state-error">
            <span className="aotw-public-state-icon">
              <CircleAlert size={24} />
            </span>

            <h2>We couldn't load the spotlight</h2>
            <p>{error}</p>

            <button
              className="aotw-public-primary"
              onClick={() => {
                const controller = new AbortController();
                loadTool(controller.signal);
              }}
            >
              <RefreshCw size={16} />
              Try again
            </button>
          </div>
        ) : !tool ? (
          <div className="aotw-public-state">
            <span className="aotw-public-state-icon">
              <Lightbulb size={25} />
            </span>

            <span className="aotw-public-eyebrow">
              COMING SOON
            </span>

            <h2>This week's tool is on its way.</h2>

            <p>
              The PRISM AI team is preparing a new spotlight. Check
              back soon!
            </p>
          </div>
        ) : (
          <>
            <section
              id="tool-spotlight"
              className="aotw-featured-shell"
              style={themeStyle}
            >
              <div className="aotw-featured-topline">
                <span className="aotw-featured-badge">
                  <Flame size={14} />
                  THIS WEEK'S PICK
                </span>

                <span className="aotw-featured-category">
                  <Tag size={14} />
                  {tool.customCategory || tool.category || "AI Tool"}
                </span>
              </div>

              <div className="aotw-featured-main">
                <div className="aotw-featured-copy">
                  <div className="aotw-featured-title-row">
                    {safeUrl(tool.logoUrl) ? (
                      <img
                        className="aotw-featured-logo"
                        src={safeUrl(tool.logoUrl)}
                        alt={`${tool.name || "AI tool"} logo`}
                        onError={(event) => {
                          event.currentTarget.style.display = "none";
                        }}
                      />
                    ) : (
                      <div className="aotw-featured-logo-placeholder">
                        <Sparkles size={28} />
                      </div>
                    )}

                    <div>
                      <h2>
                        {tool.name || "AI Tool of the Week"}
                      </h2>

                      {tool.tagline && (
                        <p className="aotw-featured-tagline">
                          {tool.tagline}
                        </p>
                      )}
                    </div>
                  </div>

                  <p className="aotw-featured-overview">
                    {tool.overview}
                  </p>

                  {tags.length > 0 && (
                    <div className="aotw-public-tags">
                      {tags.map((tag, index) => (
                        <span key={`${tag}-${index}`}>{tag}</span>
                      ))}
                    </div>
                  )}

                  <div className="aotw-featured-actions">
                    <ResourceLink href={tool.websiteUrl}>
                      Explore the tool
                    </ResourceLink>

                    <ResourceLink
                      href={tool.documentationUrl}
                      icon={BookOpen}
                    >
                      Documentation
                    </ResourceLink>
                  </div>
                </div>

                <aside className="aotw-featured-meta">
                  <div className="aotw-meta-icon">
                    <Sparkles size={21} />
                  </div>

                  <span className="aotw-meta-label">
                    PRISM AI SPOTLIGHT
                  </span>

                  <div className="aotw-meta-divider" />

                  <div className="aotw-date-item">
                    <span>Published</span>
                    <strong>{formatDate(tool.publishedAt)}</strong>
                  </div>

                  <div className="aotw-date-item">
                    <span>Last updated</span>
                    <strong>{formatDate(updatedAt)}</strong>
                  </div>

                  <span className="aotw-meta-note">
                    <Check size={14} />
                    Curated for curious minds
                  </span>
                </aside>
              </div>
            </section>

            <div className="aotw-public-content-grid">
              <div className="aotw-public-content-main">
                {tool.whyFeatured && (
                  <ContentSection
                    title="Why we picked it"
                    icon={Sparkles}
                  >
                    <p className="aotw-public-paragraph">
                      {tool.whyFeatured}
                    </p>
                  </ContentSection>
                )}

                {features.length > 0 && (
                  <ContentSection
                    title="Key features"
                    icon={Check}
                  >
                    <ul className="aotw-feature-list">
                      {features.map((feature, index) => (
                        <li key={`${feature}-${index}`}>
                          <span>
                            <Check size={14} />
                          </span>
                          {feature}
                        </li>
                      ))}
                    </ul>
                  </ContentSection>
                )}

                {tool.howToUse && (
                  <ContentSection
                    title="How to get started"
                    icon={BookOpen}
                  >
                    <p className="aotw-public-paragraph aotw-preserve-lines">
                      {tool.howToUse}
                    </p>
                  </ContentSection>
                )}

                {prompts.length > 0 && (
                  <ContentSection
                    title="Try these prompts"
                    icon={Code2}
                  >
                    <div className="aotw-prompt-list">
                      {prompts.map((prompt, index) => (
                        <div
                          className="aotw-prompt-item"
                          key={`${prompt}-${index}`}
                        >
                          <span>
                            {String(index + 1).padStart(2, "0")}
                          </span>
                          <p>{prompt}</p>
                        </div>
                      ))}
                    </div>
                  </ContentSection>
                )}

                {sections.map((section, index) => (
                  <ContentSection
                    key={section.id || `${section.title}-${index}`}
                    title={section.title || "More about this tool"}
                  >
                    <p className="aotw-public-paragraph aotw-preserve-lines">
                      {section.content}
                    </p>
                  </ContentSection>
                ))}

                {showAllDetails && (
                  <>
                    {tool.bestFor && (
                      <ContentSection
                        title="Best for"
                        icon={Users}
                      >
                        <p className="aotw-public-paragraph aotw-preserve-lines">
                          {tool.bestFor}
                        </p>
                      </ContentSection>
                    )}

                    {tool.pricing && (
                      <ContentSection
                        title="Pricing"
                        icon={Tag}
                      >
                        <p className="aotw-public-paragraph aotw-preserve-lines">
                          {tool.pricing}
                        </p>
                      </ContentSection>
                    )}

                    {pros.length > 0 && (
                      <ContentSection
                        title="What it does well"
                        icon={Check}
                      >
                        <ul className="aotw-simple-list">
                          {pros.map((item, index) => (
                            <li key={`${item}-${index}`}>{item}</li>
                          ))}
                        </ul>
                      </ContentSection>
                    )}

                    {cons.length > 0 && (
                      <ContentSection
                        title="Things to keep in mind"
                        icon={CircleAlert}
                      >
                        <ul className="aotw-simple-list">
                          {cons.map((item, index) => (
                            <li key={`${item}-${index}`}>{item}</li>
                          ))}
                        </ul>
                      </ContentSection>
                    )}
                  </>
                )}

                {(tool.bestFor ||
                  tool.pricing ||
                  pros.length > 0 ||
                  cons.length > 0) && (
                  <button
                    className="aotw-show-details"
                    onClick={() =>
                      setShowAllDetails((value) => !value)
                    }
                  >
                    {showAllDetails
                      ? "Show less details"
                      : "More details about this tool"}

                    <ChevronRight
                      size={16}
                      className={showAllDetails ? "is-expanded" : ""}
                    />
                  </button>
                )}
              </div>

              <aside className="aotw-public-resource-panel">
                <div className="aotw-resource-panel-heading">
                  <span>
                    <ExternalLink size={17} />
                  </span>

                  <div>
                    <h3>Explore further</h3>
                    <p>Useful links to go deeper.</p>
                  </div>
                </div>

                <div className="aotw-resource-list">
                  <ResourceLink href={tool.websiteUrl}>
                    Official website
                  </ResourceLink>

                  <ResourceLink
                    href={tool.githubUrl}
                    icon={Code2}
                  >
                    GitHub / source code
                  </ResourceLink>

                  <ResourceLink
                    href={tool.documentationUrl}
                    icon={BookOpen}
                  >
                    Documentation
                  </ResourceLink>

                  <ResourceLink
                    href={tool.videoUrl}
                    icon={PlayCircle}
                  >
                    Video tutorial
                  </ResourceLink>

                  <ResourceLink
                    href={tool.newsletterUrl}
                    icon={ExternalLink}
                  >
                    Related resource
                  </ResourceLink>
                </div>

                {tool.pricing && (
                  <div className="aotw-resource-pricing">
                    <span>PRICING SNAPSHOT</span>
                    <p>{tool.pricing}</p>
                  </div>
                )}
              </aside>
            </div>
          </>
        )}

        <footer className="aotw-public-footer">
          <div>
            <span className="aotw-footer-mark">P.</span>
            <span>Explore. Innovate. Impact.</span>
          </div>

          <span>AI TOOL OF THE WEEK · PRISM AI, RNSIT</span>
        </footer>
      </div>
    </main>
  );
}
