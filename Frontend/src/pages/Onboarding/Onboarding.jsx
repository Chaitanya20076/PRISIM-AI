import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Sparkles, Moon, Sun, CalendarDays, BrainCircuit, FolderKanban,
  Users, Rocket, ArrowRight, Check, Lightbulb
} from "lucide-react";
import "./Onboarding.css";

const STORY = [
  { title: "Setting up your experience", description: "Making your space feel like yours.", Icon: Sparkles },
  { title: "Finding events around you", description: "Workshops, hackathons and opportunities to explore.", Icon: CalendarDays },
  { title: "Exploring the world of AI", description: "Discover tools, resources and ideas worth trying.", Icon: BrainCircuit },
  { title: "Bringing ideas to life", description: "Explore projects, collaborate and showcase your work.", Icon: FolderKanban },
  { title: "Connecting you with the community", description: "Meet curious minds and make something meaningful.", Icon: Users },
];

function getInitialTheme() {
  try { return localStorage.getItem("prism-theme") || "light"; }
  catch { return "light"; }
}

export default function Onboarding() {
  const navigate = useNavigate();
  const [theme, setTheme] = useState(getInitialTheme);
  const [name, setName] = useState("");
  const [active, setActive] = useState(0);
  const [leaving, setLeaving] = useState(null);
  const [complete, setComplete] = useState(false);
  const [saving, setSaving] = useState(false);
  const timerRef = useRef(null);
  const transitionRef = useRef(null);

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    try { localStorage.setItem("prism-theme", theme); } catch {}
  }, [theme]);

  useEffect(() => {
    let mounted = true;
    import("firebase/auth").then(({ getAuth }) => {
      const user = getAuth().currentUser;
      if (mounted && user) setName(user.displayName || user.email?.split("@")[0] || "");
    }).catch(() => {});
    return () => { mounted = false; };
  }, []);

  useEffect(() => {
    let index = 0;
    timerRef.current = window.setInterval(() => {
      if (index >= STORY.length - 1) {
        window.clearInterval(timerRef.current);
        setComplete(true);
        return;
      }
      const next = index + 1;
      setLeaving(index);
      setActive(next);
      index = next;
      transitionRef.current = window.setTimeout(() => setLeaving(null), 1150);
    }, 2250);

    return () => {
      window.clearInterval(timerRef.current);
      window.clearTimeout(transitionRef.current);
    };
  }, []);

  const finish = async () => {
    setSaving(true);
    try {
      const { getAuth } = await import("firebase/auth");
      const user = getAuth().currentUser;
      const preferences = { completed: true, completedAt: new Date().toISOString(), theme };
      const key = user?.uid ? `prism-onboarding-${user.uid}` : "prism-onboarding-preferences";
      localStorage.setItem(key, JSON.stringify(preferences));
      localStorage.setItem("prism-onboarding-completed", "true");
    } catch {}
    navigate("/dashboard", { replace: true });
  };

  const skip = () => {
    window.clearInterval(timerRef.current);
    window.clearTimeout(transitionRef.current);
    setLeaving(null);
    setActive(STORY.length - 1);
    setComplete(true);
  };

  const CurrentIcon = STORY[active].Icon;
  const LeavingIcon = leaving !== null ? STORY[leaving].Icon : null;

  return (
    <main className={`prism-onboarding prism-onboarding-${theme}`}>
      <div className="po-atmosphere" aria-hidden="true">
        <span className="po-ambient po-ambient-one" />
        <span className="po-ambient po-ambient-two" />
        <span className="po-grain" />
      </div>

      <header className="po-header">
        <button className="po-brand" onClick={() => navigate("/")} aria-label="PRISM AI home">
          <span className="po-brand-mark"><Sparkles size={18} /></span>
          <span>PRISM <b>AI</b></span>
        </button>
        <button className="po-theme-button" onClick={() => setTheme(v => v === "light" ? "dark" : "light")} aria-label="Toggle theme">
          {theme === "light" ? <Moon size={17} /> : <Sun size={17} />}
        </button>
      </header>

      <section className="po-content">
        <div className="po-welcome">
          <span className="po-welcome-kicker"><i /> WELCOME TO PRISM AI</span>
          <h1>Welcome{name ? `, ${name.split(" ")[0]}` : ""}<span>.</span></h1>
          <p>A place to explore ideas, discover new possibilities and create things that matter.</p>
        </div>

        <section className="po-story" aria-live="polite" aria-label="Getting your PRISM AI experience ready">
          <div className="po-story-glow" aria-hidden="true" />
          {leaving !== null && LeavingIcon && (
            <div className="po-story-item po-story-leaving" key={`leaving-${leaving}`}>
              <span className="po-story-icon"><LeavingIcon size={29} strokeWidth={1.65} /></span>
              <h2>{STORY[leaving].title}</h2>
              <p>{STORY[leaving].description}</p>
            </div>
          )}
          <div className="po-story-item po-story-entering" key={`active-${active}`}>
            <span className="po-story-icon"><CurrentIcon size={29} strokeWidth={1.65} /></span>
            <h2>{STORY[active].title}</h2>
            <p>{STORY[active].description}</p>
          </div>
        </section>

        <div className="po-closing">
          <p className="po-motto"><Lightbulb size={15} /> Explore. Innovate. Impact.</p>
          {complete ? (
            <div className="po-completion">
              <span className="po-ready"><span><Check size={13} /></span> Your space is ready</span>
              <button className="po-enter-button" onClick={finish} disabled={saving}>
                {saving ? "Opening PRISM AI..." : "Let's get started"} <ArrowRight size={17} />
              </button>
            </div>
          ) : (
            <button className="po-skip-button" onClick={skip}>Skip intro</button>
          )}
        </div>
      </section>

      <footer className="po-footer">
        <span>© {new Date().getFullYear()} PRISM AI · RNSIT</span>
        <span>BUILT FOR THE CURIOUS</span>
      </footer>
    </main>
  );
}
