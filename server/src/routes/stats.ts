import { Router } from "express";
import prisma from "../prisma";

const router = Router();

/**
 * GET /stats/:userId – расширенная статистика пользователя и пары
 */
router.get("/:userId", async (req, res) => {
  try {
    const userId = Number(req.params.userId);
    if (!userId) return res.status(400).json({ error: "Invalid userId" });

    // ------------- PERSONAL STATS -------------
    // Все игровые сессии пользователя (как partner1 или partner2)
    const sessions = await prisma.gameSession.findMany({
      where: {
        OR: [{ partner1Id: userId }, { partner2Id: userId }],
      },
      include: { game: true },
    });

    const totalGames = sessions.length;

    // Победы / поражения / ничьи
    let wins = 0,
      draws = 0;
    sessions.forEach((s) => {
      if (s.winnerId === null) draws += 1;
      else if (s.winnerId === userId) wins += 1;
    });
    const losses = totalGames - wins - draws;

    const successRate = totalGames ? Math.round((wins / totalGames) * 100) : 0;

    // Распределение по категориям и любимая игра
    const gamesByCategory: Record<string, number> = {};
    const gameCountById: Record<number, { title: string; count: number }> = {};
    sessions.forEach((s) => {
      const cat = s.game.category || "Прочее";
      gamesByCategory[cat] = (gamesByCategory[cat] || 0) + 1;

      gameCountById[s.gameId] = gameCountById[s.gameId]
        ? { title: s.game.title, count: gameCountById[s.gameId].count + 1 }
        : { title: s.game.title, count: 1 };
    });
    let favoriteGame: { id: number; title: string; count: number } | undefined;
    Object.entries(gameCountById).forEach(([id, obj]) => {
      if (!favoriteGame || obj.count > favoriteGame.count) {
        favoriteGame = { id: Number(id), title: obj.title, count: obj.count };
      }
    });

    // Общее время онлайн – суммируем длительности игровых сессий
    const totalTimeMs = sessions.reduce((acc, s) => {
      const end = s.endedAt ? new Date(s.endedAt).getTime() : Date.now();
      const start = new Date(s.startedAt).getTime();
      return acc + (end - start);
    }, 0);

    // Средняя реакция, если в resultJson есть поле reactionMs
    const reactionValues: number[] = [];
    sessions.forEach((s) => {
      if (s.resultJson && (s.resultJson as any).reactionMs) {
        reactionValues.push((s.resultJson as any).reactionMs as number);
      }
    });
    const reactionAvgMs = reactionValues.length
      ? Math.round(reactionValues.reduce((a, b) => a + b) / reactionValues.length)
      : null;

    // ------------- COUPLE STATS -------------
    const partnership = await prisma.partnership.findFirst({
      where: {
        isActive: true,
        OR: [{ user1Id: userId }, { user2Id: userId }],
      },
    });

    let coupleStats: any = null;
    if (partnership) {
      const partnerId = partnership.user1Id === userId ? partnership.user2Id : partnership.user1Id;

      // Общие сессии пары
      const coupleSessions = sessions.filter(
        (s) =>
          (s.partner1Id === partnerId && s.partner2Id === userId) ||
          (s.partner2Id === partnerId && s.partner1Id === userId)
      );

      const totalCoupleGames = coupleSessions.length;

      // Самая популярная игра вдвоём
      const coupleGameCount: Record<number, { title: string; count: number }> = {};
      coupleSessions.forEach((s) => {
        coupleGameCount[s.gameId] = coupleGameCount[s.gameId]
          ? { title: s.game.title, count: coupleGameCount[s.gameId].count + 1 }
          : { title: s.game.title, count: 1 };
      });
      let mostPlayedTogether: { id: number; title: string; count: number } | undefined;
      Object.entries(coupleGameCount).forEach(([id, obj]) => {
        if (!mostPlayedTogether || obj.count > mostPlayedTogether.count) {
          mostPlayedTogether = { id: Number(id), title: obj.title, count: obj.count };
        }
      });

      // Дни вместе
      const daysTogether = Math.max(
        1,
        Math.floor((Date.now() - new Date(partnership.connectedAt).getTime()) / (1000 * 60 * 60 * 24))
      );

      // Средняя дневная активность (минут)
      const totalCoupleTimeMs = coupleSessions.reduce((acc, s) => {
        const end = s.endedAt ? new Date(s.endedAt).getTime() : Date.now();
        const start = new Date(s.startedAt).getTime();
        return acc + (end - start);
      }, 0);
      const avgDailyActivityMin = Math.round(totalCoupleTimeMs / daysTogether / 60000);

      // Sync score – доля партий, закончившихся ничьёй (обе стороны совпали)
      const tiesCouple = coupleSessions.filter((s) => s.winnerId === null).length;
      const syncScore = totalCoupleGames ? Math.round((tiesCouple / totalCoupleGames) * 100) : 0;

      // Co-op success rate – доля завершённых сессий
      const completed = coupleSessions.filter((s) => s.endedAt !== null).length;
      const coOpSuccessRate = totalCoupleGames ? Math.round((completed / totalCoupleGames) * 100) : 0;

      // Discussion engagement (кол-во игр категории "Romantic"/"Discussion")
      const discussionCount = coupleSessions.filter((s) =>
        ["Romantic", "Discussion"].includes(s.game.category)
      ).length;

      coupleStats = {
        daysTogether,
        totalGamesTogether: totalCoupleGames,
        mostPlayedGameTogether: mostPlayedTogether,
        coOpSuccessRate,
        avgDailyActivityMin,
        discussionCount,
         syncScore,
      };
    }

    res.json({
      personal: {
        totalTimeMs,
        totalGames,
        gamesByCategory,
        favoriteGame,
        wins,
        losses,
        draws,
        reactionAvgMs,
        successRate,
      },
      couple: coupleStats,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
