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

// GET /games/by-category -> list active games grouped by category
router.get("/by-category", async (_req, res) => {
  try {
    const games = await prisma.game.findMany({ where: { isActive: true } });

    // Group games by their `category` field
    const grouped: Record<string, typeof games> = {} as any;
    for (const g of games) {
      (grouped[g.category] = grouped[g.category] || []).push(g);
    }

    const result = Object.entries(grouped).map(([category, games]) => ({ category, games }));
    res.json(result);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
