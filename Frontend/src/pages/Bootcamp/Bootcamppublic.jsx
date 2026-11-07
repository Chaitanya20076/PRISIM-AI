
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

import "./Bootcamppublic.css";

const API_BASE_URL = (
  import.meta.env.VITE_API_URL ||
  import.meta.env.VITE_API_BASE_URL ||
  "http://localhost:5000"
).replace(/\/$/, "");

// --------------------------------------------------
// HELPERS
// --------------------------------------------------

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

// --------------------------------------------------
// VALIDATION HELPERS
// --------------------------------------------------

const normalizeEmail = (value) =>
  String(value || "").trim().toLowerCase();

const isValidEmail = (value) => {
  const email = normalizeEmail(value);

  // Supports .com, .in, .ac.in, .edu, and other valid domains.
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email);
};

const normalizePhone = (value) => {
  let digits = String(value || "").replace(/\D/g, "");

  if (digits.length === 12 && digits.startsWith("91")) {
    digits = digits.slice(2);
  }

  return digits;
};

const isValidPhone = (value) =>
  /^[6-9]\d{9}$/.test(normalizePhone(value));

// --------------------------------------------------
// DYNAMIC REGISTRATION QUESTION INPUT
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

  const isEmailField =
    field.type === "email" ||
    /e-?mail/i.test(field.label || "");

  return (
    <input
      {...common}
      type={isEmailField ? "email" : types[field.type] || "text"}
      autoComplete={
        isEmailField ? "email" : undefined
      }
      inputMode={
        isEmailField ? "email" : undefined
      }
      min={field.type === "number" ? 0 : undefined}
    />
  );
}

// --------------------------------------------------
// MAIN COMPONENT
// --------------------------------------------------

