import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ArrowUpRight,
  BookOpen,
  CalendarDays,
  Code2,
  ExternalLink,
  FileText,
  FolderKanban,
  FlaskConical,
  Search,
  Sparkles,
  Users,
  X,
} from "lucide-react";
import Navbar from "../../components/Navbar/Navbar.jsx";
import "./Projects.css";

const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || "http://localhost:5000").replace(/\/$/, "");
const PUBLIC_PROJECTS_API = `${API_BASE_URL}/api/projects/public`;

const projectPalettes = {
  coral: { accent: "#fc7782", deep: "#6e3562", surface: "#fff3f3", ink: "#2d2030" },
  berry: { accent: "#d66b91", deep: "#62345f", surface: "#fff3f8", ink: "#302033" },
  sunset: { accent: "#f59e72", deep: "#78436a", surface: "#fff5ee", ink: "#302332" },
  orchid: { accent: "#c58ad7", deep: "#583b72", surface: "#faf4ff", ink: "#282033" },
  monochrome: { accent: "#a8a8b8", deep: "#353548", surface: "#f5f5f8", ink: "#252535" },
};

function splitList(value) {
  if (Array.isArray(value)) return value.map((item) => String(item).trim()).filter(Boolean);
  if (typeof value !== "string") return [];
  return value.split(/[\n,;]+/).map((item) => item.trim()).filter(Boolean);
}

function safeUrl(value) {
  if (!value || typeof value !== "string") return "";
  try {
    const parsed = new URL(value.trim());
    return ["http:", "https:"].includes(parsed.protocol) ? parsed.href : "";
  } catch {
    return "";
  }
}

function formatDate(value) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return new Intl.DateTimeFormat("en-IN", { month: "short", year: "numeric" }).format(date);
}

function ProjectLink({ href, icon: Icon, children, primary = false }) {
  const url = safeUrl(href);
  if (!url) return null;
  return (
    <a className={`pp-link${primary ? " pp-link--primary" : ""}`} href={url} target="_blank" rel="noopener noreferrer" onClick={(event) => event.stopPropagation()}>
      {Icon ? <Icon size={15} /> : <ExternalLink size={15} />}
      <span>{children}</span>
      <ArrowUpRight size={14} />
    </a>
  );
}

function ProjectDetails({ project, onClose }) {
  const techStack = splitList(project.techStack);
  const features = splitList(project.features);
  const palette = projectPalettes[project.theme] || projectPalettes.coral;
  const links = [
    { label: "GitHub repository", href: project.githubUrl, icon: Code2 },
    { label: "Live demo / website", href: project.demoUrl, icon: ExternalLink },
    { label: "LinkedIn post", href: project.linkedinUrl, icon: ExternalLink },
    { label: "Documentation", href: project.documentationUrl, icon: FileText },
    { label: "Research paper", href: project.researchPaperUrl, icon: BookOpen },
  ].filter((item) => safeUrl(item.href));

  useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const handleKeyDown = (event) => event.key === "Escape" && onClose();
    window.addEventListener("keydown", handleKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [onClose]);

  return (
    <div className="pp-modal-backdrop" role="presentation" onMouseDown={(event) => event.target === event.currentTarget && onClose()}>
      <section className="pp-modal" role="dialog" aria-modal="true" aria-labelledby="pp-modal-title" style={{ "--project-accent": palette.accent, "--project-deep": palette.deep, "--project-surface": palette.surface, "--project-ink": palette.ink }}>
        <div className="pp-modal-top">
          <span className="pp-eyebrow"><Sparkles size={14} /> PRISM AI PROJECT</span>
          <button className="pp-icon-button" type="button" onClick={onClose} aria-label="Close project details"><X size={20} /></button>
        </div>
        {safeUrl(project.coverImageUrl) && <img className="pp-modal-cover" src={safeUrl(project.coverImageUrl)} alt={`${project.name} project cover`} onError={(event) => { event.currentTarget.style.display = "none"; }} />}
        <div className="pp-modal-content">
          <div className="pp-tags"><span className="pp-category">{project.category || "Project"}</span>{project.featured && <span className="pp-featured"><Sparkles size={12} /> Featured</span>}</div>
          <h2 id="pp-modal-title">{project.name}</h2>
          {project.tagline && <p className="pp-modal-tagline">{project.tagline}</p>}
          {project.description && <p className="pp-description">{project.description}</p>}
          {project.problemStatement && <section className="pp-detail-section"><h3>The problem</h3><p>{project.problemStatement}</p></section>}
          {project.solution && <section className="pp-detail-section"><h3>Our solution</h3><p>{project.solution}</p></section>}
          {features.length > 0 && <section className="pp-detail-section"><h3>Key features</h3><ul>{features.map((feature, index) => <li key={`${feature}-${index}`}>{feature}</li>)}</ul></section>}
          {project.impact && <section className="pp-detail-section"><h3>Impact</h3><p>{project.impact}</p></section>}
          {techStack.length > 0 && <section className="pp-detail-section"><h3>Built with</h3><div className="pp-tech-list">{techStack.map((tech) => <span key={tech}>{tech}</span>)}</div></section>}
          {project.teamMembers && <section className="pp-detail-section"><h3><Users size={17} /> Project team</h3><p>{project.teamMembers}</p></section>}
          {(Array.isArray(project.customSections) ? project.customSections : []).filter((section) => section && (section.title?.trim() || section.content?.trim())).map((section, index) => (
            <section className="pp-detail-section" key={section.id || `${section.title}-${index}`}><h3>{section.title || "More about this project"}</h3>{section.content && <p>{section.content}</p>}</section>
          ))}
          {links.length > 0 && <section className="pp-detail-section"><h3>Explore the project</h3><div className="pp-modal-links">{links.map((link) => <ProjectLink key={link.label} href={link.href} icon={link.icon}>{link.label}</ProjectLink>)}</div></section>}
          {project.patentInfo && <section className="pp-detail-section"><h3><FlaskConical size={17} /> Research & intellectual property</h3><p>{project.patentInfo}</p></section>}
          {formatDate(project.createdAt) && <p className="pp-modal-date"><CalendarDays size={14} /> Added {formatDate(project.createdAt)}</p>}
        </div>
      </section>
    </div>
  );
}


