import { create } from "zustand";

interface State {
  // --- User basic info ---
  userId: number;
  telegramId?: string;
  displayName?: string;
  avatarEmoji?: string;

  // --- Partnership ---
  partnerConnected: boolean;
  inviteToken?: string;
  partnerId?: number;
  partnerName?: string;
  partnerOnline?: boolean;
  partnershipCreatedAt?: string;

  // --- Settings ---
  theme: "light" | "dark";
  language: "ru" | "en";
  soundOn: boolean;
  notificationsOn: boolean;

  // --- Actions ---
  setUser: (userId: number, telegramId: string, displayName?: string) => void;
  setDisplayName: (name: string) => void;
  setAvatarEmoji: (emoji: string) => void;
  setInviteToken: (t: string) => void;
  setPartnerConnected: (v: boolean) => void;
  setPartnerData: (id: number, name?: string, online?: boolean, createdAt?: string) => void;
  setTheme: (theme: "light" | "dark") => void;
  setLanguage: (lang: "ru" | "en") => void;
  setSoundOn: (value: boolean) => void;
  setNotificationsOn: (value: boolean) => void;
}

export const useAppStore = create<State>((set) => ({
  // --- User basic info ---
  userId: 0,
  telegramId: undefined,
  displayName: undefined,
  avatarEmoji: undefined,

  // --- Partnership ---
  partnerConnected: false,
  inviteToken: undefined,
  partnerId: undefined,
  partnerName: undefined,
  partnerOnline: undefined,
  partnershipCreatedAt: undefined,

  // --- Settings ---
  theme: "light",
  language: "ru",
  soundOn: true,
  notificationsOn: true,

  // --- Actions ---
  setUser: (userId, telegramId, displayName) => set({ userId, telegramId, displayName }),
  setDisplayName: (name) => set({ displayName: name }),
  setAvatarEmoji: (emoji) => set({ avatarEmoji: emoji }),
  setInviteToken: (t) => set({ inviteToken: t }),
  setPartnerConnected: (v) => set({ partnerConnected: v }),
  setPartnerData: (id, name, online, createdAt) =>
    set({ partnerId: id, partnerName: name, partnerOnline: online, partnershipCreatedAt: createdAt }),
  setTheme: (theme) => set({ theme }),
  setLanguage: (language) => set({ language }),
  setSoundOn: (soundOn) => set({ soundOn }),
  setNotificationsOn: (notificationsOn) => set({ notificationsOn }),
}));
