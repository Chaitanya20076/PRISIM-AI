
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
  Trophy,
} from "lucide-react";
import "./competition.css";

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
  registrationDeadline: "",
  feeType: "Free",
  feeAmount: "",
  registrationLink: "",
  contactName: "",
  contactEmail: "",
  outcomes: "",
  prerequisites: "",
  competitionCategory: "Hackathon-style coding",
  participationType: "Team",
  minTeamSize: "2",
  maxTeamSize: "4",
  rounds: "",
  rules: "",
  judgingCriteria: "",
  prizePool: "",
  firstPrize: "",
  secondPrize: "",
  thirdPrize: "",
  submissionLink: "",
  rewardPoints: 0,
};

const API_BASE_URL =
  import.meta.env.VITE_API_URL ||
  import.meta.env.VITE_API_BASE_URL ||
  "http://localhost:5000";

const ADMIN_EVENTS_ENDPOINT = `${API_BASE_URL}/api/admin/events`;

const DEFAULT_REGISTRATION_CONSENT =
  "I confirm that the information provided is accurate and may be used by PRISM AI to manage this competition registration.";

function getAdminToken() {
  return sessionStorage.getItem("prism-admin-token");
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
        Accept: "application/json",
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
    throw new Error(data.message || "The requested competition operation failed.");
  }
  return data;
}

function extractEvents(data) {
  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.events)) return data.events;
  if (Array.isArray(data?.data)) return data.data;
  if (Array.isArray(data?.items)) return data.items;
  return [];
}

function isCompetitionEvent(item) {
  const types = [item?.type, item?.category, item?.customCategory]
    .filter(Boolean)
    .map((value) => String(value).trim().toLowerCase());
  return types.includes("competition");
}

function normalizeCompetition(item) {
  return {
    ...item,
    id: item.id || item._id,
    title: item.title || item.name || "",
    name: item.name || item.title || "",
    registrationFields: Array.isArray(item.registrationFields) ? item.registrationFields : [],
    registrations: Array.isArray(item.registrations) ? item.registrations : [],
  };
}

function getDefaultRegistrationFields() {
  return [
    { id: "full-name", label: "Full name", type: "text", required: true, options: "", helpText: "As on your college ID" },
    { id: "email", label: "Email address", type: "email", required: true, options: "", helpText: "Use an email you check regularly" },
    { id: "phone", label: "Phone number", type: "tel", required: true, options: "", helpText: "" },
    { id: "college", label: "College / institution", type: "text", required: true, options: "", helpText: "" },
    { id: "course-year", label: "Course and year", type: "text", required: true, options: "", helpText: "Example: CSE, 2nd year" },
  ];
}

function formatCompetitionDate(value) {
  if (!value) return "Date to be announced";
  const date = new Date(`${value}T12:00:00`);
  return Number.isNaN(date.getTime()) ? value : date.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
}

function competitionIsPast(item) {
  const value = item.endDate || item.startDate || item.date;
  if (!value) return false;
  const date = new Date(`${value}T23:59:59`);
  return !Number.isNaN(date.getTime()) && date.getTime() < Date.now();
}

