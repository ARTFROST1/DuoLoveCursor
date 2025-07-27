import { useEffect } from "react";
import "./AchievementToast.css";

interface AchievementToastProps {
  emoji: string;
  title: string;
  onClose: () => void;
  durationMs?: number;
}

export default function AchievementToast({ emoji, title, onClose, durationMs = 4000 }: AchievementToastProps) {
  useEffect(() => {
    const t = setTimeout(onClose, durationMs);
    return () => clearTimeout(t);
  }, [durationMs, onClose]);

  return (
    <div className="toast">
      <span className="toast-emoji">{emoji}</span>
      <span>
        Новое достижение: <strong>{title}</strong>
      </span>
    </div>
  );
}
