import { create } from "zustand";

interface State {
  userId: number;
  telegramId?: string;
  displayName?: string;
  partnerConnected: boolean;
  inviteToken?: string;
  setUser: (userId: number, telegramId: string, displayName?: string) => void;
  setInviteToken: (t: string) => void;
  setPartnerConnected: (v: boolean) => void;
}

export const useAppStore = create<State>((set) => ({
  userId: 0,
  telegramId: undefined,
  displayName: undefined,

  partnerConnected: false,
  inviteToken: undefined,
  setUser: (userId, telegramId, displayName) => set({ userId, telegramId, displayName }),
  setInviteToken: (t) => set({ inviteToken: t }),
  setPartnerConnected: (v) => set({ partnerConnected: v }),
}));
