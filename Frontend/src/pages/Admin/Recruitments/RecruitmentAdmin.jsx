
import { useEffect, useMemo, useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  BriefcaseBusiness,
  CalendarDays,
  Check,
  ChevronDown,
  ClipboardList,
  Eye,
  FilePlus2,
  FileText,
  GripVertical,
  LayoutTemplate,
  Palette,
  Plus,
  Save,
  Search,
  Settings2,
  Moon,
  Sun,
  Trash2,
  Users,
  X,
} from "lucide-react";
import "./RecruitmentAdmin.css";

const DRIVE_KEY = "prism-recruitment-drives-v1";
const APPLICANTS_KEY = "prism-recruitment-applicants-v1";

const DEFAULT_COLORS = {
  primary: "#dc9750",
  header: "#1e2640",
  background: "#f5f3ee",
  card: "#ffffff",
  text: "#252a38",
};

const emptyForm = () => ({
  id: "",
  title: "",
  subtitle: "",
  roleName: "",
  responsibilities: "",
  expectations: "",
  eligibility: "",
  additionalInfo: "",
  procedure: "",
  audience: "All RNSIT students",
  startDate: "",
  endDate: "",
  deadline: "",
  status: "draft",
  colors: { ...DEFAULT_COLORS },
  sections: [
    {
      id: crypto.randomUUID(),
      title: "About you",
      description: "Tell us a little about yourself.",
      questions: [
        {
          id: crypto.randomUUID(),
          label: "Full name",
          type: "text",
          required: true,
          options: "",
        },
        {
          id: crypto.randomUUID(),
          label: "College email address",
          type: "email",
          required: true,
          options: "",
        },
        {
          id: crypto.randomUUID(),
          label: "Phone number",
          type: "tel",
          required: true,
          options: "",
        },
        {
          id: crypto.randomUUID(),
          label: "Year of study",
          type: "select",
          required: true,
          options: "1st year\n2nd year\n3rd year\n4th year",
        },
        {
          id: crypto.randomUUID(),
          label: "Why are you interested in this role?",
          type: "textarea",
          required: true,
          options: "",
        },
      ],
    },
  ],
});

const readArray = (key) => {
  try {
    const value = JSON.parse(localStorage.getItem(key) || "[]");
    return Array.isArray(value) ? value : [];
  } catch {
    return [];
  }
};

