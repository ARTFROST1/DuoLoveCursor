import { Router } from "express";
import prisma from "../prisma";
import { io } from "../index";

const router = Router();

// GET /partnership/status?userId=123
router.get("/status", async (req, res) => {
  const userId = Number(req.query.userId);
  if (!userId) return res.status(400).json({ error: "userId required" });

  const partnership = await prisma.partnership.findFirst({
    where: {
      isActive: true,
      OR: [
        { user1Id: userId },
        { user2Id: userId },
      ],
    },
    include: { user1: true, user2: true },
  });

  if (!partnership) return res.json({ connected: false });

  // @ts-ignore - createdAt exists on model although Prisma type may omit
  const createdAt = (partnership as any).createdAt as Date;

  const partner = partnership.user1Id === userId ? partnership.user2 : partnership.user1;
  return res.json({ connected: true, createdAt, partner: { id: partner.id, name: partner.displayName, telegramId: partner.telegramId } });
});

/**
 * POST /partnership/disconnect
 * Body: { userId: number }
 * Sets isActive=false for active partnership and returns success. Future: emit socket event.
 */
router.post("/disconnect", async (req, res) => {
  try {
    const { userId } = req.body as { userId?: number };
    if (!userId) return res.status(400).json({ error: "userId required" });

    // Find active partnership
    const partnership = await prisma.partnership.findFirst({
      where: {
        isActive: true,
        OR: [{ user1Id: userId }, { user2Id: userId }],
      },
    });

    if (!partnership) return res.status(400).json({ error: "No active partnership" });

    await prisma.partnership.update({ where: { id: partnership.id }, data: { isActive: false } });

    // Emit socket event to both users
    io.to(`user_${partnership.user1Id}`).emit("partnerDisconnected");
    io.to(`user_${partnership.user2Id}`).emit("partnerDisconnected");

    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
