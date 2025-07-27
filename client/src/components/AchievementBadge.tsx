import { useState } from "react";
import "./AchievementBadge.css";

export interface AchievementBadgeProps {
  emoji: string;
  title: string;
  description: string;
  unlocked: boolean;
  progress?: number;
  goal?: number;
  achievedAt?: string;
}

export default function AchievementBadge({
  emoji,
  title,
  description,
  unlocked,
  progress,
  goal,
  achievedAt,
}: AchievementBadgeProps) {
  const [hover, setHover] = useState(false);

  const completion = goal ? Math.min(100, Math.round(((progress ?? 0) / goal) * 100)) : unlocked ? 100 : undefined;

  return (
    <div
      className={"badge-card" + (unlocked ? " unlocked" : "")}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
    >
      <span className="badge-emoji">{emoji}</span>
      <span className="badge-title">{title}</span>
      <span className="badge-status">
        {unlocked ? "✅" : "🔒"}
        {goal != null && (
          <span style={{ fontSize: 10, marginLeft: 4 }}>
            {progress ?? 0}/{goal}
          </span>
        )}
      </span>

      {goal != null && (
        <div className="badge-progress-container">
          <div
            className="badge-progress-bar"
            style={{ width: completion === 0 ? 0 : `max(${completion}%, 4%)` }}
          />
        </div>
      )}

      {hover && (
        <div className="badge-popup">
          <div style={{ fontSize: 20 }}>{emoji}</div>
          <strong>{title}</strong>
          <p style={{ fontSize: 12 }}>{description}</p>
          {goal != null && (
            <p style={{ fontSize: 12 }}>
              Прогресс: {progress ?? 0}/{goal} ({completion}%)
            </p>
          )}
          {achievedAt && unlocked && (
            <p style={{ fontSize: 12 }}>Получено: {new Date(achievedAt).toLocaleDateString()}</p>
          )}
        </div>
      )}
    </div>
  );
}
