
const express = require("express");
const { db } = require("../config/firebaseAdmin");
const { requireAdmin } = require("./adminAuthRoutes");

const router = express.Router();
const eventsCollection = db.collection("events");

const ALLOWED_TYPES = [
  "Seminar",
  "Workshop",
  "Hackathon",
  "Webinar",
  "Bootcamp",
  "Competition",
  "Other",
];

const ALLOWED_REGISTRATION_STATUSES = [
  "Pending",
  "Approved",
  "Rejected",
  "Registered",
  "Waitlisted",
];

const normalizeText = (value) =>
  String(value || "").trim().toLowerCase();

function normalizeType(value) {
  const input = normalizeText(value);

  if (["other", "others", "other event", "other events"].includes(input)) {
    return "Other";
  }

  return ALLOWED_TYPES.find((type) => type.toLowerCase() === input) || null;
}

function getEventType(event = {}) {
  for (const value of [event.type, event.customCategory, event.category]) {
    const type = normalizeType(value);
    if (type) return type;
  }
  return null;
}

function cleanEventData(data = {}) {
  const {
    id,
    _id,
    registrations,
    registrationCount,
    createdAt,
    updatedAt,
    ...cleanData
  } = data;

  return cleanData;
}

function eventResponse(snapshot) {
  return { ...snapshot.data(), id: snapshot.id };
}

function toMillis(value) {
  if (!value) return 0;
  if (typeof value.toMillis === "function") return value.toMillis();
  if (typeof value.toDate === "function") return value.toDate().getTime();

  const parsed = new Date(value).getTime();
  return Number.isFinite(parsed) ? parsed : 0;
}

