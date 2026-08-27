"use client";

import { useCallback, useEffect, useState } from "react";

export function useAuth() {
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [authLoading, setAuthLoading] = useState(true);

  const refetch = useCallback(async () => {
    try {
      const res = await fetch("/api/me", { credentials: "include" });
      const data = await res.json();
      setCurrentUser(data.user);
    } catch (err) {
      console.error("Auth check failed:", err);
    } finally {
      setAuthLoading(false);
    }
  }, []);

  useEffect(() => {
    refetch();
  }, [refetch]);

  return { currentUser, authLoading, refetch };
}
