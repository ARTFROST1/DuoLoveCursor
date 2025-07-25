import { create } from "zustand";

interface State {
  userId: number;
  partnerConnected: boolean;
  inviteToken?: string;
  setInviteToken: (t: string) => void;
  setPartnerConnected: (v: boolean) => void;
}

export const useAppStore = create<State>((set) => ({
  // TODO: get real Telegram user id
  userId: 1,
  partnerConnected: false,
  inviteToken: undefined,
  setInviteToken: (t) => set({ inviteToken: t }),
  setPartnerConnected: (v) => set({ partnerConnected: v }),
}));
