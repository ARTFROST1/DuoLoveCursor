import { useEffect, useRef, useState } from "react";
import io from "socket.io-client";





export interface GameSocketState {
    phase: "waiting" | "countdown" | "playing" | "finished" | "error";
    countdownSec?: number;
  winnerId?: number;
  error?: string;
  exitCount?: number;
    againCount?: number;
}

export function useGameSocket(sessionId: number, userId: number, enabled: boolean = true) {
    const [state, setState] = useState<GameSocketState>({ phase: "waiting" });
    const socketRef = useRef<any>(null);

  useEffect(() => {
    if (!enabled) return;
    if (!sessionId || !userId) return;

    const socket: any = io("/", {
      path: "/socket.io",
      query: { sessionId: String(sessionId), userId: String(userId) },
    });

    socketRef.current = socket;

    socket.on("start", ({ countdownMs }: { countdownMs: number }) => {
      const totalSec = Math.ceil(countdownMs / 1000);
      setState({ phase: "countdown", countdownSec: totalSec });

      let current = totalSec;
      const interval = setInterval(() => {
        current -= 1;
        if (current <= 0) {
          clearInterval(interval);
          setState({ phase: "playing" });
        } else {
          setState({ phase: "countdown", countdownSec: current });
        }
      }, 1000);
    });

    socket.on("result", ({ winnerId }: { winnerId: number }) => {
      setState({ phase: "finished", winnerId });
    });

    socket.on("choiceProgress", ({ exitCount, againCount }: { exitCount: number; againCount: number }) => {
      setState((prev) => ({ ...prev, exitCount, againCount }));
    });

    socket.on("restart", ({ sessionId }: { sessionId: number }) => {
      window.location.href = `${window.location.pathname.split("?")[0]}?session=${sessionId}`;
    });

    socket.on("exit", () => {
      window.location.href = "/";
    });

    socket.on("error", ({ message }: { message: string }) => {
      setState({ phase: "error", error: message });
    });

    return () => {
      socket.disconnect();
    };
  }, [sessionId, userId, enabled]);

  const sendReaction = () => {
    socketRef.current?.emit("reaction");
  };

  const sendChoice = (action: "exit" | "again") => {
    socketRef.current?.emit("choice", { action });
  };

  return { state, sendReaction, sendChoice };
}
