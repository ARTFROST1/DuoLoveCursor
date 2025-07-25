import { Link, useNavigate } from "react-router-dom";
import { useEffect } from "react";
import { useAppStore } from "../store";

/**
 * Home page (Главная) that greets the pair and shows quick actions.
 * Displays user & partner names / avatars (stub), a days-together counter and a shortcut to the Games list.
 */
export default function Home() {
  const { displayName, partnerConnected } = useAppStore();
  const navigate = useNavigate();

  // Until partner connects, redirect to onboarding
  useEffect(() => {
    if (!partnerConnected) {
      navigate("/welcome", { replace: true });
    }
  }, [partnerConnected, navigate]);

  // Days together stub (real logic later)
  const daysTogether = 0;

  return (
    <div style={{ padding: 16 }}>
      <h1>Привет{displayName ? ", " + displayName : ""}! 🤝</h1>

      <section style={{ margin: "24px 0" }}>
        <p>Вы вместе уже {daysTogether} дней</p>
        {/* TODO: avatars & partner status */}
      </section>

      <section>
        <Link to="/games">
          <button style={{ padding: 12, fontSize: 16 }}>Играть 🎮</button>
        </Link>
      </section>
    </div>
  );
}
