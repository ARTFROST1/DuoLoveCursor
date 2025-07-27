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
import PartnerProfile from "./pages/PartnerProfile";


export default function App() {
  const setUser = useAppStore((s) => s.setUser);
  const navigate = useNavigate();
  const socketRef = useRef<any>(null);
  const userId = useAppStore((s) => s.userId);

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
            useAppStore.getState().setDisplayName(user.name ?? undefined);
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
          .then(async (data: { connected: boolean; createdAt?: string; partner?: { id: number; name?: string } }) => {
            if (data.connected) {
              useAppStore.getState().setPartnerConnected(true);
              // Fetch full profile to get complete partner/user info
              try {
                const profile: ProfileData = await getProfile(id);
                const { partner, partnershipCreatedAt } = profile;
                if (partner) {
                  useAppStore.getState().setPartnerData(partner.id, partner.name, partner.avatarEmoji, undefined, partnershipCreatedAt);
                }
              } catch (err) {
                console.error("getProfile failed", err);
              }
            }
          })
          .catch(console.error);
      })
      .catch(console.error);
  }, [setUser]);

  // If launched with start_param (deep link), redirect to invite accept route only when not yet connected
  useEffect(() => {
    const startParam = (tg.initDataUnsafe as any)?.start_param as string | undefined;
    if (!startParam) return;
    const { partnerConnected } = useAppStore.getState();
    if (partnerConnected) return; // already processed invite

    // Avoid infinite loop: navigate only if current pathname differs
    if (window.location.pathname !== `/invite/${startParam}`) {
      navigate(`/invite/${startParam}`);
    }
  }, [navigate]);

  // Connect Socket.IO for generic notifications (partnerDisconnected)
  useEffect(() => {
    if (!userId) return;
    // Avoid reconnecting if socket already exists for this user
    if (socketRef.current) return;

    const socket = socketIO("", { query: { userId } });
    socket.on("partnerDisconnected", () => {
      useAppStore.getState().setPartnerConnected(false);
      navigate("/welcome", { replace: true, state: { partnerDisconnected: true } });
    });
    socketRef.current = socket;

    return () => {
      socket.disconnect();
      socketRef.current = null;
    };
  }, [userId, navigate]);
  

  

  return (
    <>
      <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/games" element={<GameList />} />
      <Route path="/welcome" element={<Welcome />} />
      <Route path="/invite/:token" element={<InviteAccept />} />
      <Route path="/game/:slug" element={<GameScreen />} />
      <Route path="/profile" element={<Profile />} />
      <Route path="/partner" element={<PartnerProfile />} />
<Route path="/settings" element={<Settings />} />







      </Routes>
      <BottomNav />
    </>
  );
}
