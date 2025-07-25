import { Router } from "express";
import prisma from "../prisma";

const router = Router();

// GET /games -> list active games
router.get("/", async (_req, res) => {
  try {
    const games = await prisma.game.findMany({ where: { isActive: true } });
    res.json(games);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
