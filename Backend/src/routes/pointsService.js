const crypto = require("crypto");
const { db } = require("../config/firebaseAdmin");

/**
 * Credits event reward points once per registration.
 * The deterministic ledger ID prevents duplicate credits.
 */
async function awardRegistrationPoints({
  uid,
  eventId,
  registrationId,
  points,
  eventTitle,
}) {
  const amount = Math.max(0, Math.floor(Number(points) || 0));

  if (!uid || !eventId || !registrationId || amount <= 0) {
    return { awarded: false, points: 0 };
  }

  const walletRef = db.collection("prismPoints").doc(String(uid));

  const ledgerId = crypto
    .createHash("sha256")
    .update(`${eventId}:${registrationId}`)
    .digest("hex");

  const ledgerRef = walletRef.collection("transactions").doc(ledgerId);

  return db.runTransaction(async (transaction) => {
    const ledgerSnapshot = await transaction.get(ledgerRef);

    if (ledgerSnapshot.exists) {
      return {
        awarded: false,
        points: Number(ledgerSnapshot.data().points) || amount,
      };
    }

    const walletSnapshot = await transaction.get(walletRef);

    const currentBalance = Math.max(
      0,
      Number(walletSnapshot.data()?.balance) || 0
    );

    const nextBalance = currentBalance + amount;

    transaction.set(
      walletRef,
      {
        uid: String(uid),
        balance: nextBalance,
        totalEarned:
          Math.max(
            0,
            Number(walletSnapshot.data()?.totalEarned) || 0
          ) + amount,
        updatedAt: new Date().toISOString(),
      },
      { merge: true }
    );

    transaction.create(ledgerRef, {
      type: "earned",
      points: amount,
      eventId: String(eventId),
      registrationId: String(registrationId),
      eventTitle: String(eventTitle || "PRISM AI Event"),
      description: `Registration reward · ${String(
        eventTitle || "PRISM AI Event"
      )}`,
      createdAt: new Date().toISOString(),
    });

    return {
      awarded: true,
      points: amount,
      balance: nextBalance,
    };
  });
}

module.exports = { awardRegistrationPoints };