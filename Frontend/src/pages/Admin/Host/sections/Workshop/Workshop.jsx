
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
import "./Workshop.css";

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
  rewardPoints: 0,
  registrationLink: "",
  contactName: "",
  contactEmail: "",
  outcomes: "",
  prerequisites: "",
};

const API_BASE_URL =
  import.meta.env.VITE_API_URL ||
  import.meta.env.VITE_API_BASE_URL ||
  "http://localhost:5000";

const ADMIN_EVENTS_ENDPOINT = `${API_BASE_URL}/api/admin/events`;

function getAdminToken() {
  return sessionStorage.getItem("prism-admin-token");
}

function isWorkshopEvent(item) {
  const types = [item?.type, item?.category, item?.customCategory]
    .filter(Boolean)
    .map((value) => String(value).trim().toLowerCase());

  return types.includes("workshop");
}

function normalizeWorkshop(item) {
  return {
    ...item,
    id: item.id || item._id,
    title: item.title || item.name || "",
    name: item.name || item.title || "",
    registrationFields: Array.isArray(item.registrationFields)
      ? item.registrationFields
      : [],
    registrations: Array.isArray(item.registrations) ? item.registrations : [],
  };
}

async function adminRequest(endpoint = "", options = {}) {
  const token = getAdminToken();
  if (!token) {
    throw new Error("Your admin session has expired. Please sign in again.");
  }

  let response;
  try {
    response = await fetch(`${ADMIN_EVENTS_ENDPOINT}${endpoint}`, {
      ...options,
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
        ...(options.headers || {}),
      },
    });
  } catch {
    throw new Error("Cannot connect to the PRISM AI backend. Check that it is running.");
  }

  const data = await response.json().catch(() => ({}));
  if (response.status === 401 || response.status === 403) {
    sessionStorage.removeItem("prism-admin-token");
    window.location.assign("/admin");
    throw new Error("Your admin session has expired. Please sign in again.");
  }
  if (!response.ok || data.success === false) {
    throw new Error(data.message || "The requested workshop operation failed.");
  }
  return data;
}

function extractEvents(data) {
  if (Array.isArray(data)) return data;
  if (Array.isArray(data.events)) return data.events;
  if (Array.isArray(data.data)) return data.data;
  if (Array.isArray(data.items)) return data.items;
  return [];
}

function formatWorkshopDate(value) {
  if (!value) return "Date to be announced";
  const date = new Date(`${value}T12:00:00`);
  return Number.isNaN(date.getTime()) ? value : date.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
}

function workshopIsPast(item) {
  const value = item.endDate || item.startDate || item.date;
  if (!value) return false;
  const date = new Date(`${value}T23:59:59`);
  return !Number.isNaN(date.getTime()) && date.getTime() < Date.now();
}

