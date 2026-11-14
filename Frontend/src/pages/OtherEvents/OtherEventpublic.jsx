import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, ArrowUpRight, CalendarDays, Clock3, MapPin, Users, IndianRupee, Sparkles, CheckCircle2, ExternalLink, Monitor, GraduationCap, Share2, Ticket, ClipboardList, ShieldCheck, CircleCheck, X } from "lucide-react";
import { getAuth } from "firebase/auth";
import "./OtherEventpublic.css";



// Firebase identity for member-linked registrations. The UID is derived
// from the verified Firebase ID token on the backend, never from form data.
async function getMemberAuthHeaders() {
  const user = getAuth().currentUser;
  if (!user) {
    throw new Error("Please sign in to your PRISM AI account before registering. This lets us link your registration to your PRISM Points wallet.");
  }
  const idToken = await user.getIdToken();
  return { Authorization: `Bearer ${idToken}` };
}

const API_BASE_URL =
  import.meta.env.VITE_API_URL ||
  import.meta.env.VITE_API_BASE_URL ||
  "http://localhost:5000";
const PUBLIC_EVENTS_ENDPOINT = `${API_BASE_URL}/api/events`;

async function readPublicEvents() {
  const response = await fetch(`${PUBLIC_EVENTS_ENDPOINT}?type=all`);
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(payload.message || payload.error || "Could not load events.");
  const list = Array.isArray(payload) ? payload : payload.events || payload.data || [];
  return Array.isArray(list) ? list : [];
}
const slugify = (value = "") => String(value).toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
const formatDate = (value) => {
  if (!value) return "To be announced";
  const date = new Date(`${value}T00:00:00`);
  return Number.isNaN(date.getTime()) ? value : date.toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" });
};
const splitLines = (value) => typeof value === "string" ? value.split("\n").map((item) => item.trim()).filter(Boolean) : Array.isArray(value) ? value : [];

function QuestionInput({ field, value, onChange }) {
  const common = { id: field.id, name: field.id, value: value ?? "", onChange: (event) => onChange(field.id, event.target.value), required: Boolean(field.required) };
  if (field.type === "textarea") return <textarea {...common} rows={4} />;
  if (field.type === "select") return <select {...common}><option value="">Choose an option</option>{String(field.options || "").split(",").map((option) => option.trim()).filter(Boolean).map((option) => <option key={option} value={option}>{option}</option>)}</select>;
  if (field.type === "radio") return <div className="sp-choice-list">{String(field.options || "").split(",").map((option) => option.trim()).filter(Boolean).map((option) => <label className="sp-choice" key={option}><input type="radio" name={field.id} value={option} checked={value === option} required={Boolean(field.required)} onChange={() => onChange(field.id, option)} /><span>{option}</span></label>)}</div>;
  if (field.type === "checkbox") return <label className="sp-consent"><input type="checkbox" checked={Boolean(value)} required={Boolean(field.required)} onChange={(event) => onChange(field.id, event.target.checked)} /><span>{field.helpText || "I agree to this declaration."}</span></label>;
  const types = { email: "email", tel: "tel", number: "number", url: "url", date: "date" };
  return <input {...common} type={types[field.type] || "text"} min={field.type === "number" ? 0 : undefined} />;
}

