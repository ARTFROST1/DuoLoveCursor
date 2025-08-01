import { Server } from "socket.io";
import { GameController, EventCtx } from "../interfaces";
import prisma from "../../prisma";
import { processGameSessionResult } from "../../services/achievementService";

// Reuse global prisma instance

interface ServerToClientEvents {
  quiz_prefill_required: (payload: { questions: QuestionDto[] }) => void;
  quiz_waiting_for_partner: (payload: { message: string }) => void;
  quiz_prefill_complete: (payload: { message: string }) => void;
  quiz_question: (payload: { round: number; total: number; text: string; options: string[] }) => void;
  quiz_reveal: (payload: { round: number; selected: string; actual: string | undefined; match: boolean; youScore: number; partnerScore: number }) => void;
  quiz_next: () => void;
  quiz_end: (payload: { youScore: number; partnerScore: number; winnerId: number | null }) => void;
  error: (payload: { message: string }) => void;
}

interface ClientToServerEvents {
  quiz_prefill: (payload: { answers: Record<string, string> }) => void;
  quiz_answer: (payload: { round: number; option: string }) => void;
}

interface QuestionDto {
  id: number;
  text: string;
  options: string[];
}

interface QuizState {
  questions: Array<{
    id: number;
    text: string;
    options: string[];
  }>;
  currentRound: number;
  totalRounds: number;
  scores: Record<number, number>; // userId -> score
  profiles: Record<number, Record<string, string>>; // userId -> answers
  roundAnswers: Record<number, string>; // userId -> selected option for current round
  waitingForAnswers: Set<number>;
  isGameEnded: boolean;
}

