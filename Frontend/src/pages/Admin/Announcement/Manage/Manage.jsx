
import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  ArrowUpRight,
  CalendarDays,
  Check,
  Clock3,
  FileEdit,
  Filter,
  Megaphone,
  Pin,
  Plus,
  Search,
  Send,
  Trash2,
  X,
  Archive,
  Eye,
} from "lucide-react";

import "./Manage.css";

const API_BASE_URL =
  import.meta.env.VITE_API_URL ||
  import.meta.env.VITE_API_BASE_URL ||
  "http://localhost:5000";
const ANNOUNCEMENTS_API = `${API_BASE_URL}/api/admin/announcements`;

async function announcementRequest(path = "", options = {}) {
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

const FILTERS = [
  { label: "All", value: "all" },
  { label: "Published", value: "published" },
  { label: "Drafts", value: "draft" },
  { label: "Scheduled", value: "scheduled" },
  { label: "Expired", value: "expired" },
];

function getDateValue(item) {
  const value = item.date || item.publishDate || item.createdAt;
  const date = value ? new Date(value) : null;

  return date && !Number.isNaN(date.getTime()) ? date : null;
}

function getStatus(item, now = Date.now()) {
  if (item.status === "draft") return "draft";

  const publishDate = getDateValue(item);
  const expiryDate = item.expiryDate ? new Date(item.expiryDate) : null;

  if (
    expiryDate &&
    !Number.isNaN(expiryDate.getTime()) &&
    expiryDate.getTime() <= now
  ) {
    return "expired";
  }

  if (publishDate && publishDate.getTime() > now) {
    return "scheduled";
  }

  return "published";
}

function formatDate(value) {
  if (!value) return "Date not set";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Date not set";

  return date.toLocaleString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function createId() {
  return globalThis.crypto?.randomUUID?.() || `announcement-${Date.now()}`;
}

export default function Manage() {
  const navigate = useNavigate();

  const [announcements, setAnnouncements] = useState([]);
  const [activeFilter, setActiveFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [editing, setEditing] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function loadAnnouncements() {
    setError("");
    try {
      const data = await announcementRequest();
      const items = Array.isArray(data.announcements) ? data.announcements : [];
      setAnnouncements(
        items.sort((a, b) => {
          if (Boolean(a.pinned) !== Boolean(b.pinned)) return a.pinned ? -1 : 1;
          return (getDateValue(b)?.getTime() || 0) - (getDateValue(a)?.getTime() || 0);
        })
      );
    } catch (requestError) {
      setError(requestError.message || "Could not load announcements from Firestore.");
    }
  }

  useEffect(() => {
    loadAnnouncements();
  }, []);

  const counts = useMemo(() => {
    const result = {
      all: announcements.length,
      published: 0,
      draft: 0,
      scheduled: 0,
      expired: 0,
    };

    announcements.forEach((item) => {
      result[getStatus(item)] += 1;
    });

    return result;
  }, [announcements]);

  const categories = useMemo(
    () => [...new Set(announcements.map((item) => item.category).filter(Boolean))],
    [announcements]
  );

  const visibleAnnouncements = useMemo(() => {
    const term = search.trim().toLowerCase();

    return announcements.filter((item) => {
      const status = getStatus(item);
      const matchesFilter =
        activeFilter === "all" || status === activeFilter;
      const matchesCategory =
        categoryFilter === "all" || item.category === categoryFilter;
      const matchesSearch =
        !term ||
        [item.title, item.body, item.message, item.category]
          .filter(Boolean)
          .some((value) => String(value).toLowerCase().includes(term));

      return matchesFilter && matchesCategory && matchesSearch;
    });
  }, [announcements, activeFilter, categoryFilter, search]);

  async function saveRecord(record, targetStatus = record.status) {
    setError("");
    setNotice("");
    try {
      const cleanRecord = { ...record, status: targetStatus, updatedAt: new Date().toISOString() };
      delete cleanRecord._storage;
      await announcementRequest(`/${encodeURIComponent(record.id)}`, {
        method: "PUT",
        body: JSON.stringify(cleanRecord),
      });
      await loadAnnouncements();
      setNotice(targetStatus === "draft" ? "Draft saved." : "Announcement updated successfully.");
      return true;
    } catch (requestError) {
      setError(requestError.message || "Could not save changes to Firestore.");
      return false;
    }
  }

  async function handleEditSubmit(event) {
    event.preventDefault();

    if (!editing.title.trim() || !editing.body.trim()) {
      setError("Title and message are required.");
      return;
    }

    if (!editing.date) {
      setError("Please set an announcement date and time.");
      return;
    }

    if (
      editing.expiryDate &&
      new Date(editing.expiryDate).getTime() <=
        new Date(editing.date).getTime()
    ) {
      setError("Expiry must be later than the announcement date.");
      return;
    }

    setBusy(true);
    const success = await saveRecord(
      { ...editing, updatedAt: new Date().toISOString() },
      editing.status === "draft" ? "draft" : "published"
    );
    setBusy(false);
    if (success) setEditing(null);
  }

  async function togglePin(item) {
    const updated = {
      ...item,
      pinned: !item.pinned,
      updatedAt: new Date().toISOString(),
    };

    const success = await saveRecord(updated, item.status === "draft" ? "draft" : "published");
    if (success) setNotice(updated.pinned ? "Announcement pinned." : "Announcement unpinned.");
  }

  async function publishDraft(item) {
    const date = getDateValue(item);

    if (!item.title?.trim() || !(item.body || item.message)?.trim()) {
      setError("This draft needs a title and message before publishing.");
      return;
    }

    if (!date) {
      setError("Edit this draft and set its announcement date first.");
      return;
    }

    if (
      item.expiryDate &&
      new Date(item.expiryDate).getTime() <= date.getTime()
    ) {
      setError("Edit this draft and set a valid expiry date.");
      return;
    }

    await saveRecord(
      {
        ...item,
        body: item.body || item.message || "",
        date: date.toISOString(),
        updatedAt: new Date().toISOString(),
      },
      "published"
    );
  }

  async function unpublish(item) {
    await saveRecord(
      { ...item, updatedAt: new Date().toISOString() },
      "draft"
    );
  }

  async function deleteAnnouncement() {
    if (!deleteTarget) return;
    setBusy(true);
    try {
      await announcementRequest(`/${encodeURIComponent(deleteTarget.id)}`, { method: "DELETE" });
      setDeleteTarget(null);
      setError("");
      setNotice("Announcement deleted.");
      await loadAnnouncements();
    } catch (requestError) {
      setError(requestError.message || "Could not delete this announcement.");
      setDeleteTarget(null);
    } finally {
      setBusy(false);
    }
  }

  function openEditor(item) {
    const date = getDateValue(item);

    setError("");
    setEditing({
      ...item,
      title: item.title || "",
      body: item.body || item.message || "",
      category: item.category || "General",
      date: date
        ? new Date(date.getTime() - date.getTimezoneOffset() * 60000)
            .toISOString()
            .slice(0, 16)
        : "",
      expiryDate: item.expiryDate
        ? (() => {
            const value = new Date(item.expiryDate);
            return Number.isNaN(value.getTime())
              ? ""
              : new Date(
                  value.getTime() - value.getTimezoneOffset() * 60000
                )
                  .toISOString()
                  .slice(0, 16);
          })()
        : "",
    });
  }

  return (
    <main className="announcement-manage-page">
      <div className="announcement-manage-shell">
        <button
          type="button"
          className="announcement-manage-back"
          onClick={() => navigate("/admin/announcement")}
        >
          <ArrowLeft size={16} />
          Back to announcement dashboard
        </button>

        <header className="announcement-manage-header">
          <div>
            <span className="announcement-manage-eyebrow">
              <span />
              PRISM AI / CONTENT MANAGEMENT
            </span>
            <h1>
              Manage your
              <br />
              <span>announcements.</span>
            </h1>
            <p>
              Keep every update organised. Edit published posts, revisit
              drafts, and make sure the right information reaches your community.
            </p>
          </div>

          <button
            type="button"
            className="announcement-manage-create-button"
            onClick={() => navigate("/admin/announcement/create")}
          >
            <Plus size={17} />
            New announcement
            <ArrowUpRight size={16} />
          </button>
        </header>

        <section className="announcement-manage-stats" aria-label="Announcement counts">
          <div className="announcement-manage-stat">
            <span className="announcement-manage-stat-icon">
              <Megaphone size={19} />
            </span>
            <div>
              <span>Total announcements</span>
              <strong>{counts.all}</strong>
            </div>
          </div>

          <div className="announcement-manage-stat">
            <span className="announcement-manage-stat-icon">
              <Check size={19} />
            </span>
            <div>
              <span>Published</span>
              <strong>{counts.published}</strong>
            </div>
          </div>

          <div className="announcement-manage-stat">
            <span className="announcement-manage-stat-icon">
              <FileEdit size={19} />
            </span>
            <div>
              <span>Drafts</span>
              <strong>{counts.draft}</strong>
            </div>
          </div>

          <div className="announcement-manage-stat">
            <span className="announcement-manage-stat-icon">
              <Clock3 size={19} />
            </span>
            <div>
              <span>Scheduled</span>
              <strong>{counts.scheduled}</strong>
            </div>
          </div>
        </section>

        {notice && (
          <div className="announcement-manage-notice" role="status">
            <Check size={16} />
            {notice}
            <button type="button" onClick={() => setNotice("")} aria-label="Dismiss message">
              <X size={15} />
            </button>
          </div>
        )}

        {error && !editing && (
          <div className="announcement-manage-error" role="alert">
            {error}
            <button type="button" onClick={() => setError("")} aria-label="Dismiss error">
              <X size={15} />
            </button>
          </div>
        )}

        <section className="announcement-manage-workspace">
          <div className="announcement-manage-toolbar">
            <div className="announcement-manage-toolbar-heading">
              <h2>Your announcements</h2>
              <span>{visibleAnnouncements.length} shown</span>
            </div>

            <div className="announcement-manage-search">
              <Search size={17} />
              <input
                type="search"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search announcements..."
                aria-label="Search announcements"
              />
            </div>
          </div>

          <div className="announcement-manage-filters">
            <div className="announcement-manage-filter-list">
              {FILTERS.map((filter) => (
                <button
                  type="button"
                  key={filter.value}
                  className={
                    activeFilter === filter.value
                      ? "announcement-manage-filter active"
                      : "announcement-manage-filter"
                  }
                  onClick={() => setActiveFilter(filter.value)}
                >
                  {filter.label}
                  <span>{counts[filter.value]}</span>
                </button>
              ))}
            </div>

            <label className="announcement-manage-category-filter">
              <Filter size={14} />
              <select
                value={categoryFilter}
                onChange={(event) => setCategoryFilter(event.target.value)}
                aria-label="Filter by category"
              >
                <option value="all">All categories</option>
                {categories.map((category) => (
                  <option key={category} value={category}>
                    {category}
                  </option>
                ))}
              </select>
            </label>
          </div>

          {visibleAnnouncements.length === 0 ? (
            <div className="announcement-manage-empty">
              <span className="announcement-manage-empty-icon">
                <Megaphone size={29} />
              </span>
              <h3>
                {announcements.length === 0
                  ? "No announcements yet."
                  : "No matching announcements."}
              </h3>
              <p>
                {announcements.length === 0
                  ? "Your updates will appear here after you create an announcement or save a draft."
                  : "Try another search or filter to find what you’re looking for."}
              </p>
              {announcements.length === 0 && (
                <button
                  type="button"
                  className="announcement-manage-create-button"
                  onClick={() => navigate("/admin/announcement/create")}
                >
                  <Plus size={16} />
                  Create your first announcement
                  <ArrowUpRight size={16} />
                </button>
              )}
            </div>
          ) : (
            <div className="announcement-manage-list">
              {visibleAnnouncements.map((item) => {
                const status = getStatus(item);
                const date = getDateValue(item);
                const message = item.body || item.message || "";

                return (
                  <article
                    key={item.id}
                    className={`announcement-manage-item status-${status}`}
                  >
                    <div className="announcement-manage-item-mark">
                      <Megaphone size={20} />
                    </div>

                    <div className="announcement-manage-item-main">
                      <div className="announcement-manage-item-badges">
                        <span className={`announcement-manage-status status-badge-${status}`}>
                          {status === "draft" && <FileEdit size={12} />}
                          {status === "published" && <Check size={12} />}
                          {status === "scheduled" && <Clock3 size={12} />}
                          {status === "expired" && <Archive size={12} />}
                          {status.charAt(0).toUpperCase() + status.slice(1)}
                        </span>

                        {item.category && (
                          <span className="announcement-manage-category">
                            {item.category}
                          </span>
                        )}

                        {item.pinned && (
                          <span className="announcement-manage-pinned">
                            <Pin size={11} />
                            Pinned
                          </span>
                        )}
                      </div>

                      <h3>{item.title || "Untitled announcement"}</h3>

                      <p className="announcement-manage-item-description">
                        {message || "No message added."}
                      </p>

                      <div className="announcement-manage-item-meta">
                        <span>
                          <CalendarDays size={13} />
                          {formatDate(date)}
                        </span>

                        {item.expiryDate && (
                          <span>
                            <Clock3 size={13} />
                            Expires {formatDate(item.expiryDate)}
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="announcement-manage-item-actions">
                      <button
                        type="button"
                        className="announcement-manage-action"
                        onClick={() => openEditor(item)}
                        title="Edit announcement"
                        aria-label={`Edit ${item.title || "announcement"}`}
                      >
                        <FileEdit size={16} />
                        <span>Edit</span>
                      </button>

                      {status === "draft" ? (
                        <button
                          type="button"
                          className="announcement-manage-action action-publish"
                          onClick={() => publishDraft(item)}
                          title="Publish announcement"
                        >
                          <Send size={15} />
                          <span>Publish</span>
                        </button>
                      ) : (
                        <button
                          type="button"
                          className="announcement-manage-action"
                          onClick={() => unpublish(item)}
                          title="Move announcement to drafts"
                        >
                          <Archive size={15} />
                          <span>Unpublish</span>
                        </button>
                      )}

                      <button
                        type="button"
                        className={
                          item.pinned
                            ? "announcement-manage-action action-pinned"
                            : "announcement-manage-action"
                        }
                        onClick={() => togglePin(item)}
                        title={item.pinned ? "Unpin announcement" : "Pin announcement"}
                        aria-label={item.pinned ? "Unpin announcement" : "Pin announcement"}
                      >
                        <Pin size={15} />
                        <span>{item.pinned ? "Unpin" : "Pin"}</span>
                      </button>

                      <button
                        type="button"
                        className="announcement-manage-action action-delete"
                        onClick={() => setDeleteTarget(item)}
                        title="Delete announcement"
                        aria-label={`Delete ${item.title || "announcement"}`}
                      >
                        <Trash2 size={15} />
                        <span>Delete</span>
                      </button>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </section>

        <footer className="announcement-manage-footer">
          <span>GOOD COMMUNICATION BUILDS GREAT COMMUNITIES.</span>
          <span className="announcement-manage-footer-mark">P.</span>
        </footer>
      </div>

      {editing && (
        <div
          className="announcement-manage-modal-backdrop"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) setEditing(null);
          }}
        >
          <section
            className="announcement-manage-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="announcement-edit-title"
          >
            <div className="announcement-manage-modal-header">
              <div>
                <span>EDIT CONTENT</span>
                <h2 id="announcement-edit-title">Update announcement</h2>
              </div>
              <button
                type="button"
                onClick={() => setEditing(null)}
                aria-label="Close editor"
              >
                <X size={19} />
              </button>
            </div>

            <form onSubmit={handleEditSubmit}>
              <label>
                Title *
                <input
                  value={editing.title}
                  onChange={(event) =>
                    setEditing({ ...editing, title: event.target.value })
                  }
                  maxLength={120}
                  required
                />
              </label>

              <label>
                Message *
                <textarea
                  value={editing.body}
                  onChange={(event) =>
                    setEditing({ ...editing, body: event.target.value })
                  }
                  rows={6}
                  maxLength={1200}
                  required
                />
              </label>

              <label>
                Category
                <select
                  value={editing.category}
                  onChange={(event) =>
                    setEditing({ ...editing, category: event.target.value })
                  }
                >
                  {["General", "Event", "Opportunity", "Recruitment", "Important"].map(
                    (category) => (
                      <option value={category} key={category}>
                        {category}
                      </option>
                    )
                  )}
                </select>
              </label>

              <div className="announcement-manage-modal-date-grid">
                <label>
                  Announcement date & time *
                  <input
                    type="datetime-local"
                    value={editing.date}
                    onChange={(event) =>
                      setEditing({ ...editing, date: event.target.value })
                    }
                    required
                  />
                </label>

                <label>
                  Expiry date & time
                  <input
                    type="datetime-local"
                    value={editing.expiryDate}
                    min={editing.date || undefined}
                    onChange={(event) =>
                      setEditing({ ...editing, expiryDate: event.target.value })
                    }
                  />
                </label>
              </div>

              <label className="announcement-manage-modal-pin">
                <input
                  type="checkbox"
                  checked={Boolean(editing.pinned)}
                  onChange={(event) =>
                    setEditing({ ...editing, pinned: event.target.checked })
                  }
                />
                Pin this announcement
              </label>

              {error && (
                <p className="announcement-manage-modal-error" role="alert">
                  {error}
                </p>
              )}

              <div className="announcement-manage-modal-actions">
                <button
                  type="button"
                  className="modal-cancel"
                  onClick={() => {
                    setEditing(null);
                    setError("");
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="modal-save"
                  disabled={busy}
                >
                  <Check size={16} />
                  {busy ? "Saving..." : "Save changes"}
                </button>
              </div>
            </form>
          </section>
        </div>
      )}

      {deleteTarget && (
        <div
          className="announcement-manage-modal-backdrop"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) setDeleteTarget(null);
          }}
        >
          <section
            className="announcement-manage-confirm"
            role="alertdialog"
            aria-modal="true"
            aria-labelledby="announcement-delete-title"
          >
            <span className="announcement-manage-delete-icon">
              <Trash2 size={23} />
            </span>
            <h2 id="announcement-delete-title">Delete this announcement?</h2>
            <p>
              “{deleteTarget.title || "Untitled announcement"}” will be
              permanently removed from the PRISM AI announcement database.
            </p>
            <div className="announcement-manage-modal-actions">
              <button
                type="button"
                className="modal-cancel"
                onClick={() => setDeleteTarget(null)}
              >
                Keep it
              </button>
              <button
                type="button"
                className="modal-delete"
                onClick={deleteAnnouncement}
              >
                <Trash2 size={15} />
                Delete permanently
              </button>
            </div>
          </section>
        </div>
      )}
    </main>
  );
}
