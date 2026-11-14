const express = require("express");
const { auth, db } = require("../config/firebaseAdmin");

const router = express.Router();

async function requireMember(req, res, next) {
  const match = String(req.headers.authorization || "").match(
    /^Bearer\s+(.+)$/i
  );

  if (!match) {
    return res.status(401).json({
      success: false,
      message: "Authentication required.",
    });
  }

  try {
    req.member = await auth.verifyIdToken(match[1]);
    return next();
  } catch {
    return res.status(401).json({
      success: false,
      message: "Session expired. Please sign in again.",
    });
  }
}

// GET /api/points/me
// Members can only read their own PRISM Points wallet.
router.get("/me", requireMember, async (req, res) => {
  try {
    const uid = req.member.uid;

    const walletRef = db.collection("prismPoints").doc(uid);

    const [walletSnapshot, transactionsSnapshot] = await Promise.all([
      walletRef.get(),
      walletRef
        .collection("transactions")
        .orderBy("createdAt", "desc")
        .limit(50)
        .get(),
    ]);

    const wallet = walletSnapshot.exists ? walletSnapshot.data() : {};

    const transactions = transactionsSnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));

    return res.status(200).json({
      success: true,
      wallet: {
        balance: Math.max(0, Number(wallet.balance) || 0),
        totalEarned: Math.max(0, Number(wallet.totalEarned) || 0),
        updatedAt: wallet.updatedAt || null,
      },
      transactions,
    });
  } catch (error) {
    console.error("GET MEMBER POINTS ERROR:", error);

    return res.status(500).json({
      success: false,
      message: "Could not load your PRISM Points wallet.",
    });
  }
});

module.exports = router;