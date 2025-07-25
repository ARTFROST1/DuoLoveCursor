import "dotenv/config";
import express from "express";
import cors from "cors";
import inviteRoutes from "./routes/invite";
import gamesRoutes from "./routes/games";

const app = express();
const PORT = process.env.PORT || 4000;

app.use(cors());
app.use(express.json());

app.use("/invite", inviteRoutes);
app.use("/games", gamesRoutes);

app.get("/", (_req, res) => {
  res.send("DuoLoveCursor API is running 🚀");
});

app.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});
