
import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  ArrowLeft, ArrowUpRight, CalendarDays, Clock3, Users, IndianRupee,
  Sparkles, CheckCircle2, ExternalLink, Monitor, GraduationCap,
  Share2, Ticket, ClipboardList, ShieldCheck, CircleCheck, X
} from "lucide-react";
import { getAuth } from "firebase/auth";
import "./webinarpublic.css";



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

const API_BASE_URL = (
  import.meta.env.VITE_API_URL ||
  import.meta.env.VITE_API_BASE_URL ||
  "http://localhost:5000"
).replace(/\/$/, "");

async function publicApi(path, options = {}) {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers: {
          
      "Content-Type": "application/json",
      ...(options.headers || {}),
    },
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok || data.success === false) {
    throw new Error(data.message || `Request failed (${response.status}).`);
  }

  return data;
}

const isWebinarRecord = (item) => {
  const types = [
    item?.type,
    item?.category,
    item?.customCategory,
  ]
    .filter(Boolean)
    .map((value) => String(value).trim().toLowerCase());

  const otherTypes = [
    "seminar",
    "workshop",
    "hackathon",
    "bootcamp",
    "competition",
    "contest",
    "ideathon",
  ];

  if (types.some((type) => otherTypes.includes(type))) return false;
  if (types.includes("webinar")) return true;

  const id = String(item?.slug || item?.id || "").toLowerCase();

  return id.startsWith("webinar-") || id.startsWith("webinar:");
};

const formatDate = (value) => {
  if (!value) return "To be announced";

  const date = new Date(`${value}T00:00:00`);

  return Number.isNaN(date.getTime())
    ? value
    : date.toLocaleDateString("en-IN", {
        day: "numeric",
        month: "long",
        year: "numeric",
      });
};

const splitLines = (value) =>
  typeof value === "string"
    ? value.split("\n").map((item) => item.trim()).filter(Boolean)
    : Array.isArray(value)
      ? value
      : [];

