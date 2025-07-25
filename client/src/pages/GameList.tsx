import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { getGames } from "../api";

export default function GameList() {
  const { data: games, isLoading, error } = useQuery({
    queryKey: ["games"],
    queryFn: getGames,
  });

  if (isLoading) return <p>Loading...</p>;
  if (error) return <p>Error loading games</p>;

  return (
    <div style={{ padding: 16 }}>
      <h1>DuoLoveCursor Games</h1>
      <ul>
        {games.map((g: any) => (
          <li key={g.id}>
            <Link to={`/game/${g.slug}`}>{g.title}</Link> — {g.description}
          </li>
        ))}
      </ul>
    </div>
  );
}
