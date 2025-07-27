import { Link, useNavigate } from "react-router-dom";
import { useEffect, useMemo, useState } from "react";
import Avatar from "../components/Avatar";
import type { GameSession } from "../api";
import Carousel from "../components/Carousel";
import GameTile from "../components/GameTile";
import { getPendingInvites, acceptInviteSession, getOpenSessions, cancelSession } from "../api";
import { useQuery } from "@tanstack/react-query";
import { getGames } from "../api";
import { useAppStore } from "../store";

/**
 * Home page (Главная) that greets the pair and shows quick actions.
 * Displays user & partner names / avatars (stub), a days-together counter and a shortcut to the Games list.
 */
export default function Home() {
  const { displayName, avatarEmoji, partnerName, partnerAvatarEmoji, partnershipCreatedAt, partnerOnline, partnerConnected, userId } = useAppStore();
  const navigate = useNavigate();
  const [pendingInvite, setPendingInvite] = useState<GameSession | null>(null);

  // Poll invites / open sessions every 2s. If invite found show modal instead of auto-redirect
  useEffect(() => {
    if (!userId) return;
    const interval = setInterval(async () => {
      // 1) Check active open sessions first
      try {
        const open = await getOpenSessions(userId);
        const active = open.find((s) => s.partner2Accepted && !s.endedAt);
        if (active) {
          navigate(`/game/${active.game.slug}?session=${active.id}`);
          return; // skip invite polling once redirected
        }
      } catch (err) {
        console.error(err);
      }

      // 2) Then poll pending invites
      try {
        const invites = await getPendingInvites(userId);
        if (invites.length > 0 && !pendingInvite) {
          // show the first invite in modal
          setPendingInvite(invites[0]);
        }
      } catch (err) {
        console.error(err);
      }
    }, 2000);
    return () => clearInterval(interval);
  }, [userId, pendingInvite]);

  // Until partner connects, redirect to onboarding
  useEffect(() => {
    if (!partnerConnected) {
      navigate("/welcome", { replace: true });
    }
  }, [partnerConnected, navigate]);

  // Calculate days together
  const daysTogether = useMemo(() => {
    if (!partnershipCreatedAt) return 0;
    try {
      const created = new Date(partnershipCreatedAt);
      const now = new Date();
      const diff = Math.floor((now.getTime() - created.getTime()) / (1000 * 60 * 60 * 24));
      return diff;
    } catch {
      return 0;
    }
  }, [partnershipCreatedAt]);

  return (
    <div style={{ padding: 16 }}>


      <section style={{ marginBottom: 24, display: "flex", flexDirection: "column", alignItems: "center" }}>
        <div style={{ display: "flex", gap: 16, alignItems: "center" }}>
          <div onClick={() => navigate("/profile")} style={{ cursor: "pointer" }}>
            <Avatar name={displayName} emoji={avatarEmoji} size={72} online={true} />
          </div>
          <span style={{ fontSize: 24 }}>❤️</span>
          <div onClick={() => navigate("/partner")} style={{ cursor: "pointer" }}>
            <Avatar name={partnerName} emoji={partnerAvatarEmoji} size={72} online={partnerOnline} />
          </div>
        </div>
        <p style={{ marginTop: 8, fontSize: 18 }}>{displayName} + {partnerName}</p>
        <p style={{ marginTop: 12 }}>Вы вместе уже {daysTogether} дней</p>
      </section>

      {/* Carousel section */}
      <section style={{ marginBottom: 32 }}>
        <Carousel
          items={[
            {
              id: 1,
              title: "💖 Советы для пар",
              subtitle: "5 идей для романтического вечера",
              imageUrl: "https://picsum.photos/seed/love/600/300",
              link: "https://t.me/duolove_blog/1",
            },
            {
              id: 2,
              title: "🎉 Новая игра: Ассоциации",
              subtitle: "Попробуйте прямо сейчас!",
              imageUrl: "https://picsum.photos/seed/game/600/300",
              link: "/games",
            },
            {
              id: 3,
              title: "📰 Обновление приложения",
              subtitle: "Версия 0.2: тёмная тема и ачивки",
              imageUrl: "https://picsum.photos/seed/update/600/300",
              link: "https://t.me/duolove_blog/2",
            },
          ]}
        />
      </section>

      {/* Recommended games */}
      <section style={{ marginBottom: 24 }}>
        <h2 style={{ fontSize: 20, marginBottom: 12 }}>Рекомендованные игры</h2>
        {(() => {
          const { data: games, isLoading } = useQuery({ queryKey: ["games"], queryFn: getGames });
          if (isLoading || !games) return <p>Загрузка...</p>;
          const rec = games.slice(0, 3);
          return (
            <div style={{ display: "flex", gap: 12, overflowX: "auto", paddingBottom: 8 }}>
              {rec.map((g: any) => (
                <GameTile key={g.id} game={g} />
              ))}
            </div>
          );
        })()}
      </section>

      <section style={{ textAlign: "center" }}>
        <Link to="/games">
          <button style={{ padding: 12, fontSize: 16 }}>Играть 🎮</button>
        </Link>
      </section>

      {/* Invite modal */}
      {pendingInvite && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.5)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 10000,
          }}
        >
          <div
            style={{
              background: "var(--tg-theme-bg-color, #fff)",
              borderRadius: 8,
              padding: 24,
              maxWidth: 320,
              textAlign: "center",
            }}
          >
            <p style={{ marginBottom: 16 }}>
              Партнёр приглашает сыграть в «{pendingInvite.game.title}». Принять приглашение?
            </p>
            <div style={{ display: "flex", gap: 12, justifyContent: "center" }}>
              <button
                onClick={async () => {
                  try {
                    await acceptInviteSession(pendingInvite.id, userId);
                    navigate(`/game/${pendingInvite.game.slug}?session=${pendingInvite.id}`);
                  } catch (e) {
                    alert("Не удалось принять приглашение");
                  } finally {
                    setPendingInvite(null);
                  }
                }}
                style={{ padding: 8, flex: 1 }}
              >
                Принять
              </button>
              <button
                onClick={async () => {
                  try {
                    await cancelSession(pendingInvite.id, userId);
                  } catch (e) {
                    console.error(e);
                  } finally {
                    setPendingInvite(null);
                  }
                }}
                style={{ padding: 8, flex: 1 }}
              >
                Отклонить
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
