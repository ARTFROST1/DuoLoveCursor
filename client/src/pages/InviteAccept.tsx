import { useParams, useNavigate } from "react-router-dom";
import { useEffect } from "react";
import { acceptInvite } from "../api";
import { useAppStore } from "../store";

export default function InviteAccept() {
  const { token } = useParams<{ token: string }>();
  const navigate = useNavigate();

  const userId = useAppStore((s) => s.userId);
  const setPartnerConnected = useAppStore((s) => s.setPartnerConnected);

  useEffect(() => {
    if (!token || userId === 0) return; // wait until auth finished

    acceptInvite(token, userId)
      .then(() => {
        // Mark partnership established locally
        setPartnerConnected(true);
        navigate("/");
      })
      .catch(console.error);
  }, [token, userId, navigate, setPartnerConnected]);

  return <p>Accepting invite...</p>;
}
