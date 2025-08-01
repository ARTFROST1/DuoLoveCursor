import prisma from "../../prisma";
import { processGameSessionResult } from "../../services/achievementService";
import { ACHIEVEMENTS } from "../../achievements";
export class ReactionController {
    io;
    room;
    sessionId;
    session;
    winner = null;
    choices = {};
    constructor(io, room, sessionId, session) {
        this.io = io;
        this.room = room;
        this.sessionId = sessionId;
        this.session = session;
    }
    start() {
        setTimeout(() => {
            this.winner = null;
            this.io.to(this.room).emit("start", { countdownMs: 3000 });
        }, 500);
    }
    async onClientEvent(event, payload, ctx) {
        switch (event) {
            case "reaction":
                await this.handleReaction(ctx.userId);
                break;
            case "choice":
                await this.handleChoice(payload, ctx.userId);
                break;
        }
    }
    async handleReaction(userId) {
        if (this.winner !== null)
            return; // already have winner
        this.winner = userId;
        this.io.to(this.room).emit("result", { winnerId: userId });
        // Process achievements related to game session finish
        const unlocked = await processGameSessionResult({
            partnershipId: this.session.partnershipId,
            partner1Id: this.session.partner1Id,
            partner2Id: this.session.partner2Id,
            winnerId: userId,
        });
        // Notify both partners if unlocked
        unlocked.forEach((slug) => {
            const def = ACHIEVEMENTS.find((a) => a.slug === slug);
            if (!def)
                return;
            this.io.to(`user_${this.session.partner1Id}`).emit("achievementUnlocked", {
                slug,
                emoji: def.emoji,
                title: def.title,
            });
            this.io.to(`user_${this.session.partner2Id}`).emit("achievementUnlocked", {
                slug,
                emoji: def.emoji,
                title: def.title,
            });
        });
        // Persist result and create history entries for both players
        const finishedSession = await prisma.gameSession.update({
            where: { id: this.sessionId },
            data: { winnerId: userId, endedAt: new Date() },
        });
        const isDraw = finishedSession.winnerId == null;
        const getResultText = (targetId) => {
            if (isDraw)
                return "Ничья";
            return finishedSession.winnerId === targetId ? "Ты выиграл" : "Ты проиграл";
        };
        // Create user-specific history records
        await prisma.history.createMany({
            data: [
                {
                    userId: finishedSession.partner1Id,
                    gameSessionId: finishedSession.id,
                    resultShort: getResultText(finishedSession.partner1Id),
                },
                {
                    userId: finishedSession.partner2Id,
                    gameSessionId: finishedSession.id,
                    resultShort: getResultText(finishedSession.partner2Id),
                },
            ],
        });
        // Notify clients to refresh history
        this.io.to(`user_${finishedSession.partner1Id}`).emit("historyAdded");
        this.io.to(`user_${finishedSession.partner2Id}`).emit("historyAdded");
    }
    async handleChoice(payload, userId) {
        this.choices[userId] = payload.action;
        const values = Object.values(this.choices);
        const exitCount = values.filter((c) => c === "exit").length;
        const againCount = values.filter((c) => c === "again").length;
        // Notify progress to clients
        this.io.to(this.room).emit("choiceProgress", { exitCount, againCount });
        if (values.length < 2)
            return; // wait for second player
        this.choices = {}; // reset choices
        if (againCount === 2) {
            // create new session immediately using same game
            const newSession = await prisma.gameSession.create({
                data: {
                    gameId: this.session.gameId,
                    partner1Id: this.session.partner1Id,
                    partner2Id: this.session.partner2Id,
                    partner2Accepted: true,
                    partnershipId: this.session.partnershipId,
                },
            });
            this.io.to(this.room).emit("restart", { sessionId: newSession.id });
        }
        else {
            // any other combination results in exit to main
            this.io.to(this.room).emit("exit");
        }
    }
    dispose() {
        this.winner = null;
        this.choices = {};
    }
}
