import { ReactionController } from "./reaction_duo/ReactionController";
import { QuizLoveController } from "./quiz_love/QuizLoveController";
const controllers = {
    reaction_duo: (io, room, sessionId, session) => new ReactionController(io, room, sessionId, session),
    quiz_love: (io, room, sessionId, session) => new QuizLoveController(io, room, sessionId, session),
};
export function getController(gameSlug) {
    return controllers[gameSlug];
}
export function registerController(gameSlug, factory) {
    controllers[gameSlug] = factory;
}
