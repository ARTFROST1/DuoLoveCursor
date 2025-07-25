interface AvatarProps {
  name?: string;
  size?: number;
  online?: boolean;
}

/**
 * Simple circular avatar using initials. Replace with real images later.
 */
export default function Avatar({ name, size = 64, online }: AvatarProps) {
  const initials = (name ?? "?")
    .split(" ")
    .map((p) => p[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  return (
    <div style={{ position: "relative", display: "inline-block" }}>
      <div
      style={{
        width: size,
        height: size,
        borderRadius: "50%",
        backgroundColor: "#6da9ff",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        color: "white",
        fontWeight: "bold",
        fontSize: size * 0.4,
      }}
    >
      {initials}
      </div>
      {online !== undefined && (
        <span
          style={{
            position: "absolute",
            bottom: 4,
            right: 4,
            width: size * 0.25,
            height: size * 0.25,
            borderRadius: "50%",
            backgroundColor: online ? "#4caf50" : "#9e9e9e",
            border: "2px solid white",
          }}
        />
      )}
    </div>
  );
}
