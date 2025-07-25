const API_URL = "http://localhost:4000";

export async function getGames() {
  const res = await fetch(`${API_URL}/games`);
  if (!res.ok) throw new Error("Failed to fetch games");
  return res.json();
}

export async function createInvite(userId: number) {
  const res = await fetch(`${API_URL}/invite/create`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ userId }),
  });
  if (!res.ok) throw new Error("Failed to create invite");
  const json = await res.json();
  return json.token as string;
}

export async function acceptInvite(token: string, userId: number) {
  const res = await fetch(`${API_URL}/invite/accept`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ token, userId }),
  });
  if (!res.ok) throw new Error("Failed to accept invite");
  return res.json();
}