export default function Bootcamppublic() {
  const navigate = useNavigate();
  const { slug } = useParams();

  const [event, setEvent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");

  const [registrationCount, setRegistrationCount] = useState(0);

  const [answers, setAnswers] = useState({});

  const [submitting, setSubmitting] = useState(false);
  const [submissionMessage, setSubmissionMessage] = useState("");

  const [shareCopied, setShareCopied] = useState(false);

  // --------------------------------------------------
  // LOAD BOOTCAMP
  // --------------------------------------------------

  useEffect(() => {
    let active = true;

    const loadBootcamp = async () => {
      if (!slug) {
        if (active) {
          setEvent(null);
          setLoadError("The bootcamp link is incomplete.");
          setLoading(false);
        }
        return;
      }

      try {
        setLoading(true);
        setLoadError("");

        const response = await fetch(
          `${API_BASE_URL}/api/events/slug/${encodeURIComponent(slug)}`,
          {
            method: "GET",
            headers: {
              Accept: "application/json",
            },
            cache: "no-store",
          }
        );

        const data = await response.json().catch(() => ({}));

        if (!response.ok || !data.success || !data.event) {
          throw new Error(
            data.message ||
              "This bootcamp could not be found or is not published."
          );
        }

        const fetchedEvent = data.event;

        const typeValues = [
          fetchedEvent.type,
          fetchedEvent.category,
          fetchedEvent.customCategory,
        ]
          .filter(Boolean)
          .map((value) =>
            String(value).trim().toLowerCase()
          );

        if (!typeValues.includes("bootcamp")) {
          throw new Error(
            "The requested event is not a bootcamp."
          );
        }

        if (active) {
          setEvent(fetchedEvent);

          setRegistrationCount(
            Number(
              fetchedEvent.registrationCount ??
                fetchedEvent.registrationsCount ??
                0
            )
          );
        }
      } catch (error) {
        if (active) {
          setEvent(null);

          setLoadError(
            error.message ||
              "Unable to load this bootcamp. Please try again."
          );
        }
      } finally {
        if (active) setLoading(false);
      }
    };

    loadBootcamp();

    return () => {
      active = false;
    };
  }, [slug]);

  // --------------------------------------------------
  // EVENT DATA
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

  const startDate = event?.date || event?.startDate;

  const isOnline = ["online", "virtual"].includes(
    String(event?.mode || event?.eventFormat || "").toLowerCase()
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
      new Date(`${event.registrationDeadline}T23:59:59`) <
        new Date()
  );

  const isPast =
    String(event?.status || "").toLowerCase() === "past";

  const closed =
    deadlinePassed ||
    isPast ||
    ["closed", "archived"].includes(
      String(event?.status || "").toLowerCase()
    );

  const capacity = Number(event?.capacity || 0);

  const full =
    capacity > 0 && registrationCount >= capacity;

  const waitlistEnabled = Boolean(event?.waitlistEnabled);

  const externalLink = String(
    event?.registrationLink || ""
  ).trim();

  const platformRegistration =
    !externalLink && event?.onPlatformRegistration !== false;

  const poster = "";

  const outcomes = splitLines(
    event?.outcomes ||
      event?.learningOutcomes ||
      event?.highlights
  );

  const prerequisites = splitLines(event?.prerequisites);

  // --------------------------------------------------
  // UPDATE ANSWERS
  // --------------------------------------------------

  const updateAnswer = (id, value) => {
    setAnswers((current) => ({
      ...current,
      [id]: value,
    }));

    setSubmissionMessage("");
  };

  // --------------------------------------------------
  // SUBMIT REGISTRATION
  // --------------------------------------------------

  const submitRegistration = async (submitEvent) => {
    submitEvent.preventDefault();

    if (!event || submitting) return;

    if (closed) {
      setSubmissionMessage(
        "Registration for this bootcamp is closed."
      );
      return;
    }

    if (full && !waitlistEnabled) {
      setSubmissionMessage(
        "This bootcamp has reached its registration capacity."
      );
      return;
    }

    // Find email field dynamically.
    const emailField = fields.find(
      (field) =>
        field.type === "email" ||
        /e-?mail/i.test(field.label || "")
    );

    const emailValue = normalizeEmail(
      emailField ? answers[emailField.id] || "" : ""
    );

    // CORRECTED EMAIL VALIDATION.
    // Accepts college domains such as @rnsit.ac.in.

    if (!emailValue || !isValidEmail(emailValue)) {
      setSubmissionMessage(
        "Please enter a valid email address."
      );
      return;
    }

    // Find phone field dynamically.
    const phoneField = fields.find(
      (field) =>
        field.type === "tel" ||
        /mobile|phone|contact number|telephone/i.test(
          field.label || ""
        )
    );

    const phoneValue = phoneField
      ? String(answers[phoneField.id] || "").trim()
      : "";

    const normalizedPhone = normalizePhone(phoneValue);

    if (phoneField && !phoneValue) {
      setSubmissionMessage(
        "Please enter your mobile number."
      );
      return;
    }

    if (phoneValue && !isValidPhone(phoneValue)) {
      setSubmissionMessage(
        "Please enter a valid 10-digit Indian mobile number. You may include +91."
      );
      return;
    }

    // Find participant name dynamically.
    const nameField = fields.find(
      (field) =>
        /full name|participant name|^name$/i.test(
          field.label || ""
        )
    );

    const nameValue = String(
      nameField ? answers[nameField.id] || "" : ""
    ).trim();

    if (!nameValue) {
      setSubmissionMessage(
        "Please enter your full name."
      );
      return;
    }

    setSubmitting(true);
    setSubmissionMessage("");

    try {
      const response = await fetch(
        `${API_BASE_URL}/api/events/${encodeURIComponent(event.id)}/registrations`,
        {
          method: "POST",

          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
          },

          body: JSON.stringify({
            participantName: nameValue,
            email: emailValue,
            phone: normalizedPhone,
            mobile: normalizedPhone,
            answers,
          }),
        }
      );

      const data = await response.json().catch(() => ({}));

      if (!response.ok || !data.success) {
        throw new Error(
          data.message ||
            "We couldn't submit your registration. Please try again."
        );
      }

      const savedRegistration = data.registration || {};

      setRegistrationCount((count) => count + 1);

      setAnswers({});

      setSubmissionMessage(
        savedRegistration.status === "Waitlisted"
          ? "You're on the waitlist. Your registration has been recorded."
          : savedRegistration.status === "Pending"
            ? "Registration submitted! It is pending organizer approval."
            : "You're registered! Your registration has been recorded successfully."
      );

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
  // SHARE EVENT
  // --------------------------------------------------

  const share = async () => {
    try {
      if (navigator.share) {
        await navigator.share({
          title:
            event?.title ||
            event?.name ||
            "PRISM AI Bootcamp",
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
      <main className="bootcamp-public-page sp-state">
        <div className="sp-state-icon">
          <Sparkles size={28} />
        </div>

        <p className="sp-eyebrow">
          PRISM AI / BOOTCAMPS
        </p>

        <h1>Loading bootcamp…</h1>

        <p>Fetching the latest bootcamp details.</p>
      </main>
    );
  }

  // --------------------------------------------------
  // NOT FOUND STATE
  // --------------------------------------------------

  if (!event) {
    return (
      <main className="bootcamp-public-page sp-state">
        <div className="sp-state-icon">
          <Sparkles size={28} />
        </div>

        <p className="sp-eyebrow">
          PRISM AI / BOOTCAMPS
        </p>

        <h1>Bootcamp not found.</h1>

        <p>
          {loadError ||
            "This bootcamp may not be published yet, or the link may be incorrect."}
        </p>

        <button
          className="sp-button sp-button-primary"
          onClick={() => navigate("/events")}
        >
          <ArrowLeft size={17} />
          Explore events
        </button>
      </main>
    );
  }

  // --------------------------------------------------
  // MAIN UI
  // --------------------------------------------------

  return (
    <main className="bootcamp-public-page">

      <div className="sp-glow sp-glow-one" />
      <div className="sp-glow sp-glow-two" />

      {/* NAVIGATION */}

      <header className="sp-nav">

        <button
          className="sp-nav-back"
          onClick={() => navigate(-1)}
        >
          <ArrowLeft size={17} />
          Back
        </button>

        <button
          className="sp-brand"
          onClick={() => navigate("/")}
        >
          <span className="sp-brand-mark">
            <Sparkles size={16} />
          </span>
          PRISM<span>AI</span>
        </button>

        <button
          className="sp-nav-share"
          onClick={share}
        >
          <Share2 size={16} />
          {shareCopied ? "Copied" : "Share"}
        </button>

      </header>

      {/* HERO SECTION */}

      <section className="sp-hero">

        <div className="sp-hero-copy">

          <p className="sp-eyebrow">
            <span className="sp-live-dot" />
            PRISM AI <span>/</span> BOOTCAMP
          </p>

          <h1>
            {event.title || event.name || "Bootcamp"}
            <Sparkles
              className="sp-title-spark"
              size={24}
            />
          </h1>

          <p className="sp-tagline">
            {event.tagline ||
              event.caption ||
              "Learn deeply. Build confidently. Grow together."}
          </p>

          <div className="sp-tags">

            <span>
              <GraduationCap size={15} />
              Hands-on training
            </span>

            <span>
              <Sparkles size={14} />
              Skills through practice
            </span>

            <span className={closed ? "closed" : "open"}>
              <i />
              {closed
                ? "Registrations closed"
                : "Registration open"}
            </span>

          </div>

          <div className="sp-hero-actions">

            {externalLink && !closed && (
              <a
                className="sp-button sp-button-primary"
                href={externalLink}
                target="_blank"
                rel="noreferrer"
              >
                Register externally
                <ExternalLink size={17} />
              </a>
            )}

            {platformRegistration && !closed && (
              <button
                className="sp-button sp-button-primary"
                onClick={() =>
                  document
                    .getElementById("sp-registration")
                    ?.scrollIntoView({ behavior: "smooth" })
                }
              >
                Register for bootcamp
                <ArrowUpRight size={17} />
              </button>
            )}

            {closed && (
              <span className="sp-closed-pill">
                <X size={15} />
                Registration closed
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
              Explore bootcamp
              <ArrowUpRight size={17} />
            </button>

          </div>

        </div>

        {/* HERO ARTWORK */}

        <div className="sp-art-wrap">

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

                <small>LEARNING IN ACTION</small>

                <strong>Learn. Build. Apply.</strong>

                <span>PRISM AI · BOOTCAMPS</span>

              </div>
            )}

            <b>P / 01</b>

          </div>

          <div className="sp-float-chip sp-float-top">
            <Sparkles size={15} />
            Skills worth building
          </div>

          <div className="sp-float-chip sp-float-bottom">
            <CheckCircle2 size={16} />
            Practice that moves you forward
          </div>

        </div>

      </section>

      {/* EVENT FACTS */}

      <section className="sp-facts">

        <div>
          <span className="sp-fact-icon">
            <CalendarDays size={19} />
          </span>

          <section>
            <small>DATE</small>
            <strong>{formatDate(startDate)}</strong>
          </section>
        </div>

        <div>
          <span className="sp-fact-icon">
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
          <span className="sp-fact-icon">
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
          <span className="sp-fact-icon">
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

      {/* EVENT CONTENT */}

      <section className="sp-content" id="sp-about">

        <div className="sp-main-content">

          <div className="sp-section-title">
            <span>01</span>

            <div>
              <p className="sp-eyebrow">
                THE EXPERIENCE
              </p>

              <h2>
                A focused path from learning to doing.
              </h2>
            </div>
          </div>

          <p className="sp-description">
            {event.description ||
              "Get hands-on experience, explore practical concepts, and learn alongside a community of curious minds."}
          </p>

          {outcomes.length > 0 && (
            <div className="sp-outcomes">

              <h3>What you'll take away</h3>

              {outcomes.map((outcome, index) => (
                <div
                  className="sp-outcome"
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
            <div className="sp-prerequisites">

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
            <div className="sp-instructor">

              <span>
                <GraduationCap size={20} />
              </span>

              <div>
                <small>
                  INSTRUCTOR / FACILITATOR
                </small>

                <strong>{event.instructor}</strong>
              </div>

            </div>
          )}

        </div>

        {/* REGISTRATION CARD */}

        <aside
          className="sp-register-card"
          id="sp-registration"
        >

          <div className="sp-register-heading">
            <span>
              <Ticket size={21} />
            </span>

            <small>YOUR NEXT STEP</small>
          </div>

          <h2>
            Ready to
            <br />
            discover what’s next?
          </h2>

          <p>
            Complete the registration form to save your
            spot and join a community of curious minds.
          </p>

          <div className="sp-register-meta">

            <p>
              <CalendarDays size={16} />
              <span>
                Deadline
                <strong>
                  {formatDate(event.registrationDeadline)}
                </strong>
              </span>
            </p>

            <p>
              <Users size={16} />
              <span>
                {capacity
                  ? `${Math.max(0, capacity - registrationCount)} spots remaining`
                  : "Open to curious minds"}
              </span>
            </p>

            <p>
              <ClipboardList size={16} />
              <span>
                {fields.length} registration questions
              </span>
            </p>

          </div>

          {closed ? (
            <div className="sp-form-alert sp-alert-closed">
              <X size={17} />
              Registration for this bootcamp is closed.
            </div>
          ) : externalLink ? (
            <a
              className="sp-button sp-button-primary sp-full-button"
              href={externalLink}
              target="_blank"
              rel="noreferrer"
            >
              Continue to registration
              <ExternalLink size={16} />
            </a>
          ) : (

            <form
              className="sp-registration-form"
              onSubmit={submitRegistration}
              noValidate
            >

              {full && !waitlistEnabled && (
                <div className="sp-form-alert sp-alert-closed">
                  This bootcamp has reached capacity.
                </div>
              )}

              {full && waitlistEnabled && (
                <div className="sp-form-alert">
                  <Users size={17} />
                  Full capacity — submit to join the waitlist.
                </div>
              )}

              {event.requireApproval && (
                <div className="sp-form-alert">
                  <ShieldCheck size={17} />
                  Registrations require organizer approval.
                </div>
              )}

              {fields.length === 0 && (
                <div className="sp-form-alert">
                  The organizer has not configured registration
                  questions yet.
                </div>
              )}

              {/* DYNAMIC QUESTIONS */}

              {fields.map((field) => (
                <label
                  className="sp-form-field"
                  key={field.id}
                >

                  <span>
                    {field.label}
                    {field.required && <b> *</b>}
                  </span>

                  {field.helpText &&
                    field.type !== "checkbox" && (
                      <small>{field.helpText}</small>
                    )}

                  <QuestionInput
                    field={field}
                    value={answers[field.id]}
                    onChange={updateAnswer}
                  />

                </label>
              ))}

              {/* CONSENT */}

              {event.registrationConsent && (
                <p className="sp-consent-copy">
                  <ShieldCheck size={15} />
                  {event.registrationConsent}
                </p>
              )}

              {/* FEEDBACK */}

              {submissionMessage && (
                <div
                  className={`sp-form-alert ${
                    submissionMessage.startsWith("Already registered")
                      ? "sp-alert-duplicate"
                      : submissionMessage.includes("registered") ||
                          submissionMessage.includes("waitlist") ||
                          submissionMessage.includes("approval")
                        ? "sp-alert-success"
                        : "sp-alert-closed"
                  }`}
                  role="status"
                >
                  <CircleCheck size={17} />
                  {submissionMessage}
                </div>
              )}

              {/* SUBMIT */}

              <button
                className="sp-button sp-button-primary sp-full-button"
                type="submit"
                disabled={
                  submitting ||
                  fields.length === 0 ||
                  (full && !waitlistEnabled)
                }
              >
                {submitting
                  ? "Submitting…"
                  : full && waitlistEnabled
                    ? "Join the waitlist"
                    : "Submit registration"}

                <ArrowUpRight size={17} />
              </button>

              <small className="sp-privacy-note">
                Your answers are securely submitted to PRISM AI.
              </small>

            </form>
          )}

          {event.contactEmail && (
            <a
              className="sp-contact-link"
              href={`mailto:${event.contactEmail}`}
            >
              Questions? Contact the organizer
              <ArrowUpRight size={14} />
            </a>
          )}

        </aside>

      </section>

      {/* FOOTER */}

      <footer className="sp-footer">

        <button
          className="sp-footer-brand"
          onClick={() => navigate("/")}
        >
          <span className="sp-brand-mark">
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
