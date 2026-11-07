import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowRight,
  ArrowUpRight,
  BookOpen,
  BrainCircuit,
  CalendarDays,
  CalendarPlus,
  CheckCircle2,
  ChevronRight,
  FileBadge,
  FolderKanban,
  Image as ImageIcon,
  Lightbulb,
  LogOut,
  Megaphone,
  Moon,
  Search,
  ShieldCheck,
  Sparkles,
  Sun,
  Trophy,
  X,
  Users,
  UsersRound,
  ChartNoAxesCombined,
  Command,
  LayoutDashboard,
} from "lucide-react";
import "./AdminDashboard.css";

const API_URL = (
  import.meta.env.VITE_API_URL ||
  import.meta.env.VITE_API_BASE_URL ||
  "http://localhost:5000"
).replace(/\/+$/, "");

const adminModules = [
  {
    id: "events",
    title: "Host an Event",
    description: "Create events, publish schedules, manage registrations and track participants.",
    category: "EVENT MANAGEMENT",
    icon: CalendarPlus,
    accent: "gold",
    action: "Manage events",
    tag: "CORE",
  },
  {
    id: "announcements",
    title: "Announcements",
    description: "Publish important notices, club updates and announcements for students.",
    category: "COMMUNICATION",
    icon: Megaphone,
    accent: "coral",
    action: "Manage announcements",
  },
  {
    id: "recruitment",
    title: "Recruitment",
    description: "Manage recruitment drives, applications, candidate reviews and selections.",
    category: "PEOPLE & TALENT",
    icon: UsersRound,
    accent: "sage",
    action: "Manage recruitment",
    tag: "CORE",
  },
  {
    id: "projects",
    title: "Projects",
    description: "Review project submissions and maintain project details, teams and repositories.",
    category: "INNOVATION",
    icon: FolderKanban,
    accent: "blue",
    action: "Manage projects",
  },
  {
    id: "members",
    title: "Members & Profiles",
    description: "Manage club member information, student profiles and team responsibilities.",
    category: "PEOPLE & TALENT",
    icon: Users,
    accent: "sage",
    action: "Manage members",
  },
  {
    id: "knowledge-hub",
    title: "Knowledge Hub",
    description: "Publish AI learning materials, guides, research resources and tutorials.",
    category: "LEARNING",
    icon: BookOpen,
    accent: "blue",
    action: "Manage resources",
  },
  {
    id: "aiToolOfWeek",
    title: "AI Tool of the Week",
    description: "Feature useful AI tools with descriptions, links and practical use cases.",
    category: "LEARNING",
    icon: Lightbulb,
    accent: "gold",
    action: "Manage AI tools",
  },
  {
    id: "promptverse",
    title: "PromptVerse",
    description: "Manage prompt challenges, submissions, featured entries and participation.",
    category: "CHALLENGES",
    icon: BrainCircuit,
    accent: "coral",
    action: "Manage PromptVerse",
  },
  {
    id: "gallery",
    title: "Digital Gallery",
    description: "Organise event photos, project showcases and club memories.",
    category: "MEDIA",
    icon: ImageIcon,
    accent: "plum",
    action: "Manage gallery",
  },
  {
    id: "community",
    title: "Community",
    description: "Manage community content, participation and student engagement.",
    category: "COMMUNITY",
    icon: UsersRound,
    accent: "sage",
    action: "Manage community",
  },
  {
    id: "certificates",
    title: "Certificates",
    description: "Manage certificate templates and the process for issuing certificates.",
    category: "OPERATIONS",
    icon: FileBadge,
    accent: "blue",
    action: "Manage certificates",
  },
  {
    id: "analytics",
    title: "Impact & Analytics",
    description: "Track engagement, event registrations, participation and content performance.",
    category: "INSIGHTS",
    icon: ChartNoAxesCombined,
    accent: "gold",
    action: "View analytics",
  },
  {
    id: "leaderboard",
    title: "Leaderboard",
    description: "Manage rankings and highlight participation in challenges and competitions.",
    category: "COMMUNITY",
    icon: Trophy,
    accent: "plum",
    action: "Manage leaderboard",
  },
];

const quickStats = [
  { label: "Management areas", value: "13", note: "Available modules", icon: LayoutDashboard },
  { label: "Workspace status", value: "Live", note: "Admin session active", icon: ShieldCheck },
  { label: "Club focus", value: "AI", note: "Explore · Innovate · Impact", icon: BrainCircuit },
];

