import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { getAuth, onAuthStateChanged, signOut } from "firebase/auth";
import { getFirestore, doc, getDoc, setDoc, serverTimestamp } from "firebase/firestore";
import {
  CalendarDays, Code2, BookOpen, Bot, Trophy, Newspaper, Users, Images,
  MessagesSquare, Search, Sun, Moon, LogOut, ArrowUpRight, Sparkles,
  LayoutDashboard, X, UserRound, Settings, CircleHelp, ChevronRight,
  ChevronLeft, ChevronDown, ShieldCheck, Save, UserCircle, Mail, Phone, ExternalLink
} from "lucide-react";
import "./Dashboard.css";

const sections = [
  { title: "Events", description: "Discover upcoming events, hackathons and workshops.", path: "/events", color: "violet", icon: CalendarDays, keywords: "events hackathons workshops seminars webinars bootcamps competitions" },
  { title: "Projects", description: "Explore innovative projects built by our community.", path: "/projects", color: "blue", icon: Code2, keywords: "projects github development innovation" },
  { title: "Certification", description: "Access your certificates and celebrate your learning achievements.", path: "/certificates", color: "teal", icon: ShieldCheck, keywords: "certification certifications certificates certificate achievements completion awards" },
  { title: "Knowledge Hub", description: "Discover resources and expand your technical knowledge.", path: "/knowledge-hub", color: "green", icon: BookOpen, keywords: "knowledge learning resources tutorials study" },
  { title: "Tool of the Week", description: "Explore AI tools that can transform your workflow.", path: "/ai-tool-of-the-week", color: "orange", icon: Bot, keywords: "AI tools artificial intelligence weekly tool" },
  { title: "Leaderboard", description: "Celebrate achievements and community contributions.", path: "/leaderboard", color: "pink", icon: Trophy, keywords: "leaderboard rankings points achievements" },
  { title: "News & Updates", description: "Stay updated with the latest from PRISM AI.", path: "/news", color: "cyan", icon: Newspaper, keywords: "news announcements updates notifications" },
  { title: "Recruitments", description: "Discover opportunities to join and contribute.", path: "/recruitments", color: "purple", icon: Users, keywords: "recruitments recruitment join team applications" },
  { title: "Gallery", description: "Relive events and explore our club's memories.", path: "/gallery", color: "lime", icon: Images, keywords: "gallery photos images memories pictures" },
  { title: "Community", description: "Connect with innovators and fellow members.", path: "/community", color: "amber", icon: MessagesSquare, keywords: "community connect collaborate members discussions" },
];

// Add your 10 generated images to public/dashboard-promos/ using these filenames.
const promoSlides = [
  { image: "/dashboard-promos/promo-1.jpg", eyebrow: "EXPLORE THE POSSIBILITIES", title: "Your next idea could change everything.", description: "Discover AI, build boldly, and turn curiosity into something meaningful.", action: "Explore your workspace" },
  { image: "/dashboard-promos/promo-2.jpg", eyebrow: "LEARN. BUILD. REPEAT.", title: "Make room for innovation.", description: "Find inspiration, connect with opportunities, and keep learning with PRISM AI.", action: "Discover more" },
  { image: "/dashboard-promos/promo-3.jpg", eyebrow: "BUILT BY CURIOUS MINDS", title: "Big ideas start with one step.", description: "Explore the tools and community that help move your ideas forward.", action: "Start exploring" },
  { image: "/dashboard-promos/promo-4.jpg", eyebrow: "THE FUTURE IS INTERACTIVE", title: "Experiment beyond the ordinary.", description: "Stay curious, try new things, and bring your ideas to life.", action: "Explore features" },
  { image: "/dashboard-promos/promo-5.jpg", eyebrow: "YOUR COMMUNITY. YOUR JOURNEY.", title: "Create something worth sharing.", description: "Learn alongside fellow innovators and celebrate what you create.", action: "Meet the community" },
  { image: "/dashboard-promos/promo-6.jpg", eyebrow: "THINK DIFFERENTLY", title: "Give your curiosity a direction.", description: "From inspiration to implementation, your next chapter starts here.", action: "Find inspiration" },
  { image: "/dashboard-promos/promo-7.jpg", eyebrow: "IDEAS INTO IMPACT", title: "Build what comes next.", description: "Discover opportunities to explore, collaborate, and make an impact.", action: "Explore PRISM AI" },
  { image: "/dashboard-promos/promo-8.jpg", eyebrow: "A SPACE TO GROW", title: "Keep learning. Keep creating.", description: "Your personal hub for the latest activities and club resources.", action: "Open workspace" },
  { image: "/dashboard-promos/promo-9.jpg", eyebrow: "INNOVATION STARTS HERE", title: "The next breakthrough might be yours.", description: "Explore new ideas and take the next step with PRISM AI.", action: "Get started" },
  { image: "/dashboard-promos/promo-10.jpg", eyebrow: "EXPLORE. INNOVATE. IMPACT.", title: "Make your ideas matter.", description: "Welcome to a community built for curious minds and ambitious ideas.", action: "Explore now" },
];

