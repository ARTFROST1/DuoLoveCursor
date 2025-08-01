import prisma from "./prisma";
import { getController } from "./games/registry";
export function initSockets(io) {
    // sessionId => GameController
    const activeControllers = new Map();
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
        // Validate session and get game info
        const session = await prisma.gameSession.findUnique({
            where: { id: sessionId },
            include: { game: true }
        });
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
        // Get or create game controller
        let controller = activeControllers.get(sessionId);
        if (!controller) {
            const controllerFactory = getController(session.game.slug);
            if (!controllerFactory) {
                socket.emit("error", { message: `Game ${session.game.slug} not supported` });
                socket.disconnect();
                return;
            }
            controller = controllerFactory(io, room, sessionId, session);
            activeControllers.set(sessionId, controller);
        }
        // If both partners connected and partner2Accepted, start the game
        const numClients = io.sockets.adapter.rooms.get(room)?.size || 0;
        if (numClients === 2 && session.partner2Accepted) {
            controller.start();
        }
        // Delegate all game events to the controller
        socket.onAny(async (event, ...args) => {
            // Skip non-game events
            if (event === 'disconnect')
                return;
            const ctx = {
                room,
                sessionId,
                userId
            };
            const payload = args[0]; // most events have single payload
            await controller.onClientEvent(event, payload, ctx);
        });
        socket.on("disconnect", () => {
            // Check if room is empty, if so dispose controller
            const remainingClients = io.sockets.adapter.rooms.get(room)?.size || 0;
            if (remainingClients === 0) {
                const controller = activeControllers.get(sessionId);
                if (controller) {
                    controller.dispose();
                    activeControllers.delete(sessionId);
                }
            }
        });
    });
}
