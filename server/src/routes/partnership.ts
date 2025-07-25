import { Router } from "express";
import prisma from "../prisma";

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

export default router;