export default function AdminDashboard() {
  const navigate = useNavigate();
  const [theme, setTheme] = useState(() => {
    try {
      return localStorage.getItem("prism-theme") === "dark" ? "dark" : "light";
    } catch {
      return "light";
    }
  });
  const [checking, setChecking] = useState(true);
  const [authorized, setAuthorized] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState("ALL");

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    try {
      localStorage.setItem("prism-theme", theme);
    } catch {
      // Theme remains active for this page.
    }
    window.dispatchEvent(new CustomEvent("prism-theme-change", { detail: theme }));
  }, [theme]);

  useEffect(() => {
    const controller = new AbortController();

    async function verifySession() {
      const token = sessionStorage.getItem("prism-admin-token");
      if (!token) {
        navigate("/admin", { replace: true });
        return;
      }

      try {
        const response = await fetch(`${API_URL}/api/admin/verify`, {
          headers: { Authorization: `Bearer ${token}` },
          signal: controller.signal,
        });

        if (!response.ok) {
          sessionStorage.removeItem("prism-admin-token");
          navigate("/admin", { replace: true });
          return;
        }
        setAuthorized(true);
      } catch {
        if (!controller.signal.aborted) setAuthorized(false);
      } finally {
        if (!controller.signal.aborted) setChecking(false);
      }
    }

    verifySession();
    return () => controller.abort();
  }, [navigate]);

  const logout = () => {
    sessionStorage.removeItem("prism-admin-token");
    navigate("/admin", { replace: true });
  };

  const categories = useMemo(
    () => ["ALL", ...new Set(adminModules.map((module) => module.category))],
    []
  );

  const filteredModules = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    return adminModules.filter((module) => {
      const matchesCategory = activeCategory === "ALL" || module.category === activeCategory;
      const searchable = `${module.title} ${module.description} ${module.category}`.toLowerCase();
      return matchesCategory && searchable.includes(query);
    });
  }, [searchQuery, activeCategory]);

  const openModule = (moduleId) => {
    const routes = {
      events: "/admin/host",
      announcements: "/admin/announcement",
      recruitment: "/admin/recruitment",
      projects: "/admin/projects",
      competitions: "/admin/host/competition",
      aiToolOfWeek: "/admin/ai-tool-of-week",
      gallery: "/admin/digital-gallery",
      certificates: "/admin/certificates",
    };
    if (routes[moduleId]) navigate(routes[moduleId]);
  };

  if (checking) {
    return (
      <main className={`prism-admin-dashboard admin-theme-${theme}`}>
        <div className="admin-loading-card">
          <span className="admin-loading-mark"><ShieldCheck size={25} /></span>
          <span className="admin-loading-kicker">PRISM AI · ADMIN</span>
          <h2>Verifying secure access</h2>
          <p>Please wait while we verify your administrator session.</p>
          <span className="admin-loading-track"><i /></span>
        </div>
      </main>
    );
  }

  if (!authorized) {
    return (
      <main className={`prism-admin-dashboard admin-theme-${theme}`}>
        <div className="admin-loading-card">
          <span className="admin-loading-mark"><ShieldCheck size={25} /></span>
          <span className="admin-loading-kicker">SESSION INTERRUPTED</span>
          <h2>We couldn't verify your session</h2>
          <p>Check your connection and sign in again to access the admin workspace.</p>
          <button className="admin-primary-action" onClick={logout}>
            Return to sign in <ArrowRight size={16} />
          </button>
        </div>
      </main>
    );
  }

  return (
    <main className={`prism-admin-dashboard admin-theme-${theme}`}>
      <div className="admin-dashboard-grain" aria-hidden="true" />
      <div className="admin-dashboard-ambient admin-ambient-one" aria-hidden="true" />
      <div className="admin-dashboard-ambient admin-ambient-two" aria-hidden="true" />

      <header className="admin-dashboard-header">
        <a href="/" className="admin-dashboard-brand" aria-label="PRISM AI home">
          <span className="admin-dashboard-logo" aria-hidden="true">
            <i /><i /><i />
          </span>
          <span className="admin-dashboard-brand-copy">
            <strong>PRISM AI</strong>
            <small>ADMINISTRATIVE WORKSPACE</small>
          </span>
        </a>

        <div className="admin-header-centre">
          <span className="admin-header-breadcrumb">WORKSPACE</span>
          <ChevronRight size={13} />
          <strong>Overview</strong>
        </div>

        <div className="admin-header-actions">
          <span className="admin-session-indicator">
            <i />
            <span>Secure session</span>
          </span>
          <button
            type="button"
            className="admin-theme-toggle"
            onClick={() => setTheme((current) => current === "dark" ? "light" : "dark")}
            aria-label={`Switch to ${theme === "dark" ? "light" : "dark"} mode`}
            title={`Switch to ${theme === "dark" ? "light" : "dark"} mode`}
          >
            {theme === "dark" ? <Sun size={17} /> : <Moon size={17} />}
            <span>{theme === "dark" ? "Light" : "Dark"}</span>
          </button>
          <button type="button" className="admin-logout-button" onClick={logout}>
            <LogOut size={16} />
            <span>Sign out</span>
          </button>
        </div>
      </header>

      <div className="admin-dashboard-content">
        <section className="admin-dashboard-welcome">
          <div className="admin-welcome-copy">
            <div className="admin-welcome-eyebrow">
              <span className="admin-eyebrow-mark"><Sparkles size={13} /></span>
              <span>THE PRISM AI CONTROL ROOM</span>
              <span className="admin-welcome-live"><i /> ONLINE</span>
            </div>
            <h1>
              Make room for
              <br />
              <span>what's next.</span>
            </h1>
            <p>
              One considered space to shape the club experience — from events
              and announcements to the people and projects moving PRISM AI forward.
            </p>
            <div className="admin-welcome-actions">
              <button type="button" onClick={() => openModule("events")}>
                Create an event <ArrowUpRight size={16} />
              </button>
              <span><ShieldCheck size={14} /> Administrator access verified</span>
            </div>
          </div>

          <div className="admin-welcome-art" aria-hidden="true">
            <div className="admin-art-halo admin-art-halo-one" />
            <div className="admin-art-halo admin-art-halo-two" />
            <div className="admin-art-orbit admin-art-orbit-one" />
            <div className="admin-art-orbit admin-art-orbit-two" />
            <div className="admin-art-core">
              <div className="admin-art-core-inner"><BrainCircuit size={39} /></div>
            </div>
            <span className="admin-art-node admin-art-node-one"><Users size={17} /></span>
            <span className="admin-art-node admin-art-node-two"><CalendarDays size={17} /></span>
            <span className="admin-art-node admin-art-node-three"><Lightbulb size={17} /></span>
            <span className="admin-art-caption">IDEAS IN MOTION <i /></span>
          </div>
          <div className="admin-welcome-index" aria-hidden="true">01 / 03</div>
        </section>

        <section className="admin-stats-row" aria-label="Workspace overview">
          {quickStats.map((stat, index) => {
            const Icon = stat.icon;
            return (
              <article className="admin-stat-card" key={stat.label}>
                <span className={`admin-stat-icon stat-tone-${index}`}><Icon size={18} /></span>
                <div className="admin-stat-copy">
                  <span>{stat.label}</span>
                  <strong>{stat.value}</strong>
                  <small>{stat.note}</small>
                </div>
                <span className="admin-stat-index">0{index + 1}</span>
              </article>
            );
          })}
        </section>

        <section className="admin-modules-section">
          <div className="admin-section-heading">
            <div>
              <span className="admin-section-kicker">THE WORKSPACE</span>
              <h2>Where things happen<span>.</span></h2>
              <p>Choose a department to create, organise or oversee.</p>
            </div>
            <div className="admin-module-count">
              <strong>{String(adminModules.length).padStart(2, "0")}</strong>
              <span>MANAGEMENT AREAS</span>
            </div>
          </div>

          <div className="admin-module-toolbar">
            <label className="admin-module-search">
              <Search size={17} />
              <input
                type="search"
                placeholder="Find a workspace..."
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
                aria-label="Search management modules"
              />
              {searchQuery && (
                <button type="button" onClick={() => setSearchQuery("")} aria-label="Clear search">
                  <X size={15} />
                </button>
              )}
              <kbd><Command size={11} /> K</kbd>
            </label>
            <div className="admin-toolbar-note"><span /> {filteredModules.length} areas shown</div>
          </div>

          <div className="admin-category-filters" aria-label="Filter modules by category">
            {categories.map((category) => (
              <button
                key={category}
                type="button"
                className={activeCategory === category ? "is-active" : ""}
                onClick={() => setActiveCategory(category)}
              >
                {category === "ALL" ? "All areas" : category.toLowerCase().replace(/\b\w/g, (char) => char.toUpperCase())}
              </button>
            ))}
          </div>

          {filteredModules.length > 0 ? (
            <div className="admin-module-grid">
              {filteredModules.map((module, index) => {
                const Icon = module.icon;
                return (
                  <button
                    type="button"
                    className={`admin-module-card accent-${module.accent}`}
                    key={module.id}
                    onClick={() => openModule(module.id)}
                    style={{ "--card-order": index }}
                  >
                    <div className="admin-module-card-top">
                      <span className="admin-module-icon"><Icon size={21} strokeWidth={1.8} /></span>
                      <span className="admin-module-open"><ArrowUpRight size={17} /></span>
                    </div>
                    <div className="admin-module-meta">
                      <span className="admin-module-category">{module.category}</span>
                      {module.tag && <span className="admin-module-tag">{module.tag}</span>}
                    </div>
                    <h3>{module.title}</h3>
                    <p>{module.description}</p>
                    <span className="admin-module-card-footer">
                      <span>{module.action}</span><ArrowRight size={15} />
                    </span>
                  </button>
                );
              })}
            </div>
          ) : (
            <div className="admin-empty-search">
              <Search size={24} />
              <h3>No matching workspaces</h3>
              <p>Try another search term or choose a different category.</p>
              <button type="button" onClick={() => { setSearchQuery(""); setActiveCategory("ALL"); }}>
                Clear filters
              </button>
            </div>
          )}
        </section>

        <footer className="admin-dashboard-footer">
          <div className="admin-footer-brand">
            <span className="admin-footer-mark"><i /><i /><i /></span>
            <span>EXPLORE. INNOVATE. IMPACT.</span>
          </div>
          <span>PRISM AI <i /> RNSIT, BENGALURU</span>
        </footer>
      </div>
    </main>
  );
}