function ParticleWordCanvas({ word, theme }) {
  const canvasRef = useRef(null);
  const themeRef = useRef(theme);

  // Update particle colour without restarting the animation lifecycle.
  useEffect(() => {
    themeRef.current = theme;
  }, [theme]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return undefined;

    const ctx = canvas.getContext("2d", { alpha: true });
    if (!ctx) return undefined;

    let width = 0;
    let height = 0;
    let frame = 0;
    let animationFrame = 0;
    let particles = [];
    let targetPoints = [];
    let lastWord = word;
    let hasInitialized = false;
    let morphStart = performance.now();
    const morphDuration = 3400;
    const particleCount = 520;
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    const random = (min, max) => min + Math.random() * (max - min);

    const getPoints = (label) => {
      const offscreen = document.createElement("canvas");
      const off = offscreen.getContext("2d");
      const fontSize = Math.min(width * 0.205, height * 0.66, 154);
      offscreen.width = Math.ceil(width);
      offscreen.height = Math.ceil(height);
      off.clearRect(0, 0, width, height);
      off.textAlign = "center";
      off.textBaseline = "middle";
      off.font = `900 ${fontSize}px Manrope, Arial, sans-serif`;
      off.fillStyle = "#fff";
      off.fillText(label, width / 2, height / 2, width * 0.94);

      const pixels = off.getImageData(0, 0, offscreen.width, offscreen.height).data;
      const candidates = [];
      const step = Math.max(3, Math.round(fontSize / 36));
      for (let y = 0; y < offscreen.height; y += step) {
        for (let x = 0; x < offscreen.width; x += step) {
          if (pixels[(y * offscreen.width + x) * 4 + 3] > 100) {
            candidates.push({ x, y });
          }
        }
      }
      // Evenly distribute target samples across the glyph silhouette.
      const points = [];
      for (let i = 0; i < particleCount; i += 1) {
        points.push(candidates.length
          ? { ...candidates[Math.floor((i / particleCount) * candidates.length)] }
          : { x: random(0, width), y: random(0, height) });
      }
      return points;
    };

    const resize = () => {
      const rect = canvas.getBoundingClientRect();
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      width = Math.max(1, rect.width);
      height = Math.max(1, rect.height);
      canvas.width = Math.round(width * dpr);
      canvas.height = Math.round(height * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      targetPoints = getPoints(lastWord);

      if (!hasInitialized) {
        particles = targetPoints.map((target, index) => ({
          x: random(0, width),
          y: random(0, height),
          originX: target.x,
          originY: target.y,
          targetX: target.x,
          targetY: target.y,
          drift: random(0.5, 1.5),
          phase: random(0, Math.PI * 2),
          size: random(1.05, 2.25),
          index,
        }));
        morphStart = performance.now() - morphDuration;
        hasInitialized = true;
      } else {
        // Preserve the current particle formation across responsive resizes.
        const oldWidth = particles._canvasWidth || width;
        const oldHeight = particles._canvasHeight || height;
        const scaleX = width / Math.max(1, oldWidth);
        const scaleY = height / Math.max(1, oldHeight);
        particles.forEach((particle, index) => {
          particle.x *= scaleX;
          particle.y *= scaleY;
          particle.originX *= scaleX;
          particle.originY *= scaleY;
          particle.targetX = targetPoints[index].x;
          particle.targetY = targetPoints[index].y;
        });
        // Keep the same current morph progress and destination.
        particles._canvasWidth = width;
        particles._canvasHeight = height;
      }
      particles._canvasWidth = width;
      particles._canvasHeight = height;
    };

    const beginMorph = (nextWord) => {
      const nextTargets = getPoints(nextWord);
      particles.forEach((particle, index) => {
        particle.originX = particle.x;
        particle.originY = particle.y;
        particle.targetX = nextTargets[index].x;
        particle.targetY = nextTargets[index].y;
      });
      morphStart = performance.now();
      lastWord = nextWord;
    };

    const draw = (now) => {
      ctx.clearRect(0, 0, width, height);
      const elapsed = now - morphStart;
      const progress = reduceMotion ? 1 : Math.min(1, elapsed / morphDuration);
      const eased = 1 - Math.pow(1 - progress, 4);
      const isLight = themeRef.current === "light";
      const baseColor = isLight ? [190, 104, 80] : [231, 153, 126];

      particles.forEach((particle) => {
        const floatX = reduceMotion ? 0 : Math.sin(now / 1700 + particle.phase) * 2.8 * particle.drift;
        const floatY = reduceMotion ? 0 : Math.cos(now / 1900 + particle.phase) * 2.2 * particle.drift;
        const x = particle.originX + (particle.targetX - particle.originX) * eased + floatX;
        const y = particle.originY + (particle.targetY - particle.originY) * eased + floatY;
        particle.x = x;
        particle.y = y;

        const shimmer = 0.72 + (Math.sin(now / 900 + particle.phase) + 1) * 0.14;
        const alpha = Math.min(1, shimmer + (progress < 1 ? 0.08 : 0));
        ctx.beginPath();
        ctx.fillStyle = `rgba(${baseColor[0]},${baseColor[1]},${baseColor[2]},${alpha})`;
        ctx.shadowBlur = isLight ? 7 : 11;
        ctx.shadowColor = isLight ? "rgba(190,104,80,.42)" : "rgba(231,153,126,.62)";
        ctx.arc(x, y, particle.size, 0, Math.PI * 2);
        ctx.fill();
      });
      ctx.shadowBlur = 0;
      animationFrame = requestAnimationFrame(draw);
    };

    const resizeObserver = new ResizeObserver(resize);
    resizeObserver.observe(canvas);
    resize();
    animationFrame = requestAnimationFrame(draw);

    const wordInterval = window.setInterval(() => {
      const words = ["PROJECT", "CREATE", "IMAGINE", "INNOVATE"];
      const next = words[(words.indexOf(lastWord) + 1) % words.length];
      beginMorph(next);
    }, 8500);

    return () => {
      cancelAnimationFrame(animationFrame);
      clearInterval(wordInterval);
      resizeObserver.disconnect();
    };
  }, []);

  useEffect(() => {
    // Trigger a real particle-to-particle morph when the requested word changes.
    const canvas = canvasRef.current;
    if (!canvas) return;
    canvas.dataset.word = word;
  }, [word]);

  return <canvas ref={canvasRef} className="pp-particle-canvas" aria-label={`Animated particles forming ${word}`} />;
}

