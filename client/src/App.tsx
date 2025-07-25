import { Routes, Route } from "react-router-dom";
import GameList from "./pages/GameList";
import InviteAccept from "./pages/InviteAccept";
import GameScreen from "./pages/GameScreen";
import { useEffect } from "react";
import tg from "@twa-dev/sdk";
import { auth } from "./api";
import { useAppStore } from "./store";
import Welcome from "./pages/Welcome";


export default function App() {
  const setUser = useAppStore((s) => s.setUser);

  useEffect(() => {
    const tgUser = tg.initDataUnsafe.user;
    if (!tgUser) return;
    auth(tgUser)
      .then((id) => {
        setUser(id, tgUser.id.toString(), tgUser.first_name ?? tgUser.username);
      })
      .catch(console.error);
  }, [setUser]);
  

  

  return (
    <Routes>
      <Route path="/" element={<GameList />} />
      <Route path="/welcome" element={<Welcome />} />
      <Route path="/invite/:token" element={<InviteAccept />} />
      <Route path="/game/:slug" element={<GameScreen />} />







</Routes>
  );
}