export default function Competition() {
  // Hooks must be called inside the component.
  const navigate = useNavigate();
  const [view, setView] = useState("list");
  const [competitions, setCompetitions] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("All competitions");
  const [editingId, setEditingId] = useState(null);
  const [loadingCompetitions, setLoadingCompetitions] = useState(true);
  const [saving, setSaving] = useState(false);

  const refreshCompetitions = async () => {
    setLoadingCompetitions(true);
    try {
      const data = await adminRequest();
      setCompetitions(extractEvents(data).map(normalizeCompetition).filter(isCompetitionEvent));
    } catch (error) {
      console.error("Could not load competitions from Firestore:", error);
      window.alert(error.message || "Could not load competitions from the server.");
    } finally {
      setLoadingCompetitions(false);
    }
  };

  useEffect(() => {
    refreshCompetitions();
  }, []);

  const filteredCompetitions = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return competitions.filter((item) => {
      const status = String(item.status || "Draft").toLowerCase();
      const name = String(item.title || item.name || "").toLowerCase();
      const matchesQuery = !q || name.includes(q) || status.includes(q);
      const matchesStatus = statusFilter === "All competitions" ||
        (statusFilter === "Published" && status === "published") ||
        (statusFilter === "Drafts" && status === "draft") ||
        (statusFilter === "Past" && (status === "past" || competitionIsPast(item)));
      return matchesQuery && matchesStatus;
    }).sort((a,b) => String(b.updatedAt || b.createdAt || "").localeCompare(String(a.updatedAt || a.createdAt || "")));
  }, [competitions, searchQuery, statusFilter]);

  const startCreate = () => {
    setEditingId(null);
    setForm(initialForm);
    setPosterName("");
    setPosterData("");
    setRegistrationFields(getDefaultRegistrationFields());
    setRegistrationConsent(DEFAULT_REGISTRATION_CONSENT);
    setRequireApproval(false);
    setWaitlistEnabled(false);
    setSavedStatus("Draft");
    setSaved(false);
    setActiveTab("details");
    setView("editor");
  };

  const editCompetition = async (item) => {
    try {
      const data = await adminRequest(`/${encodeURIComponent(item.id)}`);
      const event = normalizeCompetition(data.event || item);

      setEditingId(event.id);
      setCompetitions((current) =>
        current.map((entry) => entry.id === event.id ? event : entry)
      );
      setForm({
        ...initialForm,
        ...event,
        mode: event.mode || event.eventFormat || "In-person",
        venue: event.venue || "",
        title: event.title || event.name || "",
        tagline: event.tagline || event.caption || "",
        date: event.date || event.startDate || "",
        duration: event.duration || "",
        skillLevel: event.skillLevel || "Beginner friendly",
        outcomes: event.outcomes || event.learningOutcomes ||
          (Array.isArray(event.highlights) ? event.highlights.join("\n") : ""),
      });
      setPosterName(event.posterName || event.photos?.[0]?.name || "");
      setPosterData(event.coverImage || event.photos?.[0]?.data || "");
      setRegistrationFields(
        Array.isArray(event.registrationFields) && event.registrationFields.length
          ? event.registrationFields
          : getDefaultRegistrationFields()
      );
      setRegistrationConsent(event.registrationConsent || DEFAULT_REGISTRATION_CONSENT);
      setRequireApproval(Boolean(event.requireApproval));
      setWaitlistEnabled(Boolean(event.waitlistEnabled));
      setSaved(false);
      setActiveTab("details");
      setView("editor");
    } catch (error) {
      console.error("Could not load competition details:", error);
      window.alert(error.message || "Could not load competition details.");
    }
  };

  const deleteCompetition = async (item) => {
    if (!window.confirm(`Delete "${item.title || item.name}" and all its registrations from Firestore?`)) return;

    try {
      await adminRequest(`/${encodeURIComponent(item.id)}`, { method: "DELETE" });
      setCompetitions((current) => current.filter((entry) => entry.id !== item.id));
      if (editingId === item.id) {
        setEditingId(null);
        setView("list");
      }
    } catch (error) {
      console.error("Could not delete competition:", error);
      window.alert(error.message || "Could not delete this competition.");
    }
  };

  const [form, setForm] = useState(initialForm);
  const [posterName, setPosterName] = useState("");
  const [posterData, setPosterData] = useState("");
  const [saved, setSaved] = useState(false);
  const [savedStatus, setSavedStatus] = useState("Draft");
  const [activeTab, setActiveTab] = useState("details");
  const [registrationFields, setRegistrationFields] = useState(getDefaultRegistrationFields);
  const [registrationConsent, setRegistrationConsent] = useState(DEFAULT_REGISTRATION_CONSENT);
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

  const activeCompetition = competitions.find((item) => item.id === editingId);
  const activeRegistrations = Array.isArray(activeCompetition?.registrations) ? activeCompetition.registrations : [];

  const updateRegistrationStatus = async (registrationId, nextStatus) => {
    if (!editingId) return;

    try {
      const data = await adminRequest(
        `/${encodeURIComponent(editingId)}/registrations/${encodeURIComponent(registrationId)}`,
        {
          method: "PATCH",
          body: JSON.stringify({ status: nextStatus }),
        }
      );

      setCompetitions((current) =>
        current.map((item) => item.id !== editingId ? item : {
          ...item,
          registrations: (item.registrations || []).map((registration) =>
            registration.id === registrationId
              ? { ...registration, ...(data.registration || {}), status: nextStatus }
              : registration
          ),
        })
      );
    } catch (error) {
      console.error("Could not update registration status:", error);
      window.alert(error.message || "Could not update this registration.");
    }
  };

  const submit = async (event) => {
    event.preventDefault();

    const status = event.nativeEvent?.submitter?.value || "Draft";

    if (status === "Published") {
      const missing = [];
      if (!form.title.trim()) missing.push("competition title");
      if (!form.description.trim()) missing.push("description");
      if (!form.date) missing.push("start date");
      if (!form.duration.trim()) missing.push("duration");
      if (missing.length) {
        window.alert(`Please complete the following before publishing: ${missing.join(", ")}.`);
        setActiveTab("details");
        return;
      }
      if (form.registrationDeadline && form.date && form.registrationDeadline > form.date) {
        window.alert("The registration deadline cannot be after the competition start date.");
        setActiveTab("details");
        return;
      }
      if (form.participationType !== "Individual" && Number(form.minTeamSize) > Number(form.maxTeamSize)) {
        window.alert("Minimum team size cannot be greater than maximum team size.");
        setActiveTab("details");
        return;
      }
    }

    const now = new Date().toISOString();
    const id = editingId || `competition-${Date.now()}`;
    const previous = competitions.find((item) => item.id === id);

    const competition = {
      ...form,
      rewardPoints: Math.max(0, Math.floor(Number(form.rewardPoints) || 0)),
      id,
      slug: id,

      // Keep the fields expected by the public Events page.
      name: form.title,
      title: form.title,
      category: "Competition",
      customCategory: "Competition",
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
      registrations: previous?.registrations || [],
      visibility: "Public",

      type: "Competition",
      competitionCategory: form.competitionCategory,
      participationType: form.participationType,
      minTeamSize: form.minTeamSize,
      maxTeamSize: form.maxTeamSize,
      rounds: form.rounds,
      rules: form.rules,
      judgingCriteria: form.judgingCriteria,
      prizePool: form.prizePool,
      prizes: { first: form.firstPrize, second: form.secondPrize, third: form.thirdPrize },
      submissionLink: form.submissionLink,
      posterName,
      status,
      createdAt: previous?.createdAt || now,
      updatedAt: now,
    };

    setSaving(true);
    try {
      const data = await adminRequest(
        editingId ? `/${encodeURIComponent(id)}` : "",
        {
          method: editingId ? "PUT" : "POST",
          body: JSON.stringify(competition),
        }
      );

      const savedEvent = normalizeCompetition(data.event || { ...competition, id });
      setEditingId(savedEvent.id);
      setCompetitions((current) => {
        const exists = current.some((item) => item.id === savedEvent.id);
        return exists
          ? current.map((item) => item.id === savedEvent.id ? { ...item, ...savedEvent } : item)
          : [savedEvent, ...current];
      });
      setSavedStatus(status);
      setSaved(true);
      if (status === "Published") setView("list");
    } catch (error) {
      console.error("Could not save competition to Firestore:", error);
      window.alert(error.message || "Could not save the competition to Firestore.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <main className="competition-page">
      <div className="competition-shell">
        <button
          type="button"
          className="competition-back"
          onClick={() => view === "editor" ? setView("list") : navigate("/admin/host")}
        >
          <ArrowLeft size={17} />
          {view === "editor" ? "Back to competitions" : "Back to event types"}
        </button>

        {view === "list" ? (
          <>
            <header className="competition-admin-hero">
              <div className="competition-hero-copy">
                <span className="competition-eyebrow"><Sparkles size={14}/> COMPETITIONS / ORGANIZER STUDIO</span>
                <h1>Make learning <span>happen.</span></h1>
                <p>Create online competitions, manage published events and drafts, and configure each competition's registration experience from one workspace.</p>
              </div>
              <button type="button" className="competition-create-button" onClick={startCreate}><Plus size={18}/> Create competition <ArrowUpRight size={17}/></button>
            </header>
            <section className="competition-admin-stats">
              <div className="competition-stat-card competition-stat-card--violet"><span>All competitions</span><strong>{competitions.length}</strong></div>
              <div className="competition-stat-card competition-stat-card--mint"><span>Published</span><strong>{competitions.filter((item) => String(item.status).toLowerCase() === "published").length}</strong></div>
              <div className="competition-stat-card competition-stat-card--gold"><span>Drafts</span><strong>{competitions.filter((item) => String(item.status).toLowerCase() === "draft").length}</strong></div>
              <div className="competition-stat-card competition-stat-card--blue"><span>Registration open</span><strong>{competitions.filter((item) => String(item.status).toLowerCase() === "published" && !competitionIsPast(item) && !(item.registrationDeadline && new Date(`${item.registrationDeadline}T23:59:59`) < new Date())).length}</strong></div>
            </section>
            <section className="competition-admin-list-section">
              <div className="competition-list-heading">
                <div><h2>Your competitions</h2><p>Each competition has its own public page, registration questions and submissions.</p></div>
                <label className="competition-search"><span>SEARCH</span><div><Search size={16}/><input value={searchQuery} onChange={(event) => setSearchQuery(event.target.value)} placeholder="Name or status..."/></div></label>
              </div>
              <div className="competition-list-toolbar"><div className="competition-list-filters">{["All competitions", "Published", "Drafts", "Past"].map((value) => <button type="button" key={value} className={statusFilter === value ? "active" : ""} onClick={() => setStatusFilter(value)}>{value}</button>)}</div><span><SlidersHorizontal size={15}/> {filteredCompetitions.length} competition{filteredCompetitions.length === 1 ? "" : "s"} · Firestore</span><button type="button" className="competition-manage-button" onClick={refreshCompetitions} disabled={loadingCompetitions}>Refresh</button></div>
              {loadingCompetitions ? (
                <div className="competition-admin-empty"><div><CalendarDays size={25}/></div><h3>Loading competitions…</h3><p>Fetching your competitions from Firestore.</p></div>
              ) : filteredCompetitions.length ? <div className="competition-admin-list">{filteredCompetitions.map((item) => {
                const status = String(item.status || "Draft");
                const poster = item.coverImage || item.photos?.[0]?.data || "";
                const registrations = Array.isArray(item.registrations) ? item.registrations : [];
                return <article className="competition-admin-card" key={item.id}>
                  <div className="competition-admin-card-mark">{poster ? <img src={poster} alt=""/> : <CalendarDays size={25}/>}</div>
                  <div className="competition-admin-card-main"><div className="competition-admin-card-kicker"><span className={`competition-status-badge ${status.toLowerCase()}`}>{status}</span><span>{item.mode || item.eventFormat || "Format not set"}</span></div><h3>{item.title || item.name || "Untitled competition"}</h3><p>{item.tagline || item.caption || item.description || "No description added yet."}</p><div className="competition-admin-card-facts"><span><CalendarDays size={14}/>{formatCompetitionDate(item.startDate || item.date)}</span><span><Trophy size={14}/>{item.competitionCategory || "Competition"}</span><span><Users size={14}/>{item.audience || "Audience not set"}</span><span><ClipboardList size={14}/>{item.registrationFields?.length || 0} registration questions</span><span><Users size={14}/>{registrations.length} registrations</span></div><small className="competition-admin-slug">/events/competitions/{item.slug || item.id}</small></div>
                  <div className="competition-admin-card-actions"><button type="button" className="competition-manage-button" onClick={() => editCompetition(item)}><Pencil size={15}/> Manage <ArrowUpRight size={15}/></button>{status.toLowerCase() === "published" && <button type="button" className="competition-icon-button" title="Open public page" onClick={() => window.open(`/events/competitions/${encodeURIComponent(item.slug || item.id)}`, "_blank", "noopener,noreferrer")}><ExternalLink size={16}/></button>}<button type="button" className="competition-icon-button danger" title="Delete competition" onClick={() => deleteCompetition(item)}><Trash2 size={16}/></button></div>
                </article>;
              })}</div> : <div className="competition-admin-empty"><div><CalendarDays size={25}/></div><h3>{competitions.length ? "No competitions match this view" : "Your competition studio is ready."}</h3><p>{competitions.length ? "Try another search or filter." : "Create your first competition. Published competitions will appear here and on the public Events page."}</p><button type="button" className="competition-create-button" onClick={startCreate}><Plus size={17}/> Create competition</button></div>}
            </section>
          </>
        ) : (
          <>
        <header className="competition-hero">
          <div className="competition-hero-copy">
            <span className="competition-eyebrow">
              <Sparkles size={14} />
              COMPETITION SETUP
            </span>

            <h1>
              Create an online competition
              <br />
              <span>worth tuning in for.</span>
            </h1>

            <p>
              Share the essential details, help students understand what
              they’ll learn, and get your competition ready to publish.
            </p>
          </div>

          <div className="competition-hero-art" aria-hidden="true">
            <span className="competition-art-icon">
              <CalendarDays size={36} />
            </span>
          </div>
        </header>

        <div className="competition-editor-tabs" role="tablist" aria-label="Competition setup sections">
          <button type="button" role="tab" aria-selected={activeTab === "details"} className={activeTab === "details" ? "active" : ""} onClick={() => setActiveTab("details")}><FileText size={16}/> Event details</button>
          <button type="button" role="tab" aria-selected={activeTab === "registration"} className={activeTab === "registration" ? "active" : ""} onClick={() => setActiveTab("registration")}><Users size={16}/> Registration form <span>{registrationFields.length}</span></button>
          <button type="button" role="tab" aria-selected={activeTab === "publish"} className={activeTab === "publish" ? "active" : ""} onClick={() => setActiveTab("publish")}><Sparkles size={16}/> Publish & settings</button>
          {editingId && <button type="button" role="tab" aria-selected={activeTab === "registrations"} className={activeTab === "registrations" ? "active" : ""} onClick={() => setActiveTab("registrations")}><Users size={16}/> Active registrations <span>{activeRegistrations.length}</span></button>}
        </div>

        <form className="competition-form" onSubmit={submit}>
          {activeTab === "details" && <>
          {/* Competition basics */}
          <section className="competition-form-section">
            <div className="competition-section-heading">
              <span className="competition-section-icon">
                <FileText size={19} />
              </span>

              <div>
                <h2>Competition basics</h2>
                <p>Give your competition a clear identity.</p>
              </div>
            </div>

            <div className="competition-fields">
              <label className="competition-field competition-field-wide">
                <span>
                  Competition title <b>*</b>
                </span>
                <input
                  name="title"
                  value={form.title}
                  onChange={update}
                  placeholder="e.g. Full-Stack Web Development Competition"
                  required
                />
              </label>

              <label className="competition-field competition-field-wide">
                <span>Short tagline</span>
                <input
                  name="tagline"
                  value={form.tagline}
                  onChange={update}
                  placeholder="A focused, hands-on learning experience"
                />
              </label>

              <label className="competition-field competition-field-wide">
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

              <label className="competition-field competition-field-wide">
                <span>Competition poster</span>

                <span className="competition-upload">
                  <ImagePlus size={22} />
                  <strong>{posterName || "Choose a competition cover image"}</strong>
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

          {/* Competition schedule and learning path */}
          <section className="competition-form-section">
            <div className="competition-section-heading"><span className="competition-section-icon"><CalendarDays size={19} /></span><div><h2>Schedule &amp; learning path</h2><p>Set the schedule and make the learning commitment clear.</p></div></div>
            <div className="competition-fields">
              <label className="competition-field"><span>Start date <b>*</b></span><input type="date" name="date" value={form.date} onChange={update} required /></label>
              <label className="competition-field"><span>Registration deadline</span><input type="date" name="registrationDeadline" value={form.registrationDeadline} onChange={update} /></label>
              <label className="competition-field"><span><Clock3 size={14} /> Daily start time</span><input type="time" name="startTime" value={form.startTime} onChange={update} /></label>
              <label className="competition-field"><span><Clock3 size={14} /> Daily end time</span><input type="time" name="endTime" value={form.endTime} onChange={update} /></label>
              <label className="competition-field"><span>Duration <b>*</b></span><input name="duration" value={form.duration} onChange={update} placeholder="e.g. 3 days / 2 weeks" required /></label>
              <label className="competition-field"><span>Skill level</span><select name="skillLevel" value={form.skillLevel} onChange={update}><option>Beginner friendly</option><option>Beginner</option><option>Intermediate</option><option>Advanced</option><option>All levels</option></select></label>
              <label className="competition-field"><span>Delivery format</span><select name="mode" value={form.mode} onChange={update}><option>In-person</option><option>Online</option><option>Hybrid</option></select></label>
              <label className="competition-field"><span>Venue / platform</span><input name="venue" value={form.venue} onChange={update} placeholder="e.g. RNSIT Lab 3 or Google Meet" /></label>
            </div>
          </section>

          {/* Competition structure, rules and prizes */}
          <section className="competition-form-section">
            <div className="competition-section-heading"><span className="competition-section-icon"><Trophy size={19} /></span><div><h2>Competition structure &amp; prizes</h2><p>Define participation, rounds, judging and rewards.</p></div></div>
            <div className="competition-fields">
              <label className="competition-field"><span>Competition category <b>*</b></span><select name="competitionCategory" value={form.competitionCategory} onChange={update} required><option>Hackathon-style coding</option><option>Project showcase</option><option>Ideathon</option><option>Quiz / knowledge contest</option><option>Design competition</option><option>Research / paper presentation</option><option>Gaming / esports</option><option>Other</option></select></label>
              <label className="competition-field"><span>Participation type <b>*</b></span><select name="participationType" value={form.participationType} onChange={update} required><option>Individual</option><option>Team</option><option>Individual or Team</option></select></label>
              {form.participationType !== "Individual" && <><label className="competition-field"><span>Minimum team size</span><input type="number" min="1" name="minTeamSize" value={form.minTeamSize} onChange={update}/></label><label className="competition-field"><span>Maximum team size</span><input type="number" min="1" name="maxTeamSize" value={form.maxTeamSize} onChange={update}/></label></>}
              <label className="competition-field competition-field-wide"><span>Rounds / stages</span><textarea name="rounds" value={form.rounds} onChange={update} rows={2} placeholder="e.g. Preliminary screening, prototype round, final presentation"/></label>
              <label className="competition-field competition-field-wide"><span>Rules &amp; eligibility</span><textarea name="rules" value={form.rules} onChange={update} rows={3} placeholder="Eligibility, team rules, originality policy and submission requirements."/></label>
              <label className="competition-field competition-field-wide"><span>Judging criteria</span><textarea name="judgingCriteria" value={form.judgingCriteria} onChange={update} rows={2} placeholder="e.g. Innovation, technical execution, impact and presentation."/></label>
              <label className="competition-field"><span>Total prize pool (₹)</span><input type="number" min="0" name="prizePool" value={form.prizePool} onChange={update} placeholder="e.g. 25000"/></label>
              <label className="competition-field"><span>First prize</span><input name="firstPrize" value={form.firstPrize} onChange={update} placeholder="e.g. ₹10,000 + certificate"/></label>
              <label className="competition-field"><span>Second prize</span><input name="secondPrize" value={form.secondPrize} onChange={update} placeholder="e.g. ₹5,000 + certificate"/></label>
              <label className="competition-field"><span>Third prize</span><input name="thirdPrize" value={form.thirdPrize} onChange={update} placeholder="e.g. ₹2,500 + certificate"/></label>
              <label className="competition-field competition-field-wide"><span>Submission / project link</span><input type="url" name="submissionLink" value={form.submissionLink} onChange={update} placeholder="https://... (optional)"/></label>
            </div>
          </section>

          {/* Audience and registration */}
          <section className="competition-form-section">
            <div className="competition-section-heading">
              <span className="competition-section-icon">
                <Users size={19} />
              </span>

              <div>
                <h2>Audience &amp; registration</h2>
                <p>Set expectations and how students can participate.</p>
              </div>
            </div>

            <div className="competition-fields">
              <label className="competition-field">
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

              <label className="competition-field">
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

              <label className="competition-field">
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
                <small className="competition-points-help">
                  Points a member can earn for registering for this competition.
                  Set to 0 if this competition has no points reward.
                </small>
              </label>

              <label className="competition-field">
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
                <label className="competition-field">
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

              <label className="competition-field competition-field-wide">
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
          <section className="competition-form-section">
            <div className="competition-section-heading">
              <span className="competition-section-icon">
                <Sparkles size={19} />
              </span>

              <div>
                <h2>Learning &amp; contact</h2>
                <p>Help students know what they’ll gain and who to contact.</p>
              </div>
            </div>

            <div className="competition-fields">
              <label className="competition-field competition-field-wide">
                <span>Learning outcomes</span>
                <textarea
                  name="outcomes"
                  value={form.outcomes}
                  onChange={update}
                  rows={3}
                  placeholder="What will attendees be able to do after this competition?"
                />
              </label>

              <label className="competition-field competition-field-wide">
                <span>Prerequisites / what to bring</span>
                <textarea
                  name="prerequisites"
                  value={form.prerequisites}
                  onChange={update}
                  rows={2}
                  placeholder="Mention any tools, accounts or prior knowledge required."
                />
              </label>

              <label className="competition-field">
                <span>Contact person</span>
                <input
                  name="contactName"
                  value={form.contactName}
                  onChange={update}
                  placeholder="Name"
                />
              </label>

              <label className="competition-field">
                <span>Contact email</span>
                <input
                  type="email"
                  name="contactEmail"
                  value={form.contactEmail}
                  onChange={update}
                  placeholder="club@example.com"
                />
              </label>

              <label className="competition-field">
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
            <section className="competition-form-section">
              <div className="competition-section-heading"><span className="competition-section-icon"><Users size={19}/></span><div><h2>Build your registration form</h2><p>These questions belong only to this competition.</p></div></div>
              <div className="competition-registration-callout"><CheckCircle2 size={19}/><div><strong>Custom competition registration</strong><p>Participants will complete these questions on the public competition page. Required answers will be validated before submission.</p></div></div>
              <div className="competition-question-header"><div><h3>Registration questions <span>{registrationFields.length}</span></h3><p>Add questions, choose answer types, set required fields and reorder them.</p></div><button type="button" className="competition-add-question" onClick={addQuestion}><Sparkles size={15}/> Add question</button></div>
              {registrationFields.map((field, index) => <article className="competition-question-card" key={field.id}><div className="competition-question-index">{String(index + 1).padStart(2, "0")}</div><div className="competition-question-content"><div className="competition-fields">
                <label className="competition-field"><span>Question label <b>*</b></span><input value={field.label} onChange={(event) => updateQuestion(field.id, "label", event.target.value)} placeholder="What should the participant answer?" required/></label>
                <label className="competition-field"><span>Answer type</span><select value={field.type} onChange={(event) => updateQuestion(field.id, "type", event.target.value)}><option value="text">Short answer</option><option value="textarea">Long answer</option><option value="email">Email</option><option value="tel">Phone number</option><option value="number">Number</option><option value="url">Website / URL</option><option value="select">Dropdown</option><option value="radio">Single choice</option><option value="checkbox">Checkbox / consent</option><option value="date">Date</option></select></label>
                {["select", "radio"].includes(field.type) && <label className="competition-field competition-field-wide"><span>Options (comma-separated) <b>*</b></span><input value={field.options} onChange={(event) => updateQuestion(field.id, "options", event.target.value)} placeholder="Beginner, Intermediate, Advanced" required/></label>}
                <label className="competition-field competition-field-wide"><span>Helper text (optional)</span><input value={field.helpText} onChange={(event) => updateQuestion(field.id, "helpText", event.target.value)} placeholder="Additional instructions for participants"/></label>
              </div><div className="competition-question-bottom"><label className="competition-check"><input type="checkbox" checked={field.required} onChange={(event) => updateQuestion(field.id, "required", event.target.checked)}/> Required question</label><div className="competition-question-actions"><button type="button" disabled={index === 0} onClick={() => moveQuestion(index, -1)} aria-label="Move question up">↑</button><button type="button" disabled={index === registrationFields.length - 1} onClick={() => moveQuestion(index, 1)} aria-label="Move question down">↓</button><button type="button" className="remove" onClick={() => removeQuestion(field.id)}>Remove</button></div></div></div></article>)}
              <label className="competition-field competition-field-wide"><span>Registration consent / declaration</span><textarea value={registrationConsent} onChange={(event) => { setRegistrationConsent(event.target.value); setSaved(false); }} rows={3}/></label>
            </section>
            <section className="competition-form-section"><div className="competition-section-heading"><span className="competition-section-icon"><CheckCircle2 size={19}/></span><div><h2>Registration rules</h2><p>Choose how the organizer handles sign-ups.</p></div></div>
              <label className="competition-toggle-row"><span><strong>Require manual approval</strong><small>Registrations remain pending until an organizer approves them.</small></span><input type="checkbox" checked={requireApproval} onChange={(event) => { setRequireApproval(event.target.checked); setSaved(false); }}/></label>
              <label className="competition-toggle-row"><span><strong>Enable waitlist</strong><small>Allow people to join a waitlist when the competition reaches capacity.</small></span><input type="checkbox" checked={waitlistEnabled} onChange={(event) => { setWaitlistEnabled(event.target.checked); setSaved(false); }}/></label>
              <div className="competition-registration-stats"><div><span>Questions</span><strong>{registrationFields.length}</strong></div><div><span>Required</span><strong>{registrationFields.filter((field) => field.required).length}</strong></div><div><span>Registration</span><strong>{form.registrationLink ? "External" : "On platform"}</strong></div></div>
            </section>
          </>}

          {activeTab === "registrations" && <section className="competition-form-section competition-active-registrations">
            <div className="competition-section-heading"><span className="competition-section-icon"><Users size={19}/></span><div><h2>Active registrations</h2><p>Participant details submitted for {form.title || "this competition"}.</p></div></div>
            <div className="competition-registration-stats"><div><span>Total submissions</span><strong>{activeRegistrations.length}</strong></div><div><span>Confirmed</span><strong>{activeRegistrations.filter((r) => String(r.status || "Registered").toLowerCase() === "approved" || String(r.status || "Registered").toLowerCase() === "confirmed" || String(r.status || "Registered").toLowerCase() === "registered").length}</strong></div><div><span>Pending review</span><strong>{activeRegistrations.filter((r) => String(r.status || "Registered").toLowerCase() === "pending").length}</strong></div></div>
            {activeRegistrations.length === 0 ? <div className="competition-admin-empty competition-registrations-empty"><div><Users size={24}/></div><h3>No registrations yet</h3><p>When a participant submits this competition's public registration form, their submitted answers will appear here.</p></div> : <div className="competition-registration-list">
              {activeRegistrations.map((registration, index) => {
                const answers = registration.answers || registration.responses || registration.data || {};
                const answerEntries = Array.isArray(answers) ? answers.map((answer, i) => [answer.label || answer.question || `Answer ${i + 1}`, answer.value ?? answer.answer ?? ""]) : Object.entries(answers);
                const status = String(registration.status || "Registered");
                const registrationId = registration.id || registration.registrationId || `${editingId}-registration-${index}`;
                const email = registration.email || answers.email || answerEntries.find(([key]) => /email/i.test(String(key)))?.[1] || "";
                const name = registration.name || registration.fullName || answers.name || answers["full-name"] || answerEntries.find(([key]) => /name/i.test(String(key)))?.[1] || `Participant ${index + 1}`;
                return <article className="competition-registration-card" key={registrationId}>
                  <div className="competition-registration-avatar">{String(name).trim().charAt(0).toUpperCase() || "P"}</div>
                  <div className="competition-registration-main"><div className="competition-registration-person"><div><h3>{String(name)}</h3>{email && <a href={`mailto:${email}`}><Mail size={13}/>{String(email)}</a>}</div><span className={`competition-registration-status ${status.toLowerCase().replace(/\s+/g, "-")}`}>{status}</span></div>
                    <p className="competition-registration-submitted">Submitted {registration.submittedAt || registration.createdAt ? new Date(registration.submittedAt || registration.createdAt).toLocaleString("en-IN") : "date not recorded"}</p>
                    <details className="competition-registration-answers"><summary><Eye size={14}/> View submitted answers ({answerEntries.length})</summary><dl>{answerEntries.map(([key, value], i) => <div key={`${registrationId}-${i}`}><dt>{String(key)}</dt><dd>{Array.isArray(value) ? value.join(", ") : String(value ?? "—") || "—"}</dd></div>)}</dl></details>
                    {String(status).toLowerCase() === "pending" && <div className="competition-registration-actions"><button type="button" onClick={() => updateRegistrationStatus(registrationId, "Approved")}><Check size={14}/> Approve</button><button type="button" className="reject" onClick={() => updateRegistrationStatus(registrationId, "Rejected")}><X size={14}/> Reject</button></div>}
                  </div>
                </article>;
              })}
            </div>}
          </section>}

          {activeTab === "publish" && <section className="competition-form-section"><div className="competition-section-heading"><span className="competition-section-icon"><Sparkles size={19}/></span><div><h2>Publish & settings</h2><p>Review your public competition before publishing.</p></div></div>
            <div className="competition-publish-preview"><div><span>PUBLIC PAGE PREVIEW</span><h3>{form.title || "Your competition title"}</h3><p>{form.tagline || "Your tagline will appear here."}</p><small>{form.date || "Date to be announced"} · {form.mode} · {form.feeType === "Paid" ? `₹${form.feeAmount || "—"}` : "Free"} · {Math.max(0, Math.floor(Number(form.rewardPoints) || 0))} PRISM points</small></div></div>
            <div className="competition-publish-checklist"><h3>Before publishing</h3><p><CheckCircle2 size={16} className={form.title.trim() ? "complete" : ""}/> Add a competition title</p><p><CheckCircle2 size={16} className={form.description.trim() ? "complete" : ""}/> Add a description</p><p><CheckCircle2 size={16} className={form.date ? "complete" : ""}/> Set the event date</p><p><CheckCircle2 size={16} className={registrationFields.length ? "complete" : ""}/> Configure registration questions</p><p><CheckCircle2 size={16} className={form.registrationDeadline ? "complete" : ""}/> Set a registration deadline</p></div>
            <div className="competition-registration-callout"><Eye size={19}/><div><strong>How registration works</strong><p>With no external registration link, the public competition page should display the custom form configured in the Registration form tab. Form submissions need to be handled by the public page implementation.</p></div></div>
          </section>}

          {saved && (
            <div className="competition-save-success">
              <CheckCircle2 size={19} />
              <div>
                <strong>
                  {savedStatus === "Published" ? "Competition published" : "Competition draft saved"}
                </strong>
                <span>
                  {savedStatus === "Published"
                    ? "Saved to Firestore as published. It will appear on the public Events page."
                    : "Saved to Firestore as a draft. It remains hidden from the public Events page."}
                </span>
              </div>
            </div>
          )}

          <div className="competition-form-actions">
            <p>
              <span>*</span> Required fields
            </p>

            <div className="competition-action-buttons">
              <button type="submit" name="status" value="Draft" className="competition-save-button competition-draft-button" disabled={saving}>{saving ? "Saving…" : "Save Draft"}</button>
              <button
                type="submit"
                name="status"
                value="Published"
                className="competition-save-button"
                disabled={saving}
              >
                {saving ? "Saving…" : "Publish Event"} <ArrowUpRight size={17} />
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
