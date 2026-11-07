import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  ArrowLeft, ArrowRight, BriefcaseBusiness, CalendarDays, CheckCircle2,
  ChevronRight, Clock3, FileText, Moon, Search, Send, Sun, Users, X,
} from "lucide-react";
import "./RecruitmentPortal.css";

const DRIVE_KEY = "prism-recruitment-drives-v1";
const APPLICANTS_KEY = "prism-recruitment-applicants-v1";
const RESULTS_KEY = "prism-recruitment-results-v1";
const THEME_KEY = "prism-theme";

const readArray = (key) => {
  try {
    const value = JSON.parse(localStorage.getItem(key) || "[]");
    return Array.isArray(value) ? value : [];
  } catch {
    return [];
  }
};

const makeId = () => globalThis.crypto?.randomUUID?.() || `app-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
const formatDate = (value) => {
  if (!value) return "Not specified";
  const date = new Date(`${value}T00:00:00`);
  return Number.isNaN(date.getTime()) ? value : date.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
};
const getTheme = () => {
  try {
    const saved = localStorage.getItem(THEME_KEY);
    if (saved === "dark" || saved === "light") return saved;
  } catch { /* Fall back to the document theme. */ }
  const current = document.documentElement.dataset.theme;
  return current === "dark" || current === "light" ? current : "light";
};

const applyTheme = (theme) => {
  document.documentElement.dataset.theme = theme;
  document.documentElement.style.colorScheme = theme;
  try { localStorage.setItem(THEME_KEY, theme); } catch { /* Current-page theme still applies. */ }
  window.dispatchEvent(new CustomEvent("prism-theme-change", { detail: { theme } }));
};

function Field({ question, value, onChange }) {
  const common = {
    id: question.id,
    name: question.id,
    required: Boolean(question.required),
    value: value ?? "",
    onChange: (event) => onChange(question.id, event.target.value),
  };
  const options = String(question.options || "").split("\n").map((item) => item.trim()).filter(Boolean);
  if (question.type === "textarea") return <textarea {...common} rows={4} placeholder="Write your answer here…" />;
  if (question.type === "select") return <select {...common}><option value="">Select an option</option>{options.map((option) => <option key={option} value={option}>{option}</option>)}</select>;
  if (question.type === "radio") return <div className="rp-choice-list">{options.map((option) => <label className="rp-choice" key={option}><input type="radio" name={question.id} required={Boolean(question.required)} value={option} checked={value === option} onChange={() => onChange(question.id, option)} /><span>{option}</span></label>)}</div>;
  if (question.type === "checkbox") return <div className="rp-choice-list">{options.map((option) => { const selected = Array.isArray(value) ? value : []; return <label className="rp-choice" key={option}><input type="checkbox" checked={selected.includes(option)} onChange={(event) => onChange(question.id, event.target.checked ? [...selected, option] : selected.filter((item) => item !== option))} /><span>{option}</span></label>; })}</div>;
  const inputType = ["text", "email", "tel", "number", "date", "url"].includes(question.type) ? question.type : "text";
  return <input {...common} type={inputType} placeholder={inputType === "email" ? "you@example.com" : inputType === "tel" ? "Your phone number" : "Type your answer…"} />;
}

export default function RecruitmentPortal({ onBack, embedded = false }) {
  const [drives, setDrives] = useState(() => readArray(DRIVE_KEY).filter((drive) => drive.status === "published"));
  const [publishedResults, setPublishedResults] = useState(() => readArray(RESULTS_KEY).filter((result) => result.published));
  const [selectedDriveId, setSelectedDriveId] = useState(null);
  const [selectedResultId, setSelectedResultId] = useState(null);
  const [portalView, setPortalView] = useState("home");
  const [search, setSearch] = useState("");
  const [answers, setAnswers] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [notice, setNotice] = useState(null);
  const [isDark, setIsDark] = useState(() => getTheme() === "dark");

  useEffect(() => {
    const syncTheme = (event) => {
      const incoming = event?.detail?.theme;
      const next = incoming === "dark" || incoming === "light" ? incoming : getTheme();
      setIsDark(next === "dark");
    };
    const onStorageTheme = (event) => {
      if (!event || event.key === THEME_KEY) syncTheme();
    };
    window.addEventListener("storage", onStorageTheme);
    window.addEventListener("prism-theme-change", syncTheme);
    const observer = new MutationObserver(() => syncTheme());
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });

    const refreshDrives = () => setDrives(readArray(DRIVE_KEY).filter((drive) => drive.status === "published"));
    const refreshResults = () => setPublishedResults(readArray(RESULTS_KEY).filter((result) => result.published));
    const onStorage = (event) => {
      if (!event || event.key === DRIVE_KEY) refreshDrives();
      if (!event || event.key === RESULTS_KEY) refreshResults();
    };
    window.addEventListener("storage", onStorage);
    window.addEventListener("prism-recruitment-updated", refreshDrives);
    window.addEventListener("prism-recruitment-results-updated", refreshResults);
    return () => {
      window.removeEventListener("storage", onStorage);
      window.removeEventListener("storage", onStorageTheme);
      window.removeEventListener("prism-theme-change", syncTheme);
      observer.disconnect();
      window.removeEventListener("prism-recruitment-updated", refreshDrives);
      window.removeEventListener("prism-recruitment-results-updated", refreshResults);
    };
  }, []);

  const toggleTheme = () => {
    const next = getTheme() === "dark" ? "light" : "dark";
    applyTheme(next);
    setIsDark(next === "dark");
  };

  const filteredDrives = useMemo(() => drives.filter((drive) => `${drive.roleName || ""} ${drive.title || ""} ${drive.subtitle || ""}`.toLowerCase().includes(search.toLowerCase())), [drives, search]);
  const selectedDrive = drives.find((drive) => drive.id === selectedDriveId) || null;
  const allQuestions = (selectedDrive?.sections || []).flatMap((section) => section.questions || []);

  const openDrive = (drive) => {
    setSelectedDriveId(drive.id);
    setAnswers({});
    setNotice(null);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const submitApplication = (event) => {
    event.preventDefault();
    if (!selectedDrive) return;
    setSubmitting(true);
    try {
      const applicants = readArray(APPLICANTS_KEY);
      const emailQuestion = allQuestions.find((question) => question.type === "email" || /email/i.test(question.label || ""));
      const nameQuestion = allQuestions.find((question) => /full name|your name|name/i.test(question.label || ""));
      const phoneQuestion = allQuestions.find((question) => question.type === "tel" || /phone|mobile/i.test(question.label || ""));
      const email = String((emailQuestion && answers[emailQuestion.id]) || "").trim().toLowerCase();
      if (email && applicants.some((item) => item.driveId === selectedDrive.id && String(item.email || "").toLowerCase() === email)) {
        setNotice({ type: "error", title: "Application already received", message: "An application with this email address already exists for this recruitment." });
        return;
      }
      const application = {
        id: makeId(),
        driveId: selectedDrive.id,
        driveRole: selectedDrive.roleName,
        name: String((nameQuestion && answers[nameQuestion.id]) || "Applicant").trim(),
        email,
        phone: String((phoneQuestion && answers[phoneQuestion.id]) || "").trim(),
        answers,
        status: "Applied",
        createdAt: new Date().toISOString(),
      };
      localStorage.setItem(APPLICANTS_KEY, JSON.stringify([application, ...applicants]));
      window.dispatchEvent(new CustomEvent("prism-recruitment-updated", { detail: { type: "application-submitted", application } }));
      setNotice({ type: "success", title: "Application submitted!", message: "Thanks for your interest in PRISM AI. Your application has been recorded on this browser. Backend submission will be connected later." });
      setAnswers({});
    } catch {
      setNotice({ type: "error", title: "Could not submit", message: "Your browser could not save this application. Please check available storage and try again." });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <main className={`recruitment-portal${embedded ? " rp-embedded" : ""}`}>
      <header className="rp-header">
        <Link className="rp-brand" to="/" aria-label="PRISM AI home">
          <img
            className="rp-brand-logo"
            src={isDark ? "/images/prism-logo-dark.png" : "/images/prism-logo-light.png"}
            alt="PRISM AI"
          />
        </Link>
        <nav className="rp-nav" aria-label="Main navigation">
          <Link to="/"></Link>
          <a href="#opportunities"></a>
        </nav>
        <div className="rp-header-actions">
          <Link to="/dashboard" className="rp-dashboard-button"><ArrowLeft size={15} /><span>Back to Dashboard</span></Link>
          <button type="button" className="rp-theme-button" onClick={toggleTheme} aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"} title={isDark ? "Switch to light mode" : "Switch to dark mode"}>{isDark ? <Sun size={17} /> : <Moon size={17} />}<span>{isDark ? "Light mode" : "Dark mode"}</span></button>
        </div>
      </header>
      <div className="rp-shell">

        {!selectedDrive ? <>
          {portalView === "home" ? (
            <section className="rp-portal-choice">
              <span className="rp-kicker">PRISM AI · OPPORTUNITIES</span>
              <h1>Find your place.<br /><em>Shape what's next.</em></h1>
              <p>Explore opportunities to contribute, learn, and grow with the PRISM AI community.</p>
              <div className="rp-choice-grid">
                <button type="button" className="rp-choice-card rp-choice-apply" onClick={() => { setPortalView("opportunities"); window.location.hash = "opportunities"; window.scrollTo({ top: 0, behavior: "smooth" }); }}>
                  <span className="rp-choice-icon"><BriefcaseBusiness size={25} /></span>
                  <span className="rp-choice-label">OPPORTUNITIES</span>
                  <strong>Apply for roles<span>.</span></strong>
                  <span className="rp-choice-description">Explore open recruitment drives, review role details, and submit your application.</span>
                  <span className="rp-choice-action">Explore open roles <ArrowRight size={17} /></span>
                </button>
                <button type="button" className="rp-choice-card rp-choice-results" onClick={() => { setPortalView("results"); window.scrollTo({ top: 0, behavior: "smooth" }); }}>
                  <span className="rp-choice-icon"><CheckCircle2 size={25} /></span>
                  <span className="rp-choice-label">RECRUITMENT UPDATES</span>
                  <strong>Results<span>.</span></strong>
                  <span className="rp-choice-description">Check published recruitment outcomes and selection updates from PRISM AI.</span>
                  <span className="rp-choice-action">View results <ArrowRight size={17} /></span>
                  {publishedResults.length === 0 && <span className="rp-coming-soon">AWAITING PUBLICATION</span>}
                </button>
              </div>
            </section>
          ) : (portalView === "results" || portalView === "result-detail") ? (
            <section className="rp-results-page">
              {portalView !== "result-detail" && <button type="button" className="rp-back-link" onClick={() => setPortalView("home")}><ArrowLeft size={16} /> Recruitment options</button>}
              <div className="rp-results-heading">
                <span className="rp-results-icon"><CheckCircle2 size={27} /></span>
                <span className="rp-kicker">RECRUITMENT UPDATES</span>
                <h1>Published results<span>.</span></h1>
                <p>Official selection updates released by the PRISM AI recruitment team.</p>
              </div>
              {portalView === "result-detail" ? (() => {
                const result = publishedResults.find((item) => item.driveId === selectedResultId);
                if (!result) return <div className="rp-results-empty"><h2>Result not found</h2><p>This result may have been unpublished.</p></div>;
                const theme = result.theme || "prism";
                return <article className={`rp-result-detail rp-theme-${theme}`}>
                  <button type="button" className="rp-back-link" onClick={() => setPortalView("results")}><ArrowLeft size={16}/> All results</button>
                  <div className="rp-result-detail-banner"><span className="rp-role-kicker">PRISM AI · RECRUITMENT UPDATE</span><h2>{result.header || result.roleName || "Recruitment results"}</h2><p>{result.description || ""}</p></div>
                  {result.disclosure?.showPublishedDate !== false && <p className="rp-result-detail-date">Published {formatDate((result.publishedAt || "").slice(0,10))}</p>}
                  <div className="rp-result-detail-list"><h3>Candidate updates</h3>
                    {(result.selectedApplicants || []).filter(candidate => ["Shortlisted","Selected"].includes(candidate.status)).map((candidate,index) => <article className="rp-result-detail-person" key={candidate.id || index}>
                      <div className="rp-result-person-top">
                        {result.disclosure?.showName !== false && <strong>{candidate.name || "Candidate"}</strong>}
                        {result.disclosure?.showStatus !== false && <span className={`rp-status-pill rp-status-${String(candidate.status || "").toLowerCase()}`}>{candidate.status}</span>}
                      </div>
                      {result.disclosure?.showEmail && candidate.email && <p>Email: {candidate.email}</p>}
                      {result.disclosure?.showPhone && candidate.phone && <p>Phone: {candidate.phone}</p>}
                      {(result.questions || [])
                        .filter((question) => (result.disclosure?.questionIds || []).includes(question.id))
                        .map((question) => {
                          const answer = candidate.answers?.[question.id];
                          const hasAnswer = answer !== undefined && answer !== null && answer !== "" && !(Array.isArray(answer) && answer.length === 0);
                          if (!hasAnswer) return null;
                          const displayAnswer = Array.isArray(answer) ? answer.join(", ") : String(answer);
                          return (
                            <div className="rp-result-answer" key={question.id}>
                              <span>{question.label || "Application answer"}</span>
                              <p>{displayAnswer}</p>
                            </div>
                          );
                        })}
                    </article>)}
                    {!(result.selectedApplicants || []).some(candidate => ["Shortlisted","Selected"].includes(candidate.status)) && <p>No candidate updates are available yet.</p>}
                  </div>
                </article>;
              })() : publishedResults.length === 0 ? (
                <div className="rp-results-empty">
                  <span className="rp-empty-icon"><Clock3 size={25} /></span>
                  <h2>No results published yet.</h2>
                  <p>Once PRISM AI publishes recruitment results, announcements will appear here.</p>
                </div>
              ) : (
                <div className="rp-results-list">
                  {publishedResults.slice().sort((a, b) => new Date(b.publishedAt || 0) - new Date(a.publishedAt || 0)).map((result) => (
                    <button type="button" className={`rp-result-card rp-theme-${result.theme || "prism"}`} key={result.driveId} onClick={() => { setSelectedResultId(result.driveId); setPortalView("result-detail"); window.scrollTo({top:0,behavior:"smooth"}); }}>
                      <div className="rp-result-card-top"><div><span className="rp-role-kicker">PRISM AI · SELECTION RESULTS</span><h2>{result.header || result.roleName || "Recruitment results"}</h2><p>{result.description || result.title || "Official recruitment update"}</p></div><span className="rp-result-published"><CheckCircle2 size={15}/> PUBLISHED</span></div>
                      <div className="rp-result-meta"><span>{(result.selectedApplicants || []).filter(candidate => ["Shortlisted","Selected"].includes(candidate.status)).length} candidate updates</span><span>Open announcement <ArrowRight size={15}/></span></div>
                    </button>
                  ))}
                </div>
              )}
              <button type="button" className="rp-primary-button" onClick={() => setPortalView("home")}><ArrowLeft size={16} /> Back to recruitment options</button>
            </section>
          ) : <>
          <button type="button" className="rp-back-link rp-section-back" onClick={() => setPortalView("home")}><ArrowLeft size={16} /> Recruitment options</button>
          <section className="rp-hero">
            <div className="rp-hero-copy">
              <span className="rp-eyebrow"><span /> PEOPLE · IDEAS · IMPACT</span>
              <h1>Make your next move.<br /><em>Make it matter.</em></h1>
              <p>Bring your curiosity, build alongside passionate people, and turn ideas into impact with PRISM AI.</p>
              <div className="rp-hero-points"><span><CheckCircle2 size={16} /> Learn by building</span><span><Users size={16} /> Create with a team</span></div>
            </div>
            <div className="rp-hero-art rp-hero-art-animated" aria-hidden="true"><div className="rp-orbit rp-orbit-one" /><div className="rp-orbit rp-orbit-two" /><div className="rp-orbit rp-orbit-three" /><div className="rp-art-core"><Users size={43} strokeWidth={1.8} /><span>AI</span></div><i className="rp-art-dot rp-dot-one" /><i className="rp-art-dot rp-dot-two" /><i className="rp-art-dot rp-dot-three" /><div className="rp-art-note">EXPLORE. INNOVATE. IMPACT.</div></div>
          </section>
          <section className="rp-opportunities" id="opportunities">
            <div className="rp-section-heading"><div><span className="rp-kicker">FIND YOUR PLACE</span><h2>Open opportunities<span>.</span></h2><p>Explore the current recruitment drives and find a role that fits you.</p></div><div className="rp-count"><strong>{filteredDrives.length.toString().padStart(2, "0")}</strong><span>OPEN DRIVES</span></div></div>
            <label className="rp-search"><Search size={18} /><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search roles or opportunities…" /><span>SEARCH</span></label>
            {filteredDrives.length === 0 ? <div className="rp-empty"><span className="rp-empty-icon"><BriefcaseBusiness size={26} /></span><h3>{drives.length ? "No matching opportunities" : "No open recruitments just yet"}</h3><p>{drives.length ? "Try another search term." : "New opportunities will appear here when PRISM AI opens a recruitment drive. Check back soon!"}</p>{search && <button type="button" className="rp-outline-button" onClick={() => setSearch("")}>Clear search</button>}</div> : <div className="rp-drive-grid">{filteredDrives.map((drive) => <article className="rp-drive-card" key={drive.id} style={{ "--rp-drive-accent": drive.colors?.primary || "#dc9750", "--rp-drive-navy": drive.colors?.header || "#1e2640" }}><div className="rp-drive-topline"><span className="rp-open-pill"><i /> ACCEPTING APPLICATIONS</span><span className="rp-drive-icon"><BriefcaseBusiness size={20} /></span></div><div className="rp-drive-content"><span className="rp-role-kicker">PRISM AI · RECRUITMENT</span><h3>{drive.roleName || "Open role"}</h3><p className="rp-drive-title">{drive.title || drive.subtitle || "Join the PRISM AI team"}</p>{drive.subtitle && drive.subtitle !== drive.title && <p className="rp-drive-subtitle">{drive.subtitle}</p>}<div className="rp-drive-meta"><span><CalendarDays size={15} /> Deadline: {formatDate(drive.deadline)}</span><span><Users size={15} /> {drive.audience || "Eligibility details in form"}</span></div>{drive.eligibility && <p className="rp-eligibility">{drive.eligibility}</p>}</div><button type="button" className="rp-apply-button" onClick={() => openDrive(drive)}>View opportunity <ArrowRight size={17} /></button></article>)}</div>}
          </section>
          <section className="rp-bottom-banner"><span className="rp-banner-mark">P.</span><div><span className="rp-kicker">YOUR IDEAS BELONG HERE</span><h2>Curiosity is a great place to start.</h2><p>Find a team, take on a challenge, and make something meaningful.</p></div><a href="#opportunities">Explore roles <ArrowRight size={17} /></a></section>
          </>}
        </> : <>
          <button type="button" className="rp-back-link" onClick={() => { setSelectedDriveId(null); setNotice(null); }}><ArrowLeft size={16} /> All opportunities</button>
          <section className="rp-form-hero" style={{ "--rp-drive-accent": selectedDrive.colors?.primary || "#dc9750", "--rp-drive-navy": selectedDrive.colors?.header || "#1e2640" }}><span className="rp-eyebrow"><span /> RECRUITMENT APPLICATION</span><h1>{selectedDrive.roleName}</h1><p>{selectedDrive.title || selectedDrive.subtitle || "Join PRISM AI"}</p><div className="rp-form-meta"><span><CalendarDays size={16} /> Deadline: {formatDate(selectedDrive.deadline)}</span><span><Users size={16} /> {selectedDrive.audience || "Eligibility details below"}</span></div></section>
          <div className="rp-form-layout"><aside className="rp-role-sidebar"><span className="rp-kicker">THE OPPORTUNITY</span>{selectedDrive.responsibilities && <div><h3>What you'll do</h3><p>{selectedDrive.responsibilities}</p></div>}{selectedDrive.expectations && <div><h3>What we're looking for</h3><p>{selectedDrive.expectations}</p></div>}{selectedDrive.eligibility && <div><h3>Eligibility</h3><p>{selectedDrive.eligibility}</p></div>}{selectedDrive.procedure && <div><h3>Selection process</h3><p>{selectedDrive.procedure}</p></div>}{selectedDrive.additionalInfo && <div><h3>Good to know</h3><p>{selectedDrive.additionalInfo}</p></div>}<div className="rp-sidebar-note"><Clock3 size={17} /><span>Take a moment to review your answers before submitting.</span></div></aside>
            <form className="rp-application-form" onSubmit={submitApplication}><div className="rp-form-intro"><span className="rp-kicker">YOUR APPLICATION</span><h2>Let's get to know you<span>.</span></h2><p>Fields marked with <b>*</b> are required.</p></div>{(selectedDrive.sections || []).map((section, sectionIndex) => <section className="rp-question-section" key={section.id || sectionIndex}><div className="rp-section-number">{String(sectionIndex + 1).padStart(2, "0")}</div><div className="rp-question-section-content"><h3>{section.title || `Section ${sectionIndex + 1}`}</h3>{section.description && <p className="rp-section-description">{section.description}</p>}{(section.questions || []).map((question, questionIndex) => <div className="rp-field" key={question.id || `${sectionIndex}-${questionIndex}`}><label htmlFor={question.id}>{question.label || "Question"}{question.required && <b> *</b>}</label><Field question={question} value={answers[question.id]} onChange={(id, value) => setAnswers((previous) => ({ ...previous, [id]: value }))} /></div>)}</div></section>)}
              {notice && <div className={`rp-notice rp-notice-${notice.type}`} role="status"><span>{notice.type === "success" ? <CheckCircle2 size={20} /> : <X size={20} />}</span><div><strong>{notice.title}</strong><p>{notice.message}</p>{notice.type === "success" && <button type="button" onClick={() => { setSelectedDriveId(null); setNotice(null); }}>Browse other opportunities <ChevronRight size={15} /></button>}</div></div>}
              {notice?.type !== "success" && <div className="rp-submit-row"><p><FileText size={15} /> Please make sure your details are accurate.</p><button type="submit" className="rp-submit-button" disabled={submitting}>{submitting ? "Submitting…" : "Submit application"} <Send size={16} /></button></div>}
            </form></div>
        </>}
        <footer className="rp-footer"><span>PRISM AI <i>·</i> RNS INSTITUTE OF TECHNOLOGY</span><span>EXPLORE. INNOVATE. IMPACT.</span><span>BUILT FOR WHAT'S NEXT <b>P.</b></span></footer>
      </div>
    </main>
  );
}
