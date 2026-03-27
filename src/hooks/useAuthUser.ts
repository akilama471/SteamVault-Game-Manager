import { useEffect, useState } from "react";
import { subscribeToAuth } from "@/firebase/firebase";

export function useAuthUser() {
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    const unsubscribe = subscribeToAuth((u) => setUser(u));
    return () => unsubscribe();
  }, []);

  return user;
}
