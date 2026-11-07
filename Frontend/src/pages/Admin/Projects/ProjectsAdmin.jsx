import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowLeft, ArrowUpRight, CalendarDays, Check, ChevronDown, CircleDot,
  Code2, Copy, ExternalLink, Eye, FileText, Globe, ImagePlus,
  Link2, ListFilter, MoreHorizontal, Pencil, Plus, Save, Search, Send,
  Sparkles, Sun, Moon, Trash2, X, FolderKanban, Clock3, Layers3,
} from "lucide-react";
import "./ProjectsAdmin.css";

const THEME_KEY = "prism-theme";
const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || "http://localhost:5000").replace(/\/$/, "");
const PROJECTS_API = `${API_BASE_URL}/api/projects`;

const projectThemes = {
  coral: { label: "Coral Bloom", accent: "#fc7782", deep: "#6e3562", surface: "#fff3f3", ink: "#2d2030" },
  berry: { label: "Berry Studio", accent: "#d66b91", deep: "#62345f", surface: "#fff3f8", ink: "#302033" },
  sunset: { label: "Soft Sunset", accent: "#f59e72", deep: "#78436a", surface: "#fff5ee", ink: "#302332" },
  orchid: { label: "Orchid", accent: "#c58ad7", deep: "#583b72", surface: "#faf4ff", ink: "#282033" },
  monochrome: { label: "Monochrome", accent: "#a8a8b8", deep: "#353548", surface: "#f5f5f8", ink: "#252535" },
};

const emptyProject = () => ({
  id: "", name: "", tagline: "", category: "AI / Machine Learning", status: "Draft",
  description: "", problemStatement: "", solution: "", impact: "", features: "",
  techStack: "", githubUrl: "", demoUrl: "", linkedinUrl: "", documentationUrl: "",
  researchPaperUrl: "", patentInfo: "", teamMembers: "", mentor: "", department: "",
  academicYear: "", startDate: "", completionDate: "", projectStage: "In progress",
  awards: "", acknowledgements: "", contactEmail: "", coverImageUrl: "", galleryUrls: "",
  tags: "", theme: "coral", featured: false, createdAt: "", updatedAt: "",
  categoryOther: "", customSections: [],
});

function formatDate(value) {
  if (!value) return "Not set";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Not set";
  return date.toLocaleString("en-IN", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });
}

function toList(value) {
  return String(value || "").split(/[\n,;]+/).map((item) => item.trim()).filter(Boolean);
}

function Field({ label, name, value, onChange, placeholder, type = "text", hint, wide = false, rows = 3 }) {
  return (
    <label className={`pa-field ${wide ? "pa-field--wide" : ""}`}>
      <span className="pa-field__label">{label}</span>
      {type === "textarea" ? (
        <textarea name={name} value={value || ""} onChange={onChange} placeholder={placeholder} rows={rows} />
      ) : (
        <input name={name} type={type} value={value || ""} onChange={onChange} placeholder={placeholder} />
      )}
      {hint && <small>{hint}</small>}
    </label>
  );
}

