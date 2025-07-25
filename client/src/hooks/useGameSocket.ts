import { useEffect, useRef, useState } from "react";
import { io, Socket } from "socket.io-client";

interface ServerToClientEvents {
  start: { countdownMs: number };
  result: { winnerId: number };
  error: { message: string };
}

interface ClientToServerEvents {
  reaction: () => void;
}

export interface GameSocketState {
  phase: "waiting" | "countdown" | "playing" | "finished" | "error";
  countdownSec?: number;
  winnerId?: number;
  error?: string;
}

export function useGameSocket(sessionId: number, userId: number, enabled: boolean = true) {
  const [state, setState] = useState<GameSocketState>({ phase: "waiting" });
  const socketRef = useRef<Socket<ServerToClientEvents, ClientToServerEvents>>();

  useEffect(() => {
    if (!enabled) return;
    if (!sessionId || !userId) return;

    const socket = io("/", {
      path: "/socket.io",
      query: { sessionId: String(sessionId), userId: String(userId) },
    }) as Socket<ServerToClientEvents, ClientToServerEvents>;

    socketRef.current = socket;

    socket.on("start", ({ countdownMs }) => {
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

    socket.on("result", ({ winnerId }) => {
      setState({ phase: "finished", winnerId });
    });

    socket.on("error", ({ message }) => {
      setState({ phase: "error", error: message });
    });

    return () => {
      socket.disconnect();
    };
  }, [sessionId, userId, enabled]);

  const sendReaction = () => {
    socketRef.current?.emit("reaction");
  };

  return { state, sendReaction };
}
