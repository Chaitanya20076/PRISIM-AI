
const express = require("express");
const fs = require("node:fs/promises");
const path = require("node:path");
const crypto = require("node:crypto");

const router = express.Router();

const DATA_DIR = path.join(__dirname, "../data");
const DATA_FILE = path.join(DATA_DIR, "ai-tool-of-week.json");

// Weekly cycle: Monday to Sunday, India time.
const TIME_ZONE = "Asia/Kolkata";

const DEFAULT_DATA = {
  published: null,
  draft: null,
  history: [],
};

const ALLOWED_FIELDS = [
  "name",
  "tagline",
  "category",
  "customCategory",
  "websiteUrl",
  "logoUrl",
  "overview",
  "whyFeatured",
  "keyFeatures",
  "bestFor",
  "pricing",
  "pros",
  "cons",
  "howToUse",
  "examplePrompts",
  "tags",
  "githubUrl",
  "documentationUrl",
  "videoUrl",
  "newsletterUrl",
  "theme",
  "accentColor",
  "surfaceColor",
  "textColor",
  "sections",
];

const URL_FIELDS = [
  "websiteUrl",
  "logoUrl",
  "githubUrl",
  "documentationUrl",
  "videoUrl",
  "newsletterUrl",
];

function getWeekKey(date = new Date()) {
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(date);

  const values = Object.fromEntries(
    parts.map((part) => [part.type, part.value])
  );

  const year = Number(values.year);
  const month = Number(values.month);
  const day = Number(values.day);

  const current = new Date(Date.UTC(year, month - 1, day));
  const dayOfWeek = current.getUTCDay();

  // Monday is the first day of the week.
  const offset = (dayOfWeek + 6) % 7;

  current.setUTCDate(current.getUTCDate() - offset);

  return current.toISOString().slice(0, 10);
}

function getWeekEndsAt() {
  const weekStart = getWeekKey();

  // Week ends at next Monday, 00:00 IST.
  const nextMonday = new Date(
    `${weekStart}T00:00:00+05:30`
  );

  nextMonday.setUTCDate(nextMonday.getUTCDate() + 7);

  return nextMonday.toISOString();
}

async function readData() {
  try {
    const content = await fs.readFile(DATA_FILE, "utf8");
    const parsed = JSON.parse(content);

    return {
      ...DEFAULT_DATA,
      ...parsed,
      history: Array.isArray(parsed.history)
        ? parsed.history
        : [],
    };
  } catch (error) {
    if (error.code === "ENOENT") {
      return {
        ...DEFAULT_DATA,
        history: [],
      };
    }

    throw error;
  }
}

async function writeData(data) {
  await fs.mkdir(DATA_DIR, { recursive: true });

  const tempFile = `${DATA_FILE}.${crypto.randomUUID()}.tmp`;

  try {
    await fs.writeFile(
      tempFile,
      JSON.stringify(data, null, 2),
      "utf8"
    );

    await fs.rename(tempFile, DATA_FILE);
  } catch (error) {
    await fs.unlink(tempFile).catch(() => {});
    throw error;
  }
}

// Serialize changes to avoid simultaneous writes
// overwriting each other's data.
let writeQueue = Promise.resolve();

function updateData(callback) {
  const operation = writeQueue.then(async () => {
    const data = await readData();
    const result = await callback(data);

    if (result.save) {
      await writeData(data);
    }

    return result.response;
  });

  writeQueue = operation.catch(() => {});

  return operation;
}

function cleanTool(input = {}) {
  const result = {};

  for (const field of ALLOWED_FIELDS) {
    if (field === "sections") {
      result.sections = Array.isArray(input.sections)
        ? input.sections.slice(0, 30).map((section) => ({
            id: String(
              section?.id || crypto.randomUUID()
            ).slice(0, 100),

            title: String(
              section?.title || ""
            ).slice(0, 200),

            content: String(
              section?.content || ""
            ).slice(0, 10000),
          }))
        : [];

      continue;
    }

    const value = input[field];

    result[field] = Array.isArray(value)
      ? value.map((item) => String(item).trim())
          .filter(Boolean)
          .slice(0, 100)
          .join("\n")
      : String(value ?? "").trim().slice(0, 20000);
  }

  return result;
}

function validateTool(tool, publishing = false) {
  if (publishing && !tool.name) {
    return "AI tool name is required.";
  }

  if (publishing && !tool.overview) {
    return "AI tool overview is required.";
  }

  for (const field of URL_FIELDS) {
    const value = tool[field];

    if (!value) continue;

    try {
      const url = new URL(value);

      if (!["http:", "https:"].includes(url.protocol)) {
        return `${field} must use HTTP or HTTPS.`;
      }
    } catch {
      return `${field} must be a valid URL.`;
    }
  }

  for (const field of [
    "accentColor",
    "surfaceColor",
    "textColor",
  ]) {
    if (
      tool[field] &&
      !/^#[0-9a-fA-F]{6}$/.test(tool[field])
    ) {
      return `${field} must be a valid hex colour.`;
    }
  }

  return null;
}

