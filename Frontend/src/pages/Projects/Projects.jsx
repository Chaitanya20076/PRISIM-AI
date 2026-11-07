import { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  ArrowDownRight,
  ArrowLeft,
  ArrowUpRight,
  Code2,
  ExternalLink,
  FileText,
  FolderKanban,
  Moon,
  Search,
  Sun,
  X,
  Sparkles,
  Users,
  CalendarDays,
  BookOpen,
  FlaskConical,
} from "lucide-react";
import "./Projects.css";

const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || "http://localhost:5000").replace(/\/$/, "");
const PUBLIC_PROJECTS_API = `${API_BASE_URL}/api/projects/public`;
const THEME_KEY = "prism-theme";
const LEGACY_THEME_KEYS = ["prism-dashboard-theme", "prism-projects-theme"];

function splitList(value) {
  if (Array.isArray(value)) return value.map((item) => String(item).trim()).filter(Boolean);
  if (typeof value !== "string") return [];
  return value.split(/[\n,;]/).map((item) => item.trim()).filter(Boolean);
}

function safeUrl(value) {
  if (!value || typeof value !== "string") return "";
  const trimmed = value.trim();
  try {
    const parsed = new URL(trimmed);
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
    <a
      className={`projects-link${primary ? " projects-link--primary" : ""}`}
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      onClick={(event) => event.stopPropagation()}
    >
      {Icon ? <Icon size={15} aria-hidden="true" /> : <ExternalLink size={15} aria-hidden="true" />}
      <span>{children}</span>
      <ArrowUpRight size={14} aria-hidden="true" />
    </a>
  );
}

function ProjectDetails({ project, onClose }) {
  const techStack = splitList(project.techStack);
  const features = splitList(project.features);
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
    <div className="projects-modal-backdrop" role="presentation" onMouseDown={(event) => event.target === event.currentTarget && onClose()}>
      <section className="projects-modal" role="dialog" aria-modal="true" aria-labelledby="projects-modal-title">
        <div className="projects-modal-top">
          <span className="projects-eyebrow"><Sparkles size={14} /> PRISM AI PROJECT</span>
          <button className="projects-icon-button" type="button" onClick={onClose} aria-label="Close project details"><X size={20} /></button>
        </div>
        {safeUrl(project.coverImageUrl) && <img className="projects-modal-cover" src={safeUrl(project.coverImageUrl)} alt={`${project.name} project cover`} onError={(event) => { event.currentTarget.style.display = "none"; }} />}
        <div className="projects-modal-content">
          <div className="projects-card-tags"><span className="projects-category">{project.category || "Project"}</span>{project.featured && <span className="projects-featured"><Sparkles size={12} /> Featured</span>}</div>
          <h2 id="projects-modal-title">{project.name}</h2>
          {project.tagline && <p className="projects-modal-tagline">{project.tagline}</p>}
          {project.description && <p className="projects-modal-description">{project.description}</p>}

          {project.problemStatement && <section className="projects-detail-section"><h3>The problem</h3><p>{project.problemStatement}</p></section>}
          {project.solution && <section className="projects-detail-section"><h3>Our solution</h3><p>{project.solution}</p></section>}
          {features.length > 0 && <section className="projects-detail-section"><h3>Key features</h3><ul>{features.map((feature, index) => <li key={`${feature}-${index}`}>{feature}</li>)}</ul></section>}
          {project.impact && <section className="projects-detail-section"><h3>Impact</h3><p>{project.impact}</p></section>}
          {techStack.length > 0 && <section className="projects-detail-section"><h3>Built with</h3><div className="projects-tech-list">{techStack.map((tech) => <span key={tech}>{tech}</span>)}</div></section>}
          {project.teamMembers && <section className="projects-detail-section"><h3><Users size={17} /> Project team</h3><p>{project.teamMembers}</p></section>}
          {(project.customSections || []).filter((section) => section && (section.title?.trim() || section.content?.trim())).map((section, index) => <section className="projects-detail-section" key={section.id || `${section.title}-${index}`}><h3>{section.title || "More about this project"}</h3>{section.content && <p>{section.content}</p>}</section>)}

          {links.length > 0 && <section className="projects-detail-section"><h3>Explore the project</h3><div className="projects-modal-links">{links.map((link) => <ProjectLink key={link.label} href={link.href} icon={link.icon}>{link.label}</ProjectLink>)}</div></section>}
          {project.patentInfo && <section className="projects-detail-section"><h3><FlaskConical size={17} /> Research & intellectual property</h3><p>{project.patentInfo}</p></section>}
          {formatDate(project.createdAt) && <p className="projects-modal-date"><CalendarDays size={14} /> Added {formatDate(project.createdAt)}</p>}
        </div>
      </section>
    </div>
  );
}

