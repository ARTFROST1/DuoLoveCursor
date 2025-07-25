import { create } from "zustand";

interface State {
  userId: number;
  telegramId?: string;
  displayName?: string;
  partnerConnected: boolean;
  inviteToken?: string;
  partnerId?: number;
  partnerName?: string;
  partnerOnline?: boolean;
  partnershipCreatedAt?: string;
  setUser: (userId: number, telegramId: string, displayName?: string) => void;
  setInviteToken: (t: string) => void;
  setPartnerConnected: (v: boolean) => void;
  setPartnerData: (id: number, name?: string, online?: boolean, createdAt?: string) => void;
}

export const useAppStore = create<State>((set) => ({
  userId: 0,
  telegramId: undefined,
  displayName: undefined,

  partnerConnected: false,
  inviteToken: undefined,
  partnerId: undefined,
  partnerName: undefined,
  partnerOnline: undefined,
  partnershipCreatedAt: undefined,
  setUser: (userId, telegramId, displayName) => set({ userId, telegramId, displayName }),
  setInviteToken: (t) => set({ inviteToken: t }),
  setPartnerConnected: (v) => set({ partnerConnected: v }),
  setPartnerData: (id, name, online, createdAt) =>
    set({ partnerId: id, partnerName: name, partnerOnline: online, partnershipCreatedAt: createdAt }),
}));
