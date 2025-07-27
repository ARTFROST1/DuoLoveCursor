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
export async function getOpenSessions(userId: number) {
  const res = await fetch(`${API_URL}/game-session/open?userId=${userId}`);
  if (!res.ok) throw new Error("Failed to fetch open sessions");
  return res.json() as Promise<GameSession[]>;
}

export async function finishSession(sessionId: number, userId: number) {
  const res = await fetch(`${API_URL}/game-session/${sessionId}/finish`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ userId }),
  });
  if (!res.ok) throw new Error("Failed to finish session");
  return res.json();
}

export async function cancelSession(sessionId: number, userId: number) {
  const res = await fetch(`${API_URL}/game-session/${sessionId}/cancel`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ userId }),
  });
  if (!res.ok) throw new Error("Failed to cancel session");
  return res.json();
}

// --- Game session / invitation ---
export interface GameSession {
  id: number;
  game: Game;
  partner1Id: number;
  partner2Id: number;
  partner2Accepted: boolean;
  endedAt?: string | null;
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

// ---------------- Profile ----------------
export interface ProfileData {
  user: { id: number; name?: string; avatarId?: number; avatarEmoji?: string };
  partner?: { id: number; name?: string; avatarId?: number; avatarEmoji?: string };
  partnershipCreatedAt?: string;
  stats: { totalGames: number; wins: number };
  achievements: Array<{
    id: number;
    achievedAt?: string;
    progress: number;
    achievement: {
      id: number;
      emoji: string;
      title: string;
      description: string;
      goal: number;
    };
  }>;
  history: Array<{
    id: number;
    playedAt: string;
    resultShort?: string;
    gameSession: {
      id: number;
      game: Game;
    };
  }>;
}

// ---------------- Settings ----------------
export interface UserSettings {
  avatarEmoji?: string;
  displayName?: string;
  theme?: "light" | "dark";
  language?: "ru" | "en";
  soundOn?: boolean;
  notificationsOn?: boolean;
}

export async function updateSettings(userId: number, settings: UserSettings) {
  const res = await fetch(`${API_URL}/settings/update`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ userId, settings }),
  });
  if (!res.ok) throw new Error("Failed to update settings");
  return res.json();
}

export async function disconnectPartnership(userId: number) {
  const res = await fetch(`${API_URL}/partnership/disconnect`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ userId }),
  });
  if (!res.ok) throw new Error("Failed to disconnect partnership");
  return res.json();
}

// ---------------- Achievements ----------------
export interface AchievementItem {
  slug: string;
  emoji: string;
  title: string;
  description: string;
  category: string;
  goal?: number;
  unlocked: boolean;
  progress: number;
  achievedAt?: string;
}

export async function getAchievements(userId: number) {
  const res = await fetch(`${API_URL}/achievements/${userId}`);
  if (!res.ok) throw new Error("Failed to fetch achievements");
  return res.json() as Promise<AchievementItem[]>;
}

export async function getProfile(userId: number) {
  const res = await fetch(`${API_URL}/profile/${userId}`);
  if (!res.ok) throw new Error("Failed to fetch profile");
  return res.json() as Promise<ProfileData>;
}

// ---------------- Stats ----------------
export interface StatsResponse {
  personal: {
    totalTimeMs: number;
    totalGames: number;
    gamesByCategory: Record<string, number>;
    favoriteGame?: { id: number; title: string; count: number };
    wins: number;
    losses: number;
    draws: number;
    reactionAvgMs?: number | null;
    successRate: number;
  };
  couple?: {
    daysTogether: number;
    totalGamesTogether: number;
    mostPlayedGameTogether?: { id: number; title: string; count: number };
    coOpSuccessRate: number;
    avgDailyActivityMin: number;
    discussionCount: number;
    syncScore: number;
  } | null;
}

export async function getStats(userId: number) {
  const res = await fetch(`${API_URL}/stats/${userId}`);
  if (!res.ok) throw new Error("Failed to fetch stats");
  return res.json() as Promise<StatsResponse>;
}
