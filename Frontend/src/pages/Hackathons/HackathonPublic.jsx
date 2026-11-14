import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, ArrowRight, ArrowUpRight, CalendarDays, ExternalLink, MapPin, Trophy, Users, Wallet, Sparkles, CheckCircle2, LoaderCircle, X } from "lucide-react";
import { getAuth } from "firebase/auth";
import "./HackathonPublic.css";



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

const PUBLIC_HACKATHONS_ENDPOINT = `${API_BASE_URL}/api/events?type=hackathon`;

const normalizeHackathon = (item = {}) => ({
  ...item,
  id: String(item.id || item.slug || ""),
  slug: String(item.slug || item.id || ""),
  themes: Array.isArray(item.themes) ? item.themes : [],
  milestones: Array.isArray(item.milestones) ? item.milestones : [],
  announcements: Array.isArray(item.announcements) ? item.announcements : [],
  resources: Array.isArray(item.resources) ? item.resources : [],
  judging: {
    ...(item.judging && typeof item.judging === "object" ? item.judging : {}),
    prizes: Array.isArray(item.judging?.prizes) ? item.judging.prizes : [],
    criteria: Array.isArray(item.judging?.criteria) ? item.judging.criteria : [],
  },
});

const fetchPublishedHackathons = async (signal) => {
  const response = await fetch(PUBLIC_HACKATHONS_ENDPOINT, {
    method: "GET",
    headers: { Accept: "application/json" },
    signal,
  });

  let data = {};
  try {
    data = await response.json();
  } catch {
    throw new Error("The server returned an invalid response.");
  }

  if (!response.ok || data.success === false) {
    throw new Error(data.message || `Unable to load hackathons (${response.status}).`);
  }

  const events = Array.isArray(data.events) ? data.events : [];
  return events
    .map(normalizeHackathon)
    .filter((item) =>
      [item.type, item.category, item.customCategory]
        .filter(Boolean)
        .some((value) => String(value).trim().toLowerCase() === "hackathon")
    );
};

