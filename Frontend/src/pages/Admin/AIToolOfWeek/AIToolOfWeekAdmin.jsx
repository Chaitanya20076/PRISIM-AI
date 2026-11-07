import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowLeft, ArrowUpRight, BookOpen, Check, ChevronDown, CircleAlert,
  Clock3, ExternalLink, Eye, FilePlus2, Flame, Link2, LoaderCircle,
  Moon, Pencil, Plus, Save, Send, Sparkles, Sun, Trash2, WandSparkles, X
} from "lucide-react";
import "./AIToolOfWeekAdmin.css";

const API_BASE = (import.meta.env.VITE_API_BASE_URL || "http://localhost:5000").replace(/\/$/, "");
const API_URL = `${API_BASE}/api/ai-tool-of-week`;
const EMPTY_TOOL = {
  name: "", tagline: "", category: "Productivity", websiteUrl: "", logoUrl: "",
  overview: "", whyFeatured: "", keyFeatures: "", bestFor: "", pricing: "",
  pros: "", cons: "", howToUse: "", examplePrompts: "", tags: "",
  githubUrl: "", documentationUrl: "", videoUrl: "", newsletterUrl: "",
  theme: "ember", accentColor: "#E43D12", surfaceColor: "#EBE9E1", textColor: "#262321",
  sections: []
};
const THEMES = [
  { id: "ember", label: "Ember", accent: "#E43D12", surface: "#EBE9E1", text: "#262321" },
  { id: "midnight", label: "Midnight Ember", accent: "#E43D12", surface: "#252321", text: "#F7F3ED" },
  { id: "sand", label: "Warm Sand", accent: "#6E3562", surface: "#EBE9E1", text: "#262321" },
  { id: "custom", label: "Custom colours", accent: "#E43D12", surface: "#EBE9E1", text: "#262321" },
];

function Field({ label, hint, children, className = "" }) {
  return <label className={`aotw-field ${className}`}><span className="aotw-label">{label}</span>{children}{hint && <small>{hint}</small>}</label>;
}
function Input({ value, onChange, placeholder, type = "text" }) {
  return <input type={type} value={value ?? ""} onChange={onChange} placeholder={placeholder || ""} />;
}
function Textarea({ value, onChange, placeholder, rows = 4 }) {
  return <textarea value={value ?? ""} onChange={onChange} placeholder={placeholder || ""} rows={rows} />;
}
function asList(value) {
  return String(value || "").split(/\n|,/).map((v) => v.trim()).filter(Boolean);
}
function dateLabel(value) {
  if (!value) return "Not published yet";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "Recently updated" : date.toLocaleString(undefined, { day: "numeric", month: "short", year: "numeric", hour: "numeric", minute: "2-digit" });
}

