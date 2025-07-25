import { useAppStore } from "../store";
import { useNavigate } from "react-router-dom";
import { useEffect } from "react";

/**
 * Simple stub for the Profile page. Will be expanded in later milestones (Этап 5).
 */
export default function Profile() {
  const { displayName, partnerConnected } = useAppStore();
  const navigate = useNavigate();

  // Block access until partner connected
  useEffect(() => {
    if (!partnerConnected) {
      navigate("/welcome", { replace: true });
    }
  }, [partnerConnected, navigate]);

  return (
    <div style={{ padding: 16 }}>
      <h1>Профиль</h1>
      <p>Добро пожаловать, {displayName ?? "пользователь"}! 👤</p>
      {/* TODO: profile details, achievements, settings */}
    </div>
  );
}
