import { useEffect, useRef } from "react";
import io from "socket.io-client";



export interface AchievementUnlockedPayload { 
  slug: string; 
  emoji: string; 
  title: string; 
}

export function useAchievementSocket(userId: number, onUnlock: (p: AchievementUnlockedPayload) => void, enabled: boolean = true) {
  const socketRef = useRef<any>();

  useEffect(() => {
    if (!enabled || !userId) return;

    const socket = io("/", {
      path: "/socket.io",
      query: { userId: String(userId) },
    });
    socketRef.current = socket;

    socket.on("achievementUnlocked", (payload: AchievementUnlockedPayload) => {
      onUnlock(payload);
    });

    return () => {
      socket.disconnect();
    };
  }, [userId, enabled, onUnlock]);
}
