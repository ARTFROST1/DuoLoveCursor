import { Routes, Route } from "react-router-dom";
import GameList from "./pages/GameList";
import Home from "./pages/Home";
import Profile from "./pages/Profile";
import InviteAccept from "./pages/InviteAccept";
import GameScreen from "./pages/GameScreen";
import { useEffect } from "react";
import tg from "@twa-dev/sdk";
import { useNavigate } from "react-router-dom";
import { auth, getPartnershipStatus } from "./api";
import { useAppStore } from "./store";
import Welcome from "./pages/Welcome";
import BottomNav from "./components/BottomNav";


export default function App() {
  const setUser = useAppStore((s) => s.setUser);
  const navigate = useNavigate();

  // Authenticate user on load
  useEffect(() => {
    const tgUser = tg.initDataUnsafe.user;
    if (!tgUser) return;
    auth(tgUser)
      .then((id) => {
        setUser(id, tgUser.id.toString(), tgUser.first_name ?? tgUser.username);
        // Check if user already has a partner
        getPartnershipStatus(id)
          .then((data: { connected: boolean }) => {
            if (data.connected) {
              useAppStore.getState().setPartnerConnected(true);
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
  

  

  return (
    <>
      <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/games" element={<GameList />} />
      <Route path="/welcome" element={<Welcome />} />
      <Route path="/invite/:token" element={<InviteAccept />} />
      <Route path="/game/:slug" element={<GameScreen />} />
      <Route path="/profile" element={<Profile />} />







      </Routes>
      <BottomNav />
    </>
  );
}
