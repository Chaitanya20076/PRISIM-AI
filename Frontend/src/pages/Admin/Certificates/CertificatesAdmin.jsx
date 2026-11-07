import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  ArrowRight,
  Award,
  Check,
  ChevronDown,
  CircleHelp,
  Download,
  Eye,
  FileBadge,
  FileSpreadsheet,
  FileText,
  LoaderCircle,
  Moon,
  Plus,
  RefreshCw,
  Save,
  Search,
  Sparkles,
  Sun,
  Trash2,
  Upload,
  X,
} from "lucide-react";
import "./CertificatesAdmin.css";

const API_URL = (import.meta.env.VITE_API_BASE_URL || "http://localhost:5000").replace(/\/$/, "");
const EMPTY_FORM = {
  eventName: "",
  eventDate: "",
  eventAbout: "",
  certificateType: "Participation",
  description: "",
  theme: "navy-coral",
  organization: "PRISM AI · RNS Institute of Technology",
  signatoryName: "",
  signatoryTitle: "",
  language: "English",
  instructions: "",
};
const FALLBACK_THEMES = [
  { id: "navy-coral", label: "Navy & Coral", ink: "#1b365d", accent: "#ff6f61", paper: "#ffffff", border: "#ffb0a8" },
  { id: "prism", label: "PRISM Teal", ink: "#102d32", accent: "#14b8a6", paper: "#f8fffd", border: "#73d9cb" },
  { id: "gold", label: "Classic Gold", ink: "#292116", accent: "#b58a36", paper: "#fffdf7", border: "#d7bd7b" },
  { id: "minimal", label: "Minimal White", ink: "#20242b", accent: "#455a64", paper: "#ffffff", border: "#c9d1d8" },
  { id: "midnight", label: "Midnight Luxe", ink: "#f7f2e8", accent: "#d9b46b", paper: "#18202b", border: "#9b7d46" },
  { id: "violet", label: "Violet Gradient", ink: "#271447", accent: "#805ad5", paper: "#fbf8ff", border: "#b9a0f0" },
  { id: "rose", label: "Rose Formal", ink: "#4a2634", accent: "#c66b88", paper: "#fff9fb", border: "#e6b2c2" },
];
const LOADING_LINES = [
  "Understanding the purpose of your event…",
  "Crafting certificate wording with Sarvam AI…",
  "Pairing your theme and typography…",
  "Adding the finishing touches…",
];

function authHeaders(extra = {}) {
  const token = sessionStorage.getItem("prism-admin-token");
  return { ...(token ? { Authorization: `Bearer ${token}` } : {}), ...extra };
}

async function apiRequest(path, options = {}) {
  const response = await fetch(`${API_URL}/api/certificates${path}`, {
    ...options,
    headers: authHeaders(options.headers || {}),
  });
  if (!response.ok) {
    let message = "Something went wrong. Please try again.";
    try {
      const data = await response.json();
      message = data.message || message;
    } catch {
      // Keep fallback message for non-JSON errors.
    }
    throw new Error(response.status === 401 || response.status === 403 ? "Your admin session may have expired. Please sign in again." : message);
  }
  return response;
}

function formatDate(value) {
  if (!value) return "Date not set";
  const date = new Date(`${value}T00:00:00`);
  return Number.isNaN(date.getTime()) ? value : date.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
}

function CertificateMiniPreview({ item, theme }) {
  const colors = theme || FALLBACK_THEMES.find((entry) => entry.id === item?.theme) || FALLBACK_THEMES[0];
  return (
    <div className="ca-mini-sheet" style={{ "--cert-ink": colors.ink, "--cert-accent": colors.accent, "--cert-paper": colors.paper, "--cert-border": colors.border }}>
      <div className="ca-mini-frame">
        <span className="ca-mini-kicker">CERTIFICATE OF RECOGNITION</span>
        <span className="ca-mini-org">{item?.organization || "PRISM AI · RNSIT"}</span>
        <span className="ca-mini-rule" />
        <strong>{item?.title || "Certificate of Participation"}</strong>
        <span className="ca-mini-subtitle">{item?.subtitle || item?.eventName || "Your event name"}</span>
        <small>PRESENTED TO</small>
        <b>Participant Name</b>
        <p>{item?.body || item?.description || "Your certificate description will appear here."}</p>
        <div className="ca-mini-signatures"><span>{formatDate(item?.eventDate)}<i>Date</i></span><span>{item?.signatoryName || "Authorized Signatory"}<i>{item?.signatoryTitle || "PRISM AI"}</i></span></div>
      </div>
    </div>
  );
}

