import { Routes, Route } from "react-router-dom";
import GameList from "./pages/GameList";
import Home from "./pages/Home";
import Profile from "./pages/Profile";
import InviteAccept from "./pages/InviteAccept";
import GameScreen from "./pages/GameScreen";
import { useEffect, useRef } from "react";
import { io as socketIO } from "socket.io-client";
import tg from "@twa-dev/sdk";
import { useNavigate } from "react-router-dom";
import { auth, getPartnershipStatus, getProfile, type ProfileData } from "./api";
import { useAppStore } from "./store";
import Welcome from "./pages/Welcome";
import BottomNav from "./components/BottomNav";
import Settings from "./pages/Settings";


export default function App() {
  const setUser = useAppStore((s) => s.setUser);
  const navigate = useNavigate();
  const socketRef = useRef<any>(null);

  // Authenticate user on load
  useEffect(() => {
    const tgUser = tg.initDataUnsafe.user;
    if (!tgUser) return;
    auth(tgUser)
      .then((id) => {
        setUser(id, tgUser.id.toString(), tgUser.first_name ?? tgUser.username);
        // Check if user already has a partner
        // Fetch profile to get avatarEmoji and possibly partner emoji
        getProfile(id)
          .then((profile: ProfileData) => {
            const { user, partner, partnershipCreatedAt } = profile;
            useAppStore.getState().setAvatarEmoji(user.avatarEmoji ?? undefined);
            if (partner) {
              useAppStore.getState().setPartnerData(
                partner.id,
                partner.name,
                partner.avatarEmoji,
                undefined,
                partnershipCreatedAt,
              );
            }
          })
          .catch(console.error);

        // Check if user already has a partner
        getPartnershipStatus(id)
          .then((data: { connected: boolean; createdAt?: string; partner?: { id: number; name?: string } }) => {
            if (data.connected) {
              const { partner, createdAt } = data;
              useAppStore.getState().setPartnerConnected(true);
              if (partner) {
                useAppStore.getState().setPartnerData(partner.id, partner.name, undefined /* avatarEmoji */, undefined /* online */, createdAt);
              }
            }
          })
          .catch(console.error);
      })
      .catch(console.error);
  }, [setUser]);

  // If launched with start_param (deep link), redirect to invite accept route
  useEffect(() => {
    const startParam = (tg.initDataUnsafe as any)?.start_param as string | undefined;
    if (startParam) {
      navigate(`/invite/${startParam}`);
    }
  }, [navigate]);

  // Connect Socket.IO for generic notifications (partnerDisconnected)
  useEffect(() => {
    const { userId } = useAppStore.getState();
    if (!userId) return;
    // Avoid reconnecting
    if (socketRef.current) return;
    const socket = socketIO("", { query: { userId } });
    socket.on("partnerDisconnected", () => {
      useAppStore.getState().setPartnerConnected(false);
      navigate("/welcome", { replace: true });
    });
    socketRef.current = socket;

    return () => {
      socket.disconnect();
      socketRef.current = null;
    };
  }, []);
  

  

  return (
    <>
      <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/games" element={<GameList />} />
      <Route path="/welcome" element={<Welcome />} />
      <Route path="/invite/:token" element={<InviteAccept />} />
      <Route path="/game/:slug" element={<GameScreen />} />
      <Route path="/profile" element={<Profile />} />
<Route path="/settings" element={<Settings />} />







      </Routes>
      <BottomNav />
    </>
  );
}