const slugOf = (item) => String(item?.slug || item?.id || "");
const isPublished = (item) => !["Draft", "Archived"].includes(item?.status) && (item?.visibility || "Public") === "Public";
const dateText = (value, time = false) => {
  if (!value) return "";
  const date = new Date(value.length === 10 ? `${value}T12:00:00` : value);
  return Number.isNaN(date.getTime()) ? "" : date.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric", ...(time ? { hour: "numeric", minute: "2-digit" } : {}) });
};
const dateRange = (item) => !item.startDate && !item.endDate ? "Dates to be announced" : item.startDate && item.endDate && item.startDate !== item.endDate ? `${dateText(item.startDate)} — ${dateText(item.endDate)}` : dateText(item.startDate || item.endDate);
const toTimestamp = (value, endOfDay = false) => {
  if (!value) return null;
  const raw = String(value).trim();
  const parsed = new Date(/^\d{4}-\d{2}-\d{2}$/.test(raw)
    ? `${raw}T${endOfDay ? "23:59:59" : "00:00:00"}`
    : raw).getTime();
  return Number.isFinite(parsed) ? parsed : null;
};
const registrationState = (item, now = Date.now()) => {
  const closes = toTimestamp(item.registrationCloses, true);
  const opens = toTimestamp(item.registrationOpens);
  const end = toTimestamp(item.endDate, true);
  if (["Archived", "Closed"].includes(String(item.status || "")) || (end && end < now) || (closes && closes < now)) return "Registrations closed";
  if (opens && opens > now) return "Registration opens soon";
  if (["Draft", "Archived"].includes(String(item.status || ""))) return item.status === "Draft" ? "Not published" : "Registrations closed";
  if (opens && opens <= now) return "Registration Open";
  if (["Published", "Registration Open", "Upcoming", "Ongoing"].includes(String(item.status || ""))) return "Registration Open";
  return item.status || "Published";
};
const readTheme = () => document.documentElement.dataset.theme === "dark" ? "dark" : "light";
function useTheme() {
  const [theme, setTheme] = useState(readTheme);
  useEffect(() => {
    const sync = () => setTheme(readTheme());
    window.addEventListener("prism-theme-change", sync);
    const observer = new MutationObserver(sync);
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });
    sync();
    return () => { window.removeEventListener("prism-theme-change", sync); observer.disconnect(); };
  }, []);
  return theme;
}
function Status({ item }) { const value = registrationState(item); const closed = value === "Registrations closed"; return <span className={`hp-status ${closed ? "closed" : ""}`}><i/>{value}</span>; }
function Art({ item, index = 0, large = false }) {
  const image = item.coverImageUrl || item.logoUrl;
  return image ? <img className="hp-art-image" src={image} alt={item.name || "Hackathon artwork"}/> : <div className={`hp-art-fallback tone-${index % 3} ${large ? "large" : ""}`}><span>PRISM AI / HACKATHON SERIES</span><b>{item.edition || "THE CHALLENGE"}</b><i>Explore. Innovate. Impact.</i><em>✳</em></div>;
}
function Empty() { return <div className="hp-empty"><Sparkles size={25}/><span className="hp-kicker">THE NEXT CHAPTER</span><h2>Something worth building<br/><em>is on its way.</em></h2><p>Published PRISM AI hackathons will appear here. Check back soon for new challenges.</p><Link to="/events" className="hp-button secondary">Explore all events <ArrowUpRight size={16}/></Link></div>; }
function Listing({ items, theme, loading, loadError, onRetry }) {
  const [query, setQuery] = useState(""); const [filter, setFilter] = useState("All"); const [sort, setSort] = useState("Soonest");
  const visible = useMemo(() => [...items].filter((item) => {
    const text = [item.name, item.tagline, item.shortDescription, item.description, item.eligibility, ...(item.themes || []).map(t => `${t.name} ${t.description} ${t.problemStatement}`)].filter(Boolean).join(" ").toLowerCase();
    const end = item.endDate || item.startDate || ""; const past = Boolean(end && end < new Date().toISOString().slice(0,10));
    return text.includes(query.trim().toLowerCase()) && (filter === "All" || (filter === "Registration open" && registrationState(item) === "Registration Open") || (filter === "Upcoming" && !past) || (filter === "Past" && past));
  }).sort((a,b) => sort === "Newest" ? String(b.updatedAt || b.createdAt || "").localeCompare(String(a.updatedAt || a.createdAt || "")) : (a.startDate || "9999-12-31").localeCompare(b.startDate || "9999-12-31")), [items, query, filter, sort]);
  const featured = visible[0];
  return <main className={`hp-page hp-${theme}`}><section className="hp-hero"><div className="hp-hero-copy"><span className="hp-kicker"><i/> PRISM AI / HACKATHONS</span><h1>Think bigger.<br/><em>Build what matters.</em></h1><p>Real problems. Ambitious teams. Ideas that leave the whiteboard. Find a challenge and make your next project count.</p><div className="hp-hero-actions"><a className="hp-button primary" href="#challenge-list">Explore challenges <span>↓</span></a><Link to="/events" className="hp-text-link">All PRISM AI events <ArrowUpRight size={16}/></Link></div><div className="hp-stats"><div><b>{String(items.length).padStart(2,"0")}</b><span>PUBLISHED HACKATHONS</span></div><div><b>{String(items.filter(i => registrationState(i) === "Registration Open").length).padStart(2,"0")}</b><span>OPEN REGISTRATIONS</span></div><div><b>{String(new Set(items.flatMap(i => i.themes || []).map(t => t.name).filter(Boolean)).size).padStart(2,"0")}</b><span>CHALLENGE TRACKS</span></div></div></div><div className="hp-feature">{featured ? <Link to={`/events/hackathons/${slugOf(featured)}`}><div className="hp-feature-art"><Art item={featured} large/><span>FEATURED <ArrowUpRight size={14}/></span></div><div className="hp-feature-copy"><Status item={featured}/><h2>{featured.name}</h2><p>{featured.tagline || featured.shortDescription || "Explore the challenge and prepare to build."}</p><b>View challenge <ArrowRight size={16}/></b></div></Link> : <div className="hp-feature-empty"><span>YOUR NEXT BIG IDEA</span><h2>Every great build<br/>starts somewhere.</h2><p>The next PRISM AI hackathon will appear here once published.</p></div>}</div><div className="hp-orbits" aria-hidden="true"><i/><i/><i/></div></section>
    <section className="hp-list" id="challenge-list"><div className="hp-section-heading"><div><span className="hp-kicker">01 / FIND YOUR CHALLENGE</span><h2>Make room for<br/><em>what's next.</em></h2><p>Explore published hackathons and find the one that gets you thinking.</p></div><span className="hp-count"><b>{String(visible.length).padStart(2,"0")}</b> CHALLENGES</span></div><div className="hp-controls"><label className="hp-search"><span>⌕</span><input value={query} onChange={e => setQuery(e.target.value)} placeholder="Search hackathons, tracks or topics" aria-label="Search hackathons"/></label><div className="hp-filters">{["All","Registration open","Upcoming","Past"].map(v => <button key={v} className={filter===v ? "selected" : ""} onClick={() => setFilter(v)}>{v}</button>)}</div><label className="hp-sort">Sort <select value={sort} onChange={e => setSort(e.target.value)}><option>Soonest</option><option>Newest</option></select></label></div>{loading ? <div className="hp-empty"><span className="hp-kicker">LOADING FROM PRISM AI</span><h2>Finding the next<br/><em>big challenge.</em></h2><p>Fetching published hackathons from the events database…</p></div> : loadError ? <div className="hp-empty"><span className="hp-kicker">COULDN'T LOAD HACKATHONS</span><h2>We're having trouble<br/><em>reaching the server.</em></h2><p>{loadError}</p><button className="hp-button secondary" onClick={onRetry}>Try again</button></div> : visible.length ? <div className="hp-grid">{visible.map((item,index) => <Link className="hp-card" key={item.id || item.slug} to={`/events/hackathons/${slugOf(item)}`}><div className="hp-card-art"><Art item={item} index={index}/><span className="hp-card-index">{String(index+1).padStart(2,"0")} / CHALLENGE</span><b className="hp-card-arrow"><ArrowUpRight size={18}/></b></div><div className="hp-card-body"><div className="hp-card-meta"><span>{item.edition || "PRISM AI HACKATHON"}</span><Status item={item}/></div><h3>{item.name}</h3><p>{item.shortDescription || item.tagline || "Explore the tracks, rules and details."}</p><div className="hp-card-facts"><span><CalendarDays size={14}/>{dateRange(item)}</span><span><MapPin size={14}/>{item.venue || item.mode || "Venue to be announced"}</span></div><div className="hp-card-bottom">EXPLORE CHALLENGE <ArrowRight size={16}/></div></div></Link>)}</div> : items.length ? <div className="hp-empty"><h2>No matching challenges.</h2><p>Try another search or clear the filters.</p><button className="hp-button secondary" onClick={() => {setQuery("");setFilter("All");}}>Clear filters</button></div> : <Empty/>}</section><section className="hp-closing"><span className="hp-kicker">02 / THE BUILDERS' COMMUNITY</span><h2>Don't wait for the future.<br/><em>Make something of it.</em></h2><p>Bring your curiosity, your skills and your willingness to experiment.</p><Link to="/events" className="hp-button light">Discover all events <ArrowUpRight size={16}/></Link></section><Footer/></main>;
}
function Section({ number, title, children }) { return children ? <section className="hp-detail-section"><span className="hp-kicker">{number}</span><h2>{title}</h2>{children}</section> : null; }
function HackathonRegistrationField({ field, value, onChange }) {
  const type = String(field.type || "text").toLowerCase();
  const common = {
    id: field.id,
    name: field.id,
    value: value ?? "",
    required: Boolean(field.required),
    onChange: (event) => onChange(field.id, event.target.value),
    placeholder: field.placeholder || `Enter ${String(field.label || "value").toLowerCase()}`
  };
  if (type === "textarea") return <textarea {...common} rows={3}/>;
  if (type === "select") return <select {...common}><option value="">Choose an option</option>{String(field.options || "").split(",").map(v => v.trim()).filter(Boolean).map(v => <option key={v} value={v}>{v}</option>)}</select>;
  if (type === "checkbox") return <label className="hp-form-check"><input type="checkbox" checked={Boolean(value)} required={Boolean(field.required)} onChange={e => onChange(field.id, e.target.checked)}/><span>{field.helpText || field.label}</span></label>;
  const inputType = ["email", "tel", "number", "url", "date"].includes(type) ? type : "text";
  return <input {...common} type={inputType}/>;
}

