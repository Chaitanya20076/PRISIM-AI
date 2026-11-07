
import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  Plus, Search, SlidersHorizontal, Trash2, Pencil, ExternalLink, ClipboardList, Eye, Mail, Phone, Check, X,
  ArrowUpRight,
  CalendarDays,
  Clock3,
  ImagePlus,
  Users,
  CircleDollarSign,
  CheckCircle2,
  FileText,
  Sparkles,
} from "lucide-react";
import "./bootcamp.css";

const initialForm = {
  title: "",
  tagline: "",
  description: "",
  date: "",
  startTime: "",
  endTime: "",
  mode: "In-person",
  venue: "",
  duration: "",
  skillLevel: "Beginner friendly",
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

const API_BASE_URL = (
  import.meta.env.VITE_API_URL ||
  import.meta.env.VITE_API_BASE_URL ||
  "http://localhost:5000"
).replace(/\/$/, "");

const EVENT_STORAGE_KEY = "prism-admin-events";
const ADMIN_TOKEN_KEY = "prism-admin-token";

function getAdminToken() {
  return sessionStorage.getItem(ADMIN_TOKEN_KEY) || "";
}

function isBootcamp(item = {}) {
  return [item.type, item.category, item.customCategory]
    .some((value) => String(value || "").trim().toLowerCase() === "bootcamp");
}

async function adminRequest(path, options = {}) {
  const token = getAdminToken();
  if (!token) {
    throw new Error("Your admin session has expired. Please sign in again.");
  }

  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers: {
      Accept: "application/json",
      ...(options.body ? { "Content-Type": "application/json" } : {}),
      Authorization: `Bearer ${token}`,
      ...(options.headers || {}),
    },
  });

  const data = await response.json().catch(() => ({}));
  if (!response.ok || data.success === false) {
    throw new Error(data.message || `Request failed (${response.status}).`);
  }
  return data;
}

function formatBootcampDate(value) {
  if (!value) return "Date to be announced";
  const date = new Date(`${value}T12:00:00`);
  return Number.isNaN(date.getTime()) ? value : date.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
}

function bootcampIsPast(item) {
  const value = item.endDate || item.startDate || item.date;
  if (!value) return false;
  const date = new Date(`${value}T23:59:59`);
  return !Number.isNaN(date.getTime()) && date.getTime() < Date.now();
}

