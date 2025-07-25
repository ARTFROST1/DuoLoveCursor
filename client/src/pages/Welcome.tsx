import { useMutation } from "@tanstack/react-query";
import { useEffect } from "react";
import { createInvite, getPartnershipStatus } from "../api";
import { useAppStore } from "../store";

export default function Welcome() {
  const {
    userId,
    inviteToken,
    setInviteToken,
    partnerConnected,
    setPartnerConnected,
  } = useAppStore();

  // Poll every 3s until partner connects
  useEffect(() => {
    if (!inviteToken || partnerConnected) return;
    const id = setInterval(() => {
      getPartnershipStatus(userId)
        .then((data) => {
          if (data.connected) setPartnerConnected(true);
        })
        .catch(console.error);
    }, 3000);
    return () => clearInterval(id);
  }, [inviteToken, partnerConnected, userId, setPartnerConnected]);


  const { mutate, isPending } = useMutation({
    mutationFn: () => createInvite(userId),
    onSuccess: (token) => setInviteToken(token),
  });

  const BOT_USERNAME = "duolove_bot"; // TODO: move to env
  const WEBAPP_PATH = "DuoLove"; // webapp path from BotFather
  const deepLink = inviteToken
    ? `https://t.me/${BOT_USERNAME}/${WEBAPP_PATH}?startapp=${inviteToken}`
    : "";

  return (
    <div style={{ padding: 16 }}>
      <h1>Добро пожаловать 👋</h1>
      <p>
        Поделитесь ссылкой с партнёром, чтобы начать играть вместе. Когда партнёр
        примет приглашение, функции приложения откроются полностью.
      </p>

      {inviteToken ? (
        <>
          <p style={{ wordBreak: "break-all" }}>{deepLink}</p>
          <button
            onClick={() => navigator.clipboard.writeText(deepLink)}
            style={{ padding: 8 }}
          >
            Скопировать ссылку
          </button>
        </>
      ) : (
        <button onClick={() => mutate()} disabled={isPending} style={{ padding: 8 }}>
          {isPending ? "Создаём..." : "Создать пригласительную ссылку"}
        </button>
      )}
      {inviteToken && !partnerConnected && (
        <p style={{ marginTop: 16 }}>Ожидаем подключение партнёра…</p>
      )}
    </div>
  );
}