export default function CertificatesAdmin() {
  const navigate = useNavigate();
  const [themeMode, setThemeMode] = useState(() => {
    try { return localStorage.getItem("prism-certificate-theme") || "light"; } catch { return "light"; }
  });
  const [items, setItems] = useState([]);
  const [themes, setThemes] = useState(FALLBACK_THEMES);
  const [form, setForm] = useState(EMPTY_FORM);
  const [editing, setEditing] = useState(null);
  const [selected, setSelected] = useState(null);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [loadingLine, setLoadingLine] = useState(0);
  const [saving, setSaving] = useState(false);
  const [bulkBusy, setBulkBusy] = useState(false);
  const [excelFile, setExcelFile] = useState(null);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewHtml, setPreviewHtml] = useState("");
  const [previewLoading, setPreviewLoading] = useState(false);

  useEffect(() => {
    try { localStorage.setItem("prism-certificate-theme", themeMode); } catch { /* optional preference */ }
  }, [themeMode]);

  useEffect(() => {
    if (!creating) return undefined;
    const timer = window.setInterval(() => setLoadingLine((current) => (current + 1) % LOADING_LINES.length), 2200);
    return () => window.clearInterval(timer);
  }, [creating]);

  const loadData = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const [itemsResponse, themesResponse] = await Promise.all([
        apiRequest("/"),
        apiRequest("/themes"),
      ]);
      const itemData = await itemsResponse.json();
      const themeData = await themesResponse.json();
      setItems(Array.isArray(itemData.items) ? itemData.items : []);
      if (Array.isArray(themeData.themes) && themeData.themes.length) {
        // Add the requested navy/coral theme even if an older backend doesn't return it yet.
        const serverThemes = themeData.themes;
        setThemes(serverThemes.some((theme) => theme.id === "navy-coral") ? serverThemes : [FALLBACK_THEMES[0], ...serverThemes]);
      }
    } catch (err) {
      setError(err.message || "Could not load certificates. Check that the backend is running and the admin session is valid.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  const activeTheme = useMemo(() => themes.find((theme) => theme.id === form.theme) || FALLBACK_THEMES[0], [themes, form.theme]);
  const filteredItems = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return items;
    return items.filter((item) => [item.eventName, item.eventAbout, item.certificateType, item.title].filter(Boolean).join(" ").toLowerCase().includes(query));
  }, [items, search]);

  const updateField = (key, value) => setForm((current) => ({ ...current, [key]: value }));
  const startCreate = () => {
    setError(""); setNotice(""); setEditing(null); setSelected(null);
    setForm({ ...EMPTY_FORM, theme: themes.some((t) => t.id === "navy-coral") ? "navy-coral" : (themes[0]?.id || "prism") });
    setShowForm(true);
  };
  const startEdit = (item) => {
    setSelected(item); setEditing(item.id); setError(""); setNotice(""); setShowForm(true);
    setForm({ ...EMPTY_FORM, ...item, eventDate: item.eventDate || "", theme: item.theme || "navy-coral" });
    window.scrollTo({ top: 0, behavior: "smooth" });
  };
  const closeEditor = () => { setShowForm(false); setEditing(null); setSelected(null); setError(""); setNotice(""); };

  const createCertificate = async (event) => {
    event.preventDefault();
    setError(""); setNotice(""); setCreating(true); setLoadingLine(0);
    try {
      const response = await apiRequest("/generate", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });
      const data = await response.json();
      if (!data.item) throw new Error("Sarvam did not return a saved certificate. Please try again.");
      setItems((current) => [data.item, ...current.filter((item) => item.id !== data.item.id)]);
      setSelected(data.item); setEditing(data.item.id);
      setForm({ ...EMPTY_FORM, ...data.item, eventDate: data.item.eventDate || form.eventDate });
      setNotice("Certificate draft created! You can now refine its wording and download a preview.");
      setShowForm(true);
    } catch (err) {
      setError(err.message || "Certificate generation failed.");
    } finally {
      setCreating(false);
    }
  };

  const saveEdits = async (event) => {
    event?.preventDefault();
    if (!editing) return;
    setSaving(true); setError(""); setNotice("");
    try {
      const response = await apiRequest(`/${editing}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });
      const data = await response.json();
      setItems((current) => current.map((item) => item.id === data.item.id ? data.item : item));
      setSelected(data.item); setForm({ ...EMPTY_FORM, ...data.item, eventDate: data.item.eventDate || "" });
      setNotice("Your certificate changes have been saved.");
    } catch (err) { setError(err.message || "Could not save your changes."); }
    finally { setSaving(false); }
  };

  const regenerateCopy = async () => {
    if (!editing) return;
    setSaving(true); setError(""); setNotice("");
    try {
      const response = await apiRequest(`/${editing}/regenerate-copy`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });
      const data = await response.json();
      setItems((current) => current.map((item) => item.id === data.item.id ? data.item : item));
      setSelected(data.item); setForm({ ...EMPTY_FORM, ...data.item, eventDate: data.item.eventDate || "" });
      setNotice("Sarvam has generated revised certificate wording. Review it and save when ready.");
    } catch (err) { setError(err.message || "Could not regenerate the wording."); }
    finally { setSaving(false); }
  };

  const deleteCertificate = async (item) => {
    if (!window.confirm(`Delete the certificate draft for “${item.eventName}”? This cannot be undone.`)) return;
    setError(""); setNotice("");
    try {
      await apiRequest(`/${item.id}`, { method: "DELETE" });
      setItems((current) => current.filter((entry) => entry.id !== item.id));
      if (editing === item.id) closeEditor();
      setNotice("Certificate draft deleted.");
    } catch (err) { setError(err.message || "Could not delete the certificate."); }
  };

  const openDownload = async (item, format) => {
    setError("");
    try {
      const response = await apiRequest(`/${item.id}/${format}`);
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = `${(item.eventName || "certificate").replace(/[^a-z0-9-_]+/gi, "-")}-${format === "pdf" ? "sample.pdf" : "preview.html"}`;
      document.body.appendChild(anchor); anchor.click(); anchor.remove(); URL.revokeObjectURL(url);
    } catch (err) { setError(err.message || `Could not download ${format}.`); }
  };

  const uploadBulk = async (event) => {
    event.preventDefault();
    if (!editing || !excelFile) { setError("Choose an .xlsx participant spreadsheet first."); return; }
    setBulkBusy(true); setError(""); setNotice("");
    try {
      const body = new FormData(); body.append("file", excelFile);
      const response = await apiRequest(`/${editing}/bulk`, { method: "POST", body });
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = `${(form.eventName || "event").replace(/[^a-z0-9-_]+/gi, "-")}-certificates.zip`;
      document.body.appendChild(anchor); anchor.click(); anchor.remove(); URL.revokeObjectURL(url);
      const generated = response.headers.get("X-Certificates-Generated");
      const skipped = response.headers.get("X-Rows-Skipped");
      setNotice(`Bulk export complete${generated ? `: ${generated} certificates generated` : ""}${skipped && Number(skipped) ? `, ${skipped} blank rows skipped` : ""}.`);
      setExcelFile(null);
      await loadData();
    } catch (err) { setError(err.message || "Bulk certificate generation failed."); }
    finally { setBulkBusy(false); }
  };

  const openPreview = async () => {
    if (!editing) return;
    // Save first so the preview reflects the latest edits.
    await saveEdits();
    setPreviewLoading(true);
    try {
      const response = await apiRequest(`/${editing}/preview`);
      setPreviewHtml(await response.text());
      setPreviewOpen(true);
    } catch (err) {
      setError(err.message || "Could not load the certificate preview.");
    } finally {
      setPreviewLoading(false);
    }
  };

  return (
    <main className={`ca-page ${themeMode === "dark" ? "ca-dark" : "ca-light"}`}>
      <div className="ca-ambient ca-ambient-one" /><div className="ca-ambient ca-ambient-two" />
      <div className="ca-shell">
        <header className="ca-topbar">
          <button className="ca-back-button" type="button" onClick={() => navigate("/admin/dashboard")} aria-label="Back to admin dashboard"><ArrowLeft size={17} /><span>Admin workspace</span></button>
          <div className="ca-brand"><span className="ca-brand-mark"><Award size={22} /></span><span><strong>PRISM AI</strong><small>CERTIFICATE STUDIO</small></span></div>
          <button className="ca-mode-toggle" type="button" onClick={() => setThemeMode((mode) => mode === "dark" ? "light" : "dark")} aria-label={`Switch to ${themeMode === "dark" ? "light" : "dark"} mode`}>{themeMode === "dark" ? <Sun size={17} /> : <Moon size={17} />}<span>{themeMode === "dark" ? "Light mode" : "Dark mode"}</span></button>
        </header>

        <section className="ca-hero">
          <div className="ca-hero-copy"><div className="ca-eyebrow"><Sparkles size={14} /> AI-POWERED CERTIFICATES</div><h1>Make every achievement <em>feel official.</em></h1><p>Create polished event certificates with Sarvam AI, customise the design, and generate a personalised PDF for every participant in seconds.</p><div className="ca-hero-pills"><span><Check size={14} /> Editable designs</span><span><Check size={14} /> Bulk PDF + ZIP</span><span><Check size={14} /> Saved drafts</span></div></div>
          <div className="ca-hero-art"><CertificateMiniPreview item={{ title: "Certificate of Achievement", subtitle: "Your next great event", body: "In recognition of outstanding participation and contribution." }} theme={FALLBACK_THEMES[0]} /><span className="ca-art-spark ca-art-spark-one">✦</span><span className="ca-art-spark ca-art-spark-two">✧</span></div>
        </section>

        {error && <div className="ca-alert ca-alert-error" role="alert"><CircleHelp size={18} /><span>{error}</span><button type="button" onClick={() => setError("")} aria-label="Dismiss error"><X size={16} /></button></div>}
        {notice && <div className="ca-alert ca-alert-success" role="status"><Check size={18} /><span>{notice}</span><button type="button" onClick={() => setNotice("")} aria-label="Dismiss message"><X size={16} /></button></div>}

        {showForm && <section className="ca-editor-panel" id="certificate-editor">
          <div className="ca-section-heading"><div><span className="ca-section-kicker">{editing ? "EDIT CERTIFICATE" : "NEW CERTIFICATE"}</span><h2>{editing ? "Refine your certificate" : "Start with your event"}</h2><p>Share the event details first. Sarvam will draft the wording; you stay in control of the final design.</p></div><button className="ca-icon-button" type="button" onClick={closeEditor} aria-label="Close editor"><X size={19} /></button></div>
          <form className="ca-form" onSubmit={editing ? saveEdits : createCertificate}>
            <div className="ca-form-grid">
              <label className="ca-field"><span>Event name <b>*</b></span><input required maxLength={160} value={form.eventName} onChange={(e) => updateField("eventName", e.target.value)} placeholder="e.g. Agentathon 2026" /></label>
              <label className="ca-field"><span>Event date <b>*</b></span><input required type="date" value={form.eventDate || ""} onChange={(e) => updateField("eventDate", e.target.value)} /><small>The date will appear on each certificate unless a participant's Excel row provides a different date.</small></label>
              <label className="ca-field ca-field-full"><span>What was the event about? <b>*</b></span><textarea required rows={3} maxLength={1000} value={form.eventAbout} onChange={(e) => updateField("eventAbout", e.target.value)} placeholder="Describe the event, its purpose, activities, and what participants achieved…" /></label>
              <label className="ca-field"><span>Certificate type <b>*</b></span><select required value={form.certificateType} onChange={(e) => updateField("certificateType", e.target.value)}>{["Participation", "Winner", "Runner-up", "Appreciation", "Completion", "Achievement", "Volunteer Recognition", "Speaker", "Custom"].map((type) => <option key={type}>{type}</option>)}</select></label>
              <label className="ca-field"><span>Language</span><select value={form.language} onChange={(e) => updateField("language", e.target.value)}>{["English", "Kannada", "Hindi", "Tamil", "Telugu", "Bilingual"].map((language) => <option key={language}>{language}</option>)}</select></label>
              <label className="ca-field ca-field-full"><span>Certificate description / key message <b>*</b></span><textarea required rows={3} maxLength={1200} value={form.description} onChange={(e) => updateField("description", e.target.value)} placeholder="What should this certificate recognise? Mention skills, contribution, achievement, or completion…" /><small>{form.description.length}/1200 characters</small></label>
              <label className="ca-field"><span>Organisation name</span><input maxLength={160} value={form.organization} onChange={(e) => updateField("organization", e.target.value)} placeholder="PRISM AI · RNSIT" /></label>
              <label className="ca-field"><span>Signatory name</span><input maxLength={100} value={form.signatoryName} onChange={(e) => updateField("signatoryName", e.target.value)} placeholder="Name of authorised signatory" /></label>
              <label className="ca-field"><span>Signatory designation</span><input maxLength={120} value={form.signatoryTitle} onChange={(e) => updateField("signatoryTitle", e.target.value)} placeholder="e.g. Faculty Coordinator" /></label>
              <label className="ca-field"><span>Additional instructions for AI</span><input maxLength={800} value={form.instructions} onChange={(e) => updateField("instructions", e.target.value)} placeholder="e.g. Formal, concise, mention teamwork" /></label>
            </div>

            <div className="ca-theme-section"><div className="ca-theme-title"><div><h3>Choose a certificate theme</h3><p>Pick a visual style. You can change it later.</p></div><span className="ca-theme-current"><span style={{ background: activeTheme.accent }} />{activeTheme.label}</span></div><div className="ca-theme-grid">{themes.map((theme) => <button key={theme.id} type="button" className={`ca-theme-option ${form.theme === theme.id ? "is-selected" : ""}`} onClick={() => updateField("theme", theme.id)} aria-pressed={form.theme === theme.id}><span className="ca-theme-swatch" style={{ background: theme.paper, borderColor: theme.border }}><i style={{ background: theme.ink }} /><i style={{ background: theme.accent }} /><i style={{ background: theme.accent, opacity: 0.5 }} /></span><span>{theme.label}</span>{form.theme === theme.id && <Check size={15} />}</button>)}</div></div>

            {editing && <div className="ca-copy-editor"><div className="ca-copy-heading"><div><h3>Certificate wording</h3><p>Review and edit the AI-generated copy before downloading.</p></div><button className="ca-secondary-button ca-small-button" type="button" onClick={regenerateCopy} disabled={saving}><RefreshCw size={15} /> Regenerate with AI</button></div>
              <label className="ca-field"><span>Main title</span><input maxLength={900} value={form.title || ""} onChange={(e) => updateField("title", e.target.value)} placeholder="Certificate of Participation" /></label>
              <label className="ca-field"><span>Subtitle</span><input maxLength={900} value={form.subtitle || ""} onChange={(e) => updateField("subtitle", e.target.value)} placeholder="In recognition of your contribution" /></label>
              <label className="ca-field"><span>Certificate body</span><textarea rows={4} maxLength={1500} value={form.body || ""} onChange={(e) => updateField("body", e.target.value)} placeholder="Certificate body text…" /></label>
              <label className="ca-field"><span>Sign-off line</span><input maxLength={900} value={form.signoff || ""} onChange={(e) => updateField("signoff", e.target.value)} placeholder="Awarded in recognition of your effort" /></label>
              <div className="ca-token-help"><strong>Bulk personalisation tokens</strong><span>{"{{participantName}}"}</span><span>{"{{eventName}}"}</span><span>{"{{eventDate}}"}</span><span>{"{{award}}"}</span><span>{"{{team}}"}</span><small>Use these in the body or subtitle to insert participant-specific Excel values.</small></div>
            </div>}

            <div className="ca-form-actions"><button className="ca-secondary-button" type="button" onClick={closeEditor}>Cancel</button>{editing && <button className="ca-secondary-button" type="button" onClick={openPreview} disabled={previewLoading}>{previewLoading ? <LoaderCircle className="ca-spin" size={16} /> : <Eye size={16} />} Preview</button>}{editing && <button className="ca-primary-button" type="submit" disabled={saving}>{saving ? <LoaderCircle className="ca-spin" size={17} /> : <Save size={16} />} Save changes</button>}{!editing && <button className="ca-primary-button" type="submit" disabled={creating}>{creating ? <><LoaderCircle className="ca-spin" size={17} /> Creating draft…</> : <><Sparkles size={16} /> Generate with Sarvam AI <ArrowRight size={16} /></>}</button>}</div>
          </form>
        </section>}

        {creating && <div className="ca-generating-overlay" role="status" aria-live="polite"><div className="ca-generating-card"><div className="ca-generating-orbit"><span /><span /><Sparkles size={28} /></div><span className="ca-section-kicker">PRISM AI · CERTIFICATE STUDIO</span><h2>Creating your certificate</h2><p>{LOADING_LINES[loadingLine]}</p><div className="ca-progress-track"><span /></div><small>Writing and layout are being prepared. This may take a few moments.</small></div></div>}

        {editing && selected && showForm && <section className="ca-bulk-panel"><div className="ca-bulk-icon"><FileSpreadsheet size={23} /></div><div className="ca-bulk-copy"><span className="ca-section-kicker">BULK CERTIFICATE GENERATION</span><h2>One design. Every participant.</h2><p>Upload an Excel file and generate an individual PDF for each participant. The PDFs will be bundled into one ZIP file.</p><div className="ca-bulk-instructions"><strong>Excel columns</strong><span><b>Required:</b> Name</span><span><b>Optional:</b> Email, Award, EventDate / Date, Team</span></div><form className="ca-bulk-form" onSubmit={uploadBulk}><label className={`ca-file-drop ${excelFile ? "has-file" : ""}`}><Upload size={19} /><span><strong>{excelFile ? excelFile.name : "Choose participant spreadsheet"}</strong><small>{excelFile ? `${(excelFile.size / 1024).toFixed(0)} KB · .xlsx` : "Excel .xlsx only · max 5 MB"}</small></span><input type="file" accept=".xlsx,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" onChange={(e) => setExcelFile(e.target.files?.[0] || null)} /></label><button className="ca-primary-button" type="submit" disabled={bulkBusy || !excelFile}>{bulkBusy ? <><LoaderCircle className="ca-spin" size={17} /> Generating PDFs…</> : <><Download size={16} /> Generate and download ZIP</>}</button></form></div></section>}

        <section className="ca-library-section"><div className="ca-library-heading"><div><span className="ca-section-kicker">YOUR CERTIFICATE LIBRARY</span><h2>Saved certificates <span className="ca-count">{items.length}</span></h2><p>Your drafts stay here, ready to edit or reuse whenever you need them.</p></div><button className="ca-primary-button" type="button" onClick={startCreate}><Plus size={17} /> Create certificate</button></div>
          <div className="ca-library-toolbar"><label className="ca-search"><Search size={17} /><input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search by event or certificate type…" /><kbd>/</kbd></label><button className="ca-secondary-button" type="button" onClick={loadData}><RefreshCw size={15} /> Refresh</button></div>
          {loading ? <div className="ca-state-card"><LoaderCircle className="ca-spin" size={24} /><strong>Loading your certificate library…</strong></div> : filteredItems.length === 0 ? <div className="ca-empty-state"><div className="ca-empty-icon"><FileBadge size={30} /></div><h3>{search ? "No matching certificates" : "Your certificate studio is ready"}</h3><p>{search ? "Try another event name or clear your search." : "Create your first certificate, choose a theme, and let Sarvam help with the wording."}</p>{!search && <button className="ca-primary-button" type="button" onClick={startCreate}><Plus size={16} /> Create your first certificate</button>}</div> : <div className="ca-certificate-grid">{filteredItems.map((item) => { const cardTheme = themes.find((theme) => theme.id === item.theme) || FALLBACK_THEMES[0]; return <article className="ca-certificate-card" key={item.id}><button type="button" className="ca-card-preview-button" onClick={() => startEdit(item)} aria-label={`Edit ${item.eventName}`}><CertificateMiniPreview item={item} theme={cardTheme} /><span className="ca-card-preview-hint"><Eye size={14} /> Open editor</span></button><div className="ca-card-content"><div className="ca-card-meta"><span className="ca-status-pill"><span /> {item.status || "Draft"}</span><span>{formatDate(item.eventDate)}</span></div><h3>{item.eventName || "Untitled event"}</h3><p>{item.certificateType || "Certificate"} · {cardTheme.label}</p><div className="ca-card-actions"><button type="button" className="ca-secondary-button" onClick={() => startEdit(item)}><FileText size={15} /> Edit</button><button type="button" className="ca-secondary-button" onClick={() => openDownload(item, "pdf")}><Download size={15} /> Sample PDF</button><button type="button" className="ca-danger-icon" onClick={() => deleteCertificate(item)} aria-label={`Delete ${item.eventName}`} title="Delete draft"><Trash2 size={16} /></button></div></div></article>; })}</div>}
        </section>
        <footer className="ca-footer"><span><Sparkles size={14} /> Crafted for the PRISM AI community</span><span>AI-assisted wording · Human-approved certificates</span></footer>
      </div>

      {previewOpen && editing && <div className="ca-preview-modal" role="dialog" aria-modal="true" aria-label="Certificate preview"><div className="ca-preview-modal-header"><div><span className="ca-section-kicker">LIVE CERTIFICATE PREVIEW</span><h2>{form.eventName || "Certificate preview"}</h2></div><button className="ca-icon-button" type="button" onClick={() => setPreviewOpen(false)} aria-label="Close preview"><X size={19} /></button></div><iframe title="Certificate HTML preview" srcDoc={previewHtml} className="ca-preview-iframe" /><div className="ca-preview-modal-actions"><span>Save changes before previewing to ensure the latest wording appears.</span><button className="ca-primary-button" type="button" onClick={() => { setPreviewOpen(false); openDownload(selected || { id: editing, eventName: form.eventName }, "pdf"); }}><Download size={16} /> Download sample PDF</button></div></div>}
    </main>
  );
}
