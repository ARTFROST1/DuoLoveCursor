import { useAppStore } from "../store";
import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { getProfile, type ProfileData } from "../api";
import Avatar from "../components/Avatar";

export default function Profile() {
  const { userId, partnerConnected } = useAppStore();
  const navigate = useNavigate();

  // redirect if onboarding not finished
  useEffect(() => {
    if (!partnerConnected) {
      navigate("/welcome", { replace: true });
    }
  }, [partnerConnected, navigate]);

  const { data, isLoading, error } = useQuery<ProfileData>({
    queryKey: ["profile", userId],
    queryFn: () => getProfile(userId),
    enabled: !!userId && partnerConnected,
    refetchInterval: 15000,
  });

  const [tab, setTab] = useState<"stats" | "achievements" | "history">("stats");

  if (isLoading) return <div style={{ padding: 16 }}>Загрузка…</div>;
  if (error || !data) return <div style={{ padding: 16 }}>Ошибка загрузки профиля</div>;

  const { user, partner, stats, achievements, history, partnershipCreatedAt } = data;

  return (
    <div style={{ padding: 16, paddingBottom: 72 }}>
      {/* header */}
      <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
        <Avatar name={user.name} size={72} />
        {partner && (
          <>
            <span style={{ fontSize: 24 }}>❤️</span>
            <Avatar name={partner.name} size={72} online={true} />
          </>
        )}
      </div>
      {partnershipCreatedAt && (
        <p style={{ marginTop: 4, color: "var(--tg-theme-hint-color,#777)" }}>
          Вместе с {partner?.name ?? "партнёром"} с {new Date(partnershipCreatedAt).toLocaleDateString()}
        </p>
      )}

      {/* tabs */}
      <div style={{ display: "flex", marginTop: 24, borderBottom: "1px solid #ddd" }}>
        {[
          { id: "stats", label: "Статистика" },
          { id: "achievements", label: "Достижения" },
          { id: "history", label: "История" },
        ].map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id as any)}
            style={{
              flex: 1,
              padding: 8,
              border: "none",
              background: "none",
              fontWeight: tab === t.id ? "bold" : "normal",
              borderBottom: tab === t.id ? "3px solid #6da9ff" : "3px solid transparent",
            }}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* content */}
      {tab === "stats" && (
        <div style={{ marginTop: 16 }}>
          <p>Всего игр: {stats.totalGames}</p>
          <p>Побед: {stats.wins}</p>
          <p>Win-rate: {stats.totalGames ? Math.round((stats.wins / stats.totalGames) * 100) : 0}%</p>
        </div>
      )}

      {tab === "achievements" && (
        <div style={{ marginTop: 16, display: "grid", gap: 12 }}>
          {achievements.map((a) => (
            <div
              key={a.id}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 12,
                padding: 8,
                border: "1px solid #ddd",
                borderRadius: 8,
              }}
            >
              <span style={{ fontSize: 32 }}>{a.achievement.emoji}</span>
              <div>
                <strong>{a.achievement.title}</strong>
                <p style={{ margin: 0, fontSize: 12, color: "#555" }}>{a.achievement.description}</p>
                <p style={{ margin: 0, fontSize: 12 }}>
                  {a.progress}/{a.achievement.goal}
                </p>
              </div>
            </div>
          ))}
          {achievements.length === 0 && <p>Ещё нет достижений</p>}
        </div>
      )}

      {tab === "history" && (
        <div style={{ marginTop: 16, display: "flex", flexDirection: "column", gap: 8 }}>
          {history.map((h) => (
            <div
              key={h.id}
              style={{
                padding: 8,
                border: "1px solid #ddd",
                borderRadius: 8,
                display: "flex",
                justifyContent: "space-between",
              }}
            >
              <span>{new Date(h.playedAt).toLocaleDateString()}</span>
              <span>{h.gameSession.game.title}</span>
              <span>{h.resultShort ?? "-"}</span>
            </div>
          ))}
          {history.length === 0 && <p>История пока пуста</p>}
        </div>
      )}
    </div>
  );
}
