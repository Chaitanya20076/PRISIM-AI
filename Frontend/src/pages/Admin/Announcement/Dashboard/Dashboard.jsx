
import { useNavigate } from "react-router-dom";
import {
  Megaphone,
  ClipboardList,
  ArrowUpRight,
  ArrowLeft,
  Plus,
  Settings2,
  Sparkles,
} from "lucide-react";

import "./Dashboard.css";

const dashboardCards = [
  {
    id: "create",
    eyebrow: "CREATE SOMETHING NEW",
    title: "Make an",
    titleAccent: "announcement.",
    description:
      "Share important updates, opportunities, events, and news with the PRISM AI community.",
    action: "Create announcement",
    path: "/admin/announcement/create",
    theme: "green",
    icon: Megaphone,
    symbol: Plus,
    number: "01",
  },
  {
    id: "manage",
    eyebrow: "YOUR UPDATES, IN ONE PLACE",
    title: "Manage",
    titleAccent: "announcements.",
    description:
      "Review published updates, edit existing announcements, and keep your community informed.",
    action: "Manage announcements",
    path: "/admin/announcement/manage",
    theme: "amber",
    icon: ClipboardList,
    symbol: Settings2,
    number: "02",
  },
];

export default function Dashboard() {
  const navigate = useNavigate();

  return (
    <main className="announcement-dashboard">
      <div className="announcement-dashboard-shell">
        <button
  type="button"
  className="announcement-dashboard-back"
  onClick={() => navigate("/admin/dashboard")}
>
  <ArrowLeft size={18} />
  <span>Back</span>
</button>
        <header className="announcement-dashboard-header">
          <div className="announcement-dashboard-heading">
            <span className="announcement-dashboard-eyebrow">
              <span className="announcement-dashboard-status-dot" />
              PRISM AI / ADMINISTRATION
            </span>

            <h1>
              Announcement
              <br />
              <span>dashboard.</span>
            </h1>

            <p>
              Your space to share what matters. Create new announcements
              or manage updates already shared with the community.
            </p>
          </div>

          <div
            className="announcement-dashboard-emblem"
            aria-hidden="true"
          >
            <Megaphone size={36} strokeWidth={1.35} />
            <span>COMMUNICATE</span>
            <span>WITH PURPOSE</span>
          </div>
        </header>

        <div className="announcement-dashboard-section-label">
          <span>
            <span className="announcement-dashboard-section-number">
              01
            </span>
            CHOOSE AN ACTION
          </span>

          <span className="announcement-dashboard-section-note">
            ANNOUNCEMENT MANAGEMENT
          </span>
        </div>

        <section
          className="announcement-dashboard-grid"
          aria-label="Announcement actions"
        >
          {dashboardCards.map((card) => {
            const Icon = card.icon;
            const Symbol = card.symbol;

            return (
              <button
                type="button"
                key={card.id}
                className={`announcement-action-card announcement-card-${card.theme}`}
                onClick={() => navigate(card.path)}
              >
                <div className="announcement-action-top">
                  <span className="announcement-action-number">
                    {card.number} / 02
                  </span>

                  <span className="announcement-action-icon">
                    <Icon size={23} strokeWidth={1.7} />
                  </span>
                </div>

                <div
                  className="announcement-action-art"
                  aria-hidden="true"
                >
                  <span className="announcement-art-ring announcement-art-ring-one" />
                  <span className="announcement-art-ring announcement-art-ring-two" />

                  <span className="announcement-art-center">
                    <Symbol size={30} strokeWidth={1.5} />
                  </span>

                  <Sparkles
                    className="announcement-art-spark"
                    size={19}
                  />
                </div>

                <div className="announcement-action-content">
                  <span className="announcement-action-eyebrow">
                    {card.eyebrow}
                  </span>

                  <h2>
                    {card.title}
                    <br />
                    <span>{card.titleAccent}</span>
                  </h2>

                  <p>{card.description}</p>
                </div>

                <div className="announcement-action-footer">
                  <span>{card.action}</span>

                  <span className="announcement-action-arrow">
                    <ArrowUpRight size={19} />
                  </span>
                </div>
              </button>
            );
          })}
        </section>

        <footer className="announcement-dashboard-footer">
          <span>GOOD COMMUNICATION BUILDS GREAT COMMUNITIES.</span>
          <span className="announcement-dashboard-footer-mark">
            P.
          </span>
        </footer>
      </div>
    </main>
  );
}
