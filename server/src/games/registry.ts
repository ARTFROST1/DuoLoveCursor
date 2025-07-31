import { Server } from "socket.io";
import { GameController } from "./interfaces";
import { ReactionController } from "./reaction_duo/ReactionController";

type ControllerFactory = (
  io: Server,
  room: string,
  sessionId: number,
  session: any
) => GameController;

const controllers: Record<string, ControllerFactory> = {
  reaction_duo: (io, room, sessionId, session) => 
    new ReactionController(io, room, sessionId, session),
};

export function getController(gameSlug: string): ControllerFactory | undefined {
  return controllers[gameSlug];
}

export function registerController(gameSlug: string, factory: ControllerFactory): void {
  controllers[gameSlug] = factory;
}
