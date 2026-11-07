
import { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowLeft, CalendarDays, CheckCircle2, ImagePlus, LoaderCircle,
  Plus, Search, Trash2, Upload, X, Images, AlertCircle,
  Moon, Sun, Star, StarOff,
} from "lucide-react";
import "./DigitalGalleryAdmin.css";

const API = (
  import.meta.env.VITE_API_BASE_URL || "http://localhost:5000"
).replace(/\/+$/, "") + "/api/gallery";

const MAX_IMAGES = 20;
const MAX_BYTES = 10 * 1024 * 1024;

const getToken = () => {
  try {
    return sessionStorage.getItem("prism-admin-token") || "";
  } catch {
    return "";
  }
};

const authHeaders = () =>
  getToken() ? { Authorization: `Bearer ${getToken()}` } : {};

const imageUrl = (value) => {
  if (!value) return "";
  if (/^https?:\/\//i.test(value) || value.startsWith("data:")) return value;
  const base = API.replace(/\/api\/gallery$/, "");
  return `${base}${value.startsWith("/") ? "" : "/"}${value}`;
};

const getImages = (item) => {
  if (Array.isArray(item.images) && item.images.length) return item.images;
  const url = item.coverImageUrl || item.imageUrl || item.image;
  return url ? [{ id: item.coverImageId || "legacy-cover", imageUrl: url }] : [];
};

const dateLabel = (value) => {
  if (!value) return "Date unavailable";
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? "Date unavailable"
    : date.toLocaleDateString("en-IN", {
        day: "numeric", month: "short", year: "numeric",
      });
};

async function readResponse(response) {
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(data.message || `Request failed (${response.status}).`);
  }
  return data;
}

