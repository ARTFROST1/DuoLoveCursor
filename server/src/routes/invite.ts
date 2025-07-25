import { Router } from "express";
import prisma from "../prisma";
import { nanoid } from "nanoid";

const router = Router();

// POST /invite/create -> returns token
router.post("/create", async (req, res) => {
  try {
    const { userId } = req.body;
    if (!userId) {
      return res.status(400).json({ error: "userId required" });
    }

    // Generate unique token
    const token = nanoid(10);

    const invite = await prisma.invite.create({
      data: {
        token,
        createdById: userId,
      },
    });

    res.json({ token: invite.token });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// POST /invite/accept -> accepts invite with token
router.post("/accept", async (req, res) => {
  try {
    const { token, userId } = req.body;
    if (!token || !userId) {
      return res.status(400).json({ error: "token and userId required" });
    }

    const invite = await prisma.invite.findUnique({ where: { token } });
    if (!invite) {
      return res.status(404).json({ error: "Invite not found" });
    }
    if (invite.usedAt) {
      return res.status(400).json({ error: "Invite already used" });
    }

    await prisma.invite.update({
      where: { id: invite.id },
      data: {
        usedById: userId,
        usedAt: new Date(),
      },
    });

    // Create partnership if not exists
    const partnership = await prisma.partnership.findFirst({
      where: {
        OR: [
          { user1Id: invite.createdById, user2Id: userId },
          { user1Id: userId, user2Id: invite.createdById },
        ],
      },
    });

    if (!partnership) {
      await prisma.partnership.create({
        data: {
          user1Id: invite.createdById,
          user2Id: userId,
        },
      });
    }

    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
