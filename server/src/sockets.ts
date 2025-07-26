import { Server } from "socket.io";
import prisma from "./prisma";

interface ServerToClientEvents {
  // Gameplay events
  start: (payload: { countdownMs: number }) => void;
  result: (payload: { winnerId: number }) => void;
  error: (payload: { message: string }) => void;
  choiceProgress: (payload: { exitCount: number; againCount: number }) => void;
  restart: (payload: { sessionId: number }) => void;
  exit: () => void;
  // Misc events
  partnerDisconnected: () => void;
}

interface ClientToServerEvents {
  reaction: () => void;
  choice: (payload: { action: "exit" | "again" }) => void;
}

export function initSockets(io: Server<ClientToServerEvents, ServerToClientEvents>) {
  // room => firstReactor userId
  const roomWinner: Map<string, number> = new Map();
  // room => { [userId]: "exit" | "again" }
  const roomChoices: Map<string, Record<number, "exit" | "again">> = new Map();

  io.on("connection", async (socket) => {
    const userId = Number(socket.handshake.query.userId);
    const sessionId = socket.handshake.query.sessionId ? Number(socket.handshake.query.sessionId) : undefined;
    if (!userId) {
      socket.emit("error", { message: "Invalid params" });
      socket.disconnect();
      return;
    }

    // Join personal room for generic notifications
    socket.join(`user_${userId}`);

    // If not a session connection, stop here
    if (!sessionId) {
      return;
    }

    // Validate session
    const session = await prisma.gameSession.findUnique({ where: { id: sessionId } });
    if (!session) {
      socket.emit("error", { message: "Session not found" });
      socket.disconnect();
      return;
    }
    // Partner2 cannot connect until they have accepted invite.
    if (!session.partner2Accepted && userId === session.partner2Id) {
      socket.emit("error", { message: "Invite not accepted yet" });
      socket.disconnect();
      return;
    }
    // Any other unknown user
    if (userId !== session.partner1Id && userId !== session.partner2Id) {
      socket.emit("error", { message: "Not a participant" });
      socket.disconnect();
      return;
    }

    const room = `session_${sessionId}`;
    socket.join(room);

    // If both partners connected and partner2Accepted, emit start
    const numClients = io.sockets.adapter.rooms.get(room)?.size || 0;
    if (numClients === 2 && session.partner2Accepted) {
      setTimeout(() => {
        roomWinner.delete(room);
        io.to(room).emit("start", { countdownMs: 3000 });
      }, 500);
    }

    socket.on("reaction", async () => {
      if (roomWinner.has(room)) return; // already have winner
      roomWinner.set(room, userId);
      io.to(room).emit("result", { winnerId: userId });

      // persist result
      await prisma.gameSession.update({
        where: { id: sessionId },
        data: { winnerId: userId, endedAt: new Date() },
      });
    });

    socket.on("choice", async ({ action }) => {
      let choices = roomChoices.get(room);
      if (!choices) {
        choices = {};
        roomChoices.set(room, choices);
      }
      choices[userId] = action;

      const values = Object.values(choices);
      const exitCount = values.filter((c) => c === "exit").length;
      const againCount = values.filter((c) => c === "again").length;

      // Notify progress to clients
      io.to(room).emit("choiceProgress", { exitCount, againCount });

      if (values.length < 2) return; // wait for second player

      roomChoices.delete(room);

      if (againCount === 2) {
        // create new session immediately using same game
        const newSession = await prisma.gameSession.create({
          data: {
            gameId: session.gameId,
            partner1Id: session.partner1Id,
            partner2Id: session.partner2Id,
            partner2Accepted: true,
          },
        });
        io.to(room).emit("restart", { sessionId: newSession.id });
      } else {
        // any other combination results in exit to main
        io.to(room).emit("exit");
      }
    });

    socket.on("disconnect", () => {
      roomChoices.delete(room);
      // Nothing to do for now
    });
  });
}