export default function PublicProjects() {
  const [projects, setProjects] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedProject, setSelectedProject] = useState(null);
  const [heroWord, setHeroWord] = useState(0);
  const [pageTheme, setPageTheme] = useState(
    typeof document !== "undefined"
      ? document.documentElement.dataset.theme || "light"
      : "light"
  );

  const heroWords = ["building.", "creating.", "innovating.", "reimagining."];

  // Follow the exact theme selected by the shared PRISM navbar.
  useEffect(() => {
    const syncTheme = () => {
      const nextTheme = document.documentElement.dataset.theme || "light";
      setPageTheme(nextTheme);
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

  useEffect(() => {
    const interval = window.setInterval(() => {
      setHeroWord((current) => (current + 1) % heroWords.length);
    }, 5200);
    return () => window.clearInterval(interval);
  }, []);

  const loadProjects = useCallback(async (signal) => {
    setLoading(true);
    setError("");
    try {
      const response = await fetch(PUBLIC_PROJECTS_API, { headers: { Accept: "application/json" }, signal });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(payload.message || `Could not load projects (${response.status}).`);
      setProjects(Array.isArray(payload.projects) ? payload.projects.filter((project) => project.status === "Published") : []);
    } catch (requestError) {
      if (requestError.name !== "AbortError") setError(requestError.message || "Something went wrong while loading projects.");
    } finally {
      if (!signal?.aborted) setLoading(false);
    }
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    loadProjects(controller.signal);
    return () => controller.abort();
  }, [loadProjects]);

  const filteredProjects = useMemo(() => {
    const query = search.trim().toLocaleLowerCase();
    return projects.filter((project) => {
      const searchable = [project.name, project.tagline, project.category, project.description, project.techStack, project.teamMembers].join(" ").toLocaleLowerCase();
      return searchable.includes(query);
    });
  }, [projects, search]);

  return (
    <main className={`pp-page pp-page--${pageTheme}`} data-theme={pageTheme}>
      <Navbar />
      <div className="pp-orb pp-orb--one" aria-hidden="true" />
      <div className="pp-orb pp-orb--two" aria-hidden="true" />
      <div className="pp-shell">
        <section className="pp-hero">
          <div className="pp-project-particle-word" aria-hidden="true">
            <ParticleWordCanvas word="PROJECT" theme={pageTheme} />
            <i className="pp-particle pp-particle--1" />
            <i className="pp-particle pp-particle--2" />
            <i className="pp-particle pp-particle--3" />
            <i className="pp-particle pp-particle--4" />
            <i className="pp-particle pp-particle--5" />
            <i className="pp-particle pp-particle--6" />
            <i className="pp-particle pp-particle--7" />
            <i className="pp-particle pp-particle--8" />
            <i className="pp-particle pp-particle--9" />
            <i className="pp-particle pp-particle--10" />
            <i className="pp-particle pp-particle--11" />
            <i className="pp-particle pp-particle--12" />
            <i className="pp-particle pp-particle--13" />
            <i className="pp-particle pp-particle--14" />
            <i className="pp-particle pp-particle--15" />
            <i className="pp-particle pp-particle--16" />
          </div>
          <div className="pp-hero-copy">
            <span className="pp-eyebrow"><span className="pp-eyebrow-line" /> THE PRISM SHOWCASE</span>
            <h1>Discover what we're <span className="pp-changing-word" key={heroWord}>{heroWords[heroWord]}</span></h1>
            <p>Explore the ideas, research and innovations created by the PRISM AI community — from early experiments to real-world solutions.</p>
            <div className="pp-hero-note"><span /> Student innovation. Real-world impact.</div>
          </div>
        </section>
        <div className="pp-live-row">
          <div className="pp-live-pill"><i /> Live project showcase <span /> {projects.length} published</div>
        </div>

        <section className="pp-showcase" aria-labelledby="pp-list-heading">
          <div className="pp-section-heading">
            <div><span className="pp-eyebrow">DISCOVER WHAT WE BUILD</span><h2 id="pp-list-heading">Projects by our community</h2><p>Explore ideas, technology and solutions built by PRISM AI members.</p></div>
            <span className="pp-count"><strong>{filteredProjects.length}</strong> {filteredProjects.length === 1 ? "project" : "projects"}</span>
          </div>

          <label className="pp-search">
            <Search size={19} aria-hidden="true" />
            <input type="search" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search projects, technologies..." aria-label="Search projects" />
            {search && <button type="button" onClick={() => setSearch("")} aria-label="Clear search"><X size={16} /></button>}
          </label>

          {loading && <div className="pp-state"><span className="pp-spinner" /><h3>Loading projects</h3><p>Fetching the latest published projects from PRISM AI.</p></div>}
          {!loading && error && <div className="pp-state pp-state--error"><div className="pp-state-icon"><FolderKanban size={25} /></div><h3>We couldn't load the projects</h3><p>{error}</p><button className="pp-retry" type="button" onClick={() => loadProjects()}>Try again <ArrowUpRight size={15} /></button><small>Check that the backend is running at {API_BASE_URL}.</small></div>}
          {!loading && !error && filteredProjects.length === 0 && <div className="pp-state"><div className="pp-state-icon"><Search size={25} /></div><h3>{search ? "No matching projects" : "Projects are on the way"}</h3><p>{search ? `No projects match “${search}”. Try another search.` : "Published PRISM AI projects will appear here as soon as they are ready to share."}</p>{search && <button className="pp-retry" type="button" onClick={() => setSearch("")}>Clear search <X size={15} /></button>}</div>}

          {!loading && !error && filteredProjects.length > 0 && (
            <div className="pp-grid">
              {filteredProjects.map((project, index) => {
                const palette = projectPalettes[project.theme] || projectPalettes.coral;
                const techStack = splitList(project.techStack);
                return (
                  <article className="pp-card" key={project.id || `${project.name}-${index}`} style={{ "--project-accent": palette.accent, "--project-deep": palette.deep, "--project-surface": palette.surface, "--project-ink": palette.ink, "--card-index": index }}>
                    <button className="pp-card-open" type="button" onClick={() => setSelectedProject(project)} aria-label={`View details for ${project.name}`}>
                      <div className="pp-cover">
                        {safeUrl(project.coverImageUrl) ? <img src={safeUrl(project.coverImageUrl)} alt="" loading="lazy" onError={(event) => { event.currentTarget.style.display = "none"; }} /> : <div className="pp-cover-art"><span className="pp-orbit pp-orbit--one" /><span className="pp-orbit pp-orbit--two" /><Code2 size={38} strokeWidth={1.5} /></div>}
                        <span className="pp-category">{project.category || "Project"}</span>
                        {project.featured && <span className="pp-featured"><Sparkles size={12} /> Featured</span>}
                        <span className="pp-card-arrow"><ArrowUpRight size={19} /></span>
                      </div>
                      <div className="pp-card-body">
                        <div className="pp-card-meta">PRISM AI <span /> {formatDate(project.createdAt) || "Community project"}</div>
                        <h3>{project.name}</h3>
                        <p className="pp-tagline">{project.tagline || project.description || "A project built by the PRISM AI community."}</p>
                        {techStack.length > 0 && <div className="pp-tech-list">{techStack.slice(0, 4).map((tech) => <span key={tech}>{tech}</span>)}{techStack.length > 4 && <span>+{techStack.length - 4}</span>}</div>}
                        <div className="pp-read-more">Explore project <ArrowUpRight size={16} /></div>
                      </div>
                    </button>
                    <div className="pp-card-links">
                      {safeUrl(project.githubUrl) && <ProjectLink href={project.githubUrl} icon={Code2}>Code</ProjectLink>}
                      {safeUrl(project.demoUrl) && <ProjectLink href={project.demoUrl} icon={ExternalLink} primary>Live demo</ProjectLink>}
                      {safeUrl(project.linkedinUrl) && <ProjectLink href={project.linkedinUrl} icon={ExternalLink}>Post</ProjectLink>}
                      {safeUrl(project.documentationUrl) && <ProjectLink href={project.documentationUrl} icon={FileText}>Docs</ProjectLink>}
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </section>

        <footer className="pp-footer"><span className="pp-footer-mark">P<span>✳</span></span><p>Curiosity starts here. <strong>Explore. Innovate. Impact.</strong></p><span>PRISM AI · RNSIT</span></footer>
      </div>
      {selectedProject && <ProjectDetails project={selectedProject} onClose={() => setSelectedProject(null)} />}
    </main>
  );
}