function Detail({ items, theme }) {
  const { slug } = useParams();
  const navigate = useNavigate();
  const item = items.find(v => slugOf(v) === slug && isPublished(v));
  const [clock, setClock] = useState(Date.now());
  const [formValues, setFormValues] = useState({});
  const [formBusy, setFormBusy] = useState(false);
  const [formMessage, setFormMessage] = useState("");
  const [formSuccess, setFormSuccess] = useState(false);
  const registrationPhrases = [
    ["Make your", "next move."],
    ["Build your", "next breakthrough."],
    ["Turn ideas", "into impact."],
    ["Think bold.", "Build bigger."],
    ["Your next", "chapter starts here."]
  ];
  const [registrationPhraseIndex, setRegistrationPhraseIndex] = useState(0);

  useEffect(() => {
    const phraseTimer = window.setInterval(() => {
      setRegistrationPhraseIndex((current) => (current + 1) % registrationPhrases.length);
    }, 3600);
    return () => window.clearInterval(phraseTimer);
  }, []);

  useEffect(() => {
    const timer = window.setInterval(() => setClock(Date.now()), 1000);
    return () => window.clearInterval(timer);
  }, []);

  if (!item) return <main className={`hp-page hp-${theme}`}><div className="hp-not-found"><span className="hp-kicker">404 / CHALLENGE NOT FOUND</span><h1>This challenge isn't<br/><em>available here.</em></h1><p>It may be unpublished, private or the URL may have changed.</p><button className="hp-button primary" onClick={() => navigate("/events")}><ArrowLeft size={16}/> Back to hackathons</button></div><Footer/></main>;

  const tracks = (item.themes || []).filter(t => t.name || t.description || t.problemStatement);
  const milestones = (item.milestones || []).filter(m => m.title || m.date || m.description);
  const announcements = (item.announcements || []).filter(a => a.title || a.body).sort((a,b) => Number(Boolean(b.pinned))-Number(Boolean(a.pinned)));
  const prizes = (item.judging?.prizes || []).filter(p => p.title || p.value || p.description);
  const criteria = (item.judging?.criteria || []).filter(c => c.name);
  const status = registrationState(item, clock);
  const closed = status === "Registrations closed";
  const opens = toTimestamp(item.registrationOpens);
  const opensInFuture = Boolean(opens && opens > clock);
  const registrationAvailable = !closed && !opensInFuture && status === "Registration Open";
  const registrationFields = Array.isArray(item.registrationFields) ? item.registrationFields.filter(field => field && field.id && field.label) : [];
  const setField = (id, value) => setFormValues(current => ({ ...current, [id]: value }));

  const submitRegistration = async (event) => {
    event.preventDefault();
    if (formBusy || !registrationAvailable) return;
    setFormBusy(true);
    setFormMessage("");
    try {
      const name = String(formValues.participantName || formValues.name || "").trim();
      const email = String(formValues.email || "").trim();
      const phone = String(formValues.phone || formValues.mobile || "").trim();
      if (!name) throw new Error("Please enter the participant name.");
      if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) throw new Error("Please enter a valid email address.");
      if (phone && !/^[+\d\s()-]{8,18}$/.test(phone)) throw new Error("Please enter a valid contact number.");

      const registration = {
        eventId: item.id, eventType: "hackathon", participantName: name, name, email,
        phone, mobile: phone, teamName: String(formValues.teamName || "").trim(),
        teamMembers: String(formValues.teamMembers || "").trim(),
        projectTitle: String(formValues.projectTitle || "").trim(),
        track: String(formValues.track || "").trim(),
        answers: { ...formValues }, status: "Registered", submittedAt: new Date().toISOString()
      };
      const response = await fetch(`${API_BASE_URL}/api/events/${encodeURIComponent(item.id)}/registrations`, {
        method: "POST",
        headers: { ...(await getMemberAuthHeaders()),
           "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify(registration)
      });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok || payload.success === false) throw new Error(payload.message || payload.error || "Registration could not be submitted. Please try again.");
      setFormSuccess(true);
      setFormMessage("Your hackathon registration has been submitted successfully.");
      setFormValues({});
    } catch (error) {
      setFormMessage(error.message || "Registration could not be submitted. Please try again.");
    } finally {
      setFormBusy(false);
    }
  };

  const registrationMode = new URLSearchParams(window.location.search).get("register") === "1";

  if (registrationMode) return <main className={`hp-page hp-${theme} hp-detail hp-registration-page`}>
    <div className="hp-registration-shell">
      <button className="hp-back" type="button" onClick={() => navigate(`/events/hackathons/${encodeURIComponent(slug || "")}`, { replace: true })}><ArrowLeft size={15}/> BACK TO EVENT</button>
      <div className="hp-registration-layout">
        <section className="hp-registration-intro">
          <span className="hp-kicker">PRISM AI / HACKATHON REGISTRATION</span>
          <h1 className="hp-registration-loop-heading" aria-live="polite">
            <span className="hp-registration-phrase" key={registrationPhraseIndex}>
              <span>{registrationPhrases[registrationPhraseIndex][0]}</span>
              <em>{registrationPhrases[registrationPhraseIndex][1]}</em>
            </span>
          </h1>
          <p>You're one step away from joining <strong>{item.name}</strong>. Share your details and your team information below.</p>
          <div className="hp-registration-summary">
            <div><small>EVENT</small><b>{item.name}</b></div>
            <div><small>TEAM SIZE</small><b>{item.minTeamSize || 1}–{item.maxTeamSize || 4} members</b></div>
            <div><small>REGISTRATION STATUS</small><b>{status}</b></div>
          </div>
        </section>
        <section className="hp-registration-card">
          <div className="hp-form-heading"><b>Hackathon registration</b><small>Fields marked * are required</small></div>
          {!registrationAvailable ? <p className="hp-notice">{closed ? "Registration for this hackathon is closed." : opensInFuture ? `Registration opens ${dateText(item.registrationOpens, true)}.` : "Registration is not currently open."}</p> :
          <form className="hp-registration-form" onSubmit={submitRegistration}>
            <label><span>Participant name *</span><input required value={formValues.participantName || ""} onChange={e=>setField("participantName",e.target.value)} placeholder="Your full name"/></label>
            <label><span>Email address *</span><input required type="email" value={formValues.email || ""} onChange={e=>setField("email",e.target.value)} placeholder="you@example.com"/></label>
            <label><span>Contact number</span><input type="tel" value={formValues.phone || ""} onChange={e=>setField("phone",e.target.value)} placeholder="Your mobile number"/></label>
            <label><span>Team name</span><input value={formValues.teamName || ""} onChange={e=>setField("teamName",e.target.value)} placeholder="Your team name"/></label>
            <label><span>Team members</span><textarea rows={3} value={formValues.teamMembers || ""} onChange={e=>setField("teamMembers",e.target.value)} placeholder="List names of your teammates"/></label>
            <label><span>Project title / idea</span><input value={formValues.projectTitle || ""} onChange={e=>setField("projectTitle",e.target.value)} placeholder="Optional at this stage"/></label>
            {tracks.length>0&&<label><span>Preferred track</span><select value={formValues.track||""} onChange={e=>setField("track",e.target.value)}><option value="">Choose a track</option>{tracks.map((track,i)=><option key={track.id||i} value={track.name}>{track.name}</option>)}</select></label>}
            {registrationFields.filter(f=>!["participantName","name","email","phone","mobile","teamName","teamMembers","projectTitle","track"].includes(String(f.id).toLowerCase())).map(field=><label key={field.id}><span>{field.label}{field.required&&" *"}</span>{field.helpText&&<small>{field.helpText}</small>}<HackathonRegistrationField field={field} value={formValues[field.id]} onChange={setField}/></label>)}
            {formMessage&&<p className="hp-form-message error" role="alert">{formMessage}</p>}
            <button className="hp-form-submit" type="submit" disabled={formBusy}>{formBusy?<><LoaderCircle size={15}/> Submitting…</>:"Submit registration"}{!formBusy&&<ArrowUpRight size={16}/>}</button>
            <small className="hp-form-footnote">Your details will be submitted to the event organizer.</small>
          </form>}
        </section>
      </div>
    </div>
    {formSuccess && <div className="hp-success-overlay" role="dialog" aria-modal="true" aria-labelledby="hp-success-title">
      <div className="hp-confetti" aria-hidden="true">{Array.from({ length: 42 }, (_, index) => <i key={index} style={{"--i":index,"--x":`${(index*37)%100}%`,"--delay":`${(index%9)*0.13}s`,"--duration":`${3.1+(index%6)*0.35}s`,"--drift":`${((index*17)%180)-90}px`,"--spin":`${(index*73)%720}deg`}}/>)}</div>
      <section className="hp-success-card"><span className="hp-success-icon"><CheckCircle2 size={34}/></span><small>PRISM AI · REGISTRATION CONFIRMED</small><h2 id="hp-success-title">You're on the list!</h2><p>Your hackathon registration has been submitted successfully. Get ready to build something amazing.</p><button type="button" onClick={() => setFormSuccess(false)}>Awesome <ArrowRight size={16}/></button></section>
    </div>}
  </main>;

  return <main className={`hp-page hp-${theme} hp-detail`}>
    <div className="hp-detail-wrap">
      <button className="hp-back" onClick={() => navigate("/events")}><ArrowLeft size={15}/> BACK TO EVENTS</button>
      <section className="hp-detail-hero">
        <div className="hp-detail-art"><Art item={item} large/><span>{item.edition || "PRISM AI HACKATHON"} / {item.mode || "FORMAT TBA"}</span></div>
        <div className="hp-detail-intro">
          <div className="hp-detail-meta"><span>{item.organizer || "PRISM AI"}</span><span className={`hp-status ${closed ? "closed" : ""}`}><i/>{status}</span></div>
          <h1>{item.name}</h1>{item.tagline && <p className="hp-tagline">{item.tagline}</p>}
          <p className="hp-description">{item.shortDescription || item.description || "Explore the tracks, understand the rules and prepare to build."}</p>
          <div className="hp-facts"><div><CalendarDays/><small>EVENT DATES</small><b>{dateRange(item)}</b></div><div><MapPin/><small>VENUE / MODE</small><b>{item.venue || item.mode || "To be announced"}</b></div><div><Users/><small>TEAM FORMAT</small><b>{item.teamMode || "Team or solo"} · {item.minTeamSize || 1}–{item.maxTeamSize || 4}</b></div><div><Wallet/><small>PARTICIPATION</small><b>{item.fee || "Details to be announced"}</b></div></div>
          <div className="hp-register">{closed ? <span className="disabled">Registration closed</span> : opensInFuture ? <span className="disabled">Opens {dateText(item.registrationOpens,true)}</span> : <button className="hp-register-cta" type="button" onClick={() => navigate(`${window.location.pathname}?register=1`)}>Register now <ArrowRight size={17}/></button>}<small>{item.registrationCloses ? `Deadline · ${dateText(item.registrationCloses,true)}` : "Registration timing as announced by the organizer."}</small></div>
        </div>
      </section>
      <div className="hp-detail-layout">
        <div className="hp-detail-main">
          <Section number="01 / OVERVIEW" title="About the challenge"><p className="hp-copy">{item.description || item.shortDescription || "The organizer will add the full challenge description soon."}</p><div className="hp-overview-facts">{[["ELIGIBILITY",item.eligibility],["ELIGIBLE COURSES",item.eligibleCourses],["YEAR OF STUDY",item.eligibleYears],["COLLEGE POLICY",item.collegePolicy]].filter(v=>v[1]).map(([label,value])=><div key={label}><small>{label}</small><p>{value}</p></div>)}</div></Section>
          {tracks.length>0 && <Section number="02 / CHALLENGE TRACKS" title="Choose a direction"><div className="hp-track-grid">{tracks.map((t,i)=><article key={t.id||i}><small>TRACK {String(i+1).padStart(2,"0")}</small><h3>{t.name}</h3>{t.shortCode&&<span className="hp-shortcode">{t.shortCode}</span>}{t.description&&<p>{t.description}</p>}{[["PROBLEM STATEMENT",t.problemStatement],["EXPECTED OUTCOME",t.expectedOutcome],["CONSTRAINTS",t.constraints],["SUGGESTED TECHNOLOGIES",t.suggestedTech]].filter(v=>v[1]).map(([label,value])=><div className="hp-track-extra" key={label}><b>{label}</b><p>{value}</p></div>)}</article>)}</div></Section>}
          {milestones.length>0&&<Section number="03 / IMPORTANT DATES" title="The timeline"><div className="hp-timeline">{milestones.map((m,i)=><article key={m.id||i}><span>{String(i+1).padStart(2,"0")}</span><div><small>{m.date?dateText(m.date):"DATE TBA"}{m.time?` · ${m.time}`:""}</small><h3>{m.title}</h3>{m.description&&<p>{m.description}</p>}</div></article>)}</div></Section>}
          {item.rules&&<Section number="04 / PARTICIPATION" title="Rules & guidelines"><p className="hp-copy">{item.rules}</p>{item.codeOfConduct&&<div className="hp-rules"><b>CODE OF CONDUCT</b><p>{item.codeOfConduct}</p></div>}</Section>}
          {prizes.length>0&&<Section number="05 / RECOGNITION" title="Prizes & awards"><div className="hp-prize-grid">{prizes.map((p,i)=><article key={p.id||i}><small><Trophy size={15}/> {p.place||`AWARD ${i+1}`}</small><h3>{p.title||"Prize details to be announced"}</h3>{p.value&&<b>{p.value}</b>}{p.description&&<p>{p.description}</p>}</article>)}</div></Section>}
          {criteria.length>0&&<Section number="06 / EVALUATION" title="How projects are judged"><div className="hp-criteria">{criteria.map((c,i)=><div key={c.id||i}><span>{String(i+1).padStart(2,"0")}</span><b>{c.name}</b><strong>{c.weight}%</strong><i style={{"--weight":`${Math.max(0,Math.min(100,Number(c.weight)||0))}%`}}/></div>)}</div>{item.judging?.judges&&<p className="hp-copy">{item.judging.judges}</p>}</Section>}
          {announcements.length>0&&<Section number="07 / ORGANIZER UPDATES" title="Announcements"><div className="hp-announcements">{announcements.map((a,i)=><article key={a.id||i}><small>{a.pinned?"PINNED UPDATE":"ANNOUNCEMENT"} {a.date&&` · ${dateText(a.date,true)}`}</small><h3>{a.title}</h3><p>{a.body}</p></article>)}</div></Section>}
          {(item.resources||[]).some(r=>r.title||r.url)&&<Section number="08 / USEFUL LINKS" title="Resources"><div className="hp-resources">{item.resources.filter(r=>r.title||r.url).map((r,i)=><a key={r.id||i} href={r.url} target="_blank" rel="noreferrer">{r.title||r.url}<ExternalLink size={15}/></a>)}</div></Section>}
        </div>
        <aside className="hp-aside" id="registration-info">
          <span className="hp-kicker">YOUR NEXT STEP</span><h2>Ready to build?</h2><p>Register your team for this PRISM AI hackathon.</p>
          <div><small>STATUS</small><span className={`hp-status ${closed ? "closed" : ""}`}><i/>{status}</span></div>
          {item.registrationOpens&&<div><small>REGISTRATION OPENS</small><b>{dateText(item.registrationOpens,true)}</b></div>}
          {item.registrationCloses&&<div><small>REGISTRATION CLOSES</small><b>{dateText(item.registrationCloses,true)}</b></div>}
          <div><small>TEAM SIZE</small><b>{item.minTeamSize||1}–{item.maxTeamSize||4} members</b></div>
          {opensInFuture&&<p className="hp-notice">Registration has not opened yet. The form will become available automatically at the scheduled opening time.</p>}
          {closed&&<p className="hp-notice">The registration window for this hackathon has closed.</p>}
          {!registrationAvailable&&!closed&&!opensInFuture&&<p className="hp-notice">Registration is not currently open. Please check back for organizer updates.</p>}
          {item.website&&<a className="hp-external" href={item.website} target="_blank" rel="noreferrer">Official event website <ExternalLink size={14}/></a>}
          {item.contactEmail&&<a className="hp-external" href={`mailto:${item.contactEmail}`}>Contact organizer <ArrowUpRight size={14}/></a>}
        </aside>
      </div>
      <Footer/>
    </div>
  </main>;
}
function Footer() { return <footer className="hp-footer"><Link to="/events">PRISM AI<span>.</span></Link><span>EXPLORE. INNOVATE. IMPACT.</span><span>RNS INSTITUTE OF TECHNOLOGY · BENGALURU</span><button onClick={()=>window.scrollTo({top:0,behavior:"smooth"})}>BACK TO TOP ↑</button></footer>; }
export default function HackathonPublic() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [reloadKey, setReloadKey] = useState(0);
  const theme = useTheme();
  const { slug } = useParams();

  useEffect(() => {
    const controller = new AbortController();

    const loadHackathons = async () => {
      setLoading(true);
      setLoadError("");

      try {
        const hackathons = await fetchPublishedHackathons(controller.signal);
        if (!controller.signal.aborted) {
          setItems(hackathons);
        }
      } catch (error) {
        if (error.name !== "AbortError" && !controller.signal.aborted) {
          console.error("Failed to fetch public hackathons:", error);
          setLoadError(error.message || "Please try again in a moment.");
        }
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    };

    loadHackathons();
    return () => controller.abort();
  }, [reloadKey]);

  const published = useMemo(
    () => items.filter(isPublished),
    [items]
  );

  const retry = () => setReloadKey((value) => value + 1);

  if (slug) {
    if (loading) {
      return (
        <main className={`hp-page hp-${theme}`}>
          <div className="hp-not-found">
            <span className="hp-kicker">PRISM AI / HACKATHONS</span>
            <h1>Loading the<br/><em>challenge.</em></h1>
            <p>Fetching the published event details…</p>
          </div>
          <Footer/>
        </main>
      );
    }

    if (loadError) {
      return (
        <main className={`hp-page hp-${theme}`}>
          <div className="hp-not-found">
            <span className="hp-kicker">HACKATHONS / CONNECTION ERROR</span>
            <h1>We couldn't load<br/><em>this challenge.</em></h1>
            <p>{loadError}</p>
            <button className="hp-button primary" onClick={retry}>Try again</button>
          </div>
          <Footer/>
        </main>
      );
    }

    return <Detail items={published} theme={theme}/>;
  }

  return (
    <Listing
      items={published}
      theme={theme}
      loading={loading}
      loadError={loadError}
      onRetry={retry}
    />
  );
}