function QuestionInput({ field, value, onChange }) {
  const common = {
    id: field.id,
    name: field.id,
    value: value ?? "",
    onChange: (event) => onChange(field.id, event.target.value),
    required: Boolean(field.required),
  };

  if (field.type === "textarea") {
    return <textarea {...common} rows={4} />;
  }

  if (field.type === "select") {
    return (
      <select {...common}>
        <option value="">Choose an option</option>
        {String(field.options || "")
          .split(",")
          .map((option) => option.trim())
          .filter(Boolean)
          .map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
      </select>
    );
  }

  if (field.type === "radio") {
    return (
      <div className="sp-choice-list">
        {String(field.options || "")
          .split(",")
          .map((option) => option.trim())
          .filter(Boolean)
          .map((option) => (
            <label className="sp-choice" key={option}>
              <input
                type="radio"
                name={field.id}
                value={option}
                checked={value === option}
                required={Boolean(field.required)}
                onChange={() => onChange(field.id, option)}
              />
              <span>{option}</span>
            </label>
          ))}
      </div>
    );
  }

  if (field.type === "checkbox") {
    return (
      <label className="sp-consent">
        <input
          type="checkbox"
          checked={Boolean(value)}
          required={Boolean(field.required)}
          onChange={(event) => onChange(field.id, event.target.checked)}
        />
        <span>{field.helpText || "I agree to this declaration."}</span>
      </label>
    );
  }

  const types = {
    email: "email",
    tel: "tel",
    number: "number",
    url: "url",
    date: "date",
  };

  return (
    <input
      {...common}
      type={types[field.type] || "text"}
      min={field.type === "number" ? 0 : undefined}
    />
  );
}

export default function Webinarpublic() {
  const navigate = useNavigate();
  const { slug } = useParams();
  const registrationMode = new URLSearchParams(window.location.search).get("register") === "1";

  const [event, setEvent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");

  const [answers, setAnswers] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [submissionMessage, setSubmissionMessage] = useState("");
  const [shareCopied, setShareCopied] = useState(false);
  const [showSuccessPopup, setShowSuccessPopup] = useState(false);
  const [successHeading, setSuccessHeading] = useState("Congratulations!");
  const [successDescription, setSuccessDescription] = useState("Your registration has been recorded successfully.");
  const [headlineIndex, setHeadlineIndex] = useState(0);

  const animatedHeadlines = [
    ["IDEAS BECOME", "IMPACT."],
    ["THINK. CREATE.", "REPEAT."],
    ["BUILD WHAT'S", "NEXT."],
    ["LEARN WITHOUT", "LIMITS."],
    ["TURN CURIOSITY", "INTO CODE."],
    ["MAKE YOUR", "MARK."]
  ];

  useEffect(() => {
    if (!registrationMode) return undefined;
    const timer = window.setTimeout(() => {
      setHeadlineIndex((current) => (current + 1) % animatedHeadlines.length);
    }, 5600);
    return () => window.clearTimeout(timer);
  }, [registrationMode, headlineIndex]);

  useEffect(() => {
    if (!showSuccessPopup) return undefined;
    const dismissTimer = window.setTimeout(() => setShowSuccessPopup(false), 5000);
    return () => window.clearTimeout(dismissTimer);
  }, [showSuccessPopup]);

  // Fetch the public webinar from the backend.
  useEffect(() => {
    let cancelled = false;

    const loadWebinar = async () => {
      setLoading(true);
      setLoadError("");

      try {
        const identifier = decodeURIComponent(slug || "");

        const data = await publicApi(
          `/api/events/slug/${encodeURIComponent(identifier)}`
        );

        const item = data.event || data;

        if (!isWebinarRecord(item)) {
          throw new Error("This link does not belong to a webinar.");
        }

        if (!cancelled) {
          setEvent(item);
        }
      } catch (error) {
        if (!cancelled) {
          setEvent(null);
          setLoadError(error.message || "Could not load this webinar.");
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    if (slug) {
      loadWebinar();
    } else {
      setLoading(false);
      setLoadError("A webinar link is missing.");
    }

    return () => {
      cancelled = true;
    };
  }, [slug]);

  const fields = useMemo(
    () =>
      (Array.isArray(event?.registrationFields)
        ? event.registrationFields
        : []
      ).filter((field) => field && field.label?.trim()),
    [event]
  );

  const registrationCount = Number(
    event?.registrationCount ?? event?.registrations?.length ?? 0
  );
  const rewardPoints = Math.max(0, Math.floor(Number(event?.rewardPoints) || 0));

  const startDate = event?.date || event?.startDate;

  const paid = String(event?.feeType || "Free").toLowerCase() === "paid";
  const fee = paid ? `₹${event?.feeAmount || "—"}` : "Free";

  const deadlinePassed = Boolean(
    event?.registrationDeadline &&
    new Date(`${event.registrationDeadline}T23:59:59`) < new Date()
  );

  const isPast = String(event?.status || "").toLowerCase() === "past";

  const closed =
    deadlinePassed ||
    isPast ||
    ["closed", "archived"].includes(
      String(event?.status || "").toLowerCase()
    );

  const capacity = Number(event?.capacity || 0);
  const full = capacity > 0 && registrationCount >= capacity;

  const waitlistEnabled = Boolean(event?.waitlistEnabled);

  const externalLink = String(event?.registrationLink || "").trim();

  const platformRegistration =
    !externalLink && event?.onPlatformRegistration !== false;

  const poster = event?.coverImage || event?.photos?.[0]?.data || "";

  const outcomes = splitLines(
    event?.outcomes || event?.learningOutcomes || event?.highlights
  );

  const prerequisites = splitLines(event?.prerequisites);

  const updateAnswer = (id, value) => {
    setAnswers((current) => ({
      ...current,
      [id]: value,
    }));
  };

  // Submit registration to Firestore through the public API.
  const submitRegistration = async (submitEvent) => {
    submitEvent.preventDefault();

    if (!event || submitting) return;

    if (closed) {
      setSubmissionMessage("Registration for this webinar is closed.");
      return;
    }

    if (full && !waitlistEnabled) {
      setSubmissionMessage(
        "This webinar has reached its registration capacity."
      );
      return;
    }

    setSubmitting(true);
    setSubmissionMessage("");

    try {
      const emailField = fields.find(
        (field) =>
          field.type === "email" || /e-?mail/i.test(field.label)
      );

      const emailValue = String(
        emailField ? answers[emailField.id] || "" : ""
      ).trim();

      const emailLooksValid =
        /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(emailValue);

      if (emailField && !emailValue) {
        throw new Error("Please enter your email address.");
      }

      if (emailValue && !emailLooksValid) {
        throw new Error(
          "Please enter a valid email address, for example name@example.com."
        );
      }

      const phoneField = fields.find(
        (field) =>
          field.type === "tel" ||
          /mobile|phone|contact number|telephone/i.test(field.label)
      );

      const phoneValue = phoneField
        ? String(answers[phoneField.id] || "").trim()
        : "";

      let normalizedPhone = phoneValue.replace(/\D/g, "");

      if (
        normalizedPhone.length === 12 &&
        normalizedPhone.startsWith("91")
      ) {
        normalizedPhone = normalizedPhone.slice(2);
      }

      if (phoneField && !phoneValue) {
        throw new Error("Please enter your mobile number.");
      }

      if (
        phoneValue &&
        !/^[6-9]\d{9}$/.test(normalizedPhone)
      ) {
        throw new Error(
          "Please enter a valid 10-digit Indian mobile number starting with 6, 7, 8 or 9. You may include +91."
        );
      }

      const nameField = fields.find((field) =>
        /full name|name/i.test(field.label)
      );

      const participantName = String(
        nameField ? answers[nameField.id] || "" : ""
      ).trim();

      const data = await publicApi(
        `/api/events/${encodeURIComponent(event.id)}/registrations`,
        {
          method: "POST",
          headers: await getMemberAuthHeaders(),
          body: JSON.stringify({
            email: emailValue,
            phone: phoneValue,
            mobile: phoneValue,
            participantName,
            name: participantName,
            answers: { ...answers },
          }),
        }
      );

      const registration = data.registration || {};
      const resultStatus = String(
        registration.status || data.status || ""
      ).toLowerCase();

      setEvent((current) =>
        current
          ? {
              ...current,
              registrationCount: Number(
                data.registrationCount ??
                data.event?.registrationCount ??
                registrationCount + 1
              ),
            }
          : current
      );

      setAnswers({});

      const isWaitlisted = resultStatus === "waitlisted";
      const isPending = resultStatus === "pending";
      setSubmissionMessage(
        isWaitlisted
          ? "You're on the waitlist. Your registration has been recorded."
          : isPending
            ? "Registration submitted! It is pending organizer approval."
            : "You're registered! Your registration has been recorded successfully."
      );
      setSuccessHeading(isWaitlisted ? "You're on the waitlist!" : isPending ? "Registration submitted!" : "Congratulations!");
      setSuccessDescription(
        isWaitlisted
          ? "Your place on the waitlist is confirmed. We'll keep you updated."
          : isPending
            ? "Your registration is in. The organizer will review and approve it."
            : "Your registration is confirmed. Get ready for an amazing PRISM AI experience!"
      );
      setShowSuccessPopup(true);
    } catch (error) {
      setSubmissionMessage(
        error.message ||
        "We couldn't submit your registration. Please try again."
      );
    } finally {
      setSubmitting(false);
    }
  };

  const share = async () => {
    try {
      if (navigator.share) {
        await navigator.share({
          title: event?.title || event?.name || "PRISM AI Webinar",
          url: window.location.href,
        });
      } else {
        await navigator.clipboard.writeText(window.location.href);
        setShareCopied(true);
        window.setTimeout(() => setShareCopied(false), 1800);
      }
    } catch {
      // User cancelled sharing.
    }
  };

  if (loading) {
    return (
      <main className="webinar-public-page sp-state">
        <div className="sp-state-icon">
          <Sparkles size={28} />
        </div>
        <p className="sp-eyebrow">PRISM AI / WEBINARS</p>
        <h1>Loading webinar…</h1>
        <p>Fetching the webinar details.</p>
      </main>
    );
  }

  if (!event) {
    return (
      <main className="webinar-public-page sp-state">
        <div className="sp-state-icon">
          <Sparkles size={28} />
        </div>
        <p className="sp-eyebrow">PRISM AI / WEBINARS</p>
        <h1>Webinar not found.</h1>
        <p>
          {loadError ||
            "This webinar may not be published yet, or the link may be incorrect."}
        </p>
        <button
          className="sp-button sp-button-primary"
          onClick={() => navigate("/events")}
        >
          <ArrowLeft size={17} /> Explore events
        </button>
      </main>
    );
  }

  if (registrationMode) {
    return (
      <main className="webinar-public-page sp-registration-page">
        <div className="sp-glow sp-glow-one" /><div className="sp-glow sp-glow-two" />
        <header className="sp-registration-topbar">
          <button className="sp-nav-back" onClick={() => navigate(window.location.pathname, { replace: true })}><ArrowLeft size={17}/> Back to webinar</button>
          <div className="sp-brand"><span className="sp-brand-mark"><Sparkles size={16}/></span> PRISM<span>AI</span></div>
          <span className="sp-registration-step">EVENT REGISTRATION</span>
        </header>
        <section className="sp-registration-shell">
          <div className="sp-registration-intro">
            <p className="sp-eyebrow">PRISM AI / WEBINAR</p>
            <div className="sp-cinematic-copy">
              <h1 className="sp-animated-headline sp-headline-roll" key={headlineIndex}>
                <span className="sp-headline-line sp-headline-line-one">{animatedHeadlines[headlineIndex][0]}</span>
                <span className="sp-headline-line sp-headline-line-two">{animatedHeadlines[headlineIndex][1]}</span>
              </h1>
            </div>
            <p>Complete the details below to reserve your place at <strong>{event.title || event.name || "this webinar"}</strong>.</p>
            {rewardPoints > 0 && <div className="sp-reward-highlight"><span><Sparkles size={25}/></span><div><small>REGISTRATION REWARD</small><strong>{rewardPoints.toLocaleString("en-IN")} <em>PRISM Points</em></strong><p>Earn points by being part of this webinar.</p></div></div>}
            <div className="sp-registration-event-facts">
              <span><CalendarDays size={16}/>{formatDate(startDate)}</span>
              <span><Clock3 size={16}/>{event.startTime || "Time to be announced"}</span>
              <span><Monitor size={16}/>Online webinar</span>
            </div>
          </div>
          <section className="sp-registration-form-panel">
            <div className="sp-registration-form-heading"><p className="sp-eyebrow">YOUR DETAILS</p><h2>Complete your registration</h2><p>Fields marked with * are required.</p></div>
            {closed ? <div className="sp-form-alert sp-alert-closed"><X size={17}/> Registration for this webinar is closed.</div> : externalLink ? <a className="sp-button sp-button-primary sp-full-button" href={externalLink}>Continue to registration <ExternalLink size={16}/></a> : (
              <form className="sp-registration-form" onSubmit={submitRegistration}>
                {full && !waitlistEnabled && <div className="sp-form-alert sp-alert-closed">This webinar has reached capacity.</div>}
                {full && waitlistEnabled && <div className="sp-form-alert"><Users size={17}/> Full capacity — submit to join the waitlist.</div>}
                {event.requireApproval && <div className="sp-form-alert"><ShieldCheck size={17}/> Registrations require organizer approval.</div>}
                {fields.length === 0 && <div className="sp-form-alert">The organizer has not configured registration questions yet.</div>}
                {fields.map((field) => <label className="sp-form-field" key={field.id}><span>{field.label}{field.required && <b> *</b>}</span>{field.helpText && field.type !== "checkbox" && <small>{field.helpText}</small>}<QuestionInput field={field} value={answers[field.id]} onChange={updateAnswer}/></label>)}
                {event.registrationConsent && <p className="sp-consent-copy"><ShieldCheck size={15}/>{event.registrationConsent}</p>}
                {submissionMessage && <div className={`sp-form-alert ${submissionMessage.startsWith("Already registered") ? "sp-alert-duplicate" : submissionMessage.includes("registered") || submissionMessage.includes("waitlist") || submissionMessage.includes("approval") ? "sp-alert-success" : "sp-alert-closed"}`} role="status"><CircleCheck size={17}/>{submissionMessage}</div>}
                <button className="sp-button sp-button-primary sp-full-button" type="submit" disabled={submitting || fields.length === 0 || (full && !waitlistEnabled)}>{submitting ? "Submitting…" : full && waitlistEnabled ? "Join the waitlist" : "Submit registration"}<ArrowUpRight size={17}/></button>
                <small className="sp-privacy-note">Your answers are saved with this webinar registration.</small>
              </form>
            )}
            {event.contactEmail && <a className="sp-contact-link" href={`mailto:${event.contactEmail}`}>Need help? Contact the organizer <ArrowUpRight size={14}/></a>}
          </section>
        </section>
        {showSuccessPopup && <div className="sp-success-overlay" role="dialog" aria-modal="true" aria-labelledby="sp-success-title">
          <div className="sp-confetti" aria-hidden="true">{Array.from({ length: 90 }, (_, index) => {
            const colors = ["#ff7898", "#ff9db2", "#ffd0dc", "#ffffff"];
            const x = (index * 37 + 11) % 100;
            return <i key={index} style={{
              "--x": `${x}%`, left: `${x}%`,
              "--delay": `${(index % 18) * 0.075}s`,
              "--duration": `${2.4 + (index % 7) * 0.24}s`,
              "--drift": `${((index * 17) % 180) - 90}px`,
              "--spin": `${360 + (index % 4) * 360}deg`,
              "--piece-color": colors[index % colors.length],
              "--confetti-color": colors[index % colors.length],
              "--piece-width": `${5 + (index % 4) * 2}px`,
              "--piece-height": `${8 + (index % 5) * 3}px`
            }} />})}</div>
          <section className="sp-success-modal">
            <button className="sp-success-close" type="button" aria-label="Close congratulations message" onClick={() => setShowSuccessPopup(false)}><X size={19}/></button>
            <div className="sp-success-emblem"><CircleCheck size={39}/></div>
            <p className="sp-eyebrow">PRISM AI / YOU DID IT</p>
            <h2 id="sp-success-title">{successHeading}</h2>
            <p>{successDescription}</p>
            {rewardPoints > 0 && <div className="sp-success-points"><Sparkles size={18}/><strong>+{rewardPoints.toLocaleString("en-IN")} PRISM Points</strong></div>}
            <div className="sp-success-countdown"><span>THIS MESSAGE CLOSES IN 5 SECONDS</span><div><i/></div></div>
            <button className="sp-button sp-button-primary sp-success-done" type="button" onClick={() => setShowSuccessPopup(false)}>Awesome!</button>
          </section>
        </div>}
      </main>
    );
  }

  return (
    <main className="webinar-public-page">
      <div className="sp-glow sp-glow-one" />
      <div className="sp-glow sp-glow-two" />

      <header className="sp-nav">
        <button className="sp-nav-back" onClick={() => navigate("/events", { replace: true })}>
          <ArrowLeft size={17} /> Back
        </button>

        <button className="sp-brand" onClick={() => navigate("/")}>
          <span className="sp-brand-mark">
            <Sparkles size={16} />
          </span>
          PRISM<span>AI</span>
        </button>

        <button className="sp-nav-share" onClick={share}>
          <Share2 size={16} /> {shareCopied ? "Copied" : "Share"}
        </button>
      </header>

      <section className="sp-hero">
        <div className="sp-hero-copy">
          <p className="sp-eyebrow">
            <span className="sp-live-dot" /> PRISM AI <span>/</span> WEBINAR
          </p>

          <h1>
            {event.title || event.name || "Webinar"}
            <Sparkles className="sp-title-spark" size={24} />
          </h1>

          <p className="sp-tagline">
            {event.tagline ||
              event.caption ||
              "Join live. Learn something new. Grow together."}
          </p>

          <div className="sp-tags">
            <span><GraduationCap size={15} /> Live expert session</span>
            <span><Sparkles size={14} /> Learn from anywhere</span>
            <span className={closed ? "closed" : "open"}>
              <i />
              {closed ? "Registrations closed" : "Registration open"}
            </span>
          </div>

          <div className="sp-hero-actions">
            {externalLink && !closed && (
              <a
                className="sp-button sp-button-primary"
                href={externalLink}
              >
                Register externally <ExternalLink size={17} />
              </a>
            )}

            {platformRegistration && !closed && (
              <button
                className="sp-button sp-button-primary"
                onClick={() =>
                  navigate(`${window.location.pathname}?register=1`)
                }
              >
                Register for webinar <ArrowUpRight size={17} />
              </button>
            )}

            {closed && (
              <span className="sp-closed-pill">
                <X size={15} /> Registration closed
              </span>
            )}

            <button
              className="sp-button sp-button-secondary"
              onClick={() =>
                document
                  .getElementById("sp-about")
                  ?.scrollIntoView({ behavior: "smooth" })
              }
            >
              Explore webinar <ArrowUpRight size={17} />
            </button>
          </div>
        </div>

        <div className="sp-art-wrap">
          <div className="sp-orbit sp-orbit-one" />
          <div className="sp-orbit sp-orbit-two" />

          <div className="sp-art-card">
            {poster ? (
              <img
                src={poster}
                alt={`${event.title || event.name} poster`}
              />
            ) : (
              <div className="sp-art-placeholder">
                <div className="sp-art-grid" />
                <div className="sp-art-icon">
                  <Sparkles size={42} />
                </div>
                <small>IDEAS IN REAL TIME</small>
                <strong>Connect. Learn. Grow.</strong>
                <span>PRISM AI · WEBINARS</span>
              </div>
            )}
            <b>P / 01</b>
          </div>

          <div className="sp-float-chip sp-float-top">
            <Sparkles size={15} /> Your next learning moment
          </div>

          <div className="sp-float-chip sp-float-bottom">
            <CheckCircle2 size={16} /> Join from anywhere
          </div>
        </div>
      </section>

      <section className="sp-facts">
        <div>
          <span className="sp-fact-icon"><CalendarDays size={19} /></span>
          <section>
            <small>DATE</small>
            <strong>{formatDate(startDate)}</strong>
          </section>
        </div>

        <div>
          <span className="sp-fact-icon"><Clock3 size={19} /></span>
          <section>
            <small>TIME</small>
            <strong>{event.startTime || "To be announced"}</strong>
            {event.endTime && <em>Ends at {event.endTime}</em>}
          </section>
        </div>

        <div>
          <span className="sp-fact-icon"><Monitor size={19} /></span>
          <section>
            <small>FORMAT</small>
            <strong>Online webinar</strong>
            <em>
              {event.platformLink
                ? "Meeting link available"
                : "Meeting link shared by organizer"}
            </em>
          </section>
        </div>

        <div>
          <span className="sp-fact-icon"><IndianRupee size={19} /></span>
          <section>
            <small>ENTRY</small>
            <strong>{fee}</strong>
            <em>
              {registrationCount}
              {capacity ? ` / ${capacity}` : " registered"}
            </em>
          </section>
        </div>
      </section>

      <section className="sp-content" id="sp-about">
        <div className="sp-main-content">
          <div className="sp-section-title">
            <span>01</span>
            <div>
              <p className="sp-eyebrow">THE WEBINAR</p>
              <h2>A better way to learn together.</h2>
            </div>
          </div>

          <p className="sp-description">
            {event.description ||
              "Join the session to explore practical ideas, ask questions, and learn directly from the speaker."}
          </p>

          {outcomes.length > 0 && (
            <div className="sp-outcomes">
              <h3>What you'll take away</h3>
              {outcomes.map((outcome, index) => (
                <div className="sp-outcome" key={`${outcome}-${index}`}>
                  <CheckCircle2 size={17} />
                  <span>{outcome}</span>
                  <ArrowUpRight size={15} />
                </div>
              ))}
            </div>
          )}

          {prerequisites.length > 0 && (
            <div className="sp-prerequisites">
              <h3>Before you join</h3>
              {prerequisites.map((item, index) => (
                <p key={`${item}-${index}`}><i />{item}</p>
              ))}
            </div>
          )}

          {event.instructor && (
            <div className="sp-instructor">
              <span><GraduationCap size={20} /></span>
              <div>
                <small>INSTRUCTOR / FACILITATOR</small>
                <strong>{event.instructor}</strong>
              </div>
            </div>
          )}
        </div>

        <section className="sp-event-overview" aria-label="Registration information">
          <div className="sp-overview-heading">
            <span className="sp-overview-icon"><Ticket size={22} /></span>
            <div><p className="sp-eyebrow">REGISTRATION DETAILS</p><h2>Everything you need to know.</h2></div>
          </div>
          {rewardPoints > 0 && <div className="sp-reward-highlight"><span><Sparkles size={25} /></span><div><small>YOU'LL EARN WHEN YOU REGISTER</small><strong>{rewardPoints.toLocaleString("en-IN")} <em>PRISM Points</em></strong><p>A little extra for being part of the PRISM AI community.</p></div></div>}
          <div className="sp-overview-grid">
            <div><CalendarDays size={18}/><span><small>Registration deadline</small><strong>{formatDate(event.registrationDeadline)}</strong></span></div>
            <div><Users size={18}/><span><small>Availability</small><strong>{capacity ? `${Math.max(0, capacity - registrationCount)} spots remaining` : "Open to curious minds"}</strong></span></div>
            <div><ClipboardList size={18}/><span><small>Registration questions</small><strong>{fields.length} questions</strong></span></div>
            <div><ShieldCheck size={18}/><span><small>Approval</small><strong>{event.requireApproval ? "Organizer approval required" : "Instant registration"}</strong></span></div>
          </div>
          {closed ? <div className="sp-form-alert sp-alert-closed"><X size={17}/> Registration for this webinar is closed.</div> :
            externalLink ? <a className="sp-button sp-button-primary sp-overview-cta" href={externalLink}>Register externally <ExternalLink size={17}/></a> :
            <button className="sp-button sp-button-primary sp-overview-cta" onClick={() => navigate(`${window.location.pathname}?register=1`)}>Register now <ArrowUpRight size={17}/></button>}
          {event.contactEmail && <a className="sp-contact-link" href={`mailto:${event.contactEmail}`}>Questions? Contact the organizer <ArrowUpRight size={14}/></a>}
        </section>
      </section>

      <footer className="sp-footer">
        <button
          className="sp-footer-brand"
          onClick={() => navigate("/")}
        >
          <span className="sp-brand-mark"><Sparkles size={14} /></span>
          PRISM AI
        </button>
        <p>Explore. Innovate. Impact.</p>
        <button onClick={() => navigate("/events")}>
          More events <ArrowUpRight size={15} />
        </button>
      </footer>
    </main>
  );
}
