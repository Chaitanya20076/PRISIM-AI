
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
  Trophy,
} from "lucide-react";

import { getAuth } from "firebase/auth";
import "./Competitionpublic.css";

// --------------------------------------------------
// FIRESTORE-BACKED PUBLIC API
// --------------------------------------------------



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

const readApiError = async (response) => {
  let data = {};
  try {
    data = await response.json();
  } catch {
    // Keep a useful fallback if the server response is not JSON.
  }
  return new Error(
    data.message || `Request failed (${response.status}). Please try again.`
  );
};

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
// EMAIL VALIDATION
// --------------------------------------------------

const normalizeEmail = (value) =>
  String(value || "").trim().toLowerCase();

const isValidEmail = (value) => {
  const email = normalizeEmail(value);

  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email);
};

// --------------------------------------------------
// PHONE VALIDATION
// --------------------------------------------------

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
// DYNAMIC REGISTRATION INPUT
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

  const isEmailField =
    field.type === "email" ||
    /e-?mail/i.test(field.label || "");

  const isPhoneField =
    field.type === "tel" ||
    /mobile|phone|contact number|telephone/i.test(
      field.label || ""
    );

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
      <div className="cp-choice-list">
        {String(field.options || "")
          .split(",")
          .map((option) => option.trim())
          .filter(Boolean)
          .map((option) => (
            <label className="cp-choice" key={option}>
              <input
                type="radio"
                name={field.id}
                value={option}
                checked={value === option}
                required={Boolean(field.required)}
                onChange={() =>
                  onChange(field.id, option)
                }
              />
              <span>{option}</span>
            </label>
          ))}
      </div>
    );
  }

  if (field.type === "checkbox") {
    return (
      <label className="cp-consent">
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
      type={
        isEmailField
          ? "email"
          : types[field.type] || "text"
      }
      autoComplete={
        isEmailField
          ? "email"
          : isPhoneField
            ? "tel"
            : undefined
      }
      inputMode={
        isEmailField
          ? "email"
          : isPhoneField
            ? "tel"
            : undefined
      }
      min={field.type === "number" ? 0 : undefined}
    />
  );
}

// --------------------------------------------------
// MAIN COMPONENT
// --------------------------------------------------

