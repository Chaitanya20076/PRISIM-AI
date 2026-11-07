const express = require("express");
const crypto = require("crypto");
const { FieldValue } = require("firebase-admin/firestore");
const { db } = require("../config/firebaseAdmin");

const router = express.Router();
const eventsCollection = db.collection("events");

// ==================================================
// HELPERS
// ==================================================

const normalizeText = (value) =>
  String(value || "").trim().toLowerCase();

const normalizeEmail = (value) =>
  String(value || "").trim().toLowerCase();

const normalizePhone = (value) => {
  let digits = String(value || "").replace(/\D/g, "");

  if (digits.length === 12 && digits.startsWith("91")) {
    digits = digits.slice(2);
  }

  return digits;
};

const isPublishedPublic = (event = {}) =>
  normalizeText(event.status) === "published" &&
  normalizeText(event.visibility || "Public") === "public";

const getEventTypes = (event = {}) =>
  [event.type, event.customCategory, event.category]
    .filter(Boolean)
    .map((value) => {
      const normalized = normalizeText(value);

      return [
        "others",
        "other event",
        "other events",
      ].includes(normalized)
        ? "other"
        : normalized;
    });

const matchesEventType = (event, requestedType) => {
  if (!requestedType || requestedType === "all") {
    return true;
  }

  return getEventTypes(event).includes(
    normalizeText(requestedType)
  );
};

function publicEventData(doc) {
  const data = doc.data() || {};

  return {
    ...data,
    id: doc.id,
    registrations: [],
  };
}

function createHttpError(message, status) {
  return Object.assign(new Error(message), { status });
}

function getAnswer(answers, field) {
  if (!answers || !field) return "";

  const direct = answers[field.id];

  if (direct !== undefined && direct !== null) {
    return direct;
  }

  const label = normalizeText(field.label);

  if (!label) return "";

  const matchingKey = Object.keys(answers).find(
    (key) => normalizeText(key) === label
  );

  return matchingKey ? answers[matchingKey] : "";
}

function isBlankAnswer(value) {
  if (Array.isArray(value)) {
    return value.length === 0;
  }

  if (typeof value === "boolean") {
    return value === false;
  }

  return (
    value === undefined ||
    value === null ||
    String(value).trim() === ""
  );
}

function getEventEndDate(event = {}) {
  const value =
    event.endDate ||
    event.startDate ||
    event.date;

  if (!value) return null;

  const normalized =
    typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value)
      ? `${value}T23:59:59`
      : value;

  const date = new Date(normalized);

  return Number.isNaN(date.getTime()) ? null : date;
}

function isEventPast(event = {}) {
  const endDate = getEventEndDate(event);

  return Boolean(
    endDate && endDate.getTime() < Date.now()
  );
}

function getRegistrationStatus(event, isFull) {
  if (isFull) {
    return "Waitlisted";
  }

  return event.requireApproval
    ? "Pending"
    : "Registered";
}

// ==================================================
// 1. GET ALL PUBLISHED PUBLIC EVENTS
//
// GET /api/events
// GET /api/events?type=all
// GET /api/events?type=seminar
// GET /api/events?type=workshop
// GET /api/events?type=hackathon
// ==================================================

router.get("/", async (req, res) => {
  try {
    const requestedType = normalizeText(req.query.type);

    const snapshot = await eventsCollection.get();

    const events = snapshot.docs
      .map(publicEventData)
      .filter(
        (event) =>
          isPublishedPublic(event) &&
          matchesEventType(event, requestedType)
      )
      .sort((a, b) =>
        String(
          a.startDate || a.date || "9999-12-31"
        ).localeCompare(
          String(b.startDate || b.date || "9999-12-31")
        )
      );

    return res.status(200).json({
      success: true,
      count: events.length,
      events,
    });
  } catch (error) {
    console.error("GET PUBLIC EVENTS ERROR:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch events.",
    });
  }
});

// ==================================================
// 2. GET EVENT BY SLUG OR ID
//
// GET /api/events/slug/:slug
// ==================================================

