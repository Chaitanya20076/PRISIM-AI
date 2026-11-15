import { useEffect, useMemo, useRef, useState } from "react";
import { useLocation, useNavigate, useSearchParams } from "react-router-dom";
import {
  ArrowLeft, ArrowUpRight, CalendarDays, CheckCircle2, Clock3, MapPin,
  Sparkles, Users, ShieldCheck, CircleCheck, X,
} from "lucide-react";
import Navbar from "../../../components/Navbar/Navbar";
import "./Workshop.css";

const API_BASE_URL = (
  import.meta.env.VITE_API_URL ||
  import.meta.env.VITE_API_BASE_URL ||
  "http://localhost:5000"
).replace(/\/+$/, "");

async function apiRequest(path, options = {}) {
  let response;
  try {
    response = await fetch(`${API_BASE_URL}${path}`, {
      ...options,
      headers: {
        Accept: "application/json",
        ...(options.body ? { "Content-Type": "application/json" } : {}),
        ...(options.headers || {}),
      },
    });
  } catch {
    throw new Error("Unable to reach PRISM AI. Check your connection and try again.");
  }

  const data = await response.json().catch(() => ({}));
  if (!response.ok || data.success === false) {
    throw new Error(data.message || `Request failed (${response.status}).`);
  }
  return data;
}

const splitOptions = (value) =>
  String(value || "").split(",").map((item) => item.trim()).filter(Boolean);

const getEventDate = (event) => event?.startDate || event?.date || "";
const formatDate = (value) => {
  if (!value) return "To be announced";
  const date = new Date(`${value}T12:00:00`);
  return Number.isNaN(date.getTime())
    ? value
    : date.toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" });
};

const isAnswered = (value) => (typeof value === "boolean" ? value : String(value ?? "").trim() !== "");

/* Small, deterministic particle sets so the background and confetti never re-randomise on render */
const PARTICLES = Array.from({ length: 30 }, (_, i) => ({
  left: `${(i * 37 + 11) % 100}%`,
  size: 4 + ((i * 5) % 8),
  dur: 9 + ((i * 3) % 10),
  delay: -((i * 1.7) % 14),
}));
const MARQUEE = ["Learn", "Build", "Create", "Practice", "Collaborate", "Grow"];
const CONFETTI = Array.from({ length: 16 }, (_, i) => ({
  x: `${Math.round(Math.cos((i / 16) * Math.PI * 2) * (90 + (i % 3) * 28))}px`,
  y: `${Math.round(Math.sin((i / 16) * Math.PI * 2) * (90 + (i % 3) * 28))}px`,
  r: `${(i * 67) % 360}deg`,
  hue: i % 3,
  delay: `${(i % 4) * 0.03}s`,
}));

function DynamicField({ field, value, onChange }) {
  const common = {
    id: field.id,
    name: field.id,
    value: value ?? "",
    required: Boolean(field.required),
    onChange: (event) => onChange(field.id, event.target.value),
  };

  if (field.type === "textarea") return <textarea {...common} rows={4} placeholder={field.placeholder || "Enter your answer"} />;
  if (field.type === "select") {
    return (
      <select {...common}>
        <option value="">Choose an option</option>
        {splitOptions(field.options).map((option) => <option key={option} value={option}>{option}</option>)}
      </select>
    );
  }
  if (field.type === "radio") {
    return (
      <div className="wr-choice-list" role="radiogroup" aria-label={field.label}>
        {splitOptions(field.options).map((option) => (
          <label className={`wr-choice ${value === option ? "is-checked" : ""}`} key={option}>
            <input type="radio" name={field.id} value={option} checked={value === option} required={Boolean(field.required)} onChange={() => onChange(field.id, option)} />
            <span>{option}</span>
          </label>
        ))}
      </div>
    );
  }
  if (field.type === "checkbox") {
    return (
      <label className="wr-consent">
        <input type="checkbox" checked={Boolean(value)} required={Boolean(field.required)} onChange={(event) => onChange(field.id, event.target.checked)} />
        <span>{field.helpText || field.label}</span>
      </label>
    );
  }

  const typeMap = { email: "email", tel: "tel", number: "number", url: "url", date: "date" };
  return <input {...common} type={typeMap[field.type] || "text"} min={field.type === "number" ? 0 : undefined} placeholder={field.placeholder || "Enter here"} />;
}