export default function Workshop() {
  // Hooks must be called inside the component.
  const navigate = useNavigate();
  const [view, setView] = useState("list");
  const [workshops, setWorkshops] = useState([]);
  const [loadingWorkshops, setLoadingWorkshops] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("All workshops");
  const [editingId, setEditingId] = useState(null);

  const refreshWorkshops = async () => {
    try {
      const data = await adminRequest();
      const records = extractEvents(data);

      // Filter the original Firestore documents BEFORE normalizing them.
      // Never overwrite type/category while preparing data for this page.
      const workshopRecords = records
        .filter(isWorkshopEvent)
        .map(normalizeWorkshop);

      setWorkshops(workshopRecords);
    } catch (error) {
      console.error("Could not load workshops", error);
      window.alert(error.message || "Could not load workshops from the server.");
    } finally {
      setLoadingWorkshops(false);
    }
  };

  useEffect(() => {
    refreshWorkshops();
    const refresh = () => refreshWorkshops();
    window.addEventListener("focus", refresh);
    return () => window.removeEventListener("focus", refresh);
    // Initial load and focus refresh only.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const filteredWorkshops = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return workshops.filter((item) => {
      const status = String(item.status || "Draft").toLowerCase();
      const name = String(item.title || item.name || "").toLowerCase();
      const matchesQuery = !q || name.includes(q) || status.includes(q);
      const matchesStatus = statusFilter === "All workshops" ||
        (statusFilter === "Published" && status === "published") ||
        (statusFilter === "Drafts" && status === "draft") ||
        (statusFilter === "Past" && (status === "past" || workshopIsPast(item)));
      return matchesQuery && matchesStatus;
    }).sort((a,b) => String(b.updatedAt || b.createdAt || "").localeCompare(String(a.updatedAt || a.createdAt || "")));
  }, [workshops, searchQuery, statusFilter]);

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

  const editWorkshop = async (item) => {
    try {
      const data = await adminRequest(`/${encodeURIComponent(item.id)}`);
      const fullItem = data.event || data.data || data;
      if (!isWorkshopEvent(fullItem)) {
        window.alert("This record is not a workshop. It has not been opened or modified.");
        await refreshWorkshops();
        return;
      }
      const workshop = normalizeWorkshop(fullItem);
      setEditingId(workshop.id);
      setForm({ ...initialForm, ...workshop, title: workshop.title || workshop.name || "", tagline: workshop.tagline || workshop.caption || "", date: workshop.date || workshop.startDate || "", outcomes: workshop.outcomes || workshop.learningOutcomes || (Array.isArray(workshop.highlights) ? workshop.highlights.join("\n") : "") });
      setPosterName(workshop.posterName || workshop.photos?.[0]?.name || "");
      setPosterData(workshop.coverImage || workshop.photos?.[0]?.data || "");
      if (Array.isArray(workshop.registrationFields) && workshop.registrationFields.length) setRegistrationFields(workshop.registrationFields);
      setRegistrationConsent(workshop.registrationConsent || "I confirm that the information provided is accurate and may be used by PRISM AI to manage this workshop registration.");
      setRequireApproval(Boolean(workshop.requireApproval));
      setWaitlistEnabled(Boolean(workshop.waitlistEnabled));
      setWorkshops((current) => current.map((entry) => entry.id === workshop.id ? workshop : entry));
      setSaved(false);
      setActiveTab("details");
      setView("editor");
    } catch (error) {
      console.error("Could not load workshop", error);
      window.alert(error.message || "Could not load this workshop.");
    }
  };

  const deleteWorkshop = async (item) => {
    if (!window.confirm(`Delete "${item.title || item.name}" and its registrations permanently?`)) return;
    try {
      await adminRequest(`/${encodeURIComponent(item.id)}`, { method: "DELETE" });
      setWorkshops((current) => current.filter((entry) => entry.id !== item.id));
      if (editingId === item.id) {
        setEditingId(null);
        setView("list");
      }
    } catch (error) {
      console.error("Could not delete workshop", error);
      window.alert(error.message || "Could not delete this workshop.");
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
  const [registrationConsent, setRegistrationConsent] = useState("I confirm that the information provided is accurate and may be used by PRISM AI to manage this workshop registration.");
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

  const activeWorkshop = workshops.find((item) => item.id === editingId);
  const activeRegistrations = Array.isArray(activeWorkshop?.registrations) ? activeWorkshop.registrations : [];

  const updateRegistrationStatus = async (registrationId, nextStatus) => {
    if (!editingId) return;
    try {
      await adminRequest(`/${encodeURIComponent(editingId)}/registrations/${encodeURIComponent(registrationId)}`, {
        method: "PATCH",
        body: JSON.stringify({ status: nextStatus }),
      });
      await refreshWorkshops();
      const detail = await adminRequest(`/${encodeURIComponent(editingId)}`);
      const updated = detail.event || detail.data || detail;
      if (isWorkshopEvent(updated)) {
        setWorkshops((current) => current.map((item) => item.id === editingId ? normalizeWorkshop(updated) : item));
      }
    } catch (error) {
      console.error("Could not update registration status", error);
      window.alert(error.message || "Could not update this registration.");
    }
  };

  const submit = async (event) => {
    event.preventDefault();

    const status = event.nativeEvent.submitter?.value || "Draft";
    const now = new Date().toISOString();
    const id = editingId || `workshop-${Date.now()}`;
    const previous = workshops.find((item) => item.id === id);

    const workshop = {
      ...form,
      rewardPoints: Math.max(0, Math.floor(Number(form.rewardPoints) || 0)),
      id,
      slug: id,
      name: form.title,
      title: form.title,
      category: "Workshop",
      customCategory: "Workshop",
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
      eventFormat: form.mode,
      audience: form.audience,
      onPlatformRegistration: !form.registrationLink,
      registrationType: form.registrationLink ? "external" : "platform",
      registrationFields: registrationFields.filter((field) => field.label.trim()),
      registrationConsent,
      requireApproval,
      waitlistEnabled,
      visibility: "Public",
      type: "Workshop",
      posterName,
      status,
      createdAt: previous?.createdAt || now,
      updatedAt: now,
    };

    try {
      const isEditing = Boolean(editingId);
      const data = await adminRequest(isEditing ? `/${encodeURIComponent(id)}` : "", {
        method: isEditing ? "PUT" : "POST",
        body: JSON.stringify(workshop),
      });

      const savedRecord = data.event || data.data || data;
      if (savedRecord && typeof savedRecord === "object" && !isWorkshopEvent(savedRecord)) {
        throw new Error("The server response did not identify this record as a workshop. The page was not updated.");
      }

      await refreshWorkshops();
      setEditingId(id);
      setSavedStatus(status);
      setSaved(true);
      if (status === "Published") setView("list");
    } catch (error) {
      console.error("Could not save workshop", error);
      window.alert(error.message || "Could not save the workshop to Firestore.");
    }
  };

  return (
    <main className="workshop-page">
      <div className="workshop-shell">
        <button
          type="button"
          className="workshop-back"
          onClick={() => view === "editor" ? setView("list") : navigate("/admin/host")}
        >
          <ArrowLeft size={17} />
          {view === "editor" ? "Back to workshops" : "Back to event types"}
        </button>

        {view === "list" ? (
          <>
            <header className="workshop-admin-hero">
              <div className="workshop-hero-copy">
                <span className="workshop-eyebrow"><Sparkles size={14}/> WORKSHOPS / ORGANIZER STUDIO</span>
                <h1>Make learning <span>happen.</span></h1>
                <p>Create workshops, manage published events and drafts, and configure each workshop's registration experience from one workspace.</p>
              </div>
              <button type="button" className="workshop-create-button" onClick={startCreate}><Plus size={18}/> Create workshop <ArrowUpRight size={17}/></button>
            </header>
            <section className="workshop-admin-stats">
              <div><span>All workshops</span><strong>{workshops.length}</strong></div>
              <div><span>Published</span><strong>{workshops.filter((item) => String(item.status).toLowerCase() === "published").length}</strong></div>
              <div><span>Drafts</span><strong>{workshops.filter((item) => String(item.status).toLowerCase() === "draft").length}</strong></div>
              <div><span>Registration open</span><strong>{workshops.filter((item) => String(item.status).toLowerCase() === "published" && !workshopIsPast(item) && !(item.registrationDeadline && new Date(`${item.registrationDeadline}T23:59:59`) < new Date())).length}</strong></div>
            </section>
            <section className="workshop-admin-list-section">
              <div className="workshop-list-heading">
                <div><h2>Your workshops</h2><p>Each workshop has its own public page, registration questions and submissions.</p></div>
                <label className="workshop-search"><span>SEARCH</span><div><Search size={16}/><input value={searchQuery} onChange={(event) => setSearchQuery(event.target.value)} placeholder="Name or status..."/></div></label>
              </div>
              <div className="workshop-list-toolbar"><div className="workshop-list-filters">{["All workshops", "Published", "Drafts", "Past"].map((value) => <button type="button" key={value} className={statusFilter === value ? "active" : ""} onClick={() => setStatusFilter(value)}>{value}</button>)}</div><span><SlidersHorizontal size={15}/> {filteredWorkshops.length} workshop{filteredWorkshops.length === 1 ? "" : "s"}</span></div>
              {loadingWorkshops ? <div className="workshop-admin-empty"><div><CalendarDays size={25}/></div><h3>Loading workshops…</h3><p>Fetching workshop records from the PRISM AI database.</p></div> : filteredWorkshops.length ? <div className="workshop-admin-list">{filteredWorkshops.map((item) => {
                const status = String(item.status || "Draft");
                const poster = item.coverImage || item.photos?.[0]?.data || "";
                const registrations = Array.isArray(item.registrations) ? item.registrations : [];
                return <article className="workshop-admin-card" key={item.id}>
                  <div className="workshop-admin-card-mark">{poster ? <img src={poster} alt=""/> : <CalendarDays size={25}/>}</div>
                  <div className="workshop-admin-card-main"><div className="workshop-admin-card-kicker"><span className={`workshop-status-badge ${status.toLowerCase()}`}>{status}</span><span>{item.mode || item.eventFormat || "Format not set"}</span></div><h3>{item.title || item.name || "Untitled workshop"}</h3><p>{item.tagline || item.caption || item.description || "No description added yet."}</p><div className="workshop-admin-card-facts"><span><CalendarDays size={14}/>{formatWorkshopDate(item.startDate || item.date)}</span><span><Users size={14}/>{item.audience || "Audience not set"}</span><span><ClipboardList size={14}/>{item.registrationFields?.length || 0} registration questions</span><span><Users size={14}/>{registrations.length} registrations</span></div><small className="workshop-admin-slug">/events/workshops/{item.slug || item.id}</small></div>
                  <div className="workshop-admin-card-actions"><button type="button" className="workshop-manage-button" onClick={() => editWorkshop(item)}><Pencil size={15}/> Manage <ArrowUpRight size={15}/></button>{status.toLowerCase() === "published" && <button type="button" className="workshop-icon-button" title="Open public page" onClick={() => window.open(`/events/workshops/${encodeURIComponent(item.slug || item.id)}`, "_blank", "noopener,noreferrer")}><ExternalLink size={16}/></button>}<button type="button" className="workshop-icon-button danger" title="Delete workshop" onClick={() => deleteWorkshop(item)}><Trash2 size={16}/></button></div>
                </article>;
              })}</div> : <div className="workshop-admin-empty"><div><CalendarDays size={25}/></div><h3>{workshops.length ? "No workshops match this view" : "Your workshop studio is ready."}</h3><p>{workshops.length ? "Try another search or filter." : "Create your first workshop. Published workshops will appear here and on the public Events page."}</p><button type="button" className="workshop-create-button" onClick={startCreate}><Plus size={17}/> Create workshop</button></div>}
            </section>
          </>
        ) : (
          <>
        <header className="workshop-hero">
          <div className="workshop-hero-copy">
            <span className="workshop-eyebrow">
              <Sparkles size={14} />
              WORKSHOP SETUP
            </span>

            <h1>
              Build a workshop
              <br />
              <span>worth showing up for.</span>
            </h1>

            <p>
              Share the essential details, help students understand what
              they’ll learn, and get your workshop ready to publish.
            </p>
          </div>

          <div className="workshop-hero-art" aria-hidden="true">
            <span className="workshop-art-ring workshop-art-ring-one" />
            <span className="workshop-art-ring workshop-art-ring-two" />
            <span className="workshop-art-icon">
              <CalendarDays size={36} />
            </span>
            <span className="workshop-art-spark workshop-art-spark-one">
              ✳
            </span>
            <span className="workshop-art-spark workshop-art-spark-two">
              +
            </span>
          </div>
        </header>

        <div className="workshop-editor-tabs" role="tablist" aria-label="Workshop setup sections">
          <button type="button" role="tab" aria-selected={activeTab === "details"} className={activeTab === "details" ? "active" : ""} onClick={() => setActiveTab("details")}><FileText size={16}/> Event details</button>
          <button type="button" role="tab" aria-selected={activeTab === "registration"} className={activeTab === "registration" ? "active" : ""} onClick={() => setActiveTab("registration")}><Users size={16}/> Registration form <span>{registrationFields.length}</span></button>
          <button type="button" role="tab" aria-selected={activeTab === "publish"} className={activeTab === "publish" ? "active" : ""} onClick={() => setActiveTab("publish")}><Sparkles size={16}/> Publish & settings</button>
          {editingId && <button type="button" role="tab" aria-selected={activeTab === "registrations"} className={activeTab === "registrations" ? "active" : ""} onClick={() => setActiveTab("registrations")}><Users size={16}/> Active registrations <span>{activeRegistrations.length}</span></button>}
        </div>

        <form className="workshop-form" onSubmit={submit}>
          {activeTab === "details" && <>
          {/* Workshop basics */}
          <section className="workshop-form-section">
            <div className="workshop-section-heading">
              <span className="workshop-section-icon">
                <FileText size={19} />
              </span>

              <div>
                <h2>Workshop basics</h2>
                <p>Give your workshop a clear identity.</p>
              </div>
            </div>

            <div className="workshop-fields">
              <label className="workshop-field workshop-field-wide">
                <span>
                  Workshop title <b>*</b>
                </span>
                <input
                  name="title"
                  value={form.title}
                  onChange={update}
                  placeholder="e.g. Build Your First AI Agent"
                  required
                />
              </label>

              <label className="workshop-field workshop-field-wide">
                <span>Short tagline</span>
                <input
                  name="tagline"
                  value={form.tagline}
                  onChange={update}
                  placeholder="A one-line hook that makes students curious"
                />
              </label>

              <label className="workshop-field workshop-field-wide">
                <span>
                  Description <b>*</b>
                </span>
                <textarea
                  name="description"
                  value={form.description}
                  onChange={update}
                  placeholder="What will happen during the workshop? What makes it useful?"
                  rows={4}
                  required
                />
              </label>

              <label className="workshop-field workshop-field-wide">
                <span>Workshop poster</span>

                <span className="workshop-upload">
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
          <section className="workshop-form-section">
            <div className="workshop-section-heading">
              <span className="workshop-section-icon">
                <CalendarDays size={19} />
              </span>

              <div>
                <h2>Date, time &amp; venue</h2>
                <p>Tell participants when and where to join.</p>
              </div>
            </div>

            <div className="workshop-fields">
              <label className="workshop-field">
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

              <label className="workshop-field">
                <span>Registration deadline</span>
                <input
                  type="date"
                  name="registrationDeadline"
                  value={form.registrationDeadline}
                  onChange={update}
                />
              </label>

              <label className="workshop-field">
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

              <label className="workshop-field">
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

              <label className="workshop-field">
                <span>Workshop format</span>
                <select name="mode" value={form.mode} onChange={update}>
                  <option>In-person</option>
                  <option>Online</option>
                  <option>Hybrid</option>
                </select>
              </label>

              {form.mode !== "Online" && (
                <label className="workshop-field">
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
                <label className="workshop-field workshop-field-wide">
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
          <section className="workshop-form-section">
            <div className="workshop-section-heading">
              <span className="workshop-section-icon">
                <Users size={19} />
              </span>

              <div>
                <h2>Audience &amp; registration</h2>
                <p>Set expectations and how students can participate.</p>
              </div>
            </div>

            <div className="workshop-fields">
              <label className="workshop-field">
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

              <label className="workshop-field">
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

              <label className="workshop-field">
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
                <small className="workshop-points-help">
                  Points a member can earn for registering for this workshop.
                  Set to 0 if this workshop has no points reward.
                </small>
              </label>

              <label className="workshop-field">
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
                <label className="workshop-field">
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

              <label className="workshop-field workshop-field-wide">
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
          <section className="workshop-form-section">
            <div className="workshop-section-heading">
              <span className="workshop-section-icon">
                <Sparkles size={19} />
              </span>

              <div>
                <h2>Learning &amp; contact</h2>
                <p>Help students know what they’ll gain and who to contact.</p>
              </div>
            </div>

            <div className="workshop-fields">
              <label className="workshop-field workshop-field-wide">
                <span>Learning outcomes</span>
                <textarea
                  name="outcomes"
                  value={form.outcomes}
                  onChange={update}
                  rows={3}
                  placeholder="What will attendees be able to do after this workshop?"
                />
              </label>

              <label className="workshop-field workshop-field-wide">
                <span>Prerequisites / what to bring</span>
                <textarea
                  name="prerequisites"
                  value={form.prerequisites}
                  onChange={update}
                  rows={2}
                  placeholder="Mention any tools, accounts or prior knowledge required."
                />
              </label>

              <label className="workshop-field">
                <span>Contact person</span>
                <input
                  name="contactName"
                  value={form.contactName}
                  onChange={update}
                  placeholder="Name"
                />
              </label>

              <label className="workshop-field">
                <span>Contact email</span>
                <input
                  type="email"
                  name="contactEmail"
                  value={form.contactEmail}
                  onChange={update}
                  placeholder="club@example.com"
                />
              </label>

              <label className="workshop-field">
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
            <section className="workshop-form-section">
              <div className="workshop-section-heading"><span className="workshop-section-icon"><Users size={19}/></span><div><h2>Build your registration form</h2><p>These questions belong only to this workshop.</p></div></div>
              <div className="workshop-registration-callout"><CheckCircle2 size={19}/><div><strong>Custom workshop registration</strong><p>Participants will complete these questions on the public workshop page. Required answers will be validated before submission.</p></div></div>
              <div className="workshop-question-header"><div><h3>Registration questions <span>{registrationFields.length}</span></h3><p>Add questions, choose answer types, set required fields and reorder them.</p></div><button type="button" className="workshop-add-question" onClick={addQuestion}><Sparkles size={15}/> Add question</button></div>
              {registrationFields.map((field, index) => <article className="workshop-question-card" key={field.id}><div className="workshop-question-index">{String(index + 1).padStart(2, "0")}</div><div className="workshop-question-content"><div className="workshop-fields">
                <label className="workshop-field"><span>Question label <b>*</b></span><input value={field.label} onChange={(event) => updateQuestion(field.id, "label", event.target.value)} placeholder="What should the participant answer?" required/></label>
                <label className="workshop-field"><span>Answer type</span><select value={field.type} onChange={(event) => updateQuestion(field.id, "type", event.target.value)}><option value="text">Short answer</option><option value="textarea">Long answer</option><option value="email">Email</option><option value="tel">Phone number</option><option value="number">Number</option><option value="url">Website / URL</option><option value="select">Dropdown</option><option value="radio">Single choice</option><option value="checkbox">Checkbox / consent</option><option value="date">Date</option></select></label>
                {["select", "radio"].includes(field.type) && <label className="workshop-field workshop-field-wide"><span>Options (comma-separated) <b>*</b></span><input value={field.options} onChange={(event) => updateQuestion(field.id, "options", event.target.value)} placeholder="Beginner, Intermediate, Advanced" required/></label>}
                <label className="workshop-field workshop-field-wide"><span>Helper text (optional)</span><input value={field.helpText} onChange={(event) => updateQuestion(field.id, "helpText", event.target.value)} placeholder="Additional instructions for participants"/></label>
              </div><div className="workshop-question-bottom"><label className="workshop-check"><input type="checkbox" checked={field.required} onChange={(event) => updateQuestion(field.id, "required", event.target.checked)}/> Required question</label><div className="workshop-question-actions"><button type="button" disabled={index === 0} onClick={() => moveQuestion(index, -1)} aria-label="Move question up">↑</button><button type="button" disabled={index === registrationFields.length - 1} onClick={() => moveQuestion(index, 1)} aria-label="Move question down">↓</button><button type="button" className="remove" onClick={() => removeQuestion(field.id)}>Remove</button></div></div></div></article>)}
              <label className="workshop-field workshop-field-wide"><span>Registration consent / declaration</span><textarea value={registrationConsent} onChange={(event) => { setRegistrationConsent(event.target.value); setSaved(false); }} rows={3}/></label>
            </section>
            <section className="workshop-form-section"><div className="workshop-section-heading"><span className="workshop-section-icon"><CheckCircle2 size={19}/></span><div><h2>Registration rules</h2><p>Choose how the organizer handles sign-ups.</p></div></div>
              <label className="workshop-toggle-row"><span><strong>Require manual approval</strong><small>Registrations remain pending until an organizer approves them.</small></span><input type="checkbox" checked={requireApproval} onChange={(event) => { setRequireApproval(event.target.checked); setSaved(false); }}/></label>
              <label className="workshop-toggle-row"><span><strong>Enable waitlist</strong><small>Allow people to join a waitlist when the workshop reaches capacity.</small></span><input type="checkbox" checked={waitlistEnabled} onChange={(event) => { setWaitlistEnabled(event.target.checked); setSaved(false); }}/></label>
              <div className="workshop-registration-stats"><div><span>Questions</span><strong>{registrationFields.length}</strong></div><div><span>Required</span><strong>{registrationFields.filter((field) => field.required).length}</strong></div><div><span>Registration</span><strong>{form.registrationLink ? "External" : "On platform"}</strong></div></div>
            </section>
          </>}

          {activeTab === "registrations" && <section className="workshop-form-section workshop-active-registrations">
            <div className="workshop-section-heading"><span className="workshop-section-icon"><Users size={19}/></span><div><h2>Active registrations</h2><p>Participant details submitted for {form.title || "this workshop"}.</p></div></div>
            <div className="workshop-registration-stats"><div><span>Total submissions</span><strong>{activeRegistrations.length}</strong></div><div><span>Confirmed</span><strong>{activeRegistrations.filter((r) => String(r.status || "Registered").toLowerCase() === "approved" || String(r.status || "Registered").toLowerCase() === "confirmed" || String(r.status || "Registered").toLowerCase() === "registered").length}</strong></div><div><span>Pending review</span><strong>{activeRegistrations.filter((r) => String(r.status || "Registered").toLowerCase() === "pending").length}</strong></div></div>
            {activeRegistrations.length === 0 ? <div className="workshop-admin-empty workshop-registrations-empty"><div><Users size={24}/></div><h3>No registrations yet</h3><p>When a participant submits this workshop's public registration form, their submitted answers will appear here.</p></div> : <div className="workshop-registration-list">
              {activeRegistrations.map((registration, index) => {
                const answers = registration.answers || registration.responses || registration.data || {};
                const answerEntries = Array.isArray(answers) ? answers.map((answer, i) => [answer.label || answer.question || `Answer ${i + 1}`, answer.value ?? answer.answer ?? ""]) : Object.entries(answers);
                const status = String(registration.status || "Registered");
                const registrationId = registration.id || registration.registrationId || `${editingId}-registration-${index}`;
                const email = registration.email || answers.email || answerEntries.find(([key]) => /email/i.test(String(key)))?.[1] || "";
                const name = registration.name || registration.fullName || answers.name || answers["full-name"] || answerEntries.find(([key]) => /name/i.test(String(key)))?.[1] || `Participant ${index + 1}`;
                return <article className="workshop-registration-card" key={registrationId}>
                  <div className="workshop-registration-avatar">{String(name).trim().charAt(0).toUpperCase() || "P"}</div>
                  <div className="workshop-registration-main"><div className="workshop-registration-person"><div><h3>{String(name)}</h3>{email && <a href={`mailto:${email}`}><Mail size={13}/>{String(email)}</a>}</div><span className={`workshop-registration-status ${status.toLowerCase().replace(/\s+/g, "-")}`}>{status}</span></div>
                    <p className="workshop-registration-submitted">Submitted {registration.submittedAt || registration.createdAt ? new Date(registration.submittedAt || registration.createdAt).toLocaleString("en-IN") : "date not recorded"}</p>
                    <details className="workshop-registration-answers"><summary><Eye size={14}/> View submitted answers ({answerEntries.length})</summary><dl>{answerEntries.map(([key, value], i) => <div key={`${registrationId}-${i}`}><dt>{String(key)}</dt><dd>{Array.isArray(value) ? value.join(", ") : String(value ?? "—") || "—"}</dd></div>)}</dl></details>
                    {String(status).toLowerCase() === "pending" && <div className="workshop-registration-actions"><button type="button" onClick={() => updateRegistrationStatus(registrationId, "Approved")}><Check size={14}/> Approve</button><button type="button" className="reject" onClick={() => updateRegistrationStatus(registrationId, "Rejected")}><X size={14}/> Reject</button></div>}
                  </div>
                </article>;
              })}
            </div>}
          </section>}

          {activeTab === "publish" && <section className="workshop-form-section"><div className="workshop-section-heading"><span className="workshop-section-icon"><Sparkles size={19}/></span><div><h2>Publish & settings</h2><p>Review your public workshop before publishing.</p></div></div>
            <div className="workshop-publish-preview"><div><span>PUBLIC PAGE PREVIEW</span><h3>{form.title || "Your workshop title"}</h3><p>{form.tagline || "Your tagline will appear here."}</p><small>{form.date || "Date to be announced"} · {form.mode} · {form.feeType === "Paid" ? `₹${form.feeAmount || "—"}` : "Free"} · {Math.max(0, Math.floor(Number(form.rewardPoints) || 0))} PRISM points</small></div></div>
            <div className="workshop-publish-checklist"><h3>Before publishing</h3><p><CheckCircle2 size={16} className={form.title.trim() ? "complete" : ""}/> Add a workshop title</p><p><CheckCircle2 size={16} className={form.description.trim() ? "complete" : ""}/> Add a description</p><p><CheckCircle2 size={16} className={form.date ? "complete" : ""}/> Set the event date</p><p><CheckCircle2 size={16} className={registrationFields.length ? "complete" : ""}/> Configure registration questions</p><p><CheckCircle2 size={16} className={form.registrationDeadline ? "complete" : ""}/> Set a registration deadline</p></div>
            <div className="workshop-registration-callout"><Eye size={19}/><div><strong>How registration works</strong><p>With no external registration link, the public workshop page should display the custom form configured in the Registration form tab. Form submissions need to be handled by the public page implementation.</p></div></div>
          </section>}

          {saved && (
            <div className="workshop-save-success">
              <CheckCircle2 size={19} />
              <div>
                <strong>
                  {savedStatus === "Published" ? "Workshop published" : "Workshop draft saved"}
                </strong>
                <span>
                  {savedStatus === "Published"
                    ? "Saved as published. It should now appear on the public Events page in this browser."
                    : "Saved in this browser as a draft. It remains hidden from the public Events page."}
                </span>
              </div>
            </div>
          )}

          <div className="workshop-form-actions">
            <p>
              <span>*</span> Required fields
            </p>

            <div className="workshop-action-buttons">
              <button type="submit" name="status" value="Draft" className="workshop-save-button workshop-draft-button">Save Draft</button>
              <button
                type="submit"
                name="status"
                value="Published"
                className="workshop-save-button"
              >
                Publish Event <ArrowUpRight size={17} />
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