export default function DigitalGalleryAdmin() {
  const navigate = useNavigate();
  const inputRef = useRef(null);
  const addInputRefs = useRef({});
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [busyId, setBusyId] = useState("");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [search, setSearch] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [files, setFiles] = useState([]);
  const [coverIndex, setCoverIndex] = useState(0);
  const [previews, setPreviews] = useState([]);
  const [form, setForm] = useState({
    title: "", caption: "", description: "",
  });
  const [theme, setTheme] = useState(() => {
    try {
      return localStorage.getItem("prism-gallery-admin-theme") === "dark"
        ? "dark" : "light";
    } catch {
      return "light";
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem("prism-gallery-admin-theme", theme);
    } catch {}
  }, [theme]);

  useEffect(() => {
    return () => previews.forEach((url) => {
      if (url.startsWith("blob:")) URL.revokeObjectURL(url);
    });
  }, [previews]);

  const loadGallery = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const data = await readResponse(await fetch(API, {
        headers: authHeaders(),
      }));
      setItems(Array.isArray(data) ? data : data.items || []);
    } catch (e) {
      setError(e.message || "Unable to load gallery.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadGallery(); }, [loadGallery]);

  const resetForm = () => {
    setFiles([]);
    setCoverIndex(0);
    setPreviews((old) => {
      old.forEach((url) => {
        if (url.startsWith("blob:")) URL.revokeObjectURL(url);
      });
      return [];
    });
    setForm({ title: "", caption: "", description: "" });
    if (inputRef.current) inputRef.current.value = "";
  };

  const acceptFiles = (incoming, existing = files) => {
    setError("");
    const valid = [];

    for (const file of incoming) {
      if (!file.type.startsWith("image/") ||
          !["image/jpeg", "image/png", "image/webp", "image/gif"].includes(file.type)) {
        setError("Use JPG, PNG, WEBP, or GIF images only.");
        continue;
      }
      if (file.size > MAX_BYTES) {
        setError(`${file.name} is larger than 10 MB.`);
        continue;
      }
      valid.push(file);
    }

    const remaining = MAX_IMAGES - existing.length;
    const added = valid.slice(0, Math.max(0, remaining));

    if (valid.length > added.length) {
      setError(`A post can contain up to ${MAX_IMAGES} photos.`);
    }

    if (!added.length) return;

    setFiles((old) => [...old, ...added]);
    setPreviews((old) => [...old, ...added.map((file) => URL.createObjectURL(file))]);
  };

  const removeSelectedFile = (index) => {
    setFiles((old) => old.filter((_, i) => i !== index));
    setPreviews((old) => {
      const removed = old[index];
      if (removed?.startsWith("blob:")) URL.revokeObjectURL(removed);
      return old.filter((_, i) => i !== index);
    });
    setCoverIndex((old) => {
      if (index === old) return 0;
      return index < old ? old - 1 : old;
    });
    if (inputRef.current) inputRef.current.value = "";
  };

  const publishPost = async (event) => {
    event.preventDefault();
    setError("");
    setNotice("");

    if (!form.title.trim()) return setError("A title is required.");
    if (form.title.trim().length > 120) return setError("Title limit is 120 characters.");
    if (form.caption.trim().length > 180) return setError("Caption limit is 180 characters.");
    if (form.description.trim().length > 600) return setError("Description limit is 600 characters.");
    if (!files.length) return setError("Choose at least one photo.");

    const payload = new FormData();
    payload.append("title", form.title.trim());
    payload.append("caption", form.caption.trim());
    payload.append("description", form.description.trim());
    files.forEach((file) => payload.append("images", file));

    setSubmitting(true);
    try {
      const data = await readResponse(await fetch(API, {
        method: "POST",
        headers: authHeaders(),
        body: payload,
      }));

      const created = data.item;
      if (created?.id && created.images?.[coverIndex]) {
        const coverId = created.images[coverIndex].id;
        if (coverId) {
          await readResponse(await fetch(`${API}/${created.id}/cover`, {
            method: "PATCH",
            headers: { ...authHeaders(), "Content-Type": "application/json" },
            body: JSON.stringify({ imageId: coverId }),
          }));
        }
      }

      setNotice("Gallery post published successfully.");
      setShowForm(false);
      resetForm();
      await loadGallery();
    } catch (e) {
      setError(e.message || "Could not publish gallery post.");
    } finally {
      setSubmitting(false);
    }
  };

  const addImages = async (item, event) => {
    const chosen = Array.from(event.target.files || []);
    event.target.value = "";
    if (!chosen.length) return;

    const currentCount = getImages(item).length;
    const valid = chosen.filter((file) => {
      const ok = ["image/jpeg", "image/png", "image/webp", "image/gif"].includes(file.type);
      if (!ok || file.size > MAX_BYTES) {
        setError(`${file.name}: use JPG, PNG, WEBP or GIF under 10 MB.`);
        return false;
      }
      return true;
    });

    if (!valid.length) return;
    if (currentCount + valid.length > MAX_IMAGES) {
      setError(`This post can contain up to ${MAX_IMAGES} photos.`);
      return;
    }

    const payload = new FormData();
    valid.forEach((file) => payload.append("images", file));

    setBusyId(item.id);
    setError("");
    setNotice("");
    try {
      await readResponse(await fetch(`${API}/${item.id}/images`, {
        method: "POST",
        headers: authHeaders(),
        body: payload,
      }));
      setNotice("Photos added to the post.");
      await loadGallery();
    } catch (e) {
      setError(e.message || "Could not add photos.");
    } finally {
      setBusyId("");
    }
  };

  const setCover = async (item, image) => {
    setBusyId(item.id);
    setError("");
    setNotice("");
    try {
      await readResponse(await fetch(`${API}/${item.id}/cover`, {
        method: "PATCH",
        headers: { ...authHeaders(), "Content-Type": "application/json" },
        body: JSON.stringify({ imageId: image.id }),
      }));
      setNotice("Cover photo updated.");
      await loadGallery();
    } catch (e) {
      setError(e.message || "Could not change cover.");
    } finally {
      setBusyId("");
    }
  };

  const deletePost = async (item) => {
    if (!window.confirm(`Delete the complete post "${item.title}" and all its photos?`)) return;
    setBusyId(item.id);
    setError("");
    setNotice("");
    try {
      await readResponse(await fetch(`${API}/${item.id}`, {
        method: "DELETE",
        headers: authHeaders(),
      }));
      setItems((old) => old.filter((entry) => entry.id !== item.id));
      setNotice("Post and its photos deleted.");
    } catch (e) {
      setError(e.message || "Could not delete post.");
    } finally {
      setBusyId("");
    }
  };

  const filtered = items.filter((item) =>
    `${item.title || ""} ${item.caption || ""} ${item.description || ""}`
      .toLowerCase().includes(search.trim().toLowerCase())
  );

  return (
    <main className={`prism-gallery-admin ${theme === "dark" ? "admin-theme-dark" : "admin-theme-light"}`}>
      <div className="pga-ambient pga-ambient-one" />
      <div className="pga-ambient pga-ambient-two" />

      <header className="pga-header">
        <button type="button" className="pga-back-button" onClick={() => navigate("/admin/dashboard")}>
          <ArrowLeft size={17} /> <span>Back to dashboard</span>
        </button>
        <div className="pga-brand">
          <span className="pga-brand-mark"><Images size={21} /></span>
          <span><strong>PRISM AI</strong><small>DIGITAL GALLERY</small></span>
        </div>
        <button type="button" className="pga-theme-toggle" onClick={() => setTheme((t) => t === "dark" ? "light" : "dark")}>
          {theme === "dark" ? <Sun size={17} /> : <Moon size={17} />}
          <span>{theme === "dark" ? "Light mode" : "Dark mode"}</span>
        </button>
        <span className="pga-live-label"><span /> Gallery workspace</span>
      </header>

      <div className="pga-content">
        <section className="pga-hero">
          <div>
            <span className="pga-eyebrow">MEMORIES · MOMENTS · MILESTONES</span>
            <h1>Every picture tells<br /><span>a PRISM story.</span></h1>
            <p>Create a gallery post with a title, caption, full description and multiple photos. Choose a cover and add more photos whenever you need.</p>
          </div>
          <div className="pga-hero-art" aria-hidden="true">
            <span className="pga-art-frame pga-art-frame-back" />
            <span className="pga-art-frame pga-art-frame-front"><ImagePlus size={42} /></span>
            <span className="pga-art-dot pga-art-dot-one" />
            <span className="pga-art-dot pga-art-dot-two" />
          </div>
        </section>

        {error && <div className="pga-alert pga-alert-error" role="alert"><AlertCircle size={18} /><span>{error}</span><button type="button" onClick={() => setError("")}><X size={16} /></button></div>}
        {notice && <div className="pga-alert pga-alert-success" role="status"><CheckCircle2 size={18} /><span>{notice}</span><button type="button" onClick={() => setNotice("")}><X size={16} /></button></div>}

        {showForm && (
          <section className="pga-form-panel">
            <div className="pga-panel-heading">
              <div><span className="pga-step-label">NEW GALLERY POST</span><h2>Create a post</h2><p>All selected photos will belong to this one post.</p></div>
              <button type="button" className="pga-icon-button" onClick={() => { setShowForm(false); resetForm(); }}><X size={19} /></button>
            </div>

            <form className="pga-form" onSubmit={publishPost}>
              <label className="pga-field">
                <span>Title <b>*</b></span>
                <input maxLength={120} value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="e.g. PRISM AI Hackathon 2026" required />
                <small>{form.title.length}/120 · Shown as the card title</small>
              </label>
              <label className="pga-field">
                <span>Short caption <b>*</b></span>
                <textarea maxLength={180} rows={3} value={form.caption} onChange={(e) => setForm({ ...form, caption: e.target.value })} placeholder="A short preview shown on the public card…" required />
                <small>{form.caption.length}/180 · Shown before View more</small>
              </label>
              <label className="pga-field">
                <span>Full description</span>
                <textarea maxLength={600} rows={4} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Full story, event details, team members and context…" />
                <small>{form.description.length}/600 · Shown after View more</small>
              </label>

              <div className="pga-multi-upload">
                <div className="pga-multi-upload-heading">
                  <div><strong>Photos</strong><p>Choose the cover using the star on a thumbnail.</p></div>
                  <span>{files.length}/{MAX_IMAGES}</span>
                </div>
                <div className="pga-thumb-grid">
                  {previews.map((src, index) => (
                    <div className={`pga-thumb ${coverIndex === index ? "is-cover" : ""}`} key={`${src}-${index}`}>
                      <img src={src} alt={`Selected photo ${index + 1}`} />
                      {coverIndex === index && <span className="pga-cover-badge">COVER</span>}
                      <button type="button" className="pga-thumb-cover" title="Set as cover" onClick={() => setCoverIndex(index)}>
                        {coverIndex === index ? <Star size={15} fill="currentColor" /> : <StarOff size={15} />}
                      </button>
                      <button type="button" className="pga-thumb-remove" title="Remove photo" onClick={() => removeSelectedFile(index)}><X size={14} /></button>
                    </div>
                  ))}
                  {files.length < MAX_IMAGES && (
                    <button type="button" className="pga-add-thumb" onClick={() => inputRef.current?.click()}>
                      <Plus size={24} /><span>Add photo</span>
                    </button>
                  )}
                </div>
                <input ref={inputRef} className="pga-file-input" type="file" multiple accept="image/jpeg,image/png,image/webp,image/gif" onChange={(e) => { acceptFiles(Array.from(e.target.files || [])); e.target.value = ""; }} />
                <small>JPG, PNG, WEBP or GIF · 10 MB per photo · Maximum 20 photos per post.</small>
              </div>

              <div className="pga-form-actions">
                <button type="button" className="pga-secondary-button" disabled={submitting} onClick={() => { setShowForm(false); resetForm(); }}>Cancel</button>
                <button type="submit" className="pga-primary-button" disabled={submitting}>
                  {submitting ? <><LoaderCircle className="pga-spin" size={17} /> Publishing…</> : <><Upload size={17} /> Publish post</>}
                </button>
              </div>
            </form>
          </section>
        )}

        <section className="pga-gallery-section">
          <div className="pga-gallery-heading">
            <div><span className="pga-step-label">THE COLLECTION</span><h2>Gallery posts <span className="pga-count">{items.length}</span></h2><p>Each card represents one post with its own photo collection.</p></div>
            <div className="pga-gallery-actions">
              <label className="pga-search"><Search size={17} /><input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search posts…" />{search && <button type="button" onClick={() => setSearch("")}><X size={15} /></button>}</label>
              {!showForm && <button type="button" className="pga-primary-button pga-new-button" onClick={() => { resetForm(); setShowForm(true); setError(""); }}><Plus size={18} /> New post</button>}
            </div>
          </div>

          {loading ? (
            <div className="pga-state"><LoaderCircle className="pga-spin" size={28} /><h3>Loading gallery</h3></div>
          ) : !filtered.length ? (
            <div className="pga-state pga-empty-state"><Images size={30} /><h3>{items.length ? "No posts found" : "Your gallery starts here"}</h3><p>{items.length ? "Try another search." : "Create a post and add your first photos."}</p>{!items.length && <button type="button" className="pga-primary-button" onClick={() => setShowForm(true)}><Plus size={17} /> Create first post</button>}</div>
          ) : (
            <div className="pga-photo-grid">
              {filtered.map((item, index) => {
                const images = getImages(item);
                const cover = images.find((image) => image.id === item.coverImageId) || images[0];
                const busy = busyId === item.id;
                return (
                  <article className="pga-photo-card" key={item.id || index} style={{ "--photo-index": index }}>
                    <div className="pga-card-image">
                      {cover ? <img src={imageUrl(cover.imageUrl)} alt={item.title || "Gallery cover"} loading="lazy" /> : <div className="pga-missing-image"><Images size={28} /><span>No cover image</span></div>}
                      <span className="pga-card-date"><CalendarDays size={13} /> {dateLabel(item.createdAt)}</span>
                      <button type="button" className="pga-delete-button" disabled={busy} onClick={() => deletePost(item)} title="Delete entire post"><Trash2 size={16} /></button>
                    </div>
                    <div className="pga-card-copy">
                      <h3>{item.title || "Untitled post"}</h3>
                      <p>{item.caption || item.description || "No caption added."}</p>
                      <span className="pga-card-uploaded"><CheckCircle2 size={14} /> {images.length} photo{images.length === 1 ? "" : "s"}</span>
                    </div>

                    <div className="pga-post-photo-manager">
                      <div className="pga-post-photo-heading"><strong>Photos</strong><span>{images.length}/{MAX_IMAGES}</span></div>
                      <div className="pga-thumb-grid pga-existing-thumbs">
                        {images.map((image, imageIndex) => {
                          const isCover = cover?.id === image.id;
                          return (
                            <div className={`pga-thumb ${isCover ? "is-cover" : ""}`} key={image.id || imageIndex}>
                              <img src={imageUrl(image.imageUrl)} alt={`Photo ${imageIndex + 1}`} />
                              {isCover && <span className="pga-cover-badge">COVER</span>}
                              <button type="button" className="pga-thumb-cover" disabled={busy || isCover} title={isCover ? "Current cover" : "Set as cover"} onClick={() => setCover(item, image)}>
                                <Star size={15} fill={isCover ? "currentColor" : "none"} />
                              </button>
                            </div>
                          );
                        })}
                        {images.length < MAX_IMAGES && (
                          <>
                            <button type="button" className="pga-add-thumb" disabled={busy} onClick={() => addInputRefs.current[item.id]?.click()}>
                              {busy ? <LoaderCircle className="pga-spin" size={20} /> : <Plus size={23} />}
                              <span>Add photo</span>
                            </button>
                            <input
                              ref={(node) => { addInputRefs.current[item.id] = node; }}
                              className="pga-file-input"
                              type="file"
                              multiple
                              accept="image/jpeg,image/png,image/webp,image/gif"
                              onChange={(event) => addImages(item, event)}
                            />
                          </>
                        )}
                      </div>
                      <small>Tap the star to change the cover image.</small>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </section>

        <footer className="pga-footer"><span><span className="pga-footer-mark">P.</span> Explore. Innovate. Impact.</span><span>PRISM AI · DIGITAL GALLERY</span></footer>
      </div>
    </main>
  );
}
