import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  ArrowRight,
  CalendarDays,
  Check,
  ChevronDown,
  CircleHelp,
  ClipboardList,
  Copy,
  ExternalLink,
  Eye,
  FileText,
  Flag,
  LayoutDashboard,
  Megaphone,
  Moon,
  Plus,
  Save,
  Settings2,
  ShieldCheck,
  Sparkles,
  Sun,
  Trash2,
  Trophy,
  Users,
  X,
} from "lucide-react";
import "./hackathon-admin.css";

const API_URL = import.meta.env.VITE_API_URL || import.meta.env.VITE_API_BASE_URL || "http://localhost:5000";
const ADMIN_EVENTS_ENDPOINT = `${API_URL}/api/admin/events`;
const TABS = [
  { id: "overview", label: "Overview", icon: LayoutDashboard },
  { id: "themes", label: "Themes & tracks", icon: Sparkles },
  { id: "registration", label: "Registration form", icon: ClipboardList },
  { id: "submissions", label: "Submissions", icon: FileText },
  { id: "timeline", label: "Timeline & updates", icon: CalendarDays },
  { id: "judging", label: "Judging & prizes", icon: Trophy },
  { id: "settings", label: "Publish & settings", icon: Settings2 },
];

const makeField = (label = "New question") => ({
  id: crypto.randomUUID(), label, type: "text", required: true, options: "", helpText: ""
});
const makeTheme = () => ({
  id: crypto.randomUUID(), name: "", shortCode: "", description: "", problemStatement: "",
  expectedOutcome: "", constraints: "", suggestedTech: "", evaluationNotes: ""
});
const makeMilestone = () => ({ id: crypto.randomUUID(), title: "", date: "", time: "", description: "", type: "deadline" });
const makeAnnouncement = () => ({ id: crypto.randomUUID(), title: "", body: "", date: new Date().toISOString().slice(0, 16), pinned: false });

const blankHackathon = () => ({
  id: crypto.randomUUID(), name: "", slug: "", edition: "", tagline: "", shortDescription: "", description: "",
  organizer: "PRISM AI", contactEmail: "", website: "", coverImageUrl: "", logoUrl: "", mode: "Hybrid",
  venue: "", timezone: "Asia/Kolkata", startDate: "", endDate: "", registrationOpens: "", registrationCloses: "",
  themeReleaseDate: "", submissionOpens: "", submissionCloses: "", resultDate: "", status: "Draft", visibility: "Public",
  fee: "Free", eligibility: "Open to college students", eligibleCourses: "", eligibleYears: "Any year", collegePolicy: "Any college",
  teamMode: "Team or solo", minTeamSize: 1, maxTeamSize: 4, allowCrossCollege: true, requireApproval: false, waitlistEnabled: false,
  registrationFields: [
    { id: "full-name", label: "Full name", type: "text", required: true, options: "", helpText: "As on your college ID" },
    { id: "email", label: "Email address", type: "email", required: true, options: "", helpText: "Use an email you check regularly" },
    { id: "college", label: "College / institution", type: "text", required: true, options: "", helpText: "" },
    { id: "course-year", label: "Course and year", type: "text", required: true, options: "", helpText: "Example: CSE, 2nd year" },
    { id: "phone", label: "Phone number", type: "tel", required: true, options: "", helpText: "" },
  ],
  themes: [makeTheme()],
  submission: {
    allowedCount: 1, allowEdits: true, lateSubmissions: false, publicShowcase: true,
    requiredItems: ["projectTitle", "abstract", "theme", "solution", "github", "demo"],
    customQuestions: [], instructions: "Explain the problem, your solution, how it works and what makes it useful.",
    maxFileSizeMb: 20, allowedFileTypes: "PDF, PPTX, ZIP", maxTeamMembers: 4
  },
  milestones: [
    { id: crypto.randomUUID(), title: "Registration opens", date: "", time: "", description: "", type: "registration" },
    { id: crypto.randomUUID(), title: "Themes announced", date: "", time: "", description: "", type: "announcement" },
    { id: crypto.randomUUID(), title: "Submission deadline", date: "", time: "", description: "", type: "deadline" },
    { id: crypto.randomUUID(), title: "Results announced", date: "", time: "", description: "", type: "results" },
  ],
  announcements: [],
  judging: {
    rounds: [{ id: crypto.randomUUID(), name: "Initial review", description: "Review of submitted ideas and prototypes", date: "" }],
    criteria: [
      { id: crypto.randomUUID(), name: "Innovation", weight: 25 },
      { id: crypto.randomUUID(), name: "Technical execution", weight: 25 },
      { id: crypto.randomUUID(), name: "Impact and usefulness", weight: 25 },
      { id: crypto.randomUUID(), name: "Presentation", weight: 25 },
    ],
    prizes: [{ id: crypto.randomUUID(), place: "Winner", title: "First prize", value: "", description: "" }],
    judges: "", feedbackVisible: true, shortlistEnabled: true
  },
  rules: "", codeOfConduct: "", faq: [], resources: [], sponsors: [], createdAt: new Date().toISOString(), updatedAt: new Date().toISOString()
});

function getAdminToken() {
  return sessionStorage.getItem("prism-admin-token");
}

