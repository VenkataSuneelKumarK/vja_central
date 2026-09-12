import { useEffect, useState } from "react";
import { CitizenProfile, getCitizenSession, hydrateCitizenSession, subscribeCitizenSession } from "@/api/citizenAuth";

export function useCitizenAuth() {
  const [citizen, setCitizen] = useState<CitizenProfile | null>(getCitizenSession()?.citizen ?? null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let mounted = true;
    hydrateCitizenSession().then((session) => {
      if (!mounted) return;
      setCitizen(session?.citizen ?? null);
      setReady(true);
    });
    const unsubscribe = subscribeCitizenSession((session) => setCitizen(session?.citizen ?? null));
    return () => {
      mounted = false;
      unsubscribe();
    };
  }, []);

  return { citizen, isAuthenticated: !!citizen, ready };
}
