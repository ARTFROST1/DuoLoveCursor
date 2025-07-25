import GameTile from "../components/GameTile";
import { useQuery } from "@tanstack/react-query";
import { getGamesByCategory } from "../api";
import type { CategoryGames } from "../api";

export default function GameList() {
  const { data: categories, isLoading, error } = useQuery<CategoryGames[]>({
    queryKey: ["games-by-category"],
    queryFn: getGamesByCategory,
  });

  if (isLoading) return <p>Loading...</p>;
  if (error) return <p>Error loading games</p>;

  return (
    <div style={{ padding: 16 }}>
      <h1>Игры</h1>
      {categories?.map((cat) => (
        <section key={cat.category} style={{ marginBottom: 24 }}>
          <h2 style={{ textTransform: "capitalize", fontSize: 20, marginBottom: 12 }}>{cat.category}</h2>
          <div style={{ display: "flex", gap: 12, overflowX: "auto", paddingBottom: 8 }}>
            {cat.games.map((g) => (
              <GameTile key={g.id} game={g} />
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}
