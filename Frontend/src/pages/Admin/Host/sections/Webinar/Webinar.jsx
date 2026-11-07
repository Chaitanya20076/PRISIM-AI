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
import "./webinar.css";

const initialForm = {
  title: "",
  tagline: "",
  description: "",
  date: "",
  startTime: "",
  endTime: "",
  mode: "Online",
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

function isWebinarRecord(item) {
  const types = [item.type, item.category, item.customCategory]
    .filter(Boolean)
    .map((value) => String(value).trim().toLowerCase());

  const nonWebinarTypes = [
    "seminar",
    "workshop",
    "bootcamp",
    "competition",
    "contest",
    "ideathon",
    "hackathon",
  ];

  if (types.some((type) => nonWebinarTypes.includes(type))) return false;
  if (types.includes("webinar")) return true;

  const slug = String(item.slug || item.id || "").trim().toLowerCase();
  return slug.startsWith("webinar-") || slug.startsWith("webinar:");
}

function formatWebinarDate(value) {
  if (!value) return "Date to be announced";
  const date = new Date(`${value}T12:00:00`);
  return Number.isNaN(date.getTime()) ? value : date.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
}

function webinarIsPast(item) {
  const value = item.endDate || item.startDate || item.date;
  if (!value) return false;
  const date = new Date(`${value}T23:59:59`);
  return !Number.isNaN(date.getTime()) && date.getTime() < Date.now();
}

export default function Webinar() {
  const navigate = useNavigate();

  const [view, setView] = useState("list");
  const [webinars, setWebinars] = useState([]);
  const [loadingWebinars, setLoadingWebinars] = useState(true);
  const [saving, setSaving] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("All webinars");
  const [editingId, setEditingId] = useState(null);

  const refreshWebinars = async () => {
    setLoadingWebinars(true);
    try {
      const data = await adminApi("/api/admin/events");
      const allEvents = Array.isArray(data.events) ? data.events : [];
      setWebinars(allEvents.filter(isWebinarRecord));
    } catch (error) {
      console.error("Could not load webinars:", error);
      window.alert(error.message || "Could not load webinars from the server.");
    } finally {
      setLoadingWebinars(false);
    }
  };

  useEffect(() => {
    refreshWebinars();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const filteredWebinars = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return webinars.filter((item) => {
      const status = String(item.status || "Draft").toLowerCase();
      const name = String(item.title || item.name || "").toLowerCase();
      const matchesQuery = !q || name.includes(q) || status.includes(q);
      const matchesStatus = statusFilter === "All webinars" ||
        (statusFilter === "Published" && status === "published") ||
        (statusFilter === "Drafts" && status === "draft") ||
        (statusFilter === "Past" && (status === "past" || webinarIsPast(item)));
      return matchesQuery && matchesStatus;
    }).sort((a, b) => String(b.updatedAt || b.createdAt || "").localeCompare(String(a.updatedAt || a.createdAt || "")));
  }, [webinars, searchQuery, statusFilter]);

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

  const [registrationConsent, setRegistrationConsent] = useState("I confirm that the information provided is accurate and may be used by PRISM AI to manage this webinar registration.");
  const [requireApproval, setRequireApproval] = useState(false);
  const [waitlistEnabled, setWaitlistEnabled] = useState(false);

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
    setRegistrationConsent("I confirm that the information provided is accurate and may be used by PRISM AI to manage this webinar registration.");
    setRequireApproval(false);
    setWaitlistEnabled(false);
    setSaved(false);
    setActiveTab("details");
    setView("editor");
  };

  const editWebinar = async (item) => {
    try {
      const data = await adminApi(`/api/admin/events/${encodeURIComponent(item.id)}`);
      const fullItem = data.event || item;

      if (!isWebinarRecord(fullItem)) {
        window.alert("This event is not a Webinar. Open it from the correct event category.");
        return;
      }

      setEditingId(fullItem.id);
      setForm({
        ...initialForm,
        ...fullItem,
        mode: "Online",
        venue: "",
        title: fullItem.title || fullItem.name || "",
        tagline: fullItem.tagline || fullItem.caption || "",
        date: fullItem.date || fullItem.startDate || "",
        outcomes: fullItem.outcomes || fullItem.learningOutcomes || (Array.isArray(fullItem.highlights) ? fullItem.highlights.join("\n") : ""),
      });

      setPosterName(fullItem.posterName || fullItem.photos?.[0]?.name || "");
      setPosterData(fullItem.coverImage || fullItem.photos?.[0]?.data || "");

      if (Array.isArray(fullItem.registrationFields) && fullItem.registrationFields.length) {
        setRegistrationFields(fullItem.registrationFields);
      } else {
        setRegistrationFields([]);
      }

      setRegistrationConsent(fullItem.registrationConsent || "I confirm that the information provided is accurate and may be used by PRISM AI to manage this webinar registration.");
      setRequireApproval(Boolean(fullItem.requireApproval));
      setWaitlistEnabled(Boolean(fullItem.waitlistEnabled));
      setWebinars((current) => current.map((entry) => entry.id === fullItem.id ? fullItem : entry));
      setSaved(false);
      setActiveTab("details");
      setView("editor");
    } catch (error) {
      console.error("Could not load webinar:", error);
      window.alert(error.message || "Could not load this webinar.");
    }
  };

  const deleteWebinar = async (item) => {
    if (!window.confirm(`Delete "${item.title || item.name}" and all its registrations from Firestore?`)) return;

    try {
      await adminApi(`/api/admin/events/${encodeURIComponent(item.id)}`, {
        method: "DELETE",
      });
      setWebinars((current) => current.filter((entry) => entry.id !== item.id));
    } catch (error) {
      console.error("Could not delete webinar:", error);
      window.alert(error.message || "Could not delete this webinar.");
    }
  };

  const addQuestion = () => {
    setRegistrationFields((fields) => [
      ...fields,
      {
        id: `question-${Date.now()}`,
        label: "",
        type: "text",
        required: false,
        options: "",
        helpText: "",
      },
    ]);
    setSaved(false);
  };

  const updateQuestion = (id, key, value) => {
    setRegistrationFields((fields) =>
      fields.map((field) => field.id === id ? { ...field, [key]: value } : field)
    );
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

  const activeWebinar = webinars.find((item) => item.id === editingId);
  const activeRegistrations = Array.isArray(activeWebinar?.registrations) ? activeWebinar.registrations : [];

  const updateRegistrationStatus = async (registrationId, nextStatus) => {
    if (!editingId) return;

    try {
      await adminApi(`/api/admin/events/${encodeURIComponent(editingId)}/registrations/${encodeURIComponent(registrationId)}`, {
        method: "PATCH",
        body: JSON.stringify({ status: nextStatus }),
      });

      const data = await adminApi(`/api/admin/events/${encodeURIComponent(editingId)}`);
      const updatedEvent = data.event;

      if (updatedEvent && isWebinarRecord(updatedEvent)) {
        setWebinars((current) =>
          current.map((item) => item.id === editingId ? updatedEvent : item)
        );
      }
    } catch (error) {
      console.error("Could not update registration status:", error);
      window.alert(error.message || "Could not update this registration.");
    }
  };

  const submit = async (event) => {
    event.preventDefault();

    // A webinar must always have a valid online access URL.
    const meetingUrl = String(form.platformLink || "").trim();

    try {
      const parsedMeetingUrl = new URL(meetingUrl);
      if (!meetingUrl || !["http:", "https:"].includes(parsedMeetingUrl.protocol)) {
        throw new Error("invalid-url");
      }
    } catch {
      setActiveTab("details");
      window.alert("Add a valid online meeting link (starting with https://) before saving or publishing this webinar.");
      return;
    }

    const status = event.nativeEvent.submitter?.value || "Draft";
    const now = new Date().toISOString();
    const id = editingId || `webinar-${Date.now()}`;
    const previous = webinars.find((item) => item.id === id);

    const webinar = {
      ...form,
      id,
      slug: id,

      name: form.title,
      title: form.title,
      category: "Webinar",
      customCategory: "Webinar",
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
      eventFormat: "Online",
      mode: "Online",
      audience: form.audience,
      rewardPoints: Math.max(0, Math.floor(Number(form.rewardPoints) || 0)),
      platformLink: form.platformLink,
      onPlatformRegistration: !form.registrationLink,
      registrationType: form.registrationLink ? "external" : "platform",
      registrationFields: registrationFields.filter((field) => field.label.trim()),
      registrationConsent,
      requireApproval,
      waitlistEnabled,
      registrations: previous?.registrations || [],
      visibility: "Public",
      type: "Webinar",
      posterName,
      status,
      createdAt: previous?.createdAt || now,
      updatedAt: now,
    };

    setSaving(true);

    try {
      const data = await adminApi(
        editingId
          ? `/api/admin/events/${encodeURIComponent(id)}`
          : "/api/admin/events",
        {
          method: editingId ? "PUT" : "POST",
          body: JSON.stringify(webinar),
        }
      );

      const savedWebinar = data.event || webinar;

      setEditingId(savedWebinar.id);
      setWebinars((current) => {
        const exists = current.some((item) => item.id === savedWebinar.id);
        return exists
          ? current.map((item) => item.id === savedWebinar.id ? savedWebinar : item)
          : [savedWebinar, ...current];
      });

      setSavedStatus(status);
      setSaved(true);

      if (status === "Published") setView("list");
    } catch (error) {
      console.error("Could not save webinar to Firestore:", error);
      window.alert(error.message || "Could not save the webinar to Firestore.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <main className="webinar-page">
      <div className="webinar-shell">
        <button
          type="button"
          className="webinar-back"
          onClick={() => view === "editor" ? setView("list") : navigate("/admin/host")}
        >
          <ArrowLeft size={17} />
          {view === "editor" ? "Back to webinars" : "Back to event types"}
        </button>

        {view === "list" ? (
          <>
            <header className="webinar-admin-hero">
              <div className="webinar-hero-copy">
                <span className="webinar-eyebrow"><Sparkles size={14}/> WEBINARS / ORGANIZER STUDIO</span>
                <h1>Make learning <span>happen.</span></h1>
                <p>Create online webinars, manage published events and drafts, and configure each webinar's registration experience from one workspace.</p>
              </div>
              <button type="button" className="webinar-create-button" onClick={startCreate}>
                <Plus size={18}/> Create webinar <ArrowUpRight size={17}/>
              </button>
            </header>

            <section className="webinar-admin-stats">
              <div className="webinar-stat-card webinar-stat-card--violet">
                <span>All webinars</span>
                <strong>{webinars.length}</strong>
              </div>
              <div className="webinar-stat-card webinar-stat-card--mint">
                <span>Published</span>
                <strong>{webinars.filter((item) => String(item.status).toLowerCase() === "published").length}</strong>
              </div>
              <div className="webinar-stat-card webinar-stat-card--gold">
                <span>Drafts</span>
                <strong>{webinars.filter((item) => String(item.status).toLowerCase() === "draft").length}</strong>
              </div>
              <div className="webinar-stat-card webinar-stat-card--blue">
                <span>Registration open</span>
                <strong>{webinars.filter((item) => String(item.status).toLowerCase() === "published" && !webinarIsPast(item) && !(item.registrationDeadline && new Date(`${item.registrationDeadline}T23:59:59`) < new Date())).length}</strong>
              </div>
            </section>

            <section className="webinar-admin-list-section">
              <div className="webinar-list-heading">
                <div>
                  <h2>Your webinars</h2>
                  <p>Each webinar has its own public page, registration questions and submissions.</p>
                </div>
                <label className="webinar-search">
                  <span>SEARCH</span>
                  <div>
                    <Search size={16}/>
                    <input
                      value={searchQuery}
                      onChange={(event) => setSearchQuery(event.target.value)}
                      placeholder="Name or status..."
                    />
                  </div>
                </label>
              </div>

              <div className="webinar-list-toolbar">
                <div className="webinar-list-filters">
                  {["All webinars", "Published", "Drafts", "Past"].map((value) => (
                    <button
                      type="button"
                      key={value}
                      className={statusFilter === value ? "active" : ""}
                      onClick={() => setStatusFilter(value)}
                    >
                      {value}
                    </button>
                  ))}
                </div>
                <span>
                  <SlidersHorizontal size={15}/>
                  {filteredWebinars.length} webinar{filteredWebinars.length === 1 ? "" : "s"}
                </span>
              </div>

              {loadingWebinars ? (
                <div className="webinar-admin-empty">
                  <h3>Loading webinars…</h3>
                  <p>Fetching webinar records from Firestore.</p>
                </div>
              ) : filteredWebinars.length ? (
                <div className="webinar-admin-list">
                  {filteredWebinars.map((item) => {
                    const status = String(item.status || "Draft");
                    const poster = item.coverImage || item.photos?.[0]?.data || "";
                    const registrations = Array.isArray(item.registrations) ? item.registrations : [];

                    return (
                      <article className="webinar-admin-card" key={item.id}>
                        <div className="webinar-admin-card-mark">
                          {poster ? <img src={poster} alt=""/> : <CalendarDays size={25}/>}
                        </div>

                        <div className="webinar-admin-card-main">
                          <div className="webinar-admin-card-kicker">
                            <span className={`webinar-status-badge ${status.toLowerCase()}`}>{status}</span>
                            <span>{item.mode || item.eventFormat || "Online"}</span>
                          </div>
                          <h3>{item.title || item.name || "Untitled webinar"}</h3>
                          <p>{item.tagline || item.caption || item.description || "No description added yet."}</p>
                          <div className="webinar-admin-card-facts">
                            <span><CalendarDays size={14}/>{formatWebinarDate(item.startDate || item.date)}</span>
                            <span><Users size={14}/>{item.audience || "Audience not set"}</span>
                            <span><ClipboardList size={14}/>{item.registrationFields?.length || 0} registration questions</span>
                            <span><Users size={14}/>{Number(item.registrationCount ?? registrations.length)} registrations</span>
                          </div>
                          <small className="webinar-admin-slug">/events/webinars/{item.slug || item.id}</small>
                        </div>

                        <div className="webinar-admin-card-actions">
                          <button type="button" className="webinar-manage-button" onClick={() => editWebinar(item)}>
                            <Pencil size={15}/> Manage <ArrowUpRight size={15}/>
                          </button>
                          {status.toLowerCase() === "published" && (
                            <button
                              type="button"
                              className="webinar-icon-button"
                              title="Open public page"
                              onClick={() => window.open(`/events/webinars/${encodeURIComponent(item.slug || item.id)}`, "_blank", "noopener,noreferrer")}
                            >
                              <ExternalLink size={16}/>
                            </button>
                          )}
                          <button
                            type="button"
                            className="webinar-icon-button danger"
                            title="Delete webinar"
                            onClick={() => deleteWebinar(item)}
                          >
                            <Trash2 size={16}/>
                          </button>
                        </div>
                      </article>
                    );
                  })}
                </div>
              ) : (
                <div className="webinar-admin-empty">
                  <div><CalendarDays size={25}/></div>
                  <h3>{webinars.length ? "No webinars match this view" : "Your webinar studio is ready."}</h3>
                  <p>{webinars.length ? "Try another search or filter." : "Create your first webinar. Published webinars will appear here and on the public Events page."}</p>
                  <button type="button" className="webinar-create-button" onClick={startCreate}>
                    <Plus size={17}/> Create webinar
                  </button>
                </div>
              )}
            </section>
          </>
        ) : (
          <>
            <header className="webinar-hero">
              <div className="webinar-hero-copy">
                <span className="webinar-eyebrow">
                  <Sparkles size={14} />
                  WEBINAR SETUP
                </span>
                <h1>
                  Create an online webinar
                  <br />
                  <span>worth tuning in for.</span>
                </h1>
                <p>
                  Share the essential details, help students understand what
                  they’ll learn, and get your webinar ready to publish.
                </p>
              </div>

              <div className="webinar-hero-art" aria-hidden="true">
                <span className="webinar-art-ring webinar-art-ring-one" />
                <span className="webinar-art-ring webinar-art-ring-two" />
                <span className="webinar-art-icon">
                  <CalendarDays size={36} />
                </span>
                <span className="webinar-art-spark webinar-art-spark-one">✳</span>
                <span className="webinar-art-spark webinar-art-spark-two">+</span>
              </div>
            </header>

            <div className="webinar-editor-tabs" role="tablist" aria-label="Webinar setup sections">
              <button type="button" role="tab" aria-selected={activeTab === "details"} className={activeTab === "details" ? "active" : ""} onClick={() => setActiveTab("details")}>
                <FileText size={16}/> Event details
              </button>
              <button type="button" role="tab" aria-selected={activeTab === "registration"} className={activeTab === "registration" ? "active" : ""} onClick={() => setActiveTab("registration")}>
                <Users size={16}/> Registration form <span>{registrationFields.length}</span>
              </button>
              <button type="button" role="tab" aria-selected={activeTab === "publish"} className={activeTab === "publish" ? "active" : ""} onClick={() => setActiveTab("publish")}>
                <Sparkles size={16}/> Publish & settings
              </button>
              {editingId && (
                <button type="button" role="tab" aria-selected={activeTab === "registrations"} className={activeTab === "registrations" ? "active" : ""} onClick={() => setActiveTab("registrations")}>
                  <Users size={16}/> Active registrations <span>{activeRegistrations.length}</span>
                </button>
              )}
            </div>

            <form className="webinar-form" onSubmit={submit}>
              {activeTab === "details" && <>
                <section className="webinar-form-section">
                  <div className="webinar-section-heading">
                    <span className="webinar-section-icon"><FileText size={19}/></span>
                    <div>
                      <h2>Webinar basics</h2>
                      <p>Give your webinar a clear identity.</p>
                    </div>
                  </div>

                  <div className="webinar-fields">
                    <label className="webinar-field webinar-field-wide">
                      <span>Webinar title <b>*</b></span>
                      <input name="title" value={form.title} onChange={update} placeholder="e.g. Live: Build Your First AI Agent" required/>
                    </label>

                    <label className="webinar-field webinar-field-wide">
                      <span>Short tagline</span>
                      <input name="tagline" value={form.tagline} onChange={update} placeholder="A one-line hook that makes students curious"/>
                    </label>

                    <label className="webinar-field webinar-field-wide">
                      <span>Description <b>*</b></span>
                      <textarea name="description" value={form.description} onChange={update} placeholder="What will happen during the webinar? What makes it useful?" rows={4} required/>
                    </label>

                    <label className="webinar-field webinar-field-wide">
                      <span>Webinar poster</span>
                      <span className="webinar-upload">
                        <ImagePlus size={22}/>
                        <strong>{posterName || "Choose a webinar cover image"}</strong>
                        <small>Image selection only; file upload can be connected later.</small>
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
                            reader.onload = () => setPosterData(typeof reader.result === "string" ? reader.result : "");
                            reader.onerror = () => window.alert("Could not read the selected poster image.");
                            reader.readAsDataURL(file);
                          }}
                        />
                      </span>
                    </label>
                  </div>
                </section>

                <section className="webinar-form-section">
                  <div className="webinar-section-heading">
                    <span className="webinar-section-icon"><CalendarDays size={19}/></span>
                    <div>
                      <h2>Date, time &amp; online access</h2>
                      <p>Set the schedule and the online meeting link participants will use.</p>
                    </div>
                  </div>

                  <div className="webinar-fields">
                    <label className="webinar-field">
                      <span>Date <b>*</b></span>
                      <input type="date" name="date" value={form.date} onChange={update} required/>
                    </label>
                    <label className="webinar-field">
                      <span>Registration deadline</span>
                      <input type="date" name="registrationDeadline" value={form.registrationDeadline} onChange={update}/>
                    </label>
                    <label className="webinar-field">
                      <span><Clock3 size={14}/> Start time <b>*</b></span>
                      <input type="time" name="startTime" value={form.startTime} onChange={update} required/>
                    </label>
                    <label className="webinar-field">
                      <span><Clock3 size={14}/> End time <b>*</b></span>
                      <input type="time" name="endTime" value={form.endTime} onChange={update} required/>
                    </label>
                    <label className="webinar-field webinar-field-wide">
                      <span>Online meeting link <b>*</b></span>
                      <input type="url" name="platformLink" value={form.platformLink} onChange={update} placeholder="https://meet.google.com/..." required/>
                      <small className="webinar-field-help">Add the Google Meet, Zoom, Teams or other webinar access URL.</small>
                    </label>
                  </div>
                </section>

                <section className="webinar-form-section">
                  <div className="webinar-section-heading">
                    <span className="webinar-section-icon"><Users size={19}/></span>
                    <div>
                      <h2>Audience &amp; registration</h2>
                      <p>Set expectations and how students can participate.</p>
                    </div>
                  </div>

                  <div className="webinar-fields">
                    <label className="webinar-field">
                      <span>Target audience</span>
                      <select name="audience" value={form.audience} onChange={update}>
                        <option>RNSIT students</option>
                        <option>All college students</option>
                        <option>Beginners</option>
                        <option>Intermediate learners</option>
                        <option>Open to everyone</option>
                      </select>
                    </label>

                    <label className="webinar-field">
                      <span>Participant capacity</span>
                      <input type="number" min="1" name="capacity" value={form.capacity} onChange={update} placeholder="e.g. 80"/>
                    </label>

                    <label className="webinar-field">
                      <span><Sparkles size={14}/> PRISM Points reward</span>
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
                      <small className="webinar-points-help">
                        Points a member can earn for registering for this webinar. Set to 0 if this webinar has no points reward.
                      </small>
                    </label>

                    <label className="webinar-field">
                      <span><CircleDollarSign size={14}/> Entry fee</span>
                      <select name="feeType" value={form.feeType} onChange={update}>
                        <option>Free</option>
                        <option>Paid</option>
                      </select>
                    </label>

                    {form.feeType === "Paid" && (
                      <label className="webinar-field">
                        <span>Fee amount (₹)</span>
                        <input type="number" min="0" name="feeAmount" value={form.feeAmount} onChange={update} placeholder="e.g. 199"/>
                      </label>
                    )}

                    <label className="webinar-field webinar-field-wide">
                      <span>Registration link</span>
                      <input type="url" name="registrationLink" value={form.registrationLink} onChange={update} placeholder="https://... (optional if registrations will be on the platform)"/>
                    </label>
                  </div>
                </section>

                <section className="webinar-form-section">
                  <div className="webinar-section-heading">
                    <span className="webinar-section-icon"><Sparkles size={19}/></span>
                    <div>
                      <h2>Learning &amp; contact</h2>
                      <p>Help students know what they’ll gain and who to contact.</p>
                    </div>
                  </div>

                  <div className="webinar-fields">
                    <label className="webinar-field webinar-field-wide">
                      <span>Learning outcomes</span>
                      <textarea name="outcomes" value={form.outcomes} onChange={update} rows={3} placeholder="What will attendees be able to do after this webinar?"/>
                    </label>
                    <label className="webinar-field webinar-field-wide">
                      <span>Prerequisites / what to bring</span>
                      <textarea name="prerequisites" value={form.prerequisites} onChange={update} rows={2} placeholder="Mention any tools, accounts or prior knowledge required."/>
                    </label>
                    <label className="webinar-field">
                      <span>Contact person</span>
                      <input name="contactName" value={form.contactName} onChange={update} placeholder="Name"/>
                    </label>
                    <label className="webinar-field">
                      <span>Contact email</span>
                      <input type="email" name="contactEmail" value={form.contactEmail} onChange={update} placeholder="club@example.com"/>
                    </label>
                    <label className="webinar-field">
                      <span>Instructor / facilitator</span>
                      <input name="instructor" value={form.instructor} onChange={update} placeholder="Speaker or facilitator name"/>
                    </label>
                  </div>
                </section>
              </>}

              {activeTab === "registration" && <>
                <section className="webinar-form-section">
                  <div className="webinar-section-heading">
                    <span className="webinar-section-icon"><Users size={19}/></span>
                    <div>
                      <h2>Build your registration form</h2>
                      <p>These questions belong only to this webinar.</p>
                    </div>
                  </div>

                  <div className="webinar-registration-callout">
                    <CheckCircle2 size={19}/>
                    <div>
                      <strong>Custom webinar registration</strong>
                      <p>Participants will complete these questions on the public webinar page. Required answers will be validated before submission.</p>
                    </div>
                  </div>

                  <div className="webinar-question-header">
                    <div>
                      <h3>Registration questions <span>{registrationFields.length}</span></h3>
                      <p>Add questions, choose answer types, set required fields and reorder them.</p>
                    </div>
                    <button type="button" className="webinar-add-question" onClick={addQuestion}>
                      <Sparkles size={15}/> Add question
                    </button>
                  </div>

                  {registrationFields.map((field, index) => (
                    <article className="webinar-question-card" key={field.id}>
                      <div className="webinar-question-index">{String(index + 1).padStart(2, "0")}</div>
                      <div className="webinar-question-content">
                        <div className="webinar-fields">
                          <label className="webinar-field">
                            <span>Question label <b>*</b></span>
                            <input value={field.label} onChange={(event) => updateQuestion(field.id, "label", event.target.value)} placeholder="What should the participant answer?" required/>
                          </label>
                          <label className="webinar-field">
                            <span>Answer type</span>
                            <select value={field.type} onChange={(event) => updateQuestion(field.id, "type", event.target.value)}>
                              <option value="text">Short answer</option>
                              <option value="textarea">Long answer</option>
                              <option value="email">Email</option>
                              <option value="tel">Phone number</option>
                              <option value="number">Number</option>
                              <option value="url">Website / URL</option>
                              <option value="select">Dropdown</option>
                              <option value="radio">Single choice</option>
                              <option value="checkbox">Checkbox / consent</option>
                              <option value="date">Date</option>
                            </select>
                          </label>
                          {["select", "radio"].includes(field.type) && (
                            <label className="webinar-field webinar-field-wide">
                              <span>Options (comma-separated) <b>*</b></span>
                              <input value={field.options} onChange={(event) => updateQuestion(field.id, "options", event.target.value)} placeholder="Beginner, Intermediate, Advanced" required/>
                            </label>
                          )}
                          <label className="webinar-field webinar-field-wide">
                            <span>Helper text (optional)</span>
                            <input value={field.helpText} onChange={(event) => updateQuestion(field.id, "helpText", event.target.value)} placeholder="Additional instructions for participants"/>
                          </label>
                        </div>

                        <div className="webinar-question-bottom">
                          <label className="webinar-check">
                            <input type="checkbox" checked={field.required} onChange={(event) => updateQuestion(field.id, "required", event.target.checked)}/>
                            Required question
                          </label>
                          <div className="webinar-question-actions">
                            <button type="button" disabled={index === 0} onClick={() => moveQuestion(index, -1)} aria-label="Move question up">↑</button>
                            <button type="button" disabled={index === registrationFields.length - 1} onClick={() => moveQuestion(index, 1)} aria-label="Move question down">↓</button>
                            <button type="button" className="remove" onClick={() => removeQuestion(field.id)}>Remove</button>
                          </div>
                        </div>
                      </div>
                    </article>
                  ))}

                  <label className="webinar-field webinar-field-wide">
                    <span>Registration consent / declaration</span>
                    <textarea value={registrationConsent} onChange={(event) => { setRegistrationConsent(event.target.value); setSaved(false); }} rows={3}/>
                  </label>
                </section>

                <section className="webinar-form-section">
                  <div className="webinar-section-heading">
                    <span className="webinar-section-icon"><CheckCircle2 size={19}/></span>
                    <div>
                      <h2>Registration rules</h2>
                      <p>Choose how the organizer handles sign-ups.</p>
                    </div>
                  </div>

                  <label className="webinar-toggle-row">
                    <span>
                      <strong>Require manual approval</strong>
                      <small>Registrations remain pending until an organizer approves them.</small>
                    </span>
                    <input type="checkbox" checked={requireApproval} onChange={(event) => { setRequireApproval(event.target.checked); setSaved(false); }}/>
                  </label>

                  <label className="webinar-toggle-row">
                    <span>
                      <strong>Enable waitlist</strong>
                      <small>Allow people to join a waitlist when the webinar reaches capacity.</small>
                    </span>
                    <input type="checkbox" checked={waitlistEnabled} onChange={(event) => { setWaitlistEnabled(event.target.checked); setSaved(false); }}/>
                  </label>

                  <div className="webinar-registration-stats">
                    <div><span>Questions</span><strong>{registrationFields.length}</strong></div>
                    <div><span>Required</span><strong>{registrationFields.filter((field) => field.required).length}</strong></div>
                    <div><span>Registration</span><strong>{form.registrationLink ? "External" : "On platform"}</strong></div>
                  </div>
                </section>
              </>}

              {activeTab === "registrations" && (
                <section className="webinar-form-section webinar-active-registrations">
                  <div className="webinar-section-heading">
                    <span className="webinar-section-icon"><Users size={19}/></span>
                    <div>
                      <h2>Active registrations</h2>
                      <p>Participant details submitted for {form.title || "this webinar"}.</p>
                    </div>
                  </div>

                  <div className="webinar-registration-stats">
                    <div><span>Total submissions</span><strong>{activeRegistrations.length}</strong></div>
                    <div><span>Confirmed</span><strong>{activeRegistrations.filter((r) => ["approved", "confirmed", "registered"].includes(String(r.status || "Registered").toLowerCase())).length}</strong></div>
                    <div><span>Pending review</span><strong>{activeRegistrations.filter((r) => String(r.status || "Registered").toLowerCase() === "pending").length}</strong></div>
                  </div>

                  {activeRegistrations.length === 0 ? (
                    <div className="webinar-admin-empty webinar-registrations-empty">
                      <div><Users size={24}/></div>
                      <h3>No registrations yet</h3>
                      <p>When a participant submits this webinar's public registration form, their submitted answers will appear here.</p>
                    </div>
                  ) : (
                    <div className="webinar-registration-list">
                      {activeRegistrations.map((registration, index) => {
                        const answers = registration.answers || registration.responses || registration.data || {};
                        const answerEntries = Array.isArray(answers)
                          ? answers.map((answer, i) => [answer.label || answer.question || `Answer ${i + 1}`, answer.value ?? answer.answer ?? ""])
                          : Object.entries(answers);
                        const status = String(registration.status || "Registered");
                        const registrationId = registration.id || registration.registrationId || `${editingId}-registration-${index}`;
                        const email = registration.email || answers.email || answerEntries.find(([key]) => /email/i.test(String(key)))?.[1] || "";
                        const name = registration.name || registration.fullName || answers.name || answers["full-name"] || answerEntries.find(([key]) => /name/i.test(String(key)))?.[1] || `Participant ${index + 1}`;

                        return (
                          <article className="webinar-registration-card" key={registrationId}>
                            <div className="webinar-registration-avatar">{String(name).trim().charAt(0).toUpperCase() || "P"}</div>
                            <div className="webinar-registration-main">
                              <div className="webinar-registration-person">
                                <div>
                                  <h3>{String(name)}</h3>
                                  {email && <a href={`mailto:${email}`}><Mail size={13}/>{String(email)}</a>}
                                </div>
                                <span className={`webinar-registration-status ${status.toLowerCase().replace(/\s+/g, "-")}`}>{status}</span>
                              </div>
                              <p className="webinar-registration-submitted">
                                Submitted {registration.submittedAt || registration.createdAt ? new Date(registration.submittedAt || registration.createdAt).toLocaleString("en-IN") : "date not recorded"}
                              </p>
                              <details className="webinar-registration-answers">
                                <summary><Eye size={14}/> View submitted answers ({answerEntries.length})</summary>
                                <dl>
                                  {answerEntries.map(([key, value], i) => (
                                    <div key={`${registrationId}-${i}`}>
                                      <dt>{String(key)}</dt>
                                      <dd>{Array.isArray(value) ? value.join(", ") : String(value ?? "—") || "—"}</dd>
                                    </div>
                                  ))}
                                </dl>
                              </details>
                              {String(status).toLowerCase() === "pending" && (
                                <div className="webinar-registration-actions">
                                  <button type="button" onClick={() => updateRegistrationStatus(registrationId, "Approved")}><Check size={14}/> Approve</button>
                                  <button type="button" className="reject" onClick={() => updateRegistrationStatus(registrationId, "Rejected")}><X size={14}/> Reject</button>
                                </div>
                              )}
                            </div>
                          </article>
                        );
                      })}
                    </div>
                  )}
                </section>
              )}

              {activeTab === "publish" && (
                <section className="webinar-form-section">
                  <div className="webinar-section-heading">
                    <span className="webinar-section-icon"><Sparkles size={19}/></span>
                    <div>
                      <h2>Publish &amp; settings</h2>
                      <p>Review your public webinar before publishing.</p>
                    </div>
                  </div>

                  <div className="webinar-publish-preview">
                    <div>
                      <span>PUBLIC PAGE PREVIEW</span>
                      <h3>{form.title || "Your webinar title"}</h3>
                      <p>{form.tagline || "Your tagline will appear here."}</p>
                      <small>{form.date || "Date to be announced"} · {form.mode} · {form.feeType === "Paid" ? `₹${form.feeAmount || "—"}` : "Free"} · {Math.max(0, Math.floor(Number(form.rewardPoints) || 0))} PRISM points</small>
                    </div>
                  </div>

                  <div className="webinar-publish-checklist">
                    <h3>Before publishing</h3>
                    <p><CheckCircle2 size={16} className={form.title.trim() ? "complete" : ""}/> Add a webinar title</p>
                    <p><CheckCircle2 size={16} className={form.description.trim() ? "complete" : ""}/> Add a description</p>
                    <p><CheckCircle2 size={16} className={form.date ? "complete" : ""}/> Set the event date</p>
                    <p><CheckCircle2 size={16} className={registrationFields.length ? "complete" : ""}/> Configure registration questions</p>
                    <p><CheckCircle2 size={16} className={form.registrationDeadline ? "complete" : ""}/> Set a registration deadline</p>
                  </div>

                  <div className="webinar-registration-callout">
                    <Eye size={19}/>
                    <div>
                      <strong>How registration works</strong>
                      <p>With no external registration link, the public webinar page should display the custom form configured in the Registration form tab. Form submissions need to be handled by the public page implementation.</p>
                    </div>
                  </div>
                </section>
              )}

              {saved && (
                <div className="webinar-save-success">
                  <CheckCircle2 size={19}/>
                  <div>
                    <strong>{savedStatus === "Published" ? "Webinar published" : "Webinar draft saved"}</strong>
                    <span>
                      {savedStatus === "Published"
                        ? "Saved to Firestore and published. It is available to the public webinar page."
                        : "Saved to Firestore as a draft. It remains hidden from the public page."}
                    </span>
                  </div>
                </div>
              )}

              <div className="webinar-form-actions">
                <p><span>*</span> Required fields</p>
                <div className="webinar-action-buttons">
                  <button type="submit" name="status" value="Draft" className="webinar-save-button webinar-draft-button" disabled={saving}>
                    {saving ? "Saving…" : "Save Draft"}
                  </button>
                  <button type="submit" name="status" value="Published" className="webinar-save-button" disabled={saving}>
                    {saving ? "Publishing…" : "Publish Event"} <ArrowUpRight size={17}/>
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