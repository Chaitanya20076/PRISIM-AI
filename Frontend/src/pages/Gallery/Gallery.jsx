
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ArrowLeft, ArrowRight, ArrowUpRight, CalendarDays, Image as ImageIcon,
  Images, LoaderCircle, Moon, RefreshCw, Search, Sparkles, Sun, X,
} from "lucide-react";
import "./Gallery.css";

const API = (
  import.meta.env.VITE_API_BASE_URL || "http://localhost:5000"
).replace(/\/+$/, "");

const ENDPOINT = `${API}/api/gallery`;

function getImages(item) {
  if (Array.isArray(item.images) && item.images.length) return item.images;

  const url = item.coverImageUrl || item.imageUrl || item.image || item.url;
  return url ? [{ id: item.coverImageId || "legacy-cover", imageUrl: url }] : [];
}

function resolveImage(value) {
  if (!value) return "";
  if (/^https?:\/\//i.test(value) || value.startsWith("data:")) return value;
  return `${API}${value.startsWith("/") ? "" : "/"}${value}`;
}

function dateLabel(value) {
  if (!value) return "Recently added";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "Recently added" : date.toLocaleDateString("en-IN", {
    day: "numeric", month: "short", year: "numeric",
  });
}

function useSiteTheme() {
  const [theme, setTheme] = useState(() => {
    try {
      return localStorage.getItem("prism-theme") ||
        document.documentElement.dataset.theme || "light";
    } catch {
      return "light";
    }
  });

  useEffect(() => {
    const sync = () => {
      try {
        setTheme(localStorage.getItem("prism-theme") ||
          document.documentElement.dataset.theme || "light");
      } catch {
        setTheme(document.documentElement.dataset.theme || "light");
      }
    };

    const observer = new MutationObserver(sync);
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["data-theme"],
    });
    window.addEventListener("storage", sync);
    window.addEventListener("prism-theme-change", sync);

    return () => {
      observer.disconnect();
      window.removeEventListener("storage", sync);
      window.removeEventListener("prism-theme-change", sync);
    };
  }, []);

  const toggleTheme = () => {
    const nextTheme = theme === "dark" ? "light" : "dark";

    try {
      localStorage.setItem("prism-theme", nextTheme);
    } catch {}

    document.documentElement.dataset.theme = nextTheme;
    document.documentElement.style.colorScheme = nextTheme;
    setTheme(nextTheme);
    window.dispatchEvent(
      new CustomEvent("prism-theme-change", { detail: { theme: nextTheme } })
    );
  };

  return {
    theme: theme === "dark" ? "dark" : "light",
    toggleTheme,
  };
}

