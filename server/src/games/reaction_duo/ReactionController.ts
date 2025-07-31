import { Server } from "socket.io";
import { GameController, EventCtx } from "../interfaces";
import prisma from "../../prisma";
import { processGameSessionResult } from "../../services/achievementService";
import { ACHIEVEMENTS } from "../../achievements";

interface ServerToClientEvents {
  achievementUnlocked: (payload: { slug: string; emoji: string; title: string }) => void;
  start: (payload: { countdownMs: number }) => void;
  result: (payload: { winnerId: number }) => void;
  error: (payload: { message: string }) => void;
  choiceProgress: (payload: { exitCount: number; againCount: number }) => void;
  restart: (payload: { sessionId: number }) => void;
  exit: () => void;
  partnerDisconnected: () => void;
  historyAdded: () => void;
}

interface ClientToServerEvents {
  reaction: () => void;
  choice: (payload: { action: "exit" | "again" }) => void;
}

export class ReactionController implements GameController {
  private io: Server<ClientToServerEvents, ServerToClientEvents>;
  private room: string;
  private sessionId: number;
  private session: any;
  private winner: number | null = null;
  private choices: Record<number, "exit" | "again"> = {};

  constructor(
    io: Server<ClientToServerEvents, ServerToClientEvents>,
    room: string,
    sessionId: number,
    session: any
  ) {
    this.io = io;
    this.room = room;
    this.sessionId = sessionId;
    this.session = session;
  }

  start(): void {
    setTimeout(() => {
      this.winner = null;
      this.io.to(this.room).emit("start", { countdownMs: 3000 });
    }, 500);
  }

  async onClientEvent(event: string, payload: any, ctx: EventCtx): Promise<void> {
    switch (event) {
      case "reaction":
        await this.handleReaction(ctx.userId);
        break;
      case "choice":
        await this.handleChoice(payload, ctx.userId);
        break;
    }
  }

  private async handleReaction(userId: number): Promise<void> {
    if (this.winner !== null) return; // already have winner
    
    this.winner = userId;
    this.io.to(this.room).emit("result", { winnerId: userId });

    // Process achievements related to game session finish
    const unlocked = await processGameSessionResult({
      partnershipId: this.session.partnershipId!,
      partner1Id: this.session.partner1Id,
      partner2Id: this.session.partner2Id,
      winnerId: userId,
    });

    // Notify both partners if unlocked
    unlocked.forEach((slug: string) => {
      const def = ACHIEVEMENTS.find((a) => a.slug === slug);
      if (!def) return;
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

    const getResultText = (targetId: number): string => {
      if (isDraw) return "Ничья";
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

  private async handleChoice(payload: { action: "exit" | "again" }, userId: number): Promise<void> {
    this.choices[userId] = payload.action;

    const values = Object.values(this.choices);
    const exitCount = values.filter((c) => c === "exit").length;
    const againCount = values.filter((c) => c === "again").length;

    // Notify progress to clients
    this.io.to(this.room).emit("choiceProgress", { exitCount, againCount });

    if (values.length < 2) return; // wait for second player

    this.choices = {}; // reset choices

    if (againCount === 2) {
      // create new session immediately using same game
      const newSession = await prisma.gameSession.create({
        data: {
          gameId: this.session.gameId,
          partner1Id: this.session.partner1Id,
          partner2Id: this.session.partner2Id,
          partner2Accepted: true,
          partnershipId: this.session.partnershipId!,
        },
      });
      this.io.to(this.room).emit("restart", { sessionId: newSession.id });
    } else {
      // any other combination results in exit to main
      this.io.to(this.room).emit("exit");
    }
  }

  dispose(): void {
    this.winner = null;
    this.choices = {};
  }
}