function getWeekStatus(data) {
  const currentWeek = getWeekKey();

  const publishedThisWeek =
    Boolean(data.published) &&
    data.published.weekKey === currentWeek;

  return {
    canCreate: !publishedThisWeek,
    publishedThisWeek,
    weekEndsAt: getWeekEndsAt(),
  };
}

function serverError(res, error) {
  console.error("[AI Tool of the Week]", error);

  return res.status(500).json({
    success: false,
    message: "Internal server error.",
  });
}

/* =========================================
   GET /public
   Public: currently published tool
========================================= */

router.get("/public", async (req, res) => {
  try {
    const data = await readData();

    return res.status(200).json({
      success: true,
      published: data.published,
    });
  } catch (error) {
    return serverError(res, error);
  }
});

/* =========================================
   GET /admin
   Admin: published tool + draft + status
========================================= */

router.get("/admin", async (req, res) => {
  try {
    const data = await readData();

    return res.status(200).json({
      success: true,
      published: data.published,
      draft: data.draft,
      weekStatus: getWeekStatus(data),
    });
  } catch (error) {
    return serverError(res, error);
  }
});

/* =========================================
   PUT /draft
   Save or update unpublished draft
========================================= */

router.put("/draft", async (req, res) => {
  try {
    if (
      !req.body ||
      typeof req.body !== "object" ||
      Array.isArray(req.body)
    ) {
      return res.status(400).json({
        success: false,
        message: "Invalid draft data.",
      });
    }

    const tool = cleanTool(req.body);
    const validationError = validateTool(tool);

    if (validationError) {
      return res.status(400).json({
        success: false,
        message: validationError,
      });
    }

    const response = await updateData(async (data) => {
      const now = new Date().toISOString();

      data.draft = {
        ...tool,
        id: data.draft?.id || crypto.randomUUID(),
        status: "draft",
        createdAt: data.draft?.createdAt || now,
        updatedAt: now,
      };

      return {
        save: true,
        response: {
          success: true,
          message: "Draft saved successfully.",
          draft: data.draft,
        },
      };
    });

    return res.status(200).json(response);
  } catch (error) {
    return serverError(res, error);
  }
});

/* =========================================
   POST /publish
   One new tool per week.
   Same-week edits are permitted.
========================================= */

router.post("/publish", async (req, res) => {
  try {
    if (
      !req.body ||
      typeof req.body !== "object" ||
      Array.isArray(req.body)
    ) {
      return res.status(400).json({
        success: false,
        message: "Invalid tool data.",
      });
    }

    const tool = cleanTool(req.body);
    const validationError = validateTool(tool, true);

    if (validationError) {
      return res.status(400).json({
        success: false,
        message: validationError,
      });
    }

    const result = await updateData(async (data) => {
      const now = new Date().toISOString();
      const currentWeek = getWeekKey();

      const existing = data.published;

      const publishedThisWeek =
        existing?.weekKey === currentWeek;

      // A published tool from the current week
      // can only be edited, not replaced with a new one.
      if (
        publishedThisWeek &&
        req.body.id !== existing.id
      ) {
        return {
          save: false,
          response: {
            statusCode: 409,
            success: false,
            message:
              "A tool has already been published this week. Edit and republish the existing tool instead.",
          },
        };
      }

      if (publishedThisWeek) {
        // Update the existing weekly publication.
        data.published = {
          ...tool,
          id: existing.id,
          status: "published",
          weekKey: currentWeek,
          publishedAt: existing.publishedAt,
          updatedAt: now,
        };
      } else {
        // Preserve the previous week's publication.
        if (existing) {
          data.history = [
            existing,
            ...data.history,
          ];
        }

        data.published = {
          ...tool,
          id: crypto.randomUUID(),
          status: "published",
          weekKey: currentWeek,
          publishedAt: now,
          updatedAt: now,
        };
      }

      data.draft = null;

      return {
        save: true,
        response: {
          statusCode: 200,
          success: true,
          message: publishedThisWeek
            ? "AI tool updated successfully."
            : "AI Tool of the Week published successfully.",
          published: data.published,
          weekStatus: getWeekStatus(data),
        },
      };
    });

    return res.status(result.statusCode).json(result);
  } catch (error) {
    return serverError(res, error);
  }
});

module.exports = router;