export default function AIToolOfWeekAdmin() {
  const navigate = useNavigate();
  const [dark, setDark] = useState(() => localStorage.getItem("prism-aotw-admin-theme") === "dark");
  const [tool, setTool] = useState(EMPTY_TOOL);
  const [published, setPublished] = useState(null);
  const [weekStatus, setWeekStatus] = useState({ canCreate: true, publishedThisWeek: false, weekEndsAt: null });
  const [mode, setMode] = useState("overview");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [preview, setPreview] = useState(false);

  useEffect(() => { localStorage.setItem("prism-aotw-admin-theme", dark ? "dark" : "light"); }, [dark]);
  const load = useCallback(async () => {
    setLoading(true); setError("");
    try {
      const response = await fetch(`${API_URL}/admin`, { headers: { Accept: "application/json" } });
      if (!response.ok) throw new Error((await response.json().catch(() => ({}))).message || `Unable to load tool (${response.status})`);
      const data = await response.json();
      setPublished(data.published || null);
      setWeekStatus(data.weekStatus || { canCreate: !data.published, publishedThisWeek: false, weekEndsAt: null });
      if (data.draft) setTool({ ...EMPTY_TOOL, ...data.draft, sections: Array.isArray(data.draft.sections) ? data.draft.sections : [] });
      else if (data.published) setTool({ ...EMPTY_TOOL, ...data.published, sections: Array.isArray(data.published.sections) ? data.published.sections : [] });
      else setTool(EMPTY_TOOL);
    } catch (e) {
      setError(`${e.message}. Make sure the backend is running and the AI Tool of the Week route is mounted.`);
    } finally { setLoading(false); }
  }, []);
  useEffect(() => { load(); }, [load]);

  const update = (key, value) => setTool((old) => ({ ...old, [key]: value }));
  const selectTheme = (theme) => {
    const preset = THEMES.find((item) => item.id === theme);
    setTool((old) => ({ ...old, theme, ...(theme !== "custom" && preset ? { accentColor: preset.accent, surfaceColor: preset.surface, textColor: preset.text } : {}) }));
  };
  const addSection = () => update("sections", [...(tool.sections || []), { id: `${Date.now()}-${Math.random().toString(16).slice(2)}`, title: "", content: "" }]);
  const updateSection = (id, key, value) => update("sections", (tool.sections || []).map((s) => s.id === id ? { ...s, [key]: value } : s));
  const removeSection = (id) => update("sections", (tool.sections || []).filter((s) => s.id !== id));
  const saveDraft = async () => {
    setSaving(true); setError(""); setMessage("");
    try {
      const response = await fetch(`${API_URL}/draft`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ...tool, updatedAt: new Date().toISOString() }) });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || "Could not save draft");
      setTool({ ...EMPTY_TOOL, ...(data.draft || tool) }); setMessage("Draft saved to the backend.");
    } catch (e) { setError(e.message); }
    finally { setSaving(false); }
  };
  const publish = async () => {
    if (!tool.name.trim()) { setError("Add the AI tool's name before publishing."); return; }
    if (!tool.overview.trim()) { setError("Add an overview before publishing."); return; }
    if (!published && !weekStatus.canCreate) { setError("A tool has already been published this week. You can edit that tool, but a new tool can be published next week."); return; }
    if (!window.confirm(published ? "Republish your updated AI Tool of the Week?" : "Publish this week's AI Tool of the Week?")) return;
    setSaving(true); setError(""); setMessage("");
    try {
      const response = await fetch(`${API_URL}/publish`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(tool) });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || "Could not publish tool");
      setPublished(data.published); setTool({ ...EMPTY_TOOL, ...data.published }); setWeekStatus(data.weekStatus || { canCreate: false, publishedThisWeek: true });
      setMode("overview"); setMessage("AI Tool of the Week published successfully!");
    } catch (e) { setError(e.message); }
    finally { setSaving(false); }
  };
  const startNew = () => {
    if (!weekStatus.canCreate) return;
    setTool(EMPTY_TOOL); setMode("editor"); setMessage(""); setError("");
  };
  const startEdit = () => { setTool({ ...EMPTY_TOOL, ...(published || tool), sections: [...((published || tool).sections || [])] }); setMode("editor"); setError(""); setMessage(""); };
  const themeStyle = useMemo(() => ({ "--aotw-accent": tool.accentColor || "#E43D12", "--aotw-surface": tool.surfaceColor || "#EBE9E1", "--aotw-ink": tool.textColor || "#262321" }), [tool.accentColor, tool.surfaceColor, tool.textColor]);

  const renderPreview = () => <div className="aotw-preview-card" style={themeStyle}>
    <div className="aotw-preview-top"><span className="aotw-week-chip"><Flame size={14} /> AI TOOL OF THE WEEK</span><span className="aotw-preview-category">{tool.category || "Category"}</span></div>
    <div className="aotw-preview-title-row">{tool.logoUrl ? <img className="aotw-logo" src={tool.logoUrl} alt="Tool logo" onError={(e) => { e.currentTarget.style.display = "none"; }} /> : <div className="aotw-logo-placeholder"><Sparkles /></div>}<div><h2>{tool.name || "Your AI tool name"}</h2><p>{tool.tagline || "A short, memorable description of the tool."}</p></div></div>
    <p className="aotw-preview-overview">{tool.overview || "Your tool overview will appear here."}</p>
    {asList(tool.tags).length > 0 && <div className="aotw-tags">{asList(tool.tags).map((tag) => <span key={tag}>{tag}</span>)}</div>}
    <div className="aotw-preview-link-row">{tool.websiteUrl && <span><ExternalLink size={15} /> Official website</span>}{tool.documentationUrl && <span><BookOpen size={15} /> Documentation</span>}</div>
    {tool.whyFeatured && <div className="aotw-preview-section"><h3>Why we picked it</h3><p>{tool.whyFeatured}</p></div>}
    {tool.keyFeatures && <div className="aotw-preview-section"><h3>Key features</h3><ul>{asList(tool.keyFeatures).map((x) => <li key={x}>{x}</li>)}</ul></div>}
    {(tool.sections || []).filter((s) => s.title || s.content).map((section) => <div className="aotw-preview-section" key={section.id}><h3>{section.title || "Custom section"}</h3><p>{section.content}</p></div>)}
  </div>;

  return <div className={`aotw-admin ${dark ? "aotw-dark" : "aotw-light"}`}>
    <header className="aotw-header"><button className="aotw-back" onClick={() => navigate("/admin/dashboard")}><ArrowLeft size={17} /><span>Back to dashboard</span></button><div className="aotw-brand"><div className="aotw-brand-icon"><Flame size={20} /></div><div><strong>AI Tool of the Week</strong><small>PRISM AI · Editorial workspace</small></div></div><button className="aotw-theme-toggle" onClick={() => setDark((v) => !v)} aria-label="Toggle dark mode">{dark ? <Sun size={18} /> : <Moon size={18} />}<span>{dark ? "Light mode" : "Dark mode"}</span></button></header>
    <main className="aotw-main">
      <section className="aotw-page-intro"><div><div className="aotw-eyebrow"><Sparkles size={15} /> WEEKLY SPOTLIGHT</div><h1>Discover one AI tool.<br /><em>Make it count.</em></h1><p>Curate one useful AI tool each week for the PRISM AI community. Publish once, then refine that week's feature as needed.</p></div><div className="aotw-intro-mark"><WandSparkles size={42} /><span>01 / WEEK</span></div></section>
      {error && <div className="aotw-alert aotw-alert-error"><CircleAlert size={18} /><span>{error}</span><button onClick={() => setError("")} aria-label="Dismiss error"><X size={16} /></button></div>}
      {message && <div className="aotw-alert aotw-alert-success"><Check size={18} /><span>{message}</span><button onClick={() => setMessage("")} aria-label="Dismiss message"><X size={16} /></button></div>}
      {loading ? <div className="aotw-loading"><LoaderCircle className="aotw-spin" size={25} /> Loading weekly tool from backend…</div> : <>
        {mode === "overview" && <>
          <section className="aotw-status-strip"><div className="aotw-status-icon"><Clock3 size={20} /></div><div><strong>{weekStatus.publishedThisWeek ? "This week's spotlight is published" : published ? "Previous spotlight is available" : "This week's slot is open"}</strong><p>{weekStatus.publishedThisWeek ? "A new tool is locked until the next weekly cycle. You can still edit and republish the current tool." : "Create and publish one AI tool for this week's spotlight."}</p></div><span className={`aotw-status-pill ${weekStatus.publishedThisWeek ? "is-live" : "is-open"}`}>{weekStatus.publishedThisWeek ? "Published" : "Open slot"}</span></section>
          {published ? <section className="aotw-current-layout"><div className="aotw-current-card"><div className="aotw-current-card-top"><span className="aotw-live-pill"><span /> PUBLISHED TOOL</span><span className="aotw-current-category">{published.category || "AI Tool"}</span></div><div className="aotw-current-title-row">{published.logoUrl ? <img src={published.logoUrl} alt="" className="aotw-logo" onError={(e) => { e.currentTarget.style.display = "none"; }} /> : <div className="aotw-logo-placeholder"><Sparkles /></div>}<div><h2>{published.name}</h2><p>{published.tagline}</p></div></div><p className="aotw-current-overview">{published.overview}</p><div className="aotw-current-meta"><span><Clock3 size={15} /> Published {dateLabel(published.publishedAt)}</span><span><Pencil size={15} /> Updated {dateLabel(published.updatedAt || published.publishedAt)}</span></div><div className="aotw-current-actions"><button className="aotw-primary-btn" onClick={startEdit}><Pencil size={16} /> Edit and republish</button>{published.websiteUrl && <a className="aotw-secondary-btn" href={published.websiteUrl} target="_blank" rel="noreferrer"><ExternalLink size={16} /> Visit tool</a>}<button className="aotw-secondary-btn" onClick={() => setPreview(true)}><Eye size={16} /> Preview</button></div></div><aside className="aotw-side-note"><div className="aotw-side-note-icon"><Flame size={22} /></div><h3>One tool per week</h3><p>Once this week's tool is published, the new-tool action is locked. Edit the existing feature and republish it whenever you need to correct or improve its details.</p><div className="aotw-side-divider" /><span className="aotw-updated-label">LAST UPDATED</span><strong>{dateLabel(published.updatedAt || published.publishedAt)}</strong></aside></section> : <section className="aotw-empty-state"><div className="aotw-empty-graphic"><div className="aotw-empty-orbit orbit-one"/><div className="aotw-empty-orbit orbit-two"/><div className="aotw-empty-core"><Sparkles size={31} /></div></div><span className="aotw-eyebrow">YOUR WEEKLY SPOTLIGHT</span><h2>No tool published yet</h2><p>Choose a useful AI tool, add the details and publish it for the PRISM AI community. You can save a draft before publishing.</p><button className="aotw-primary-btn" onClick={startNew} disabled={!weekStatus.canCreate}><Plus size={17} /> Create this week's tool</button></section>}
          {published && !weekStatus.canCreate && <div className="aotw-lock-note"><Clock3 size={16} /> New tool creation unlocks when the next weekly cycle begins. Editing the current published tool remains available.</div>}
        </>}
        {mode === "editor" && <section className="aotw-editor-shell"><div className="aotw-editor-heading"><div><button className="aotw-text-back" onClick={() => setMode("overview")}><ArrowLeft size={15} /> Back to overview</button><h2>{published ? "Edit this week's tool" : "Create this week's tool"}</h2><p>Fill in what you know. Only the tool name and overview are required to publish.</p></div><button className="aotw-preview-btn" onClick={() => setPreview(true)}><Eye size={16} /> Preview</button></div>
          <div className="aotw-editor-grid"><div className="aotw-form-column">
            <section className="aotw-form-card"><div className="aotw-form-card-heading"><span>01</span><div><h3>Tool identity</h3><p>What should people know at first glance?</p></div></div><div className="aotw-form-grid"><Field label="AI tool name *"><Input value={tool.name} onChange={(e) => update("name", e.target.value)} placeholder="e.g. Perplexity AI" /></Field><Field label="Category"><select value={tool.category} onChange={(e) => update("category", e.target.value)}>{["Productivity", "Research", "Writing", "Coding", "Design", "Education", "Automation", "Image generation", "Video", "Audio", "Data & analytics", "Business", "Other"].map((x) => <option key={x}>{x}</option>)}</select></Field>{tool.category === "Other" && <Field label="Custom category"><Input value={tool.customCategory || ""} onChange={(e) => update("customCategory", e.target.value)} placeholder="Enter category" /></Field>}<Field label="Tagline" className="aotw-span-2"><Input value={tool.tagline} onChange={(e) => update("tagline", e.target.value)} placeholder="A short, punchy description" /></Field><Field label="Official website URL"><Input type="url" value={tool.websiteUrl} onChange={(e) => update("websiteUrl", e.target.value)} placeholder="https://..." /></Field><Field label="Logo / image URL"><Input type="url" value={tool.logoUrl} onChange={(e) => update("logoUrl", e.target.value)} placeholder="https://... (optional)" /></Field><Field label="Tags (comma separated)" className="aotw-span-2"><Input value={tool.tags} onChange={(e) => update("tags", e.target.value)} placeholder="AI search, research, free tier" /></Field></div></section>
            <section className="aotw-form-card"><div className="aotw-form-card-heading"><span>02</span><div><h3>The story</h3><p>Explain what it does and why it's worth trying.</p></div></div><div className="aotw-form-grid"><Field label="Overview *" className="aotw-span-2"><Textarea value={tool.overview} onChange={(e) => update("overview", e.target.value)} placeholder="What is this tool? What problem does it solve?" rows={5} /></Field><Field label="Why we picked it" className="aotw-span-2"><Textarea value={tool.whyFeatured} onChange={(e) => update("whyFeatured", e.target.value)} placeholder="What makes it stand out this week?" /></Field><Field label="Key features" hint="Use a new line or comma for each feature." className="aotw-span-2"><Textarea value={tool.keyFeatures} onChange={(e) => update("keyFeatures", e.target.value)} placeholder={'Web research with citations\nSummarises long documents\nWorks across devices'} /></Field><Field label="Best for"><Textarea value={tool.bestFor} onChange={(e) => update("bestFor", e.target.value)} placeholder="Who will benefit most?" rows={3} /></Field><Field label="Pricing"><Textarea value={tool.pricing} onChange={(e) => update("pricing", e.target.value)} placeholder="Free plan, paid tiers, student access…" rows={3} /></Field><Field label="Pros" hint="One per line or comma separated."><Textarea value={tool.pros} onChange={(e) => update("pros", e.target.value)} placeholder="What does it do well?" rows={3} /></Field><Field label="Limitations / cons"><Textarea value={tool.cons} onChange={(e) => update("cons", e.target.value)} placeholder="What should users know?" rows={3} /></Field></div></section>
            <section className="aotw-form-card"><div className="aotw-form-card-heading"><span>03</span><div><h3>Try it yourself</h3><p>Help students get started quickly.</p></div></div><div className="aotw-form-grid"><Field label="How to use it" className="aotw-span-2"><Textarea value={tool.howToUse} onChange={(e) => update("howToUse", e.target.value)} placeholder="A quick step-by-step guide…" rows={5} /></Field><Field label="Example prompts" className="aotw-span-2"><Textarea value={tool.examplePrompts} onChange={(e) => update("examplePrompts", e.target.value)} placeholder={'Give me 5 examples of…\nCompare these options and explain…'} rows={4} /></Field><Field label="GitHub / source code URL"><Input type="url" value={tool.githubUrl} onChange={(e) => update("githubUrl", e.target.value)} placeholder="https://github.com/..." /></Field><Field label="Documentation URL"><Input type="url" value={tool.documentationUrl} onChange={(e) => update("documentationUrl", e.target.value)} placeholder="https://docs..." /></Field><Field label="Video tutorial URL"><Input type="url" value={tool.videoUrl} onChange={(e) => update("videoUrl", e.target.value)} placeholder="https://youtube.com/..." /></Field><Field label="Related post / resource URL"><Input type="url" value={tool.newsletterUrl} onChange={(e) => update("newsletterUrl", e.target.value)} placeholder="https://..." /></Field></div></section>
            <section className="aotw-form-card"><div className="aotw-form-card-heading"><span>04</span><div><h3>Custom sections</h3><p>Add any extra information that makes this tool more useful.</p></div><button className="aotw-add-section-btn" onClick={addSection}><Plus size={15} /> Add section</button></div>{(tool.sections || []).length === 0 ? <div className="aotw-no-sections">No custom sections yet. Add one for comparisons, examples, use cases, tips, or anything else.</div> : <div className="aotw-custom-sections">{tool.sections.map((section, i) => <div className="aotw-custom-section" key={section.id}><div className="aotw-custom-section-top"><strong>Section {i + 1}</strong><button onClick={() => removeSection(section.id)} aria-label="Remove section"><Trash2 size={16} /></button></div><Field label="Section title"><Input value={section.title} onChange={(e) => updateSection(section.id, "title", e.target.value)} placeholder="e.g. Best use cases" /></Field><Field label="Section content"><Textarea value={section.content} onChange={(e) => updateSection(section.id, "content", e.target.value)} placeholder="Write your section content…" rows={4} /></Field></div>)}</div>}</section>
            <section className="aotw-form-card"><div className="aotw-form-card-heading"><span>05</span><div><h3>Visual theme</h3><p>Choose the card's visual direction. The page also adapts to admin light/dark mode.</p></div></div><div className="aotw-theme-choices">{THEMES.map((t) => <button key={t.id} className={`aotw-theme-choice ${tool.theme === t.id ? "selected" : ""}`} onClick={() => selectTheme(t.id)}><span className="aotw-theme-swatch" style={{ background: t.surface, color: t.text }}><i style={{ background: t.accent }} /></span><span>{t.label}</span>{tool.theme === t.id && <Check size={15} />}</button>)}</div>{tool.theme === "custom" && <div className="aotw-color-grid"><Field label="Accent colour"><div className="aotw-color-input"><input type="color" value={tool.accentColor || "#E43D12"} onChange={(e) => update("accentColor", e.target.value)} /><Input value={tool.accentColor} onChange={(e) => update("accentColor", e.target.value)} /></div></Field><Field label="Card background"><div className="aotw-color-input"><input type="color" value={tool.surfaceColor || "#EBE9E1"} onChange={(e) => update("surfaceColor", e.target.value)} /><Input value={tool.surfaceColor} onChange={(e) => update("surfaceColor", e.target.value)} /></div></Field><Field label="Text colour"><div className="aotw-color-input"><input type="color" value={tool.textColor || "#262321"} onChange={(e) => update("textColor", e.target.value)} /><Input value={tool.textColor} onChange={(e) => update("textColor", e.target.value)} /></div></Field></div>}</section>
          </div><aside className="aotw-editor-preview"><div className="aotw-sticky-preview-head"><div><span className="aotw-eyebrow">LIVE PREVIEW</span><h3>Published card</h3></div><button onClick={() => setPreview(true)} aria-label="Open full preview"><ArrowUpRight size={17} /></button></div>{renderPreview()}<div className="aotw-preview-hint"><Eye size={16} /><span>Preview updates as you type. Empty optional fields won't be shown on the public page.</span></div></aside></div>
          <div className="aotw-editor-footer"><button className="aotw-secondary-btn" onClick={() => setMode("overview")}><X size={16} /> Cancel</button><div><button className="aotw-secondary-btn" onClick={saveDraft} disabled={saving}><Save size={16} /> Save draft</button><button className="aotw-primary-btn" onClick={publish} disabled={saving || (!published && !weekStatus.canCreate)}>{saving ? <LoaderCircle className="aotw-spin" size={16} /> : <Send size={16} />}{saving ? " Saving…" : published ? " Republish tool" : " Publish this week"}</button></div></div>
        </section>}
      </>}
    </main>
    {preview && <div className="aotw-modal-backdrop" role="presentation" onClick={() => setPreview(false)}><div className="aotw-modal" role="dialog" aria-modal="true" aria-label="AI Tool of the Week preview" onClick={(e) => e.stopPropagation()}><div className="aotw-modal-head"><div><span className="aotw-eyebrow">PREVIEW</span><h2>{tool.name || "AI Tool of the Week"}</h2></div><button onClick={() => setPreview(false)} aria-label="Close preview"><X /></button></div>{renderPreview()}<div className="aotw-modal-footer"><button className="aotw-secondary-btn" onClick={() => setPreview(false)}>Close preview</button>{mode === "overview" && <button className="aotw-primary-btn" onClick={() => { setPreview(false); startEdit(); }}><Pencil size={15} /> Edit tool</button>}</div></div></div>}
  </div>;
}
