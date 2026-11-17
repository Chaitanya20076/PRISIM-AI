import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Navbar from "../../components/Navbar/Navbar.jsx";
import {
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
  PlayCircle,
  RefreshCw,
  Sparkles,
  Tag,
  Users,
} from "lucide-react";
import "./AItooloftheweek.css";

const API_BASE = (
  import.meta.env.VITE_API_BASE_URL || "http://localhost:5000"
).replace(/\/$/, "");

const PUBLIC_API = `${API_BASE}/api/ai-tool-of-week/public`;

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

/* ---------------------------------------------------------------
   Spectrum Silk background: flowing spectral ribbons on a canvas.
   - ribbons twist/pinch as they travel, tinted copper → rose → violet → teal
   - they bend gently toward the cursor and drift with scroll
   - pauses automatically when the tab is hidden; static if the
     visitor prefers reduced motion
---------------------------------------------------------------- */
function PrismSilkBackground({ dark }) {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return undefined;

    const reduceMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;

    const palette = [
      [217, 130, 102], // copper
      [190, 112, 120], // rose
      [136, 116, 170], // violet
      [102, 170, 170], // teal
    ];

    const pointer = { x: -9999, y: -9999, tx: -9999, ty: -9999 };
    let w = 0;
    let h = 0;
    let mobile = false;
    let lines = [];
    let raf = 0;

    const tint = (t) => {
      const p = t * (palette.length - 1);
      const i = Math.min(Math.floor(p), palette.length - 2);
      const f = p - i;
      return palette[i].map((v, k) =>
        Math.round(v + (palette[i + 1][k] - v) * f)
      );
    };

    const build = () => {
      mobile = window.innerWidth < 700;
      const dpr = Math.min(window.devicePixelRatio || 1, mobile ? 1.5 : 2);
      w = window.innerWidth;
      h = window.innerHeight;
      canvas.width = Math.floor(w * dpr);
      canvas.height = Math.floor(h * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      const count = mobile ? 16 : 30;
      const peak = dark ? 0.46 : 0.36;

      lines = Array.from({ length: count }, (_, i) => {
        const t = i / (count - 1);
        const [r, g, b] = tint(t);
        const a = peak * (0.5 + 0.5 * Math.sin(t * Math.PI));
        const grad = ctx.createLinearGradient(0, 0, w, 0);
        grad.addColorStop(0, `rgba(${r},${g},${b},0)`);
        grad.addColorStop(0.2, `rgba(${r},${g},${b},${a})`);
        grad.addColorStop(0.8, `rgba(${r},${g},${b},${a})`);
        grad.addColorStop(1, `rgba(${r},${g},${b},0)`);
        return { t, grad, width: i % 7 === 0 ? 1.9 : 1.1 };
      });
    };

    const draw = (ms) => {
      const time = ms * 0.001;
      pointer.x += (pointer.tx - pointer.x) * 0.08;
      pointer.y += (pointer.ty - pointer.y) * 0.08;

      const scroll = Math.min(window.scrollY || 0, 2400);
      const cy = h * 0.52 - scroll * 0.08;
      const step = mobile ? 16 : 9;

      ctx.clearRect(0, 0, w, h);
      ctx.globalCompositeOperation = dark ? "lighter" : "source-over";
      ctx.lineJoin = "round";

      for (const line of lines) {
        ctx.beginPath();
        ctx.strokeStyle = line.grad;
        ctx.lineWidth = line.width;

        for (let x = 0; x <= w + step; x += step) {
          const xn = x / w;
          const twist = 0.55 + 0.45 * Math.sin(xn * 3.2 - time * 0.35);
          const spread =
            h * 0.34 * twist * (0.3 + 0.7 * Math.sin(Math.PI * Math.min(xn, 1)));

          let y =
            cy +
            (line.t - 0.5) * spread +
            Math.sin(xn * 5.5 + time * 0.6 + line.t * 2.4) * h * 0.05 +
            Math.sin(xn * 11 - time * 0.9 + line.t * 5) * h * 0.016;

          const dx = x - pointer.x;
          const dy = y - pointer.y;
          y += (pointer.y - y) * Math.exp(-(dx * dx + dy * dy) / 51200) * 0.35;

          if (x === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }
        ctx.stroke();
      }
    };

    const loop = (ms) => {
      draw(ms);
      raf = requestAnimationFrame(loop);
    };

    const onMove = (event) => {
      pointer.tx = event.clientX;
      pointer.ty = event.clientY;
      if (pointer.x < -9000) {
        pointer.x = pointer.tx;
        pointer.y = pointer.ty;
      }
    };
    const onLeave = () => {
      pointer.tx = -9999;
      pointer.ty = -9999;
      pointer.x = -9999;
      pointer.y = -9999;
    };
    let resizeRaf = 0;
    const onResize = () => {
      cancelAnimationFrame(resizeRaf);
      resizeRaf = requestAnimationFrame(() => {
        build();
        if (reduceMotion) draw(4000);
      });
    };

    build();
    if (reduceMotion) {
      draw(4000);
    } else {
      raf = requestAnimationFrame(loop);
      window.addEventListener("pointermove", onMove, { passive: true });
      document.documentElement.addEventListener("pointerleave", onLeave);
    }
    window.addEventListener("resize", onResize);

    return () => {
      cancelAnimationFrame(raf);
      cancelAnimationFrame(resizeRaf);
      window.removeEventListener("pointermove", onMove);
      document.documentElement.removeEventListener("pointerleave", onLeave);
      window.removeEventListener("resize", onResize);
    };
  }, [dark]);

  return <canvas ref={canvasRef} className="aotw-bg-canvas" />;
}

