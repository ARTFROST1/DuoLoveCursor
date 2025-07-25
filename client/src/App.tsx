import { Routes, Route } from "react-router-dom";
import GameList from "./pages/GameList";
import InviteAccept from "./pages/InviteAccept";
import GameScreen from "./pages/GameScreen";


export default function App() {
  

  

  return (
    <Routes>
      <Route path="/" element={<GameList />} />
      <Route path="/invite/:token" element={<InviteAccept />} />
      <Route path="/game/:slug" element={<GameScreen />} />







</Routes>
  );
}