// Generate a clean URL/document-safe slug.
function createSlug(value) {
  return String(value || "")
    .trim()
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

async function getRegistrations(eventId) {
  const snapshot = await eventsCollection
    .doc(eventId)
    .collection("registrations")
    .orderBy("submittedAt", "desc")
    .get();

  return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
}

async function getRegistrationCount(eventId) {
  const result = await eventsCollection
    .doc(eventId)
    .collection("registrations")
    .count()
    .get();

  return result.data().count || 0;
}

function sendServerError(res, error, label, message) {
  console.error(`${label}:`, error);
  return res.status(500).json({ success: false, message });
}

// All routes in this router require admin authentication.
router.use(requireAdmin);

// ==================================================
// GET ALL ADMIN EVENTS
// GET /api/admin/events
// ==================================================

router.get("/", async (req, res) => {
  try {
    const snapshot = await eventsCollection.get();

    const events = await Promise.all(
      snapshot.docs.map(async (doc) => ({
        ...eventResponse(doc),
        registrationCount: await getRegistrationCount(doc.id),
      }))
    );

    events.sort(
      (a, b) =>
        toMillis(b.updatedAt || b.createdAt) -
        toMillis(a.updatedAt || a.createdAt)
    );

    return res.status(200).json({
      success: true,
      count: events.length,
      events,
    });
  } catch (error) {
    return sendServerError(
      res,
      error,
      "GET ADMIN EVENTS ERROR",
      "Failed to fetch events."
    );
  }
});

// ==================================================
// GET SINGLE ADMIN EVENT
// GET /api/admin/events/:id
// ==================================================

router.get("/:id", async (req, res) => {
  try {
    const eventRef = eventsCollection.doc(String(req.params.id));
    const snapshot = await eventRef.get();

    if (!snapshot.exists) {
      return res.status(404).json({
        success: false,
        message: "Event not found.",
      });
    }

    const registrations = await getRegistrations(snapshot.id);

    const event = {
      ...eventResponse(snapshot),
      registrationCount: registrations.length,
      registrations,
    };

    return res.status(200).json({
      success: true,
      event,
      registrations,
    });
  } catch (error) {
    return sendServerError(
      res,
      error,
      "GET ADMIN EVENT ERROR",
      "Failed to fetch event details."
    );
  }
});

// ==================================================
// CREATE EVENT
// POST /api/admin/events
// ==================================================

router.post("/", async (req, res) => {
  try {
    const body = req.body || {};
    const title = String(body.title || body.name || "").trim();

    if (!title) {
      return res.status(400).json({
        success: false,
        message: "Event title is required.",
      });
    }

    const requestedType = normalizeType(
      body.type || body.customCategory || body.category
    );

    if (!requestedType) {
      return res.status(400).json({
        success: false,
        message: `A valid event type is required. Allowed types: ${ALLOWED_TYPES.join(", ")}.`,
      });
    }

    // --------------------------------------------------
    // HACKATHON READABLE FIRESTORE DOCUMENT ID
    // Example: hackathon-ai-innovation-challenge
    // --------------------------------------------------

    let eventRef;
    let slug;

    if (requestedType === "Hackathon") {
      slug = createSlug(body.slug || title);

      if (!slug) {
        return res.status(400).json({
          success: false,
          message: "A valid hackathon title or slug is required.",
        });
      }

      const readableId = `hackathon-${slug}`;
      eventRef = eventsCollection.doc(readableId);
    } else {
      eventRef = body.id
        ? eventsCollection.doc(String(body.id).trim())
        : eventsCollection.doc();

      slug = String(body.slug || eventRef.id).trim();
    }

    if (!eventRef.id) {
      return res.status(400).json({
        success: false,
        message: "Invalid event ID.",
      });
    }

    const existing = await eventRef.get();

    if (existing.exists) {
      return res.status(409).json({
        success: false,
        message: "An event with this ID already exists. Please use a different event title or slug.",
      });
    }

    const now = new Date().toISOString();

    const eventData = {
      ...cleanEventData(body),

      // Always use the actual Firestore document ID.
      id: eventRef.id,

      title,
      name: String(body.name || title).trim(),

      type: requestedType,
      category: requestedType,
      customCategory: requestedType,

      slug: slug || eventRef.id,

      status: String(body.status || "Draft").trim(),
      visibility: String(body.visibility || "Public").trim(),

      createdAt: now,
      updatedAt: now,
    };

    await eventRef.create(eventData);

    const saved = await eventRef.get();

    return res.status(201).json({
      success: true,
      message: `${requestedType} created successfully.`,
      event: {
        ...eventResponse(saved),
        registrationCount: 0,
        registrations: [],
      },
    });
  } catch (error) {
    return sendServerError(
      res,
      error,
      "CREATE ADMIN EVENT ERROR",
      "Failed to create event."
    );
  }
});

// ==================================================
// UPDATE EVENT
// PUT /api/admin/events/:id
// ==================================================

router.put("/:id", async (req, res) => {
  try {
    const eventRef = eventsCollection.doc(String(req.params.id));
    const snapshot = await eventRef.get();

    if (!snapshot.exists) {
      return res.status(404).json({
        success: false,
        message: "Event not found.",
      });
    }

    const body = req.body || {};
    const existingData = snapshot.data();
    const existingType = getEventType(existingData);

    const requestedType =
      normalizeType(body.type) ||
      normalizeType(body.customCategory) ||
      normalizeType(body.category) ||
      existingType;

    if (!requestedType) {
      return res.status(400).json({
        success: false,
        message: "Event type is missing or invalid.",
      });
    }

    if (
      existingType &&
      requestedType.toLowerCase() !== existingType.toLowerCase()
    ) {
      return res.status(400).json({
        success: false,
        message: "Event type cannot be changed while editing.",
      });
    }

    const cleaned = cleanEventData(body);

    const finalData = {
      ...cleaned,
      id: snapshot.id,
      type: requestedType,
      category: requestedType,
      customCategory: requestedType,
      updatedAt: new Date().toISOString(),
    };

    if (
      Object.prototype.hasOwnProperty.call(body, "title") ||
      Object.prototype.hasOwnProperty.call(body, "name")
    ) {
      const title = String(body.title || body.name || "").trim();

      if (!title) {
        return res.status(400).json({
          success: false,
          message: "Event title cannot be empty.",
        });
      }

      finalData.title = title;
      finalData.name = String(body.name || title).trim();
    }

    if (Object.prototype.hasOwnProperty.call(body, "slug")) {
      finalData.slug =
        String(body.slug || snapshot.id).trim() || snapshot.id;
    }

    await eventRef.set(finalData, { merge: true });

    const updated = await eventRef.get();
    const registrations = await getRegistrations(snapshot.id);

    return res.status(200).json({
      success: true,
      message: "Event updated successfully.",
      event: {
        ...eventResponse(updated),
        registrationCount: registrations.length,
        registrations,
      },
    });
  } catch (error) {
    return sendServerError(
      res,
      error,
      "UPDATE ADMIN EVENT ERROR",
      "Failed to update event."
    );
  }
});

// ==================================================
// DELETE EVENT
// DELETE /api/admin/events/:id
// ==================================================

router.delete("/:id", async (req, res) => {
  try {
    const eventRef = eventsCollection.doc(String(req.params.id));
    const snapshot = await eventRef.get();

    if (!snapshot.exists) {
      return res.status(404).json({
        success: false,
        message: "Event not found.",
      });
    }

    const registrationsRef = eventRef.collection("registrations");

    while (true) {
      const registrations = await registrationsRef.limit(400).get();

      if (registrations.empty) break;

      const batch = db.batch();

      registrations.docs.forEach((doc) => {
        batch.delete(doc.ref);
      });

      await batch.commit();
    }

    await eventRef.delete();

    return res.status(200).json({
      success: true,
      message: "Event and registrations deleted successfully.",
    });
  } catch (error) {
    return sendServerError(
      res,
      error,
      "DELETE ADMIN EVENT ERROR",
      "Failed to delete event."
    );
  }
});

// ==================================================
// UPDATE REGISTRATION STATUS
// PATCH /api/admin/events/:id/registrations/:registrationId
// ==================================================

router.patch("/:id/registrations/:registrationId", async (req, res) => {
  try {
    const { id, registrationId } = req.params;
    const { status } = req.body || {};

    if (!ALLOWED_REGISTRATION_STATUSES.includes(status)) {
      return res.status(400).json({
        success: false,
        message: `Invalid registration status. Allowed values: ${ALLOWED_REGISTRATION_STATUSES.join(", ")}.`,
      });
    }

    const eventRef = eventsCollection.doc(String(id));
    const eventSnapshot = await eventRef.get();

    if (!eventSnapshot.exists) {
      return res.status(404).json({
        success: false,
        message: "Event not found.",
      });
    }

    const registrationRef = eventRef
      .collection("registrations")
      .doc(String(registrationId));

    const registrationSnapshot = await registrationRef.get();

    if (!registrationSnapshot.exists) {
      return res.status(404).json({
        success: false,
        message: "Registration not found.",
      });
    }

    await registrationRef.update({
      status,
      reviewedAt: new Date().toISOString(),
    });

    const updated = await registrationRef.get();

    return res.status(200).json({
      success: true,
      message: "Registration status updated successfully.",
      registration: {
        id: updated.id,
        ...updated.data(),
      },
    });
  } catch (error) {
    return sendServerError(
      res,
      error,
      "UPDATE REGISTRATION ERROR",
      "Failed to update registration status."
    );
  }
});

module.exports = router;