async function adminRequest(path = "", options = {}) {
  const token = getAdminToken();

  if (!token) {
    throw new Error("Your admin session has expired. Please sign in again.");
  }

  const response = await fetch(`${ADMIN_EVENTS_ENDPOINT}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
      ...(options.headers || {}),
    },
  });

  const data = await response.json().catch(() => ({}));

  if (response.status === 401 || response.status === 403) {
    sessionStorage.removeItem("prism-admin-token");
    window.location.assign("/admin");
    throw new Error("Your admin session has expired. Please sign in again.");
  }

  if (!response.ok || data.success === false) {
    throw new Error(data.message || "The request could not be completed.");
  }

  return data;
}

function normalizeHackathon(item = {}) {
  return {
    ...blankHackathon(),
    ...item,
    id: item.id,
    themes: Array.isArray(item.themes) ? item.themes : [],
    registrationFields: Array.isArray(item.registrationFields) ? item.registrationFields : [],
    milestones: Array.isArray(item.milestones) ? item.milestones : [],
    announcements: Array.isArray(item.announcements) ? item.announcements : [],
    faq: Array.isArray(item.faq) ? item.faq : [],
    resources: Array.isArray(item.resources) ? item.resources : [],
    sponsors: Array.isArray(item.sponsors) ? item.sponsors : [],
    submission: {
      ...blankHackathon().submission,
      ...(item.submission || {}),
      requiredItems: Array.isArray(item.submission?.requiredItems)
        ? item.submission.requiredItems
        : blankHackathon().submission.requiredItems,
      customQuestions: Array.isArray(item.submission?.customQuestions)
        ? item.submission.customQuestions
        : [],
    },
    judging: {
      ...blankHackathon().judging,
      ...(item.judging || {}),
      rounds: Array.isArray(item.judging?.rounds) ? item.judging.rounds : [],
      criteria: Array.isArray(item.judging?.criteria) ? item.judging.criteria : [],
      prizes: Array.isArray(item.judging?.prizes) ? item.judging.prizes : [],
    },
  };
}

function slugify(value) {
  return value.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}
function formatDate(value) {
  if (!value) return "Not set";
  return new Date(`${value}T12:00:00`).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
}
function statusClass(status) { return `ha-status ha-status-${slugify(status || "draft")}`; }

export default function HackathonAdmin() {
  const navigate = useNavigate();
  const [theme, setTheme] = useState(() => {
  try {
    return localStorage.getItem("prism-theme") === "dark"
      ? "dark"
      : "light";
  } catch {
    return "light";
  }
});

useEffect(() => {
  try {
    localStorage.setItem("prism-theme", theme);
  } catch {
    // The selected theme still applies for this page.
  }
}, [theme]);

const toggleTheme = () => {
  setTheme((current) => (current === "dark" ? "light" : "dark"));
};
  const [hackathons, setHackathons] = useState([]);
  const [activeId, setActiveId] = useState(null);
  const [draft, setDraft] = useState(null);
  const [tab, setTab] = useState("overview");
  const [view, setView] = useState("list");
  const [search, setSearch] = useState("");
  const [checking, setChecking] = useState(true);
  const [authorized, setAuthorized] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const controller = new AbortController();
    async function verify() {
      const token = sessionStorage.getItem("prism-admin-token");
      if (!token) { navigate("/admin", { replace: true }); return; }
      try {
        const response = await fetch(`${API_URL}/api/admin/verify`, {
          headers: { Authorization: `Bearer ${token}` }, signal: controller.signal
        });
        if (!response.ok) {
          sessionStorage.removeItem("prism-admin-token");
          navigate("/admin", { replace: true });
          return;
        }
        setAuthorized(true);
      } catch {
        if (!controller.signal.aborted) setError("Could not verify admin access. Check that the backend is running.");
      } finally { if (!controller.signal.aborted) setChecking(false); }
    }
    verify();
    return () => controller.abort();
  }, [navigate]);

  useEffect(() => {
    if (!authorized) return;

    let cancelled = false;

    async function loadHackathons() {
      try {
        const data = await adminRequest("");
        if (cancelled) return;

        const items = Array.isArray(data.events) ? data.events : [];
        setHackathons(
          items
            .filter((item) => String(item.type || item.category || item.customCategory || "").toLowerCase() === "hackathon")
            .map(normalizeHackathon)
        );
      } catch (requestError) {
        if (!cancelled) setError(requestError.message || "Failed to load hackathons from Firestore.");
      }
    }

    loadHackathons();
    return () => { cancelled = true; };
  }, [authorized]);

  const current = draft;
  const filtered = useMemo(() => hackathons.filter((h) => `${h.name} ${h.status} ${h.slug}`.toLowerCase().includes(search.toLowerCase())), [hackathons, search]);
  const update = (path, value) => {
    setDraft((old) => {
      const next = structuredClone(old);
      const keys = path.split(".");
      let node = next;
      for (let i = 0; i < keys.length - 1; i += 1) node = node[keys[i]];
      node[keys[keys.length - 1]] = value;
      if (path === "name" && (!next.slug || next.slug === slugify(old.name))) next.slug = slugify(value);
      return next;
    });
    setError("");
  };
  const updateItem = (path, index, key, value) => {
    setDraft((old) => {
      const next = structuredClone(old);
      const list = path.split(".").reduce((acc, part) => acc[part], next);
      list[index][key] = value;
      return next;
    });
  };
  const addItem = (path, item) => update(path, [...path.split(".").reduce((acc, part) => acc[part], current), item]);
  const removeItem = (path, index) => update(path, path.split(".").reduce((acc, part) => acc[part], current).filter((_, i) => i !== index));

  const createNew = () => {
    setActiveId(null); setDraft(blankHackathon()); setTab("overview"); setView("editor"); setError(""); setNotice("");
  };
  const editHackathon = (item) => {
    setActiveId(item.id); setDraft(normalizeHackathon(item)); setTab("overview"); setView("editor"); setError(""); setNotice("");
  };
  const saveDraft = async (nextStatus) => {
    if (!current?.name.trim()) {
      setTab("overview");
      setError("Add a hackathon name before saving.");
      return;
    }
    if (!current.slug.trim()) {
      setTab("overview");
      setError("Add a public URL slug before saving.");
      return;
    }

    const duplicate = hackathons.some(
      (h) => h.slug === current.slug && h.id !== activeId
    );
    if (duplicate) {
      setTab("overview");
      setError("That URL slug is already used. Choose a unique slug.");
      return;
    }

    setSaving(true);
    setError("");
    setNotice("");

    try {
      const saved = {
        ...structuredClone(current),
        id: activeId || current.id || crypto.randomUUID(),
        title: current.name.trim(),
        name: current.name.trim(),
        type: "Hackathon",
        category: "Hackathon",
        customCategory: "Hackathon",
        status: nextStatus || current.status,
        updatedAt: new Date().toISOString(),
      };

      const data = activeId
        ? await adminRequest(`/${encodeURIComponent(activeId)}`, {
            method: "PUT",
            body: JSON.stringify(saved),
          })
        : await adminRequest("", {
            method: "POST",
            body: JSON.stringify(saved),
          });

      const persisted = normalizeHackathon(data.event || saved);
      setHackathons((old) =>
        activeId
          ? old.map((item) => item.id === activeId ? persisted : item)
          : [persisted, ...old]
      );
      setActiveId(persisted.id);
      setDraft(structuredClone(persisted));
      setNotice(
        nextStatus === "Published"
          ? "Hackathon published and saved to Firestore."
          : "Hackathon saved to Firestore."
      );
    } catch (requestError) {
      setError(requestError.message || "Could not save this hackathon to Firestore.");
    } finally {
      setSaving(false);
    }
  };

  const deleteHackathon = async (item) => {
    if (!window.confirm(`Delete "${item.name}" from Firestore? This action cannot be undone.`)) return;

    try {
      await adminRequest(`/${encodeURIComponent(item.id)}`, {
        method: "DELETE",
      });

      setHackathons((old) => old.filter((h) => h.id !== item.id));
      if (activeId === item.id) {
        setDraft(null);
        setActiveId(null);
        setView("list");
      }
      setNotice("Hackathon deleted from Firestore.");
      setError("");
    } catch (requestError) {
      setError(requestError.message || "Could not delete this hackathon.");
    }
  };
  const logout = () => { sessionStorage.removeItem("prism-admin-token"); navigate("/admin", { replace: true }); };

  if (checking) return (
    <main className={`ha-page ha-theme-${theme}`}>
      <div className="ha-centered"><ShieldCheck size={30}/><h2>Verifying admin access</h2><p>Please wait a moment.</p></div>
    </main>
  );
  if (!authorized) return (
    <main className={`ha-page ha-theme-${theme}`}>
      <div className="ha-centered"><ShieldCheck size={30}/><h2>Admin access unavailable</h2><p>{error || "Please sign in again."}</p><button className="ha-button ha-button-dark" onClick={logout}>Back to sign in <ArrowRight size={16}/></button></div>
    </main>
  );

  return (
    <main className={`ha-page ha-theme-${theme}`}>
      <header className="ha-topbar">
        <button className="ha-back" onClick={() => navigate("/admin/dashboard")}><ArrowLeft size={17}/> Admin workspace</button>
        <div className="ha-brand"><span className="ha-brand-mark">P<span>.</span></span><span><strong>PRISM AI</strong><small>HACKATHON CONTROL ROOM</small></span></div>
        <div className="ha-topbar-actions">
          <button
            type="button"
            className="ha-theme-toggle"
            onClick={toggleTheme}
            aria-label={`Switch to ${theme === "dark" ? "light" : "dark"} mode`}
            title={`Switch to ${theme === "dark" ? "light" : "dark"} mode`}
          >
            {theme === "dark" ? <Sun size={17} /> : <Moon size={17} />}
            <span>{theme === "dark" ? "Light mode" : "Dark mode"}</span>
          </button>
          <button className="ha-signout" onClick={logout}>Sign out</button>
        </div>
      </header>

      <div className="ha-shell">
        {notice && <div className="ha-notice" role="status"><Check size={17}/><span>{notice}</span><button onClick={() => setNotice("")} aria-label="Dismiss"><X size={16}/></button></div>}
        {error && <div className="ha-error" role="alert"><span>{error}</span><button onClick={() => setError("")} aria-label="Dismiss"><X size={16}/></button></div>}

        {view === "list" ? (
          <>
            <section className="ha-intro">
              <div><div className="ha-eyebrow"><Sparkles size={14}/> HACKATHONS / ORGANIZER STUDIO</div><h1>Build the challenge.<br/><em>Run the entire journey.</em></h1><p>Create a hackathon page, release themes, configure a unique registration form, set submission rules and publish updates — from one workspace.</p></div>
              <button className="ha-button ha-button-dark ha-create" onClick={createNew}><Plus size={18}/> Create hackathon <ArrowRight size={17}/></button>
            </section>
            <section className="ha-stats">
              <div><span>All hackathons</span><strong>{hackathons.length}</strong></div>
              <div><span>Published</span><strong>{hackathons.filter(h => h.status === "Published").length}</strong></div>
              <div><span>Drafts</span><strong>{hackathons.filter(h => h.status === "Draft").length}</strong></div>
              <div><span>Registration open</span><strong>{hackathons.filter(h => h.status === "Registration Open").length}</strong></div>
            </section>
            <section className="ha-list-section">
              <div className="ha-section-heading"><div><h2>Your hackathons</h2><p>Each hackathon has its own page content, registration questions and submission workflow.</p></div><label className="ha-search"><span>Search</span><input value={search} onChange={e => setSearch(e.target.value)} placeholder="Name or status…"/></label></div>
              {filtered.length ? <div className="ha-list">{filtered.map(item => <article className="ha-list-card" key={item.id}>
                <div className="ha-card-symbol"><Flag size={23}/></div><div className="ha-card-main"><div className="ha-card-meta"><span className={statusClass(item.status)}>{item.status}</span><span>{item.edition || "New edition"}</span></div><h3>{item.name}</h3><p>{item.tagline || item.shortDescription || "No tagline added yet."}</p><div className="ha-card-facts"><span><CalendarDays size={14}/>{formatDate(item.startDate)}{item.endDate ? ` – ${formatDate(item.endDate)}` : ""}</span><span><Users size={14}/>{item.teamMode || "Team or solo"}</span><span><ClipboardList size={14}/>{item.registrationFields?.length || 0} registration questions</span></div><small className="ha-slug">/hackathons/{item.slug || "add-url-slug"}</small></div>
                <div className="ha-card-actions"><button className="ha-button ha-button-outline" onClick={() => editHackathon(item)}>Manage <ArrowRight size={15}/></button><button className="ha-icon-button danger" title="Delete hackathon" onClick={() => deleteHackathon(item)}><Trash2 size={17}/></button></div>
              </article>)}</div> : <div className="ha-empty"><div><Flag size={25}/></div><h3>No hackathons yet</h3><p>Create the first one. You can keep it as a draft while you configure themes, registration and submissions.</p><button className="ha-button ha-button-dark" onClick={createNew}><Plus size={17}/> Create your first hackathon</button></div>}
            </section>
            <p className="ha-storage-note"><CircleHelp size={15}/> Hackathon configurations are loaded from and saved to the shared PRISM AI Firestore database.</p>
          </>
        ) : current && (
          <>
            <div className="ha-editor-top"><button className="ha-back-inline" onClick={() => { setView("list"); setError(""); }}><ArrowLeft size={16}/> All hackathons</button><div className="ha-editor-actions"><span className={statusClass(current.status)}>{current.status}</span><button className="ha-button ha-button-outline" onClick={() => saveDraft("Draft")} disabled={saving}><Save size={16}/> Save draft</button><button className="ha-button ha-button-dark" onClick={() => saveDraft("Published")} disabled={saving}><Check size={16}/> Publish</button></div></div>
            <section className="ha-editor-heading"><div><div className="ha-eyebrow">HACKATHON CONFIGURATION</div><h1>{current.name || "Untitled hackathon"}</h1><p>Configure the organizer side first. Each tab controls a separate part of the eventual public hackathon experience.</p></div><div className="ha-step-count"><strong>{TABS.findIndex(t => t.id === tab) + 1}</strong><span>of {TABS.length}<br/>sections</span></div></section>
            <div className="ha-editor-layout">
              <aside className="ha-sidebar"><span className="ha-sidebar-label">SETUP WORKFLOW</span>{TABS.map((item, i) => { const Icon = item.icon; return <button key={item.id} className={`ha-tab ${tab === item.id ? "active" : ""}`} onClick={() => setTab(item.id)}><span className="ha-tab-icon"><Icon size={17}/></span><span className="ha-tab-copy"><strong>{item.label}</strong><small>{["Core details and branding", "Publish challenge tracks", "Build this event’s form", "Define deliverables", "Schedule and announcements", "Scoring and awards", "Visibility and lifecycle"][i]}</small></span>{tab === item.id && <ArrowRight size={15}/>}</button>})}<div className="ha-sidebar-help"><CircleHelp size={17}/><strong>Build in any order</strong><p>Save as a draft at any point. Publish only when the public-facing details are ready.</p></div></aside>
              <section className="ha-editor-panel">
                {tab === "overview" && <OverviewTab data={current} update={update}/>}
                {tab === "themes" && <ThemesTab data={current} update={update} updateItem={updateItem} addItem={addItem} removeItem={removeItem}/>}
                {tab === "registration" && <RegistrationTab data={current} update={update} updateItem={updateItem} addItem={addItem} removeItem={removeItem}/>}
                {tab === "submissions" && <SubmissionsTab data={current} update={update} updateItem={updateItem} addItem={addItem} removeItem={removeItem}/>}
                {tab === "timeline" && <TimelineTab data={current} update={update} updateItem={updateItem} addItem={addItem} removeItem={removeItem}/>}
                {tab === "judging" && <JudgingTab data={current} update={update} updateItem={updateItem} addItem={addItem} removeItem={removeItem}/>}
                {tab === "settings" && <SettingsTab data={current} update={update} onSave={saveDraft} saving={saving}/>}
                <div className="ha-panel-footer"><span>Save to sync your changes with Firestore.</span><div><button className="ha-button ha-button-outline" onClick={() => saveDraft("Draft")} disabled={saving}><Save size={16}/> Save draft</button><button className="ha-button ha-button-dark" onClick={() => { const index = TABS.findIndex(t => t.id === tab); if (index < TABS.length - 1) setTab(TABS[index + 1].id); else saveDraft(current.status === "Published" ? "Published" : "Draft"); }}><>{tab === "settings" ? "Save changes" : "Next section"}</> <ArrowRight size={16}/></button></div></div>
              </section>
            </div>
          </>
        )}
      </div>
    </main>
  );
}

function SectionHeader({ eyebrow, title, description }) { return <div className="ha-form-heading"><span>{eyebrow}</span><h2>{title}</h2><p>{description}</p></div>; }
function Field({ label, value, onChange, type = "text", placeholder = "", required = false, hint = "", ...props }) { return <label className="ha-field"><span>{label}{required && <b>*</b>}</span><input type={type} value={value ?? ""} onChange={e => onChange(e.target.value)} placeholder={placeholder} required={required} {...props}/>{hint && <small>{hint}</small>}</label>; }
function Textarea({ label, value, onChange, placeholder = "", rows = 4, hint = "" }) { return <label className="ha-field"><span>{label}</span><textarea value={value ?? ""} onChange={e => onChange(e.target.value)} placeholder={placeholder} rows={rows}/>{hint && <small>{hint}</small>}</label>; }
function SelectField({ label, value, onChange, options, hint = "" }) { return <label className="ha-field"><span>{label}</span><select value={value ?? ""} onChange={e => onChange(e.target.value)}>{options.map(o => <option key={o.value ?? o} value={o.value ?? o}>{o.label ?? o}</option>)}</select>{hint && <small>{hint}</small>}</label>; }
function Toggle({ label, description, checked, onChange }) { return <label className="ha-toggle"><span><strong>{label}</strong><small>{description}</small></span><input type="checkbox" checked={Boolean(checked)} onChange={e => onChange(e.target.checked)}/><i/></label>; }
function RepeatHeader({ title, description, onAdd, addLabel = "Add item" }) { return <div className="ha-repeat-heading"><div><h3>{title}</h3>{description && <p>{description}</p>}</div><button className="ha-button ha-button-outline ha-button-small" type="button" onClick={onAdd}><Plus size={15}/>{addLabel}</button></div>; }
function RemoveButton({ onClick, label = "Remove" }) { return <button type="button" className="ha-remove" onClick={onClick}><Trash2 size={14}/>{label}</button>; }

function OverviewTab({ data, update }) {
  return <><SectionHeader eyebrow="01 / CORE DETAILS" title="Set the identity of this hackathon" description="These details form the public landing page and help participants understand what they are signing up for."/>
    <div className="ha-form-grid"><Field label="Hackathon name" value={data.name} onChange={v => update("name", v)} placeholder="e.g. PRISM AI Buildathon" required/><Field label="Edition / year" value={data.edition} onChange={v => update("edition", v)} placeholder="e.g. 2026 Edition"/><Field label="Public URL slug" value={data.slug} onChange={v => update("slug", slugify(v))} placeholder="prism-ai-buildathon-2026" required hint={`/events/hackathons/${data.slug || "your-hackathon-slug"}`}/><Field label="Organizer name" value={data.organizer} onChange={v => update("organizer", v)} placeholder="PRISM AI"/><Field label="Contact email" value={data.contactEmail} onChange={v => update("contactEmail", v)} type="email" placeholder="hackathon@college.edu"/><Field label="Website / info link" value={data.website} onChange={v => update("website", v)} placeholder="https://…"/><Field label="Start date" value={data.startDate} onChange={v => update("startDate", v)} type="date"/><Field label="End date" value={data.endDate} onChange={v => update("endDate", v)} type="date"/><Field label="Timezone" value={data.timezone} onChange={v => update("timezone", v)} placeholder="Asia/Kolkata"/><SelectField label="Format" value={data.mode} onChange={v => update("mode", v)} options={["In-person", "Online", "Hybrid"]}/><Field label="Venue / platform" value={data.venue} onChange={v => update("venue", v)} placeholder="Campus auditorium / online"/><SelectField label="Participation fee" value={data.fee} onChange={v => update("fee", v)} options={["Free", "Paid", "Free with refundable deposit"]}/></div>
    <div className="ha-form-divider"/><div className="ha-form-grid"><Field label="Tagline" value={data.tagline} onChange={v => update("tagline", v)} placeholder="Build what matters."/><Field label="Cover image URL" value={data.coverImageUrl} onChange={v => update("coverImageUrl", v)} placeholder="https://…"/><Field label="Logo image URL" value={data.logoUrl} onChange={v => update("logoUrl", v)} placeholder="https://…"/><Field label="Short description" value={data.shortDescription} onChange={v => update("shortDescription", v)} placeholder="A one-line summary for cards."/></div>
    <Textarea label="Full description" value={data.description} onChange={v => update("description", v)} placeholder="What is this hackathon about? Who should join? What should participants build?" rows={6}/><Textarea label="Rules and participation guidelines" value={data.rules} onChange={v => update("rules", v)} placeholder="Team rules, originality, use of APIs, IP ownership, attendance…" rows={4}/><Textarea label="Code of conduct" value={data.codeOfConduct} onChange={v => update("codeOfConduct", v)} placeholder="Expected participant conduct and reporting contact." rows={3}/>
  </>;
}

function ThemesTab({ data, update, updateItem, addItem, removeItem }) {
  return <><SectionHeader eyebrow="02 / CHALLENGE DESIGN" title="Release themes and problem statements" description="Add as many tracks as you need. Each track can have its own problem, constraints and expected outcomes."/>
    <RepeatHeader title={`${data.themes.length} theme${data.themes.length === 1 ? "" : "s"}`} description="Use clear, actionable challenge briefs." onAdd={() => addItem("themes", makeTheme())} addLabel="Add theme"/>
    {data.themes.map((theme, i) => <article className="ha-repeat-card" key={theme.id}><div className="ha-repeat-card-top"><span className="ha-index">THEME {String(i + 1).padStart(2, "0")}</span><RemoveButton onClick={() => removeItem("themes", i)} /></div><div className="ha-form-grid"><Field label="Theme / track name" value={theme.name} onChange={v => updateItem("themes", i, "name", v)} placeholder="e.g. AI for accessibility" required/><Field label="Short code" value={theme.shortCode} onChange={v => updateItem("themes", i, "shortCode", v)} placeholder="ACCESS-AI"/></div><Textarea label="Theme overview" value={theme.description} onChange={v => updateItem("themes", i, "description", v)} placeholder="Explain the track and why it matters." rows={3}/><Textarea label="Problem statement" value={theme.problemStatement} onChange={v => updateItem("themes", i, "problemStatement", v)} placeholder="What exact problem should participants solve?" rows={4}/><div className="ha-form-grid"><Textarea label="Expected outcomes" value={theme.expectedOutcome} onChange={v => updateItem("themes", i, "expectedOutcome", v)} placeholder="What should a strong solution demonstrate?" rows={3}/><Textarea label="Constraints / boundaries" value={theme.constraints} onChange={v => updateItem("themes", i, "constraints", v)} placeholder="Scope, data, safety, time or technical constraints." rows={3}/></div><Textarea label="Suggested technologies / resources" value={theme.suggestedTech} onChange={v => updateItem("themes", i, "suggestedTech", v)} placeholder="Optional tools, APIs, datasets, links or starter kits." rows={2}/><Textarea label="Track-specific evaluation notes" value={theme.evaluationNotes} onChange={v => updateItem("themes", i, "evaluationNotes", v)} placeholder="What should judges pay particular attention to?" rows={2}/></article>)}
    <div className="ha-form-divider"/><Toggle label="Show themes before registration" description="Let visitors read the challenge briefs before they register." checked={data.themesVisibleEarly ?? true} onChange={v => update("themesVisibleEarly", v)}/><Toggle label="Release themes on a scheduled date" description="Use the theme release date in the Timeline tab to communicate when the briefs go live." checked={data.releaseThemesScheduled ?? false} onChange={v => update("releaseThemesScheduled", v)}/>
  </>;
}

function RegistrationTab({ data, update, updateItem, addItem, removeItem }) {
  const fields = data.registrationFields || [];
  return <><SectionHeader eyebrow="03 / PARTICIPANT INTAKE" title="Build a registration form for this hackathon" description="Every event gets its own form schema. Add questions, choose the response type and mark which answers are required. This does not affect forms for workshops or other events."/>
    <div className="ha-callout"><ClipboardList size={18}/><div><strong>Event-specific by design</strong><p>This list belongs only to <b>{data.name || "this hackathon"}</b>. Later, other event types will have their own independent form builder with their own questions.</p></div></div>
    <div className="ha-form-grid"><Field label="Registration opens" value={data.registrationOpens} onChange={v => update("registrationOpens", v)} type="datetime-local"/><Field label="Registration deadline" value={data.registrationCloses} onChange={v => update("registrationCloses", v)} type="datetime-local"/><Field label="Eligibility" value={data.eligibility} onChange={v => update("eligibility", v)} placeholder="Open to college students"/><Field label="Eligible courses" value={data.eligibleCourses} onChange={v => update("eligibleCourses", v)} placeholder="Any branch / CSE / ECE…"/><SelectField label="Eligible year" value={data.eligibleYears} onChange={v => update("eligibleYears", v)} options={["Any year", "1st year", "2nd year", "3rd year", "4th year", "Pre-university", "Graduates", "Custom eligibility"]}/><SelectField label="College policy" value={data.collegePolicy} onChange={v => update("collegePolicy", v)} options={["Any college", "RNSIT only", "Selected colleges", "Custom list"]}/><SelectField label="Team participation" value={data.teamMode} onChange={v => update("teamMode", v)} options={["Solo only", "Team only", "Team or solo"]}/><Field label="Minimum team size" value={data.minTeamSize} onChange={v => update("minTeamSize", Number(v))} type="number"/><Field label="Maximum team size" value={data.maxTeamSize} onChange={v => update("maxTeamSize", Number(v))} type="number"/></div>
    <Toggle label="Allow members from different colleges" description="If disabled, all members in a team must belong to the same institution." checked={data.allowCrossCollege} onChange={v => update("allowCrossCollege", v)}/><Toggle label="Manually approve registrations" description="Registrations remain pending until an organizer approves them." checked={data.requireApproval} onChange={v => update("requireApproval", v)}/><Toggle label="Enable waitlist" description="Allow interested participants to join a waitlist when capacity is reached." checked={data.waitlistEnabled} onChange={v => update("waitlistEnabled", v)}/>
    <div className="ha-form-divider"/><RepeatHeader title={`Registration questions (${fields.length})`} description="Drag ordering can be added later; use the arrows to control the question order for now." onAdd={() => addItem("registrationFields", makeField())} addLabel="Add question"/>
    {fields.map((field, i) => <article className="ha-question-card" key={field.id}><div className="ha-question-number">{String(i + 1).padStart(2, "0")}</div><div className="ha-question-content"><div className="ha-form-grid"><Field label="Question label" value={field.label} onChange={v => updateItem("registrationFields", i, "label", v)} placeholder="What should the participant answer?" required/><SelectField label="Answer type" value={field.type} onChange={v => updateItem("registrationFields", i, "type", v)} options={[{value:"text",label:"Short answer"},{value:"textarea",label:"Long answer"},{value:"email",label:"Email"},{value:"tel",label:"Phone number"},{value:"number",label:"Number"},{value:"url",label:"Website / URL"},{value:"select",label:"Dropdown"},{value:"radio",label:"Single choice"},{value:"checkbox",label:"Checkbox / consent"},{value:"date",label:"Date"}]}/></div>{["select", "radio"].includes(field.type) && <Field label="Options (separate with commas)" value={field.options} onChange={v => updateItem("registrationFields", i, "options", v)} placeholder="Option A, Option B, Option C"/>}<Field label="Helper text (optional)" value={field.helpText} onChange={v => updateItem("registrationFields", i, "helpText", v)} placeholder="Example or context to help participants answer"/><div className="ha-question-bottom"><label className="ha-check"><input type="checkbox" checked={field.required} onChange={e => updateItem("registrationFields", i, "required", e.target.checked)}/> Required question</label><div className="ha-mini-actions"><button type="button" disabled={i === 0} onClick={() => { const arr = [...fields]; [arr[i - 1], arr[i]] = [arr[i], arr[i - 1]]; update("registrationFields", arr); }} title="Move up">↑</button><button type="button" disabled={i === fields.length - 1} onClick={() => { const arr = [...fields]; [arr[i + 1], arr[i]] = [arr[i], arr[i + 1]]; update("registrationFields", arr); }} title="Move down">↓</button><RemoveButton onClick={() => removeItem("registrationFields", i)} label="Remove question"/></div></div></div></article>)}
    <Textarea label="Registration consent / declaration" value={data.registrationConsent || ""} onChange={v => update("registrationConsent", v)} placeholder="I confirm that the information provided is accurate…" rows={3}/>
  </>;
}

function SubmissionsTab({ data, update, updateItem, addItem, removeItem }) {
  const config = data.submission;
  const choices = [{id:"projectTitle",label:"Project title"},{id:"abstract",label:"Abstract / summary"},{id:"theme",label:"Selected theme"},{id:"solution",label:"Problem and solution"},{id:"github",label:"GitHub repository URL"},{id:"demo",label:"Live demo URL"},{id:"video",label:"Demo video URL"},{id:"deck",label:"Pitch deck / presentation"},{id:"report",label:"Project report"},{id:"technologies",label:"Technologies used"},{id:"impact",label:"Expected impact"}];
  return <><SectionHeader eyebrow="04 / DELIVERABLES" title="Decide what participants must submit" description="These rules define the submission workspace participants will see later. Configure deliverables and deadlines before opening submissions."/>
    <div className="ha-form-grid"><Field label="Submission opens" value={data.submissionOpens} onChange={v => update("submissionOpens", v)} type="datetime-local"/><Field label="Submission deadline" value={data.submissionCloses} onChange={v => update("submissionCloses", v)} type="datetime-local"/><Field label="Maximum file size (MB)" value={config.maxFileSizeMb} onChange={v => update("submission.maxFileSizeMb", Number(v))} type="number"/><Field label="Allowed file types" value={config.allowedFileTypes} onChange={v => update("submission.allowedFileTypes", v)} placeholder="PDF, PPTX, ZIP"/><Field label="Max team members on submission" value={config.maxTeamMembers} onChange={v => update("submission.maxTeamMembers", Number(v))} type="number"/><Field label="Submissions allowed per team" value={config.allowedCount} onChange={v => update("submission.allowedCount", Number(v))} type="number"/></div>
    <div className="ha-form-divider"/><h3 className="ha-subheading">Required submission fields</h3><p className="ha-subtext">Choose which deliverables the participant submission form must collect.</p><div className="ha-check-grid">{choices.map(choice => <label className="ha-check-tile" key={choice.id}><input type="checkbox" checked={config.requiredItems.includes(choice.id)} onChange={e => update("submission.requiredItems", e.target.checked ? [...config.requiredItems, choice.id] : config.requiredItems.filter(x => x !== choice.id))}/><span>{choice.label}</span></label>)}</div>
    <Textarea label="Submission instructions" value={config.instructions} onChange={v => update("submission.instructions", v)} placeholder="Tell teams what to include and how judges will review it." rows={5}/><Toggle label="Allow teams to edit after submitting" description="Teams can revise their submission until the deadline." checked={config.allowEdits} onChange={v => update("submission.allowEdits", v)}/><Toggle label="Accept late submissions" description="Late submissions should be clearly marked for judges." checked={config.lateSubmissions} onChange={v => update("submission.lateSubmissions", v)}/><Toggle label="Show projects in a public showcase" description="Allow published projects to appear on the public event page after review." checked={config.publicShowcase} onChange={v => update("submission.publicShowcase", v)}/>
    <div className="ha-form-divider"/><RepeatHeader title="Extra submission questions" description="Add track-specific or event-specific information beyond the standard deliverables." onAdd={() => addItem("submission.customQuestions", makeField())} addLabel="Add field"/>{config.customQuestions.map((field, i) => <article className="ha-question-card" key={field.id}><div className="ha-question-number">{i + 1}</div><div className="ha-question-content"><div className="ha-form-grid"><Field label="Question" value={field.label} onChange={v => updateItem("submission.customQuestions", i, "label", v)}/><SelectField label="Type" value={field.type} onChange={v => updateItem("submission.customQuestions", i, "type", v)} options={["text","textarea","url","number","select"]}/></div>{field.type === "select" && <Field label="Options (comma-separated)" value={field.options} onChange={v => updateItem("submission.customQuestions", i, "options", v)}/>}<label className="ha-check"><input type="checkbox" checked={field.required} onChange={e => updateItem("submission.customQuestions", i, "required", e.target.checked)}/> Required</label><RemoveButton onClick={() => removeItem("submission.customQuestions", i)}/></div></article>)}
  </>;
}

function TimelineTab({ data, update, updateItem, addItem, removeItem }) {
  return <><SectionHeader eyebrow="05 / COMMUNICATION" title="Keep the event moving with updates" description="Create a public schedule and post updates as the event evolves. A later user portal can surface these in an announcement feed and notifications."/>
    <RepeatHeader title={`Timeline milestones (${data.milestones.length})`} description="Registration, theme release, workshops, submission deadline, shortlist, finale and results." onAdd={() => addItem("milestones", makeMilestone())} addLabel="Add milestone"/>
    {data.milestones.map((item, i) => <article className="ha-repeat-card ha-milestone" key={item.id}><div className="ha-repeat-card-top"><span className="ha-index">MILESTONE {String(i + 1).padStart(2, "0")}</span><RemoveButton onClick={() => removeItem("milestones", i)}/></div><div className="ha-form-grid"><Field label="Milestone title" value={item.title} onChange={v => updateItem("milestones", i, "title", v)} placeholder="e.g. Problem statements released"/><SelectField label="Milestone type" value={item.type} onChange={v => updateItem("milestones", i, "type", v)} options={["registration","announcement","workshop","deadline","shortlist","finale","results","other"]}/><Field label="Date" value={item.date} onChange={v => updateItem("milestones", i, "date", v)} type="date"/><Field label="Time" value={item.time} onChange={v => updateItem("milestones", i, "time", v)} type="time"/></div><Textarea label="Details" value={item.description} onChange={v => updateItem("milestones", i, "description", v)} placeholder="What happens at this milestone? Include timezone if needed." rows={2}/></article>)}
    <div className="ha-form-divider"/><RepeatHeader title={`Announcements (${data.announcements.length})`} description="Draft event updates, deadline changes, workshop information, shortlist announcements and results." onAdd={() => addItem("announcements", makeAnnouncement())} addLabel="Write announcement"/>
    {data.announcements.map((item, i) => <article className="ha-repeat-card" key={item.id}><div className="ha-repeat-card-top"><span className="ha-index">UPDATE {String(i + 1).padStart(2, "0")}</span><RemoveButton onClick={() => removeItem("announcements", i)}/></div><Field label="Announcement title" value={item.title} onChange={v => updateItem("announcements", i, "title", v)} placeholder="e.g. Themes are now live"/><Textarea label="Announcement message" value={item.body} onChange={v => updateItem("announcements", i, "body", v)} placeholder="Write the full update for participants." rows={4}/><div className="ha-form-grid"><Field label="Publish date and time" value={item.date} onChange={v => updateItem("announcements", i, "date", v)} type="datetime-local"/><Toggle label="Pin announcement" description="Keep this update prominent." checked={item.pinned} onChange={v => updateItem("announcements", i, "pinned", v)}/></div></article>)}
    <div className="ha-form-divider"/><RepeatHeader title="Frequently asked questions" description="Add short answers to common participant questions." onAdd={() => addItem("faq", { id: crypto.randomUUID(), question: "", answer: "" })} addLabel="Add FAQ"/>{data.faq.map((item, i) => <article className="ha-repeat-card" key={item.id}><div className="ha-repeat-card-top"><span className="ha-index">FAQ {i + 1}</span><RemoveButton onClick={() => removeItem("faq", i)}/></div><Field label="Question" value={item.question} onChange={v => updateItem("faq", i, "question", v)} placeholder="Can I participate solo?"/><Textarea label="Answer" value={item.answer} onChange={v => updateItem("faq", i, "answer", v)} placeholder="Write a clear answer." rows={2}/></article>)}
    <RepeatHeader title="Resources and links" description="Starter kits, datasets, API documentation, workshop recordings and rule documents." onAdd={() => addItem("resources", { id: crypto.randomUUID(), title: "", url: "", description: "" })} addLabel="Add resource"/>{data.resources.map((item, i) => <article className="ha-repeat-card" key={item.id}><div className="ha-repeat-card-top"><span className="ha-index">RESOURCE {i + 1}</span><RemoveButton onClick={() => removeItem("resources", i)}/></div><div className="ha-form-grid"><Field label="Resource name" value={item.title} onChange={v => updateItem("resources", i, "title", v)} placeholder="Starter kit"/><Field label="URL" value={item.url} onChange={v => updateItem("resources", i, "url", v)} placeholder="https://…"/></div><Field label="Description" value={item.description} onChange={v => updateItem("resources", i, "description", v)} placeholder="What will participants find here?"/></article>)}
  </>;
}

function JudgingTab({ data, update, updateItem, addItem, removeItem }) {
  const judging = data.judging;
  const weightTotal = judging.criteria.reduce((sum, item) => sum + Number(item.weight || 0), 0);
  return <><SectionHeader eyebrow="06 / EVALUATION" title="Define how projects will be judged" description="Set up rounds, scoring criteria and awards. Final winner selection stays with your human judging process; this configuration only structures the review."/>
    <RepeatHeader title="Evaluation rounds" description="Examples: idea screening, prototype review, final presentation." onAdd={() => addItem("judging.rounds", { id: crypto.randomUUID(), name: "", description: "", date: "" })} addLabel="Add round"/>{judging.rounds.map((item, i) => <article className="ha-repeat-card" key={item.id}><div className="ha-repeat-card-top"><span className="ha-index">ROUND {i + 1}</span><RemoveButton onClick={() => removeItem("judging.rounds", i)}/></div><div className="ha-form-grid"><Field label="Round name" value={item.name} onChange={v => updateItem("judging.rounds", i, "name", v)} placeholder="Prototype review"/><Field label="Review date" value={item.date} onChange={v => updateItem("judging.rounds", i, "date", v)} type="date"/></div><Textarea label="What happens in this round?" value={item.description} onChange={v => updateItem("judging.rounds", i, "description", v)} placeholder="Review format, shortlist size, presentation length…" rows={2}/></article>)}
    <div className="ha-form-divider"/><RepeatHeader title="Scoring rubric" description="Weights should add up to 100% for a standard weighted score." onAdd={() => addItem("judging.criteria", { id: crypto.randomUUID(), name: "New criterion", weight: 0 })} addLabel="Add criterion"/><div className="ha-weight-summary"><span>Total weight</span><strong className={weightTotal === 100 ? "valid" : "invalid"}>{weightTotal}%</strong><small>{weightTotal === 100 ? "Weights add up to 100%." : "Adjust the weights to total 100%."}</small></div>
    {judging.criteria.map((item, i) => <div className="ha-criterion-row" key={item.id}><Field label="Criterion" value={item.name} onChange={v => updateItem("judging.criteria", i, "name", v)} placeholder="Innovation"/><Field label="Weight (%)" value={item.weight} onChange={v => updateItem("judging.criteria", i, "weight", Number(v))} type="number"/><RemoveButton onClick={() => removeItem("judging.criteria", i)}/></div>)}
    <div className="ha-form-divider"/><RepeatHeader title="Prizes and recognition" description="Add awards, prize descriptions, value and any eligibility notes." onAdd={() => addItem("judging.prizes", { id: crypto.randomUUID(), place: "Special mention", title: "", value: "", description: "" })} addLabel="Add prize"/>{judging.prizes.map((item, i) => <article className="ha-repeat-card" key={item.id}><div className="ha-repeat-card-top"><span className="ha-index">AWARD {i + 1}</span><RemoveButton onClick={() => removeItem("judging.prizes", i)}/></div><div className="ha-form-grid"><Field label="Award / rank" value={item.place} onChange={v => updateItem("judging.prizes", i, "place", v)} placeholder="Winner / Runner-up"/><Field label="Prize title" value={item.title} onChange={v => updateItem("judging.prizes", i, "title", v)} placeholder="Grand prize"/><Field label="Prize value" value={item.value} onChange={v => updateItem("judging.prizes", i, "value", v)} placeholder="₹25,000 / internship"/></div><Textarea label="Description / eligibility" value={item.description} onChange={v => updateItem("judging.prizes", i, "description", v)} placeholder="What is included in this award?" rows={2}/></article>)}
    <div className="ha-form-divider"/><Textarea label="Judge / mentor information" value={judging.judges} onChange={v => update("judging.judges", v)} placeholder="Names, roles, bios or a note that judges will be announced later." rows={3}/><Toggle label="Enable shortlist stage" description="The event can publish a shortlisted teams update before the finale." checked={judging.shortlistEnabled} onChange={v => update("judging.shortlistEnabled", v)}/><Toggle label="Share judge feedback with teams" description="Allow feedback to be displayed to participants after evaluation." checked={judging.feedbackVisible} onChange={v => update("judging.feedbackVisible", v)}/>
  </>;
}

function SettingsTab({ data, update, onSave, saving }) {
  return <><SectionHeader eyebrow="07 / PUBLISHING" title="Choose how this hackathon goes live" description="Publishing controls the public lifecycle. You can prepare everything in draft and then move the event through registration, themes, submissions and results."/>
    <div className="ha-form-grid"><SelectField label="Current lifecycle status" value={data.status} onChange={v => update("status", v)} options={["Draft", "Published", "Registration Open", "Themes Released", "Submissions Open", "Submissions Closed", "Evaluation", "Shortlisting", "Finale", "Results Announced", "Archived"]}/><SelectField label="Visibility" value={data.visibility} onChange={v => update("visibility", v)} options={["Public", "Unlisted", "Private"]}/><Field label="Results announcement date" value={data.resultDate} onChange={v => update("resultDate", v)} type="datetime-local"/><Field label="Maximum registrations (optional)" value={data.registrationCapacity ?? ""} onChange={v => update("registrationCapacity", v === "" ? "" : Number(v))} type="number" placeholder="No limit"/></div>
    <div className="ha-preview-card"><div className="ha-preview-top"><span className="ha-preview-mark"><Eye size={18}/></span><div><strong>Public page preview details</strong><small>These are the identifiers for the public-facing page we will build next.</small></div></div><div className="ha-preview-url"><span>PRISM AI / HACKATHONS</span><code>/hackathons/{data.slug || "your-hackathon-slug"}</code><button type="button" className="ha-icon-button" title="Copy URL path" onClick={() => navigator.clipboard?.writeText(`/events/hackathons/${data.slug || "your-hackathon-slug"}`)}><Copy size={16}/></button></div><div className="ha-preview-summary"><div><small>Page title</small><strong>{data.name || "Hackathon name"}</strong></div><div><small>Registration</small><strong>{formatDate(data.registrationOpens)} → {formatDate(data.registrationCloses)}</strong></div><div><small>Challenge tracks</small><strong>{data.themes.length}</strong></div><div><small>Form questions</small><strong>{data.registrationFields.length}</strong></div></div></div>
    <div className="ha-callout"><Megaphone size={18}/><div><strong>Before publishing</strong><p>Check your registration window, theme visibility, submission requirements, judging weights and public contact details. Publishing saves the hackathon configuration and lifecycle status to the shared Firestore database.</p></div></div>
    <div className="ha-settings-actions"><button className="ha-button ha-button-outline" onClick={() => onSave("Draft")} disabled={saving}><Save size={16}/> Save as draft</button><button className="ha-button ha-button-dark" onClick={() => onSave("Published")} disabled={saving}><Check size={16}/> Publish hackathon <ArrowRight size={16}/></button></div>
  </>;
}
