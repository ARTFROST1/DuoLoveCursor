import { useMutation } from "@tanstack/react-query";
import { createInvite } from "../api";
import { useAppStore } from "../store";

export default function Welcome() {
  const { userId, inviteToken, setInviteToken } = useAppStore();

  const { mutate, isPending } = useMutation({
    mutationFn: () => createInvite(userId),
    onSuccess: (token) => setInviteToken(token),
  });

  const botName = "DuetGamesBot"; // TODO: move to env
  const deepLink = `https://t.me/${botName}?startapp=${inviteToken}`;

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
    </div>
  );
}
