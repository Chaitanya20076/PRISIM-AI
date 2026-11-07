import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  Plus, Search, SlidersHorizontal, Trash2, Pencil, ExternalLink, ClipboardList, Eye, Mail, Phone, Check, X,
  ArrowUpRight,
  CalendarDays,
  Clock3,
  MapPin,
  ImagePlus,
  Users,
  CircleDollarSign,
  CheckCircle2,
  FileText,
  Sparkles,
} from "lucide-react";
import "./seminar.css";

const initialForm = {
  title: "",
  tagline: "",
  description: "",
  date: "",
  startTime: "",
  endTime: "",
  mode: "In-person",
  venue: "",
  platformLink: "",
  instructor: "",
  audience: "RNSIT students",
  capacity: "",
  registrationDeadline: "",
  feeType: "Free",
  feeAmount: "",
  registrationLink: "",
  contactName: "",
  contactEmail: "",
  outcomes: "",
  prerequisites: "",
  rewardPoints: 0,
};

const API_BASE_URL = (import.meta.env.VITE_API_URL || import.meta.env.VITE_API_BASE_URL || "http://localhost:5000").replace(/\/$/, "");
const ADMIN_TOKEN_KEY = "prism-admin-token";

async function adminApi(path, options = {}) {
  const token = sessionStorage.getItem(ADMIN_TOKEN_KEY);
  if (!token) throw new Error("Your admin session has expired. Please sign in again.");

  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
      ...(options.headers || {}),
    },
  });

  const data = await response.json().catch(() => ({}));
  if (!response.ok || data.success === false) {
    if (response.status === 401) {
      sessionStorage.removeItem(ADMIN_TOKEN_KEY);
      throw new Error("Your admin session has expired. Please sign in again.");
    }
    throw new Error(data.message || `Request failed (${response.status}).`);
  }
  return data;
}

function formatSeminarDate(value) {
  if (!value) return "Date to be announced";
  const date = new Date(`${value}T12:00:00`);
  return Number.isNaN(date.getTime()) ? value : date.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
}

function seminarIsPast(item) {
  const value = item.endDate || item.startDate || item.date;
  if (!value) return false;
  const date = new Date(`${value}T23:59:59`);
  return !Number.isNaN(date.getTime()) && date.getTime() < Date.now();
}

function isSeminarRecord(item) {
  const types = [item.type, item.category, item.customCategory]
    .filter(Boolean)
    .map((value) => String(value).trim().toLowerCase());

  const nonSeminarTypes = [
    "workshop",
    "webinar",
    "bootcamp",
    "competition",
    "contest",
    "ideathon",
  ];

  // Never classify a different event category as a seminar.
  if (types.some((type) => nonSeminarTypes.includes(type))) return false;
  if (types.includes("seminar")) return true;

  // Backward compatibility for older seminar records without type fields.
  const slug = String(item.slug || item.id || "").trim().toLowerCase();
  return slug.startsWith("seminar-") || slug.startsWith("seminar:");
}

