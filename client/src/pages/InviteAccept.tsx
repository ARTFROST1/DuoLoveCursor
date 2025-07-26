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

    let cancelled = false;

    (async () => {
      // Try to accept invite; if it fails (e.g. invite already used) – continue anyway
      try {
        await acceptInvite(token, userId);
        // Mark as connected immediately and leave the page
        setPartnerConnected(true);
        if (!cancelled) navigate("/", { replace: true });
      } catch (err) {
        console.error("acceptInvite failed", err);
        // Even if request errored (e.g. already used), proceed to fetch status below
      }

      // Always try to fetch fresh partnership status
      try {
        const status = (await getPartnershipStatus(userId)) as { connected: boolean; createdAt?: string; partner?: { id: number; name?: string } };
        if (status.connected) {
          setPartnerConnected(true);
          if (status.partner) {
            setPartnerData(status.partner.id, status.partner.name, undefined /* avatarEmoji */, undefined, status.createdAt);
          }
        }
      } catch (err) {
        console.error("getPartnershipStatus failed", err);
      }

      // Even if something failed above, go to Home – it will redirect back to /welcome if not connected
      if (!cancelled) navigate("/", { replace: true });
    })();

    return () => {
      cancelled = true;
    };
  }, [token, userId, navigate, setPartnerConnected, setPartnerData]);

  return <p>Accepting invite...</p>;
}
