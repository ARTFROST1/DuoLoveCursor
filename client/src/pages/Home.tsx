import { Link, useNavigate } from "react-router-dom";
import { useEffect, useMemo } from "react";
import Avatar from "../components/Avatar";
import Carousel from "../components/Carousel";
import GameTile from "../components/GameTile";
import { useQuery } from "@tanstack/react-query";
import { getGames } from "../api";
import { useAppStore } from "../store";

/**
 * Home page (Главная) that greets the pair and shows quick actions.
 * Displays user & partner names / avatars (stub), a days-together counter and a shortcut to the Games list.
 */
export default function Home() {
  const { displayName, partnerName, partnershipCreatedAt, partnerOnline, partnerConnected } = useAppStore();
  const navigate = useNavigate();

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
      <h1>Привет{displayName ? ", " + displayName : ""}! 🤝</h1>

      <section style={{ margin: "24px 0", display: "flex", flexDirection: "column", alignItems: "center" }}>
        <div style={{ display: "flex", gap: 16, alignItems: "center" }}>
          <Avatar name={displayName} size={72} online={true} />
          <span style={{ fontSize: 24 }}>+</span>
          <Avatar name={partnerName} size={72} online={partnerOnline} />
        </div>
        <p style={{ marginTop: 16 }}>Вы вместе уже {daysTogether} дней</p>
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
    </div>
  );
}
