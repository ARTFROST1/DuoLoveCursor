import prisma from "../prisma";
import { ACHIEVEMENTS } from "../achievements";

/**
 * Ensure Achievement records exist in DB matching the definitions list.
 * Should be called at boot (optional) or from seed script.
 */
export async function syncAchievementsToDB() {
  for (const def of ACHIEVEMENTS) {
    await prisma.achievement.upsert({
      where: { slug: def.slug },
      update: {
        emoji: def.emoji,
        title: def.title,
        description: def.description,
        category: def.category,
        goal: def.goal ?? null,
        scope: def.scope ?? "INDIVIDUAL",
      },
      create: {
        slug: def.slug,
        emoji: def.emoji,
        title: def.title,
        description: def.description,
        category: def.category,
        goal: def.goal ?? null,
        scope: def.scope ?? "INDIVIDUAL",
      },
    });
  }
}

interface ProcessResultOptions {
  partnershipId: number;
  partner1Id: number;
  partner2Id: number;
  winnerId?: number | null;
}

/**
 * Update achievements related to finishing a game session.
 * Returns list of newly unlocked slugs.
 */
export async function processGameSessionResult(opts: ProcessResultOptions): Promise<string[]> {
  const { partner1Id, partner2Id, winnerId } = opts;
  // Determine partnershipId (some old sessions may lack it)
  let resolvedPartnershipId: number | undefined = opts.partnershipId;
  if (!resolvedPartnershipId) {
    const partnership = await prisma.partnership.findFirst({
      where: {
        OR: [
          { user1Id: partner1Id, user2Id: partner2Id },
          { user1Id: partner2Id, user2Id: partner1Id },
        ],
      },
    });
    resolvedPartnershipId = partnership?.id;
  }
  if (!resolvedPartnershipId) {
    // Cannot process achievements without partnership
    return [];
  }
  const partnershipId: number = resolvedPartnershipId;
  const unlocked: string[] = [];

  // Helper to increment progress & unlock if reached goal
  async function incrementCouple(slug: string, increment = 1) {
    const ach = await prisma.achievement.findUnique({ where: { slug } });
    if (!ach) return;

    let record = await prisma.coupleAchievement.findFirst({
      where: { partnershipId, achievementId: ach.id },
    });

    if (!record) {
      record = await prisma.coupleAchievement.create({
        data: {
          partnershipId,
          achievementId: ach.id,
          progress: 0,
        },
      });
    }

    const newProgress = record.progress + increment;
    const reachGoal = ach.goal ? newProgress >= ach.goal : true;

    await prisma.coupleAchievement.update({
      where: { id: record.id },
      data: {
        progress: newProgress,
        achievedAt: reachGoal && !record.achievedAt ? new Date() : record.achievedAt,
      },
    });

    if (reachGoal && !record.achievedAt) unlocked.push(slug);
  }

  // Basic activity achievements
  await incrementCouple("first_game");
  await incrementCouple("game_duo");
  await incrementCouple("hardcore_mode");

  // Winner achievement
  if (winnerId) {
    await incrementCouple("first_victory");
  }

  return unlocked;
}