router.get("/slug/:slug", async (req, res) => {
  try {
    const requested = String(
      req.params.slug || ""
    ).trim();

    if (!requested) {
      return res.status(400).json({
        success: false,
        message: "Event slug is required.",
      });
    }

    // First search by slug.
    let snapshot = await eventsCollection
      .where("slug", "==", requested)
      .limit(1)
      .get();

    // Second search by stored event ID.
    if (snapshot.empty) {
      snapshot = await eventsCollection
        .where("id", "==", requested)
        .limit(1)
        .get();
    }

    // Final fallback: Firestore document ID.
    if (snapshot.empty) {
      const direct = await eventsCollection
        .doc(requested)
        .get();

      if (direct.exists) {
        snapshot = {
          docs: [direct],
          empty: false,
        };
      }
    }

    if (snapshot.empty || !snapshot.docs?.length) {
      return res.status(404).json({
        success: false,
        message: "Event not found.",
      });
    }

    const doc = snapshot.docs[0];
    const event = publicEventData(doc);

    if (!isPublishedPublic(event)) {
      return res.status(404).json({
        success: false,
        message: "Event not found or not published.",
      });
    }

    const registrationsSnapshot = await doc.ref
      .collection("registrations")
      .get();

    const registrations = registrationsSnapshot.docs.map(
      (item) => item.data()
    );

    const registrationCount = registrations.filter(
      (registration) =>
        normalizeText(registration.status) !== "rejected"
    ).length;

    return res.status(200).json({
      success: true,
      event: {
        ...event,
        registrationCount,
        registrations: [],
      },
    });
  } catch (error) {
    console.error("GET EVENT BY SLUG ERROR:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch event details.",
    });
  }
});

// ==================================================
// 3. REGISTER FOR AN EVENT
//
// POST /api/events/:eventId/registrations
// ==================================================

