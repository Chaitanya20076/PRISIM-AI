
require("dotenv").config();

const express = require("express");
const cors = require("cors");

const { db } = require("./config/firebaseAdmin");

const adminEventsRoutes = require("./routes/adminEventsRoutes");
const eventsRoutes = require("./routes/eventsRoutes");
const adminAuthRoutes = require("./routes/adminAuthRoutes");
const announcementRoutes = require("./routes/announcementRoutes");

const app = express();
const PORT = process.env.PORT || 5000;

// --------------------------------------------------
// CORS CONFIGURATION
// --------------------------------------------------

const allowedOrigins = (
  process.env.FRONTEND_URL || "http://localhost:5173"
)
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.includes(origin)) {
        return callback(null, true);
      }

      return callback(new Error("Not allowed by CORS."));
    },

    methods: [
      "GET",
      "POST",
      "PUT",
      "PATCH",
      "DELETE",
      "OPTIONS",
    ],

    allowedHeaders: [
      "Content-Type",
      "Authorization",
    ],
  })
);

// --------------------------------------------------
// BODY PARSING
// --------------------------------------------------

app.use(express.json({ limit: "10mb" }));

app.use(
  express.urlencoded({
    extended: true,
    limit: "10mb",
  })
);

// --------------------------------------------------
// ROOT ROUTE
// --------------------------------------------------

app.get("/", (req, res) => {
  return res.status(200).json({
    success: true,
    message: "PRISM AI Backend is running!",
  });
});

// --------------------------------------------------
// API HEALTH CHECK
// --------------------------------------------------

app.get("/api/health", (req, res) => {
  return res.status(200).json({
    success: true,
    message: "PRISM AI API is healthy.",
  });
});

// --------------------------------------------------
// FIREBASE HEALTH CHECK
// --------------------------------------------------

app.get("/api/health/firebase", async (req, res) => {
  try {
    await db.collection("_health").limit(1).get();

    return res.status(200).json({
      success: true,
      message: "Firebase Admin connected successfully!",
      firestore: "Connected",
    });
  } catch (error) {
    console.error("Firebase health check failed:", error);

    return res.status(500).json({
      success: false,
      message: "Firebase connection failed.",
      firestore: "Disconnected",
    });
  }
});

// --------------------------------------------------
// ADMIN EVENT ROUTES
// --------------------------------------------------

app.use(
  "/api/admin/events",
  adminEventsRoutes
);

// --------------------------------------------------
// ADMIN AUTHENTICATION
// --------------------------------------------------

app.use(
  "/api/admin",
  adminAuthRoutes.router
);

// --------------------------------------------------
// PUBLIC EVENT ROUTES
// --------------------------------------------------

app.use(
  "/api/events",
  eventsRoutes
);

// --------------------------------------------------
// ANNOUNCEMENT ROUTES - FIRESTORE
// --------------------------------------------------

// Public announcements:
// GET /api/announcements/public

app.use(
  "/api/announcements",
  announcementRoutes
);

// Admin announcement operations:
// GET    /api/admin/announcements
// POST   /api/admin/announcements
// PUT    /api/admin/announcements/:id
// DELETE /api/admin/announcements/:id

app.use(
  "/api/admin/announcements",
  announcementRoutes
);

// --------------------------------------------------
// 404 HANDLER
// --------------------------------------------------

app.use((req, res) => {
  return res.status(404).json({
    success: false,
    message: "API route not found.",
    path: req.originalUrl,
  });
});

// --------------------------------------------------
// GLOBAL ERROR HANDLER
// --------------------------------------------------

app.use((error, req, res, next) => {
  console.error("Backend error:", error);

  if (res.headersSent) {
    return next(error);
  }

  const statusCode = error.status || 500;

  return res.status(statusCode).json({
    success: false,
    message:
      statusCode < 500
        ? error.message
        : "Internal server error.",
  });
});

// --------------------------------------------------
// START SERVER
// --------------------------------------------------

app.listen(PORT, () => {
  console.log("-----------------------------------");
  console.log("          PRISM AI BACKEND");
  console.log("-----------------------------------");

  console.log(`Server: http://localhost:${PORT}`);
  console.log(`Frontend: ${allowedOrigins.join(", ")}`);

  console.log("Firebase: Configured");
  console.log("Admin Authentication: Enabled");
  console.log("Admin Events: Enabled");
  console.log("Public Events: Enabled");
  console.log("Firestore Announcements: Enabled");

  console.log("-----------------------------------");
});
