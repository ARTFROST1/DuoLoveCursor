import { Server } from "socket.io";
import prisma from "./prisma";

interface ServerToClientEvents {
  start: { countdownMs: number };
  result: { winnerId: number };
  error: { message: string };
}

interface ClientToServerEvents {
  reaction: void;
}

export function initSockets(io: Server<ClientToServerEvents, ServerToClientEvents>) {
  // room => firstReactor userId
  const roomWinner: Map<string, number> = new Map();

  io.on("connection", async (socket) => {
    const sessionId = Number(socket.handshake.query.sessionId);
    const userId = Number(socket.handshake.query.userId);
    if (!sessionId || !userId) {
      socket.emit("error", { message: "Invalid params" });
      socket.disconnect();
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

    socket.on("disconnect", () => {
      // Nothing to do for now
    });
  });
}
