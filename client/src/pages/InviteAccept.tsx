import { useParams, useNavigate } from "react-router-dom";
import { useEffect } from "react";
import { acceptInvite, getPartnershipStatus } from "../api";
import { useAppStore } from "../store";

export default function InviteAccept() {
  const { token } = useParams<{ token: string }>();
  const navigate = useNavigate();

  const userId = useAppStore((s) => s.userId);
  const setPartnerConnected = useAppStore((s) => s.setPartnerConnected);
  const setPartnerData = useAppStore((s) => s.setPartnerData);

  useEffect(() => {
    if (!token || userId === 0) return; // wait until auth finished

    acceptInvite(token, userId)
      .then(async () => {
        // Mark partnership established locally
        setPartnerConnected(true);
        // Fetch partner data and createdAt
        try {
          const status = await getPartnershipStatus(userId);
          if (status.connected && status.partner) {
            setPartnerData(status.partner.id, status.partner.name, undefined, status.createdAt);
          }
        } catch (e) {
          console.error(e);
        }
        navigate("/");
      })
      .catch(console.error);
  }, [token, userId, navigate, setPartnerConnected]);

  return <p>Accepting invite...</p>;
}
