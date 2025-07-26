import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAppStore } from "../store";
import { updateSettings, disconnectPartnership } from "../api";

// Simple list of emoji avatars (iOS-like)
const EMOJI_AVATARS = [
  "😀", "😎", "🥳", "😍", "🤓", "🧐", "😇", "🤠", "🤖", "👽", "🐱", "🐶", "🦊", "🐼", "🐵", "🐸",
];

export default function Settings() {
  const navigate = useNavigate();
  const store = useAppStore();

  const [avatarEmoji, setAvatarEmoji] = useState(store.avatarEmoji ?? "😀");
  const [displayName, setDisplayName] = useState(store.displayName ?? "");
  const [theme, setTheme] = useState<"light" | "dark">(store.theme);
  const [language, setLanguage] = useState<"ru" | "en">(store.language);
  const [soundOn, setSoundOn] = useState(store.soundOn);
  const [notificationsOn, setNotificationsOn] = useState(store.notificationsOn);
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (!store.userId) return;
    setSaving(true);
    try {
      await updateSettings(store.userId, {
        avatarEmoji,
        displayName,
        theme,
        language,
        soundOn,
        notificationsOn,
      });
      // Update local store
      store.setAvatarEmoji(avatarEmoji);
      store.setDisplayName(displayName);
      store.setTheme(theme);
      store.setLanguage(language);
      store.setSoundOn(soundOn);
      store.setNotificationsOn(notificationsOn);
      navigate(-1);
    } catch (e) {
      alert("Не удалось сохранить настройки");
      console.error(e);
    } finally {
      setSaving(false);
    }
  };

  const handleDisconnect = async () => {
    if (!store.userId) return;
    if (!window.confirm("Вы уверены, что хотите разорвать связь с партнёром?")) return;
    try {
      await disconnectPartnership(store.userId);
      store.setPartnerConnected(false);
      navigate("/welcome", { replace: true });
    } catch (e) {
      alert("Ошибка при разрыве связи");
      console.error(e);
    }
  };

  return (
    <div style={{ padding: 16, paddingBottom: 72 }}>
      <h2>Настройки</h2>

      {/* Avatar */}
      <section style={{ marginTop: 24 }}>
        <h3>Аватар</h3>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(8, 1fr)", gap: 8 }}>
          {EMOJI_AVATARS.map((e) => (
            <button
              key={e}
              onClick={() => setAvatarEmoji(e)}
              style={{
                padding: 8,
                fontSize: 24,
                borderRadius: 8,
                border: avatarEmoji === e ? "2px solid #6da9ff" : "1px solid #ccc",
                background: "none",
              }}
            >
              {e}
            </button>
          ))}
        </div>
      </section>

      {/* Display name */}
      <section style={{ marginTop: 24 }}>
        <h3>Имя</h3>
        <input
          type="text"
          value={displayName}
          onChange={(e) => setDisplayName(e.target.value)}
          style={{ padding: 8, width: "100%", fontSize: 16 }}
          placeholder="Ваше имя"
        />
      </section>

      {/* Theme */}
      <section style={{ marginTop: 24 }}>
        <h3>Тема</h3>
        <label style={{ marginRight: 16 }}>
          <input
            type="radio"
            name="theme"
            value="light"
            checked={theme === "light"}
            onChange={() => setTheme("light")}
          />
          Светлая
        </label>
        <label>
          <input
            type="radio"
            name="theme"
            value="dark"
            checked={theme === "dark"}
            onChange={() => setTheme("dark")}
          />
          Тёмная
        </label>
      </section>

      {/* Language */}
      <section style={{ marginTop: 24 }}>
        <h3>Язык</h3>
        <label style={{ marginRight: 16 }}>
          <input
            type="radio"
            name="lang"
            value="ru"
            checked={language === "ru"}
            onChange={() => setLanguage("ru")}
          />
          Русский
        </label>
        <label>
          <input
            type="radio"
            name="lang"
            value="en"
            checked={language === "en"}
            onChange={() => setLanguage("en")}
          />
          English
        </label>
      </section>

      {/* Extras */}
      <section style={{ marginTop: 24 }}>
        <h3>Дополнительно</h3>
        <label style={{ display: "block", marginBottom: 8 }}>
          <input type="checkbox" checked={soundOn} onChange={(e) => setSoundOn(e.target.checked)} /> Звук
        </label>
        <label style={{ display: "block" }}>
          <input
            type="checkbox"
            checked={notificationsOn}
            onChange={(e) => setNotificationsOn(e.target.checked)}
          />
          Уведомления
        </label>
      </section>

      {/* Save */}
      <button
        onClick={handleSave}
        disabled={saving}
        style={{ marginTop: 32, padding: 12, width: "100%", fontSize: 16, borderRadius: 8, background: "#6da9ff", color: "white", border: "none" }}
      >
        {saving ? "Сохранение…" : "Сохранить"}
      </button>

      {/* Disconnect */}
      {store.partnerConnected && (
        <button
          onClick={handleDisconnect}
          style={{
            marginTop: 24,
            padding: 12,
            width: "100%",
            fontSize: 16,
            borderRadius: 8,
            background: "#ff5252",
            color: "white",
            border: "none",
          }}
        >
          Разорвать связь с партнёром
        </button>
      )}
    </div>
  );
}