export default function Gallery() {
  const { theme, toggleTheme } = useSiteTheme();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState(null);
  const [photoIndex, setPhotoIndex] = useState(0);

  const loadGallery = useCallback(async (signal) => {
    setLoading(true);
    setError("");
    try {
      const response = await fetch(ENDPOINT, { signal });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.message || "Could not load gallery.");

      const records = Array.isArray(data) ? data : data.items || [];
      setItems(records.slice().sort(
        (a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0)
      ));
    } catch (e) {
      if (e.name !== "AbortError") setError(e.message || "Unable to load gallery.");
    } finally {
      if (!signal?.aborted) setLoading(false);
    }
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    loadGallery(controller.signal);
    return () => controller.abort();
  }, [loadGallery]);

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return items;
    return items.filter((item) =>
      `${item.title || ""} ${item.caption || ""} ${item.description || ""}`
        .toLowerCase().includes(query)
    );
  }, [items, search]);

  const openPost = (item) => {
    const images = getImages(item);
    const coverIndex = images.findIndex((image) => image.id === item.coverImageId);
    setSelected(item);
    setPhotoIndex(Math.max(0, coverIndex));
  };

  const closePost = () => setSelected(null);

  const movePhoto = (direction) => {
    if (!selected) return;
    const images = getImages(selected);
    if (images.length < 2) return;
    setPhotoIndex((current) => (current + direction + images.length) % images.length);
  };

  useEffect(() => {
    if (!selected) return undefined;

    const onKeyDown = (event) => {
      if (event.key === "Escape") closePost();
      if (event.key === "ArrowLeft") movePhoto(-1);
      if (event.key === "ArrowRight") movePhoto(1);
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [selected]);

  const selectedImages = selected ? getImages(selected) : [];
  const activeImage = selectedImages[photoIndex];

  return (
    <main className={`prism-gallery-public pgg-theme-${theme}`}>
      <div className="pgg-glow pgg-glow-one" aria-hidden="true" />
      <div className="pgg-glow pgg-glow-two" aria-hidden="true" />

      <header className="pgg-site-header">
        <a className="pgg-brand" href="/" aria-label="PRISM AI home">
          <img
            src={theme === "dark" ? "/images/prism-logo-dark.png" : "/images/prism-logo-light.png"}
            alt="PRISM AI"
          />
        </a>

        <nav className="pgg-main-nav" aria-label="Main navigation">
          <a href="/"></a>
          <a href="#pgg-collection"></a>
        </nav>

        <div className="pgg-header-actions">
          <a className="pgg-dashboard-link" href="/dashboard">
            <ArrowLeft size={15} aria-hidden="true" />
            <span>Back to Dashboard</span>
          </a>
          <button
            type="button"
            className="pgg-theme-toggle"
            onClick={toggleTheme}
            aria-label={`Switch to ${theme === "dark" ? "light" : "dark"} mode`}
            title={`Switch to ${theme === "dark" ? "light" : "dark"} mode`}
          >
            {theme === "dark" ? <Sun size={17} /> : <Moon size={17} />}
            <span>{theme === "dark" ? "Light mode" : "Dark mode"}</span>
          </button>
        </div>
      </header>

      <div className="pgg-container">
        <section className="pgg-hero">
          <div className="pgg-hero-copy">
            <span className="pgg-eyebrow"><Sparkles size={14} /> MEMORIES · MOMENTS · MILESTONES</span>
            <h1>Every picture tells<br /><em>a PRISM story.</em></h1>
            <p>A collection of the people, ideas and moments that make PRISM AI what it is. Explore our journey, one frame at a time.</p>
            <a className="pgg-scroll-link" href="#pgg-collection"><span>Explore the collection</span><span>↓</span></a>
          </div>
          <div className="pgg-hero-art" aria-hidden="true">
            <div className="pgg-art-card pgg-art-card-back"><Images size={32} /></div>
            <div className="pgg-art-card pgg-art-card-front"><ImageIcon size={43} /></div>
            <span className="pgg-art-orbit pgg-art-orbit-one" />
            <span className="pgg-art-orbit pgg-art-orbit-two" />
            <span className="pgg-art-particle pgg-art-particle-one" />
            <span className="pgg-art-particle pgg-art-particle-two" />
            <span className="pgg-art-particle pgg-art-particle-three" />
            <span className="pgg-art-particle pgg-art-particle-four" />
            <span className="pgg-art-particle pgg-art-particle-five" />
            <span className="pgg-art-caption">PRISM / ARCHIVE</span>
          </div>
        </section>

        <section className="pgg-collection" id="pgg-collection">
          <div className="pgg-collection-heading">
            <div>
              <span className="pgg-eyebrow">THE COLLECTION</span>
              <h2>Gallery <span className="pgg-count">{items.length}</span></h2>
              <p>Club memories, event highlights and snapshots of what we're building.</p>
            </div>
            <label className="pgg-search">
              <Search size={18} />
              <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search photos…" aria-label="Search gallery" />
              {search && <button type="button" onClick={() => setSearch("")} aria-label="Clear search"><X size={15} /></button>}
            </label>
          </div>

          {loading ? (
            <div className="pgg-state"><LoaderCircle size={30} className="pgg-spin" /><h3>Gathering our memories…</h3><p>Loading the latest photos from PRISM AI.</p></div>
          ) : error ? (
            <div className="pgg-state pgg-state-error"><ImageIcon size={28} /><h3>We couldn't load the gallery</h3><p>{error}</p><button className="pgg-primary-button" type="button" onClick={() => loadGallery()}><RefreshCw size={16} /> Try again</button></div>
          ) : !filtered.length ? (
            <div className="pgg-state"><Images size={28} /><h3>{search ? "No matching posts" : "The story starts here"}</h3><p>{search ? "Try another title or keyword." : "Check back soon for moments from the PRISM AI community."}</p></div>
          ) : (
            <div className="pgg-grid">
              {filtered.map((item, index) => {
                const images = getImages(item);
                const cover = images.find((image) => image.id === item.coverImageId) || images[0];
                return (
                  <article className="pgg-card" key={item.id || index}>
                    <button type="button" className="pgg-card-image-button" onClick={() => openPost(item)} aria-label={`View ${item.title || "gallery post"}`}>
                      {cover ? <img className="pgg-card-image" src={resolveImage(cover.imageUrl)} alt={item.title || "PRISM AI gallery cover"} loading="lazy" /> : <span className="pgg-image-fallback"><ImageIcon size={32} /></span>}
                      <span className="pgg-image-overlay"><span>View photos <ArrowUpRight size={15} /></span></span>
                      {images.length > 1 && <span className="pgg-photo-count"><Images size={13} /> {images.length} photos</span>}
                    </button>
                    <div className="pgg-card-content">
                      <h3>{item.title || "Untitled memory"}</h3>
                      <p className="pgg-card-caption">{item.caption || "A moment from PRISM AI."}</p>
                      <button type="button" className="pgg-view-more" onClick={() => openPost(item)}>View more <ArrowUpRight size={16} /></button>
                    </div>
                  </article>
                );
              })}
            </div>
          )}

          {!loading && !error && filtered.length > 0 && <p className="pgg-gallery-end">You've reached the end of the collection.</p>}
        </section>

        <footer className="pgg-footer"><span className="pgg-footer-mark"><Images size={16} /></span><span>Made of moments. Built by PRISM AI.</span></footer>
      </div>

      {selected && activeImage && (
        <div className="pgg-lightbox" role="presentation" onMouseDown={(e) => { if (e.target === e.currentTarget) closePost(); }}>
          <div className="pgg-lightbox-panel pgg-multi-lightbox" role="dialog" aria-modal="true" aria-label={selected.title || "Gallery post"}>
            <button type="button" className="pgg-lightbox-close" onClick={closePost} aria-label="Close photo"><X size={21} /></button>

            <div className="pgg-viewer">
              <img src={resolveImage(activeImage.imageUrl)} alt={`${selected.title || "Gallery photo"} — ${photoIndex + 1}`} />
              {selectedImages.length > 1 && (
                <>
                  <button type="button" className="pgg-photo-nav pgg-photo-prev" onClick={() => movePhoto(-1)} aria-label="Previous photo"><ArrowLeft size={21} /></button>
                  <button type="button" className="pgg-photo-nav pgg-photo-next" onClick={() => movePhoto(1)} aria-label="Next photo"><ArrowRight size={21} /></button>
                  <span className="pgg-photo-counter">{photoIndex + 1} / {selectedImages.length}</span>
                </>
              )}
            </div>

            <div className="pgg-lightbox-caption">
              <span className="pgg-lightbox-label"><Sparkles size={14} /> PRISM AI · GALLERY</span>
              <h2>{selected.title || "Untitled memory"}</h2>
              {selected.caption && <p className="pgg-modal-caption">{selected.caption}</p>}
              {selected.description && <p className="pgg-modal-description">{selected.description}</p>}
              <span className="pgg-lightbox-date"><CalendarDays size={14} /> {dateLabel(selected.createdAt)}</span>
              {selectedImages.length > 1 && (
                <div className="pgg-viewer-thumbnails">
                  {selectedImages.map((image, index) => (
                    <button type="button" key={image.id || index} className={index === photoIndex ? "active" : ""} onClick={() => setPhotoIndex(index)} aria-label={`Show photo ${index + 1}`}>
                      <img src={resolveImage(image.imageUrl)} alt="" />
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
