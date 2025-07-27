import { useMutation } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { useEffect } from "react";
import { createInvite, getPartnershipStatus, getProfile, type ProfileData } from "../api";
import { useAppStore } from "../store";

export default function Welcome() {
  const {
    userId,
    inviteToken,
    setInviteToken,
    partnerConnected,
    setPartnerConnected,
    setPartnerData,
    setDisplayName,
    setAvatarEmoji,
  } = useAppStore();

  async function refreshProfile() {
    try {
      const profile: ProfileData = await getProfile(userId);
      const { user, partner, partnershipCreatedAt } = profile;
      setDisplayName(user.name ?? undefined);
      setAvatarEmoji(user.avatarEmoji ?? undefined);
      if (partner) {
        setPartnerData(partner.id, partner.name, partner.avatarEmoji, undefined, partnershipCreatedAt);
      }
    } catch (err) {
      console.error("refreshProfile failed", err);
    }
  }

  // Poll every 3s until partner connects
  const navigate = useNavigate();

  // redirect when partner connected
  useEffect(() => {
    if (partnerConnected) {
      navigate("/");
    }
  }, [partnerConnected, navigate]);

  // polling loop
  useEffect(() => {
    if (!inviteToken || partnerConnected) return;
    const id = setInterval(async () => {
      try {
        const data = await getPartnershipStatus(userId);
        if (data.connected) {
          setPartnerConnected(true);
          await refreshProfile();
        }
      } catch (err) {
        console.error(err);
      }
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
