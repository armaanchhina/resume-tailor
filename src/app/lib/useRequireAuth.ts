"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "./useAuth";

// Redirects to /sign-in if the user turns out not to be logged in, instead of
// a page rendering "Unauthorized" after its API calls start failing with 401.
export function useRequireAuth() {
  const router = useRouter();
  const { currentUser, authLoading } = useAuth();

  useEffect(() => {
    if (!authLoading && !currentUser) {
      router.replace("/sign-in");
    }
  }, [authLoading, currentUser, router]);

  return { currentUser, authLoading };
}
