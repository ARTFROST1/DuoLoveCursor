import { useEffect, useRef } from "react";
import io from "socket.io-client";


export function useHistorySocket(userId: number, onAdded: () => void, enabled: boolean = true) {
  const socketRef = useRef<any>();

  useEffect(() => {
    if (!enabled || !userId) return;

    const socket = io("/", {
      path: "/socket.io",
      query: { userId: String(userId) },
    });
    socketRef.current = socket;

    socket.on("historyAdded", () => {
      onAdded();
    });

    return () => {
      socket.disconnect();
    };
  }, [userId, enabled, onAdded]);
}
