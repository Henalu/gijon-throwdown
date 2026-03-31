"use client";

import { useEffect } from "react";

/**
 * Registers the service worker and starts the offline infrastructure.
 * Should only be mounted inside the (volunteer) layout.
 */
export function RegisterServiceWorker() {
  useEffect(() => {
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker
        .register("/sw.js", { scope: "/voluntario" })
        .catch((err) => {
          console.warn("[SW] Registration failed:", err);
        });
    }
  }, []);

  return null;
}
