import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { startGame, getSession, cancelSession } from "../api";
import { useAppStore } from "../store";
import { useGameSocket } from "../hooks/useGameSocket";


export default function GameScreen() {
  const { slug } = useParams<{ slug: string }>();
  const [search] = useSearchParams();
  const sessionId = Number(search.get("session"));
  const userId = useAppStore((s) => s.userId);
  const navigate = useNavigate();

  const { state, sendReaction } = useGameSocket(sessionId, userId ?? 0);

  const { data: session } = useQuery({
    queryKey: ["session", sessionId],
    queryFn: () => getSession(sessionId),
    enabled: !!sessionId,
    refetchInterval: 2000,
  });

  const isInviter = session ? session.partner1Id === userId : false;
  const waitingForPartner = state.phase === "waiting" && session && !session.partner2Accepted;

  const handleCancel = async () => {
    if (!sessionId || !userId) return;
    try {
      await cancelSession(sessionId, userId);
      navigate("/", { replace: true });
    } catch (err) {
      alert("Не удалось отменить сессию");
    }
  };

  const handleStart = async () => {
    if (!userId) return;
    try {
      const sessionId = await startGame(userId, slug!);
      navigate(`/game/${slug}?session=${sessionId}`);
    } catch (err) {
      alert("Не удалось запустить игру: " + (err as Error).message);
    }
  };

  return (
    <div style={{ padding: 16, textAlign: "center" }}>
      <h2>{slug === "reaction_duo" ? "Fast Reaction" : `Игра: ${slug}`}</h2>
      {sessionId ? (
        <>
          {waitingForPartner && (
            <>
              <p>Ждём партнёра…</p>
              {isInviter && (
                <button onClick={handleCancel} style={{ marginTop: 16 }}>
                  Отменить приглашение
                </button>
              )}
            </>
          )}
          {state.phase === "countdown" && <h1 style={{ fontSize: 72 }}>{state.countdownSec}</h1>}
          {state.phase === "playing" && (
            <button onClick={sendReaction} style={{ padding: 40, fontSize: 32 }}>
              Жми!
            </button>
          )}
          {state.phase === "finished" && (
            <p>{state.winnerId === userId ? "Вы выиграли!" : "Победил партнёр"}</p>
          )}
          {state.phase === "error" && <p style={{ color: "red" }}>{state.error}</p>}
        </>
      ) : (
        <button onClick={handleStart} style={{ padding: 12, fontSize: 16 }}>
          Пригласить партнёра и начать
        </button>
      )}
    </div>
  );
}
