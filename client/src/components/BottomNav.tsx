import { useLocation, useNavigate } from "react-router-dom";
import { useAppStore } from "../store";

/**
 * Fixed bottom navigation bar that appears only after the partner has connected.
 * Contains three tabs: Home, Games, Profile.
 */
export default function BottomNav() {
  const { partnerConnected } = useAppStore();
  const location = useLocation();
  const navigate = useNavigate();

  // Hide nav until the partner is connected
  if (!partnerConnected) return null;

  // Hide nav on onboarding-related screens
  if (location.pathname.startsWith("/welcome") || location.pathname.startsWith("/invite")) {
    return null;
  }

  const items: { path: string; label: string }[] = [
    { path: "/", label: "Главная" },
    { path: "/games", label: "Игры" },
    { path: "/profile", label: "Профиль" },
  ];

  return (
    <nav
      style={{
        position: "fixed",
        bottom: 0,
        left: 0,
        right: 0,
        height: 56,
        display: "flex",
        alignItems: "center",
        justifyContent: "space-around",
        backdropFilter: "blur(6px)",
        backgroundColor: "var(--tg-theme-bg-color, rgba(255,255,255,0.8))",
        borderTop: "1px solid rgba(0,0,0,0.1)",
        zIndex: 1000,
      }}
    >
      {items.map((item) => (
        <button
          key={item.path}
          onClick={() => navigate(item.path)}
          style={{
            flex: 1,
            height: "100%",
            border: "none",
            background: "none",
            fontSize: 14,
            fontWeight: location.pathname === item.path ? "bold" : "normal",
            color: "var(--tg-theme-text-color, #000)",
          }}
        >
          {item.label}
        </button>
      ))}
    </nav>
  );
}
