import { Router } from "express";
import prisma from "../prisma";
const router = Router();
/**
 * POST /settings/update
 * Body: { userId: number, settings: { theme?: "light"|"dark", language?: "ru"|"en", soundOn?: boolean, notificationsOn?: boolean, displayName?: string, avatarEmoji?: string } }
 */
router.post("/update", async (req, res) => {
    try {
        const { userId, settings } = req.body;
        if (!userId || !settings) {
            return res.status(400).json({ error: "userId and settings required" });
        }
        // Update basic user fields if provided
        if (settings.displayName || settings.avatarEmoji) {
            await prisma.user.update({
                where: { id: userId },
                data: {
                    displayName: settings.displayName,
                    avatarEmoji: settings.avatarEmoji,
                }
            });
        }
        // Upsert settings row, including avatarEmoji
        await prisma.settings.upsert({
            where: { userId },
            create: {
                userId,
                theme: settings.theme ?? "light",
                language: settings.language ?? "ru",
                soundEnabled: settings.soundOn ?? true,
                notifications: settings.notificationsOn ?? true,
            },
            update: {
                theme: settings.theme,
                language: settings.language,
                soundEnabled: settings.soundOn,
                notifications: settings.notificationsOn,
            },
        });
        res.json({ success: true });
    }
    catch (err) {
        console.error(err);
        res.status(500).json({ error: "Internal server error" });
    }
});
export default router;