export default function Seminar() {
  // Hooks must be called inside the component.
  const navigate = useNavigate();
  const [view, setView] = useState("list");
  const [seminars, setSeminars] = useState([]);
  const [loadingSeminars, setLoadingSeminars] = useState(true);
  const [saving, setSaving] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("All seminars");
  const [editingId, setEditingId] = useState(null);

  const refreshSeminars = async () => {
    setLoadingSeminars(true);
    try {
      const data = await adminApi("/api/admin/events");
      const allEvents = Array.isArray(data.events) ? data.events : [];
      setSeminars(allEvents.filter(isSeminarRecord));
    } catch (error) {
      console.error("Could not load seminars:", error);
      window.alert(error.message || "Could not load seminars from the server.");
    } finally {
      setLoadingSeminars(false);
    }
  };

  useEffect(() => {
    refreshSeminars();
    // The list is refreshed from Firestore when the page opens.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const filteredSeminars = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return seminars.filter((item) => {
      const status = String(item.status || "Draft").toLowerCase();
      const name = String(item.title || item.name || "").toLowerCase();
      const matchesQuery = !q || name.includes(q) || status.includes(q);
      const matchesStatus = statusFilter === "All seminars" ||
        (statusFilter === "Published" && status === "published") ||
        (statusFilter === "Drafts" && status === "draft") ||
        (statusFilter === "Past" && (status === "past" || seminarIsPast(item)));
      return matchesQuery && matchesStatus;
    }).sort((a,b) => String(b.updatedAt || b.createdAt || "").localeCompare(String(a.updatedAt || a.createdAt || "")));
  }, [seminars, searchQuery, statusFilter]);

  const startCreate = () => {
    setEditingId(null);
    setForm(initialForm);
    setPosterName("");
    setPosterData("");
    setRegistrationFields([
      { id: "full-name", label: "Full name", type: "text", required: true, options: "", helpText: "As on your college ID" },
      { id: "email", label: "Email address", type: "email", required: true, options: "", helpText: "Use an email you check regularly" },
      { id: "phone", label: "Phone number", type: "tel", required: true, options: "", helpText: "" },
      { id: "college", label: "College / institution", type: "text", required: true, options: "", helpText: "" },
      { id: "course-year", label: "Course and year", type: "text", required: true, options: "", helpText: "Example: CSE, 2nd year" },
    ]);
    setSaved(false);
    setActiveTab("details");
    setView("editor");
  };

  const editSeminar = async (item) => {
    try {
      const data = await adminApi(`/api/admin/events/${encodeURIComponent(item.id)}`);
      const fullItem = data.event || item;
      if (!isSeminarRecord(fullItem)) {
        window.alert("This event is not a Seminar. Open it from the correct event category.");
        return;
      }
      setEditingId(fullItem.id);
      setForm({ ...initialForm, ...fullItem, title: fullItem.title || fullItem.name || "", tagline: fullItem.tagline || fullItem.caption || "", date: fullItem.date || fullItem.startDate || "", outcomes: fullItem.outcomes || fullItem.learningOutcomes || (Array.isArray(fullItem.highlights) ? fullItem.highlights.join("\n") : "") });
      setPosterName(fullItem.posterName || fullItem.photos?.[0]?.name || "");
      setPosterData(fullItem.coverImage || fullItem.photos?.[0]?.data || "");
      if (Array.isArray(fullItem.registrationFields) && fullItem.registrationFields.length) setRegistrationFields(fullItem.registrationFields);
      else setRegistrationFields([]);
      setRegistrationConsent(fullItem.registrationConsent || "I confirm that the information provided is accurate and may be used by PRISM AI to manage this seminar registration.");
      setRequireApproval(Boolean(fullItem.requireApproval));
      setWaitlistEnabled(Boolean(fullItem.waitlistEnabled));
      setSeminars((current) => current.map((entry) => entry.id === fullItem.id ? fullItem : entry));
      setSaved(false);
      setActiveTab("details");
      setView("editor");
    } catch (error) {
      console.error("Could not load seminar:", error);
      window.alert(error.message || "Could not load this seminar.");
    }
  };

  const deleteSeminar = async (item) => {
    if (!window.confirm(`Delete "${item.title || item.name}" and all its registrations from Firestore?`)) return;
    try {
      await adminApi(`/api/admin/events/${encodeURIComponent(item.id)}`, { method: "DELETE" });
      setSeminars((current) => current.filter((entry) => entry.id !== item.id));
    } catch (error) {
      console.error("Could not delete seminar:", error);
      window.alert(error.message || "Could not delete this seminar.");
    }
  };

  const [form, setForm] = useState(initialForm);
  const [posterName, setPosterName] = useState("");
  const [posterData, setPosterData] = useState("");
  const [saved, setSaved] = useState(false);
  const [savedStatus, setSavedStatus] = useState("Draft");
  const [activeTab, setActiveTab] = useState("details");
  const [registrationFields, setRegistrationFields] = useState([
    { id: "full-name", label: "Full name", type: "text", required: true, options: "", helpText: "As on your college ID" },
    { id: "email", label: "Email address", type: "email", required: true, options: "", helpText: "Use an email you check regularly" },
    { id: "phone", label: "Phone number", type: "tel", required: true, options: "", helpText: "" },
    { id: "college", label: "College / institution", type: "text", required: true, options: "", helpText: "" },
    { id: "course-year", label: "Course and year", type: "text", required: true, options: "", helpText: "Example: CSE, 2nd year" },
  ]);
  const [registrationConsent, setRegistrationConsent] = useState("I confirm that the information provided is accurate and may be used by PRISM AI to manage this seminar registration.");
  const [requireApproval, setRequireApproval] = useState(false);
  const [waitlistEnabled, setWaitlistEnabled] = useState(false);

  const addQuestion = () => {
    setRegistrationFields((fields) => [...fields, { id: `question-${Date.now()}`, label: "", type: "text", required: false, options: "", helpText: "" }]);
    setSaved(false);
  };
  const updateQuestion = (id, key, value) => {
    setRegistrationFields((fields) => fields.map((field) => field.id === id ? { ...field, [key]: value } : field));
    setSaved(false);
  };
  const removeQuestion = (id) => {
    setRegistrationFields((fields) => fields.filter((field) => field.id !== id));
    setSaved(false);
  };
  const moveQuestion = (index, direction) => {
    setRegistrationFields((fields) => {
      const next = [...fields];
      const target = index + direction;
      if (target < 0 || target >= next.length) return fields;
      [next[index], next[target]] = [next[target], next[index]];
      return next;
    });
    setSaved(false);
  };

  const update = (event) => {
    const { name, value } = event.target;

    setForm((current) => ({
      ...current,
      [name]: value,
    }));

    setSaved(false);
  };

  const activeSeminar = seminars.find((item) => item.id === editingId);
  const activeRegistrations = Array.isArray(activeSeminar?.registrations) ? activeSeminar.registrations : [];

  const updateRegistrationStatus = async (registrationId, nextStatus) => {
    if (!editingId) return;
    try {
      await adminApi(`/api/admin/events/${encodeURIComponent(editingId)}/registrations/${encodeURIComponent(registrationId)}`, {
        method: "PATCH",
        body: JSON.stringify({ status: nextStatus }),
      });
      const data = await adminApi(`/api/admin/events/${encodeURIComponent(editingId)}`);
      const updatedEvent = data.event;
      setSeminars((current) => current.map((item) => item.id === editingId ? updatedEvent : item));
    } catch (error) {
      console.error("Could not update registration status:", error);
      window.alert(error.message || "Could not update this registration.");
    }
  };

  const submit = async (event) => {
    event.preventDefault();

    const status = event.nativeEvent.submitter?.value || "Draft";
    const now = new Date().toISOString();
    const id = editingId || `seminar-${Date.now()}`;

    const seminar = {
      ...form,
      id,
      slug: id,
      name: form.title,
      title: form.title,
      category: "Seminar",
      customCategory: "Seminar",
      caption: form.tagline,
      startDate: form.date,
      endDate: form.date,
      coverImage: posterData,
      // Keep image data in one field only to avoid duplicating it in Firestore.
      photos: posterData ? [{ name: posterName }] : [],
      highlights: form.outcomes.split("\n").map((item) => item.trim()).filter(Boolean),
      learningOutcomes: form.outcomes,
      prerequisites: form.prerequisites,
      eventFormat: form.mode,
      audience: form.audience,
      rewardPoints: Math.max(0, Math.floor(Number(form.rewardPoints) || 0)),
      onPlatformRegistration: !form.registrationLink,
      registrationType: form.registrationLink ? "external" : "platform",
      registrationFields: registrationFields.filter((field) => field.label.trim()),
      registrationConsent,
      requireApproval,
      waitlistEnabled,
      visibility: "Public",
      type: "Seminar",
      posterName,
      status,
      updatedAt: now,
    };

    setSaving(true);
    try {
      const data = await adminApi(
        editingId ? `/api/admin/events/${encodeURIComponent(id)}` : "/api/admin/events",
        {
          method: editingId ? "PUT" : "POST",
          body: JSON.stringify(seminar),
        }
      );
      const savedEvent = data.event;
      setEditingId(savedEvent.id);
      setSeminars((current) => {
        const exists = current.some((item) => item.id === savedEvent.id);
        return exists
          ? current.map((item) => item.id === savedEvent.id ? savedEvent : item)
          : [savedEvent, ...current];
      });
      setSavedStatus(status);
      setSaved(true);
      if (status === "Published") setView("list");
    } catch (error) {
      console.error("Could not save seminar to Firestore:", error);
      window.alert(error.message || "Could not save the seminar to Firestore.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <main className="seminar-page">
      <div className="seminar-shell">
        <button
          type="button"
          className="seminar-back"
          onClick={() => view === "editor" ? setView("list") : navigate("/admin/host")}
        >
          <ArrowLeft size={17} />
          {view === "editor" ? "Back to seminars" : "Back to event types"}
        </button>

        {view === "list" ? (
          <>
            <header className="seminar-admin-hero">
              <div className="seminar-hero-copy">
                <span className="seminar-eyebrow"><Sparkles size={14}/> SEMINARS / ORGANIZER STUDIO</span>
                <h1>Make learning <span>happen.</span></h1>
                <p>Create seminars, manage published events and drafts, and configure each seminar's registration experience from one workspace.</p>
              </div>
              <button type="button" className="seminar-create-button" onClick={startCreate}><Plus size={18}/> Create seminar <ArrowUpRight size={17}/></button>
            </header>
            <section className="seminar-admin-stats">
              <div className="seminar-stat-card seminar-stat-card--violet"><span>All seminars</span><strong>{seminars.length}</strong></div>
              <div className="seminar-stat-card seminar-stat-card--mint"><span>Published</span><strong>{seminars.filter((item) => String(item.status).toLowerCase() === "published").length}</strong></div>
              <div className="seminar-stat-card seminar-stat-card--gold"><span>Drafts</span><strong>{seminars.filter((item) => String(item.status).toLowerCase() === "draft").length}</strong></div>
              <div className="seminar-stat-card seminar-stat-card--blue"><span>Registration open</span><strong>{seminars.filter((item) => String(item.status).toLowerCase() === "published" && !seminarIsPast(item) && !(item.registrationDeadline && new Date(`${item.registrationDeadline}T23:59:59`) < new Date())).length}</strong></div>
            </section>
            <section className="seminar-admin-list-section">
              <div className="seminar-list-heading">
                <div><h2>Your seminars</h2><p>Each seminar has its own public page, registration questions and submissions.</p></div>
                <label className="seminar-search"><span>SEARCH</span><div><Search size={16}/><input value={searchQuery} onChange={(event) => setSearchQuery(event.target.value)} placeholder="Name or status..."/></div></label>
              </div>
              <div className="seminar-list-toolbar"><div className="seminar-list-filters">{["All seminars", "Published", "Drafts", "Past"].map((value) => <button type="button" key={value} className={statusFilter === value ? "active" : ""} onClick={() => setStatusFilter(value)}>{value}</button>)}</div><span><SlidersHorizontal size={15}/> {filteredSeminars.length} seminar{filteredSeminars.length === 1 ? "" : "s"}</span></div>
              {loadingSeminars ? <div className="seminar-admin-empty"><h3>Loading seminars…</h3><p>Fetching seminar records from Firestore.</p></div> : filteredSeminars.length ? <div className="seminar-admin-list">{filteredSeminars.map((item) => {
                const status = String(item.status || "Draft");
                const poster = item.coverImage || item.photos?.[0]?.data || "";
                const registrations = Array.isArray(item.registrations) ? item.registrations : [];
                return <article className="seminar-admin-card" key={item.id}>
                  <div className="seminar-admin-card-mark">{poster ? <img src={poster} alt=""/> : <CalendarDays size={25}/>}</div>
                  <div className="seminar-admin-card-main"><div className="seminar-admin-card-kicker"><span className={`seminar-status-badge ${status.toLowerCase()}`}>{status}</span><span>{item.mode || item.eventFormat || "Format not set"}</span></div><h3>{item.title || item.name || "Untitled seminar"}</h3><p>{item.tagline || item.caption || item.description || "No description added yet."}</p><div className="seminar-admin-card-facts"><span><CalendarDays size={14}/>{formatSeminarDate(item.startDate || item.date)}</span><span><Users size={14}/>{item.audience || "Audience not set"}</span><span><ClipboardList size={14}/>{item.registrationFields?.length || 0} registration questions</span><span><Users size={14}/>{Number(item.registrationCount ?? registrations.length)} registrations</span></div><small className="seminar-admin-slug">/events/seminars/{item.slug || item.id}</small></div>
                  <div className="seminar-admin-card-actions"><button type="button" className="seminar-manage-button" onClick={() => editSeminar(item)}><Pencil size={15}/> Manage <ArrowUpRight size={15}/></button>{status.toLowerCase() === "published" && <button type="button" className="seminar-icon-button" title="Open public page" onClick={() => window.open(`/events/seminars/${encodeURIComponent(item.slug || item.id)}`, "_blank", "noopener,noreferrer")}><ExternalLink size={16}/></button>}<button type="button" className="seminar-icon-button danger" title="Delete seminar" onClick={() => deleteSeminar(item)}><Trash2 size={16}/></button></div>
                </article>;
              })}</div> : <div className="seminar-admin-empty"><div><CalendarDays size={25}/></div><h3>{seminars.length ? "No seminars match this view" : "Your seminar studio is ready."}</h3><p>{seminars.length ? "Try another search or filter." : "Create your first seminar. Published seminars will appear here and on the public Events page."}</p><button type="button" className="seminar-create-button" onClick={startCreate}><Plus size={17}/> Create seminar</button></div>}
            </section>
          </>
        ) : (
          <>
        <header className="seminar-hero">
          <div className="seminar-hero-copy">
            <span className="seminar-eyebrow">
              <Sparkles size={14} />
              SEMINAR SETUP
            </span>

            <h1>
              Build a seminar
              <br />
              <span>worth showing up for.</span>
            </h1>

            <p>
              Share the essential details, help students understand what
              they’ll learn, and get your seminar ready to publish.
            </p>
          </div>

          <div className="seminar-hero-art" aria-hidden="true">
            <span className="seminar-art-ring seminar-art-ring-one" />
            <span className="seminar-art-ring seminar-art-ring-two" />
            <span className="seminar-art-icon">
              <CalendarDays size={36} />
            </span>
            <span className="seminar-art-spark seminar-art-spark-one">
              ✳
            </span>
            <span className="seminar-art-spark seminar-art-spark-two">
              +
            </span>
          </div>
        </header>

        <div className="seminar-editor-tabs" role="tablist" aria-label="Seminar setup sections">
          <button type="button" role="tab" aria-selected={activeTab === "details"} className={activeTab === "details" ? "active" : ""} onClick={() => setActiveTab("details")}><FileText size={16}/> Event details</button>
          <button type="button" role="tab" aria-selected={activeTab === "registration"} className={activeTab === "registration" ? "active" : ""} onClick={() => setActiveTab("registration")}><Users size={16}/> Registration form <span>{registrationFields.length}</span></button>
          <button type="button" role="tab" aria-selected={activeTab === "publish"} className={activeTab === "publish" ? "active" : ""} onClick={() => setActiveTab("publish")}><Sparkles size={16}/> Publish & settings</button>
          {editingId && <button type="button" role="tab" aria-selected={activeTab === "registrations"} className={activeTab === "registrations" ? "active" : ""} onClick={() => setActiveTab("registrations")}><Users size={16}/> Active registrations <span>{activeRegistrations.length}</span></button>}
        </div>

        <form className="seminar-form" onSubmit={submit}>
          {activeTab === "details" && <>
          {/* Seminar basics */}
          <section className="seminar-form-section">
            <div className="seminar-section-heading">
              <span className="seminar-section-icon">
                <FileText size={19} />
              </span>

              <div>
                <h2>Seminar basics</h2>
                <p>Give your seminar a clear identity.</p>
              </div>
            </div>

            <div className="seminar-fields">
              <label className="seminar-field seminar-field-wide">
                <span>
                  Seminar title <b>*</b>
                </span>
                <input
                  name="title"
                  value={form.title}
                  onChange={update}
                  placeholder="e.g. Build Your First AI Agent"
                  required
                />
              </label>

              <label className="seminar-field seminar-field-wide">
                <span>Short tagline</span>
                <input
                  name="tagline"
                  value={form.tagline}
                  onChange={update}
                  placeholder="A one-line hook that makes students curious"
                />
              </label>

              <label className="seminar-field seminar-field-wide">
                <span>
                  Description <b>*</b>
                </span>
                <textarea
                  name="description"
                  value={form.description}
                  onChange={update}
                  placeholder="What will happen during the seminar? What makes it useful?"
                  rows={4}
                  required
                />
              </label>

              <label className="seminar-field seminar-field-wide">
                <span>Seminar poster</span>

                <span className="seminar-upload">
                  <ImagePlus size={22} />
                  <strong>{posterName || "Choose a poster image"}</strong>
                  <small>
                    Image selection only; file upload can be connected later.
                  </small>

                  <input
                    type="file"
                    accept="image/*"
                    onChange={(event) => {
                      const file = event.target.files?.[0];
                      setPosterName(file?.name || "");
                      setPosterData("");
                      setSaved(false);

                      if (!file) return;

                      const reader = new FileReader();
                      reader.onload = () => {
                        setPosterData(
                          typeof reader.result === "string" ? reader.result : ""
                        );
                      };
                      reader.onerror = () => {
                        window.alert("Could not read the selected poster image.");
                      };
                      reader.readAsDataURL(file);
                    }}
                  />
                </span>
              </label>
            </div>
          </section>

          {/* Date, time and venue */}
          <section className="seminar-form-section">
            <div className="seminar-section-heading">
              <span className="seminar-section-icon">
                <CalendarDays size={19} />
              </span>

              <div>
                <h2>Date, time &amp; venue</h2>
                <p>Tell participants when and where to join.</p>
              </div>
            </div>

            <div className="seminar-fields">
              <label className="seminar-field">
                <span>
                  Date <b>*</b>
                </span>
                <input
                  type="date"
                  name="date"
                  value={form.date}
                  onChange={update}
                  required
                />
              </label>

              <label className="seminar-field">
                <span>Registration deadline</span>
                <input
                  type="date"
                  name="registrationDeadline"
                  value={form.registrationDeadline}
                  onChange={update}
                />
              </label>

              <label className="seminar-field">
                <span>
                  <Clock3 size={14} /> Start time <b>*</b>
                </span>
                <input
                  type="time"
                  name="startTime"
                  value={form.startTime}
                  onChange={update}
                  required
                />
              </label>

              <label className="seminar-field">
                <span>
                  <Clock3 size={14} /> End time <b>*</b>
                </span>
                <input
                  type="time"
                  name="endTime"
                  value={form.endTime}
                  onChange={update}
                  required
                />
              </label>

              <label className="seminar-field">
                <span>Seminar format</span>
                <select name="mode" value={form.mode} onChange={update}>
                  <option>In-person</option>
                  <option>Online</option>
                  <option>Hybrid</option>
                </select>
              </label>

              {form.mode !== "Online" && (
                <label className="seminar-field">
                  <span>
                    <MapPin size={14} /> Venue
                  </span>
                  <input
                    name="venue"
                    value={form.venue}
                    onChange={update}
                    placeholder="e.g. Seminar Hall 2, RNSIT"
                  />
                </label>
              )}

              {form.mode !== "In-person" && (
                <label className="seminar-field seminar-field-wide">
                  <span>Online meeting link</span>
                  <input
                    type="url"
                    name="platformLink"
                    value={form.platformLink}
                    onChange={update}
                    placeholder="https://..."
                  />
                </label>
              )}
            </div>
          </section>

          {/* Audience and registration */}
          <section className="seminar-form-section">
            <div className="seminar-section-heading">
              <span className="seminar-section-icon">
                <Users size={19} />
              </span>

              <div>
                <h2>Audience &amp; registration</h2>
                <p>Set expectations and how students can participate.</p>
              </div>
            </div>

            <div className="seminar-fields">
              <label className="seminar-field">
                <span>Target audience</span>
                <select
                  name="audience"
                  value={form.audience}
                  onChange={update}
                >
                  <option>RNSIT students</option>
                  <option>All college students</option>
                  <option>Beginners</option>
                  <option>Intermediate learners</option>
                  <option>Open to everyone</option>
                </select>
              </label>

              <label className="seminar-field">
                <span>Participant capacity</span>
                <input
                  type="number"
                  min="1"
                  name="capacity"
                  value={form.capacity}
                  onChange={update}
                  placeholder="e.g. 80"
                />
              </label>

              <label className="seminar-field">
                <span>
                  <Sparkles size={14} /> PRISM Points reward
                </span>
                <input
                  type="number"
                  min="0"
                  step="1"
                  inputMode="numeric"
                  name="rewardPoints"
                  value={form.rewardPoints ?? 0}
                  onChange={update}
                  placeholder="e.g. 100"
                />
                <small className="seminar-points-help">
                  Points a member can earn for registering for this seminar.
                  Set to 0 if this seminar has no points reward.
                </small>
              </label>

              <label className="seminar-field">
                <span>
                  <CircleDollarSign size={14} /> Entry fee
                </span>
                <select
                  name="feeType"
                  value={form.feeType}
                  onChange={update}
                >
                  <option>Free</option>
                  <option>Paid</option>
                </select>
              </label>

              {form.feeType === "Paid" && (
                <label className="seminar-field">
                  <span>Fee amount (₹)</span>
                  <input
                    type="number"
                    min="0"
                    name="feeAmount"
                    value={form.feeAmount}
                    onChange={update}
                    placeholder="e.g. 199"
                  />
                </label>
              )}

              <label className="seminar-field seminar-field-wide">
                <span>Registration link</span>
                <input
                  type="url"
                  name="registrationLink"
                  value={form.registrationLink}
                  onChange={update}
                  placeholder="https://... (optional if registrations will be on the platform)"
                />
              </label>
            </div>
          </section>

          {/* Learning and contact */}
          <section className="seminar-form-section">
            <div className="seminar-section-heading">
              <span className="seminar-section-icon">
                <Sparkles size={19} />
              </span>

              <div>
                <h2>Learning &amp; contact</h2>
                <p>Help students know what they’ll gain and who to contact.</p>
              </div>
            </div>

            <div className="seminar-fields">
              <label className="seminar-field seminar-field-wide">
                <span>Learning outcomes</span>
                <textarea
                  name="outcomes"
                  value={form.outcomes}
                  onChange={update}
                  rows={3}
                  placeholder="What will attendees be able to do after this seminar?"
                />
              </label>

              <label className="seminar-field seminar-field-wide">
                <span>Prerequisites / what to bring</span>
                <textarea
                  name="prerequisites"
                  value={form.prerequisites}
                  onChange={update}
                  rows={2}
                  placeholder="Mention any tools, accounts or prior knowledge required."
                />
              </label>

              <label className="seminar-field">
                <span>Contact person</span>
                <input
                  name="contactName"
                  value={form.contactName}
                  onChange={update}
                  placeholder="Name"
                />
              </label>

              <label className="seminar-field">
                <span>Contact email</span>
                <input
                  type="email"
                  name="contactEmail"
                  value={form.contactEmail}
                  onChange={update}
                  placeholder="club@example.com"
                />
              </label>

              <label className="seminar-field">
                <span>Instructor / facilitator</span>
                <input
                  name="instructor"
                  value={form.instructor}
                  onChange={update}
                  placeholder="Speaker or facilitator name"
                />
              </label>
            </div>
          </section>

          </>}

          {activeTab === "registration" && <>
            <section className="seminar-form-section">
              <div className="seminar-section-heading"><span className="seminar-section-icon"><Users size={19}/></span><div><h2>Build your registration form</h2><p>These questions belong only to this seminar.</p></div></div>
              <div className="seminar-registration-callout"><CheckCircle2 size={19}/><div><strong>Custom seminar registration</strong><p>Participants will complete these questions on the public seminar page. Required answers will be validated before submission.</p></div></div>
              <div className="seminar-question-header"><div><h3>Registration questions <span>{registrationFields.length}</span></h3><p>Add questions, choose answer types, set required fields and reorder them.</p></div><button type="button" className="seminar-add-question" onClick={addQuestion}><Sparkles size={15}/> Add question</button></div>
              {registrationFields.map((field, index) => <article className="seminar-question-card" key={field.id}><div className="seminar-question-index">{String(index + 1).padStart(2, "0")}</div><div className="seminar-question-content"><div className="seminar-fields">
                <label className="seminar-field"><span>Question label <b>*</b></span><input value={field.label} onChange={(event) => updateQuestion(field.id, "label", event.target.value)} placeholder="What should the participant answer?" required/></label>
                <label className="seminar-field"><span>Answer type</span><select value={field.type} onChange={(event) => updateQuestion(field.id, "type", event.target.value)}><option value="text">Short answer</option><option value="textarea">Long answer</option><option value="email">Email</option><option value="tel">Phone number</option><option value="number">Number</option><option value="url">Website / URL</option><option value="select">Dropdown</option><option value="radio">Single choice</option><option value="checkbox">Checkbox / consent</option><option value="date">Date</option></select></label>
                {["select", "radio"].includes(field.type) && <label className="seminar-field seminar-field-wide"><span>Options (comma-separated) <b>*</b></span><input value={field.options} onChange={(event) => updateQuestion(field.id, "options", event.target.value)} placeholder="Beginner, Intermediate, Advanced" required/></label>}
                <label className="seminar-field seminar-field-wide"><span>Helper text (optional)</span><input value={field.helpText} onChange={(event) => updateQuestion(field.id, "helpText", event.target.value)} placeholder="Additional instructions for participants"/></label>
              </div><div className="seminar-question-bottom"><label className="seminar-check"><input type="checkbox" checked={field.required} onChange={(event) => updateQuestion(field.id, "required", event.target.checked)}/> Required question</label><div className="seminar-question-actions"><button type="button" disabled={index === 0} onClick={() => moveQuestion(index, -1)} aria-label="Move question up">↑</button><button type="button" disabled={index === registrationFields.length - 1} onClick={() => moveQuestion(index, 1)} aria-label="Move question down">↓</button><button type="button" className="remove" onClick={() => removeQuestion(field.id)}>Remove</button></div></div></div></article>)}
              <label className="seminar-field seminar-field-wide"><span>Registration consent / declaration</span><textarea value={registrationConsent} onChange={(event) => { setRegistrationConsent(event.target.value); setSaved(false); }} rows={3}/></label>
            </section>
            <section className="seminar-form-section"><div className="seminar-section-heading"><span className="seminar-section-icon"><CheckCircle2 size={19}/></span><div><h2>Registration rules</h2><p>Choose how the organizer handles sign-ups.</p></div></div>
              <label className="seminar-toggle-row"><span><strong>Require manual approval</strong><small>Registrations remain pending until an organizer approves them.</small></span><input type="checkbox" checked={requireApproval} onChange={(event) => { setRequireApproval(event.target.checked); setSaved(false); }}/></label>
              <label className="seminar-toggle-row"><span><strong>Enable waitlist</strong><small>Allow people to join a waitlist when the seminar reaches capacity.</small></span><input type="checkbox" checked={waitlistEnabled} onChange={(event) => { setWaitlistEnabled(event.target.checked); setSaved(false); }}/></label>
              <div className="seminar-registration-stats"><div><span>Questions</span><strong>{registrationFields.length}</strong></div><div><span>Required</span><strong>{registrationFields.filter((field) => field.required).length}</strong></div><div><span>Registration</span><strong>{form.registrationLink ? "External" : "On platform"}</strong></div></div>
            </section>
          </>}

          {activeTab === "registrations" && <section className="seminar-form-section seminar-active-registrations">
            <div className="seminar-section-heading"><span className="seminar-section-icon"><Users size={19}/></span><div><h2>Active registrations</h2><p>Participant details submitted for {form.title || "this seminar"}.</p></div></div>
            <div className="seminar-registration-stats"><div><span>Total submissions</span><strong>{activeRegistrations.length}</strong></div><div><span>Confirmed</span><strong>{activeRegistrations.filter((r) => String(r.status || "Registered").toLowerCase() === "approved" || String(r.status || "Registered").toLowerCase() === "confirmed" || String(r.status || "Registered").toLowerCase() === "registered").length}</strong></div><div><span>Pending review</span><strong>{activeRegistrations.filter((r) => String(r.status || "Registered").toLowerCase() === "pending").length}</strong></div></div>
            {activeRegistrations.length === 0 ? <div className="seminar-admin-empty seminar-registrations-empty"><div><Users size={24}/></div><h3>No registrations yet</h3><p>When a participant submits this seminar's public registration form, their submitted answers will appear here.</p></div> : <div className="seminar-registration-list">
              {activeRegistrations.map((registration, index) => {
                const answers = registration.answers || registration.responses || registration.data || {};
                const answerEntries = Array.isArray(answers) ? answers.map((answer, i) => [answer.label || answer.question || `Answer ${i + 1}`, answer.value ?? answer.answer ?? ""]) : Object.entries(answers);
                const status = String(registration.status || "Registered");
                const registrationId = registration.id || registration.registrationId || `${editingId}-registration-${index}`;
                const email = registration.email || answers.email || answerEntries.find(([key]) => /email/i.test(String(key)))?.[1] || "";
                const name = registration.name || registration.fullName || answers.name || answers["full-name"] || answerEntries.find(([key]) => /name/i.test(String(key)))?.[1] || `Participant ${index + 1}`;
                return <article className="seminar-registration-card" key={registrationId}>
                  <div className="seminar-registration-avatar">{String(name).trim().charAt(0).toUpperCase() || "P"}</div>
                  <div className="seminar-registration-main"><div className="seminar-registration-person"><div><h3>{String(name)}</h3>{email && <a href={`mailto:${email}`}><Mail size={13}/>{String(email)}</a>}</div><span className={`seminar-registration-status ${status.toLowerCase().replace(/\s+/g, "-")}`}>{status}</span></div>
                    <p className="seminar-registration-submitted">Submitted {registration.submittedAt || registration.createdAt ? new Date(registration.submittedAt || registration.createdAt).toLocaleString("en-IN") : "date not recorded"}</p>
                    <details className="seminar-registration-answers"><summary><Eye size={14}/> View submitted answers ({answerEntries.length})</summary><dl>{answerEntries.map(([key, value], i) => <div key={`${registrationId}-${i}`}><dt>{String(key)}</dt><dd>{Array.isArray(value) ? value.join(", ") : String(value ?? "—") || "—"}</dd></div>)}</dl></details>
                    {String(status).toLowerCase() === "pending" && <div className="seminar-registration-actions"><button type="button" onClick={() => updateRegistrationStatus(registrationId, "Approved")}><Check size={14}/> Approve</button><button type="button" className="reject" onClick={() => updateRegistrationStatus(registrationId, "Rejected")}><X size={14}/> Reject</button></div>}
                  </div>
                </article>;
              })}
            </div>}
          </section>}

          {activeTab === "publish" && <section className="seminar-form-section"><div className="seminar-section-heading"><span className="seminar-section-icon"><Sparkles size={19}/></span><div><h2>Publish & settings</h2><p>Review your public seminar before publishing.</p></div></div>
            <div className="seminar-publish-preview"><div><span>PUBLIC PAGE PREVIEW</span><h3>{form.title || "Your seminar title"}</h3><p>{form.tagline || "Your tagline will appear here."}</p><small>{form.date || "Date to be announced"} · {form.mode} · {form.feeType === "Paid" ? `₹${form.feeAmount || "—"}` : "Free"} · {Math.max(0, Math.floor(Number(form.rewardPoints) || 0))} PRISM points</small></div></div>
            <div className="seminar-publish-checklist"><h3>Before publishing</h3><p><CheckCircle2 size={16} className={form.title.trim() ? "complete" : ""}/> Add a seminar title</p><p><CheckCircle2 size={16} className={form.description.trim() ? "complete" : ""}/> Add a description</p><p><CheckCircle2 size={16} className={form.date ? "complete" : ""}/> Set the event date</p><p><CheckCircle2 size={16} className={registrationFields.length ? "complete" : ""}/> Configure registration questions</p><p><CheckCircle2 size={16} className={form.registrationDeadline ? "complete" : ""}/> Set a registration deadline</p></div>
            <div className="seminar-registration-callout"><Eye size={19}/><div><strong>How registration works</strong><p>With no external registration link, the public seminar page should display the custom form configured in the Registration form tab. Form submissions need to be handled by the public page implementation.</p></div></div>
          </section>}

          {saved && (
            <div className="seminar-save-success">
              <CheckCircle2 size={19} />
              <div>
                <strong>
                  {savedStatus === "Published" ? "Seminar published" : "Seminar draft saved"}
                </strong>
                <span>
                  {savedStatus === "Published"
                    ? "Saved to Firestore and published. It is available to the public seminar page."
                    : "Saved to Firestore as a draft. It remains hidden from the public page."}
                </span>
              </div>
            </div>
          )}

          <div className="seminar-form-actions">
            <p>
              <span>*</span> Required fields
            </p>

            <div className="seminar-action-buttons">
              <button type="submit" name="status" value="Draft" className="seminar-save-button seminar-draft-button" disabled={saving}>{saving ? "Saving…" : "Save Draft"}</button>
              <button
                type="submit"
                name="status"
                value="Published"
                className="seminar-save-button"
                disabled={saving}
              >
                {saving ? "Publishing…" : "Publish Event"} <ArrowUpRight size={17} />
              </button>
            </div>
          </div>
        </form>
          </>
        )}
      </div>
    </main>
  );
}