export default function OtherEventpublic() {
  const navigate = useNavigate();
  const { slug } = useParams();
  const registrationMode = new URLSearchParams(window.location.search).get("register") === "1";
  const registrationPhrases = ["next move.", "big idea.", "new chapter.", "bold step.", "bright future.", "next breakthrough."];
  const [registrationPhraseIndex, setRegistrationPhraseIndex] = useState(0);

  useEffect(() => {
    if (!registrationMode) return undefined;
    const phraseTimer = window.setInterval(() => {
      setRegistrationPhraseIndex((current) => (current + 1) % registrationPhrases.length);
    }, 2800);
    return () => window.clearInterval(phraseTimer);
  }, [registrationMode]);
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [answers, setAnswers] = useState({});
  const [participantName, setParticipantName] = useState("");
  const [participantEmail, setParticipantEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submissionMessage, setSubmissionMessage] = useState("");
  const [shareCopied, setShareCopied] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [successCountdown, setSuccessCountdown] = useState(5);

  useEffect(() => {
    if (!showSuccess) return undefined;
    setSuccessCountdown(5);
    const startedAt = Date.now();
    const interval = window.setInterval(() => {
      const remaining = Math.max(0, 5 - Math.floor((Date.now() - startedAt) / 1000));
      setSuccessCountdown(remaining);
      if (remaining <= 0) {
        window.clearInterval(interval);
        setShowSuccess(false);
      }
    }, 200);
    return () => window.clearInterval(interval);
  }, [showSuccess]);

  useEffect(() => {
    let active = true;
    const load = async () => {
      try {
        setLoadError("");
        const records = await readPublicEvents();
        if (!active) return;
        setEvents(records.filter((item) =>
          String(item.status || "").toLowerCase() === "published" &&
          String(item.visibility || "public").toLowerCase() === "public"
        ));
      } catch (error) {
        if (active) setLoadError(error.message || "Could not load this event.");
      } finally {
        if (active) setLoading(false);
      }
    };
    load();
    return () => { active = false; };
  }, []);

  const event = useMemo(() => events.find((item) => {
    if (String(item.type || item.category || item.customCategory || "").toLowerCase() !== "other events" && String(item.type || item.category || item.customCategory || "").toLowerCase() !== "other event" && String(item.type || item.category || item.customCategory || "").toLowerCase() !== "other") return false;
    return String(item.id || "") === decodeURIComponent(slug || "") || String(item.slug || "") === decodeURIComponent(slug || "") || slugify(item.title || item.name) === decodeURIComponent(slug || "");
  }), [events, slug]);

  const fields = useMemo(() => (Array.isArray(event?.registrationFields) ? event.registrationFields : []).filter((field) => field && field.label?.trim()), [event]);
  const registrations = Array.isArray(event?.registrations) ? event.registrations : [];
  const registrationCount = Number(event?.registrationCount ?? event?.registrationsCount ?? registrations.length);
  const startDate = event?.date || event?.startDate;
  const isOnline = ["online", "virtual"].includes(String(event?.mode || event?.eventFormat || "").toLowerCase());
  const venue = event?.venue || (isOnline ? "Online session" : "Venue to be announced");
  const paid = String(event?.feeType || "Free").toLowerCase() === "paid";
  const fee = paid ? `₹${event?.feeAmount || "—"}` : "Free";
  const deadlinePassed = Boolean(event?.registrationDeadline && new Date(`${event.registrationDeadline}T23:59:59`) < new Date());
  const isPast = String(event?.status || "").toLowerCase() === "past";
  const closed = deadlinePassed || isPast || ["closed", "archived"].includes(String(event?.status || "").toLowerCase());
  const capacity = Number(event?.capacity || 0);
  const full = capacity > 0 && registrationCount >= capacity;
  const waitlistEnabled = Boolean(event?.waitlistEnabled);
  const rewardPoints = Math.max(0, Number(event?.rewardPoints || 0));
  const externalLink = String(event?.registrationLink || "").trim();
  const platformRegistration = !externalLink && event?.onPlatformRegistration !== false;
  const poster = ""; // Keep the public hero artwork consistent; do not stretch uploaded posters here.
  const outcomes = splitLines(event?.outcomes || event?.learningOutcomes || event?.highlights);
  const prerequisites = splitLines(event?.prerequisites);

  const updateAnswer = (id, value) => setAnswers((current) => ({ ...current, [id]: value }));

  const submitRegistration = async (submitEvent) => {
    submitEvent.preventDefault();
    if (!event || submitting) return;
    if (closed) {
      setSubmissionMessage("Registration for this event is closed.");
      return;
    }
    if (full && !waitlistEnabled) {
      setSubmissionMessage("This event has reached its registration capacity.");
      return;
    }

    setSubmitting(true);
    setSubmissionMessage("");
    try {
      const emailField = fields.find((field) => field.type === "email" || /e-?mail/i.test(field.label));
      const emailValue = String(participantEmail || (emailField ? answers[emailField.id] || "" : "")).trim();
      const emailLooksValid = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(emailValue);
      if (emailValue && !emailLooksValid) throw new Error("Please enter a valid email address, for example name@example.com.");
      if (emailField && !emailValue) throw new Error("Please enter your email address.");

      const phoneField = fields.find((field) => field.type === "tel" || /mobile|phone|contact number|telephone/i.test(field.label));
      const phoneValue = phoneField ? String(answers[phoneField.id] || "").trim() : "";
      let normalizedPhone = phoneValue.replace(/\D/g, "");
      if (normalizedPhone.length === 12 && normalizedPhone.startsWith("91")) normalizedPhone = normalizedPhone.slice(2);
      if (phoneField && !phoneValue) throw new Error("Please enter your mobile number.");
      if (phoneValue && !/^[6-9]\d{9}$/.test(normalizedPhone)) {
        throw new Error("Please enter a valid 10-digit Indian mobile number starting with 6, 7, 8 or 9. You may include +91.");
      }

      const nameField = fields.find((field) => /full name|name/i.test(field.label));
      const name = participantName || String(nameField ? answers[nameField.id] || "" : "").trim();
      const registration = {
        eventId: event.id,
        participantName: name,
        name,
        email: emailValue,
        phone: phoneValue,
        mobile: phoneValue,
        answers: { ...answers },
        status: full ? "Waitlisted" : event.requireApproval ? "Pending" : "Registered",
        submittedAt: new Date().toISOString(),
      };

      const response = await fetch(`${PUBLIC_EVENTS_ENDPOINT}/${encodeURIComponent(event.id)}/registrations`, {
        method: "POST",
        headers: { "Content-Type": "application/json", ...(await getMemberAuthHeaders()) },
        body: JSON.stringify(registration),
      });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(payload.message || payload.error || "We couldn't submit your registration. Please try again.");

      try {
        const refreshed = await readPublicEvents();
        setEvents(refreshed.filter((item) =>
          String(item.status || "").toLowerCase() === "published" &&
          String(item.visibility || "public").toLowerCase() === "public"
        ));
      } catch {
        setEvents((current) => current.map((item) =>
          String(item.id) === String(event.id) ? { ...item, registrationCount: registrationCount + 1 } : item
        ));
      }

      setAnswers({});
      setParticipantName("");
      setParticipantEmail("");
      setSubmissionMessage(full
        ? "You're on the waitlist. Your registration has been recorded."
        : event.requireApproval
          ? "Registration submitted! It is pending organizer approval."
          : "You're registered! Your registration has been recorded successfully.");
      if (!full && !event.requireApproval) setShowSuccess(true);
    } catch (error) {
      setSubmissionMessage(error.message || "We couldn't submit your registration. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const share = async () => {
    try {
      if (navigator.share) await navigator.share({ title: event?.title || event?.name || "PRISM AI event", url: window.location.href });
      else { await navigator.clipboard.writeText(window.location.href); setShareCopied(true); window.setTimeout(() => setShareCopied(false), 1800); }
    } catch { /* User cancelled sharing. */ }
  };

  if (loading) return <main className="other-event-public-page sp-state"><div className="sp-state-icon"><Sparkles size={28} /></div><p className="sp-eyebrow">PRISM AI / OTHER EVENTS</p><h1>Loading event…</h1><p>Please wait while we fetch the event details.</p></main>;

  if (!event) return <main className="other-event-public-page sp-state"><div className="sp-state-icon"><Sparkles size={28} /></div><p className="sp-eyebrow">PRISM AI / OTHER EVENTS</p><h1>Other Event not found.</h1><p>{loadError || "This event may not be published yet, or the link may be incorrect."}</p><button className="sp-button sp-button-primary" onClick={() => navigate("/events")}><ArrowLeft size={17} /> Explore events</button></main>;

  if (registrationMode) {
    return (
      <main className="other-event-public-page sp-registration-page">
        <div className="sp-glow sp-glow-one" /><div className="sp-glow sp-glow-two" />
        <header className="sp-registration-topbar">
          <button className="sp-nav-back" onClick={() => navigate(-1)}><ArrowLeft size={17} /> Back to event</button>
          <div className="sp-brand"><span className="sp-brand-mark"><Sparkles size={16} /></span> PRISM<span>AI</span></div>
          <span className="sp-registration-step">EVENT REGISTRATION</span>
        </header>
        <section className="sp-registration-shell">
          <div className="sp-registration-intro">
            <p className="sp-eyebrow">PRISM AI / OTHER EVENT</p>
            <h1 className="sp-registration-animated-title">
              Make your<br />
              <span key={registrationPhraseIndex} className={`sp-rotating-phrase sp-phrase-motion-${registrationPhraseIndex % 6}`}>
                {registrationPhrases[registrationPhraseIndex]}
              </span>
            </h1>
            <p>Complete the details below to reserve your place at <strong>{event.title || event.name || "this event"}</strong>.</p>
            <div className="sp-registration-event-facts">
              <span><CalendarDays size={16} />{formatDate(startDate)}</span>
              <span><Clock3 size={16} />{event.startTime || "Time to be announced"}</span>
              <span>{isOnline ? <Monitor size={16} /> : <MapPin size={16} />}{venue}</span>
            </div>
            {rewardPoints > 0 && <div className="sp-registration-reward"><span className="sp-registration-reward-icon"><Sparkles size={22} /></span><span><small>THIS EVENT REWARDS</small><strong>+{rewardPoints.toLocaleString("en-IN")} PRISM Points</strong><em>Complete registration and meet the event eligibility requirements.</em></span></div>}
            <div className="sp-registration-note"><ShieldCheck size={19} /><span><strong>Your information stays with this event.</strong><small>Fields marked with * are required.</small></span></div>
          </div>
          <section className="sp-registration-form-panel">
            <div className="sp-registration-form-heading">
              <p className="sp-eyebrow">YOUR DETAILS</p>
              <h2>Complete your registration</h2>
              <p>Fill in the details requested by the event organiser.</p>
            </div>
            {closed ? (
              <div className="sp-form-alert sp-alert-closed"><X size={17} /> Registration for this event is closed.</div>
            ) : externalLink ? (
              <a className="sp-button sp-button-primary sp-full-button" href={externalLink}>Continue to registration <ExternalLink size={16} /></a>
            ) : (
              <form className="sp-registration-form" onSubmit={submitRegistration}>
                {full && !waitlistEnabled && <div className="sp-form-alert sp-alert-closed">This event has reached capacity.</div>}
                {full && waitlistEnabled && <div className="sp-form-alert"><Users size={17} /> Full capacity — submit to join the waitlist.</div>}
                {event.requireApproval && <div className="sp-form-alert"><ShieldCheck size={17} /> Registrations require organizer approval.</div>}
                {fields.length === 0 && <div className="sp-form-alert">The organiser has not configured registration questions yet.</div>}
                {fields.map((field) => (
                  <label className="sp-form-field" key={field.id}>
                    <span>{field.label}{field.required && <b> *</b>}</span>
                    {field.helpText && field.type !== "checkbox" && <small>{field.helpText}</small>}
                    <QuestionInput field={field} value={answers[field.id]} onChange={updateAnswer} />
                  </label>
                ))}
                {event.registrationConsent && <p className="sp-consent-copy"><ShieldCheck size={15} />{event.registrationConsent}</p>}
                {submissionMessage && <div className={`sp-form-alert ${submissionMessage.startsWith("Already registered") ? "sp-alert-duplicate" : submissionMessage.includes("registered") || submissionMessage.includes("waitlist") || submissionMessage.includes("approval") ? "sp-alert-success" : "sp-alert-closed"}`} role="status"><CircleCheck size={17} />{submissionMessage}</div>}
                <button className="sp-button sp-button-primary sp-full-button" type="submit" disabled={submitting || fields.length === 0 || (full && !waitlistEnabled)}>
                  {submitting ? "Submitting…" : full && waitlistEnabled ? "Join the waitlist" : "Submit registration"} <ArrowUpRight size={17} />
                </button>
                <small className="sp-privacy-note">Your answers are saved with this event registration.</small>
              </form>
            )}
            {event.contactEmail && <a className="sp-contact-link" href={`mailto:${event.contactEmail}`}>Questions? Contact the organiser <ArrowUpRight size={14} /></a>}
          </section>
        </section>
        {showSuccess && (
          <div className="sp-success-overlay" role="dialog" aria-modal="true" aria-labelledby="sp-success-title">
            <div className="sp-success-confetti" aria-hidden="true">
              {Array.from({ length: 72 }, (_, index) => (
                <i key={index} style={{
                  "--left": `${(index * 37) % 100}%`,
                  "--delay": `${(index % 13) * -0.19}s`,
                  "--duration": `${3.2 + (index % 7) * 0.32}s`,
                  "--drift": `${((index * 19) % 180) - 90}px`,
                  "--rotate": `${(index * 47) % 360}deg`
                }} />
              ))}
            </div>
            <section className="sp-success-card">
              <button className="sp-success-close" onClick={() => setShowSuccess(false)} aria-label="Close"><X size={20} /></button>
              <div className="sp-success-check"><CheckCircle2 size={42} /></div>
              <p className="sp-eyebrow">PRISM AI / YOU DID IT</p>
              <h2 id="sp-success-title">Congratulations!</h2>
              <p className="sp-success-copy">Your registration is confirmed. Get ready for an amazing PRISM AI experience!</p>
              {rewardPoints > 0 ? (
                <div className="sp-success-points sp-success-points-earned">
                  <Sparkles size={22} />
                  <span><small>EVENT REWARD</small><strong>+{rewardPoints.toLocaleString("en-IN")} PRISM Points</strong><em>Reward for this event registration</em></span>
                </div>
              ) : (
                <div className="sp-success-points"><Sparkles size={18} /> Registration successful</div>
              )}
              <small className="sp-success-timer">THIS MESSAGE CLOSES IN {successCountdown} SECONDS</small>
              <div className="sp-success-progress"><span /></div>
              <button className="sp-success-action" onClick={() => setShowSuccess(false)}>Awesome!</button>
            </section>
          </div>
        )}
      </main>
    );
  }

  return (
    <main className="other-event-public-page">
      <div className="sp-glow sp-glow-one" /><div className="sp-glow sp-glow-two" />
      <header className="sp-nav">
        <button className="sp-nav-back" onClick={() => navigate(-1)}><ArrowLeft size={17} /> Back</button>
        <button className="sp-brand" onClick={() => navigate("/")}><span className="sp-brand-mark"><Sparkles size={16} /></span> PRISM<span>AI</span></button>
        <button className="sp-nav-share" onClick={share}><Share2 size={16} /> {shareCopied ? "Copied" : "Share"}</button>
      </header>

      <section className="sp-hero">
        <div className="sp-hero-copy">
          <p className="sp-eyebrow"><span className="sp-live-dot" /> PRISM AI <span>/</span> OTHER EVENT</p>
          <h1>{event.title || event.name || "Other Event"}<Sparkles className="sp-title-spark" size={24} /></h1>
          <p className="sp-tagline">{event.tagline || event.caption || "Discover new ideas. Connect with the community. Make an impact."}</p>
          <div className="sp-tags"><span><GraduationCap size={15} /> Community event</span><span><Sparkles size={14} /> Ideas into action</span><span className={closed ? "closed" : "open"}><i />{closed ? "Registrations closed" : "Registration open"}</span></div>
          {rewardPoints > 0 && <div className="sp-prism-reward-banner"><span className="sp-prism-reward-icon"><Sparkles size={20} /></span><span><small>PRISM POINTS REWARD</small><strong>+{rewardPoints.toLocaleString("en-IN")} PRISM Points</strong><em>Complete your event registration to qualify</em></span><b>✦</b></div>}
          <div className="sp-hero-actions">
            {externalLink && !closed && <a className="sp-button sp-button-primary" href={externalLink}>Register externally <ExternalLink size={17} /></a>}
            {platformRegistration && !closed && <button className="sp-button sp-button-primary" onClick={() => navigate(`${window.location.pathname}?register=1`)}>Register for event <ArrowUpRight size={17} /></button>}
            {closed && <span className="sp-closed-pill"><X size={15} /> Registration closed</span>}
            <button className="sp-button sp-button-secondary" onClick={() => document.getElementById("sp-about")?.scrollIntoView({ behavior: "smooth" })}>Explore event <ArrowUpRight size={17} /></button>
          </div>
        </div>
        <div className="sp-art-wrap"><div className="sp-orbit sp-orbit-one" /><div className="sp-orbit sp-orbit-two" /><div className="sp-art-card">{poster ? <img src={poster} alt={`${event.title || event.name} poster`} /> : <div className="sp-art-placeholder"><div className="sp-art-grid" /><div className="sp-art-icon"><Sparkles size={42} /></div><small>IDEAS IN ACTION</small><strong>Explore. Connect. Create.</strong><span>PRISM AI · OTHER EVENTS</span></div>}<b>P / 01</b></div><div className="sp-float-chip sp-float-top"><Sparkles size={15} /> Skills worth building</div><div className="sp-float-chip sp-float-bottom"><CheckCircle2 size={16} /> Practice that moves you forward</div></div>
      </section>

      <section className="sp-facts">
        <div><span className="sp-fact-icon"><CalendarDays size={19} /></span><section><small>DATE</small><strong>{formatDate(startDate)}</strong></section></div>
        <div><span className="sp-fact-icon"><Clock3 size={19} /></span><section><small>TIME</small><strong>{event.startTime || "To be announced"}</strong>{event.endTime && <em>Ends at {event.endTime}</em>}</section></div>
        <div><span className="sp-fact-icon">{isOnline ? <Monitor size={19} /> : <MapPin size={19} />}</span><section><small>LOCATION</small><strong>{venue}</strong><em>{event.mode || event.eventFormat || "In-person"}</em></section></div>
        <div><span className="sp-fact-icon"><IndianRupee size={19} /></span><section><small>ENTRY</small><strong>{fee}</strong><em>{registrationCount}{capacity ? ` / ${capacity}` : " registered"}</em></section></div>
      </section>

      <section className="sp-content" id="sp-about">
        <div className="sp-main-content">
          <div className="sp-section-title"><span>01</span><div><p className="sp-eyebrow">THE EXPERIENCE</p><h2>An experience built for curious minds.</h2></div></div>
          <p className="sp-description">{event.description || "Discover the event, meet like-minded people, and take part in an experience created by the PRISM AI community."}</p>
          {outcomes.length > 0 && <div className="sp-outcomes"><h3>What you'll take away</h3>{outcomes.map((outcome, index) => <div className="sp-outcome" key={`${outcome}-${index}`}><CheckCircle2 size={17} /><span>{outcome}</span><ArrowUpRight size={15} /></div>)}</div>}
          {prerequisites.length > 0 && <div className="sp-prerequisites"><h3>Before you join</h3>{prerequisites.map((item, index) => <p key={`${item}-${index}`}><i />{item}</p>)}</div>}
          {event.instructor && <div className="sp-instructor"><span><GraduationCap size={20} /></span><div><small>INSTRUCTOR / FACILITATOR</small><strong>{event.instructor}</strong></div></div>}
        </div>

        <aside className="sp-register-card" id="sp-registration">
          <div className="sp-register-heading"><span><Ticket size={21} /></span><small>YOUR NEXT STEP</small></div>
          <h2>Ready to<br />discover what’s next?</h2>
          <p>Complete the registration form to save your spot and join a community of curious minds.</p>
          {rewardPoints > 0 && <div className="sp-register-reward"><Sparkles size={19} /><span><small>YOU CAN EARN</small><strong>+{rewardPoints.toLocaleString("en-IN")} PRISM Points</strong></span></div>}
          <div className="sp-register-meta">
            <p><CalendarDays size={16} /><span>Deadline <strong>{formatDate(event.registrationDeadline)}</strong></span></p>
            <p><Users size={16} /><span>{capacity ? `${Math.max(0, capacity - registrationCount)} spots remaining` : "Open to curious minds"}</span></p>
            <p><ClipboardList size={16} /><span>{fields.length} registration questions</span></p>
          </div>
          {closed ? (
            <div className="sp-form-alert sp-alert-closed"><X size={17} /> Registration for this event is closed.</div>
          ) : externalLink ? (
            <a className="sp-button sp-button-primary sp-full-button" href={externalLink}>Continue to registration <ExternalLink size={16} /></a>
          ) : (
            <button className="sp-button sp-button-primary sp-full-button" onClick={() => navigate(`${window.location.pathname}?register=1`)}>
              Register now <ArrowUpRight size={17} />
            </button>
          )}
          {event.contactEmail && <a className="sp-contact-link" href={`mailto:${event.contactEmail}`}>Questions? Contact the organizer <ArrowUpRight size={14} /></a>}
        </aside>
      </section>

      <footer className="sp-footer"><button className="sp-footer-brand" onClick={() => navigate("/")}><span className="sp-brand-mark"><Sparkles size={14} /></span> PRISM AI</button><p>Explore. Innovate. Impact.</p><button onClick={() => navigate("/events")}>More events <ArrowUpRight size={15} /></button></footer>
      {showSuccess && <div className="sp-success-overlay" role="dialog" aria-modal="true" aria-labelledby="sp-success-title">
        <div className="sp-success-confetti" aria-hidden="true">{Array.from({ length: 64 }, (_, index) => <i key={index} style={{ "--left": `${(index * 37) % 100}%`, "--delay": `${(index % 13) * -0.19}s`, "--duration": `${3.2 + (index % 7) * 0.32}s`, "--drift": `${((index * 19) % 180) - 90}px`, "--rotate": `${(index * 47) % 360}deg` }} />)}</div>
        <section className="sp-success-card">
          <button className="sp-success-close" onClick={() => setShowSuccess(false)} aria-label="Close"><X size={20} /></button>
          <div className="sp-success-check"><CheckCircle2 size={42} /></div>
          <p className="sp-eyebrow">PRISM AI / YOU DID IT</p>
          <h2 id="sp-success-title">Congratulations!</h2>
          <p className="sp-success-copy">Your registration is confirmed. Get ready for an amazing PRISM AI experience!</p>
          <div className="sp-success-points"><Sparkles size={18} /> Registration successful</div>
          <small className="sp-success-timer">THIS MESSAGE CLOSES IN {successCountdown} SECONDS</small>
          <div className="sp-success-progress"><span /></div>
          <button className="sp-success-action" onClick={() => setShowSuccess(false)}>Awesome!</button>
        </section>
      </div>}
    </main>
  );
}
