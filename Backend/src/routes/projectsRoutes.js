const express = require("express");
const { db } = require("../config/firebaseAdmin");

const router = express.Router();
const PROJECTS_COLLECTION = "projects";

function cleanProject(input = {}) {
  const project = { ...input };

  // Do not let clients override Firestore document metadata.
  delete project._id;
  delete project.__v;

  project.id = String(project.id || "").trim();
  project.name = String(project.name || "").trim();
  project.status = ["Draft", "Published", "Archived"].includes(project.status)
    ? project.status
    : "Draft";

  if (Array.isArray(project.customSections)) {
    project.customSections = project.customSections
      .filter((section) => section && typeof section === "object")
      .map((section) => ({
        id: String(section.id || ""),
        title: String(section.title || ""),
        content: String(section.content || ""),
      }));
  } else {
    project.customSections = [];
  }

  return project;
}

function projectFromSnapshot(doc) {
  return { id: doc.id, ...doc.data() };
}

// GET /api/projects/public
// Public showcase: only projects explicitly published by the admin.
router.get("/public", async (req, res) => {
  try {
    const snapshot = await db
      .collection(PROJECTS_COLLECTION)
      .where("status", "==", "Published")
      .get();

    const projects = snapshot.docs
      .map(projectFromSnapshot)
      .sort((a, b) => {
        const aDate = new Date(a.updatedAt || a.createdAt || 0).getTime();
        const bDate = new Date(b.updatedAt || b.createdAt || 0).getTime();
        return bDate - aDate;
      });

    return res.status(200).json({ success: true, projects });
  } catch (error) {
    console.error("GET PUBLIC PROJECTS ERROR:", error);
    return res.status(500).json({
      success: false,
      message: "Could not load published projects.",
    });
  }
});

// GET /api/projects
// Admin workspace: returns all projects, including drafts and archived entries.
router.get("/", async (req, res) => {
  try {
    const snapshot = await db.collection(PROJECTS_COLLECTION).get();

    const projects = snapshot.docs
      .map(projectFromSnapshot)
      .sort((a, b) => {
        const aDate = new Date(a.updatedAt || a.createdAt || 0).getTime();
        const bDate = new Date(b.updatedAt || b.createdAt || 0).getTime();
        return bDate - aDate;
      });

    return res.status(200).json({ success: true, projects });
  } catch (error) {
    console.error("GET PROJECTS ERROR:", error);
    return res.status(500).json({
      success: false,
      message: "Could not load projects.",
    });
  }
});

// POST /api/projects
// Create or save a project. The admin UI sends the complete project object.
router.post("/", async (req, res) => {
  try {
    const project = cleanProject(req.body);

    if (!project.id || !project.name) {
      return res.status(400).json({
        success: false,
        message: "Project ID and project name are required.",
      });
    }

    const ref = db.collection(PROJECTS_COLLECTION).doc(project.id);
    const existing = await ref.get();

    if (existing.exists) {
      return res.status(409).json({
        success: false,
        message: "A project with this ID already exists. Update the existing project instead.",
      });
    }

    await ref.set({
      ...project,
      createdAt: project.createdAt || new Date().toISOString(),
      updatedAt: project.updatedAt || new Date().toISOString(),
    });

    const savedSnapshot = await ref.get();

    return res.status(201).json({
      success: true,
      message: "Project saved successfully.",
      project: projectFromSnapshot(savedSnapshot),
    });
  } catch (error) {
    console.error("CREATE PROJECT ERROR:", error);
    return res.status(500).json({
      success: false,
      message: "Could not save project.",
    });
  }
});

// PUT /api/projects/:id
router.put("/:id", async (req, res) => {
  try {
    const id = String(req.params.id || "").trim();
    if (!id) {
      return res.status(400).json({ success: false, message: "Project ID is required." });
    }

    const ref = db.collection(PROJECTS_COLLECTION).doc(id);
    const existing = await ref.get();

    if (!existing.exists) {
      return res.status(404).json({ success: false, message: "Project not found." });
    }

    const project = cleanProject({ ...req.body, id });
    if (!project.name) {
      return res.status(400).json({ success: false, message: "Project name is required." });
    }

    const previous = existing.data() || {};
    await ref.set({
      ...project,
      createdAt: previous.createdAt || project.createdAt || new Date().toISOString(),
      updatedAt: project.updatedAt || new Date().toISOString(),
    });

    const savedSnapshot = await ref.get();

    return res.status(200).json({
      success: true,
      message: "Project updated successfully.",
      project: projectFromSnapshot(savedSnapshot),
    });
  } catch (error) {
    console.error("UPDATE PROJECT ERROR:", error);
    return res.status(500).json({
      success: false,
      message: "Could not update project.",
    });
  }
});

// DELETE /api/projects/:id
router.delete("/:id", async (req, res) => {
  try {
    const id = String(req.params.id || "").trim();
    if (!id) {
      return res.status(400).json({ success: false, message: "Project ID is required." });
    }

    const ref = db.collection(PROJECTS_COLLECTION).doc(id);
    const existing = await ref.get();

    if (!existing.exists) {
      return res.status(404).json({ success: false, message: "Project not found." });
    }

    await ref.delete();

    return res.status(200).json({
      success: true,
      message: "Project deleted successfully.",
      id,
    });
  } catch (error) {
    console.error("DELETE PROJECT ERROR:", error);
    return res.status(500).json({
      success: false,
      message: "Could not delete project.",
    });
  }
});

module.exports = router;
