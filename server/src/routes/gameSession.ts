import { Router } from "express";
import prisma from "../prisma";

const router = Router();

// POST /game-session/start – create a new GameSession and invite partner
// Body: { userId: number, gameSlug: string }
router.post("/start", async (req, res) => {
  const { userId, gameSlug } = req.body as { userId: number; gameSlug: string };
  if (!userId || !gameSlug) return res.status(400).json({ error: "userId and gameSlug required" });
  try {
    const game = await prisma.game.findFirst({ where: { slug: gameSlug, isActive: true } });
    if (!game) return res.status(404).json({ error: "Game not found" });

    // find active partnership for user
    const partnership = await prisma.partnership.findFirst({
      where: {
        isActive: true,
        OR: [{ user1Id: userId }, { user2Id: userId }],
      },
    });
    if (!partnership) return res.status(400).json({ error: "Partnership not found" });

    const partnerId = partnership.user1Id === userId ? partnership.user2Id : partnership.user1Id;

    // Check if there's already an active unfinished session between these partners
    const existing = await prisma.gameSession.findFirst({
      where: {
        endedAt: null,
        OR: [
          { partner1Id: userId, partner2Id: partnerId },
          { partner1Id: partnerId, partner2Id: userId },
        ],
      },
    });
    if (existing) {
      // Do not create a new session – return existing session id
      return res.json({ sessionId: existing.id, existed: true });
    }

    

    const session = await prisma.gameSession.create({
      data: {
        gameId: game.id,
        partner1Id: userId,
        partner2Id: partnerId,
        partnershipId: partnership.id,
      }
    });
    res.json({ sessionId: session.id });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// GET /game-session/open?userId= – list any active (not finished/cancelled) sessions for this user
router.get("/open", async (req, res) => {
  const userId = Number(req.query.userId as string);
  if (!userId) return res.status(400).json({ error: "userId required" });
  try {
    const sessions = await prisma.gameSession.findMany({
      where: {
        endedAt: null,
        OR: [{ partner1Id: userId }, { partner2Id: userId }],
      },
      include: { game: true },
    });
    res.json(sessions);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// GET /game-session/pending?userId= – list sessions awaiting this user's confirmation
router.get("/pending", async (req, res) => {
  const userId = Number(req.query.userId as string);
  if (!userId) return res.status(400).json({ error: "userId required" });
  try {
    const sessions = await prisma.gameSession.findMany({
      where: { partner2Id: userId, partner2Accepted: false, endedAt: null },
      include: { game: true, partner1: { select: { displayName: true } } },
    });
    res.json(sessions);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// POST /game-session/:id/finish – mark session finished manually
router.post("/:id/finish", async (req, res) => {
  const sessionId = Number(req.params.id);
  const { userId } = req.body as { userId: number };
  if (!sessionId || !userId) return res.status(400).json({ error: "sessionId and userId required" });
  try {
    const session = await prisma.gameSession.findUnique({ where: { id: sessionId } });
    if (!session) return res.status(404).json({ error: "Session not found" });
    if (session.endedAt) return res.json({ success: true });
    if (session.partner1Id !== userId && session.partner2Id !== userId)
      return res.status(403).json({ error: "Not a participant" });

    await prisma.gameSession.update({ where: { id: sessionId }, data: { endedAt: new Date() } });
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// POST /game-session/:id/cancel – either partner cancels the session if it hasn't started
router.post("/:id/cancel", async (req, res) => {
  const sessionId = Number(req.params.id);
  const { userId } = req.body as { userId: number };
  if (!sessionId || !userId) return res.status(400).json({ error: "sessionId and userId required" });
  try {
    const session = await prisma.gameSession.findUnique({ where: { id: sessionId } });
    if (!session) return res.status(404).json({ error: "Session not found" });
    if (session.endedAt) return res.status(400).json({ error: "Session already finished" });
    if (session.partner1Id !== userId && session.partner2Id !== userId)
      return res.status(403).json({ error: "Not a participant" });

    await prisma.gameSession.update({ where: { id: sessionId }, data: { endedAt: new Date() } });
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// POST /game-session/:id/accept – partner2 accepts the game invite
router.post("/:id/accept", async (req, res) => {
  const sessionId = Number(req.params.id);
  const { userId } = req.body as { userId: number };
  if (!sessionId || !userId) return res.status(400).json({ error: "sessionId and userId required" });
  try {
    const session = await prisma.gameSession.findUnique({ where: { id: sessionId } });
    if (!session) return res.status(404).json({ error: "Session not found" });
    if (session.partner2Id !== userId)
      return res.status(403).json({ error: "Only invited partner can accept" });

    await prisma.gameSession.update({
      where: { id: sessionId },
      data: { partner2Accepted: true },
    });
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// GET /game-session/:id – get session data
router.get("/:id", async (req, res) => {
  const sessionId = Number(req.params.id);
  if (!sessionId) return res.status(400).json({ error: "sessionId required" });
  try {
    const session = await prisma.gameSession.findUnique({
      where: { id: sessionId },
      include: { game: true, partner1: { select: { displayName: true } }, partner2: { select: { displayName: true } } },
    });
    if (!session) return res.status(404).json({ error: "Session not found" });
    res.json(session);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
