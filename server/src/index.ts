import "dotenv/config";
import express from "express";
import cors from "cors";
import inviteRoutes from "./routes/invite";
import authRoutes from "./routes/auth";
import partnershipRoutes from "./routes/partnership";
import gamesRoutes from "./routes/games";
import profileRoutes from "./routes/profile";
import gameSessionRoutes from "./routes/gameSession";
import { createServer } from "http";
import { Server } from "socket.io";
import { initSockets } from "./sockets";

const app = express();
const httpServer = createServer(app);
const PORT = process.env.PORT || 4000;

app.use(cors());
app.use(express.json());

app.use("/invite", inviteRoutes);
app.use("/auth", authRoutes);
app.use("/partnership", partnershipRoutes);
app.use("/games", gamesRoutes);
app.use("/game-session", gameSessionRoutes);
app.use("/profile", profileRoutes);

app.get("/", (_req, res) => {
  res.send("DuoLoveCursor API is running 🚀");
});

const io = new Server(httpServer, { cors: { origin: "*" } });
initSockets(io);

httpServer.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});
