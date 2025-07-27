export type AchievementScope = "INDIVIDUAL" | "COUPLE";

export interface AchievementDef {
  slug: string;
  emoji: string;
  title: string;
  description: string;
  category: string;
  goal?: number; // numeric threshold, if applicable
  scope?: AchievementScope; // defaults to INDIVIDUAL
}

/**
 * Central list of all achievements used by both seeding and runtime logic.
 * Extending the achievements system is as easy as adding a new entry here
 * and (if necessary) implementing the unlocking condition.
 */
export const ACHIEVEMENTS: AchievementDef[] = [
  // 🧖‍ Relationship Milestones
  {
    slug: "first_day",
    emoji: "📅",
    title: "First Day",
    description: "Celebrate your first day together",
    category: "relationship_milestones",
    goal: 1,
    scope: "COUPLE",
  },
  {
    slug: "first_10_days",
    emoji: "🔟",
    title: "First 10 Days",
    description: "Still together after 10 days",
    category: "relationship_milestones",
    goal: 10,
    scope: "COUPLE",
  },
  {
    slug: "hundred_days_strong",
    emoji: "💯",
    title: "100 Days Strong",
    description: "Your bond is growing!",
    category: "relationship_milestones",
    goal: 100,
    scope: "COUPLE",
  },
  {
    slug: "one_year_duo",
    emoji: "🏆",
    title: "One Year Duo",
    description: "365 days of love and games",
    category: "relationship_milestones",
    goal: 365,
    scope: "COUPLE",
  },

  // 🎮 Activity Achievements
  {
    slug: "first_game",
    emoji: "🎮",
    title: "First Game",
    description: "Play your very first game",
    category: "activity",
    goal: 1,
    scope: "COUPLE",
  },
  {
    slug: "game_duo",
    emoji: "🔁",
    title: "Game Duo",
    description: "Played 10 games together",
    category: "activity",
    goal: 10,
    scope: "COUPLE",
  },
  {
    slug: "hardcore_mode",
    emoji: "💪",
    title: "Hardcore Mode",
    description: "Played 50 games",
    category: "activity",
    goal: 50,
    scope: "COUPLE",
  },
  {
    slug: "puzzle_masters",
    emoji: "🧩",
    title: "Puzzle Masters",
    description: "Finish 5 co-op games",
    category: "activity",
    goal: 5,
    scope: "COUPLE",
  },
  {
    slug: "duelists",
    emoji: "⚔️",
    title: "Duelists",
    description: "Fight it out in 10 competitive matches",
    category: "activity",
    goal: 10,
    scope: "COUPLE",
  },

  // 🧠 Memory & Sync
  {
    slug: "mind_reader",
    emoji: "🧠",
    title: "Mind Reader",
    description: "Correctly guess partner's answers 3 times",
    category: "memory_sync",
    goal: 3,
    scope: "COUPLE",
  },
  {
    slug: "perfect_sync",
    emoji: "🔄",
    title: "Perfect Sync",
    description: "Sync perfectly in a game",
    category: "memory_sync",
    goal: 1,
    scope: "COUPLE",
  },
  {
    slug: "brain_twins",
    emoji: "🤯",
    title: "Brain Twins",
    description: "Finish 5 memory-based games together",
    category: "memory_sync",
    goal: 5,
    scope: "COUPLE",
  },

  // 🗣 Communication Achievements
  {
    slug: "talk_to_me",
    emoji: "🗣",
    title: "Talk to Me",
    description: "Discuss your first question together",
    category: "communication",
    goal: 1,
    scope: "COUPLE",
  },
  {
    slug: "deep_talk",
    emoji: "💬",
    title: "Deep Talk",
    description: "Complete 5 discussions",
    category: "communication",
    goal: 5,
    scope: "COUPLE",
  },
  {
    slug: "soul_talkers",
    emoji: "📖",
    title: "Soul Talkers",
    description: "15+ shared discussions",
    category: "communication",
    goal: 15,
    scope: "COUPLE",
  },

  // 🎉 Special & Fun
  {
    slug: "first_victory",
    emoji: "🥇",
    title: "First Victory",
    description: "Win your first duel",
    category: "special_fun",
    goal: 1,
    scope: "COUPLE",
  },
  {
    slug: "silly_couple",
    emoji: "🧃",
    title: "Silly Couple",
    description: "Complete a “Silly Challenge”",
    category: "special_fun",
    goal: 1,
    scope: "COUPLE",
  },
  {
    slug: "night_owls",
    emoji: "🌙",
    title: "Night Owls",
    description: "Played together after midnight",
    category: "special_fun",
    goal: 1,
    scope: "COUPLE",
  },
  {
    slug: "hot_streak",
    emoji: "🔥",
    title: "Hot Streak",
    description: "Play 3 days in a row",
    category: "special_fun",
    goal: 3,
    scope: "COUPLE",
  },
  {
    slug: "legendary_duo",
    emoji: "💎",
    title: "Legendary Duo",
    description: "Unlock all other achievements",
    category: "special_fun",
    goal: undefined,
    scope: "COUPLE",
  },
];