export class QuizLoveController implements GameController {
  private io: Server<ClientToServerEvents, ServerToClientEvents>;
  private room: string;
  private sessionId: number;
  private session: any;
  private state: QuizState;

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
    this.state = {
      questions: [],
      currentRound: 0,
      totalRounds: 5,
      scores: {},
      profiles: {},
      roundAnswers: {},
      waitingForAnswers: new Set(),
      isGameEnded: false,
    };
  }

  async start(): Promise<void> {
    console.log(`[QuizLove] Starting session ${this.sessionId}`);
    
    // Initialize scores
    this.state.scores[this.session.partner1Id] = 0;
    this.state.scores[this.session.partner2Id] = 0;

    // Load quiz questions
    const quizQuestions = await prisma.quizQuestion.findMany({
      where: { quizId: "quiz_love", isActive: true },
      orderBy: { order: "asc" },
    });

    if (quizQuestions.length === 0) {
      this.io.to(this.room).emit("error", { message: "No quiz questions available" });
      return;
    }

    // Shuffle and limit questions
    const shuffled = quizQuestions.sort(() => Math.random() - 0.5);
    this.state.questions = shuffled.slice(0, this.state.totalRounds).map((q): QuestionDto => ({
      id: q.id,
      text: q.text,
      options: (q.optionsJson as unknown as string[]),
    }));

    // Check if both players have profiles
    const profiles = await prisma.quizProfile.findMany({
      where: {
        userId: { in: [this.session.partner1Id, this.session.partner2Id] },
        quizId: "quiz_love",
      },
    });

    // Store profiles in state
    for (const profile of profiles) {
      this.state.profiles[profile.userId] = profile.answersJson as Record<string, string>;
    }

    // Check if any player needs to fill profile
    const needsPrefill: number[] = [];
    if (!this.state.profiles[this.session.partner1Id]) {
      needsPrefill.push(this.session.partner1Id);
    }
    if (!this.state.profiles[this.session.partner2Id]) {
      needsPrefill.push(this.session.partner2Id);
    }

    if (needsPrefill.length > 0) {
      // Send prefill requirement to players who need it
      for (const userId of needsPrefill) {
        const socket = this.getSocketByUserId(userId);
        if (socket) {
          socket.emit("quiz_prefill_required", {
            questions: this.state.questions.map(q => ({
              id: q.id,
              text: q.text.replace("ваш партнёр", "вы"), // Change question perspective
              options: q.options,
            })),
          });
        }
      }

      // Notify other players to wait
      const waitingUsers = [this.session.partner1Id, this.session.partner2Id].filter(
        id => !needsPrefill.includes(id)
      );
      for (const userId of waitingUsers) {
        const socket = this.getSocketByUserId(userId);
        if (socket) {
          socket.emit("quiz_waiting_for_partner", {
            message: "Ваш партнёр заполняет профиль ответов...",
          });
        }
      }
    } else {
      // Both players have profiles, start the game
      this.startNextRound();
    }
  }

  async onClientEvent(event: string, payload: any, ctx: EventCtx): Promise<void> {
    switch (event) {
      case "quiz_prefill":
        await this.handlePrefill(payload, ctx.userId);
        break;
      case "quiz_answer":
        await this.handleAnswer(payload, ctx.userId);
        break;
      default:
        console.log(`[QuizLove] Unknown event: ${event}`);
    }
  }

  private async handlePrefill(payload: { answers: Record<string, string> }, userId: number): Promise<void> {
    console.log(`[QuizLove] Prefill from user ${userId}:`, payload.answers);

    // Validate answers
    if (!payload.answers || typeof payload.answers !== "object") {
      const socket = this.getSocketByUserId(userId);
      if (socket) {
        socket.emit("error", { message: "Invalid answers format" });
      }
      return;
    }

    // Save to database
    await prisma.quizProfile.upsert({
      where: {
        userId_quizId: {
          userId,
          quizId: "quiz_love",
        },
      },
      update: {
        answersJson: payload.answers,
      },
      create: {
        userId,
        quizId: "quiz_love",
        answersJson: payload.answers,
      },
    });

    // Update state
    this.state.profiles[userId] = payload.answers;

    // Check if all players have profiles now
    const allHaveProfiles = [this.session.partner1Id, this.session.partner2Id].every(
      id => this.state.profiles[id]
    );

    if (allHaveProfiles) {
      // Start the game
      this.io.to(this.room).emit("quiz_prefill_complete", {
        message: "Профили заполнены! Начинаем викторину...",
      });
      
      setTimeout(() => {
        this.startNextRound();
      }, 2000);
    } else {
      // Notify this user that they're waiting
      const socket = this.getSocketByUserId(userId);
      if (socket) {
        socket.emit("quiz_waiting_for_partner", {
          message: "Ждём партнёра...",
        });
      }
    }
  }

  private async handleAnswer(payload: { round: number, option: string }, userId: number): Promise<void> {
    if (this.state.isGameEnded) return;
    
    if (payload.round !== this.state.currentRound) {
      console.log(`[QuizLove] Wrong round: expected ${this.state.currentRound}, got ${payload.round}`);
      return;
    }

    if (this.state.roundAnswers[userId]) {
      console.log(`[QuizLove] User ${userId} already answered this round`);
      return;
    }

    console.log(`[QuizLove] Answer from user ${userId}: ${payload.option}`);
    
    this.state.roundAnswers[userId] = payload.option;
    this.state.waitingForAnswers.delete(userId);

    // Check if both players answered
    if (this.state.waitingForAnswers.size === 0) {
      await this.processRoundResults();
    }
  }

  private startNextRound(): void {
    if (this.state.currentRound >= this.state.totalRounds) {
      this.endGame();
      return;
    }

    this.state.currentRound++;
    this.state.roundAnswers = {};
    this.state.waitingForAnswers = new Set([this.session.partner1Id, this.session.partner2Id]);

    const currentQuestion = this.state.questions[this.state.currentRound - 1];
    
    console.log(`[QuizLove] Starting round ${this.state.currentRound}/${this.state.totalRounds}`);

    this.io.to(this.room).emit("quiz_question", {
      round: this.state.currentRound,
      total: this.state.totalRounds,
      text: currentQuestion.text,
      options: currentQuestion.options,
    });
  }

  private async processRoundResults(): Promise<void> {
    const currentQuestion = this.state.questions[this.state.currentRound - 1];
    const partner1Id = this.session.partner1Id;
    const partner2Id = this.session.partner2Id;
    
    const partner1Answer = this.state.roundAnswers[partner1Id];
    const partner2Answer = this.state.roundAnswers[partner2Id];
    
    // Get actual answers from profiles (what each person answered about themselves)
    const partner1Actual = this.state.profiles[partner1Id]?.[currentQuestion.id.toString()];
    const partner2Actual = this.state.profiles[partner2Id]?.[currentQuestion.id.toString()];

    // Check matches (partner1 guessing partner2, partner2 guessing partner1)
    const partner1Match = partner1Answer === partner2Actual;
    const partner2Match = partner2Answer === partner1Actual;

    // Update scores
    if (partner1Match) this.state.scores[partner1Id]++;
    if (partner2Match) this.state.scores[partner2Id]++;

    console.log(`[QuizLove] Round ${this.state.currentRound} results:`, {
      partner1Answer,
      partner2Answer,
      partner1Actual,
      partner2Actual,
      partner1Match,
      partner2Match,
    });

    // Send results to each player
    const socket1 = this.getSocketByUserId(partner1Id);
    const socket2 = this.getSocketByUserId(partner2Id);

    if (socket1) {
      socket1.emit("quiz_reveal", {
        round: this.state.currentRound,
        selected: partner1Answer,
        actual: partner2Actual,
        match: partner1Match,
        youScore: this.state.scores[partner1Id],
        partnerScore: this.state.scores[partner2Id],
      });
    }

    if (socket2) {
      socket2.emit("quiz_reveal", {
        round: this.state.currentRound,
        selected: partner2Answer,
        actual: partner1Actual,
        match: partner2Match,
        youScore: this.state.scores[partner2Id],
        partnerScore: this.state.scores[partner1Id],
      });
    }

    // Wait a bit, then start next round or end game
    setTimeout(() => {
      if (this.state.currentRound >= this.state.totalRounds) {
        this.endGame();
      } else {
        this.io.to(this.room).emit("quiz_next");
        setTimeout(() => {
          this.startNextRound();
        }, 1500);
      }
    }, 3000);
  }

  private async endGame(): Promise<void> {
    this.state.isGameEnded = true;
    
    const partner1Score = this.state.scores[this.session.partner1Id];
    const partner2Score = this.state.scores[this.session.partner2Id];
    
    let winnerId: number | null = null;
    if (partner1Score > partner2Score) {
      winnerId = this.session.partner1Id;
    } else if (partner2Score > partner1Score) {
      winnerId = this.session.partner2Id;
    }

    console.log(`[QuizLove] Game ended. Scores: ${partner1Score} - ${partner2Score}, Winner: ${winnerId}`);

    // Update session in database
    await prisma.gameSession.update({
      where: { id: this.sessionId },
      data: {
        endedAt: new Date(),
        winnerId,
        resultJson: {
          partner1Score,
          partner2Score,
          totalRounds: this.state.totalRounds,
        },
      },
    });

    // Send final results to each player
    const socket1 = this.getSocketByUserId(this.session.partner1Id);
    const socket2 = this.getSocketByUserId(this.session.partner2Id);

    if (socket1) {
      socket1.emit("quiz_end", {
        youScore: partner1Score,
        partnerScore: partner2Score,
        winnerId,
      });
    }

    if (socket2) {
      socket2.emit("quiz_end", {
        youScore: partner2Score,
        partnerScore: partner1Score,
        winnerId,
      });
    }

    // Process achievements and history
    try {
      await processGameSessionResult({
        partnershipId: this.session.partnershipId,
        partner1Id: this.session.partner1Id,
        partner2Id: this.session.partner2Id,
        winnerId,
      });
    } catch (error) {
      console.error("[QuizLove] Error processing achievements/history:", error);
    }
  }

  private getSocketByUserId(userId: number) {
    const sockets = this.io.sockets.adapter.rooms.get(this.room);
    if (!sockets) return null;

    for (const socketId of sockets) {
      const socket = this.io.sockets.sockets.get(socketId);
      if (socket && Number(socket.handshake.query.userId) === userId) {
        return socket;
      }
    }
    return null;
  }

  dispose(): void {
    console.log(`[QuizLove] Disposing controller for session ${this.sessionId}`);
    // Cleanup if needed
  }
}
