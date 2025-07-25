import { Link } from "react-router-dom";

interface Game {
  id: number;
  slug: string;
  title: string;
  description?: string;
  coverUrl?: string | null;
}

interface GameTileProps {
  game: Game;
  large?: boolean;
}

/**
 * Simple tile preview of a game. If `large` is true — stretches to full width.
 */
export default function GameTile({ game, large = false }: GameTileProps) {
  const content = (
    <div
      style={{
        position: "relative",
        width: large ? "100%" : 160,
        height: large ? 120 : 100,
        borderRadius: 12,
        overflow: "hidden",
        boxShadow: "0 2px 6px rgba(0,0,0,0.1)",
        backgroundColor: "#e0e0e0",
        flexShrink: 0,
      }}
    >
      {game.coverUrl && (
        <img
          src={game.coverUrl}
          alt={game.title}
          style={{
            width: "100%",
            height: "100%",
            objectFit: "cover",
          }}
        />
      )}
      <div
        style={{
          position: "absolute",
          inset: 0,
          background: "linear-gradient(to bottom, rgba(0,0,0,0) 40%, rgba(0,0,0,0.7) 100%)",
        }}
      />
      <h3
        style={{
          position: "absolute",
          left: 12,
          bottom: 12,
          margin: 0,
          color: "white",
          fontSize: large ? 20 : 16,
        }}
      >
        {game.title}
      </h3>
    </div>
  );

  return (
    <Link to={`/game/${game.slug}`} style={{ textDecoration: "none" }}>
      {content}
    </Link>
  );
}
