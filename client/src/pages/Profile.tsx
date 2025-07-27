import { useAppStore } from "../store";
import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { getProfile, type ProfileData, getStats, type StatsResponse } from "../api";
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

  const {
    data: statsData,
    isLoading: statsLoading,
    error: statsError,
  } = useQuery<StatsResponse>({
    queryKey: ["stats", userId],
    queryFn: () => getStats(userId),
    enabled: !!userId && partnerConnected,
    refetchInterval: 15000,
  });

  const [tab, setTab] = useState<"stats" | "achievements" | "history">("stats");

  if (isLoading) return <div style={{ padding: 16 }}>Загрузка…</div>;
  if (error || !data) return <div style={{ padding: 16 }}>Ошибка загрузки профиля</div>;

  const { user, partner, achievements, history, partnershipCreatedAt } = data;

  const formatDuration = (ms: number) => {
    const totalMinutes = Math.round(ms / 60000);
    const days = Math.floor(totalMinutes / (60 * 24));
    const hours = Math.floor((totalMinutes % (60 * 24)) / 60);
    const minutes = totalMinutes % 60;
    if (days > 0) return `${days} д ${hours} ч`;
    if (hours > 0) return `${hours} ч ${minutes} мин`;
    return `${minutes} мин`;
  };

  return (
    <div style={{ padding: 16, paddingBottom: 72, position: "relative" }}>
      <button
        onClick={() => navigate("/settings")}
        style={{
          position: "absolute",
          top: 8,
          right: 8,
          fontSize: 24,
          background: "none",
          border: "none",
          cursor: "pointer",
        }}
      >
        ⚙️
      </button>
      {/* header */}
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 12 }}>
        <Avatar name={user.name} emoji={user.avatarEmoji} size={96} />
        {partner && (
          <div onClick={() => navigate("/partner")} style={{ cursor: "pointer", padding: 8, background: "var(--tg-theme-bg-color,#f0f0f0)", borderRadius: 8 }}>
            В паре с: <strong>{partner.name}</strong>
          </div>
        )}
      </div>
      {partnershipCreatedAt && (
        <p style={{ marginTop: 4, color: "var(--tg-theme-hint-color,#777)" }}>
          Вместе с {new Date(partnershipCreatedAt).toLocaleDateString()}
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
        <>
          {statsError ? (
            <div style={{ padding: 8 }}>Ошибка загрузки статистики</div>
          ) : statsLoading ? (
            <div style={{ padding: 8 }}>Загрузка статистики…</div>
          ) : !statsData ? (
            <div style={{ padding: 8 }}>Нет данных</div>
          ) : (
            <div style={{ marginTop: 16, display: "flex", flexDirection: "column", gap: 16 }}>
              {/* summary */}
              <p>
                Вы провели <strong>{formatDuration(statsData.personal.totalTimeMs)}</strong> в игре и сыграли вместе
                <strong> {statsData.couple?.totalGamesTogether ?? statsData.personal.totalGames}</strong> раз — так держать!
              </p>

              {/* Personal */}
              <h3>Личное</h3>
              <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
                <li title="Суммарное время, проведённое в играх">⏱ Общее время онлайн: {formatDuration(statsData.personal.totalTimeMs)}</li>
                <li title="Количество сыгранных игр">🎮 Всего игр: {statsData.personal.totalGames}</li>
                <li title="Победные игры">🏆 Победы: {statsData.personal.wins}</li>
                <li title="Проигрышные игры">❌ Поражения: {statsData.personal.losses}</li>
                <li title="Игры, закончившиеся ничьёй">➗ Ничьи: {statsData.personal.draws}</li>
                <li title="Процент побед ко всем играм">✅ Успешность: {statsData.personal.successRate}%</li>
                {statsData.personal.reactionAvgMs != null && (
                  <li title="Среднее время реакции в миллисекундах">⚡ Средняя реакция: {statsData.personal.reactionAvgMs} мс</li>
                )}
                {statsData.personal.favoriteGame && (
                  <li title="Игра, в которую вы играли чаще всего">
                    ⭐ Любимая игра: {statsData.personal.favoriteGame.title} ({statsData.personal.favoriteGame.count})
                  </li>
                )}
                {/* Games by category */}
                {Object.keys(statsData.personal.gamesByCategory).length > 0 && (
                  <li title="Распределение игр по категориям">📊 По типам:
                    <ul style={{ listStyle: "none", paddingLeft: 16 }}>
                      {Object.entries(statsData.personal.gamesByCategory).map(([cat, count]) => (
                        <li key={cat}>{cat}: {count}</li>
                      ))}
                    </ul>
                  </li>
                )}
                
              </ul>

              {/* Couple */}
              {statsData.couple && (
                <>
                  <h3>Пара</h3>
                  <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
                    <li title="Дней вместе">💖 Дней вместе: {statsData.couple.daysTogether}</li>
                    {statsData.couple.mostPlayedGameTogether && (
                      <li>
                        🎲 Самая популярная игра: {statsData.couple.mostPlayedGameTogether.title} (
                        {statsData.couple.mostPlayedGameTogether.count})
                      </li>
                    )}
                    <li>🎯 Co-op завершено: {statsData.couple.coOpSuccessRate}%</li>
                    <li>🔄 Sync Score: {statsData.couple.syncScore}%</li>
                    <li>🕒 Средняя активность: {statsData.couple.avgDailyActivityMin} мин/день</li>
                    <li>💬 Обсуждений: {statsData.couple.discussionCount}</li>
                  </ul>
                </>
              )}
            </div>
          )}
        </>
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
