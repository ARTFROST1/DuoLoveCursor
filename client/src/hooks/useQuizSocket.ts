import { useEffect, useRef, useState } from "react";
import io from "socket.io-client";

interface QuestionDto {
  id: number;
  text: string;
  options: string[];
}


export interface QuizSocketState {
  phase: "prefill" | "waiting" | "question" | "reveal" | "summary" | "error";
  prefillQuestions?: QuestionDto[];
  question?: { round: number; total: number; text: string; options: string[] };
  reveal?: {
    selected: string;
    actual?: string;
    match: boolean;
    youScore: number;
    partnerScore: number;
  };
  summary?: { youScore: number; partnerScore: number; winnerId: number | null };
  error?: string;
}

export function useQuizSocket(sessionId: number, userId: number, enabled: boolean = true) {
  const [state, setState] = useState<QuizSocketState>({ phase: "waiting" });
  const socketRef = useRef<any>(null);

  useEffect(() => {
    if (!enabled) return;
    if (!sessionId || !userId) return;

    const socket: any = io("/", {
      path: "/socket.io",
      query: { sessionId: String(sessionId), userId: String(userId) },
    });

    socketRef.current = socket;

    socket.on("quiz_prefill_required", ({ questions }: { questions: QuestionDto[] }) => {
      setState({ phase: "prefill", prefillQuestions: questions });
    });

    socket.on("quiz_waiting_for_partner", () => {
      setState({ phase: "waiting" });
    });

    socket.on("quiz_prefill_complete", () => {
      setState({ phase: "waiting" });
    });

    socket.on("quiz_question", (payload: any) => {
      setState({ phase: "question", question: payload });
    });

    socket.on("quiz_reveal", (payload: any) => {
      setState({ phase: "reveal", reveal: payload });
    });

    socket.on("quiz_next", () => {
      // Waiting for next question; state will change on next quiz_question
      setState({ phase: "waiting" });
    });

    socket.on("quiz_end", (payload: any) => {
      setState({ phase: "summary", summary: payload });
    });

    socket.on("error", ({ message }: { message: string }) => {
      setState({ phase: "error", error: message });
    });

    return () => {
      socket.disconnect();
    };
  }, [sessionId, userId, enabled]);

  const sendPrefill = (answers: Record<string, string>) => {
    socketRef.current?.emit("quiz_prefill", { answers });
  };

  const sendAnswer = (round: number, option: string) => {
    socketRef.current?.emit("quiz_answer", { round, option });
  };

  return { state, sendPrefill, sendAnswer };
}
