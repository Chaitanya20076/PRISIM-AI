
const express = require("express");
const { db } = require("../config/firebaseAdmin");
const { requireAdmin } = require("./adminAuthRoutes");

const router = express.Router();
const collection = db.collection("announcements");

// --------------------------------------------------
// DATE CONVERSION
// --------------------------------------------------

function toIso(value) {
  if (!value) return "";

  if (typeof value === "string") return value;

  if (value instanceof Date) {
    return value.toISOString();
  }

  if (typeof value.toDate === "function") {
    return value.toDate().toISOString();
  }

  if (typeof value._seconds === "number") {
    return new Date(value._seconds * 1000).toISOString();
  }

  return value;
}

// --------------------------------------------------
// SERIALIZE FIRESTORE DOCUMENT
// --------------------------------------------------

function serialize(doc) {
  const data = doc.data() || {};

  return {
    id: doc.id,
    ...data,
    date: toIso(data.date),
    expiryDate: toIso(data.expiryDate),
    createdAt: toIso(data.createdAt),
    updatedAt: toIso(data.updatedAt),
  };
}

// --------------------------------------------------
// VALIDATE ANNOUNCEMENT
// --------------------------------------------------

function validatePayload(body = {}, requireContent = true) {
  const title = String(body.title || "").trim();

  const message = String(
    body.body || body.message || ""
  ).trim();

  if (requireContent && (!title || !message)) {
    const error = new Error(
      "Announcement title and message are required."
    );

    error.status = 400;
    throw error;
  }

  if (title.length > 120 || message.length > 1200) {
    const error = new Error(
      "Title must be 120 characters or fewer and message 1200 characters or fewer."
    );

    error.status = 400;
    throw error;
  }

  const date = body.date ? new Date(body.date) : null;

  const expiry = body.expiryDate
    ? new Date(body.expiryDate)
    : null;

  if (date && Number.isNaN(date.getTime())) {
    const error = new Error("Invalid announcement date.");

    error.status = 400;
    throw error;
  }

  if (expiry && Number.isNaN(expiry.getTime())) {
    const error = new Error("Invalid expiry date.");

    error.status = 400;
    throw error;
  }

  if (date && expiry && expiry <= date) {
    const error = new Error(
      "Expiry date must be after the announcement date."
    );

    error.status = 400;
    throw error;
  }
}

// --------------------------------------------------
// CLEAN ANNOUNCEMENT DATA
// --------------------------------------------------

function cleanPayload(body = {}) {
  const title = String(body.title || "").trim();

  const message = String(
    body.body || body.message || ""
  ).trim();

  return {
    title,
    body: message,

    category: String(body.category || "General"),

    date: body.date
      ? new Date(body.date).toISOString()
      : new Date().toISOString(),

    expiryDate: body.expiryDate
      ? new Date(body.expiryDate).toISOString()
      : "",

    pinned: Boolean(body.pinned),

    status:
      String(body.status || "published").toLowerCase() === "draft"
        ? "draft"
        : "published",
  };
}

// --------------------------------------------------
// PUBLIC ANNOUNCEMENTS
// GET /api/announcements/public
// --------------------------------------------------

router.get("/public", async (req, res, next) => {
  try {
    const now = Date.now();

    const snapshot = await collection
      .where("status", "==", "published")
      .get();

    const announcements = snapshot.docs
      .map(serialize)
      .filter((item) => {
        const publishAt = item.date
          ? new Date(item.date).getTime()
          : 0;

        const expiresAt = item.expiryDate
          ? new Date(item.expiryDate).getTime()
          : Infinity;

        return (
          publishAt <= now &&
          expiresAt > now
        );
      })
      .sort(
        (a, b) =>
          Number(Boolean(b.pinned)) -
            Number(Boolean(a.pinned)) ||
          new Date(b.date || 0).getTime() -
            new Date(a.date || 0).getTime()
      );

    return res.status(200).json({
      success: true,
      announcements,
    });

  } catch (error) {
    console.error("PUBLIC ANNOUNCEMENTS ERROR:", error);
    return next(error);
  }
});

// --------------------------------------------------
// ADMIN: GET ALL ANNOUNCEMENTS
// GET /api/admin/announcements
// --------------------------------------------------

router.get("/", requireAdmin, async (req, res, next) => {
  try {
    const snapshot = await collection.get();

    const announcements = snapshot.docs
      .map(serialize)
      .sort(
        (a, b) =>
          new Date(
            b.updatedAt || b.createdAt || b.date || 0
          ).getTime() -
          new Date(
            a.updatedAt || a.createdAt || a.date || 0
          ).getTime()
      );

    return res.status(200).json({
      success: true,
      announcements,
    });

  } catch (error) {
    console.error("ADMIN FETCH ANNOUNCEMENTS ERROR:", error);
    return next(error);
  }
});

// --------------------------------------------------
// ADMIN: CREATE ANNOUNCEMENT
// POST /api/admin/announcements
// --------------------------------------------------

router.post("/", requireAdmin, async (req, res, next) => {
  try {
    validatePayload(
      req.body,
      String(req.body?.status || "").toLowerCase() !== "draft"
    );

    const now = new Date().toISOString();

    const payload = {
      ...cleanPayload(req.body),
      createdAt: now,
      updatedAt: now,
    };

    const ref = await collection.add(payload);

    const doc = await ref.get();

    return res.status(201).json({
      success: true,
      message: "Announcement created successfully.",
      announcement: serialize(doc),
    });

  } catch (error) {
    if (error.status) {
      return res.status(error.status).json({
        success: false,
        message: error.message,
      });
    }

    console.error("CREATE ANNOUNCEMENT ERROR:", error);
    return next(error);
  }
});

// --------------------------------------------------
// ADMIN: UPDATE ANNOUNCEMENT
// PUT /api/admin/announcements/:id
// --------------------------------------------------

router.put("/:id", requireAdmin, async (req, res, next) => {
  try {
    validatePayload(
      req.body,
      String(req.body?.status || "").toLowerCase() !== "draft"
    );

    const ref = collection.doc(
      String(req.params.id)
    );

    const existing = await ref.get();

    if (!existing.exists) {
      return res.status(404).json({
        success: false,
        message: "Announcement not found.",
      });
    }

    const payload = {
      ...cleanPayload(req.body),

      createdAt:
        toIso(existing.data().createdAt) ||
        new Date().toISOString(),

      updatedAt: new Date().toISOString(),
    };

    await ref.set(payload, {
      merge: true,
    });

    const updated = await ref.get();

    return res.status(200).json({
      success: true,
      message: "Announcement updated successfully.",
      announcement: serialize(updated),
    });

  } catch (error) {
    if (error.status) {
      return res.status(error.status).json({
        success: false,
        message: error.message,
      });
    }

    console.error("UPDATE ANNOUNCEMENT ERROR:", error);
    return next(error);
  }
});

// --------------------------------------------------
// ADMIN: DELETE ANNOUNCEMENT
// DELETE /api/admin/announcements/:id
// --------------------------------------------------

router.delete("/:id", requireAdmin, async (req, res, next) => {
  try {
    const ref = collection.doc(
      String(req.params.id)
    );

    const existing = await ref.get();

    if (!existing.exists) {
      return res.status(404).json({
        success: false,
        message: "Announcement not found.",
      });
    }

    await ref.delete();

    return res.status(200).json({
      success: true,
      message: "Announcement deleted successfully.",
    });

  } catch (error) {
    console.error("DELETE ANNOUNCEMENT ERROR:", error);
    return next(error);
  }
});

// --------------------------------------------------
// EXPORT ROUTER
// --------------------------------------------------

module.exports = router;
