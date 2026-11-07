
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
import "./OtherEvent.css";

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
  rewardPoints: 0,
  registrationDeadline: "",
  feeType: "Free",
  feeAmount: "",
  registrationLink: "",
  contactName: "",
  contactEmail: "",
  outcomes: "",
  prerequisites: "",
};

const API_BASE_URL = import.meta.env.VITE_API_URL || import.meta.env.VITE_API_BASE_URL || "http://localhost:5000";
const ADMIN_EVENTS_ENDPOINT = `${API_BASE_URL}/api/admin/events`;

function isOtherEventRecord(item = {}) {
  return [item.type, item.category, item.customCategory].some((value) =>
    ["other event", "other events"].includes(String(value || "").trim().toLowerCase())
  );
}
function getAdminToken() {
  return sessionStorage.getItem("prism-admin-token") || "";
}
async function adminRequest(path = "", options = {}) {
  const token = getAdminToken();
  if (!token) {
    window.location.href = "/admin";
    throw new Error("Your admin session has expired. Please sign in again.");
  }
  const response = await fetch(`${ADMIN_EVENTS_ENDPOINT}${path}`, {
    ...options,
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}`, ...(options.headers || {}) },
  });
  const payload = await response.json().catch(() => ({}));
  if (response.status === 401 || response.status === 403) {
    sessionStorage.removeItem("prism-admin-token");
    window.location.href = "/admin";
    throw new Error("Your admin session has expired. Please sign in again.");
  }
  if (!response.ok) throw new Error(payload.message || payload.error || "The request could not be completed.");
  return payload;
}
function unwrapEventList(payload) {
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.events)) return payload.events;
  if (Array.isArray(payload?.data)) return payload.data;
  return [];
}

function formatOtherEventDate(value) {
  if (!value) return "Date to be announced";
  const date = new Date(`${value}T12:00:00`);
  return Number.isNaN(date.getTime()) ? value : date.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
}

function otherEventIsPast(item) {
  const value = item.endDate || item.startDate || item.date;
  if (!value) return false;
  const date = new Date(`${value}T23:59:59`);
  return !Number.isNaN(date.getTime()) && date.getTime() < Date.now();
}

export default function OtherEvent() {
  // Hooks must be called inside the component.
  const navigate = useNavigate();
  const [view, setView] = useState("list");
  const [otherEvents, setOtherEvents] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("All other events");
  const [editingId, setEditingId] = useState(null);
  const [loadingEvents, setLoadingEvents] = useState(true);
  const [savingEvent, setSavingEvent] = useState(false);
  const [listError, setListError] = useState("");

  const refreshOtherEvents = async () => {
    setLoadingEvents(true);
    setListError("");
    try {
      const payload = await adminRequest();
      setOtherEvents(unwrapEventList(payload).filter(isOtherEventRecord).map((item) => ({
        ...item, id: item.id || item.eventId, status: String(item.status || "Draft"),
      })));
    } catch (error) {
      console.error("Could not load other events from Firestore", error);
      setListError(error.message || "Could not load other events from Firestore.");
    } finally {
      setLoadingEvents(false);
    }
  };
  useEffect(() => { refreshOtherEvents(); }, []);

  const filteredOtherEvents = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return otherEvents.filter((item) => {
      const status = String(item.status || "Draft").toLowerCase();
      const name = String(item.title || item.name || "").toLowerCase();
      const matchesQuery = !q || name.includes(q) || status.includes(q);
      const matchesStatus = statusFilter === "All other events" ||
        (statusFilter === "Published" && status === "published") ||
        (statusFilter === "Drafts" && status === "draft") ||
        (statusFilter === "Past" && (status === "past" || otherEventIsPast(item)));
      return matchesQuery && matchesStatus;
    }).sort((a,b) => String(b.updatedAt || b.createdAt || "").localeCompare(String(a.updatedAt || a.createdAt || "")));
  }, [otherEvents, searchQuery, statusFilter]);

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

  const editOtherEvent = async (item) => {
    try {
      const payload = await adminRequest(`/${encodeURIComponent(item.id)}`);
      const record = payload.event || payload.data || payload;
      setEditingId(item.id);
      setForm({
        ...initialForm, ...record,
        title: record.title || record.name || "",
        tagline: record.tagline || record.caption || "",
        date: record.date || record.startDate || "",
        outcomes: record.outcomes || record.learningOutcomes || (Array.isArray(record.highlights) ? record.highlights.join("\\n") : ""),
      });
      setPosterName(record.posterName || record.photos?.[0]?.name || "");
      setPosterData(record.coverImage || record.photos?.[0]?.data || "");
      setRegistrationFields(Array.isArray(record.registrationFields) ? record.registrationFields : []);
      setRegistrationConsent(record.registrationConsent || "I confirm that the information provided is accurate and may be used by PRISM AI to manage this other event registration.");
      setRequireApproval(Boolean(record.requireApproval));
      setWaitlistEnabled(Boolean(record.waitlistEnabled));
      setOtherEvents((current) => current.map((entry) => entry.id === item.id ? { ...entry, ...record } : entry));
      setSaved(false); setActiveTab("details"); setView("editor");
    } catch (error) {
      console.error("Could not load other event details", error);
      window.alert(error.message || "Could not load this other event.");
    }
  };

  const deleteOtherEvent = async (item) => {
    if (!window.confirm(`Delete "${item.title || item.name}" and its registrations from Firestore?`)) return;
    try {
      await adminRequest(`/${encodeURIComponent(item.id)}`, { method: "DELETE" });
      setOtherEvents((current) => current.filter((entry) => entry.id !== item.id));
      if (editingId === item.id) { setEditingId(null); setView("list"); }
    } catch (error) {
      console.error("Could not delete other event", error);
      window.alert(error.message || "Could not delete this other event.");
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
  const [registrationConsent, setRegistrationConsent] = useState("I confirm that the information provided is accurate and may be used by PRISM AI to manage this other event registration.");
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

  const activeOtherEvent = otherEvents.find((item) => item.id === editingId);
  const activeRegistrations = Array.isArray(activeOtherEvent?.registrations) ? activeOtherEvent.registrations : [];

  const updateRegistrationStatus = async (registrationId, nextStatus) => {
    if (!editingId) return;
    try {
      await adminRequest(`/${encodeURIComponent(editingId)}/registrations/${encodeURIComponent(registrationId)}`, {
        method: "PATCH", body: JSON.stringify({ status: nextStatus }),
      });
      const detail = await adminRequest(`/${encodeURIComponent(editingId)}`);
      const record = detail.event || detail.data || detail;
      setOtherEvents((current) => current.map((item) => item.id === editingId ? { ...item, ...record } : item));
    } catch (error) {
      console.error("Could not update registration status", error);
      window.alert(error.message || "Could not update this registration in Firestore.");
    }
  };

  const submit = async (event) => {
    event.preventDefault();
    if (savingEvent) return;
    const status = event.nativeEvent.submitter?.value || "Draft";
    const now = new Date().toISOString();
    const generatedId = editingId || `other-event-${Date.now()}`;
    const otherEvent = {
      ...form,
      rewardPoints: Math.max(0, Math.floor(Number(form.rewardPoints) || 0)),
      id: generatedId, slug: generatedId,
      name: form.title, title: form.title,
      category: "Other Event", customCategory: "Other Event", type: "Other Event", kind: "event",
      caption: form.tagline, startDate: form.date, endDate: form.date,
      coverImage: posterData, photos: posterData ? [{ name: posterName, data: posterData }] : [],
      highlights: form.outcomes.split("\\n").map((item) => item.trim()).filter(Boolean),
      learningOutcomes: form.outcomes, prerequisites: form.prerequisites,
      eventFormat: form.mode, audience: form.audience,
      onPlatformRegistration: !form.registrationLink,
      registrationType: form.registrationLink ? "external" : "platform",
      registrationFields: registrationFields.filter((field) => field.label.trim()),
      registrationConsent, requireApproval, waitlistEnabled,
      visibility: "Public", status,
      ...(editingId ? {} : { createdAt: now }), updatedAt: now,
    };
    setSavingEvent(true);
    try {
      const payload = await adminRequest(editingId ? `/${encodeURIComponent(editingId)}` : "", {
        method: editingId ? "PUT" : "POST", body: JSON.stringify(otherEvent),
      });
      const serverRecord = payload.event || payload.data || payload;
      const savedRecord = { ...otherEvent, ...serverRecord, id: serverRecord.id || otherEvent.id, status: serverRecord.status || status };
      setEditingId(savedRecord.id);
      setOtherEvents((current) => current.some((item) => item.id === savedRecord.id)
        ? current.map((item) => item.id === savedRecord.id ? { ...item, ...savedRecord } : item)
        : [savedRecord, ...current]);
      setSavedStatus(status); setSaved(true);
      if (status === "Published") setView("list");
    } catch (error) {
      console.error("Could not save other event to Firestore", error);
      window.alert(error.message || "Could not save this other event to Firestore.");
    } finally { setSavingEvent(false); }
  };

  return (
    <main className="other-event-page">
      <div className="other-event-shell">
        <button
          type="button"
          className="other-event-back"
          onClick={() => view === "editor" ? setView("list") : navigate("/admin/host")}
        >
          <ArrowLeft size={17} />
          {view === "editor" ? "Back to other events" : "Back to event types"}
        </button>

        {view === "list" ? (
          <>
            <header className="other-event-admin-hero">
              <div className="other-event-hero-copy">
                <span className="other-event-eyebrow"><Sparkles size={14}/> WORKSHOPS / ORGANIZER STUDIO</span>
                <h1>Make learning <span>happen.</span></h1>
                <p>Create other events, manage published events and drafts, and configure each other event's registration experience from one workspace.</p>
              </div>
              <button type="button" className="other-event-create-button" onClick={startCreate}><Plus size={18}/> Create other event <ArrowUpRight size={17}/></button>
            </header>
            <section className="other-event-admin-stats">
              <div><span>All other events</span><strong>{otherEvents.length}</strong></div>
              <div><span>Published</span><strong>{otherEvents.filter((item) => String(item.status).toLowerCase() === "published").length}</strong></div>
              <div><span>Drafts</span><strong>{otherEvents.filter((item) => String(item.status).toLowerCase() === "draft").length}</strong></div>
              <div><span>Registration open</span><strong>{otherEvents.filter((item) => String(item.status).toLowerCase() === "published" && !otherEventIsPast(item) && !(item.registrationDeadline && new Date(`${item.registrationDeadline}T23:59:59`) < new Date())).length}</strong></div>
            </section>
            <section className="other-event-admin-list-section">
              <div className="other-event-list-heading">
                <div><h2>Your other events</h2><p>Each other event has its own public page, registration questions and submissions.</p></div>
                <label className="other-event-search"><span>SEARCH</span><div><Search size={16}/><input value={searchQuery} onChange={(event) => setSearchQuery(event.target.value)} placeholder="Name or status..."/></div></label>
              </div>
              <div className="other-event-list-toolbar"><div className="other-event-list-filters">{["All other events", "Published", "Drafts", "Past"].map((value) => <button type="button" key={value} className={statusFilter === value ? "active" : ""} onClick={() => setStatusFilter(value)}>{value}</button>)}</div><span><SlidersHorizontal size={15}/> {filteredOtherEvents.length} other event{filteredOtherEvents.length === 1 ? "" : "s"}</span></div>
              {listError && <div className="other-event-admin-empty"><h3>Could not load other events</h3><p>{listError}</p><button type="button" className="other-event-create-button" onClick={refreshOtherEvents}>Retry</button></div>}\n              {loadingEvents ? <div className="other-event-admin-empty"><p>Loading other events from Firestore...</p></div> : filteredOtherEvents.length ? <div className="other-event-admin-list">{filteredOtherEvents.map((item) => {
                const status = String(item.status || "Draft");
                const poster = item.coverImage || item.photos?.[0]?.data || "";
                const registrations = Array.isArray(item.registrations) ? item.registrations : [];
                return <article className="other-event-admin-card" key={item.id}>
                  <div className="other-event-admin-card-mark">{poster ? <img src={poster} alt=""/> : <CalendarDays size={25}/>}</div>
                  <div className="other-event-admin-card-main"><div className="other-event-admin-card-kicker"><span className={`other-event-status-badge ${status.toLowerCase()}`}>{status}</span><span>{item.mode || item.eventFormat || "Format not set"}</span></div><h3>{item.title || item.name || "Untitled other event"}</h3><p>{item.tagline || item.caption || item.description || "No description added yet."}</p><div className="other-event-admin-card-facts"><span><CalendarDays size={14}/>{formatOtherEventDate(item.startDate || item.date)}</span><span><Users size={14}/>{item.audience || "Audience not set"}</span><span><ClipboardList size={14}/>{item.registrationFields?.length || 0} registration questions</span><span><Users size={14}/>{registrations.length} registrations</span></div><small className="other-event-admin-slug">/events/other-events/{item.slug || item.id}</small></div>
                  <div className="other-event-admin-card-actions"><button type="button" className="other-event-manage-button" onClick={() => editOtherEvent(item)}><Pencil size={15}/> Manage <ArrowUpRight size={15}/></button>{status.toLowerCase() === "published" && <button type="button" className="other-event-icon-button" title="Open public page" onClick={() => window.open(`/events/other-events/${encodeURIComponent(item.slug || item.id)}`, "_blank", "noopener,noreferrer")}><ExternalLink size={16}/></button>}<button type="button" className="other-event-icon-button danger" title="Delete other event" onClick={() => deleteOtherEvent(item)}><Trash2 size={16}/></button></div>
                </article>;
              })}</div> : <div className="other-event-admin-empty"><div><CalendarDays size={25}/></div><h3>{otherEvents.length ? "No other events match this view" : "Your other event studio is ready."}</h3><p>{otherEvents.length ? "Try another search or filter." : "Create your first other event. Published other events will appear here and on the public Events page."}</p><button type="button" className="other-event-create-button" onClick={startCreate}><Plus size={17}/> Create other event</button></div>}
            </section>
          </>
        ) : (
          <>
        <header className="other-event-hero">
          <div className="other-event-hero-copy">
            <span className="other-event-eyebrow">
              <Sparkles size={14} />
              WORKSHOP SETUP
            </span>

            <h1>
              Build a other event
              <br />
              <span>worth showing up for.</span>
            </h1>

            <p>
              Share the essential details, help students understand what
              they’ll learn, and get your other event ready to publish.
            </p>
          </div>

          <div className="other-event-hero-art" aria-hidden="true">
            <span className="other-event-art-ring other-event-art-ring-one" />
            <span className="other-event-art-ring other-event-art-ring-two" />
            <span className="other-event-art-icon">
              <CalendarDays size={36} />
            </span>
            <span className="other-event-art-spark other-event-art-spark-one">
              ✳
            </span>
            <span className="other-event-art-spark other-event-art-spark-two">
              +
            </span>
          </div>
        </header>

        <div className="other-event-editor-tabs" role="tablist" aria-label="Other Event setup sections">
          <button type="button" role="tab" aria-selected={activeTab === "details"} className={activeTab === "details" ? "active" : ""} onClick={() => setActiveTab("details")}><FileText size={16}/> Event details</button>
          <button type="button" role="tab" aria-selected={activeTab === "registration"} className={activeTab === "registration" ? "active" : ""} onClick={() => setActiveTab("registration")}><Users size={16}/> Registration form <span>{registrationFields.length}</span></button>
          <button type="button" role="tab" aria-selected={activeTab === "publish"} className={activeTab === "publish" ? "active" : ""} onClick={() => setActiveTab("publish")}><Sparkles size={16}/> Publish & settings</button>
          {editingId && <button type="button" role="tab" aria-selected={activeTab === "registrations"} className={activeTab === "registrations" ? "active" : ""} onClick={() => setActiveTab("registrations")}><Users size={16}/> Active registrations <span>{activeRegistrations.length}</span></button>}
        </div>

        <form className="other-event-form" onSubmit={submit}>
          {activeTab === "details" && <>
          {/* Other Event basics */}
          <section className="other-event-form-section">
            <div className="other-event-section-heading">
              <span className="other-event-section-icon">
                <FileText size={19} />
              </span>

              <div>
                <h2>Other Event basics</h2>
                <p>Give your other event a clear identity.</p>
              </div>
            </div>

            <div className="other-event-fields">
              <label className="other-event-field other-event-field-wide">
                <span>
                  Other Event title <b>*</b>
                </span>
                <input
                  name="title"
                  value={form.title}
                  onChange={update}
                  placeholder="e.g. Build Your First AI Agent"
                  required
                />
              </label>

              <label className="other-event-field other-event-field-wide">
                <span>Short tagline</span>
                <input
                  name="tagline"
                  value={form.tagline}
                  onChange={update}
                  placeholder="A one-line hook that makes students curious"
                />
              </label>

              <label className="other-event-field other-event-field-wide">
                <span>
                  Description <b>*</b>
                </span>
                <textarea
                  name="description"
                  value={form.description}
                  onChange={update}
                  placeholder="What will happen during the other event? What makes it useful?"
                  rows={4}
                  required
                />
              </label>

              <label className="other-event-field other-event-field-wide">
                <span>Other Event poster</span>

                <span className="other-event-upload">
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
          <section className="other-event-form-section">
            <div className="other-event-section-heading">
              <span className="other-event-section-icon">
                <CalendarDays size={19} />
              </span>

              <div>
                <h2>Date, time &amp; venue</h2>
                <p>Tell participants when and where to join.</p>
              </div>
            </div>

            <div className="other-event-fields">
              <label className="other-event-field">
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

              <label className="other-event-field">
                <span>Registration deadline</span>
                <input
                  type="date"
                  name="registrationDeadline"
                  value={form.registrationDeadline}
                  onChange={update}
                />
              </label>

              <label className="other-event-field">
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

              <label className="other-event-field">
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

              <label className="other-event-field">
                <span>Other Event format</span>
                <select name="mode" value={form.mode} onChange={update}>
                  <option>In-person</option>
                  <option>Online</option>
                  <option>Hybrid</option>
                </select>
              </label>

              {form.mode !== "Online" && (
                <label className="other-event-field">
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
                <label className="other-event-field other-event-field-wide">
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
          <section className="other-event-form-section">
            <div className="other-event-section-heading">
              <span className="other-event-section-icon">
                <Users size={19} />
              </span>

              <div>
                <h2>Audience &amp; registration</h2>
                <p>Set expectations and how students can participate.</p>
              </div>
            </div>

            <div className="other-event-fields">
              <label className="other-event-field">
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

              <label className="other-event-field">
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

              <label className="other-event-field">
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
                <small className="other-event-points-help">
                  Points a member can earn for registering for this other event.
                  Set to 0 if this event has no points reward.
                </small>
              </label>

              <label className="other-event-field">
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
                <label className="other-event-field">
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

              <label className="other-event-field other-event-field-wide">
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
          <section className="other-event-form-section">
            <div className="other-event-section-heading">
              <span className="other-event-section-icon">
                <Sparkles size={19} />
              </span>

              <div>
                <h2>Learning &amp; contact</h2>
                <p>Help students know what they’ll gain and who to contact.</p>
              </div>
            </div>

            <div className="other-event-fields">
              <label className="other-event-field other-event-field-wide">
                <span>Learning outcomes</span>
                <textarea
                  name="outcomes"
                  value={form.outcomes}
                  onChange={update}
                  rows={3}
                  placeholder="What will attendees be able to do after this other event?"
                />
              </label>

              <label className="other-event-field other-event-field-wide">
                <span>Prerequisites / what to bring</span>
                <textarea
                  name="prerequisites"
                  value={form.prerequisites}
                  onChange={update}
                  rows={2}
                  placeholder="Mention any tools, accounts or prior knowledge required."
                />
              </label>

              <label className="other-event-field">
                <span>Contact person</span>
                <input
                  name="contactName"
                  value={form.contactName}
                  onChange={update}
                  placeholder="Name"
                />
              </label>

              <label className="other-event-field">
                <span>Contact email</span>
                <input
                  type="email"
                  name="contactEmail"
                  value={form.contactEmail}
                  onChange={update}
                  placeholder="club@example.com"
                />
              </label>

              <label className="other-event-field">
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
            <section className="other-event-form-section">
              <div className="other-event-section-heading"><span className="other-event-section-icon"><Users size={19}/></span><div><h2>Build your registration form</h2><p>These questions belong only to this other event.</p></div></div>
              <div className="other-event-registration-callout"><CheckCircle2 size={19}/><div><strong>Custom other event registration</strong><p>Participants will complete these questions on the public other event page. Required answers will be validated before submission.</p></div></div>
              <div className="other-event-question-header"><div><h3>Registration questions <span>{registrationFields.length}</span></h3><p>Add questions, choose answer types, set required fields and reorder them.</p></div><button type="button" className="other-event-add-question" onClick={addQuestion}><Sparkles size={15}/> Add question</button></div>
              {registrationFields.map((field, index) => <article className="other-event-question-card" key={field.id}><div className="other-event-question-index">{String(index + 1).padStart(2, "0")}</div><div className="other-event-question-content"><div className="other-event-fields">
                <label className="other-event-field"><span>Question label <b>*</b></span><input value={field.label} onChange={(event) => updateQuestion(field.id, "label", event.target.value)} placeholder="What should the participant answer?" required/></label>
                <label className="other-event-field"><span>Answer type</span><select value={field.type} onChange={(event) => updateQuestion(field.id, "type", event.target.value)}><option value="text">Short answer</option><option value="textarea">Long answer</option><option value="email">Email</option><option value="tel">Phone number</option><option value="number">Number</option><option value="url">Website / URL</option><option value="select">Dropdown</option><option value="radio">Single choice</option><option value="checkbox">Checkbox / consent</option><option value="date">Date</option></select></label>
                {["select", "radio"].includes(field.type) && <label className="other-event-field other-event-field-wide"><span>Options (comma-separated) <b>*</b></span><input value={field.options} onChange={(event) => updateQuestion(field.id, "options", event.target.value)} placeholder="Beginner, Intermediate, Advanced" required/></label>}
                <label className="other-event-field other-event-field-wide"><span>Helper text (optional)</span><input value={field.helpText} onChange={(event) => updateQuestion(field.id, "helpText", event.target.value)} placeholder="Additional instructions for participants"/></label>
              </div><div className="other-event-question-bottom"><label className="other-event-check"><input type="checkbox" checked={field.required} onChange={(event) => updateQuestion(field.id, "required", event.target.checked)}/> Required question</label><div className="other-event-question-actions"><button type="button" disabled={index === 0} onClick={() => moveQuestion(index, -1)} aria-label="Move question up">↑</button><button type="button" disabled={index === registrationFields.length - 1} onClick={() => moveQuestion(index, 1)} aria-label="Move question down">↓</button><button type="button" className="remove" onClick={() => removeQuestion(field.id)}>Remove</button></div></div></div></article>)}
              <label className="other-event-field other-event-field-wide"><span>Registration consent / declaration</span><textarea value={registrationConsent} onChange={(event) => { setRegistrationConsent(event.target.value); setSaved(false); }} rows={3}/></label>
            </section>
            <section className="other-event-form-section"><div className="other-event-section-heading"><span className="other-event-section-icon"><CheckCircle2 size={19}/></span><div><h2>Registration rules</h2><p>Choose how the organizer handles sign-ups.</p></div></div>
              <label className="other-event-toggle-row"><span><strong>Require manual approval</strong><small>Registrations remain pending until an organizer approves them.</small></span><input type="checkbox" checked={requireApproval} onChange={(event) => { setRequireApproval(event.target.checked); setSaved(false); }}/></label>
              <label className="other-event-toggle-row"><span><strong>Enable waitlist</strong><small>Allow people to join a waitlist when the other event reaches capacity.</small></span><input type="checkbox" checked={waitlistEnabled} onChange={(event) => { setWaitlistEnabled(event.target.checked); setSaved(false); }}/></label>
              <div className="other-event-registration-stats"><div><span>Questions</span><strong>{registrationFields.length}</strong></div><div><span>Required</span><strong>{registrationFields.filter((field) => field.required).length}</strong></div><div><span>Registration</span><strong>{form.registrationLink ? "External" : "On platform"}</strong></div></div>
            </section>
          </>}

          {activeTab === "registrations" && <section className="other-event-form-section other-event-active-registrations">
            <div className="other-event-section-heading"><span className="other-event-section-icon"><Users size={19}/></span><div><h2>Active registrations</h2><p>Participant details submitted for {form.title || "this other event"}.</p></div></div>
            <div className="other-event-registration-stats"><div><span>Total submissions</span><strong>{activeRegistrations.length}</strong></div><div><span>Confirmed</span><strong>{activeRegistrations.filter((r) => String(r.status || "Registered").toLowerCase() === "approved" || String(r.status || "Registered").toLowerCase() === "confirmed" || String(r.status || "Registered").toLowerCase() === "registered").length}</strong></div><div><span>Pending review</span><strong>{activeRegistrations.filter((r) => String(r.status || "Registered").toLowerCase() === "pending").length}</strong></div></div>
            {activeRegistrations.length === 0 ? <div className="other-event-admin-empty other-event-registrations-empty"><div><Users size={24}/></div><h3>No registrations yet</h3><p>When a participant submits this other event's public registration form, their submitted answers will appear here.</p></div> : <div className="other-event-registration-list">
              {activeRegistrations.map((registration, index) => {
                const answers = registration.answers || registration.responses || registration.data || {};
                const answerEntries = Array.isArray(answers) ? answers.map((answer, i) => [answer.label || answer.question || `Answer ${i + 1}`, answer.value ?? answer.answer ?? ""]) : Object.entries(answers);
                const status = String(registration.status || "Registered");
                const registrationId = registration.id || registration.registrationId || `${editingId}-registration-${index}`;
                const email = registration.email || answers.email || answerEntries.find(([key]) => /email/i.test(String(key)))?.[1] || "";
                const name = registration.name || registration.fullName || answers.name || answers["full-name"] || answerEntries.find(([key]) => /name/i.test(String(key)))?.[1] || `Participant ${index + 1}`;
                return <article className="other-event-registration-card" key={registrationId}>
                  <div className="other-event-registration-avatar">{String(name).trim().charAt(0).toUpperCase() || "P"}</div>
                  <div className="other-event-registration-main"><div className="other-event-registration-person"><div><h3>{String(name)}</h3>{email && <a href={`mailto:${email}`}><Mail size={13}/>{String(email)}</a>}</div><span className={`other-event-registration-status ${status.toLowerCase().replace(/\s+/g, "-")}`}>{status}</span></div>
                    <p className="other-event-registration-submitted">Submitted {registration.submittedAt || registration.createdAt ? new Date(registration.submittedAt || registration.createdAt).toLocaleString("en-IN") : "date not recorded"}</p>
                    <details className="other-event-registration-answers"><summary><Eye size={14}/> View submitted answers ({answerEntries.length})</summary><dl>{answerEntries.map(([key, value], i) => <div key={`${registrationId}-${i}`}><dt>{String(key)}</dt><dd>{Array.isArray(value) ? value.join(", ") : String(value ?? "—") || "—"}</dd></div>)}</dl></details>
                    {String(status).toLowerCase() === "pending" && <div className="other-event-registration-actions"><button type="button" onClick={() => updateRegistrationStatus(registrationId, "Approved")}><Check size={14}/> Approve</button><button type="button" className="reject" onClick={() => updateRegistrationStatus(registrationId, "Rejected")}><X size={14}/> Reject</button></div>}
                  </div>
                </article>;
              })}
            </div>}
          </section>}

          {activeTab === "publish" && <section className="other-event-form-section"><div className="other-event-section-heading"><span className="other-event-section-icon"><Sparkles size={19}/></span><div><h2>Publish & settings</h2><p>Review your public other event before publishing.</p></div></div>
            <div className="other-event-publish-preview"><div><span>PUBLIC PAGE PREVIEW</span><h3>{form.title || "Your other event title"}</h3><p>{form.tagline || "Your tagline will appear here."}</p><small>{form.date || "Date to be announced"} · {form.mode} · {form.feeType === "Paid" ? `₹${form.feeAmount || "—"}` : "Free"} · {Math.max(0, Math.floor(Number(form.rewardPoints) || 0))} PRISM points</small></div></div>
            <div className="other-event-publish-checklist"><h3>Before publishing</h3><p><CheckCircle2 size={16} className={form.title.trim() ? "complete" : ""}/> Add a other event title</p><p><CheckCircle2 size={16} className={form.description.trim() ? "complete" : ""}/> Add a description</p><p><CheckCircle2 size={16} className={form.date ? "complete" : ""}/> Set the event date</p><p><CheckCircle2 size={16} className={registrationFields.length ? "complete" : ""}/> Configure registration questions</p><p><CheckCircle2 size={16} className={form.registrationDeadline ? "complete" : ""}/> Set a registration deadline</p></div>
            <div className="other-event-registration-callout"><Eye size={19}/><div><strong>How registration works</strong><p>With no external registration link, the public other event page should display the custom form configured in the Registration form tab. Form submissions need to be handled by the public page implementation.</p></div></div>
          </section>}

          {saved && (
            <div className="other-event-save-success">
              <CheckCircle2 size={19} />
              <div>
                <strong>
                  {savedStatus === "Published" ? "Other Event published" : "Other Event draft saved"}
                </strong>
                <span>
                  {savedStatus === "Published"
                    ? "Saved as published in Firestore. It will appear on the public Events page when the public feed includes this event."
                    : "Saved in Firestore as a draft. It remains hidden from the public Events page."}
                </span>
              </div>
            </div>
          )}

          <div className="other-event-form-actions">
            <p>
              <span>*</span> Required fields
            </p>

            <div className="other-event-action-buttons">
              <button type="submit" name="status" value="Draft" disabled={savingEvent} className="other-event-save-button other-event-draft-button">{savingEvent ? "Saving..." : "Save Draft"}</button>
              <button
                type="submit"
                name="status"
                value="Published"
                disabled={savingEvent}
                className="other-event-save-button"
              >
                {savingEvent ? "Publishing..." : "Publish Event"} <ArrowUpRight size={17} />
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
