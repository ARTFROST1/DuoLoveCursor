import { Router } from "express";
import prisma from "../prisma";

const router = Router();

/**
 * GET /profile/:userId -> aggregated profile information
 * Returns user basic info, partner info (if connected), partnership date,
 * simple statistics, achievements and recent history entries.
 */
router.get("/:userId", async (req, res) => {
  try {
    const userId = Number(req.params.userId);
    if (!userId) {
      return res.status(400).json({ error: "Invalid userId" });
    }

    // Fetch user basic info
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, displayName: true, avatarId: true, avatarEmoji: true },
    });
    if (!user) return res.status(404).json({ error: "User not found" });

    // Fetch active partnership, if any
    const partnership = await prisma.partnership.findFirst({
      where: {
        isActive: true,
        OR: [{ user1Id: userId }, { user2Id: userId }],
      },
      include: {
        user1: { select: { id: true, displayName: true, avatarId: true, avatarEmoji: true } },
        user2: { select: { id: true, displayName: true, avatarId: true, avatarEmoji: true } },
      },
    });

    type PartnerInfo = { id: number; name?: string; avatarId?: number; avatarEmoji?: string };
    let partner: PartnerInfo | undefined;
    if (partnership) {
      const partnerUser = partnership.user1Id === userId ? partnership.user2 : partnership.user1;
      partner = {
        id: partnerUser.id,
        name: partnerUser.displayName ?? undefined,
        avatarId: partnerUser.avatarId ?? undefined,
        avatarEmoji: partnerUser.avatarEmoji ?? undefined,
      };
    }

    // --- Statistics ---
    const totalGames = await prisma.gameSession.count({
      where: { OR: [{ partner1Id: userId }, { partner2Id: userId }] },
    });

    const wins = await prisma.gameSession.count({ where: { winnerId: userId } });

    const stats = { totalGames, wins };

    // --- Achievements ---
    const achievements = await prisma.userAchievement.findMany({
      where: { userId },
      include: { achievement: true },
      orderBy: { achievedAt: "desc" },
    });

    // --- History (last 20 games) ---
    const rawHistory = await prisma.history.findMany({
      where: { userId },
      include: {
        gameSession: {
          include: { game: true, partner1: true, partner2: true },
        },
      },
      orderBy: { playedAt: "desc" },
      take: 20,
    });

    // Enrich with UI-friendly fields
    const history = rawHistory.map((h) => {
      const gs = h.gameSession;
      const initiatorIsUser = gs.partner1Id === userId;
      const initiator = initiatorIsUser ? "Ты" : gs.partner1.displayName ?? "Партнёр";
      const winnerId = gs.winnerId;
      const resultText = winnerId == null ? "Ничья" : winnerId === userId ? "Ты выиграл" : "Ты проиграл";
      const durationSec = gs.endedAt ? Math.round((new Date(gs.endedAt).getTime() - new Date(gs.startedAt).getTime()) / 1000) : null;
      return {
        id: h.id,
        playedAt: h.playedAt,
        gameTitle: gs.game.title,
        gameSlug: gs.game.slug,
        initiator,
        resultShort: resultText,
        durationSec,
        canRepeat: gs.game.isActive,
        gameSessionId: gs.id,
      };
    });

    res.json({
      user: { id: user.id, name: user.displayName, avatarId: user.avatarId, avatarEmoji: user.avatarEmoji },
      partner,
      partnershipCreatedAt: partnership?.connectedAt,
      stats,
      achievements,
      history,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
