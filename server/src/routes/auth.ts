import { Router } from "express";
import prisma from "../prisma";

const router = Router();

// POST /auth { telegramId, name, photoUrl }
router.post("/", async (req, res) => {
  try {
    const { telegramId, name } = req.body;
    if (!telegramId) {
      return res.status(400).json({ error: "telegramId required" });
    }

    const user = await prisma.user.upsert({
      where: { telegramId },
      update: {
        // Do not overwrite displayName if user has already set a custom one
      },
      create: {
        telegramId,
        displayName: name ?? undefined
      },
    });

    return res.json({ id: user.id });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
