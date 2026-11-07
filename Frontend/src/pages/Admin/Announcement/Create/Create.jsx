
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  ArrowUpRight,
  CalendarDays,
  Check,
  Clock3,
  Eye,
  Megaphone,
  Pin,
  Send,
  Sparkles,
} from "lucide-react";

import "./Create.css";

const API_BASE_URL =
  import.meta.env.VITE_API_URL ||
  import.meta.env.VITE_API_BASE_URL ||
  "http://localhost:5000";
const ANNOUNCEMENTS_API = `${API_BASE_URL}/api/admin/announcements`;

async function announcementRequest(path, options = {}) {
  const token = sessionStorage.getItem("prism-admin-token");
  if (!token) throw new Error("Admin session expired. Please log in again.");

  const response = await fetch(`${ANNOUNCEMENTS_API}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
      ...(options.headers || {}),
    },
  });
  const data = await response.json().catch(() => ({}));
  if (response.status === 401 || response.status === 403) {
    sessionStorage.removeItem("prism-admin-token");
    window.location.href = "/admin";
    throw new Error("Your admin session has expired. Please log in again.");
  }
  if (!response.ok || data.success === false) {
    throw new Error(data.message || "Announcement request failed.");
  }
  return data;
}

const categories = [
  "General",
  "Event",
  "Opportunity",
  "Recruitment",
  "Important",
];

function getLocalDateTime() {
  const now = new Date();
  const offset = now.getTimezoneOffset() * 60000;
  return new Date(now.getTime() - offset).toISOString().slice(0, 16);
}

function readArray(key) {
  try {
    const data = JSON.parse(localStorage.getItem(key) || "[]");
    return Array.isArray(data) ? data : [];
  } catch {
    return [];
  }
}

function formatPreviewDate(value) {
  if (!value) return "Date and time will appear here";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return "Date and time will appear here";

  return date.toLocaleString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export default function Create() {
  const navigate = useNavigate();

  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [category, setCategory] = useState("General");
  const [publishDate, setPublishDate] = useState(getLocalDateTime);
  const [expiryDate, setExpiryDate] = useState("");
  const [pinned, setPinned] = useState(false);
  const [statusMessage, setStatusMessage] = useState("");
  const [saving, setSaving] = useState(false);

  const remainingCharacters = 1200 - body.length;

  function validateForm() {
    if (!title.trim()) {
      setStatusMessage("Please enter an announcement title.");
      return false;
    }

    if (!body.trim()) {
      setStatusMessage("Please write the announcement message.");
      return false;
    }

    if (!publishDate) {
      setStatusMessage("Please select the announcement date and time.");
      return false;
    }

    if (
      expiryDate &&
      new Date(expiryDate).getTime() <= new Date(publishDate).getTime()
    ) {
      setStatusMessage("The expiry date must be after the announcement date.");
      return false;
    }

    return true;
  }

  async function saveAnnouncement(mode) {
    setStatusMessage("");

    if (mode === "published" && !validateForm()) return;
    if (mode === "draft" && !title.trim() && !body.trim()) {
      setStatusMessage("Add a title or message before saving a draft.");
      return;
    }

    setSaving(true);
    try {
      const now = new Date().toISOString();
      const announcement = {
        title: title.trim(),
        body: body.trim(),
        category,
        date: publishDate ? new Date(publishDate).toISOString() : now,
        expiryDate: expiryDate ? new Date(expiryDate).toISOString() : "",
        pinned,
        status: mode,
        updatedAt: now,
      };

      const result = await announcementRequest("", {
        method: "POST",
        body: JSON.stringify(announcement),
      });

      setStatusMessage(
        mode === "published"
          ? "Announcement published successfully!"
          : "Draft saved successfully!"
      );

      if (mode === "published") {
        window.setTimeout(() => navigate("/admin/announcement/manage"), 700);
      }
      return result;
    } catch (error) {
      setStatusMessage(error.message || "Could not save the announcement to Firestore.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <main className="announcement-create-page">
      <div className="announcement-create-shell">
        <button
          type="button"
          className="announcement-create-back"
          onClick={() => navigate("/admin/announcement")}
        >
          <ArrowLeft size={17} />
          Back to announcement dashboard
        </button>

        <header className="announcement-create-header">
          <div>
            <span className="announcement-create-eyebrow">
              <span className="announcement-create-dot" />
              PRISM AI / CREATE
            </span>

            <h1>
              Make an
              <br />
              <span>announcement.</span>
            </h1>

            <p>
              Have something worth sharing? Put it into words and keep
              the PRISM AI community in the loop.
            </p>
          </div>

          <div className="announcement-create-header-icon" aria-hidden="true">
            <Megaphone size={34} strokeWidth={1.5} />
            <span>YOUR VOICE MATTERS</span>
          </div>
        </header>

        <div className="announcement-create-layout">
          <form
            className="announcement-create-form"
            onSubmit={(event) => {
              event.preventDefault();
              saveAnnouncement("published");
            }}
          >
            <div className="announcement-form-heading">
              <div>
                <span className="announcement-form-step">01 / CONTENT</span>
                <h2>What’s the news?</h2>
                <p>Give your announcement a clear title and message.</p>
              </div>

              <Sparkles size={22} aria-hidden="true" />
            </div>

            <div className="announcement-field">
              <label htmlFor="announcement-title">
                Announcement title <span>*</span>
              </label>
              <input
                id="announcement-title"
                type="text"
                value={title}
                onChange={(event) => setTitle(event.target.value)}
                placeholder="e.g. Registrations are now open!"
                maxLength={120}
                required
              />
              <div className="announcement-field-hint">
                <span>Keep it short and easy to understand.</span>
                <span>{title.length}/120</span>
              </div>
            </div>

            <div className="announcement-field">
              <label htmlFor="announcement-body">
                Message <span>*</span>
              </label>
              <textarea
                id="announcement-body"
                value={body}
                onChange={(event) => setBody(event.target.value)}
                placeholder="Tell everyone what they need to know. Include important details, dates, instructions, or next steps."
                rows={7}
                maxLength={1200}
                required
              />
              <div className="announcement-field-hint">
                <span>Make the important details clear.</span>
                <span>{remainingCharacters} characters left</span>
              </div>
            </div>

            <div className="announcement-field">
              <label htmlFor="announcement-category">
                Category <span>*</span>
              </label>
              <select
                id="announcement-category"
                value={category}
                onChange={(event) => setCategory(event.target.value)}
              >
                {categories.map((item) => (
                  <option value={item} key={item}>
                    {item}
                  </option>
                ))}
              </select>
              <p className="announcement-field-description">
                Helps readers understand what the update is about.
              </p>
            </div>

            <div className="announcement-form-divider" />

            <div className="announcement-form-heading">
              <div>
                <span className="announcement-form-step">02 / TIMING</span>
                <h2>When should it appear?</h2>
                <p>Choose when the announcement is dated and when it expires.</p>
              </div>

              <CalendarDays size={22} aria-hidden="true" />
            </div>

            <div className="announcement-date-grid">
              <div className="announcement-field">
                <label htmlFor="announcement-date">
                  Announcement date & time <span>*</span>
                </label>
                <input
                  id="announcement-date"
                  type="datetime-local"
                  value={publishDate}
                  onChange={(event) => setPublishDate(event.target.value)}
                  required
                />
              </div>

              <div className="announcement-field">
                <label htmlFor="announcement-expiry">
                  Expiry date & time <span className="optional-label">OPTIONAL</span>
                </label>
                <input
                  id="announcement-expiry"
                  type="datetime-local"
                  value={expiryDate}
                  min={publishDate || undefined}
                  onChange={(event) => setExpiryDate(event.target.value)}
                />
              </div>
            </div>

            <div className="announcement-pin-option">
              <div className="announcement-pin-icon">
                <Pin size={19} />
              </div>

              <div className="announcement-pin-copy">
                <strong>Pin this announcement</strong>
                <span>
                  Give this update priority in the announcements list.
                </span>
              </div>

              <label className="announcement-switch">
                <input
                  type="checkbox"
                  checked={pinned}
                  onChange={(event) => setPinned(event.target.checked)}
                />
                <span className="announcement-switch-track" />
              </label>
            </div>

            {statusMessage && (
              <div
                className={`announcement-form-status ${
                  statusMessage.includes("successfully")
                    ? "announcement-status-success"
                    : "announcement-status-error"
                }`}
                role="status"
              >
                {statusMessage.includes("successfully") && (
                  <Check size={17} />
                )}
                {statusMessage}
              </div>
            )}

            <div className="announcement-form-actions">
              <button
                type="button"
                className="announcement-save-draft"
                disabled={saving}
                onClick={() => saveAnnouncement("draft")}
              >
                Save as draft
              </button>

              <button
                type="submit"
                className="announcement-publish-button"
                disabled={saving}
              >
                <Send size={16} />
                {saving ? "Saving..." : "Publish announcement"}
                {!saving && <ArrowUpRight size={17} />}
              </button>
            </div>

            <p className="announcement-form-note">
              Publishing makes this announcement available to the
              homepage announcement feed. Drafts are saved separately.
            </p>
          </form>

          <aside className="announcement-preview-column">
            <div className="announcement-preview-heading">
              <span>
                <Eye size={15} />
                LIVE PREVIEW
              </span>
              <span className="announcement-preview-live">PREVIEW</span>
            </div>

            <article className="announcement-preview-card">
              <div className="announcement-preview-top">
                <span className="announcement-preview-category">
                  {category}
                </span>
                {pinned && (
                  <span className="announcement-preview-pinned">
                    <Pin size={12} />
                    PINNED
                  </span>
                )}
              </div>

              <div className="announcement-preview-art" aria-hidden="true">
                <span className="announcement-preview-ring" />
                <span className="announcement-preview-icon">
                  <Megaphone size={25} />
                </span>
                <Sparkles className="announcement-preview-spark" size={16} />
              </div>

              <h3>
                {title.trim() || "Your announcement title goes here"}
              </h3>

              <p>
                {body.trim() ||
                  "Your announcement message will appear here as you type. Make it useful, clear, and easy for everyone to follow."}
              </p>

              <div className="announcement-preview-meta">
                <span>
                  <CalendarDays size={14} />
                  {formatPreviewDate(publishDate)}
                </span>
                {expiryDate && (
                  <span>
                    <Clock3 size={14} />
                    Expires {formatPreviewDate(expiryDate)}
                  </span>
                )}
              </div>

              <div className="announcement-preview-bottom">
                <span>PRISM AI</span>
                <span>EXPLORE. INNOVATE. IMPACT.</span>
              </div>
            </article>

            <div className="announcement-preview-tip">
              <Sparkles size={18} />
              <p>
                <strong>A little tip</strong>
                <br />
                Lead with the most important information. Readers should
                understand the update without having to guess.
              </p>
            </div>
          </aside>
        </div>
      </div>
    </main>
  );
}