export default function ProjectsAdmin() {
  const navigate = useNavigate();
  const [projects, setProjects] = useState([]);
  const [loadingProjects, setLoadingProjects] = useState(true);
  const [themeMode, setThemeMode] = useState(() => localStorage.getItem(THEME_KEY) || document.documentElement.dataset.theme || "light");
  const [view, setView] = useState("list");
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(emptyProject);
  const [activeMenu, setActiveMenu] = useState(null);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [categoryFilter, setCategoryFilter] = useState("All");
  const [showPreview, setShowPreview] = useState(false);
  const [notice, setNotice] = useState("");
  const [deleteTarget, setDeleteTarget] = useState(null);
  const menuRef = useRef(null);

  const loadProjects = async (signal) => {
    setLoadingProjects(true);
    try {
      const response = await fetch(PROJECTS_API, { headers: { Accept: "application/json" }, signal });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(payload.message || `Could not load projects (${response.status}).`);
      setProjects(Array.isArray(payload.projects) ? payload.projects : []);
    } catch (error) {
      if (error.name !== "AbortError") setNotice(`Backend connection failed: ${error.message || "Unable to load projects."}`);
    } finally {
      if (!signal?.aborted) setLoadingProjects(false);
    }
  };

  useEffect(() => {
    const controller = new AbortController();
    loadProjects(controller.signal);
    return () => controller.abort();
  }, []);

  useEffect(() => {
    document.documentElement.dataset.theme = themeMode;
    localStorage.setItem(THEME_KEY, themeMode);
    window.dispatchEvent(new CustomEvent("prism-theme-change", { detail: { theme: themeMode } }));
  }, [themeMode]);

  useEffect(() => {
    const close = (event) => {
      if (event.key === "Escape") {
        setActiveMenu(null);
        setDeleteTarget(null);
        setShowPreview(false);
      }
      if (menuRef.current && !menuRef.current.contains(event.target)) setActiveMenu(null);
    };
    document.addEventListener("mousedown", close);
    document.addEventListener("keydown", close);
    return () => {
      document.removeEventListener("mousedown", close);
      document.removeEventListener("keydown", close);
    };
  }, []);

  useEffect(() => {
    if (!notice) return;
    const timer = window.setTimeout(() => setNotice(""), 3200);
    return () => window.clearTimeout(timer);
  }, [notice]);

  const categories = useMemo(() => ["All", ...new Set(projects.map((project) => project.category).filter(Boolean))], [projects]);
  const filteredProjects = useMemo(() => projects.filter((project) => {
    const haystack = [project.name, project.tagline, project.description, project.category, project.techStack, project.teamMembers].join(" ").toLowerCase();
    return haystack.includes(search.toLowerCase()) && (statusFilter === "All" || project.status === statusFilter) && (categoryFilter === "All" || project.category === categoryFilter);
  }).sort((a, b) => new Date(b.updatedAt || 0) - new Date(a.updatedAt || 0)), [projects, search, statusFilter, categoryFilter]);

  const counts = useMemo(() => ({ total: projects.length, published: projects.filter((p) => p.status === "Published").length, drafts: projects.filter((p) => p.status === "Draft").length, featured: projects.filter((p) => p.featured).length }), [projects]);

  const openCreate = () => {
    setEditing(null);
    setForm({ ...emptyProject(), id: crypto.randomUUID ? crypto.randomUUID() : `project-${Date.now()}` });
    setView("editor");
    setShowPreview(false);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const openEdit = (project) => {
    setEditing(project.id);
    const knownCategories = ["AI / Machine Learning", "Web Development", "Mobile Application", "Data Science / Analytics", "Robotics / IoT", "Cybersecurity", "Research", "Open Source", "Other"];
    const isKnownCategory = knownCategories.includes(project.category);
    setForm({ ...emptyProject(), ...project, category: isKnownCategory ? project.category : "Other", categoryOther: project.categoryOther || (!isKnownCategory ? project.category || "" : ""), customSections: Array.isArray(project.customSections) ? project.customSections : [] });
    setView("editor");
    setActiveMenu(null);
    setShowPreview(false);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleChange = (event) => {
    const { name, value, type, checked } = event.target;
    setForm((current) => ({ ...current, [name]: type === "checkbox" ? checked : value }));
  };

  const saveProject = async (status) => {
    const now = new Date().toISOString();
    const existing = projects.find((project) => project.id === form.id);
    const saved = {
      ...form,
      category: form.category === "Other" ? (form.categoryOther.trim() || "Other") : form.category,
      name: form.name.trim(),
      status,
      createdAt: existing?.createdAt || form.createdAt || now,
      updatedAt: now,
    };
    if (!saved.name) {
      setNotice("Add a project name before saving.");
      return;
    }
    try {
      const response = await fetch(PROJECTS_API, {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify(saved),
      });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(payload.message || `Save failed (${response.status}).`);
      const persisted = payload.project || saved;
      setProjects((current) => current.some((project) => project.id === persisted.id)
        ? current.map((project) => project.id === persisted.id ? persisted : project)
        : [persisted, ...current]);
      setNotice(status === "Published" ? "Project published successfully." : "Project draft saved to the backend.");
      setView("list");
      setEditing(null);
      setShowPreview(false);
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (error) {
      setNotice(`Could not save project: ${error.message || "Backend request failed."}`);
    }
  };

  const changeStatus = async (project, status) => {
    const updated = { ...project, status, updatedAt: new Date().toISOString() };
    try {
      const response = await fetch(`${PROJECTS_API}/${encodeURIComponent(project.id)}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify(updated),
      });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(payload.message || `Update failed (${response.status}).`);
      const persisted = payload.project || updated;
      setProjects((current) => current.map((item) => item.id === project.id ? persisted : item));
      setActiveMenu(null);
      setNotice(status === "Published" ? "Project published." : status === "Draft" ? "Project moved to drafts." : "Project archived.");
    } catch (error) {
      setNotice(`Could not update project: ${error.message || "Backend request failed."}`);
    }
  };

  const duplicateProject = async (project) => {
    const now = new Date().toISOString();
    const duplicate = { ...project, id: `project-${Date.now()}`, name: `${project.name} (Copy)`, status: "Draft", featured: false, createdAt: now, updatedAt: now };
    try {
      const response = await fetch(PROJECTS_API, {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify(duplicate),
      });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(payload.message || `Duplicate failed (${response.status}).`);
      setProjects((current) => [payload.project || duplicate, ...current]);
      setActiveMenu(null);
      setNotice("Project duplicated as a draft.");
    } catch (error) {
      setNotice(`Could not duplicate project: ${error.message || "Backend request failed."}`);
    }
  };

  const deleteProject = async () => {
    if (!deleteTarget) return;
    try {
      const response = await fetch(`${PROJECTS_API}/${encodeURIComponent(deleteTarget.id)}`, {
        method: "DELETE",
        headers: { Accept: "application/json" },
      });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(payload.message || `Delete failed (${response.status}).`);
      setProjects((current) => current.filter((project) => project.id !== deleteTarget.id));
      setDeleteTarget(null);
      setActiveMenu(null);
      setNotice("Project deleted from the backend.");
    } catch (error) {
      setNotice(`Could not delete project: ${error.message || "Backend request failed."}`);
    }
  };

  const renderThemeSwatches = () => (
    <div className="pa-theme-grid">
      {Object.entries(projectThemes).map(([key, palette]) => (
        <button type="button" key={key} className={`pa-theme-choice ${form.theme === key ? "is-selected" : ""}`} onClick={() => setForm((current) => ({ ...current, theme: key }))} aria-pressed={form.theme === key}>
          <span className="pa-theme-dots"><i style={{ background: palette.accent }} /><i style={{ background: palette.deep }} /><i style={{ background: palette.surface, border: "1px solid #d7d3dc" }} /></span>
          <span>{palette.label}</span>
          {form.theme === key && <Check size={15} />}
        </button>
      ))}
    </div>
  );

  const previewPalette = projectThemes[form.theme] || projectThemes.coral;

  return (
    <main className={`pa-root ${themeMode === "dark" ? "pa-dark" : "pa-light"}`}>
      <div className="pa-shell">
        <header className="pa-topbar">
          <div className="pa-topbar-left">
            <button type="button" className="pa-btn pa-btn--quiet pa-dashboard-back" onClick={() => navigate("/admin/dashboard")}><ArrowLeft size={17} /> <span>Back to dashboard</span></button>
            <div className="pa-brand"><span className="pa-brand-mark"><FolderKanban size={21} /></span><div><strong>PRISM AI</strong><small>PROJECTS MANAGEMENT</small></div></div>
          </div>
          <div className="pa-top-actions">
            <span className="pa-top-context">ADMIN WORKSPACE</span>
            <button type="button" className="pa-btn pa-btn--quiet pa-theme-toggle" onClick={() => setThemeMode((current) => current === "dark" ? "light" : "dark")}><span className="pa-btn-icon">{themeMode === "dark" ? <Sun size={17} /> : <Moon size={17} />}</span>{themeMode === "dark" ? "Light mode" : "Dark mode"}</button>
          </div>
        </header>

        {view === "list" ? (
          <>
            <section className="pa-hero">
              <div className="pa-eyebrow"><span className="pa-eyebrow-dot" /> SHOWCASE WHAT YOU BUILD</div>
              <div className="pa-hero-row"><div><h1>Projects<span>.</span></h1><p>Manage the ideas, experiments, and innovations built by the PRISM AI community.</p></div><button type="button" className="pa-btn pa-btn--primary pa-create-btn" onClick={openCreate}><Plus size={18} /> New project</button></div>
              <div className="pa-stats">
                <div className="pa-stat"><span className="pa-stat-icon"><Layers3 size={17} /></span><div><small>Total projects</small><strong>{counts.total.toString().padStart(2, "0")}</strong></div></div>
                <div className="pa-stat"><span className="pa-stat-icon"><Globe size={17} /></span><div><small>Published</small><strong>{counts.published.toString().padStart(2, "0")}</strong></div></div>
                <div className="pa-stat"><span className="pa-stat-icon"><FileText size={17} /></span><div><small>Drafts</small><strong>{counts.drafts.toString().padStart(2, "0")}</strong></div></div>
                <div className="pa-stat"><span className="pa-stat-icon"><Sparkles size={17} /></span><div><small>Featured</small><strong>{counts.featured.toString().padStart(2, "0")}</strong></div></div>
              </div>
            </section>

            {loadingProjects && <div className="pa-backend-status" role="status">Loading projects from the backend…</div>}
            <section className="pa-project-section">
              <div className="pa-section-heading"><div><span className="pa-kicker">PROJECT LIBRARY</span><h2>{projects.length ? "Your projects" : "Start your showcase"}</h2><p>{projects.length ? "Draft, publish, edit, and organize every project from one place." : "Your project library is empty for now. Create the first project and give your team's work a home."}</p></div>{projects.length > 0 && <span className="pa-total-pill">{projects.length} {projects.length === 1 ? "project" : "projects"}</span>}</div>

              {projects.length > 0 && <div className="pa-toolbar"><label className="pa-search"><Search size={17} /><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search projects, tech stack, team..." /></label><label className="pa-select-wrap"><ListFilter size={16} /><select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)}><option>All</option><option>Draft</option><option>Published</option><option>Archived</option></select><ChevronDown size={14} /></label><label className="pa-select-wrap"><select value={categoryFilter} onChange={(event) => setCategoryFilter(event.target.value)}>{categories.map((category) => <option key={category}>{category}</option>)}</select><ChevronDown size={14} /></label></div>}

              {filteredProjects.length === 0 ? (
                <div className="pa-empty"><div className="pa-empty-icon"><FolderKanban size={28} /></div><h3>{projects.length ? "No matching projects" : "No projects yet"}</h3><p>{projects.length ? "Try another search or filter, or clear the filters to see all projects." : "Once you add a project, it will appear here with its status, last edited date, and management options."}</p>{projects.length === 0 ? <button type="button" className="pa-btn pa-btn--primary" onClick={openCreate}><Plus size={17} /> Create your first project</button> : <button type="button" className="pa-btn pa-btn--secondary" onClick={() => { setSearch(""); setStatusFilter("All"); setCategoryFilter("All"); }}>Clear filters</button>}</div>
              ) : (
                <div className="pa-project-list">{filteredProjects.map((project) => {
                  const palette = projectThemes[project.theme] || projectThemes.coral;
                  return <article className="pa-project-row" key={project.id}>
                    <div className="pa-project-cover" style={{ "--project-accent": palette.accent, "--project-deep": palette.deep, "--project-surface": palette.surface }}>
                      {project.coverImageUrl ? <img src={project.coverImageUrl} alt="" onError={(event) => { event.currentTarget.style.display = "none"; }} /> : <span className="pa-cover-monogram">{(project.name || "P").slice(0, 1).toUpperCase()}</span>}
                      <span className="pa-cover-label">{project.category || "Project"}</span>
                    </div>
                    <div className="pa-project-main"><div className="pa-project-title-line"><h3>{project.name}</h3>{project.featured && <span className="pa-featured-tag"><Sparkles size={12} /> Featured</span>}</div><p className="pa-project-tagline">{project.tagline || project.description || "No short description added yet."}</p><div className="pa-project-meta"><span className={`pa-status pa-status--${String(project.status).toLowerCase()}`}><i />{project.status}</span><span><Clock3 size={13} /> Edited {formatDate(project.updatedAt)}</span><span><Code2 size={13} /> {toList(project.techStack).length ? toList(project.techStack).slice(0, 3).join(" · ") : "Tech stack not added"}</span></div></div>
                    <div className="pa-project-actions">{project.status === "Published" && project.demoUrl && <a className="pa-icon-action" href={project.demoUrl} target="_blank" rel="noreferrer" aria-label="Open live demo" title="Open live demo"><ExternalLink size={17} /></a>}<button type="button" className="pa-btn pa-btn--secondary pa-edit-btn" onClick={() => openEdit(project)}><Pencil size={15} /> Edit</button><div className="pa-menu-wrap" ref={activeMenu === project.id ? menuRef : null}><button type="button" className="pa-icon-action" aria-label={`More options for ${project.name}`} aria-expanded={activeMenu === project.id} onClick={() => setActiveMenu((current) => current === project.id ? null : project.id)}><MoreHorizontal size={19} /></button>{activeMenu === project.id && <div className="pa-menu"><button type="button" onClick={() => openEdit(project)}><Pencil size={15} /> Edit project</button><button type="button" onClick={() => duplicateProject(project)}><Copy size={15} /> Duplicate as draft</button>{project.status === "Published" ? <button type="button" onClick={() => changeStatus(project, "Draft")}><FileText size={15} /> Unpublish to draft</button> : <button type="button" onClick={() => changeStatus(project, "Published")}><Send size={15} /> Publish project</button>}{project.status === "Archived" ? <button type="button" onClick={() => changeStatus(project, "Draft")}><ArrowUpRight size={15} /> Restore to draft</button> : <button type="button" onClick={() => changeStatus(project, "Archived")}><CircleDot size={15} /> Archive project</button>}<button className="pa-menu-danger" type="button" onClick={() => { setDeleteTarget(project); setActiveMenu(null); }}><Trash2 size={15} /> Delete project</button></div>}</div></div>
                  </article>;
                })}</div>
              )}
            </section>
            <footer className="pa-footer"><span>PRISM AI · RNS INSTITUTE OF TECHNOLOGY</span><span>EXPLORE. INNOVATE. IMPACT.</span><span>PROJECTS WORKSPACE <b>✳</b></span></footer>
          </>
        ) : (
          <section className="pa-editor-page">
            <div className="pa-editor-topline"><button type="button" className="pa-back-link" onClick={() => { setView("list"); setShowPreview(false); }}><ArrowLeft size={16} /> Back to projects</button><span className="pa-kicker">{editing ? "EDIT PROJECT" : "NEW PROJECT"}</span></div>
            <div className="pa-editor-heading"><div><div className="pa-eyebrow"><span className="pa-eyebrow-dot" /> YOUR WORK, DOCUMENTED</div><h1>{editing ? "Refine your project" : "Create a project"}<span>.</span></h1><p>Fill in what you know. Optional fields can be added or updated later.</p></div><div className="pa-editor-actions"><button type="button" className="pa-btn pa-btn--secondary" onClick={() => setShowPreview(true)}><Eye size={16} /> Preview</button><button type="button" className="pa-btn pa-btn--secondary" onClick={() => saveProject("Draft")}><Save size={16} /> Save draft</button><button type="button" className="pa-btn pa-btn--primary" onClick={() => saveProject("Published")}><Send size={16} /> Publish</button></div></div>
            <div className="pa-editor-layout"><form className="pa-form" onSubmit={(event) => { event.preventDefault(); saveProject("Draft"); }}>
              <section className="pa-form-card"><div className="pa-form-card-heading"><span className="pa-step">01</span><div><h2>Project overview</h2><p>Start with the details people will see first.</p></div></div><div className="pa-form-grid"><Field label="Project name *" name="name" value={form.name} onChange={handleChange} placeholder="e.g. Campus Intelligence Assistant" /><label className="pa-field"><span className="pa-field__label">Project category</span><select name="category" value={form.category} onChange={handleChange}><option>AI / Machine Learning</option><option>Web Development</option><option>Mobile Application</option><option>Data Science / Analytics</option><option>Robotics / IoT</option><option>Cybersecurity</option><option>Research</option><option>Open Source</option><option>Other</option></select></label>{form.category === "Other" && <Field label="Enter custom category *" name="categoryOther" value={form.categoryOther} onChange={handleChange} placeholder="e.g. Healthcare technology" />}<Field label="Short tagline" name="tagline" value={form.tagline} onChange={handleChange} placeholder="One line that explains the project" wide /><Field label="Project description" name="description" value={form.description} onChange={handleChange} type="textarea" rows={5} placeholder="What does this project do? Who is it for? What makes it useful?" wide /><Field label="Problem statement" name="problemStatement" value={form.problemStatement} onChange={handleChange} type="textarea" placeholder="What problem or need are you addressing?" /><Field label="Proposed solution" name="solution" value={form.solution} onChange={handleChange} type="textarea" placeholder="How does your project solve the problem?" /><Field label="Key features" name="features" value={form.features} onChange={handleChange} type="textarea" placeholder="List important features, one per line" /><Field label="Impact / outcomes" name="impact" value={form.impact} onChange={handleChange} type="textarea" placeholder="Who benefits? What changed or could change?" /></div></section>

              <section className="pa-form-card"><div className="pa-form-card-heading"><span className="pa-step">02</span><div><h2>Technology & links</h2><p>Help visitors explore the implementation and results.</p></div></div><div className="pa-form-grid"><Field label="Tech stack" name="techStack" value={form.techStack} onChange={handleChange} type="textarea" placeholder="React, Node.js, Python, Firebase — comma or line separated" hint="Add frameworks, languages, APIs, databases, and tools." wide /><Field label="GitHub repository" name="githubUrl" value={form.githubUrl} onChange={handleChange} placeholder="https://github.com/..." type="url" /><Field label="Live demo / website" name="demoUrl" value={form.demoUrl} onChange={handleChange} placeholder="https://..." type="url" /><Field label="LinkedIn post" name="linkedinUrl" value={form.linkedinUrl} onChange={handleChange} placeholder="https://linkedin.com/posts/..." type="url" /><Field label="Documentation / project report" name="documentationUrl" value={form.documentationUrl} onChange={handleChange} placeholder="https://..." type="url" /><Field label="Research paper link" name="researchPaperUrl" value={form.researchPaperUrl} onChange={handleChange} placeholder="Optional paper or publication URL" type="url" /><Field label="Patent / IP details" name="patentInfo" value={form.patentInfo} onChange={handleChange} placeholder="Optional patent number, filing status, or note" /></div></section>

              <section className="pa-form-card"><div className="pa-form-card-heading"><span className="pa-step">03</span><div><h2>Team & timeline</h2><p>Credit contributors and add project context.</p></div></div><div className="pa-form-grid"><Field label="Team members" name="teamMembers" value={form.teamMembers} onChange={handleChange} type="textarea" placeholder="Names and roles, one per line" /><Field label="Faculty mentor / guide" name="mentor" value={form.mentor} onChange={handleChange} placeholder="Optional" /><Field label="Department / branch" name="department" value={form.department} onChange={handleChange} placeholder="e.g. CSE, ECE, interdisciplinary" /><Field label="Academic year / cohort" name="academicYear" value={form.academicYear} onChange={handleChange} placeholder="e.g. 2025–26" /><Field label="Start date" name="startDate" value={form.startDate} onChange={handleChange} type="date" /><Field label="Completion / launch date" name="completionDate" value={form.completionDate} onChange={handleChange} type="date" /><label className="pa-field"><span className="pa-field__label">Project stage</span><select name="projectStage" value={form.projectStage} onChange={handleChange}><option>Idea</option><option>In progress</option><option>Prototype</option><option>Completed</option><option>Maintained / ongoing</option></select></label><Field label="Awards / recognition" name="awards" value={form.awards} onChange={handleChange} placeholder="Optional achievements" /><Field label="Acknowledgements" name="acknowledgements" value={form.acknowledgements} onChange={handleChange} type="textarea" placeholder="Optional credits, sponsors, or collaborators" /><Field label="Contact email" name="contactEmail" value={form.contactEmail} onChange={handleChange} type="email" placeholder="Optional public contact" /></div></section>

              <section className="pa-form-card"><div className="pa-form-card-heading"><span className="pa-step">04</span><div><h2>Visuals & discovery</h2><p>Optional imagery and tags help the public listing stand out.</p></div></div><div className="pa-form-grid"><Field label="Cover image URL" name="coverImageUrl" value={form.coverImageUrl} onChange={handleChange} placeholder="https://... image URL" type="url" wide hint="Use a publicly accessible image URL. Image upload can be added later." /><Field label="Gallery image URLs" name="galleryUrls" value={form.galleryUrls} onChange={handleChange} type="textarea" placeholder="One public image URL per line" wide /><Field label="Tags / keywords" name="tags" value={form.tags} onChange={handleChange} type="textarea" placeholder="AI, sustainability, campus, open-source" wide /><label className="pa-check-field pa-field--wide"><input type="checkbox" name="featured" checked={Boolean(form.featured)} onChange={handleChange} /><span><strong>Feature this project</strong><small>Mark it as a featured project for a future public showcase.</small></span></label></div></section>

              <section className="pa-form-card pa-custom-sections-card"><div className="pa-form-card-heading"><span className="pa-step">05</span><div><h2>Additional sections</h2><p>Add any project details that do not fit the fields above. Every section is optional.</p></div><button type="button" className="pa-btn pa-btn--secondary pa-add-section" onClick={() => setForm((current) => ({ ...current, customSections: [...(current.customSections || []), { id: `section-${Date.now()}-${Math.random().toString(16).slice(2)}`, title: "", content: "" }] }))}><Plus size={15} /> Add section</button></div>{(form.customSections || []).length === 0 ? <div className="pa-no-custom-sections">No extra sections yet. Add one for things like methodology, challenges, future scope, or acknowledgements.</div> : <div className="pa-custom-sections-list">{form.customSections.map((section, index) => <div className="pa-custom-section" key={section.id}><div className="pa-custom-section-top"><span>Custom section {index + 1}</span><button type="button" className="pa-remove-section" onClick={() => setForm((current) => ({ ...current, customSections: current.customSections.filter((item) => item.id !== section.id) }))}><Trash2 size={14} /> Remove</button></div><div className="pa-form-grid"><Field label="Section heading" name={`custom-title-${section.id}`} value={section.title} onChange={(event) => setForm((current) => ({ ...current, customSections: current.customSections.map((item) => item.id === section.id ? { ...item, title: event.target.value } : item) }))} placeholder="e.g. Methodology, Future scope, Challenges" /><Field label="Section content" name={`custom-content-${section.id}`} value={section.content} onChange={(event) => setForm((current) => ({ ...current, customSections: current.customSections.map((item) => item.id === section.id ? { ...item, content: event.target.value } : item) }))} type="textarea" rows={3} placeholder="Add the details for this section..." /></div></div>)}</div>}</section>

              <section className="pa-form-card"><div className="pa-form-card-heading"><span className="pa-step">06</span><div><h2>Project card theme</h2><p>Choose a colour template for this project card. It won't recolour the whole admin page.</p></div></div>{renderThemeSwatches()}</section>
              <div className="pa-mobile-form-actions"><button type="button" className="pa-btn pa-btn--secondary" onClick={() => setShowPreview(true)}><Eye size={16} /> Preview</button><button type="button" className="pa-btn pa-btn--secondary" onClick={() => saveProject("Draft")}><Save size={16} /> Save draft</button><button type="button" className="pa-btn pa-btn--primary" onClick={() => saveProject("Published")}><Send size={16} /> Publish</button></div>
            </form>

            <aside className="pa-editor-sidebar"><div className="pa-side-card pa-preview-side"><div className="pa-side-heading"><span className="pa-kicker">LIVE CARD PREVIEW</span><Eye size={17} /></div><div className="pa-live-card" style={{ "--preview-accent": previewPalette.accent, "--preview-deep": previewPalette.deep, "--preview-surface": previewPalette.surface, "--preview-ink": previewPalette.ink }}><div className="pa-live-card-top"><span>PRISM AI · PROJECT</span><span className="pa-live-symbol">✳</span></div><h3>{form.name || "Your project name"}</h3><p>{form.tagline || form.description || "A short project summary will appear here."}</p><div className="pa-live-tech">{toList(form.techStack).slice(0, 4).map((tech) => <span key={tech}>{tech}</span>)}</div><div className="pa-live-bottom"><span>{form.category || "Project category"}</span><ArrowUpRight size={16} /></div></div>{renderThemeSwatches()}</div><div className="pa-side-card"><div className="pa-side-heading"><span className="pa-kicker">PUBLISHING CHECKLIST</span><Check size={17} /></div><ul className="pa-checklist"><li><Check size={14} /> Project name is the only required field.</li><li><Check size={14} /> Save draft to continue later.</li><li><Check size={14} /> Publish when ready for the public showcase.</li><li><Check size={14} /> You can edit, unpublish, archive, or delete later.</li></ul></div><div className="pa-side-note"><Sparkles size={18} /><div><strong>Tell the full story</strong><p>Problem, solution, tech stack, links, team, and outcomes make your project easier to understand—but you can fill them in gradually.</p></div></div></aside>
            </div>
          </section>
        )}
      </div>

      {showPreview && <div className="pa-modal-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) setShowPreview(false); }}><section className="pa-modal pa-preview-modal" role="dialog" aria-modal="true" aria-labelledby="pa-preview-title"><div className="pa-modal-header"><div><span className="pa-kicker">PUBLIC SHOWCASE PREVIEW</span><h2 id="pa-preview-title">Preview project</h2></div><button type="button" className="pa-icon-action" onClick={() => setShowPreview(false)} aria-label="Close preview"><X size={19} /></button></div><div className="pa-modal-body"><div className="pa-preview-project-card" style={{ "--preview-accent": previewPalette.accent, "--preview-deep": previewPalette.deep, "--preview-surface": previewPalette.surface, "--preview-ink": previewPalette.ink }}>{form.coverImageUrl && <img className="pa-preview-cover" src={form.coverImageUrl} alt="Project cover" onError={(event) => { event.currentTarget.style.display = "none"; }} />}<span className="pa-preview-category">{form.category || "PRISM AI PROJECT"}</span><h3>{form.name || "Your project name"}</h3>{form.tagline && <p className="pa-preview-tagline">{form.tagline}</p>}<p>{form.description || "Your project description will appear here."}</p>{form.problemStatement && <div><h4>Problem</h4><p>{form.problemStatement}</p></div>}{form.solution && <div><h4>Solution</h4><p>{form.solution}</p></div>}{form.impact && <div><h4>Impact</h4><p>{form.impact}</p></div>}{toList(form.techStack).length > 0 && <div><h4>Technology stack</h4><div className="pa-live-tech">{toList(form.techStack).map((tech) => <span key={tech}>{tech}</span>)}</div></div>}<div className="pa-preview-links">{[["GitHub", form.githubUrl], ["Live demo", form.demoUrl], ["LinkedIn", form.linkedinUrl], ["Documentation", form.documentationUrl], ["Research paper", form.researchPaperUrl]].filter(([, url]) => url).map(([label, url]) => <a key={label} href={url} target="_blank" rel="noreferrer"><Link2 size={14} />{label}<ArrowUpRight size={13} /></a>)}</div>{form.teamMembers && <div><h4>Team</h4><p>{form.teamMembers}</p></div>}{(form.customSections || []).filter((section) => section.title.trim() || section.content.trim()).map((section) => <div key={section.id}><h4>{section.title || "Additional information"}</h4><p>{section.content}</p></div>)}</div></div><div className="pa-modal-footer"><button type="button" className="pa-btn pa-btn--secondary" onClick={() => setShowPreview(false)}>Continue editing</button><button type="button" className="pa-btn pa-btn--primary" onClick={() => saveProject("Published")}><Send size={16} /> Publish project</button></div></section></div>}

      {deleteTarget && <div className="pa-modal-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) setDeleteTarget(null); }}><section className="pa-modal pa-confirm-modal" role="dialog" aria-modal="true" aria-labelledby="pa-delete-title"><div className="pa-modal-header"><div><span className="pa-kicker">DELETE PROJECT</span><h2 id="pa-delete-title">Are you sure?</h2></div><button type="button" className="pa-icon-action" onClick={() => setDeleteTarget(null)} aria-label="Close dialog"><X size={19} /></button></div><p>“{deleteTarget.name}” will be permanently removed from the shared project library. This action cannot be undone.</p><div className="pa-modal-footer"><button type="button" className="pa-btn pa-btn--secondary" onClick={() => setDeleteTarget(null)}>Cancel</button><button type="button" className="pa-btn pa-btn--danger" onClick={deleteProject}><Trash2 size={16} /> Delete project</button></div></section></div>}

      {notice && <div className="pa-toast" role="status"><Check size={17} />{notice}<button type="button" onClick={() => setNotice("")} aria-label="Dismiss notification"><X size={15} /></button></div>}
    </main>
  );
}