export default function AIToolOfWeek() {
  const [tool, setTool] = useState(null);

  const [theme, setTheme] = useState(
    typeof document !== "undefined"
      ? document.documentElement.dataset.theme || "light"
      : "light"
  );

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showAllDetails, setShowAllDetails] = useState(false);

  const dark = theme === "dark";

  // Follow the exact theme selected by the shared PRISM Navbar.
  // The Navbar owns theme changes; this page only mirrors them.
  useEffect(() => {
    const syncTheme = () => {
      const nextTheme = document.documentElement.dataset.theme || "light";
      setTheme(nextTheme);
    };

    syncTheme();
    window.addEventListener("prism-theme-change", syncTheme);

    const observer = new MutationObserver(syncTheme);
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["data-theme"],
    });

    return () => {
      window.removeEventListener("prism-theme-change", syncTheme);
      observer.disconnect();
    };
  }, []);

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
      "--aotw-accent": tool?.accentColor || "#E43D12",
      "--aotw-tool-surface": tool?.surfaceColor || (dark ? "#252321" : "#EBE9E1"),
      "--aotw-tool-ink": tool?.textColor || (dark ? "#F7F3ED" : "#262321"),
    }),
    [tool?.accentColor, tool?.surfaceColor, tool?.textColor, dark]
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
    <>
      {/* Navbar sits OUTSIDE <main> so page styles (font, overflow) can't alter it */}
      <Navbar />

      <main
        className={`aotw-public ${
          dark ? "aotw-public-dark" : "aotw-public-light"
        }`}
        data-theme={theme}
      >
      {/* Animated page background (decorative only) */}
      <div className="aotw-bg" aria-hidden="true">
        <div className="aotw-bg-rays" />
        <PrismSilkBackground dark={dark} />
      </div>

      <div className="aotw-public-container">
        <section className="aotw-public-hero aotw-reveal">
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
              className="aotw-featured-shell aotw-reveal"
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
                    Selected by the PRISM AI community
                  </span>
                </aside>
              </div>
            </section>

            <div className="aotw-public-content-grid aotw-reveal">
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
    </>
  );
}