const makeId = () =>
  globalThis.crypto?.randomUUID?.() ||
  `recruitment-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;

const formatDate = (value) => {
  if (!value) return "Not set";
  const date = new Date(`${value}T00:00:00`);
  return Number.isNaN(date.getTime())
    ? value
    : date.toLocaleDateString("en-IN", {
        day: "numeric",
        month: "short",
        year: "numeric",
      });
};

const STATUS_LABELS = {
  draft: "Draft",
  published: "Published",
  closed: "Closed",
};

const STAGES = [
  "Applied",
  "Shortlisted",
  "Interview",
  "Selected",
  "Rejected",
];

export default function RecruitmentAdmin() {
  const [view, setView] = useState("home");
  const [drives, setDrives] = useState(() => readArray(DRIVE_KEY));
  const [applicants, setApplicants] = useState(() =>
    readArray(APPLICANTS_KEY)
  );
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState(null);
  const [selectedDrive, setSelectedDrive] = useState(null);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [showPreview, setShowPreview] = useState(false);
  const [notice, setNotice] = useState("");
  const [showResultsModal, setShowResultsModal] = useState(false);
  const [resultsDraft, setResultsDraft] = useState({
    header: "Recruitment results",
    description: "Congratulations to the candidates who have progressed. Please review the status updates below.",
    statuses: ["Shortlisted", "Selected"],
    showName: true,
    showStatus: true,
    showEmail: false,
    showPhone: false,
    showPublishedDate: true,
    questionIds: [],
    theme: "prism",
  });
  const [isDarkMode, setIsDarkMode] = useState(() => {
    const savedTheme = localStorage.getItem("prism-theme");
    const activeTheme = document.documentElement.dataset.theme || savedTheme || "light";
    return activeTheme === "dark";
  });

  // Keep the recruitment page in sync with PRISM AI's shared theme setting.
  useEffect(() => {
    const activeTheme = document.documentElement.dataset.theme || localStorage.getItem("prism-theme") || "light";
    setIsDarkMode(activeTheme === "dark");
  }, []);

  const toggleTheme = () => {
    const currentTheme = document.documentElement.dataset.theme || localStorage.getItem("prism-theme") || "light";
    const nextTheme = currentTheme === "dark" ? "light" : "dark";
    document.documentElement.dataset.theme = nextTheme;
    localStorage.setItem("prism-theme", nextTheme);
    setIsDarkMode(nextTheme === "dark");
  };

  useEffect(() => {
    localStorage.setItem(DRIVE_KEY, JSON.stringify(drives));
  }, [drives]);

  useEffect(() => {
    localStorage.setItem(APPLICANTS_KEY, JSON.stringify(applicants));
  }, [applicants]);

  const filteredDrives = useMemo(() => {
    return drives.filter((drive) => {
      const matchesSearch = `${drive.roleName} ${drive.title}`
        .toLowerCase()
        .includes(search.toLowerCase());
      const matchesStatus =
        statusFilter === "all" || drive.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [drives, search, statusFilter]);

  const selectedApplicants = useMemo(
    () => applicants.filter((item) => item.driveId === selectedDrive),
    [applicants, selectedDrive]
  );

  const updateForm = (key, value) => {
    setForm((previous) => ({ ...previous, [key]: value }));
  };

  const updateColors = (key, value) => {
    setForm((previous) => ({
      ...previous,
      colors: { ...previous.colors, [key]: value },
    }));
  };

  const openCreate = () => {
    setEditingId(null);
    setForm(emptyForm());
    setShowPreview(false);
    setView("builder");
  };

  const openEdit = (drive) => {
    setEditingId(drive.id);
    setForm({
      ...emptyForm(),
      ...drive,
      colors: { ...DEFAULT_COLORS, ...drive.colors },
      sections: Array.isArray(drive.sections)
        ? drive.sections
        : emptyForm().sections,
    });
    setShowPreview(false);
    setView("builder");
  };

  const saveDrive = (status) => {
    if (!form.roleName.trim()) {
      setNotice("Please enter the role name before saving.");
      return;
    }

    if (!form.title.trim()) {
      setNotice("Please add a title for the applicant-facing form.");
      return;
    }

    const now = new Date().toISOString();
    const record = {
      ...form,
      id: editingId || form.id || makeId(),
      roleName: form.roleName.trim(),
      title: form.title.trim(),
      status,
      updatedAt: now,
      createdAt:
        form.createdAt ||
        drives.find((drive) => drive.id === editingId)?.createdAt ||
        now,
    };

    setDrives((previous) => {
      const exists = previous.some((drive) => drive.id === record.id);
      return exists
        ? previous.map((drive) => (drive.id === record.id ? record : drive))
        : [record, ...previous];
    });

    setNotice(
      status === "published"
        ? "Recruitment published successfully."
        : "Recruitment saved as a draft."
    );
    setEditingId(record.id);
    setForm(record);
    setView("tracker");
  };

  const changeDriveStatus = (drive, status) => {
    setDrives((previous) =>
      previous.map((item) =>
        item.id === drive.id
          ? { ...item, status, updatedAt: new Date().toISOString() }
          : item
      )
    );
  };

  const deleteDrive = (drive) => {
    const confirmed = window.confirm(
      `Delete the "${drive.roleName}" recruitment? This cannot be undone.`
    );
    if (!confirmed) return;

    setDrives((previous) =>
      previous.filter((item) => item.id !== drive.id)
    );
    setNotice("Recruitment deleted.");
  };

  const addSection = () => {
    setForm((previous) => ({
      ...previous,
      sections: [
        ...previous.sections,
        {
          id: makeId(),
          title: `Section ${previous.sections.length + 1}`,
          description: "",
          questions: [],
        },
      ],
    }));
  };

  const updateSection = (sectionId, key, value) => {
    setForm((previous) => ({
      ...previous,
      sections: previous.sections.map((section) =>
        section.id === sectionId
          ? { ...section, [key]: value }
          : section
      ),
    }));
  };

  const removeSection = (sectionId) => {
    setForm((previous) => ({
      ...previous,
      sections: previous.sections.filter(
        (section) => section.id !== sectionId
      ),
    }));
  };

  const addQuestion = (sectionId) => {
    setForm((previous) => ({
      ...previous,
      sections: previous.sections.map((section) =>
        section.id === sectionId
          ? {
              ...section,
              questions: [
                ...section.questions,
                {
                  id: makeId(),
                  label: "Untitled question",
                  type: "text",
                  required: false,
                  options: "",
                },
              ],
            }
          : section
      ),
    }));
  };

  const updateQuestion = (sectionId, questionId, key, value) => {
    setForm((previous) => ({
      ...previous,
      sections: previous.sections.map((section) =>
        section.id === sectionId
          ? {
              ...section,
              questions: section.questions.map((question) =>
                question.id === questionId
                  ? { ...question, [key]: value }
                  : question
              ),
            }
          : section
      ),
    }));
  };

  const removeQuestion = (sectionId, questionId) => {
    setForm((previous) => ({
      ...previous,
      sections: previous.sections.map((section) =>
        section.id === sectionId
          ? {
              ...section,
              questions: section.questions.filter(
                (question) => question.id !== questionId
              ),
            }
          : section
      ),
    }));
  };

  const openApplicants = (drive) => {
    setSelectedDrive(drive.id);
    setView("applicants");
  };

  const updateApplicantStage = (applicantId, stage) => {
    setApplicants((previous) =>
      previous.map((applicant) =>
        applicant.id === applicantId
          ? { ...applicant, status: stage, updatedAt: new Date().toISOString() }
          : applicant
      )
    );
  };

  const openResultsModal = () => {
    if (!currentDrive) {
      setNotice("Choose a recruitment drive before publishing results.");
      return;
    }
    const existing = readArray("prism-recruitment-results-v1").find((item) => item.driveId === currentDrive.id);
    const questions = (currentDrive.sections || []).flatMap((section) => section.questions || []);
    setResultsDraft({
      header: existing?.header || `Results — ${currentDrive.roleName || currentDrive.title || "Recruitment"}`,
      description: existing?.description || "Thank you to everyone who applied. Check the candidate status updates below.",
      statuses: existing?.statuses || ["Shortlisted", "Selected"],
      showName: existing?.disclosure?.showName ?? true,
      showStatus: existing?.disclosure?.showStatus ?? true,
      showEmail: existing?.disclosure?.showEmail ?? false,
      showPhone: existing?.disclosure?.showPhone ?? false,
      showPublishedDate: existing?.disclosure?.showPublishedDate ?? true,
      questionIds: existing?.disclosure?.questionIds || [],
      theme: existing?.theme || "prism",
    });
    setShowResultsModal(true);
  };

  const publishResults = () => {
    if (!currentDrive) return;
    const visibleApplicants = selectedApplicants.filter((applicant) =>
      resultsDraft.statuses.includes(applicant.status)
    );
    if (visibleApplicants.length === 0) {
      setNotice("Choose Shortlisted and/or Selected applicants with the selected status before publishing.");
      return;
    }

    const resultsKey = "prism-recruitment-results-v1";
    const existingResults = readArray(resultsKey);
    const publishedAt = new Date().toISOString();
    const questions = (currentDrive.sections || []).flatMap((section) => section.questions || []);
    const selectedQuestionFields = questions.filter((question) => resultsDraft.questionIds.includes(question.id));
    const resultEntry = {
      driveId: currentDrive.id,
      roleName: currentDrive.roleName || currentDrive.title || "Recruitment",
      title: currentDrive.title || "PRISM AI Recruitment Results",
      header: resultsDraft.header.trim() || "Recruitment results",
      description: resultsDraft.description.trim(),
      published: true,
      publishedAt,
      statuses: resultsDraft.statuses,
      theme: resultsDraft.theme,
      disclosure: {
        showName: resultsDraft.showName,
        showStatus: resultsDraft.showStatus,
        showEmail: resultsDraft.showEmail,
        showPhone: resultsDraft.showPhone,
        showPublishedDate: resultsDraft.showPublishedDate,
        questionIds: resultsDraft.questionIds,
      },
      questions: selectedQuestionFields.map((question) => ({ id: question.id, label: question.label })),
      selectedApplicants: visibleApplicants.map((applicant) => ({
        id: applicant.id,
        name: applicant.name || "Applicant",
        email: applicant.email || "",
        phone: applicant.phone || "",
        status: applicant.status,
        answers: Object.fromEntries(resultsDraft.questionIds.map((id) => [id, applicant.answers?.[id] ?? ""])),
      })),
    };
    localStorage.setItem(resultsKey, JSON.stringify([
      ...existingResults.filter((result) => result.driveId !== currentDrive.id),
      resultEntry,
    ]));
    window.dispatchEvent(new CustomEvent("prism-recruitment-results-updated", { detail: { driveId: currentDrive.id } }));
    setShowResultsModal(false);
    setNotice(`Results published for ${resultEntry.roleName} (${visibleApplicants.length} candidates shown).`);
  };

  const goHome = () => {
    setNotice("");
    setView("home");
  };

  const goTracker = () => {
    setNotice("");
    setView("tracker");
  };

  const currentDrive = drives.find((drive) => drive.id === selectedDrive);

  return (
    <main className="recruitment-admin">
      <div className="ra-shell">
        <header className="ra-topbar">
          <button
            className="ra-back-button"
            type="button"
            onClick={
              view === "home"
                ? () => window.history.back()
                : view === "builder"
                  ? goHome
                  : view === "applicants"
                    ? goTracker
                    : goHome
            }
          >
            <ArrowLeft size={17} />
            <span>
              {view === "home"
                ? "Back to admin"
                : view === "builder"
                  ? "Recruitments"
                  : view === "applicants"
                    ? "Applicants tracker"
                    : "Recruitments"}
            </span>
          </button>

          <div className="ra-brand">
            <span className="ra-brand-mark">P.</span>
            <span>PRISM AI <small>RECRUITMENT ADMIN</small></span>
          </div>

          <div className="ra-topbar-actions">
            <button
              className="ra-theme-toggle"
              type="button"
              onClick={toggleTheme}
              aria-label={isDarkMode ? "Switch to light mode" : "Switch to dark mode"}
              title={isDarkMode ? "Switch to light mode" : "Switch to dark mode"}
            >
              {isDarkMode ? <Sun size={16} /> : <Moon size={16} />}
              <span>{isDarkMode ? "Light mode" : "Dark mode"}</span>
            </button>
            <span className="ra-topbar-indicator">
              <span /> ADMIN WORKSPACE
            </span>
          </div>
        </header>

        {notice && (
          <div className="ra-notice" role="status">
            <Check size={17} />
            <span>{notice}</span>
            <button
              type="button"
              aria-label="Dismiss message"
              onClick={() => setNotice("")}
            >
              <X size={16} />
            </button>
          </div>
        )}

        {view === "home" && (
          <>
            <section className="ra-hero">
              <div className="ra-hero-copy">
                <span className="ra-eyebrow">
                  <span className="ra-eyebrow-dot" />
                  PEOPLE · OPPORTUNITY · GROWTH
                </span>
                <h1>
                  Find your next
                  <br />
                  <em>great teammate.</em>
                </h1>
                <p>
                  Create recruitment drives, design your application forms,
                  and keep every applicant moving through the process.
                </p>
              </div>
              <div className="ra-hero-art" aria-hidden="true">
                <div className="ra-art-orbit ra-art-orbit-one" />
                <div className="ra-art-orbit ra-art-orbit-two" />
                <div className="ra-art-core">
                  <Users size={40} strokeWidth={1.25} />
                </div>
                <span className="ra-art-label">BUILD YOUR TEAM</span>
                <span className="ra-art-dot ra-art-dot-one" />
                <span className="ra-art-dot ra-art-dot-two" />
              </div>
            </section>

            <section className="ra-stats">
              <div>
                <span>ALL RECRUITMENTS</span>
                <strong>{drives.length.toString().padStart(2, "0")}</strong>
              </div>
              <div>
                <span>LIVE RECRUITMENTS</span>
                <strong>
                  {drives.filter((drive) => drive.status === "published").length
                    .toString()
                    .padStart(2, "0")}
                </strong>
              </div>
              <div>
                <span>APPLICATIONS RECEIVED</span>
                <strong>{applicants.length.toString().padStart(2, "0")}</strong>
              </div>
            </section>

            <div className="ra-section-heading">
              <div>
                <span className="ra-section-kicker">YOUR WORKSPACE</span>
                <h2>What would you like to do?</h2>
              </div>
              <span className="ra-section-index">01 / 02</span>
            </div>

            <section className="ra-home-grid">
              <button
                className="ra-home-card ra-home-card-create"
                type="button"
                onClick={openCreate}
              >
                <span className="ra-card-number">01 — CREATE</span>
                <span className="ra-card-icon">
                  <FilePlus2 size={25} />
                </span>
                <span className="ra-card-illustration" aria-hidden="true">
                  <span className="ra-illustration-sheet">
                    <span />
                    <span />
                    <span />
                    <i><Plus size={20} /></i>
                  </span>
                </span>
                <span className="ra-card-copy">
                  <strong>
                    Recruitment
                    <br />
                    <em>form.</em>
                  </strong>
                  <span>
                    Define the role, add responsibilities, customize the
                    application form, and publish your recruitment drive.
                  </span>
                </span>
                <span className="ra-card-action">
                  Build a recruitment <ArrowRight size={18} />
                </span>
              </button>

              <button
                className="ra-home-card ra-home-card-track"
                type="button"
                onClick={goTracker}
              >
                <span className="ra-card-number">02 — TRACK</span>
                <span className="ra-card-icon">
                  <ClipboardList size={25} />
                </span>
                <span className="ra-card-illustration" aria-hidden="true">
                  <span className="ra-illustration-board">
                    <i /><i /><i />
                    <b /><b /><b />
                  </span>
                </span>
                <span className="ra-card-copy">
                  <strong>
                    Applicants
                    <br />
                    <em>tracker.</em>
                  </strong>
                  <span>
                    Manage published drives, edit forms, review applications,
                    and update every candidate’s progress.
                  </span>
                </span>
                <span className="ra-card-action">
                  Manage recruitment <ArrowRight size={18} />
                </span>
              </button>
            </section>

            <footer className="ra-footer">
              <span>GOOD TEAMS START WITH GREAT OPPORTUNITIES.</span>
              <span>P.</span>
            </footer>
          </>
        )}

        {view === "builder" && (
          <>
            <section className="ra-page-heading">
              <span className="ra-eyebrow">
                <LayoutTemplate size={15} /> RECRUITMENT FORM BUILDER
              </span>
              <h1>
                Create an
                <br />
                <em>opportunity.</em>
              </h1>
              <p>
                Set up the recruitment details first, then customize the
                application form your applicants will see.
              </p>
            </section>

            <div className="ra-builder-toolbar">
              <div>
                <span className="ra-section-kicker">
                  {editingId ? "EDITING RECRUITMENT" : "NEW RECRUITMENT"}
                </span>
                <strong>{form.roleName || "Untitled role"}</strong>
              </div>
              <div className="ra-toolbar-actions">
                <button
                  type="button"
                  className="ra-button ra-button-outline"
                  onClick={() => setShowPreview((previous) => !previous)}
                >
                  <Eye size={16} /> {showPreview ? "Close preview" : "Preview form"}
                </button>
                <button
                  type="button"
                  className="ra-button ra-button-muted"
                  onClick={() => saveDrive("draft")}
                >
                  <Save size={16} /> Save draft
                </button>
                <button
                  type="button"
                  className="ra-button ra-button-primary"
                  onClick={() => saveDrive("published")}
                >
                  <Check size={16} /> Publish
                </button>
              </div>
            </div>

            {showPreview ? (
              <section
                className="ra-preview-wrap"
                style={{
                  "--ra-preview-primary": form.colors.primary,
                  "--ra-preview-header": form.colors.header,
                  "--ra-preview-bg": form.colors.background,
                  "--ra-preview-card": form.colors.card,
                  "--ra-preview-text": form.colors.text,
                }}
              >
                <div className="ra-preview-banner">
                  <span>PRISM AI · RECRUITMENT</span>
                  <h2>{form.title || "Recruitment application"}</h2>
                  <p>{form.subtitle || form.roleName || "Join our team"}</p>
                </div>
                <div className="ra-preview-content">
                  <h3>{form.roleName || "Role name"}</h3>
                  <p>{form.responsibilities || "Role responsibilities will appear here."}</p>
                  <p>{form.expectations || "Role expectations will appear here."}</p>
                  <div className="ra-preview-meta">
                    <span><CalendarDays size={15} /> Deadline: {formatDate(form.deadline)}</span>
                    <span><Users size={15} /> {form.audience || "Eligibility not specified"}</span>
                  </div>
                  {(form.sections || []).map((section) => (
                    <section className="ra-preview-section" key={section.id}>
                      <h3>{section.title}</h3>
                      {section.description && <p>{section.description}</p>}
                      {section.questions.map((question) => (
                        <div className="ra-preview-question" key={question.id}>
                          <label>
                            {question.label || "Untitled question"}
                            {question.required && <b> *</b>}
                          </label>
                          {question.type === "textarea" ? (
                            <div className="ra-preview-input ra-preview-textarea" />
                          ) : question.type === "select" ||
                            question.type === "radio" ||
                            question.type === "checkbox" ? (
                            <div className="ra-preview-options">
                              {(question.options || "")
                                .split("\n")
                                .filter(Boolean)
                                .map((option) => <span key={option}>○ {option}</span>)}
                            </div>
                          ) : (
                            <div className="ra-preview-input" />
                          )}
                        </div>
                      ))}
                    </section>
                  ))}
                  {form.procedure && (
                    <section className="ra-preview-section">
                      <h3>Selection procedure</h3>
                      <p>{form.procedure}</p>
                    </section>
                  )}
                  {form.additionalInfo && (
                    <section className="ra-preview-section">
                      <h3>Additional information</h3>
                      <p>{form.additionalInfo}</p>
                    </section>
                  )}
                  <p className="ra-preview-note">
                    Preview only. Applicant submissions are not enabled by this preview.
                  </p>
                </div>
              </section>
            ) : (
              <div className="ra-builder-layout">
                <div className="ra-builder-main">
                  <section className="ra-panel">
                    <div className="ra-panel-heading">
                      <span className="ra-panel-icon"><BriefcaseBusiness size={19} /></span>
                      <div>
                        <h2>Recruitment details</h2>
                        <p>Everything applicants need to know about this role.</p>
                      </div>
                    </div>

                    <div className="ra-form-grid">
                      <label className="ra-field ra-field-full">
                        Role name <b>*</b>
                        <input
                          value={form.roleName}
                          onChange={(event) => updateForm("roleName", event.target.value)}
                          placeholder="e.g. Webmaster, AI Research Lead"
                        />
                      </label>

                      <label className="ra-field ra-field-full">
                        Form header / title <b>*</b>
                        <input
                          value={form.title}
                          onChange={(event) => updateForm("title", event.target.value)}
                          placeholder="e.g. PRISM AI Recruitment 2026"
                        />
                      </label>

                      <label className="ra-field ra-field-full">
                        Header subtitle
                        <input
                          value={form.subtitle}
                          onChange={(event) => updateForm("subtitle", event.target.value)}
                          placeholder="A short welcome message for applicants"
                        />
                      </label>

                      <label className="ra-field ra-field-full">
                        Responsibilities
                        <textarea
                          rows={4}
                          value={form.responsibilities}
                          onChange={(event) => updateForm("responsibilities", event.target.value)}
                          placeholder="What will the selected candidate work on?"
                        />
                      </label>

                      <label className="ra-field ra-field-full">
                        What is expected?
                        <textarea
                          rows={4}
                          value={form.expectations}
                          onChange={(event) => updateForm("expectations", event.target.value)}
                          placeholder="Skills, experience, commitment, and qualities you expect"
                        />
                      </label>

                      <label className="ra-field ra-field-full">
                        Who can register?
                        <textarea
                          rows={3}
                          value={form.eligibility}
                          onChange={(event) => updateForm("eligibility", event.target.value)}
                          placeholder="Eligibility criteria, branches, years, prerequisites"
                        />
                      </label>

                      <label className="ra-field ra-field-full">
                        Applicant audience label
                        <input
                          value={form.audience}
                          onChange={(event) => updateForm("audience", event.target.value)}
                          placeholder="e.g. All RNSIT students"
                        />
                      </label>

                      <label className="ra-field">
                        Recruitment starts
                        <input
                          type="date"
                          value={form.startDate}
                          onChange={(event) => updateForm("startDate", event.target.value)}
                        />
                      </label>

                      <label className="ra-field">
                        Recruitment ends
                        <input
                          type="date"
                          value={form.endDate}
                          onChange={(event) => updateForm("endDate", event.target.value)}
                        />
                      </label>

                      <label className="ra-field ra-field-full">
                        Application deadline
                        <input
                          type="date"
                          value={form.deadline}
                          onChange={(event) => updateForm("deadline", event.target.value)}
                        />
                      </label>

                      <label className="ra-field ra-field-full">
                        Selection procedure
                        <textarea
                          rows={3}
                          value={form.procedure}
                          onChange={(event) => updateForm("procedure", event.target.value)}
                          placeholder="e.g. Application review → Interview → Final selection"
                        />
                      </label>

                      <label className="ra-field ra-field-full">
                        Additional information
                        <textarea
                          rows={3}
                          value={form.additionalInfo}
                          onChange={(event) => updateForm("additionalInfo", event.target.value)}
                          placeholder="Links, contact details, time commitment, or other instructions"
                        />
                      </label>
                    </div>
                  </section>

                  <section className="ra-panel">
                    <div className="ra-panel-heading">
                      <span className="ra-panel-icon"><FileText size={19} /></span>
                      <div>
                        <h2>Application form</h2>
                        <p>Add sections and build the questions applicants will answer.</p>
                      </div>
                    </div>

                    {form.sections.map((section, sectionIndex) => (
                      <section className="ra-editor-section" key={section.id}>
                        <div className="ra-editor-section-top">
                          <span className="ra-section-count">
                            <GripVertical size={16} /> SECTION {String(sectionIndex + 1).padStart(2, "0")}
                          </span>
                          <button
                            type="button"
                            className="ra-icon-button ra-danger-icon"
                            aria-label="Delete section"
                            onClick={() => removeSection(section.id)}
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>

                        <label className="ra-field">
                          Section title
                          <input
                            value={section.title}
                            onChange={(event) => updateSection(section.id, "title", event.target.value)}
                            placeholder="Section name"
                          />
                        </label>

                        <label className="ra-field">
                          Section description
                          <textarea
                            rows={2}
                            value={section.description}
                            onChange={(event) => updateSection(section.id, "description", event.target.value)}
                            placeholder="Explain what this section is about"
                          />
                        </label>

                        {section.questions.map((question, questionIndex) => (
                          <div className="ra-question-editor" key={question.id}>
                            <div className="ra-question-number">
                              Q{String(questionIndex + 1).padStart(2, "0")}
                            </div>
                            <div className="ra-question-fields">
                              <label className="ra-field">
                                Question / field label
                                <input
                                  value={question.label}
                                  onChange={(event) =>
                                    updateQuestion(section.id, question.id, "label", event.target.value)
                                  }
                                  placeholder="Enter a question"
                                />
                              </label>

                              <div className="ra-question-controls">
                                <label className="ra-field">
                                  Response type
                                  <select
                                    value={question.type}
                                    onChange={(event) =>
                                      updateQuestion(section.id, question.id, "type", event.target.value)
                                    }
                                  >
                                    <option value="text">Short answer</option>
                                    <option value="textarea">Long answer</option>
                                    <option value="email">Email</option>
                                    <option value="tel">Phone number</option>
                                    <option value="number">Number</option>
                                    <option value="date">Date</option>
                                    <option value="url">Website / portfolio URL</option>
                                    <option value="select">Dropdown</option>
                                    <option value="radio">Multiple choice</option>
                                    <option value="checkbox">Checkboxes</option>
                                  </select>
                                </label>

                                <label className="ra-required-toggle">
                                  <input
                                    type="checkbox"
                                    checked={question.required}
                                    onChange={(event) =>
                                      updateQuestion(section.id, question.id, "required", event.target.checked)
                                    }
                                  />
                                  Required
                                </label>

                                <button
                                  type="button"
                                  className="ra-icon-button ra-danger-icon"
                                  aria-label="Delete question"
                                  onClick={() => removeQuestion(section.id, question.id)}
                                >
                                  <Trash2 size={16} />
                                </button>
                              </div>

                              {["select", "radio", "checkbox"].includes(question.type) && (
                                <label className="ra-field">
                                  Options <span className="ra-field-hint">One option per line</span>
                                  <textarea
                                    rows={3}
                                    value={question.options}
                                    onChange={(event) =>
                                      updateQuestion(section.id, question.id, "options", event.target.value)
                                    }
                                    placeholder={"Option 1\nOption 2\nOption 3"}
                                  />
                                </label>
                              )}
                            </div>
                          </div>
                        ))}

                        <button
                          type="button"
                          className="ra-add-question"
                          onClick={() => addQuestion(section.id)}
                        >
                          <Plus size={16} /> Add question
                        </button>
                      </section>
                    ))}

                    <button
                      type="button"
                      className="ra-add-section"
                      onClick={addSection}
                    >
                      <Plus size={18} /> Add section
                    </button>
                  </section>
                </div>

                <aside className="ra-builder-sidebar">
                  <section className="ra-panel ra-customize-panel">
                    <div className="ra-panel-heading">
                      <span className="ra-panel-icon"><Palette size={19} /></span>
                      <div>
                        <h2>Form appearance</h2>
                        <p>Personalize the applicant experience.</p>
                      </div>
                    </div>

                    <div className="ra-color-field">
                      <label htmlFor="ra-primary-color">Accent color</label>
                      <div className="ra-color-input">
                        <input
                          id="ra-primary-color"
                          type="color"
                          value={form.colors.primary}
                          onChange={(event) => updateColors("primary", event.target.value)}
                        />
                        <code>{form.colors.primary}</code>
                      </div>
                    </div>

                    <div className="ra-color-field">
                      <label htmlFor="ra-header-color">Header color</label>
                      <div className="ra-color-input">
                        <input
                          id="ra-header-color"
                          type="color"
                          value={form.colors.header}
                          onChange={(event) => updateColors("header", event.target.value)}
                        />
                        <code>{form.colors.header}</code>
                      </div>
                    </div>

                    <div className="ra-color-field">
                      <label htmlFor="ra-background-color">Page background</label>
                      <div className="ra-color-input">
                        <input
                          id="ra-background-color"
                          type="color"
                          value={form.colors.background}
                          onChange={(event) => updateColors("background", event.target.value)}
                        />
                        <code>{form.colors.background}</code>
                      </div>
                    </div>

                    <div className="ra-color-field">
                      <label htmlFor="ra-card-color">Question cards</label>
                      <div className="ra-color-input">
                        <input
                          id="ra-card-color"
                          type="color"
                          value={form.colors.card}
                          onChange={(event) => updateColors("card", event.target.value)}
                        />
                        <code>{form.colors.card}</code>
                      </div>
                    </div>

                    <div className="ra-color-field">
                      <label htmlFor="ra-text-color">Text color</label>
                      <div className="ra-color-input">
                        <input
                          id="ra-text-color"
                          type="color"
                          value={form.colors.text}
                          onChange={(event) => updateColors("text", event.target.value)}
                        />
                        <code>{form.colors.text}</code>
                      </div>
                    </div>

                    <div className="ra-palette-presets">
                      <span>QUICK THEMES</span>
                      <button
                        type="button"
                        onClick={() => setForm((previous) => ({
                          ...previous,
                          colors: { ...DEFAULT_COLORS },
                        }))}
                      >
                        <i style={{ background: "#dc9750" }} />
                        <i style={{ background: "#1e2640" }} />
                        <i style={{ background: "#f5f3ee" }} />
                        PRISM
                      </button>
                      <button
                        type="button"
                        onClick={() => setForm((previous) => ({
                          ...previous,
                          colors: {
                            primary: "#62856b",
                            header: "#233c32",
                            background: "#f0f5ef",
                            card: "#ffffff",
                            text: "#24342b",
                          },
                        }))}
                      >
                        <i style={{ background: "#62856b" }} />
                        <i style={{ background: "#233c32" }} />
                        <i style={{ background: "#f0f5ef" }} />
                        BOTANICAL
                      </button>
                      <button
                        type="button"
                        onClick={() => setForm((previous) => ({
                          ...previous,
                          colors: {
                            primary: "#b86c79",
                            header: "#402b40",
                            background: "#f7eff4",
                            card: "#ffffff",
                            text: "#392c38",
                          },
                        }))}
                      >
                        <i style={{ background: "#b86c79" }} />
                        <i style={{ background: "#402b40" }} />
                        <i style={{ background: "#f7eff4" }} />
                        ROSE
                      </button>
                    </div>

                    <button
                      type="button"
                      className="ra-button ra-button-outline ra-full-button"
                      onClick={() => setShowPreview(true)}
                    >
                      <Eye size={16} /> Preview applicant form
                    </button>
                  </section>

                  <section className="ra-publish-note">
                    <Settings2 size={19} />
                    <strong>Before you publish</strong>
                    <p>
                      Review eligibility, dates, selection steps, and required
                      questions. Save as a draft if the recruitment is not ready.
                    </p>
                  </section>
                </aside>
              </div>
            )}

            <div className="ra-bottom-actions">
              <button
                type="button"
                className="ra-button ra-button-outline"
                onClick={goHome}
              >
                Cancel
              </button>
              <div>
                <button
                  type="button"
                  className="ra-button ra-button-muted"
                  onClick={() => saveDrive("draft")}
                >
                  <Save size={16} /> Save draft
                </button>
                <button
                  type="button"
                  className="ra-button ra-button-primary"
                  onClick={() => saveDrive("published")}
                >
                  Publish recruitment <ArrowRight size={17} />
                </button>
              </div>
            </div>
          </>
        )}

        {view === "tracker" && (
          <>
            <section className="ra-page-heading">
              <span className="ra-eyebrow">
                <ClipboardList size={15} /> APPLICANTS TRACKER
              </span>
              <h1>
                Every application.
                <br />
                <em>One workspace.</em>
              </h1>
              <p>
                Manage recruitment drives, update forms, and follow applicant
                progress from submission to final decision.
              </p>
            </section>

            <section className="ra-tracker-stats">
              <div><span>ALL DRIVES</span><strong>{drives.length}</strong></div>
              <div><span>PUBLISHED</span><strong>{drives.filter((d) => d.status === "published").length}</strong></div>
              <div><span>DRAFTS</span><strong>{drives.filter((d) => d.status === "draft").length}</strong></div>
              <div><span>APPLICANTS</span><strong>{applicants.length}</strong></div>
            </section>

            <div className="ra-tracker-toolbar">
              <div>
                <span className="ra-section-kicker">RECRUITMENT DRIVES</span>
                <h2>Manage opportunities</h2>
              </div>
              <button
                type="button"
                className="ra-button ra-button-primary"
                onClick={openCreate}
              >
                <Plus size={17} /> New recruitment
              </button>
            </div>

            <div className="ra-filter-row">
              <label className="ra-search-box">
                <Search size={17} />
                <input
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Search roles..."
                />
              </label>
              <label className="ra-select-filter">
                <span className="ra-sr-only">Filter by status</span>
                <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)}>
                  <option value="all">All statuses</option>
                  <option value="published">Published</option>
                  <option value="draft">Drafts</option>
                  <option value="closed">Closed</option>
                </select>
                <ChevronDown size={15} />
              </label>
            </div>

            {filteredDrives.length === 0 ? (
              <section className="ra-empty-state">
                <span><BriefcaseBusiness size={28} /></span>
                <h3>{drives.length ? "No matching recruitments" : "Your first recruitment starts here"}</h3>
                <p>
                  {drives.length
                    ? "Try a different search term or status filter."
                    : "Create a recruitment drive to start collecting and managing applications."}
                </p>
                {!drives.length && (
                  <button type="button" className="ra-button ra-button-primary" onClick={openCreate}>
                    <Plus size={17} /> Create recruitment
                  </button>
                )}
              </section>
            ) : (
              <section className="ra-drive-list">
                {filteredDrives.map((drive) => {
                  const count = applicants.filter((item) => item.driveId === drive.id).length;
                  return (
                    <article className="ra-drive-card" key={drive.id}>
                      <div
                        className="ra-drive-accent"
                        style={{ background: drive.colors?.primary || DEFAULT_COLORS.primary }}
                      />
                      <div className="ra-drive-main">
                        <div className="ra-drive-heading">
                          <span className={`ra-status ra-status-${drive.status}`}>
                            <i /> {STATUS_LABELS[drive.status] || drive.status}
                          </span>
                          <span className="ra-drive-date">
                            <CalendarDays size={14} /> Deadline: {formatDate(drive.deadline)}
                          </span>
                        </div>
                        <h3>{drive.roleName}</h3>
                        <p>{drive.title}</p>
                        <div className="ra-drive-meta">
                          <span><Users size={15} /> {count} applicant{count === 1 ? "" : "s"}</span>
                          <span><FileText size={15} /> {drive.sections?.length || 0} form sections</span>
                          <span>Updated {formatDate((drive.updatedAt || "").slice(0, 10))}</span>
                        </div>
                      </div>
                      <div className="ra-drive-actions">
                        <button type="button" onClick={() => openApplicants(drive)}>
                          <Users size={16} /> Applicants
                        </button>
                        <button type="button" onClick={() => openEdit(drive)}>
                          <Settings2 size={16} /> Edit form
                        </button>
                        {drive.status === "published" ? (
                          <button type="button" onClick={() => changeDriveStatus(drive, "closed")}>
                            <X size={16} /> Close drive
                          </button>
                        ) : (
                          <button type="button" onClick={() => changeDriveStatus(drive, "published")}>
                            <Check size={16} /> Publish
                          </button>
                        )}
                        <button
                          type="button"
                          className="ra-drive-delete"
                          onClick={() => deleteDrive(drive)}
                        >
                          <Trash2 size={16} /> Delete
                        </button>
                      </div>
                    </article>
                  );
                })}
              </section>
            )}
          </>
        )}

        {view === "applicants" && (
          <>
            <section className="ra-page-heading">
              <span className="ra-eyebrow">
                <Users size={15} /> CANDIDATE MANAGEMENT
              </span>
              <h1>
                Applicant
                <br />
                <em>overview.</em>
              </h1>
              <p>
                {currentDrive
                  ? `Applications for ${currentDrive.roleName}.`
                  : "Review candidate applications and update their progress."}
              </p>
            </section>

            {currentDrive && (
              <section className="ra-selected-drive">
                <div>
                  <span className={`ra-status ra-status-${currentDrive.status}`}>
                    <i /> {STATUS_LABELS[currentDrive.status] || currentDrive.status}
                  </span>
                  <h2>{currentDrive.roleName}</h2>
                  <p>{currentDrive.title}</p>
                </div>
                <button
                  type="button"
                  className="ra-button ra-button-outline"
                  onClick={() => openEdit(currentDrive)}
                >
                  <Settings2 size={16} /> Edit recruitment form
                </button>
              </section>
            )}

            <div className="ra-tracker-toolbar">
              <div>
                <span className="ra-section-kicker">CANDIDATE PIPELINE</span>
                <h2>{selectedApplicants.length} applicant{selectedApplicants.length === 1 ? "" : "s"}</h2>
              </div>
              <div className="ra-toolbar-actions">
                <span className="ra-selected-count">
                  {selectedApplicants.filter((applicant) => applicant.status === "Selected").length} selected
                </span>
                <button
                  type="button"
                  className="ra-button ra-button-primary"
                  onClick={openResultsModal}
                  disabled={!selectedApplicants.some((applicant) => ["Shortlisted", "Selected"].includes(applicant.status))}
                  title="Publish shortlisted and/or selected applicants to the public results portal"
                >
                  <Check size={16} /> Publish results
                </button>
              </div>
            </div>

            {selectedApplicants.length === 0 ? (
              <section className="ra-empty-state">
                <span><Users size={28} /></span>
                <h3>No applicants yet</h3>
                <p>
                  Applicant submissions will appear here when the public
                  recruitment form is connected to a submission endpoint.
                </p>
              </section>
            ) : (
              <div className="ra-applicant-table-wrap">
                <table className="ra-applicant-table">
                  <thead>
                    <tr>
                      <th>Applicant</th>
                      <th>Contact</th>
                      <th>Applied</th>
                      <th>Application status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {selectedApplicants.map((applicant) => (
                      <tr key={applicant.id}>
                        <td>
                          <strong>{applicant.name || "Unnamed applicant"}</strong>
                          <span>{applicant.email || "No email provided"}</span>
                        </td>
                        <td>{applicant.phone || "—"}</td>
                        <td>{formatDate((applicant.createdAt || "").slice(0, 10))}</td>
                        <td>
                          <select
                            aria-label={`Status for ${applicant.name || "applicant"}`}
                            value={applicant.status || "Applied"}
                            onChange={(event) => updateApplicantStage(applicant.id, event.target.value)}
                          >
                            {STAGES.map((stage) => (
                              <option key={stage} value={stage}>{stage}</option>
                            ))}
                          </select>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </>
        )}
      </div>

      {showResultsModal && currentDrive && (
        <div className="ra-results-modal-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) setShowResultsModal(false); }}>
          <section className="ra-results-modal" role="dialog" aria-modal="true" aria-labelledby="ra-results-modal-title">
            <div className="ra-results-modal-head">
              <div><span className="ra-section-kicker">PUBLIC ANNOUNCEMENT</span><h2 id="ra-results-modal-title">Publish recruitment results</h2><p>Choose what students will see on the public portal.</p></div>
              <button type="button" className="ra-icon-button" aria-label="Close" onClick={() => setShowResultsModal(false)}><X size={18}/></button>
            </div>
            <label className="ra-field">Results header<input value={resultsDraft.header} onChange={(e) => setResultsDraft(d => ({...d, header:e.target.value}))} placeholder="e.g. Webmaster recruitment results"/></label>
            <label className="ra-field">Announcement / description<textarea rows={3} value={resultsDraft.description} onChange={(e) => setResultsDraft(d => ({...d, description:e.target.value}))} placeholder="Write the announcement students will read..."/></label>
            <div className="ra-results-modal-section"><h3>Candidate statuses to display</h3><p>Rejected and Applied candidates are never displayed publicly.</p>{["Shortlisted","Selected"].map(status => <label className="ra-results-check" key={status}><input type="checkbox" checked={resultsDraft.statuses.includes(status)} onChange={(e) => setResultsDraft(d => ({...d, statuses:e.target.checked ? [...d.statuses,status] : d.statuses.filter(x=>x!==status)}))}/><span>{status} candidates</span></label>)}</div>
            <div className="ra-results-modal-section"><h3>Candidate information</h3>
              {[["showName","Candidate name"],["showStatus","Candidate status"],["showEmail","Email address"],["showPhone","Phone number"],["showPublishedDate","Publication date"]].map(([key,label]) => <label className="ra-results-check" key={key}><input type="checkbox" checked={Boolean(resultsDraft[key])} onChange={(e) => setResultsDraft(d => ({...d,[key]:e.target.checked}))}/><span>{label}</span></label>)}
            </div>
            <div className="ra-results-modal-section"><h3>Application answers to disclose</h3><p>Select only specific questions whose answers may be shared publicly.</p>
              {(currentDrive.sections || []).flatMap(section => section.questions || []).map(question => <label className="ra-results-check" key={question.id}><input type="checkbox" checked={resultsDraft.questionIds.includes(question.id)} onChange={(e) => setResultsDraft(d => ({...d,questionIds:e.target.checked ? [...d.questionIds,question.id] : d.questionIds.filter(id=>id!==question.id)}))}/><span>{question.label || "Untitled question"}</span></label>)}
              {!(currentDrive.sections || []).some(section => (section.questions || []).length) && <p>No application questions are configured for this drive.</p>}
            </div>
            <div className="ra-results-modal-section"><h3>Results theme</h3><div className="ra-results-theme-grid">
              {[["prism","PRISM"," #dc9750"],["botanical","BOTANICAL","#648a72"],["rose","ROSE","#c4778c"]].map(([id,label,color]) => <button type="button" key={id} className={`ra-results-theme ${resultsDraft.theme===id?"is-selected":""}`} onClick={() => setResultsDraft(d=>({...d,theme:id}))}><span style={{background:color.trim()}}/><strong>{label}</strong>{resultsDraft.theme===id && <Check size={15}/>}</button>)}
            </div></div>
            <div className="ra-results-preview" data-results-theme={resultsDraft.theme}>
              <span className="ra-section-kicker">LIVE PREVIEW</span><div className="ra-results-preview-card"><small>PRISM AI · SELECTION UPDATE</small><h3>{resultsDraft.header || "Recruitment results"}</h3><p>{resultsDraft.description || "Your announcement appears here."}</p><div className="ra-results-preview-person"><strong>Sample Candidate</strong><span>{resultsDraft.statuses.join(" / ") || "No statuses selected"}</span></div></div>
            </div>
            <div className="ra-results-modal-actions"><button type="button" className="ra-button ra-button-outline" onClick={() => setShowResultsModal(false)}>Cancel</button><button type="button" className="ra-button ra-button-primary" onClick={publishResults} disabled={!resultsDraft.statuses.length}>Publish results</button></div>
          </section>
        </div>
      )}
    </main>
  );
}
