import { useParams } from "react-router-dom";

export default function GameScreen() {
  const { slug } = useParams<{ slug: string }>();
  return (
    <div style={{ padding: 16 }}>
      <h2>Game: {slug}</h2>
      <p>Здесь будет логика игры.</p>
    </div>
  );
}
