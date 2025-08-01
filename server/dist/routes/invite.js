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
        // Ensure creator user exists
        await prisma.user.upsert({
            where: { id: userId },
            update: {},
            create: { id: userId, telegramId: `tg_${userId}` },
        });
        // Generate unique token
        const token = nanoid(10);
        const invite = await prisma.invite.create({
            data: {
                token,
                createdById: userId,
            },
        });
        res.json({ token: invite.token });
    }
    catch (err) {
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
        // ensure usedBy user exists
        await prisma.user.upsert({
            where: { id: userId },
            update: {},
            create: { id: userId, telegramId: `tg_${userId}` },
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
            // No existing partnership, create a new active one
            await prisma.partnership.create({
                data: {
                    user1Id: invite.createdById,
                    user2Id: userId,
                    isActive: true,
                    connectedAt: new Date(),
                },
            });
        }
        else if (!partnership.isActive) {
            // Partnership existed but was previously disconnected – reactivate it
            await prisma.partnership.update({
                where: { id: partnership.id },
                data: {
                    isActive: true,
                    connectedAt: new Date(),
                },
            });
        }
        res.json({ success: true });
    }
    catch (err) {
        console.error(err);
        res.status(500).json({ error: "Internal server error" });
    }
});
export default router;