export default function Competitionpublic() {
  const navigate = useNavigate();
  const { slug } = useParams();

  const [events, setEvents] = useState([]);
  const [eventLoading, setEventLoading] = useState(true);
  const [eventError, setEventError] = useState("");
  const [answers, setAnswers] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [submissionMessage, setSubmissionMessage] = useState("");
  const [shareCopied, setShareCopied] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [successHeading, setSuccessHeading] = useState("You're in!");
  const [successDescription, setSuccessDescription] = useState(
    "Your competition registration has been submitted successfully."
  );
  const registrationTab =
    new URLSearchParams(window.location.search).get("register") === "1";

  // --------------------------------------------------
  // LOAD PUBLISHED COMPETITIONS FROM FIRESTORE API
  // --------------------------------------------------

  useEffect(() => {
    let active = true;

    const loadEvents = async () => {
      setEventLoading(true);
      setEventError("");

      try {
        const response = await fetch(
          `${PUBLIC_EVENTS_ENDPOINT}?type=competition`,
          { headers: { Accept: "application/json" } }
        );

        if (!response.ok) {
          throw await readApiError(response);
        }

        const data = await response.json();
        const list = Array.isArray(data.events) ? data.events : [];

        if (active) {
          setEvents(list);
        }
      } catch (error) {
        if (active) {
          setEventError(
            error.message || "Unable to load this competition right now."
          );
          setEvents([]);
        }
      } finally {
        if (active) setEventLoading(false);
      }
    };

    loadEvents();

    return () => {
      active = false;
    };
  }, []);

  // --------------------------------------------------
  // FIND COMPETITION FROM FIRESTORE EVENTS
  // --------------------------------------------------

  const event = useMemo(() => {
    let decodedSlug = slug || "";

    try {
      decodedSlug = decodeURIComponent(decodedSlug);
    } catch {
      return null;
    }

    return events.find((item) => {
      const typeValues = [
        item.type,
        item.category,
        item.customCategory,
      ]
        .filter(Boolean)
        .map((value) => String(value).trim().toLowerCase());

      if (!typeValues.includes("competition")) {
        return false;
      }

      return (
        String(item.id || "") === decodedSlug ||
        String(item.slug || "") === decodedSlug ||
        slugify(item.title || item.name) === decodedSlug
      );
    }) || null;
  }, [events, slug]);

  // Fetch the selected competition's authoritative detail and registration count.
  useEffect(() => {
    let active = true;

    if (!slug) return undefined;

    const loadCompetitionDetails = async () => {
      try {
        const response = await fetch(
          `${PUBLIC_EVENTS_ENDPOINT}/slug/${encodeURIComponent(slug)}`,
          { headers: { Accept: "application/json" } }
        );

        if (!response.ok) {
          throw await readApiError(response);
        }

        const data = await response.json();

        if (active && data.event) {
          setEvents((current) => {
            const index = current.findIndex(
              (item) => String(item.id) === String(data.event.id)
            );

            if (index < 0) return [...current, data.event];

            const updated = [...current];
            updated[index] = { ...updated[index], ...data.event };
            return updated;
          });
        }
      } catch (error) {
        if (active) {
          setEventError(
            error.message || "Unable to load competition details."
          );
        }
      }
    };

    loadCompetitionDetails();

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

  const registrations = Array.isArray(event?.registrations)
    ? event.registrations
    : [];

  // Public event endpoints expose the count, not private registration records.
  const registrationCount = Number(
    event?.registrationCount ?? registrations.length
  );

  const startDate = event?.date || event?.startDate;

  const isOnline = ["online", "virtual"].includes(
    String(
      event?.mode || event?.eventFormat || ""
    ).toLowerCase()
  );

  const venue =
    event?.venue ||
    (isOnline
      ? "Online session"
      : "Venue to be announced");

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
  const rewardPoints = Math.max(
    0,
    Math.floor(Number(event?.rewardPoints) || 0)
  );

  const externalLink = String(
    event?.registrationLink || ""
  ).trim();

  const platformRegistration =
    !externalLink &&
    event?.onPlatformRegistration !== false;

  const poster = "";

  const outcomes = splitLines(
    event?.outcomes ||
      event?.learningOutcomes ||
      event?.highlights
  );

  const prerequisites = splitLines(event?.prerequisites);

  // --------------------------------------------------
  // PRIZES
  // --------------------------------------------------

  const competitionPrizes = event?.prizes || {};

  const prizeEntries = [
    {
      label: "1st place",
      value: competitionPrizes.first,
    },
    {
      label: "2nd place",
      value: competitionPrizes.second,
    },
    {
      label: "3rd place",
      value: competitionPrizes.third,
    },
  ].filter((prize) =>
    String(prize.value || "").trim()
  );

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
        "Registration for this competition is closed."
      );
      return;
    }

    if (full && !waitlistEnabled) {
      setSubmissionMessage(
        "This competition has reached its registration capacity."
      );
      return;
    }

    setSubmitting(true);
    setSubmissionMessage("");

    try {
      // --------------------------------------------------
      // EMAIL VALIDATION
      // --------------------------------------------------

      const emailField = fields.find(
        (field) =>
          field.type === "email" ||
          /e-?mail/i.test(field.label || "")
      );

      const rawEmail = emailField
        ? answers[emailField.id] || ""
        : "";

      const emailValue = normalizeEmail(rawEmail);

      if (emailField && !emailValue) {
        throw new Error("Please enter your email address.");
      }

      if (!emailValue || !isValidEmail(emailValue)) {
        throw new Error(
          "Please enter a valid email address, for example name@example.com."
        );
      }

      // --------------------------------------------------
      // PHONE VALIDATION
      // --------------------------------------------------

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
        throw new Error("Please enter your mobile number.");
      }

      if (phoneValue && !isValidPhone(phoneValue)) {
        throw new Error(
          "Please enter a valid 10-digit Indian mobile number starting with 6, 7, 8 or 9. You may include +91."
        );
      }

      // --------------------------------------------------
      // PARTICIPANT NAME
      // --------------------------------------------------

      const nameField = fields.find(
        (field) =>
          /full name|participant name|^name$/i.test(
            field.label || ""
          )
      );

      const participantName = nameField
        ? String(answers[nameField.id] || "").trim()
        : "";

      if (!participantName) {
        throw new Error(
          "Please complete the participant name field."
        );
      }

      // The backend validates identity, capacity, duplicates,
      // deadlines and required dynamic fields in a Firestore transaction.
      const response = await fetch(
        `${PUBLIC_EVENTS_ENDPOINT}/${encodeURIComponent(event.id)}/registrations`,
        {
          method: "POST",
          headers: { ...(await getMemberAuthHeaders()),
          
            "Content-Type": "application/json",
            Accept: "application/json",
          },
          body: JSON.stringify({
            participantName,
            email: emailValue,
            phone: normalizedPhone,
            mobile: normalizedPhone,
            answers: { ...answers },
          }),
        }
      );

      if (!response.ok) {
        throw await readApiError(response);
      }

      const data = await response.json();

      setAnswers({});

      const registrationStatus = String(
        data.registration?.status || ""
      ).toLowerCase();

      const successCopy =
        registrationStatus === "waitlisted"
          ? {
              heading: "You're on the list!",
              description:
                "Your waitlist request has been submitted. The PRISM AI team will contact you if a place becomes available."
            }
          : registrationStatus === "pending"
            ? {
                heading: "Submission received!",
                description:
                  "Your registration is awaiting organizer approval. We'll let you know once it has been reviewed."
              }
            : {
                heading: "You're in!",
                description:
                  "Your competition registration has been confirmed. Bring your ideas, give it your best and make an impact!"
              };

      setSuccessHeading(successCopy.heading);
      setSuccessDescription(successCopy.description);
      setShowSuccess(true);

      setSubmissionMessage(
        data.registration?.status === "Waitlisted"
          ? "You're on the waitlist. Your registration has been recorded."
          : data.registration?.status === "Pending"
            ? "Registration submitted! It is pending organizer approval."
            : "You're registered! Your registration has been recorded successfully."
      );

      // Refresh authoritative registration count from Firestore.
      const detailResponse = await fetch(
        `${PUBLIC_EVENTS_ENDPOINT}/slug/${encodeURIComponent(slug || event.slug || event.id)}`,
        { headers: { Accept: "application/json" } }
      );

      if (detailResponse.ok) {
        const detailData = await detailResponse.json();
        if (detailData.event) {
          setEvents((current) =>
            current.map((item) =>
              String(item.id) === String(detailData.event.id)
                ? { ...item, ...detailData.event }
                : item
            )
          );
        }
      }
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
  // SHARE
  // --------------------------------------------------

  const share = async () => {
    try {
      if (navigator.share) {
        await navigator.share({
          title:
            event?.title ||
            event?.name ||
            "PRISM AI Competition",

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
  // NOT FOUND
  // --------------------------------------------------

  if (eventLoading || (!event && !eventError)) {
    return (
      <main className="competition-public-page cp-state">
        <div className="cp-state-icon"><Sparkles size={28} /></div>
        <p className="cp-eyebrow">PRISM AI / COMPETITIONS</p>
        <h1>Loading competition…</h1>
        <p>Please wait while we fetch the published competition details.</p>
      </main>
    );
  }

  if (!event) {
    return (
      <main className="competition-public-page cp-state">

        <div className="cp-state-icon">
          <Sparkles size={28} />
        </div>

        <p className="cp-eyebrow">
          PRISM AI / COMPETITIONS
        </p>

        <h1>{eventError ? "Unable to load competition." : "Competition not found."}</h1>

        <p>
          {eventError ||
            "This competition may not be published yet, or the link may be incorrect."}
        </p>

        <button
          className="cp-button cp-button-primary"
          onClick={() => navigate("/events")}
        >
          <ArrowLeft size={17} />
          Explore events
        </button>

      </main>
    );
  }

  // --------------------------------------------------
  // DEDICATED REGISTRATION TAB
  // --------------------------------------------------

  if (registrationTab) {
    return (
      <main className="competition-public-page cp-registration-page">
        <div className="cp-registration-shell">
          <header className="cp-registration-nav">
            <button
              type="button"
              className="cp-nav-back"
              onClick={() => window.close()}
            >
              <ArrowLeft size={17} />
              Back to competition
            </button>

            <button className="cp-brand" type="button" onClick={() => navigate("/")}>
              <span className="cp-brand-mark"><Sparkles size={16} /></span>
              PRISM<span>AI</span>
            </button>

            <span className="cp-registration-nav-label">COMPETITION REGISTRATION</span>
          </header>

          <div className="cp-registration-layout">
            <section className="cp-registration-intro">
              <p className="cp-eyebrow">
                <span className="cp-live-dot" />
                PRISM AI <span>/</span> COMPETITION REGISTRATION
              </p>

              <h1 className="cp-rollout-heading">
                Bring your
                <span className="cp-rollout-window" aria-label="best ideas, bold innovations, big wins">
                  <span className="cp-rollout-track">
                    <em>best ideas.</em>
                    <em>bold innovations.</em>
                    <em>big wins.</em>
                    <em>best ideas.</em>
                  </span>
                </span>
              </h1>

              <p className="cp-registration-lead">
                You're one step away from entering{" "}
                <strong>{event.title || event.name || "this competition"}</strong>.
                Complete the details to secure your entry.
              </p>

              <div className="cp-registration-summary">
                <div>
                  <small>COMPETITION</small>
                  <strong>{event.title || event.name}</strong>
                </div>
                <div>
                  <small>DATE</small>
                  <strong>{formatDate(startDate)}</strong>
                </div>
                <div>
                  <small>ENTRY FEE</small>
                  <strong>{fee}</strong>
                </div>
                {rewardPoints > 0 && (
                  <div className="cp-registration-points">
                    <small>REGISTRATION REWARD</small>
                    <strong><Sparkles size={15} /> {rewardPoints.toLocaleString("en-IN")} PRISM Points</strong>
                  </div>
                )}
              </div>

              <p className="cp-registration-note">Explore. Innovate. Impact.</p>
            </section>

            <section className="cp-registration-card">
              <div className="cp-registration-card-heading">
                <span className="cp-registration-step">STEP 01 / YOUR DETAILS</span>
                <h2>Competition registration</h2>
                <p>Fields marked <b>*</b> are required.</p>
              </div>

              {closed ? (
                <div className="cp-form-alert cp-alert-closed">
                  <X size={17} />
                  Registration for this competition is closed.
                </div>
              ) : externalLink ? (
                <a
                  className="cp-button cp-button-primary cp-full-button"
                  href={externalLink}
                  target="_blank"
                  rel="noreferrer"
                >
                  Continue to registration <ExternalLink size={16} />
                </a>
              ) : (
                <form className="cp-registration-form cp-registration-tab-form" onSubmit={submitRegistration}>
                  {full && !waitlistEnabled && (
                    <div className="cp-form-alert cp-alert-closed">
                      This competition has reached capacity.
                    </div>
                  )}

                  {full && waitlistEnabled && (
                    <div className="cp-form-alert">
                      <Users size={17} />
                      Full capacity — submit to join the waitlist.
                    </div>
                  )}

                  {event.requireApproval && (
                    <div className="cp-form-alert">
                      <ShieldCheck size={17} />
                      Registrations require organizer approval.
                    </div>
                  )}

                  {fields.length === 0 && (
                    <div className="cp-form-alert">
                      The organizer has not configured registration questions yet.
                    </div>
                  )}

                  {fields.map((field) => (
                    <label className="cp-form-field" key={field.id}>
                      <span>{field.label}{field.required && <b> *</b>}</span>
                      {field.helpText && field.type !== "checkbox" && (
                        <small>{field.helpText}</small>
                      )}
                      <QuestionInput
                        field={field}
                        value={answers[field.id]}
                        onChange={updateAnswer}
                      />
                    </label>
                  ))}

                  {event.registrationConsent && (
                    <p className="cp-consent-copy">
                      <ShieldCheck size={15} />
                      {event.registrationConsent}
                    </p>
                  )}

                  {submissionMessage && (
                    <div
                      className={`cp-form-alert ${
                        submissionMessage.startsWith("Already registered")
                          ? "cp-alert-duplicate"
                          : submissionMessage.includes("registered") ||
                              submissionMessage.includes("waitlist") ||
                              submissionMessage.includes("approval")
                            ? "cp-alert-success"
                            : "cp-alert-closed"
                      }`}
                      role="status"
                    >
                      <CircleCheck size={17} />
                      {submissionMessage}
                    </div>
                  )}

                  <button
                    className="cp-button cp-button-primary cp-full-button"
                    type="submit"
                    disabled={submitting || fields.length === 0 || (full && !waitlistEnabled)}
                  >
                    {submitting
                      ? "Submitting…"
                      : full && waitlistEnabled
                        ? "Join the waitlist"
                        : "Submit registration"}
                    <ArrowUpRight size={17} />
                  </button>

                  <small className="cp-privacy-note">
                    Your answers are saved with this competition registration.
                  </small>
                </form>
              )}

              {event.contactEmail && (
                <a className="cp-contact-link" href={`mailto:${event.contactEmail}`}>
                  Questions? Contact the organizer <ArrowUpRight size={14} />
                </a>
              )}
            </section>
          </div>
        </div>

        {showSuccess && (
          <div className="cp-success-overlay" role="dialog" aria-modal="true" aria-labelledby="cp-success-title">
            <div className="cp-confetti" aria-hidden="true">
              {Array.from({ length: 54 }, (_, index) => (
                <i
                  key={index}
                  style={{
                    "--x": `${(index * 37) % 100}%`,
                    "--delay": `${(index % 11) * 0.12}s`,
                    "--duration": `${3.2 + (index % 5) * 0.38}s`,
                    "--drift": `${((index * 19) % 190) - 95}px`
                  }}
                />
              ))}
            </div>

            <section className="cp-success-card">
              <span className="cp-success-icon"><CheckCircle2 size={36} /></span>
              <small>PRISM AI / COMPETITION REGISTRATION</small>
              <h2 id="cp-success-title">{successHeading}</h2>
              <p>{successDescription}</p>

              {rewardPoints > 0 && (
                <div className="cp-success-points">
                  <Sparkles size={17} />
                  <strong>{rewardPoints.toLocaleString("en-IN")} PRISM Points</strong>
                  <span>Registration reward</span>
                </div>
              )}

              <button type="button" onClick={() => setShowSuccess(false)}>
                Awesome <ArrowUpRight size={16} />
              </button>
            </section>
          </div>
        )}
      </main>
    );
  }

  // --------------------------------------------------
  // MAIN UI
  // --------------------------------------------------

  return (
    <main className="competition-public-page">

      <div className="cp-glow cp-glow-one" />
      <div className="cp-glow cp-glow-two" />

      {/* NAVIGATION */}

      <header className="cp-nav">

        <button
          className="cp-nav-back"
          onClick={() => navigate(-1)}
        >
          <ArrowLeft size={17} />
          Back
        </button>

        <button
          className="cp-brand"
          onClick={() => navigate("/")}
        >
          <span className="cp-brand-mark">
            <Sparkles size={16} />
          </span>
          PRISM<span>AI</span>
        </button>

        <button
          className="cp-nav-share"
          onClick={share}
        >
          <Share2 size={16} />
          {shareCopied ? "Copied" : "Share"}
        </button>

      </header>

      {/* HERO */}

      <section className="cp-hero">

        <div className="cp-hero-copy">

          <p className="cp-eyebrow">
            <span className="cp-live-dot" />
            PRISM AI <span>/</span> COMPETITION
          </p>

          <h1>
            {event.title || event.name || "Competition"}

            <Sparkles
              className="cp-title-spark"
              size={24}
            />
          </h1>

          <p className="cp-tagline">
            {event.tagline ||
              event.caption ||
              "Bring your ideas. Compete. Make an impact."}
          </p>

          <div className="cp-tags">

            <span>
              <Trophy size={15} />
              {event.competitionCategory || "Competition"}
            </span>

            <span>
              <Users size={14} />
              {event.participationType ||
                "Participation details"}
            </span>

            <span className={closed ? "closed" : "open"}>
              <i />
              {closed
                ? "Registrations closed"
                : "Registration open"}
            </span>

          </div>

          <div className="cp-hero-actions">

            {externalLink && !closed && (
              <a
                className="cp-button cp-button-primary"
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
                className="cp-button cp-button-primary"
                onClick={() =>
                  window.open(
                    `${window.location.pathname}?register=1`,
                    "_blank",
                    "noopener,noreferrer"
                  )
                }
              >
                Register for competition
                <ArrowUpRight size={17} />
              </button>
            )}

            {closed && (
              <span className="cp-closed-pill">
                <X size={15} />
                Registration closed
              </span>
            )}

            <button
              className="cp-button cp-button-secondary"
              onClick={() =>
                document
                  .getElementById("cp-about")
                  ?.scrollIntoView({
                    behavior: "smooth",
                  })
              }
            >
              Explore competition
              <ArrowUpRight size={17} />
            </button>

          </div>

        </div>

        {/* HERO ARTWORK */}

        <div className="cp-art-wrap">

          <div className="cp-orbit cp-orbit-one" />
          <div className="cp-orbit cp-orbit-two" />

          <div className="cp-art-card">

            {poster ? (
              <img
                src={poster}
                alt={`${event.title || event.name} poster`}
              />
            ) : (
              <div className="cp-art-placeholder">

                <div className="cp-art-grid" />

                <div className="cp-art-icon">
                  <Sparkles size={42} />
                </div>

                <small>IDEAS IN COMPETITION</small>

                <strong>Compete. Create. Win.</strong>

                <span>PRISM AI · COMPETITIONS</span>

              </div>
            )}

            <b>P / 01</b>

          </div>

          <div className="cp-float-chip cp-float-top">
            <Sparkles size={15} />
            Made to explore
          </div>

          <div className="cp-float-chip cp-float-bottom">
            <CheckCircle2 size={16} />
            Skills that stick
          </div>

        </div>

      </section>

      {/* EVENT FACTS */}

      <section className="cp-facts">

        <div>
          <span className="cp-fact-icon">
            <CalendarDays size={19} />
          </span>

          <section>
            <small>DATE</small>
            <strong>{formatDate(startDate)}</strong>
          </section>
        </div>

        <div>
          <span className="cp-fact-icon">
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
          <span className="cp-fact-icon">
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
          <span className="cp-fact-icon">
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

      {/* MAIN CONTENT */}

      <section className="cp-content" id="cp-about">

        <div className="cp-main-content">

          <div className="cp-section-title">

            <span>01</span>

            <div>
              <p className="cp-eyebrow">
                THE EXPERIENCE
              </p>

              <h2>Where ideas compete.</h2>
            </div>

          </div>

          <p className="cp-description">
            {event.description ||
              "Get hands-on experience, explore practical concepts, and learn alongside a community of competitors."}
          </p>

          {/* HIGHLIGHTS */}

          {outcomes.length > 0 && (
            <div className="cp-outcomes">

              <h3>Competition highlights</h3>

              {outcomes.map((outcome, index) => (
                <div
                  className="cp-outcome"
                  key={`${outcome}-${index}`}
                >
                  <CheckCircle2 size={17} />
                  <span>{outcome}</span>
                  <ArrowUpRight size={15} />
                </div>
              ))}

            </div>
          )}

          {/* COMPETITION DETAILS */}

          {(
            event.rounds ||
            event.rules ||
            event.judgingCriteria ||
            event.prizePool ||
            prizeEntries.length > 0
          ) && (
            <section className="cp-competition-details">

              <h3>Competition details</h3>

              {event.participationType && (
                <p>
                  <strong>Participation:</strong>{" "}
                  {event.participationType}

                  {event.participationType !== "Individual" &&
                    event.minTeamSize &&
                    event.maxTeamSize &&
                    ` · Teams of ${event.minTeamSize}–${event.maxTeamSize}`}
                </p>
              )}

              {event.rounds && (
                <div>
                  <strong>Rounds / stages</strong>
                  <p>{event.rounds}</p>
                </div>
              )}

              {event.rules && (
                <div>
                  <strong>Rules &amp; eligibility</strong>
                  <p>{event.rules}</p>
                </div>
              )}

              {event.judgingCriteria && (
                <div>
                  <strong>Judging criteria</strong>
                  <p>{event.judgingCriteria}</p>
                </div>
              )}

              {(event.prizePool || prizeEntries.length > 0) && (
                <div className="cp-prizes">

                  <strong>Prizes &amp; rewards</strong>

                  {event.prizePool && (
                    <p>
                      Total prize pool: ₹{event.prizePool}
                    </p>
                  )}

                  {prizeEntries.map((prize) => (
                    <p key={prize.label}>
                      <b>{prize.label}:</b> {prize.value}
                    </p>
                  ))}

                </div>
              )}

              {event.submissionLink && (
                <a
                  className="cp-contact-link"
                  href={event.submissionLink}
                  target="_blank"
                  rel="noreferrer"
                >
                  Submission details
                  <ArrowUpRight size={14} />
                </a>
              )}

            </section>
          )}

          {/* PREREQUISITES */}

          {prerequisites.length > 0 && (
            <div className="cp-prerequisites">

              <h3>Before you join</h3>

              {prerequisites.map((item, index) => (
                <p key={`${item}-${index}`}>
                  <i />
                  {item}
                </p>
              ))}

            </div>
          )}

          {/* INSTRUCTOR */}

          {event.instructor && (
            <div className="cp-instructor">

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
          className="cp-register-card"
          id="cp-registration"
        >

          <div className="cp-register-heading">

            <span>
              <Ticket size={21} />
            </span>

            <small>YOUR NEXT STEP</small>

          </div>

          <h2>
            Ready to
            <br />
            compete?
          </h2>

          <p>
            Complete the registration form to enter
            the competition and receive event updates.
          </p>

          <div className="cp-register-meta">

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
                  ? `${Math.max(
                      0,
                      capacity - registrationCount
                    )} spots remaining`
                  : "Open to competitors"}
              </span>
            </p>

            <p>
              <ClipboardList size={16} />

              <span>
                {fields.length} registration questions
              </span>
            </p>

            {rewardPoints > 0 && (
              <p className="cp-reward-meta">
                <Sparkles size={16} />
                <span>
                  Registration reward
                  <strong>{rewardPoints.toLocaleString("en-IN")} PRISM Points</strong>
                </span>
              </p>
            )}

          </div>

          {closed ? (
            <div className="cp-form-alert cp-alert-closed">
              <X size={17} />
              Registration for this competition is closed.
            </div>
          ) : externalLink ? (
            <a
              className="cp-button cp-button-primary cp-full-button"
              href={externalLink}
              target="_blank"
              rel="noreferrer"
            >
              Continue to registration
              <ExternalLink size={16} />
            </a>
          ) : (
            <button
              className="cp-button cp-button-primary cp-full-button"
              type="button"
              disabled={full && !waitlistEnabled}
              onClick={() =>
                window.open(
                  `${window.location.pathname}?register=1`,
                  "_blank",
                  "noopener,noreferrer"
                )
              }
            >
              {full && waitlistEnabled ? "Open waitlist form" : "Open registration form"}
              <ArrowUpRight size={17} />
            </button>
          )}

          {event.contactEmail && (
            <a
              className="cp-contact-link"
              href={`mailto:${event.contactEmail}`}
            >
              Questions? Contact the organizer
              <ArrowUpRight size={14} />
            </a>
          )}

        </aside>

      </section>

      {/* FOOTER */}

      <footer className="cp-footer">

        <button
          className="cp-footer-brand"
          onClick={() => navigate("/")}
        >
          <span className="cp-brand-mark">
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
