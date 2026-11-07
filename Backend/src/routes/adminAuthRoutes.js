
const express = require("express");
const crypto = require("crypto");

const router = express.Router();

const TOKEN_SECRET = process.env.ADMIN_TOKEN_SECRET;
const TOKEN_EXPIRY = 8 * 60 * 60; // 8 hours

// Create a signed admin token
function createToken(payload) {
  const header = Buffer.from(
    JSON.stringify({ alg: "HS256", typ: "JWT" })
  ).toString("base64url");

  const body = Buffer.from(
    JSON.stringify({
      ...payload,
      exp: Math.floor(Date.now() / 1000) + TOKEN_EXPIRY,
    })
  ).toString("base64url");

  const signature = crypto
    .createHmac("sha256", TOKEN_SECRET)
    .update(`${header}.${body}`)
    .digest("base64url");

  return `${header}.${body}.${signature}`;
}

// Verify an admin token
function verifyToken(token) {
  if (!TOKEN_SECRET || !token) return null;

  const parts = token.split(".");
  if (parts.length !== 3) return null;

  const [header, body, signature] = parts;

  const expectedSignature = crypto
    .createHmac("sha256", TOKEN_SECRET)
    .update(`${header}.${body}`)
    .digest();

  let actualSignature;

  try {
    actualSignature = Buffer.from(signature, "base64url");
  } catch {
    return null;
  }

  if (
    actualSignature.length !== expectedSignature.length ||
    !crypto.timingSafeEqual(actualSignature, expectedSignature)
  ) {
    return null;
  }

  try {
    const payload = JSON.parse(
      Buffer.from(body, "base64url").toString("utf8")
    );

    if (!payload.exp || payload.exp < Math.floor(Date.now() / 1000)) {
      return null;
    }

    return payload;
  } catch {
    return null;
  }
}

// Admin login
router.post("/login", (req, res) => {
  try {
    const { name, memberId, password } = req.body;

    if (!TOKEN_SECRET) {
      return res.status(500).json({
        success: false,
        message: "Admin authentication is not configured.",
      });
    }

    const expectedName = process.env.ADMIN_NAME;
    const expectedMemberId = process.env.ADMIN_MEMBER_ID;
    const expectedPassword = process.env.ADMIN_PASSWORD;

    if (!expectedName || !expectedMemberId || !expectedPassword) {
      return res.status(500).json({
        success: false,
        message: "Admin credentials are not configured.",
      });
    }

    const valid =
      typeof name === "string" &&
      typeof memberId === "string" &&
      typeof password === "string" &&
      name.trim().toLowerCase() === expectedName.trim().toLowerCase() &&
      memberId.trim().toLowerCase() === expectedMemberId.trim().toLowerCase() &&
      password === expectedPassword;

    if (!valid) {
      return res.status(401).json({
        success: false,
        message: "Invalid name, Member ID or password.",
      });
    }

    const token = createToken({
      name: expectedName,
      memberId: expectedMemberId,
      role: "admin",
    });

    return res.status(200).json({
      success: true,
      message: "Admin login successful.",
      token,
    });
  } catch (error) {
    console.error("Admin login error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to process admin login.",
    });
  }
});

// Middleware for protecting admin APIs
function requireAdmin(req, res, next) {
  const authorization = req.headers.authorization || "";
  const token = authorization.startsWith("Bearer ")
    ? authorization.slice(7)
    : null;

  const admin = verifyToken(token);

  if (!admin || admin.role !== "admin") {
    return res.status(401).json({
      success: false,
      message: "Admin access required. Please sign in again.",
    });
  }

  req.admin = admin;
  next();
}

// Verify existing admin session
router.get("/verify", requireAdmin, (req, res) => {
  return res.status(200).json({
    success: true,
    message: "Admin session is valid.",
    admin: {
      name: req.admin.name,
      memberId: req.admin.memberId,
      role: req.admin.role,
    },
  });
});

module.exports = {
  router,
  requireAdmin,
};