router.post("/:eventId/registrations", async (req, res) => {
  try {
    const eventId = String(
      req.params.eventId || ""
    ).trim();

    if (!eventId) {
      return res.status(400).json({
        success: false,
        message: "Event ID is required.",
      });
    }

    const eventRef = eventsCollection.doc(eventId);

    const registrationRef = eventRef
      .collection("registrations")
      .doc(crypto.randomUUID());

    const payload = req.body || {};

    // Dynamic registration answers.
    const answers =
      payload.answers &&
      typeof payload.answers === "object" &&
      !Array.isArray(payload.answers)
        ? payload.answers
        : {};

    // Extract common identity fields from answers.
    const emailAnswer =
      answers.email ||
      answers["email-address"] ||
      Object.entries(answers).find(([key]) =>
        /email/i.test(String(key))
      )?.[1];

    const phoneAnswer =
      answers.phone ||
      answers.mobile ||
      Object.entries(answers).find(([key]) =>
        /phone|mobile/i.test(String(key))
      )?.[1];

    const nameAnswer =
      answers["full-name"] ||
      answers.fullName ||
      answers.name ||
      Object.entries(answers).find(([key]) =>
        /^name|full name/i.test(String(key))
      )?.[1];

    const email = normalizeEmail(
      payload.email || emailAnswer
    );

    const phone = normalizePhone(
      payload.phone ||
      payload.mobile ||
      phoneAnswer
    );

    const participantName = String(
      payload.participantName ||
      payload.name ||
      nameAnswer ||
      ""
    ).trim();

    // ----------------------------------------------
    // BASIC VALIDATION
    // ----------------------------------------------

    if (!participantName) {
      return res.status(400).json({
        success: false,
        message: "Participant name is required.",
      });
    }

    if (
      !email ||
      !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)
    ) {
      return res.status(400).json({
        success: false,
        message: "Please provide a valid email address.",
      });
    }

    if (phone && !/^[6-9]\d{9}$/.test(phone)) {
      return res.status(400).json({
        success: false,
        message: "Please provide a valid 10-digit Indian mobile number.",
      });
    }

    // ----------------------------------------------
    // FIRESTORE TRANSACTION
    // ----------------------------------------------

    const result = await db.runTransaction(
      async (transaction) => {
        // Read event.
        const eventSnapshot = await transaction.get(
          eventRef
        );

        if (!eventSnapshot.exists) {
          throw createHttpError(
            "This event could not be found. Refresh and try again.",
            404
          );
        }

        const event = {
          id: eventSnapshot.id,
          ...eventSnapshot.data(),
        };

        // Event must be published and public.
        if (!isPublishedPublic(event)) {
          throw createHttpError(
            "Event not found or registration is unavailable.",
            404
          );
        }

        // ------------------------------------------
        // REGISTRATION DEADLINE
        // ------------------------------------------

        if (event.registrationDeadline) {
          const deadlineValue =
            String(event.registrationDeadline);

          const deadlineDate = new Date(
            /^\d{4}-\d{2}-\d{2}$/.test(deadlineValue)
              ? `${deadlineValue}T23:59:59`
              : deadlineValue
          );

          if (
            !Number.isNaN(deadlineDate.getTime()) &&
            deadlineDate.getTime() < Date.now()
          ) {
            throw createHttpError(
              "Registration deadline has passed.",
              409
            );
          }
        }

        // ------------------------------------------
        // EVENT DATE VALIDATION
        // ------------------------------------------

        if (
          isEventPast(event) ||
          ["past", "closed", "archived"].includes(
            normalizeText(event.status)
          )
        ) {
          throw createHttpError(
            "Registration for this event is closed.",
            409
          );
        }

        // ------------------------------------------
        // READ EXISTING REGISTRATIONS
        // ------------------------------------------

        const registrationsRef =
          eventRef.collection("registrations");

        const existingSnapshot = await transaction.get(
          registrationsRef
        );

        const existing = existingSnapshot.docs.map(
          (item) => item.data()
        );

        const activeCount = existing.filter(
          (registration) =>
            normalizeText(registration.status) !== "rejected"
        ).length;

        // ------------------------------------------
        // CAPACITY AND WAITLIST
        // ------------------------------------------

        const capacity = Number(
          event.capacity ||
          event.participantCapacity ||
          0
        );

        const isFull =
          capacity > 0 &&
          activeCount >= capacity;

        if (isFull && !event.waitlistEnabled) {
          throw createHttpError(
            "This event has reached its registration capacity.",
            409
          );
        }

        // ------------------------------------------
        // DUPLICATE EMAIL CHECK
        // ------------------------------------------

        const duplicateEmail = existing.some(
          (registration) =>
            normalizeEmail(
              registration.email ||
              registration.emailAddress
            ) === email
        );

        if (duplicateEmail) {
          throw createHttpError(
            "Already registered: this email address has already been used for this event.",
            409
          );
        }

        // ------------------------------------------
        // DUPLICATE PHONE CHECK
        // ------------------------------------------

        if (phone) {
          const duplicatePhone = existing.some(
            (registration) =>
              normalizePhone(
                registration.phone ||
                registration.mobile ||
                registration.mobileNumber
              ) === phone
          );

          if (duplicatePhone) {
            throw createHttpError(
              "Already registered: this mobile number has already been used for this event.",
              409
            );
          }
        }

        // ------------------------------------------
        // DYNAMIC REGISTRATION FIELD VALIDATION
        // ------------------------------------------

        const configuredFields = Array.isArray(
          event.registrationFields
        )
          ? event.registrationFields
          : [];

        for (const field of configuredFields) {
          if (!field || !field.required) {
            continue;
          }

          const answer = getAnswer(
            answers,
            field
          );

          if (isBlankAnswer(answer)) {
            throw createHttpError(
              `Please complete the required field: ${
                field.label || "Registration question"
              }.`,
              400
            );
          }

          // Validate custom email fields.
          if (
            normalizeText(field.type) === "email"
          ) {
            const value = normalizeEmail(answer);

            if (
              !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(value)
            ) {
              throw createHttpError(
                `Please provide a valid email address for: ${
                  field.label || "Email"
                }.`,
                400
              );
            }
          }

          // Validate custom phone fields.
          if (
            ["tel", "phone", "mobile"].includes(
              normalizeText(field.type)
            )
          ) {
            const value = normalizePhone(answer);

            if (
              value &&
              !/^[6-9]\d{9}$/.test(value)
            ) {
              throw createHttpError(
                `Please provide a valid mobile number for: ${
                  field.label || "Phone"
                }.`,
                400
              );
            }
          }
        }

        // ------------------------------------------
        // CREATE REGISTRATION DOCUMENT
        // ------------------------------------------

        const registrationStatus =
          getRegistrationStatus(event, isFull);

        const registration = {
          id: registrationRef.id,
          eventId: eventSnapshot.id,

          participantName,
          email,
          phone,
          mobile: phone,

          answers,

          status: registrationStatus,

          submittedAt: new Date().toISOString(),
          createdAt: FieldValue.serverTimestamp(),
        };

        // Save registration in Firestore.
        transaction.create(
          registrationRef,
          registration
        );

        transaction.update(eventRef, {
          updatedAt: FieldValue.serverTimestamp(),
        });

        return {
          ...registration,
          createdAt: new Date().toISOString(),
        };
      }
    );

    // ----------------------------------------------
    // SUCCESS RESPONSE
    // ----------------------------------------------

    console.log(
      "REGISTRATION SAVED:",
      result.id,
      "EVENT:",
      eventId
    );

    return res.status(201).json({
      success: true,
      message: "Registration saved successfully.",
      registration: result,
    });

  } catch (error) {
    console.error(
      "EVENT REGISTRATION ERROR:",
      error
    );

    const statusCode = Number(error.status) || 500;

    return res.status(statusCode).json({
      success: false,
      message:
        statusCode === 500
          ? "Failed to save registration. Please try again."
          : error.message,
    });
  }
});

// ==================================================
// EXPORT ROUTER
// ==================================================

module.exports = router;