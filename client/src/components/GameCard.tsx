import { Link } from "react-router-dom";

interface Props {
  slug: string;
  title: string;
  description: string;
}

export default function GameCard({ slug, title, description }: Props) {
  return (
    <Link
      to={`/game/${slug}`}
      style={{
        display: "block",
        background: "var(--tg-theme-bg-color, #fff)",
        borderRadius: 8,
        boxShadow: "0 2px 6px rgba(0,0,0,0.1)",
        padding: 12,
        textDecoration: "none",
        color: "inherit",
      }}
    >
      <h3 style={{ margin: "0 0 4px" }}>{title}</h3>
      <p style={{ margin: 0, fontSize: 14, opacity: 0.8 }}>{description}</p>
    </Link>
  );
}
