// When running through Vite dev-server we proxy API requests to
// localhost:4000, so we can keep the paths relative. In production the
// frontend will be served from the same origin as the backend (or a reverse
// proxy), so relative paths are also fine.
const API_URL = "";

export interface Game {
  id: number;
  slug: string;
  title: string;
  description: string;
  category: string;
  coverUrl?: string | null;
}

export interface CategoryGames {
  category: string;
  games: Game[];
}


export async function getGames() {
  const res = await fetch(`${API_URL}/games`);
  if (!res.ok) throw new Error("Failed to fetch games");
  return res.json();
}

export interface TelegramUser {
  id: number;
  username?: string;
  first_name?: string;
  last_name?: string;
}

export async function auth(tgUser: TelegramUser) {
  const res = await fetch(`${API_URL}/auth`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ telegramId: tgUser.id.toString(), name: tgUser.first_name ?? tgUser.username }),
  });
  if (!res.ok) throw new Error("Auth failed");
  return (await res.json()).id as number;
}

export async function getPartnershipStatus(userId: number) {
  const res = await fetch(`${API_URL}/partnership/status?userId=${userId}`);
  if (!res.ok) throw new Error("Status check failed");
  return res.json() as Promise<{ connected: boolean; partner?: { id: number; name?: string } }>;
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

export async function getGamesByCategory() {
  const res = await fetch(`${API_URL}/games/by-category`);
  if (!res.ok) throw new Error("Failed to fetch games by category");
  return res.json() as Promise<CategoryGames[]>;
}

// --- Game session / invitation ---
export interface GameSession {
  id: number;
  game: Game;
  partner1Id: number;
  partner2Id: number;
  partner2Accepted: boolean;
}

export async function startGame(userId: number, gameSlug: string) {
  const res = await fetch(`${API_URL}/game-session/start`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ userId, gameSlug }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || "Failed to start game session");
  }
  return (await res.json()).sessionId as number;
}

export async function getPendingInvites(userId: number) {
  const res = await fetch(`${API_URL}/game-session/pending?userId=${userId}`);
  if (!res.ok) throw new Error("Failed to fetch invites");
  return res.json() as Promise<GameSession[]>;
}

export async function acceptInviteSession(sessionId: number, userId: number) {
  const res = await fetch(`${API_URL}/game-session/${sessionId}/accept`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ userId }),
  });
  if (!res.ok) throw new Error("Failed to accept game invite");
  return res.json();
}

export async function getSession(sessionId: number) {
  const res = await fetch(`${API_URL}/game-session/${sessionId}`);
  if (!res.ok) throw new Error("Failed to fetch session");
  return res.json() as Promise<GameSession>;
}