/* Ambient background: grid, drifting aurora orbs, rising particles and a soft cursor spotlight */
function Backdrop() {
  return (
    <>
      <div className="wr-grid-bg" aria-hidden="true" />
      <div className="wr-orb wr-orb-a" aria-hidden="true" />
      <div className="wr-orb wr-orb-b" aria-hidden="true" />
      <div className="wr-orb wr-orb-c" aria-hidden="true" />
      <div className="wr-aurora" aria-hidden="true" />
      <div className="wr-shape wr-shape-a" aria-hidden="true" />
      <div className="wr-shape wr-shape-b" aria-hidden="true" />
      <div className="wr-shape wr-shape-c" aria-hidden="true" />
      <div className="wr-spotlight" aria-hidden="true" />
      <div className="wr-particles" aria-hidden="true">
        {PARTICLES.map((p, i) => (
          <i key={i} style={{ left: p.left, width: p.size, height: p.size, animationDuration: `${p.dur}s`, animationDelay: `${p.delay}s` }} />
        ))}
      </div>
    </>
  );
}

export default function Workshop() {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const pageRef = useRef(null);
  const [event, setEvent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [answers, setAnswers] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState("");
  const [successOpen, setSuccessOpen] = useState(false);
  const [preSigninOpen, setPreSigninOpen] = useState(false);
  const [successTitle, setSuccessTitle] = useState("You're registered!");
  const [successText, setSuccessText] = useState("Your workshop registration has been received.");

  const eventId = searchParams.get("eventId") || location.state?.eventId || "";
  const fields = useMemo(
    () => (Array.isArray(event?.registrationFields) ? event.registrationFields : []).filter((field) => field && field.id && field.label?.trim()),
    [event]
  );

  useEffect(() => {
    let active = true;
    async function loadWorkshop() {
      setLoading(true);
      setLoadError("");
      try {
        let selected = null;

        if (eventId) {
          const result = await apiRequest(`/api/events/slug/${encodeURIComponent(eventId)}`);
          selected = result.event || result.data?.event || result.data || null;
        } else {
          const result = await apiRequest("/api/events?type=workshop");
          const records = Array.isArray(result) ? result : result.events || result.data?.events || [];
          selected = records.find((item) => {
            const type = `${item.type || ""} ${item.category || ""} ${item.eventType || ""}`.toLowerCase();
            return type.includes("workshop") && String(item.status || "").toLowerCase() === "published";
          }) || records.find((item) => `${item.type || ""} ${item.category || ""}`.toLowerCase().includes("workshop")) || null;
        }

        if (!selected) throw new Error("No workshop was found. Open this form using Register on a published workshop.");
        if (active) setEvent(selected);
      } catch (error) {
        if (active) setLoadError(error.message || "Could not load workshop details.");
      } finally {
        if (active) setLoading(false);
      }
    }
    loadWorkshop();
    return () => { active = false; };
  }, [eventId]);

  useEffect(() => {
    if (!successOpen) return undefined;
    const timer = window.setTimeout(() => setSuccessOpen(false), 5500);
    return () => window.clearTimeout(timer);
  }, [successOpen]);

  /* Close dialogs with Escape and lock page scroll while one is open */
  useEffect(() => {
    if (!preSigninOpen && !successOpen) return undefined;
    const onKey = (e) => {
      if (e.key !== "Escape") return;
      if (successOpen) setSuccessOpen(false);
      else if (!submitting) setPreSigninOpen(false);
    };
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = previous;
      window.removeEventListener("keydown", onKey);
    };
  }, [preSigninOpen, successOpen, submitting]);

  /* Cursor spotlight: writes CSS variables directly, so there are no React re-renders */
  const handlePointerMove = (e) => {
    const el = pageRef.current;
    if (!el || e.pointerType === "touch") return;
    const rect = el.getBoundingClientRect();
    el.style.setProperty("--wr-mx", `${e.clientX - rect.left}px`);
    el.style.setProperty("--wr-my", `${e.clientY - rect.top}px`);
  };

  /* 3D tilt + glare on the event card */
  const handleTilt = (e) => {
    if (e.pointerType === "touch") return;
    const el = e.currentTarget;
    const r = el.getBoundingClientRect();
    const px = (e.clientX - r.left) / r.width;
    const py = (e.clientY - r.top) / r.height;
    el.style.setProperty("--rx", `${((0.5 - py) * 9).toFixed(2)}deg`);
    el.style.setProperty("--ry", `${((px - 0.5) * 11).toFixed(2)}deg`);
    el.style.setProperty("--gx", `${(px * 100).toFixed(1)}%`);
    el.style.setProperty("--gy", `${(py * 100).toFixed(1)}%`);
  };
  const resetTilt = (e) => {
    const el = e.currentTarget;
    ["--rx", "--ry"].forEach((v) => el.style.setProperty(v, "0deg"));
  };

  /* Magnetic pull on the main button */
  const handleMagnet = (e) => {
    if (e.pointerType === "touch" || e.currentTarget.disabled) return;
    const el = e.currentTarget;
    const r = el.getBoundingClientRect();
    el.style.setProperty("--bx", `${((e.clientX - r.left - r.width / 2) * 0.06).toFixed(1)}px`);
    el.style.setProperty("--by", `${((e.clientY - r.top - r.height / 2) * 0.22).toFixed(1)}px`);
  };
  const resetMagnet = (e) => {
    e.currentTarget.style.setProperty("--bx", "0px");
    e.currentTarget.style.setProperty("--by", "0px");
  };

  const closed = Boolean(
    (event?.registrationDeadline && new Date(`${event.registrationDeadline}T23:59:59`) < new Date()) ||
    ["past", "closed", "archived"].includes(String(event?.status || "").toLowerCase())
  );
  const count = Number(event?.registrationCount || event?.registrations?.length || 0);
  const capacity = Number(event?.capacity || event?.participantCapacity || 0);
  const full = capacity > 0 && count >= capacity;
  const waitlistEnabled = Boolean(event?.waitlistEnabled);
  const poster = event?.coverImage || event?.bannerImage || event?.imageUrl || "";
  const eventTitle = event?.title || event?.name || "PRISM AI Workshop";
  const seatsFilled = capacity > 0 ? Math.min(100, Math.round((count / capacity) * 100)) : 0;

  /* Form completion progress (required fields if any, otherwise all fields) */
  const trackedFields = fields.some((f) => f.required) ? fields.filter((f) => f.required) : fields;
  const answeredCount = trackedFields.filter((f) => isAnswered(answers[f.id])).length;
  const progress = trackedFields.length ? Math.round((answeredCount / trackedFields.length) * 100) : 0;

  const updateAnswer = (id, value) => setAnswers((current) => ({ ...current, [id]: value }));

  // Validate the form first, then ask whether the participant wants to sign in.
  // Registration remains available to guests; signing in is optional.
  const handleFormSubmit = (submitEvent) => {
    submitEvent.preventDefault();
    if (!event || submitting) return;
    if (closed) return setMessage("Registration for this workshop is closed.");
    if (full && !waitlistEnabled) return setMessage("This workshop has reached its registration capacity.");

    const emailField = fields.find((field) => field.type === "email" || /e-?mail/i.test(field.label));
    const phoneField = fields.find((field) => field.type === "tel" || /mobile|phone|contact number|telephone/i.test(field.label));
    const email = String(emailField ? answers[emailField.id] || "" : "").trim();
    const phone = String(phoneField ? answers[phoneField.id] || "" : "").trim();

    if (emailField && !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) {
      return setMessage("Please enter a valid email address.");
    }
    if (phoneField) {
      let digits = phone.replace(/\D/g, "");
      if (digits.length === 12 && digits.startsWith("91")) digits = digits.slice(2);
      if (!/^[6-9]\d{9}$/.test(digits)) return setMessage("Please enter a valid 10-digit Indian mobile number.");
    }

    setMessage("");
    setPreSigninOpen(true);
  };

  const completePreSigninRegistration = async () => {
    if (!event || submitting) return;
    const emailField = fields.find((field) => field.type === "email" || /e-?mail/i.test(field.label));
    const nameField = fields.find((field) => /full name|participant name|^name$/i.test(field.label));
    const phoneField = fields.find((field) => field.type === "tel" || /mobile|phone|contact number|telephone/i.test(field.label));

    const email = String(emailField ? answers[emailField.id] || "" : "").trim();
    const name = String(nameField ? answers[nameField.id] || "" : "").trim();
    const phone = String(phoneField ? answers[phoneField.id] || "" : "").trim();

    setSubmitting(true);
    setMessage("");
    try {
      const registration = {
        participantName: name,
        name,
        email,
        phone,
        mobile: phone,
        answers: { ...answers },
        source: "Pre-Signin",
        registrationLabel: "Pre-Signin",
        registrationType: "Pre-Signin",
        userType: "Pre-Signin",
        isPreSignin: true,
      };

      // Guest registration: no Firebase Authorization token is sent or required.
      const result = await apiRequest(`/api/events/${encodeURIComponent(event.id)}/registrations`, {
        method: "POST",
        body: JSON.stringify(registration),
      });

      const saved = result.registration || {};
      setEvent((current) => current ? { ...current, registrationCount: Number(current.registrationCount || 0) + 1 } : current);
      setAnswers({});
      setPreSigninOpen(false);
      const status = String(saved.status || "Registered");
      if (status === "Waitlisted") {
        setSuccessTitle("You're on the waitlist!");
        setSuccessText("Your registration has been recorded. The organizer will contact you if a place becomes available.");
      } else if (status === "Pending") {
        setSuccessTitle("Registration submitted!");
        setSuccessText("Your details have been received and are awaiting organizer approval.");
      } else {
        setSuccessTitle("You're registered!");
        setSuccessText("Your workshop registration has been recorded successfully. See you there!");
      }
      setSuccessOpen(true);
    } catch (error) {
      setPreSigninOpen(false);
      setMessage(error.message || "We couldn't submit your registration. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <main className="wr-page wr-state" ref={pageRef}>
        <Backdrop />
        <div className="wr-loader" aria-hidden="true"><span /><Sparkles size={26} /></div>
        <p>PRISM AI / WORKSHOPS</p>
        <h1>Preparing your registration…</h1>
        <span>Loading workshop details</span>
      </main>
    );
  }

  if (!event) {
    return (
      <main className="wr-page wr-state" ref={pageRef}>
        <Backdrop />
        <div className="wr-loader wr-loader-still" aria-hidden="true"><Sparkles size={26} /></div>
        <p>PRISM AI / WORKSHOPS</p>
        <h1>Workshop unavailable</h1>
        <span>{loadError || "This workshop could not be found."}</span>
        <button className="wr-button wr-button-primary" onClick={() => navigate("/public/events/forms")}><ArrowLeft size={17} /> Back to events</button>
      </main>
    );
  }

  return (
    <main className="wr-page" ref={pageRef} onPointerMove={handlePointerMove}>
      <Backdrop />
      <Navbar />

      <section className="wr-layout">
        <aside className="wr-intro">
          <div className="wr-kicker wr-rise" style={{ "--d": "0ms" }}><span className="wr-live-dot" /> PRISM AI <i /> WORKSHOP REGISTRATION</div>
          <div className="wr-heading-wrap">
            <span className="wr-index wr-rise" style={{ "--d": "80ms" }}>01 / RESERVE YOUR PLACE</span>
            <h1 className="wr-headline" aria-label="Learning begins with you.">
              <span className="wr-word" style={{ "--w": 0 }}><span>Learning</span></span>{" "}
              <span className="wr-word" style={{ "--w": 1 }}><span>begins</span></span><br />
              <em><span className="wr-word" style={{ "--w": 2 }}><span>with</span></span>{" "}<span className="wr-word" style={{ "--w": 3 }}><span>you.</span></span></em>
            </h1>
            <p className="wr-lead wr-rise" style={{ "--d": "260ms" }}>One step closer to hands-on learning, practical skills and ideas you can put into action.</p>
          </div>

          <div className="wr-event-card wr-rise" style={{ "--d": "360ms" }} onPointerMove={handleTilt} onPointerLeave={resetTilt}>
            {poster ? (
              <div className="wr-poster-wrap"><img className="wr-poster" src={poster} alt={`${eventTitle} poster`} /></div>
            ) : (
              <div className="wr-poster-placeholder"><Sparkles size={36} /><span>PRISM AI / WORKSHOPS</span><strong>LEARN. BUILD. CREATE.</strong></div>
            )}
            <div className="wr-event-card-content">
              <span className="wr-event-label">YOU'RE REGISTERING FOR</span>
              <h2>{eventTitle}</h2>
              {event.tagline && <p>{event.tagline}</p>}
              <div className="wr-event-facts">
                <span><CalendarDays size={16} />{formatDate(getEventDate(event))}</span>
                <span><Clock3 size={16} />{event.startTime || event.time || "Time to be announced"}{event.endTime ? ` – ${event.endTime}` : ""}</span>
                <span><MapPin size={16} />{event.venue || (["online", "virtual"].includes(String(event.mode || "").toLowerCase()) ? "Online session" : "Venue to be announced")}</span>
                <span><Users size={16} />{capacity ? `${Math.max(0, capacity - count)} seats remaining` : "Open registration"}</span>
              </div>
              {capacity > 0 && (
                <div className="wr-seats" role="img" aria-label={`${seatsFilled}% of seats taken`}>
                  <div className="wr-seats-bar"><b style={{ "--w": `${seatsFilled}%` }} className={seatsFilled >= 85 ? "is-hot" : ""} /></div>
                  <small>{count} of {capacity} places taken</small>
                </div>
              )}
            </div>
          </div>
          <div className="wr-trust-note wr-rise" style={{ "--d": "460ms" }}><ShieldCheck size={17} /><span>Your information will be shared with the event organizers for registration purposes.</span></div>
        </aside>

        <section className="wr-form-card wr-rise" style={{ "--d": "220ms" }}>
          <div className="wr-form-top">
            <div><span className="wr-index">REGISTRATION FORM</span><h2>Let's get you <em>registered.</em></h2><p>Fill in the details below. Fields marked with * are required.</p></div>
            <span className="wr-form-mark"><Sparkles size={23} /></span>
          </div>

          {closed ? (
            <div className="wr-alert wr-alert-error"><X size={18} /> Registration for this workshop is closed.</div>
          ) : (
            <form className="wr-form" onSubmit={handleFormSubmit}>
              {full && !waitlistEnabled && <div className="wr-alert wr-alert-error">This workshop has reached its registration capacity.</div>}
              {full && waitlistEnabled && <div className="wr-alert"><Users size={17} /> Registration is full. Submit to join the waitlist.</div>}
              {event.requireApproval && <div className="wr-alert"><ShieldCheck size={17} /> Registrations require organizer approval.</div>}

              {fields.length === 0 ? (
                <div className="wr-alert wr-alert-error">The organizer has not configured registration questions for this workshop yet.</div>
              ) : (
                <>
                  <div className="wr-progress" aria-live="polite">
                    <div className="wr-progress-bar"><b style={{ width: `${progress}%` }} /></div>
                    <small>{progress === 100 ? "All set. Ready when you are." : `${answeredCount} of ${trackedFields.length} ${fields.some((f) => f.required) ? "required " : ""}answered`}</small>
                  </div>
                  <div className="wr-fields">
                    {fields.map((field, index) => {
                      const grouped = field.type === "radio" || field.type === "checkbox";
                      const Label = grouped ? "span" : "label";
                      const labelProps = grouped ? {} : { htmlFor: field.id };
                      return (
                        <div
                          className={`wr-field wr-rise ${field.type === "textarea" || grouped ? "wr-field-wide" : ""} ${isAnswered(answers[field.id]) ? "is-filled" : ""}`}
                          style={{ "--d": `${340 + Math.min(index, 8) * 55}ms` }}
                          key={field.id}
                        >
                          <Label className="wr-field-label" {...labelProps}>{field.label}{field.required && <b> *</b>}</Label>
                          {field.helpText && field.type !== "checkbox" && <small>{field.helpText}</small>}
                          <DynamicField field={field} value={answers[field.id]} onChange={updateAnswer} />
                        </div>
                      );
                    })}
                  </div>
                </>
              )}

              {event.registrationConsent && <p className="wr-consent-copy"><ShieldCheck size={16} />{event.registrationConsent}</p>}
              {message && <div className="wr-alert wr-alert-error" role="alert"><X size={17} />{message}</div>}
              <button className="wr-button wr-button-primary wr-submit" type="submit" onPointerMove={handleMagnet} onPointerLeave={resetMagnet} disabled={submitting || fields.length === 0 || (full && !waitlistEnabled)}>
                <span>{submitting ? "Submitting your details…" : full && waitlistEnabled ? "Join the waitlist" : "Complete registration"}</span>
                <ArrowUpRight size={18} />
              </button>
              <p className="wr-privacy"><ShieldCheck size={14} /> No account or PRISM Points wallet is required.</p>
            </form>
          )}
          {event.contactEmail && <a className="wr-contact" href={`mailto:${event.contactEmail}`}>Need help? Contact the organizer <ArrowUpRight size={15} /></a>}
        </section>
      </section>

      <div className="wr-marquee" aria-hidden="true">
        <div className="wr-marquee-track">
          {[0, 1].map((k) => (
            <div className="wr-marquee-set" key={k}>
              {MARQUEE.map((w) => (<span key={w}>{w}<Sparkles size={22} /></span>))}
            </div>
          ))}
        </div>
      </div>

      <footer className="wr-footer"><span>PRISM AI</span><i /> Explore. Innovate. Impact.</footer>

      {preSigninOpen && (
        <div className="wr-presignin-backdrop" role="dialog" aria-modal="true" aria-labelledby="wr-presignin-title" onMouseDown={(e) => { if (e.target === e.currentTarget && !submitting) setPreSigninOpen(false); }}>
          <div className="wr-presignin-card">
            <button className="wr-presignin-close" type="button" onClick={() => setPreSigninOpen(false)} aria-label="Close"><X size={19} /></button>
            <div className="wr-presignin-icon"><Sparkles size={25} /></div>
            <span className="wr-index">A BETTER PRISM AI EXPERIENCE</span>
            <h2 id="wr-presignin-title">Want a little <em>extra?</em></h2>
            <p className="wr-presignin-intro">You can register for this workshop without signing in. Signing in simply unlocks more PRISM AI features.</p>
            <ul className="wr-presignin-benefits">
              <li style={{ "--i": 0 }}><CheckCircle2 size={17} /><span><strong>Personalised dashboard</strong><small>Your events, activity and updates in one place.</small></span></li>
              <li style={{ "--i": 1 }}><CheckCircle2 size={17} /><span><strong>Track your participation</strong><small>Keep track of registrations and participation details.</small></span></li>
              <li style={{ "--i": 2 }}><CheckCircle2 size={17} /><span><strong>PRISM Points</strong><small>Earn and follow points for eligible club activities.</small></span></li>
              <li style={{ "--i": 3 }}><CheckCircle2 size={17} /><span><strong>All-in-one dashboard</strong><small>Access events, projects, resources and announcements together.</small></span></li>
              <li style={{ "--i": 4 }}><CheckCircle2 size={17} /><span><strong>Easy access</strong><small>Find your PRISM AI updates and activities more easily.</small></span></li>
            </ul>
            <div className="wr-presignin-actions">
              <button className="wr-button wr-button-primary" type="button" onClick={() => navigate("/login", { state: { returnTo: `${location.pathname}${location.search}` } })}><span>Sign in</span><ArrowUpRight size={17} /></button>
              <button className="wr-presignin-continue" type="button" onClick={completePreSigninRegistration} disabled={submitting}>{submitting ? "Registering…" : "Continue without signing in"}</button>
            </div>
            <p className="wr-presignin-footnote">No account needed. Your registration will be saved as <strong>Pre-Signin</strong>.</p>
          </div>
        </div>
      )}

      {successOpen && (
        <div className="wr-success-backdrop" role="dialog" aria-modal="true" aria-labelledby="wr-success-title" onMouseDown={(e) => { if (e.target === e.currentTarget) setSuccessOpen(false); }}>
          <div className="wr-success-card">
            <button className="wr-success-close" type="button" onClick={() => setSuccessOpen(false)} aria-label="Close"><X size={19} /></button>
            <div className="wr-success-icon">
              <CircleCheck size={40} />
              <div className="wr-confetti" aria-hidden="true">
                {CONFETTI.map((c, i) => (
                  <i key={i} className={`c${c.hue}`} style={{ "--x": c.x, "--y": c.y, "--r": c.r, animationDelay: c.delay }} />
                ))}
              </div>
            </div>
            <span className="wr-index">PRISM AI / CONFIRMATION</span>
            <h2 id="wr-success-title">{successTitle}</h2>
            <p>{successText}</p>
            <button className="wr-button wr-button-primary" onClick={() => setSuccessOpen(false)}><span>Done</span><CheckCircle2 size={17} /></button>
            <div className="wr-success-timer" aria-hidden="true"><b /></div>
          </div>
        </div>
      )}
    </main>
  );
}