export default function Bootcamp() {
  // Hooks must be called inside the component.
  const navigate = useNavigate();
  const [view, setView] = useState("list");
  const [bootcamps, setBootcamps] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("All bootcamps");
  const [editingId, setEditingId] = useState(null);
  const [loadingBootcamps, setLoadingBootcamps] = useState(true);
  const [saving, setSaving] = useState(false);
  const [pageError, setPageError] = useState("");

  const refreshBootcamps = async () => {
    try {
      setPageError("");
      const data = await adminRequest("/api/admin/events");
      const items = Array.isArray(data.events) ? data.events : [];
      const bootcampItems = items.filter(isBootcamp);
      setBootcamps(bootcampItems);
      return bootcampItems;
    } catch (error) {
      console.error("Could not load bootcamps:", error);
      setPageError(error.message || "Could not load bootcamps.");
      return [];
    } finally {
      setLoadingBootcamps(false);
    }
  };

  useEffect(() => {
    refreshBootcamps();
    const refresh = () => refreshBootcamps();
    window.addEventListener("focus", refresh);
    return () => window.removeEventListener("focus", refresh);
  }, []);

  const filteredBootcamps = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return bootcamps.filter((item) => {
      const status = String(item.status || "Draft").toLowerCase();
      const name = String(item.title || item.name || "").toLowerCase();
      const matchesQuery = !q || name.includes(q) || status.includes(q);
      const matchesStatus = statusFilter === "All bootcamps" ||
        (statusFilter === "Published" && status === "published") ||
        (statusFilter === "Drafts" && status === "draft") ||
        (statusFilter === "Past" && (status === "past" || bootcampIsPast(item)));
      return matchesQuery && matchesStatus;
    }).sort((a,b) => String(b.updatedAt || b.createdAt || "").localeCompare(String(a.updatedAt || a.createdAt || "")));
  }, [bootcamps, searchQuery, statusFilter]);

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

  const editBootcamp = (item) => {
    setEditingId(item.id);
    setForm({ ...initialForm, ...item, mode: item.mode || "In-person", venue: item.venue || "", title: item.title || item.name || "", tagline: item.tagline || item.caption || "", date: item.date || item.startDate || "", duration: item.duration || "", skillLevel: item.skillLevel || "Beginner friendly", venue: item.venue || "", outcomes: item.outcomes || item.learningOutcomes || (Array.isArray(item.highlights) ? item.highlights.join("\n") : "") });
    setPosterName(item.posterName || item.photos?.[0]?.name || "");
    setPosterData(item.coverImage || item.photos?.[0]?.data || "");
    if (Array.isArray(item.registrationFields) && item.registrationFields.length) setRegistrationFields(item.registrationFields);
    setRegistrationConsent(item.registrationConsent || "I confirm that the information provided is accurate and may be used by PRISM AI to manage this bootcamp registration.");
    setRequireApproval(Boolean(item.requireApproval));
    setWaitlistEnabled(Boolean(item.waitlistEnabled));
    setSaved(false);
    setActiveTab("details");
    setView("editor");
  };

  const deleteBootcamp = async (item) => {
    if (!window.confirm(`Delete "${item.title || item.name}" and all its registrations?`)) return;
    try {
      await adminRequest(`/api/admin/events/${encodeURIComponent(item.id)}`, {
        method: "DELETE",
      });
      setBootcamps((current) => current.filter((entry) => entry.id !== item.id));
    } catch (error) {
      console.error("Could not delete bootcamp:", error);
      window.alert(error.message || "Could not delete this bootcamp.");
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
  const [registrationConsent, setRegistrationConsent] = useState("I confirm that the information provided is accurate and may be used by PRISM AI to manage this bootcamp registration.");
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

  const activeBootcamp = bootcamps.find((item) => item.id === editingId);
  const activeRegistrations = Array.isArray(activeBootcamp?.registrations) ? activeBootcamp.registrations : [];

  const updateRegistrationStatus = async (registrationId, nextStatus) => {
    if (!editingId) return;
    try {
      const data = await adminRequest(
        `/api/admin/events/${encodeURIComponent(editingId)}/registrations/${encodeURIComponent(registrationId)}`,
        {
          method: "PATCH",
          body: JSON.stringify({ status: nextStatus }),
        }
      );
      const updatedRegistration = data.registration;
      setBootcamps((current) => current.map((item) => {
        if (item.id !== editingId) return item;
        return {
          ...item,
          registrations: (item.registrations || []).map((registration) =>
            registration.id === registrationId
              ? { ...registration, ...(updatedRegistration || {}), status: nextStatus }
              : registration
          ),
        };
      }));
    } catch (error) {
      console.error("Could not update registration status:", error);
      window.alert(error.message || "Could not update this registration.");
    }
  };

  const submit = async (event) => {
    event.preventDefault();

    const status = event.nativeEvent.submitter?.value || "Draft";
    const id = editingId || `bootcamp-${Date.now()}`;
    const previous = bootcamps.find((item) => item.id === id);

    const bootcamp = {
      ...form,
      rewardPoints: Math.max(0, Math.floor(Number(form.rewardPoints) || 0)),
      id,
      slug: previous?.slug || id,

      // Keep the fields expected by the public Events page.
      name: form.title,
      title: form.title,
      caption: form.tagline,
      startDate: form.date,
      endDate: form.date,
      coverImage: posterData,
      photos: posterData ? [{ name: posterName, data: posterData }] : [],
      highlights: form.outcomes
        .split("\n")
        .map((item) => item.trim())
        .filter(Boolean),
      learningOutcomes: form.outcomes,
      prerequisites: form.prerequisites,
      eventFormat: form.mode || "In-person",
      mode: form.mode || "In-person",
          audience: form.audience,
      platformLink: form.platformLink || "",
      duration: form.duration,
      skillLevel: form.skillLevel,
      venue: form.venue,
      onPlatformRegistration: !form.registrationLink,
      registrationType: form.registrationLink ? "external" : "platform",
      registrationFields: registrationFields.filter((field) => field.label.trim()),
      registrationConsent,
      requireApproval,
      waitlistEnabled,
      visibility: "Public",
      type: "Bootcamp",
      category: "Bootcamp",
      customCategory: "Bootcamp",
      posterName,
      status,
      ...(previous?.createdAt ? { createdAt: previous.createdAt } : {}),
    };

    try {
      setSaving(true);
      const data = editingId
        ? await adminRequest(`/api/admin/events/${encodeURIComponent(id)}`, {
            method: "PUT",
            body: JSON.stringify(bootcamp),
          })
        : await adminRequest("/api/admin/events", {
            method: "POST",
            body: JSON.stringify(bootcamp),
          });

      const savedEvent = data.event || bootcamp;
      setEditingId(savedEvent.id || id);
      await refreshBootcamps();
      setSavedStatus(status);
      setSaved(true);
      if (status === "Published") setView("list");
    } catch (error) {
      console.error("Could not save bootcamp:", error);
      window.alert(error.message || "Could not save the bootcamp. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <main className="bootcamp-page">
      <div className="bootcamp-shell">
        <button
          type="button"
          className="bootcamp-back"
          onClick={() => view === "editor" ? setView("list") : navigate("/admin/host")}
        >
          <ArrowLeft size={17} />
          {view === "editor" ? "Back to bootcamps" : "Back to event types"}
        </button>

        {view === "list" ? (
          <>
            <header className="bootcamp-admin-hero">
              <div className="bootcamp-hero-copy">
                <span className="bootcamp-eyebrow"><Sparkles size={14}/> BOOTCAMPS / ORGANIZER STUDIO</span>
                <h1>Make learning <span>happen.</span></h1>
                <p>Create online bootcamps, manage published events and drafts, and configure each bootcamp's registration experience from one workspace.</p>
              </div>
              <button type="button" className="bootcamp-create-button" onClick={startCreate}><Plus size={18}/> Create bootcamp <ArrowUpRight size={17}/></button>
            </header>
            {pageError && <div className="bootcamp-registration-callout" role="alert"><X size={18}/><div><strong>Could not sync bootcamps</strong><p>{pageError} Check that you are signed in and the backend is running.</p></div></div>}
            <section className="bootcamp-admin-stats">
              <div className="bootcamp-stat-card bootcamp-stat-card--violet"><span>All bootcamps</span><strong>{bootcamps.length}</strong></div>
              <div className="bootcamp-stat-card bootcamp-stat-card--mint"><span>Published</span><strong>{bootcamps.filter((item) => String(item.status).toLowerCase() === "published").length}</strong></div>
              <div className="bootcamp-stat-card bootcamp-stat-card--gold"><span>Drafts</span><strong>{bootcamps.filter((item) => String(item.status).toLowerCase() === "draft").length}</strong></div>
              <div className="bootcamp-stat-card bootcamp-stat-card--blue"><span>Registration open</span><strong>{bootcamps.filter((item) => String(item.status).toLowerCase() === "published" && !bootcampIsPast(item) && !(item.registrationDeadline && new Date(`${item.registrationDeadline}T23:59:59`) < new Date())).length}</strong></div>
            </section>
            <section className="bootcamp-admin-list-section">
              <div className="bootcamp-list-heading">
                <div><h2>Your bootcamps</h2><p>Each bootcamp has its own public page, registration questions and submissions.</p></div>
                <label className="bootcamp-search"><span>SEARCH</span><div><Search size={16}/><input value={searchQuery} onChange={(event) => setSearchQuery(event.target.value)} placeholder="Name or status..."/></div></label>
              </div>
              <div className="bootcamp-list-toolbar"><div className="bootcamp-list-filters">{["All bootcamps", "Published", "Drafts", "Past"].map((value) => <button type="button" key={value} className={statusFilter === value ? "active" : ""} onClick={() => setStatusFilter(value)}>{value}</button>)}</div><span><SlidersHorizontal size={15}/> {filteredBootcamps.length} bootcamp{filteredBootcamps.length === 1 ? "" : "s"}</span></div>
              {loadingBootcamps ? <div className="bootcamp-admin-empty"><div><CalendarDays size={25}/></div><h3>Loading bootcamps…</h3><p>Connecting to the PRISM AI server.</p></div> : filteredBootcamps.length ? <div className="bootcamp-admin-list">{filteredBootcamps.map((item) => {
                const status = String(item.status || "Draft");
                const poster = item.coverImage || item.photos?.[0]?.data || "";
                const registrations = Array.isArray(item.registrations) ? item.registrations : [];
                return <article className="bootcamp-admin-card" key={item.id}>
                  <div className="bootcamp-admin-card-mark">{poster ? <img src={poster} alt=""/> : <CalendarDays size={25}/>}</div>
                  <div className="bootcamp-admin-card-main"><div className="bootcamp-admin-card-kicker"><span className={`bootcamp-status-badge ${status.toLowerCase()}`}>{status}</span><span>{item.mode || item.eventFormat || "Format not set"}</span></div><h3>{item.title || item.name || "Untitled bootcamp"}</h3><p>{item.tagline || item.caption || item.description || "No description added yet."}</p><div className="bootcamp-admin-card-facts"><span><CalendarDays size={14}/>{formatBootcampDate(item.startDate || item.date)}</span><span><Users size={14}/>{item.audience || "Audience not set"}</span><span><ClipboardList size={14}/>{item.registrationFields?.length || 0} registration questions</span><span><Users size={14}/>{item.registrationCount ?? registrations.length} registrations</span></div><small className="bootcamp-admin-slug">/events/bootcamps/{item.slug || item.id}</small></div>
                  <div className="bootcamp-admin-card-actions"><button type="button" className="bootcamp-manage-button" onClick={() => editBootcamp(item)}><Pencil size={15}/> Manage <ArrowUpRight size={15}/></button>{status.toLowerCase() === "published" && <button type="button" className="bootcamp-icon-button" title="Open public page" onClick={() => window.open(`/events/bootcamps/${encodeURIComponent(item.slug || item.id)}`, "_blank", "noopener,noreferrer")}><ExternalLink size={16}/></button>}<button type="button" className="bootcamp-icon-button danger" title="Delete bootcamp" onClick={() => deleteBootcamp(item)}><Trash2 size={16}/></button></div>
                </article>;
              })}</div> : <div className="bootcamp-admin-empty"><div><CalendarDays size={25}/></div><h3>{bootcamps.length ? "No bootcamps match this view" : "Your bootcamp studio is ready."}</h3><p>{bootcamps.length ? "Try another search or filter." : "Create your first bootcamp. Published bootcamps will appear here and on the public Events page."}</p><button type="button" className="bootcamp-create-button" onClick={startCreate}><Plus size={17}/> Create bootcamp</button></div>}
            </section>
          </>
        ) : (
          <>
        <header className="bootcamp-hero">
          <div className="bootcamp-hero-copy">
            <span className="bootcamp-eyebrow">
              <Sparkles size={14} />
              BOOTCAMP SETUP
            </span>

            <h1>
              Create an online bootcamp
              <br />
              <span>worth tuning in for.</span>
            </h1>

            <p>
              Share the essential details, help students understand what
              they’ll learn, and get your bootcamp ready to publish.
            </p>
          </div>

          <div className="bootcamp-hero-art" aria-hidden="true">
            <span className="bootcamp-art-icon">
              <CalendarDays size={36} />
            </span>
          </div>
        </header>

        <div className="bootcamp-editor-tabs" role="tablist" aria-label="Bootcamp setup sections">
          <button type="button" role="tab" aria-selected={activeTab === "details"} className={activeTab === "details" ? "active" : ""} onClick={() => setActiveTab("details")}><FileText size={16}/> Event details</button>
          <button type="button" role="tab" aria-selected={activeTab === "registration"} className={activeTab === "registration" ? "active" : ""} onClick={() => setActiveTab("registration")}><Users size={16}/> Registration form <span>{registrationFields.length}</span></button>
          <button type="button" role="tab" aria-selected={activeTab === "publish"} className={activeTab === "publish" ? "active" : ""} onClick={() => setActiveTab("publish")}><Sparkles size={16}/> Publish & settings</button>
          {editingId && <button type="button" role="tab" aria-selected={activeTab === "registrations"} className={activeTab === "registrations" ? "active" : ""} onClick={() => setActiveTab("registrations")}><Users size={16}/> Active registrations <span>{activeRegistrations.length}</span></button>}
        </div>

        <form className="bootcamp-form" onSubmit={submit}>
          {activeTab === "details" && <>
          {/* Bootcamp basics */}
          <section className="bootcamp-form-section">
            <div className="bootcamp-section-heading">
              <span className="bootcamp-section-icon">
                <FileText size={19} />
              </span>

              <div>
                <h2>Bootcamp basics</h2>
                <p>Give your bootcamp a clear identity.</p>
              </div>
            </div>

            <div className="bootcamp-fields">
              <label className="bootcamp-field bootcamp-field-wide">
                <span>
                  Bootcamp title <b>*</b>
                </span>
                <input
                  name="title"
                  value={form.title}
                  onChange={update}
                  placeholder="e.g. Full-Stack Web Development Bootcamp"
                  required
                />
              </label>

              <label className="bootcamp-field bootcamp-field-wide">
                <span>Short tagline</span>
                <input
                  name="tagline"
                  value={form.tagline}
                  onChange={update}
                  placeholder="A focused, hands-on learning experience"
                />
              </label>

              <label className="bootcamp-field bootcamp-field-wide">
                <span>
                  Description <b>*</b>
                </span>
                <textarea
                  name="description"
                  value={form.description}
                  onChange={update}
                  placeholder="Describe the projects, sessions and skills participants will work on."
                  rows={4}
                  required
                />
              </label>

              <label className="bootcamp-field bootcamp-field-wide">
                <span>Bootcamp poster</span>

                <span className="bootcamp-upload">
                  <ImagePlus size={22} />
                  <strong>{posterName || "Choose a bootcamp cover image"}</strong>
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

          {/* Bootcamp schedule and learning path */}
          <section className="bootcamp-form-section">
            <div className="bootcamp-section-heading"><span className="bootcamp-section-icon"><CalendarDays size={19} /></span><div><h2>Schedule &amp; learning path</h2><p>Set the schedule and make the learning commitment clear.</p></div></div>
            <div className="bootcamp-fields">
              <label className="bootcamp-field"><span>Start date <b>*</b></span><input type="date" name="date" value={form.date} onChange={update} required /></label>
              <label className="bootcamp-field"><span>Registration deadline</span><input type="date" name="registrationDeadline" value={form.registrationDeadline} onChange={update} /></label>
              <label className="bootcamp-field"><span><Clock3 size={14} /> Daily start time</span><input type="time" name="startTime" value={form.startTime} onChange={update} /></label>
              <label className="bootcamp-field"><span><Clock3 size={14} /> Daily end time</span><input type="time" name="endTime" value={form.endTime} onChange={update} /></label>
              <label className="bootcamp-field"><span>Duration <b>*</b></span><input name="duration" value={form.duration} onChange={update} placeholder="e.g. 3 days / 2 weeks" required /></label>
              <label className="bootcamp-field"><span>Skill level</span><select name="skillLevel" value={form.skillLevel} onChange={update}><option>Beginner friendly</option><option>Beginner</option><option>Intermediate</option><option>Advanced</option><option>All levels</option></select></label>
              <label className="bootcamp-field"><span>Delivery format</span><select name="mode" value={form.mode} onChange={update}><option>In-person</option><option>Online</option><option>Hybrid</option></select></label>
              <label className="bootcamp-field"><span>Venue / platform</span><input name="venue" value={form.venue} onChange={update} placeholder="e.g. RNSIT Lab 3 or Google Meet" /></label>
            </div>
          </section>

          {/* Audience and registration */}
          <section className="bootcamp-form-section">
            <div className="bootcamp-section-heading">
              <span className="bootcamp-section-icon">
                <Users size={19} />
              </span>

              <div>
                <h2>Audience &amp; registration</h2>
                <p>Set expectations and how students can participate.</p>
              </div>
            </div>

            <div className="bootcamp-fields">
              <label className="bootcamp-field">
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

              <label className="bootcamp-field">
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

              <label className="bootcamp-field">
                <span><Sparkles size={14} /> PRISM Points reward</span>
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
                <small className="bootcamp-points-help">
                  Points a member can earn for registering for this bootcamp.
                  Set to 0 if this bootcamp has no points reward.
                </small>
              </label>

              <label className="bootcamp-field">
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
                <label className="bootcamp-field">
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

              <label className="bootcamp-field bootcamp-field-wide">
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
          <section className="bootcamp-form-section">
            <div className="bootcamp-section-heading">
              <span className="bootcamp-section-icon">
                <Sparkles size={19} />
              </span>

              <div>
                <h2>Learning &amp; contact</h2>
                <p>Help students know what they’ll gain and who to contact.</p>
              </div>
            </div>

            <div className="bootcamp-fields">
              <label className="bootcamp-field bootcamp-field-wide">
                <span>Learning outcomes</span>
                <textarea
                  name="outcomes"
                  value={form.outcomes}
                  onChange={update}
                  rows={3}
                  placeholder="What will attendees be able to do after this bootcamp?"
                />
              </label>

              <label className="bootcamp-field bootcamp-field-wide">
                <span>Prerequisites / what to bring</span>
                <textarea
                  name="prerequisites"
                  value={form.prerequisites}
                  onChange={update}
                  rows={2}
                  placeholder="Mention any tools, accounts or prior knowledge required."
                />
              </label>

              <label className="bootcamp-field">
                <span>Contact person</span>
                <input
                  name="contactName"
                  value={form.contactName}
                  onChange={update}
                  placeholder="Name"
                />
              </label>

              <label className="bootcamp-field">
                <span>Contact email</span>
                <input
                  type="email"
                  name="contactEmail"
                  value={form.contactEmail}
                  onChange={update}
                  placeholder="club@example.com"
                />
              </label>

              <label className="bootcamp-field">
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
            <section className="bootcamp-form-section">
              <div className="bootcamp-section-heading"><span className="bootcamp-section-icon"><Users size={19}/></span><div><h2>Build your registration form</h2><p>These questions belong only to this bootcamp.</p></div></div>
              <div className="bootcamp-registration-callout"><CheckCircle2 size={19}/><div><strong>Custom bootcamp registration</strong><p>Participants will complete these questions on the public bootcamp page. Required answers will be validated before submission.</p></div></div>
              <div className="bootcamp-question-header"><div><h3>Registration questions <span>{registrationFields.length}</span></h3><p>Add questions, choose answer types, set required fields and reorder them.</p></div><button type="button" className="bootcamp-add-question" onClick={addQuestion}><Sparkles size={15}/> Add question</button></div>
              {registrationFields.map((field, index) => <article className="bootcamp-question-card" key={field.id}><div className="bootcamp-question-index">{String(index + 1).padStart(2, "0")}</div><div className="bootcamp-question-content"><div className="bootcamp-fields">
                <label className="bootcamp-field"><span>Question label <b>*</b></span><input value={field.label} onChange={(event) => updateQuestion(field.id, "label", event.target.value)} placeholder="What should the participant answer?" required/></label>
                <label className="bootcamp-field"><span>Answer type</span><select value={field.type} onChange={(event) => updateQuestion(field.id, "type", event.target.value)}><option value="text">Short answer</option><option value="textarea">Long answer</option><option value="email">Email</option><option value="tel">Phone number</option><option value="number">Number</option><option value="url">Website / URL</option><option value="select">Dropdown</option><option value="radio">Single choice</option><option value="checkbox">Checkbox / consent</option><option value="date">Date</option></select></label>
                {["select", "radio"].includes(field.type) && <label className="bootcamp-field bootcamp-field-wide"><span>Options (comma-separated) <b>*</b></span><input value={field.options} onChange={(event) => updateQuestion(field.id, "options", event.target.value)} placeholder="Beginner, Intermediate, Advanced" required/></label>}
                <label className="bootcamp-field bootcamp-field-wide"><span>Helper text (optional)</span><input value={field.helpText} onChange={(event) => updateQuestion(field.id, "helpText", event.target.value)} placeholder="Additional instructions for participants"/></label>
              </div><div className="bootcamp-question-bottom"><label className="bootcamp-check"><input type="checkbox" checked={field.required} onChange={(event) => updateQuestion(field.id, "required", event.target.checked)}/> Required question</label><div className="bootcamp-question-actions"><button type="button" disabled={index === 0} onClick={() => moveQuestion(index, -1)} aria-label="Move question up">↑</button><button type="button" disabled={index === registrationFields.length - 1} onClick={() => moveQuestion(index, 1)} aria-label="Move question down">↓</button><button type="button" className="remove" onClick={() => removeQuestion(field.id)}>Remove</button></div></div></div></article>)}
              <label className="bootcamp-field bootcamp-field-wide"><span>Registration consent / declaration</span><textarea value={registrationConsent} onChange={(event) => { setRegistrationConsent(event.target.value); setSaved(false); }} rows={3}/></label>
            </section>
            <section className="bootcamp-form-section"><div className="bootcamp-section-heading"><span className="bootcamp-section-icon"><CheckCircle2 size={19}/></span><div><h2>Registration rules</h2><p>Choose how the organizer handles sign-ups.</p></div></div>
              <label className="bootcamp-toggle-row"><span><strong>Require manual approval</strong><small>Registrations remain pending until an organizer approves them.</small></span><input type="checkbox" checked={requireApproval} onChange={(event) => { setRequireApproval(event.target.checked); setSaved(false); }}/></label>
              <label className="bootcamp-toggle-row"><span><strong>Enable waitlist</strong><small>Allow people to join a waitlist when the bootcamp reaches capacity.</small></span><input type="checkbox" checked={waitlistEnabled} onChange={(event) => { setWaitlistEnabled(event.target.checked); setSaved(false); }}/></label>
              <div className="bootcamp-registration-stats"><div><span>Questions</span><strong>{registrationFields.length}</strong></div><div><span>Required</span><strong>{registrationFields.filter((field) => field.required).length}</strong></div><div><span>Registration</span><strong>{form.registrationLink ? "External" : "On platform"}</strong></div></div>
            </section>
          </>}

          {activeTab === "registrations" && <section className="bootcamp-form-section bootcamp-active-registrations">
            <div className="bootcamp-section-heading"><span className="bootcamp-section-icon"><Users size={19}/></span><div><h2>Active registrations</h2><p>Participant details submitted for {form.title || "this bootcamp"}.</p></div></div>
            <div className="bootcamp-registration-stats"><div><span>Total submissions</span><strong>{activeRegistrations.length}</strong></div><div><span>Confirmed</span><strong>{activeRegistrations.filter((r) => String(r.status || "Registered").toLowerCase() === "approved" || String(r.status || "Registered").toLowerCase() === "confirmed" || String(r.status || "Registered").toLowerCase() === "registered").length}</strong></div><div><span>Pending review</span><strong>{activeRegistrations.filter((r) => String(r.status || "Registered").toLowerCase() === "pending").length}</strong></div></div>
            {activeRegistrations.length === 0 ? <div className="bootcamp-admin-empty bootcamp-registrations-empty"><div><Users size={24}/></div><h3>No registrations yet</h3><p>When a participant submits this bootcamp's public registration form, their submitted answers will appear here.</p></div> : <div className="bootcamp-registration-list">
              {activeRegistrations.map((registration, index) => {
                const answers = registration.answers || registration.responses || registration.data || {};
                const answerEntries = Array.isArray(answers) ? answers.map((answer, i) => [answer.label || answer.question || `Answer ${i + 1}`, answer.value ?? answer.answer ?? ""]) : Object.entries(answers);
                const status = String(registration.status || "Registered");
                const registrationId = registration.id || registration.registrationId || `${editingId}-registration-${index}`;
                const email = registration.email || answers.email || answerEntries.find(([key]) => /email/i.test(String(key)))?.[1] || "";
                const name = registration.name || registration.fullName || answers.name || answers["full-name"] || answerEntries.find(([key]) => /name/i.test(String(key)))?.[1] || `Participant ${index + 1}`;
                return <article className="bootcamp-registration-card" key={registrationId}>
                  <div className="bootcamp-registration-avatar">{String(name).trim().charAt(0).toUpperCase() || "P"}</div>
                  <div className="bootcamp-registration-main"><div className="bootcamp-registration-person"><div><h3>{String(name)}</h3>{email && <a href={`mailto:${email}`}><Mail size={13}/>{String(email)}</a>}</div><span className={`bootcamp-registration-status ${status.toLowerCase().replace(/\s+/g, "-")}`}>{status}</span></div>
                    <p className="bootcamp-registration-submitted">Submitted {registration.submittedAt || registration.createdAt ? new Date(registration.submittedAt || registration.createdAt).toLocaleString("en-IN") : "date not recorded"}</p>
                    <details className="bootcamp-registration-answers"><summary><Eye size={14}/> View submitted answers ({answerEntries.length})</summary><dl>{answerEntries.map(([key, value], i) => <div key={`${registrationId}-${i}`}><dt>{String(key)}</dt><dd>{Array.isArray(value) ? value.join(", ") : String(value ?? "—") || "—"}</dd></div>)}</dl></details>
                    {String(status).toLowerCase() === "pending" && <div className="bootcamp-registration-actions"><button type="button" onClick={() => updateRegistrationStatus(registrationId, "Approved")}><Check size={14}/> Approve</button><button type="button" className="reject" onClick={() => updateRegistrationStatus(registrationId, "Rejected")}><X size={14}/> Reject</button></div>}
                  </div>
                </article>;
              })}
            </div>}
          </section>}

          {activeTab === "publish" && <section className="bootcamp-form-section"><div className="bootcamp-section-heading"><span className="bootcamp-section-icon"><Sparkles size={19}/></span><div><h2>Publish & settings</h2><p>Review your public bootcamp before publishing.</p></div></div>
            <div className="bootcamp-publish-preview"><div><span>PUBLIC PAGE PREVIEW</span><h3>{form.title || "Your bootcamp title"}</h3><p>{form.tagline || "Your tagline will appear here."}</p><small>{form.date || "Date to be announced"} · {form.mode} · {form.feeType === "Paid" ? `₹${form.feeAmount || "—"}` : "Free"} · {Math.max(0, Math.floor(Number(form.rewardPoints) || 0))} PRISM points</small></div></div>
            <div className="bootcamp-publish-checklist"><h3>Before publishing</h3><p><CheckCircle2 size={16} className={form.title.trim() ? "complete" : ""}/> Add a bootcamp title</p><p><CheckCircle2 size={16} className={form.description.trim() ? "complete" : ""}/> Add a description</p><p><CheckCircle2 size={16} className={form.date ? "complete" : ""}/> Set the event date</p><p><CheckCircle2 size={16} className={registrationFields.length ? "complete" : ""}/> Configure registration questions</p><p><CheckCircle2 size={16} className={form.registrationDeadline ? "complete" : ""}/> Set a registration deadline</p></div>
            <div className="bootcamp-registration-callout"><Eye size={19}/><div><strong>How registration works</strong><p>With no external registration link, the public bootcamp page should display the custom form configured in the Registration form tab. Form submissions need to be handled by the public page implementation.</p></div></div>
          </section>}

          {saved && (
            <div className="bootcamp-save-success">
              <CheckCircle2 size={19} />
              <div>
                <strong>
                  {savedStatus === "Published" ? "Bootcamp published" : "Bootcamp draft saved"}
                </strong>
                <span>
                  {savedStatus === "Published"
                    ? "Published to the PRISM AI server. It will appear on the public Events page."
                    : "Saved to the PRISM AI server as a draft. It remains hidden from the public Events page."}
                </span>
              </div>
            </div>
          )}

          <div className="bootcamp-form-actions">
            <p>
              <span>*</span> Required fields
            </p>

            <div className="bootcamp-action-buttons">
              <button type="submit" name="status" value="Draft" className="bootcamp-save-button bootcamp-draft-button" disabled={saving}>{saving ? "Saving…" : "Save Draft"}</button>
              <button
                type="submit"
                name="status"
                value="Published"
                className="bootcamp-save-button"
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
