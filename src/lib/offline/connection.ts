/* ------------------------------------------------------------------ */
/*  Connection status detector                                         */
/*  Combines navigator.onLine with a real fetch probe.                 */
/* ------------------------------------------------------------------ */

type ConnectionListener = (online: boolean) => void;

const listeners = new Set<ConnectionListener>();
let currentStatus = typeof navigator !== "undefined" ? navigator.onLine : true;
let probeTimer: ReturnType<typeof setInterval> | null = null;

function notify(online: boolean) {
  if (online === currentStatus) return;
  currentStatus = online;
  for (const fn of listeners) fn(online);
}

async function probe() {
  try {
    // Lightweight check: hit the Supabase health endpoint or a tiny resource.
    // We use the app's own origin to avoid CORS issues.
    const r = await fetch("/voluntario", {
      method: "HEAD",
      cache: "no-store",
    });
    notify(r.ok);
  } catch {
    notify(false);
  }
}

export function getConnectionStatus() {
  return currentStatus;
}

export function startConnectionMonitor(intervalMs = 5_000) {
  if (typeof window === "undefined") return;

  window.addEventListener("online", () => {
    notify(true);
    void probe();
  });
  window.addEventListener("offline", () => notify(false));

  // Periodic probe to catch captive portals and WiFi with no internet
  probeTimer = setInterval(() => void probe(), intervalMs);
}

export function stopConnectionMonitor() {
  if (probeTimer) {
    clearInterval(probeTimer);
    probeTimer = null;
  }
}

export function onConnectionChange(fn: ConnectionListener): () => void {
  listeners.add(fn);
  return () => listeners.delete(fn);
}