const PROFILE_FIELDS = [
  { key: "name", label: "Full name", placeholder: "Enter your full name" },
  { key: "email", label: "Email address", placeholder: "Your registered email", readOnly: true },
  { key: "phone", label: "Contact number", placeholder: "10-digit mobile number", type: "tel" },
  { key: "linkedin", label: "LinkedIn profile", placeholder: "https://linkedin.com/in/your-profile", type: "url" },
  { key: "github", label: "GitHub profile", placeholder: "https://github.com/your-username", type: "url" },
  { key: "usn", label: "USN", placeholder: "Enter your university seat number" },
  { key: "academicYear", label: "Academic year", placeholder: "Select academic year", type: "year" },
  { key: "className", label: "Class", placeholder: "e.g. CSE" },
  { key: "section", label: "Section", placeholder: "e.g. A" },
  { key: "semester", label: "Semester", placeholder: "Select semester", type: "select" },
  { key: "department", label: "Department", placeholder: "e.g. Computer Science and Engineering" },
];

const EMPTY_PROFILE = {
  name: "", email: "", phone: "", linkedin: "", github: "",
  academicYear: "", usn: "", className: "", section: "", semester: "", department: "",
};

function readStoredProfile(uid) {
  try {
    const raw = localStorage.getItem(`prism-profile-${uid}`);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function readOnboarding(uid) {
  try {
    const raw = localStorage.getItem(`prism-onboarding-${uid}`);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function getProfileCompletion(profile) {
  const completed = PROFILE_FIELDS.filter((field) => String(profile[field.key] || "").trim()).length;
  const missing = PROFILE_FIELDS.filter((field) => !String(profile[field.key] || "").trim());
  return { completed, total: PROFILE_FIELDS.length, percentage: Math.round((completed / PROFILE_FIELDS.length) * 100), missing };
}

export default function Dashboard() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [authReady, setAuthReady] = useState(false);
  const [search, setSearch] = useState("");
  const [darkMode, setDarkMode] = useState(() => {
    try {
      return (localStorage.getItem("prism-theme") || localStorage.getItem("prism-dashboard-theme")) === "dark";
    } catch { return false; }
  });
  const [loggingOut, setLoggingOut] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [activeSlide, setActiveSlide] = useState(0);
  const [failedImages, setFailedImages] = useState({});
  const [profile, setProfile] = useState(EMPTY_PROFILE);
  const [prismPoints, setPrismPoints] = useState(0);
  const [pointsLoading, setPointsLoading] = useState(true);
  const [pointsError, setPointsError] = useState("");
  const [profileLoading, setProfileLoading] = useState(true);
  const [profileEditorOpen, setProfileEditorOpen] = useState(false);
  const [profileDraft, setProfileDraft] = useState(EMPTY_PROFILE);
  const [profileSaving, setProfileSaving] = useState(false);
  const [profileMessage, setProfileMessage] = useState("");
  const [profileMessageType, setProfileMessageType] = useState("success");
  const [profileSaveMode, setProfileSaveMode] = useState("cloud");
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [notificationsEnabled, setNotificationsEnabled] = useState(() => localStorage.getItem("prism-notifications") !== "false");

  useEffect(() => {
    let unsubscribe;
    try {
      unsubscribe = onAuthStateChanged(getAuth(), (currentUser) => {
        setUser(currentUser);
        setAuthReady(true);
        if (!currentUser) navigate("/login", { replace: true });
      });
    } catch (error) {
      console.error("Firebase authentication initialization failed:", error);
      setAuthReady(true);
      navigate("/login", { replace: true });
    }
    return () => unsubscribe?.();
  }, [navigate]);

  useEffect(() => {
    if (!user?.uid) return;
    let active = true;

    async function loadProfile() {
      setProfileLoading(true);
      const onboarding = readOnboarding(user.uid);
      const localProfile = readStoredProfile(user.uid);
      const seed = {
        ...EMPTY_PROFILE,
        name: user.displayName || onboarding.displayName || user.email?.split("@")[0] || "",
        email: user.email || "",
        phone: user.phoneNumber || "",
        academicYear: onboarding.academicYear || "",
        ...localProfile,
      };
      try {
        const snapshot = await getDoc(doc(getFirestore(), "memberProfiles", user.uid));
        if (snapshot.exists()) {
          const cloudProfile = snapshot.data();
          const merged = { ...seed, ...cloudProfile, email: user.email || cloudProfile.email || "" };
          if (active) {
            setProfile(merged);
            setProfileSaveMode("cloud");
          }
        } else if (active) {
          setProfile(seed);
        }
      } catch (error) {
        console.warn("Could not load cloud member profile; using this device's saved profile.", error);
        if (active) {
          setProfile(seed);
          setProfileSaveMode("local");
        }
      } finally {
        if (active) setProfileLoading(false);
      }
    }

    loadProfile();
    return () => { active = false; };
  }, [user]);

  useEffect(() => {
    if (!user?.uid) {
      setPrismPoints(0);
      setPointsLoading(false);
      return undefined;
    }

    let active = true;
    async function loadPrismPoints() {
      setPointsLoading(true);
      setPointsError("");
      try {
        const token = await user.getIdToken();
        const apiBase = (import.meta.env.VITE_API_URL || import.meta.env.VITE_API_BASE_URL || "http://localhost:5000").replace(/\/+$/, "");
        const response = await fetch(`${apiBase}/api/points/me`, {
          headers: { Authorization: `Bearer ${token}`, Accept: "application/json" },
        });
        const data = await response.json().catch(() => ({}));
        if (!response.ok || data.success === false) {
          throw new Error(data.message || "Unable to load PRISM Points.");
        }
        if (active) setPrismPoints(Math.max(0, Number(data.wallet?.balance) || 0));
      } catch (error) {
        console.error("Could not load PRISM Points:", error);
        if (active) setPointsError(error.message || "Unable to load points.");
      } finally {
        if (active) setPointsLoading(false);
      }
    }

    loadPrismPoints();
    return () => { active = false; };
  }, [user]);

  useEffect(() => {
    const theme = darkMode ? "dark" : "light";
    document.documentElement.dataset.theme = theme;
    document.documentElement.style.colorScheme = theme;
    try {
      localStorage.setItem("prism-theme", theme);
      localStorage.setItem("prism-dashboard-theme", theme);
    } catch { /* Theme preference is optional. */ }
    window.dispatchEvent(new CustomEvent("prism-theme-change", { detail: { theme } }));
  }, [darkMode]);

  useEffect(() => {
    const closeOnEscape = (event) => {
      if (event.key === "Escape") {
        setProfileOpen(false);
        setProfileEditorOpen(false);
        setSettingsOpen(false);
      }
    };
    window.addEventListener("keydown", closeOnEscape);
    return () => window.removeEventListener("keydown", closeOnEscape);
  }, []);

  useEffect(() => {
    const timer = window.setInterval(() => setActiveSlide((current) => (current + 1) % promoSlides.length), 6500);
    return () => window.clearInterval(timer);
  }, []);

  const filteredSections = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return sections;
    return sections.filter((section) => `${section.title} ${section.description} ${section.keywords}`.toLowerCase().includes(query));
  }, [search]);

  const displayName = profile.name?.trim() || user?.displayName?.trim() || user?.email?.split("@")[0] || "Innovator";
  const initials = displayName.split(/\s+/).slice(0, 2).map((part) => part[0]).join("").toUpperCase();
  const currentSlide = promoSlides[activeSlide];
  const profileCompletion = getProfileCompletion(profile);
  const profileComplete = profileCompletion.percentage === 100;

  function openProfileEditor() {
    setProfileDraft({ ...EMPTY_PROFILE, ...profile, email: user?.email || profile.email || "" });
    setProfileMessage("");
    setProfileEditorOpen(true);
    setProfileOpen(false);
  }

  function updateProfileField(key, value) {
    setProfileDraft((current) => ({ ...current, [key]: value }));
  }

  async function saveProfile(event) {
    event.preventDefault();
    const normalized = {
      ...profileDraft,
      name: profileDraft.name.trim(),
      email: user?.email || profileDraft.email.trim(),
      phone: profileDraft.phone.trim(),
      academicYear: profileDraft.academicYear,
      linkedin: profileDraft.linkedin.trim(),
      github: profileDraft.github.trim(),
      usn: profileDraft.usn.trim().toUpperCase(),
      className: profileDraft.className.trim(),
      section: profileDraft.section.trim(),
      semester: profileDraft.semester,
      department: profileDraft.department.trim(),
      uid: user.uid,
      updatedAt: new Date().toISOString(),
    };

    if (normalized.phone && !/^\d{10}$/.test(normalized.phone)) {
      setProfileMessage("Contact number must contain exactly 10 digits.");
      setProfileMessageType("error");
      return;
    }
    for (const key of ["linkedin", "github"]) {
      const value = normalized[key];
      if (value) {
        try {
          const parsed = new URL(value.startsWith("http") ? value : `https://${value}`);
          const expected = key === "linkedin" ? /(^|\.)linkedin\.com$/i : /(^|\.)github\.com$/i;
          if (!expected.test(parsed.hostname)) throw new Error("Invalid profile domain");
          normalized[key] = parsed.href;
        } catch {
          setProfileMessage(`${key === "linkedin" ? "LinkedIn" : "GitHub"} must be a valid profile URL.`);
          setProfileMessageType("error");
          return;
        }
      }
    }

    setProfileSaving(true);
    setProfileMessage("");
    try {
      await setDoc(
        doc(getFirestore(), "memberProfiles", user.uid),
        { ...normalized, updatedAt: serverTimestamp() },
        { merge: true }
      );
      localStorage.setItem(`prism-profile-${user.uid}`, JSON.stringify(normalized));
      setProfile(normalized);
      setProfileSaveMode("cloud");
      setProfileMessage("Your profile has been saved successfully.");
      setProfileMessageType("success");
      window.setTimeout(() => setProfileEditorOpen(false), 650);
    } catch (error) {
      console.error("Cloud profile save failed:", error);
      try {
        localStorage.setItem(`prism-profile-${user.uid}`, JSON.stringify(normalized));
        setProfile(normalized);
        setProfileSaveMode("local");
        setProfileMessage("Saved on this device only. Cloud saving needs Firestore access for memberProfiles.");
        setProfileMessageType("warning");
      } catch (localError) {
        setProfileMessage("Could not save your profile. Please check your browser storage and try again.");
        setProfileMessageType("error");
      }
    } finally {
      setProfileSaving(false);
    }
  }

  async function handleLogout() {
    try {
      setLoggingOut(true);
      await signOut(getAuth());
      navigate("/login", { replace: true });
    } catch (error) {
      console.error("Logout failed:", error);
      setLoggingOut(false);
    }
  }

  if (!authReady || !user) {
    return <div className={`prism-dashboard-loading ${darkMode ? "dark" : ""}`}><div className="prism-loading-mark"><Sparkles size={28} /></div><p>Preparing your PRISM space...</p></div>;
  }

  return (
    <div className={`prism-dashboard ${darkMode ? "dark" : "light"}`}>
      {profileOpen && <button className="prism-profile-backdrop" aria-label="Close profile menu" onClick={() => setProfileOpen(false)} />}
      <aside className={`prism-profile-sidebar ${profileOpen ? "is-open" : ""}`} aria-hidden={!profileOpen}>
        <div className="prism-profile-sidebar-head">
          <div className="prism-profile-sidebar-title"><span className="prism-profile-avatar">{initials}</span><span><strong>{displayName}</strong><small>PRISM AI member</small></span></div>
          <button type="button" className="prism-icon-button" aria-label="Close profile menu" onClick={() => setProfileOpen(false)}><X size={19} /></button>
        </div>
        <div className="prism-profile-menu">
          <button type="button" className="prism-profile-menu-item" onClick={openProfileEditor}><UserRound size={18} /><span>Edit profile</span><ChevronRight size={16} /></button>
          <button type="button" className="prism-profile-menu-item" onClick={() => { setProfileOpen(false); setSettingsOpen(true); }}><Settings size={18} /><span>Settings</span><ChevronRight size={16} /></button>
          <button type="button" className="prism-profile-menu-item" onClick={() => { setProfileOpen(false); navigate("/help"); }}><CircleHelp size={18} /><span>Help</span><ChevronRight size={16} /></button>
        </div>
        <div className="prism-profile-sidebar-summary">
          <div className="prism-profile-sidebar-progress"><span>PROFILE COMPLETION</span><strong>{profileCompletion.percentage}%</strong></div>
          <div className="prism-profile-progress-track"><span style={{ width: `${profileCompletion.percentage}%` }} /></div>
          <small>{profileComplete ? "Your member profile is complete." : `${profileCompletion.missing.length} details still needed`}</small>
        </div>
        <div className="prism-profile-sidebar-bottom">
          <button type="button" className="prism-profile-logout" onClick={handleLogout} disabled={loggingOut}><LogOut size={18} /><span>{loggingOut ? "Signing out..." : "Logout"}</span></button>
          <small>PRISM AI · Explore. Innovate. Impact.</small>
        </div>
      </aside>

      {settingsOpen && (
        <div className="prism-profile-editor-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) setSettingsOpen(false); }}>
          <section className="prism-settings-panel" role="dialog" aria-modal="true" aria-labelledby="prism-settings-title">
            <div className="prism-profile-editor-head">
              <div><span className="prism-profile-editor-kicker"><Settings size={14} /> PREFERENCES</span><h2 id="prism-settings-title">Dashboard settings</h2><p>Manage how your PRISM AI workspace behaves.</p></div>
              <button type="button" className="prism-icon-button" onClick={() => setSettingsOpen(false)} aria-label="Close settings"><X size={19} /></button>
            </div>
            <div className="prism-settings-row"><span><b>Appearance</b><small>Choose the dashboard colour theme.</small></span><button type="button" className="prism-settings-action" onClick={() => setDarkMode((value) => !value)}>{darkMode ? <Sun size={16}/> : <Moon size={16}/>} {darkMode ? "Switch to light" : "Switch to dark"}</button></div>
            <div className="prism-settings-row"><span><b>Activity notifications</b><small>Allow PRISM AI updates and event reminders.</small></span><button type="button" role="switch" aria-checked={notificationsEnabled} className={`prism-settings-switch ${notificationsEnabled ? "is-on" : ""}`} onClick={() => { const next = !notificationsEnabled; setNotificationsEnabled(next); localStorage.setItem("prism-notifications", String(next)); }}><i /></button></div>
            <div className="prism-settings-row"><span><b>Account email</b><small>{user?.email || "No email available"}</small></span><ShieldCheck size={18} /></div>
            <div className="prism-settings-footer"><button type="button" className="prism-profile-save" onClick={() => setSettingsOpen(false)}>Done</button></div>
          </section>
        </div>
      )}

      {profileEditorOpen && (
        <div className="prism-profile-editor-backdrop" role="presentation" onMouseDown={(event) => {
          if (event.target === event.currentTarget && !profileSaving) setProfileEditorOpen(false);
        }}>
          <section className="prism-profile-editor" role="dialog" aria-modal="true" aria-labelledby="prism-profile-editor-title">
            <div className="prism-profile-editor-head">
              <div>
                <span className="prism-profile-editor-kicker"><UserCircle size={14} /> MEMBER PROFILE</span>
                <h2 id="prism-profile-editor-title">Complete your profile</h2>
                <p>Keep your PRISM AI member details accurate and up to date.</p>
              </div>
              <button type="button" className="prism-icon-button" onClick={() => setProfileEditorOpen(false)} disabled={profileSaving} aria-label="Close profile editor"><X size={19} /></button>
            </div>

            <div className="prism-profile-editor-progress">
              <div className="prism-profile-progress-top">
                <span>Profile completion</span>
                <strong>{getProfileCompletion(profileDraft).percentage}%</strong>
              </div>
              <div className="prism-profile-progress-track"><span style={{ width: `${getProfileCompletion(profileDraft).percentage}%` }} /></div>
              <small>{getProfileCompletion(profileDraft).missing.length} details remaining</small>
            </div>

            <form className="prism-profile-form" onSubmit={saveProfile}>
              <div className="prism-profile-form-grid">
                {PROFILE_FIELDS.map((field) => (
                  <label className={`prism-profile-field ${field.key === "department" ? "is-wide" : ""}`} key={field.key}>
                    <span>{field.label}{field.required && <i>*</i>}</span>
                    {field.type === "select" || field.type === "year" ? (
                      <select value={profileDraft[field.key] || ""} onChange={(event) => updateProfileField(field.key, event.target.value)} required={field.required}>
                        <option value="">{field.type === "year" ? "Select academic year" : "Select semester"}</option>
                        {(field.type === "year" ? ["1st Year", "2nd Year", "3rd Year", "4th Year", "Other"] : Array.from({ length: 8 }, (_, index) => `${index + 1}${["st", "nd", "rd"][index] || "th"} Semester`)).map((option, index) => <option key={option} value={field.type === "year" ? option : `${index + 1}`}>{option}</option>)}
                      </select>
                    ) : (
                      <input
                        type={field.type || "text"}
                        value={profileDraft[field.key] || ""}
                        onChange={(event) => updateProfileField(field.key, field.key === "phone" ? event.target.value.replace(/\D/g, "").slice(0, 10) : event.target.value)}
                        placeholder={field.placeholder}
                        readOnly={field.readOnly}
                        required={false}
                        inputMode={field.key === "phone" ? "numeric" : undefined}
                        maxLength={field.key === "phone" ? 10 : field.key === "name" ? 80 : field.key === "usn" ? 24 : 160}
                        pattern={field.key === "phone" ? "[0-9]{10}" : undefined}
                      />
                    )}
                  </label>
                ))}
              </div>
              <p className="prism-profile-form-note"><ShieldCheck size={15} /> Your registered email is verified through your sign-in account and cannot be edited here.</p>
              {profileMessage && <div className={`prism-profile-form-message is-${profileMessageType}`} role="status">{profileMessage}</div>}
              <div className="prism-profile-editor-actions">
                <button type="button" className="prism-profile-cancel" onClick={() => setProfileEditorOpen(false)} disabled={profileSaving}>Cancel</button>
                <button type="submit" className="prism-profile-save" disabled={profileSaving || profileLoading}>
                  {profileSaving ? "Saving..." : <><Save size={16} /> Save profile</>}
                </button>
              </div>
            </form>
          </section>
        </div>
      )}

      <header className="prism-dash-header">
        <Link to="/dashboard" className="prism-dash-brand">
          <span className="prism-brand-icon"><Sparkles size={23} /></span>
          <span className="prism-brand-copy"><strong>PRISM <span>AI</span></strong><small>Explore. Innovate. Impact.</small></span>
        </Link>
        <div className="prism-dash-header-actions">
          <div className="prism-points-pill" title={pointsError || "Your earned PRISM Points"}><span className="prism-points-sparkle"><Sparkles size={16} /></span><span><small>PRISM POINTS</small><strong>{pointsLoading ? "…" : prismPoints.toLocaleString("en-IN")}</strong></span></div>
          <button type="button" className="prism-icon-button prism-theme-button" onClick={() => setDarkMode((previous) => !previous)} aria-label={darkMode ? "Switch to light mode" : "Switch to dark mode"} title={darkMode ? "Light mode" : "Dark mode"}>{darkMode ? <Sun size={19} /> : <Moon size={19} />}<span>{darkMode ? "Light mode" : "Dark mode"}</span></button>
          <button type="button" className="prism-profile-trigger" onClick={() => setProfileOpen(true)} aria-label="Open profile menu" aria-expanded={profileOpen}><span className="prism-profile-trigger-avatar">{initials || <UserRound size={19} />}</span><ChevronDown size={15} /></button>
        </div>
      </header>

      <main className="prism-dash-main">
        <div className="prism-dash-breadcrumb"><LayoutDashboard size={15} /><span>Dashboard</span><span className="prism-breadcrumb-separator">/</span><span>Overview</span></div>

        {!profileComplete ? (
          <section className="prism-profile-completion-hero" aria-labelledby="prism-profile-completion-title">
            <div className="prism-profile-hero-glow" aria-hidden="true" />
            <div className="prism-profile-hero-copy">
              <span className="prism-profile-hero-eyebrow"><Sparkles size={14} /> YOUR PRISM AI PROFILE</span>
              <h1 id="prism-profile-completion-title">Let’s complete your <em>member profile.</em></h1>
              <p>Add a few details so your PRISM AI profile is ready for events, opportunities and the community.</p>
              <div className="prism-profile-hero-actions">
                <button type="button" onClick={openProfileEditor}>Complete your profile <ArrowUpRight size={17} /></button>
                <span><ShieldCheck size={14} /> Your details stay linked to your account</span>
              </div>
            </div>
            <div className="prism-profile-hero-status">
              <div className="prism-profile-ring" style={{ "--profile-progress": `${profileCompletion.percentage}%` }}>
                <div><strong>{profileCompletion.percentage}%</strong><small>COMPLETE</small></div>
              </div>
              <div className="prism-profile-remaining">
                <strong>{profileCompletion.missing.length} details remaining</strong>
                <ul>
                  {profileCompletion.missing.slice(0, 4).map((field) => <li key={field.key}>{field.label}</li>)}
                  {profileCompletion.missing.length > 4 && <li>+{profileCompletion.missing.length - 4} more details</li>}
                </ul>
              </div>
            </div>
          </section>
        ) : (
          <section className={`prism-promo-hero ${failedImages[activeSlide] ? "has-no-image" : ""}`} aria-label="PRISM AI promotions">
            {!failedImages[activeSlide] && <img className="prism-promo-image" src={currentSlide.image} alt="" onError={() => setFailedImages((old) => ({ ...old, [activeSlide]: true }))} />}
            <div className="prism-promo-overlay" />
            <div className="prism-promo-content" key={activeSlide}>
              <span className="prism-promo-eyebrow"><Sparkles size={14} />{currentSlide.eyebrow}</span>
              <h1>{currentSlide.title}</h1>
              <p>{currentSlide.description}</p>
              <Link to="/events" className="prism-promo-cta">{currentSlide.action}<ArrowUpRight size={17} /></Link>
            </div>
            <div className="prism-promo-controls">
              <button type="button" aria-label="Previous promotion" onClick={() => setActiveSlide((activeSlide - 1 + promoSlides.length) % promoSlides.length)}><ChevronLeft size={18} /></button>
              <div className="prism-promo-dots">{promoSlides.map((slide, index) => <button key={slide.image} type="button" aria-label={`Show promotion ${index + 1}`} aria-current={index === activeSlide ? "true" : undefined} className={index === activeSlide ? "is-active" : ""} onClick={() => setActiveSlide(index)} />)}</div>
              <button type="button" aria-label="Next promotion" onClick={() => setActiveSlide((activeSlide + 1) % promoSlides.length)}><ChevronRight size={18} /></button>
            </div>
            <span className="prism-promo-counter">{String(activeSlide + 1).padStart(2, "0")} <i>/</i> {String(promoSlides.length).padStart(2, "0")}</span>
          </section>
        )}

        <section className="prism-discover-section">
          <div className="prism-section-heading"><div><span className="prism-section-kicker">YOUR WORKSPACE</span><h2>Explore PRISM AI</h2><p>Everything you need, all in one place.</p></div><span className="prism-section-count">{filteredSections.length} {filteredSections.length === 1 ? "section" : "sections"}</span></div>
          <div className="prism-search-wrapper"><Search size={20} className="prism-search-icon" /><input type="search" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search events, projects, AI tools..." aria-label="Search dashboard sections" />{search && <button type="button" className="prism-clear-search" onClick={() => setSearch("")} aria-label="Clear search"><X size={17} /></button>}<kbd>SEARCH</kbd></div>
          <div className="prism-feature-grid">
            {filteredSections.map((section) => {
              const Icon = section.icon;
              return <Link to={section.path} className={`prism-feature-card prism-particle-card accent-${section.color}`} key={section.title}><span className="prism-particle-field" aria-hidden="true">{Array.from({ length: 30 }, (_, index) => <i key={index} style={{ "--particle-start-x": `${(index * 7) % 13}px`, "--particle-start-y": `${(index * 11) % 13}px`, "--particle-drift-x": `${-35 - ((index * 13) % 55)}px`, "--particle-drift-y": `${-35 - ((index * 17) % 55)}px`, "--particle-delay": `${-((index % 18) * 0.13)}s`, "--particle-duration": `${1.8 + (index % 5) * 0.16}s`, "--particle-size": `${2 + (index % 3)}px` }} />)}</span><div className="prism-card-top"><span className="prism-feature-icon"><Icon size={23} strokeWidth={1.9} /></span><span className="prism-card-arrow"><ArrowUpRight size={19} /></span></div><h3>{section.title}</h3><p>{section.description}</p><div className="prism-card-bottom"><span>Explore section</span><span className="prism-card-bottom-arrow">↗</span></div></Link>;
            })}
          </div>
          {filteredSections.length === 0 && <div className="prism-empty-search"><Search size={32} /><h3>No sections found</h3><p>We couldn't find a section matching "{search}". Try another search.</p><button type="button" onClick={() => setSearch("")}>Clear search</button></div>}
        </section>
        <footer className="prism-dash-footer"><span><Sparkles size={14} /> PRISM AI</span><span>Explore. Innovate. Impact.</span></footer>
      </main>
    </div>
  );
}