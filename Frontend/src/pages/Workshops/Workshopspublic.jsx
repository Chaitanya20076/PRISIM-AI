
import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  ArrowLeft,
  ArrowUpRight,
  CalendarDays,
  Clock3,
  MapPin,
  Users,
  IndianRupee,
  Sparkles,
  CheckCircle2,
  ExternalLink,
  Monitor,
  GraduationCap,
  Share2,
  Ticket,
  ClipboardList,
  ShieldCheck,
  CircleCheck,
  X,
} from "lucide-react";
import { getAuth } from "firebase/auth";
import "./Workshopspublic.css";



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

// --------------------------------------------------
// HELPERS
// --------------------------------------------------

const slugify = (value = "") =>
  String(value)
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");

const formatDate = (value) => {
  if (!value) return "To be announced";

  const date = new Date(
    /^\d{4}-\d{2}-\d{2}$/.test(String(value))
      ? `${value}T00:00:00`
      : value
  );

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
    ? value
        .split("\n")
        .map((item) => item.trim())
        .filter(Boolean)
    : Array.isArray(value)
      ? value
      : [];

const normalizeEmail = (value) =>
  String(value || "").trim().toLowerCase();

const normalizePhone = (value) => {
  let digits = String(value || "").replace(/\D/g, "");

  if (digits.length === 12 && digits.startsWith("91")) {
    digits = digits.slice(2);
  }

  return digits;
};

// --------------------------------------------------
// API REQUEST
// --------------------------------------------------

async function apiRequest(endpoint, options = {}) {
  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers: {
          
      "Content-Type": "application/json",
      ...options.headers,
    },
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok || data.success === false) {
    throw new Error(
      data.message || "Something went wrong. Please try again."
    );
  }

  return data;
}

// --------------------------------------------------
// REGISTRATION QUESTION INPUT
// --------------------------------------------------

