import { Router } from "express";
import prisma from "../prisma";
import { ACHIEVEMENTS } from "../achievements";
const router = Router();
/**
 * GET /achievements/metadata
 * Returns the static list of all achievements definitions.
 */
router.get("/metadata", (_req, res) => {
    res.json(ACHIEVEMENTS);
});
/**
 * GET /achievements/:userId
 * Returns the list of achievements for the given user including locked ones.
 * Response structure:
 * [
 *   {
 *     slug: string;
 *     emoji: string;
 *     title: string;
 *     description: string;
 *     category: string;
 *     goal?: number;
 *     scope: "INDIVIDUAL" | "COUPLE";
 *     unlocked: boolean;
 *     progress: number;
 *     achievedAt?: string;
 *   }
 * ]
 */
router.get("/:userId", async (req, res) => {
    const userId = Number(req.params.userId);
    if (!userId)
        return res.status(400).json({ error: "Invalid userId" });
    try {
        // Fetch individual achievements with joined achievement data
        const ua = await prisma.userAchievement.findMany({
            where: { userId },
            include: { achievement: true },
        });
        // Fetch active partnership to get couple achievements
        const partnership = await prisma.partnership.findFirst({
            where: {
                isActive: true,
                OR: [{ user1Id: userId }, { user2Id: userId }],
            },
        });
        const ca = partnership
            ? await prisma.coupleAchievement.findMany({
                where: { partnershipId: partnership.id },
                include: { achievement: true },
            })
            : [];
        const result = ACHIEVEMENTS.map((def) => {
            let unlocked = false;
            let progress = 0;
            let achievedAt;
            if (def.scope === "INDIVIDUAL" || !partnership) {
                const rec = ua.find((r) => r.achievement.slug === def.slug);
                if (rec) {
                    unlocked = !!rec.achievedAt;
                    progress = rec.progress;
                    achievedAt = rec.achievedAt ?? undefined;
                }
            }
            else {
                const rec = ca.find((r) => r.achievement.slug === def.slug);
                if (rec) {
                    unlocked = !!rec.achievedAt;
                    progress = rec.progress;
                    achievedAt = rec.achievedAt ?? undefined;
                }
            }
            return {
                ...def,
                scope: def.scope ?? "INDIVIDUAL",
                unlocked,
                progress,
                achievedAt,
            };
        });
        res.json(result);
    }
    catch (err) {
        console.error(err);
        res.status(500).json({ error: "Internal server error" });
    }
});
export default router;