export default function Projects() {
  const [projects, setProjects] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [theme, setTheme] = useState(() => {
    try {
      const savedTheme =
        localStorage.getItem(THEME_KEY) ||
        localStorage.getItem(LEGACY_THEME_KEYS[0]) ||
        localStorage.getItem(LEGACY_THEME_KEYS[1]);
      return savedTheme === "dark" ? "dark" : "light";
    } catch {
      return document.documentElement.dataset.theme === "dark" ? "dark" : "light";
    }
  });
  const [selectedProject, setSelectedProject] = useState(null);

  const loadProjects = useCallback(async (signal) => {
    setLoading(true);
    setError("");
    try {
      const response = await fetch(PUBLIC_PROJECTS_API, { headers: { Accept: "application/json" }, signal });
      let payload = {};
      try { payload = await response.json(); } catch { /* handled below */ }
      if (!response.ok) throw new Error(payload.message || `Could not load projects (${response.status}).`);
      setProjects(Array.isArray(payload.projects) ? payload.projects.filter((project) => project.status === "Published") : []);
    } catch (requestError) {
      if (requestError.name !== "AbortError") {
        setError(requestError.message || "Something went wrong while loading projects.");
      }
    } finally {
      if (!signal?.aborted) setLoading(false);
    }
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    loadProjects(controller.signal);
    return () => controller.abort();
  }, [loadProjects]);

  // Keep Projects connected to the same theme preference used by the Dashboard
  // and the rest of the PRISM AI website.
  useEffect(() => {
    const applySharedTheme = (nextTheme) => {
      if (nextTheme !== "light" && nextTheme !== "dark") return;
      setTheme((current) => current === nextTheme ? current : nextTheme);
    };

    const handleThemeChange = (event) => {
      applySharedTheme(event.detail?.theme);
    };

    const handleStorageChange = (event) => {
      if (event.key === THEME_KEY || LEGACY_THEME_KEYS.includes(event.key)) {
        applySharedTheme(event.newValue === "dark" ? "dark" : "light");
      }
    };

    window.addEventListener("prism-theme-change", handleThemeChange);
    window.addEventListener("storage", handleStorageChange);

    return () => {
      window.removeEventListener("prism-theme-change", handleThemeChange);
      window.removeEventListener("storage", handleStorageChange);
    };
  }, []);

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    document.documentElement.style.colorScheme = theme;

    try {
      localStorage.setItem(THEME_KEY, theme);
      localStorage.setItem("prism-dashboard-theme", theme);
    } catch { /* Theme remains available for the current session. */ }

    window.dispatchEvent(new CustomEvent("prism-theme-change", { detail: { theme } }));
  }, [theme]);

  const filteredProjects = useMemo(() => {
    const query = search.trim().toLocaleLowerCase();
    return projects.filter((project) => String(project.name || "").toLocaleLowerCase().includes(query));
  }, [projects, search]);

  const toggleTheme = () => setTheme((current) => current === "light" ? "dark" : "light");

  return (
    <main className={`projects-page projects-page--${theme}`}>
      <div className="projects-background-orb projects-background-orb--one" aria-hidden="true" />
      <div className="projects-background-orb projects-background-orb--two" aria-hidden="true" />
      <div className="projects-shell">
        <header className="projects-header">
          <Link className="projects-brand" to="/" aria-label="PRISM AI home">
            <img
              className="projects-brand-logo"
              src={theme === "dark" ? "/images/prism-logo-dark.png" : "/images/prism-logo-light.png"}
              alt="PRISM AI Club"
            />
          </Link>

          <nav className="projects-nav" aria-label="Main navigation">
            <Link to="/">Home</Link>
            <a href="#projects-list-heading">Explore projects</a>
          </nav>

          <div className="projects-header-actions">
            <Link className="projects-dashboard-link" to="/dashboard">
              <ArrowLeft size={16} aria-hidden="true" />
              <span>Back to Dashboard</span>
            </Link>
            <button className="projects-theme-toggle" type="button" onClick={toggleTheme} aria-label={`Switch to ${theme === "light" ? "dark" : "light"} mode`} title={`Switch to ${theme === "light" ? "dark" : "light"} mode`}>
              {theme === "light" ? <Moon size={18} /> : <Sun size={18} />}
              <span>{theme === "light" ? "Dark mode" : "Light mode"}</span>
            </button>
          </div>
        </header>

        <section className="projects-hero">
          <div className="projects-hero-copy">
            <span className="projects-eyebrow"><Sparkles size={14} /> IDEAS INTO IMPACT</span>
            <h1>Ideas worth <span>building.</span></h1>
            <p>Explore the projects created by the PRISM AI community — the experiments, tools, and ideas shaping what comes next.</p>
            <div className="projects-hero-note"><span className="projects-hero-dot" /> Built by curious minds at PRISM AI</div>
          </div>
          <div className="projects-hero-art" aria-hidden="true">
            <div className="projects-art-ring projects-art-ring--outer" /><div className="projects-art-ring projects-art-ring--inner" />
            <div className="projects-art-core"><FolderKanban size={39} strokeWidth={1.5} /></div>
            <span className="projects-art-chip projects-art-chip--top"><Code2 size={15} /> Build</span>
            <span className="projects-art-chip projects-art-chip--bottom"><Sparkles size={15} /> Create</span>
          </div>
        </section>

        <section className="projects-showcase" aria-labelledby="projects-list-heading">
          <div className="projects-section-heading">
            <div><span className="projects-eyebrow">THE SHOWCASE</span><h2 id="projects-list-heading">Projects by our community</h2><p>One card per project. Search by project title to find something specific.</p></div>
            <span className="projects-count"><strong>{filteredProjects.length}</strong> {filteredProjects.length === 1 ? "project" : "projects"}</span>
          </div>

          <label className="projects-search">
            <Search size={19} aria-hidden="true" />
            <input type="search" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search project titles…" aria-label="Search project titles" />
            {search && <button type="button" onClick={() => setSearch("")} aria-label="Clear search"><X size={16} /></button>}
            <kbd>⌕</kbd>
          </label>

          {loading && <div className="projects-state"><span className="projects-spinner" /><h3>Loading projects</h3><p>Getting the latest published projects from PRISM AI.</p></div>}
          {!loading && error && <div className="projects-state projects-state--error"><div className="projects-state-icon"><FolderKanban size={25} /></div><h3>We couldn't load the projects</h3><p>{error}</p><button className="projects-retry-button" type="button" onClick={() => loadProjects()}>Try again <ArrowUpRight size={15} /></button><small>Make sure the backend is running at {API_BASE_URL}.</small></div>}
          {!loading && !error && filteredProjects.length === 0 && <div className="projects-state"><div className="projects-state-icon"><Search size={25} /></div><h3>{search ? "No matching projects" : "Projects are on the way"}</h3><p>{search ? `No project title matches “${search}”. Try a different search.` : "Published PRISM AI projects will appear here as soon as they are ready to share."}</p>{search && <button className="projects-retry-button" type="button" onClick={() => setSearch("")}>Clear search <X size={15} /></button>}</div>}

          {!loading && !error && filteredProjects.length > 0 && <div className="projects-grid">
            {filteredProjects.map((project, index) => {
              const techStack = splitList(project.techStack);
              const githubUrl = safeUrl(project.githubUrl);
              const demoUrl = safeUrl(project.demoUrl);
              const linkedinUrl = safeUrl(project.linkedinUrl);
              const documentationUrl = safeUrl(project.documentationUrl);
              return <article className="projects-card" key={project.id || `${project.name}-${index}`} style={{ "--card-index": index }}>
                <button className="projects-card-open" type="button" onClick={() => setSelectedProject(project)} aria-label={`View details for ${project.name}`}>
                  <div className="projects-card-cover">
                    {safeUrl(project.coverImageUrl) ? <img src={safeUrl(project.coverImageUrl)} alt="" loading="lazy" onError={(event) => { event.currentTarget.style.display = "none"; }} /> : <div className="projects-card-cover-art"><span className="projects-cover-orbit projects-cover-orbit--one"/><span className="projects-cover-orbit projects-cover-orbit--two"/><Code2 size={37} strokeWidth={1.5} /></div>}
                    <span className="projects-category">{project.category || "Project"}</span>
                    {project.featured && <span className="projects-featured"><Sparkles size={12} /> Featured</span>}
                    <span className="projects-card-arrow"><ArrowUpRight size={19} /></span>
                  </div>
                  <div className="projects-card-body">
                    <div className="projects-card-meta">PRISM AI <span /> {formatDate(project.createdAt) || "Community project"}</div>
                    <h3>{project.name}</h3>
                    <p className="projects-card-tagline">{project.tagline || project.description || "A project built by the PRISM AI community."}</p>
                    {techStack.length > 0 && <div className="projects-tech-list">{techStack.slice(0, 4).map((tech) => <span key={tech}>{tech}</span>)}{techStack.length > 4 && <span>+{techStack.length - 4}</span>}</div>}
                    <div className="projects-card-read-more">Explore project <ArrowDownRight size={16} /></div>
                  </div>
                </button>
                {(githubUrl || demoUrl || linkedinUrl || documentationUrl) && <div className="projects-card-links">
                  {githubUrl && <ProjectLink href={githubUrl} icon={Code2}>Code</ProjectLink>}
                  {demoUrl && <ProjectLink href={demoUrl} icon={ExternalLink} primary>Live demo</ProjectLink>}
                  {linkedinUrl && <ProjectLink href={linkedinUrl} icon={ExternalLink}>Post</ProjectLink>}
                  {documentationUrl && <ProjectLink href={documentationUrl} icon={FileText}>Docs</ProjectLink>}
                </div>}
              </article>;
            })}
          </div>}
        </section>

        <footer className="projects-footer"><span className="projects-brand-mark projects-brand-mark--small">P<span>✳</span></span><p>Curiosity starts here. <strong>Explore. Innovate. Impact.</strong></p><a href="https://www.linkedin.com/" target="_blank" rel="noopener noreferrer" aria-label="LinkedIn"><ExternalLink size={17} /></a></footer>
      </div>
      {selectedProject && <ProjectDetails project={selectedProject} onClose={() => setSelectedProject(null)} />}
    </main>
  );
}
