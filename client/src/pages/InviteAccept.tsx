import { useParams, useNavigate } from "react-router-dom";
import { useEffect } from "react";
import { acceptInvite } from "../api";

export default function InviteAccept() {
  const { token } = useParams<{ token: string }>();
  const navigate = useNavigate();

  useEffect(() => {
    if (!token) return;
    // TODO: replace userId with actual Telegram user id
    const userId = 1;
    acceptInvite(token, userId)
      .then(() => navigate("/"))
      .catch(console.error);
  }, [token, navigate]);

  return <p>Accepting invite...</p>;
}