function QuestionInput({ field, value, onChange }) {
  const common = {
    id: field.id,
    name: field.id,
    value: value ?? "",
    onChange: (event) =>
      onChange(field.id, event.target.value),
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
      <div className="wp-choice-list">
        {String(field.options || "")
          .split(",")
          .map((option) => option.trim())
          .filter(Boolean)
          .map((option) => (
            <label className="wp-choice" key={option}>
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
      <label className="wp-consent">
        <input
          type="checkbox"
          checked={Boolean(value)}
          required={Boolean(field.required)}
          onChange={(event) =>
            onChange(field.id, event.target.checked)
          }
        />
        <span>
          {field.helpText || "I agree to this declaration."}
        </span>
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

// --------------------------------------------------
// MAIN WORKSHOP PUBLIC PAGE
// --------------------------------------------------

export default function Workshopspublic() {
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

  // --------------------------------------------------
  // FETCH WORKSHOP FROM FIRESTORE THROUGH BACKEND
  // --------------------------------------------------

  useEffect(() => {
    let active = true;

    const fetchWorkshop = async () => {
      setLoading(true);
      setLoadError("");
      setEvent(null);

      try {
        const requestedSlug = decodeURIComponent(slug || "");

        const data = await apiRequest(
          `/api/events/slug/${encodeURIComponent(requestedSlug)}`
        );

        if (!data.event) {
          throw new Error("Workshop not found.");
        }

        const fetchedEvent = data.event;

        const category = String(
          fetchedEvent.type ||
          fetchedEvent.category ||
          fetchedEvent.customCategory ||
          ""
        ).toLowerCase();

        if (category !== "workshop") {
          throw new Error("This page is not a workshop.");
        }

        if (active) {
          setEvent(fetchedEvent);
        }
      } catch (error) {
        if (active) {
          setLoadError(
            error.message || "Unable to load this workshop."
          );
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    };

    if (slug) {
      fetchWorkshop();
    } else {
      setLoading(false);
      setLoadError("Workshop link is invalid.");
    }

    return () => {
      active = false;
    };
  }, [slug]);

  // --------------------------------------------------
  // REGISTRATION DATA
  // --------------------------------------------------

  const fields = useMemo(
    () =>
      (
        Array.isArray(event?.registrationFields)
          ? event.registrationFields
          : []
      ).filter(
        (field) => field && field.label?.trim()
      ),
    [event]
  );

  const registrationCount = Number(
    event?.registrationCount ?? 0
  );
  const rewardPoints = Math.max(0, Math.floor(Number(event?.rewardPoints) || 0));

  const startDate = event?.date || event?.startDate;

  const isOnline = ["online", "virtual"].includes(
    String(
      event?.mode || event?.eventFormat || ""
    ).toLowerCase()
  );

  const venue =
    event?.venue ||
    (isOnline ? "Online session" : "Venue to be announced");

  const paid =
    String(event?.feeType || "Free").toLowerCase() === "paid";

  const fee = paid
    ? `₹${event?.feeAmount || "—"}`
    : "Free";

  const deadlinePassed = Boolean(
    event?.registrationDeadline &&
      new Date(
        `${event.registrationDeadline}T23:59:59`
      ) < new Date()
  );

  const isPast =
    String(event?.status || "").toLowerCase() === "past";

  const closed =
    deadlinePassed ||
    isPast ||
    ["closed", "archived"].includes(
      String(event?.status || "").toLowerCase()
    );

  const capacity = Number(
    event?.capacity || event?.participantCapacity || 0
  );

  const full =
    capacity > 0 && registrationCount >= capacity;

  const waitlistEnabled = Boolean(event?.waitlistEnabled);

  const externalLink = String(
    event?.registrationLink || ""
  ).trim();

  const platformRegistration =
    !externalLink && event?.onPlatformRegistration !== false;

  const poster =
    event?.coverImage ||
    event?.photos?.[0]?.data ||
    event?.photos?.[0] ||
    "";

  const outcomes = splitLines(
    event?.outcomes ||
      event?.learningOutcomes ||
      event?.highlights
  );

  const prerequisites = splitLines(event?.prerequisites);

  const updateAnswer = (id, value) => {
    setAnswers((current) => ({
      ...current,
      [id]: value,
    }));
  };

  // --------------------------------------------------
  // SUBMIT REGISTRATION TO FIRESTORE
  // --------------------------------------------------

  const submitRegistration = async (submitEvent) => {
    submitEvent.preventDefault();

    if (!event || submitting) return;

    if (closed) {
      setSubmissionMessage(
        "Registration for this workshop is closed."
      );
      return;
    }

    if (full && !waitlistEnabled) {
      setSubmissionMessage(
        "This workshop has reached its registration capacity."
      );
      return;
    }

    setSubmitting(true);
    setSubmissionMessage("");

    try {
      // Identify email and phone fields.
      const emailField = fields.find(
        (field) =>
          field.type === "email" ||
          /e-?mail/i.test(field.label)
      );

      const phoneField = fields.find(
        (field) =>
          field.type === "tel" ||
          /mobile|phone|contact number|telephone/i.test(
            field.label
          )
      );

      const nameField = fields.find((field) =>
        /full name|name/i.test(field.label)
      );

      const emailValue = String(
        emailField ? answers[emailField.id] || "" : ""
      ).trim();

      const phoneValue = String(
        phoneField ? answers[phoneField.id] || "" : ""
      ).trim();

      const participantName = String(
        nameField ? answers[nameField.id] || "" : ""
      ).trim();

      // Email validation.
      const normalizedEmail = normalizeEmail(emailValue);

      if (emailField && !emailValue) {
        throw new Error("Please enter your email address.");
      }

      if (
        emailValue &&
        !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(emailValue)
      ) {
        throw new Error(
          "Please enter a valid email address, for example name@example.com."
        );
      }

      // Indian mobile validation.
      const normalizedPhone = normalizePhone(phoneValue);

      if (phoneField && !phoneValue) {
        throw new Error("Please enter your mobile number.");
      }

      if (
        phoneValue &&
        !/^[6-9]\d{9}$/.test(normalizedPhone)
      ) {
        throw new Error(
          "Please enter a valid 10-digit Indian mobile number. You may include +91."
        );
      }

      // Prepare registration payload.
      const registrationPayload = {
        participantName,
        email: normalizedEmail,
        phone: normalizedPhone,
        answers: { ...answers },
      };

      // Submit to backend. Backend stores in Firestore.
      const data = await apiRequest(
        `/api/events/${encodeURIComponent(event.id)}/registrations`,
        {
          method: "POST",
          headers: await getMemberAuthHeaders(),
          body: JSON.stringify(registrationPayload),
        }
      );

      // Update the displayed registration count.
      setEvent((current) => ({
        ...current,
        registrationCount:
          Number(current.registrationCount || 0) + 1,
      }));

      setAnswers({});

      const isWaitlisted = data.registration?.status === "Waitlisted";
      const isPending = data.registration?.status === "Pending";
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

  // --------------------------------------------------
  // SHARE WORKSHOP
  // --------------------------------------------------

  const share = async () => {
    try {
      if (navigator.share) {
        await navigator.share({
          title: event?.title || event?.name || "PRISM AI Workshop",
          url: window.location.href,
        });
      } else {
        await navigator.clipboard.writeText(
          window.location.href
        );

        setShareCopied(true);

        window.setTimeout(
          () => setShareCopied(false),
          1800
        );
      }
    } catch {
      // User cancelled sharing.
    }
  };

  // --------------------------------------------------
  // LOADING STATE
  // --------------------------------------------------

  if (loading) {
    return (
      <main className="workshop-public-page wp-state">
        <div className="wp-state-icon">
          <Sparkles size={28} />
        </div>

        <p className="wp-eyebrow">PRISM AI / WORKSHOPS</p>

        <h1>Loading workshop...</h1>

        <p>
          Fetching workshop details. Please wait.
        </p>
      </main>
    );
  }

  // --------------------------------------------------
  // NOT FOUND STATE
  // --------------------------------------------------

  if (!event) {
    return (
      <main className="workshop-public-page wp-state">
        <div className="wp-state-icon">
          <Sparkles size={28} />
        </div>

        <p className="wp-eyebrow">PRISM AI / WORKSHOPS</p>

        <h1>Workshop not found.</h1>

        <p>
          {loadError ||
            "This workshop may not be published yet, or the link may be incorrect."}
        </p>

        <button
          className="wp-button wp-button-primary"
          onClick={() => navigate("/events")}
        >
          <ArrowLeft size={17} />
          Explore events
        </button>
      </main>
    );
  }

  // --------------------------------------------------
  // FULL-SCREEN REGISTRATION PAGE
  // --------------------------------------------------

  if (registrationMode) {
    return (
      <main className="workshop-public-page sp-registration-page">
        <div className="sp-glow sp-glow-one" />
        <div className="sp-glow sp-glow-two" />

        <header className="sp-registration-topbar">
          <button className="sp-nav-back" onClick={() => navigate(-1)}>
            <ArrowLeft size={17} /> Back to workshop
          </button>
          <div className="sp-brand">
            <span className="sp-brand-mark"><Sparkles size={16} /></span>
            PRISM<span>AI</span>
          </div>
          <span className="sp-registration-step">EVENT REGISTRATION</span>
        </header>

        <section className="sp-registration-shell">
          <div className="sp-registration-intro">
            <p className="sp-eyebrow">PRISM AI / WORKSHOP</p>
            <div className="sp-cinematic-copy">
              <h1 className="sp-animated-headline sp-headline-roll" key={headlineIndex}>
                <span className="sp-headline-line sp-headline-line-one">{animatedHeadlines[headlineIndex][0]}</span>
                <span className="sp-headline-line sp-headline-line-two">{animatedHeadlines[headlineIndex][1]}</span>
              </h1>
            </div>
            <p>Complete the details below to reserve your place at <strong>{event.title || event.name || "this workshop"}</strong>.</p>

            {rewardPoints > 0 && (
              <div className="sp-reward-highlight">
                <span><Sparkles size={25} /></span>
                <div>
                  <small>REGISTRATION REWARD</small>
                  <strong>{rewardPoints.toLocaleString("en-IN")} <em>PRISM Points</em></strong>
                  <p>Earn points by being part of this workshop.</p>
                </div>
              </div>
            )}

            <div className="sp-registration-event-facts">
              <span><CalendarDays size={16} />{formatDate(startDate)}</span>
              <span><Clock3 size={16} />{event.startTime || "Time to be announced"}</span>
              <span>{isOnline ? <Monitor size={16} /> : <MapPin size={16} />}{venue}</span>
            </div>
          </div>

          <section className="sp-registration-form-panel">
            <div className="sp-registration-form-heading">
              <p className="sp-eyebrow">YOUR DETAILS</p>
              <h2>Complete your registration</h2>
              <p>Fields marked with * are required.</p>
            </div>

            {closed ? (
              <div className="sp-form-alert sp-alert-closed"><X size={17} /> Registration for this workshop is closed.</div>
            ) : externalLink ? (
              <a className="sp-button sp-button-primary sp-full-button" href={externalLink}>
                Continue to registration <ExternalLink size={16} />
              </a>
            ) : (
              <form className="sp-registration-form" onSubmit={submitRegistration}>
                {full && !waitlistEnabled && <div className="sp-form-alert sp-alert-closed">This workshop has reached capacity.</div>}
                {full && waitlistEnabled && <div className="sp-form-alert"><Users size={17} /> Full capacity — submit to join the waitlist.</div>}
                {event.requireApproval && <div className="sp-form-alert"><ShieldCheck size={17} /> Registrations require organizer approval.</div>}
                {fields.length === 0 && <div className="sp-form-alert">The organizer has not configured registration questions yet.</div>}

                {fields.map((field) => (
                  <label className="sp-form-field" key={field.id}>
                    <span>{field.label}{field.required && <b> *</b>}</span>
                    {field.helpText && field.type !== "checkbox" && <small>{field.helpText}</small>}
                    <QuestionInput field={field} value={answers[field.id]} onChange={updateAnswer} />
                  </label>
                ))}

                {event.registrationConsent && <p className="sp-consent-copy"><ShieldCheck size={15} />{event.registrationConsent}</p>}

                {submissionMessage && (
                  <div className={`sp-form-alert ${submissionMessage.startsWith("Already registered") ? "sp-alert-duplicate" : submissionMessage.includes("registered") || submissionMessage.includes("waitlist") || submissionMessage.includes("approval") ? "sp-alert-success" : "sp-alert-closed"}`} role="status">
                    <CircleCheck size={17} />{submissionMessage}
                  </div>
                )}

                <button className="sp-button sp-button-primary sp-full-button" type="submit" disabled={submitting || fields.length === 0 || (full && !waitlistEnabled)}>
                  {submitting ? "Submitting…" : full && waitlistEnabled ? "Join the waitlist" : "Submit registration"}
                  <ArrowUpRight size={17} />
                </button>
                <small className="sp-privacy-note">Your answers are saved with this workshop registration.</small>
              </form>
            )}

            {event.contactEmail && <a className="sp-contact-link" href={`mailto:${event.contactEmail}`}>Need help? Contact the organizer <ArrowUpRight size={14} /></a>}
          </section>
        </section>

        {showSuccessPopup && (
          <div className="sp-success-overlay" role="dialog" aria-modal="true" aria-labelledby="sp-success-title">
            <div className="sp-confetti" aria-hidden="true">
              {Array.from({ length: 90 }, (_, index) => {
                const colors = ["#9bd35e", "#c8f169", "#e4f7b7", "#ffffff"];
                const x = (index * 37 + 11) % 100;
                return (
                  <i key={index} style={{
                    "--x": `${x}%`,
                    left: `${x}%`,
                    "--delay": `${(index % 18) * 0.075}s`,
                    "--duration": `${2.4 + (index % 7) * 0.24}s`,
                    "--drift": `${((index * 17) % 180) - 90}px`,
                    "--spin": `${360 + (index % 4) * 360}deg`,
                    "--piece-color": colors[index % colors.length],
                    "--piece-width": `${5 + (index % 4) * 2}px`,
                    "--piece-height": `${8 + (index % 5) * 3}px`
                  }} />
                );
              })}
            </div>
            <section className="sp-success-modal">
              <button className="sp-success-close" type="button" aria-label="Close congratulations message" onClick={() => setShowSuccessPopup(false)}><X size={19} /></button>
              <div className="sp-success-emblem"><CircleCheck size={39} /></div>
              <p className="sp-eyebrow">PRISM AI / YOU DID IT</p>
              <h2 id="sp-success-title">{successHeading}</h2>
              <p>{successDescription}</p>
              {rewardPoints > 0 && <div className="sp-success-points"><Sparkles size={18} /><strong>+{rewardPoints.toLocaleString("en-IN")} PRISM Points</strong></div>}
              <div className="sp-success-countdown"><span>THIS MESSAGE CLOSES IN 5 SECONDS</span><div><i /></div></div>
              <button className="sp-button sp-button-primary sp-success-done" type="button" onClick={() => setShowSuccessPopup(false)}>Awesome!</button>
            </section>
          </div>
        )}
      </main>
    );
  }

  // --------------------------------------------------
  // MAIN PAGE
  // --------------------------------------------------

  return (
    <main className="workshop-public-page">
      <div className="wp-glow wp-glow-one" />
      <div className="wp-glow wp-glow-two" />

      <header className="wp-nav">
        <button
          className="wp-nav-back"
          onClick={() => navigate(-1)}
        >
          <ArrowLeft size={17} />
          Back
        </button>

        <button
          className="wp-brand"
          onClick={() => navigate("/")}
        >
          <span className="wp-brand-mark">
            <Sparkles size={16} />
          </span>
          PRISM<span>AI</span>
        </button>

        <button
          className="wp-nav-share"
          onClick={share}
        >
          <Share2 size={16} />
          {shareCopied ? "Copied" : "Share"}
        </button>
      </header>

      {/* HERO */}

      <section className="wp-hero">
        <div className="wp-hero-copy">
          <p className="wp-eyebrow">
            <span className="wp-live-dot" />
            PRISM AI <span>/</span> WORKSHOP
          </p>

          <h1>
            {event.title || event.name || "Workshop"}
            <Sparkles
              className="wp-title-spark"
              size={24}
            />
          </h1>

          <p className="wp-tagline">
            {event.tagline ||
              event.caption ||
              "Learn something new. Build something meaningful."}
          </p>

          <div className="wp-tags">
            <span>
              <GraduationCap size={15} />
              Hands-on learning
            </span>

            <span>
              <Sparkles size={14} />
              Learn by doing
            </span>

            <span className={closed ? "closed" : "open"}>
              <i />
              {closed
                ? "Registrations closed"
                : "Registration open"}
            </span>
          </div>

          <div className="wp-hero-actions">
            {externalLink && !closed && (
              <a
                className="wp-button wp-button-primary"
                href={externalLink}
              >
                Register externally
                <ExternalLink size={17} />
              </a>
            )}

            {platformRegistration && !closed && (
              <button
                className="wp-button wp-button-primary"
                onClick={() =>
                  navigate(`${window.location.pathname}?register=1`)
                }
              >
                Register for workshop
                <ArrowUpRight size={17} />
              </button>
            )}

            {closed && (
              <span className="wp-closed-pill">
                <X size={15} />
                Registration closed
              </span>
            )}

            <button
              className="wp-button wp-button-secondary"
              onClick={() =>
                document
                  .getElementById("wp-about")
                  ?.scrollIntoView({ behavior: "smooth" })
              }
            >
              Explore workshop
              <ArrowUpRight size={17} />
            </button>
          </div>
        </div>

        <div className="wp-art-wrap">
          <div className="wp-orbit wp-orbit-one" />
          <div className="wp-orbit wp-orbit-two" />

          <div className="wp-art-card">
            {poster ? (
              <img
                src={poster}
                alt={`${event.title || event.name} poster`}
              />
            ) : (
              <div className="wp-art-placeholder">
                <div className="wp-art-grid" />

                <div className="wp-art-icon">
                  <Sparkles size={42} />
                </div>

                <small>IDEAS IN ACTION</small>

                <strong>Learn. Build. Repeat.</strong>

                <span>PRISM AI · WORKSHOPS</span>
              </div>
            )}

            <b>P / 01</b>
          </div>

          <div className="wp-float-chip wp-float-top">
            <Sparkles size={15} />
            Made to explore
          </div>

          <div className="wp-float-chip wp-float-bottom">
            <CheckCircle2 size={16} />
            Skills that stick
          </div>
        </div>
      </section>

      {/* WORKSHOP FACTS */}

      <section className="wp-facts">
        <div>
          <span className="wp-fact-icon">
            <CalendarDays size={19} />
          </span>

          <section>
            <small>DATE</small>
            <strong>{formatDate(startDate)}</strong>
          </section>
        </div>

        <div>
          <span className="wp-fact-icon">
            <Clock3 size={19} />
          </span>

          <section>
            <small>TIME</small>
            <strong>
              {event.startTime || "To be announced"}
            </strong>

            {event.endTime && (
              <em>Ends at {event.endTime}</em>
            )}
          </section>
        </div>

        <div>
          <span className="wp-fact-icon">
            {isOnline ? (
              <Monitor size={19} />
            ) : (
              <MapPin size={19} />
            )}
          </span>

          <section>
            <small>LOCATION</small>
            <strong>{venue}</strong>

            <em>
              {event.mode ||
                event.eventFormat ||
                "In-person"}
            </em>
          </section>
        </div>

        <div>
          <span className="wp-fact-icon">
            <IndianRupee size={19} />
          </span>

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

      {/* WORKSHOP CONTENT */}

      <section className="wp-content" id="wp-about">
        <div className="wp-main-content">
          <div className="wp-section-title">
            <span>01</span>

            <div>
              <p className="wp-eyebrow">
                THE EXPERIENCE
              </p>

              <h2>More than just a session.</h2>
            </div>
          </div>

          <p className="wp-description">
            {event.description ||
              "Get hands-on experience, explore practical concepts, and learn alongside a community of curious minds."}
          </p>

          {outcomes.length > 0 && (
            <div className="wp-outcomes">
              <h3>What you'll take away</h3>

              {outcomes.map((outcome, index) => (
                <div
                  className="wp-outcome"
                  key={`${outcome}-${index}`}
                >
                  <CheckCircle2 size={17} />
                  <span>{outcome}</span>
                  <ArrowUpRight size={15} />
                </div>
              ))}
            </div>
          )}

          {prerequisites.length > 0 && (
            <div className="wp-prerequisites">
              <h3>Before you join</h3>

              {prerequisites.map((item, index) => (
                <p key={`${item}-${index}`}>
                  <i />
                  {item}
                </p>
              ))}
            </div>
          )}

          {event.instructor && (
            <div className="wp-instructor">
              <span>
                <GraduationCap size={20} />
              </span>

              <div>
                <small>INSTRUCTOR / FACILITATOR</small>
                <strong>{event.instructor}</strong>
              </div>
            </div>
          )}
        </div>

        {/* REGISTRATION SUMMARY — FORM OPENS IN A DEDICATED TAB */}
        <aside className="wp-register-card" id="wp-registration">
          <div className="wp-register-heading">
            <span><Ticket size={21} /></span>
            <small>YOUR NEXT STEP</small>
          </div>

          <h2>Ready to<br />get hands-on?</h2>
          <p>Explore the details and reserve your place in this workshop.</p>

          <div className="wp-register-meta">
            {rewardPoints > 0 && (
              <p><Sparkles size={16} /><span>Registration reward <strong>{rewardPoints.toLocaleString("en-IN")} PRISM Points</strong></span></p>
            )}
            <p><CalendarDays size={16} /><span>Registration deadline <strong>{formatDate(event.registrationDeadline)}</strong></span></p>
            <p><Users size={16} /><span>Availability <strong>{capacity ? `${Math.max(0, capacity - registrationCount)} spots remaining` : "Open to curious minds"}</strong></span></p>
            <p><ClipboardList size={16} /><span>Registration questions <strong>{fields.length} questions</strong></span></p>
            <p><ShieldCheck size={16} /><span>Approval <strong>{event.requireApproval ? "Organizer approval required" : "Instant registration"}</strong></span></p>
          </div>

          {closed ? (
            <div className="wp-form-alert wp-alert-closed"><X size={17} /> Registration for this workshop is closed.</div>
          ) : externalLink ? (
            <a className="wp-button wp-button-primary wp-full-button" href={externalLink}>
              Continue to registration <ExternalLink size={16} />
            </a>
          ) : platformRegistration ? (
            <button className="wp-button wp-button-primary wp-full-button" type="button" onClick={() => navigate(`${window.location.pathname}?register=1`)}>
              Register now <ArrowUpRight size={17} />
            </button>
          ) : (
            <div className="wp-form-alert">Online registration is unavailable for this workshop.</div>
          )}

          {event.contactEmail && (
            <a className="wp-contact-link" href={`mailto:${event.contactEmail}`}>
              Questions? Contact the organizer <ArrowUpRight size={14} />
            </a>
          )}
        </aside>
      </section>

      {/* FOOTER */}

      <footer className="wp-footer">
        <button
          className="wp-footer-brand"
          onClick={() => navigate("/")}
        >
          <span className="wp-brand-mark">
            <Sparkles size={14} />
          </span>
          PRISM AI
        </button>

        <p>Explore. Innovate. Impact.</p>

        <button onClick={() => navigate("/events")}>
          More events
          <ArrowUpRight size={15} />
        </button>
      </footer>
    </main>
  );
}
