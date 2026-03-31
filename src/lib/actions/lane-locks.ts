"use server";

import { getCurrentSessionProfile } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";

/** How long a lock is considered valid without a heartbeat (5 minutes). */
const LOCK_TTL_MS = 5 * 60 * 1000;

interface LockResult {
  locked: boolean;
  lockedByName?: string;
}

/**
 * Try to acquire a soft lock on a lane for the current user.
 * Returns { locked: true } if acquired or already held by same user.
 * Returns { locked: false, lockedByName } if held by another user.
 */
export async function acquireLaneLock(
  laneId: string,
): Promise<LockResult> {
  const session = await getCurrentSessionProfile();
  if (!session.user || !session.profile) {
    return { locked: false, lockedByName: "Usuario no autenticado" };
  }

  const supabase = await createClient();
  const userId = session.user.id;

  // Check current lock state
  const { data: lane } = await supabase
    .from("lanes")
    .select("locked_by, locked_at")
    .eq("id", laneId)
    .single();

  if (!lane) {
    return { locked: false, lockedByName: "Calle no encontrada" };
  }

  // If already locked by same user, just refresh
  if (lane.locked_by === userId) {
    await supabase
      .from("lanes")
      .update({ locked_at: new Date().toISOString() })
      .eq("id", laneId);
    return { locked: true };
  }

  // If locked by another user and lock is still fresh
  if (lane.locked_by && lane.locked_at) {
    const lockAge = Date.now() - new Date(lane.locked_at).getTime();
    if (lockAge < LOCK_TTL_MS) {
      // Look up who holds the lock
      const { data: holder } = await supabase
        .from("profiles")
        .select("full_name")
        .eq("id", lane.locked_by)
        .single();
      return {
        locked: false,
        lockedByName: holder?.full_name ?? "Otro juez",
      };
    }
    // Lock expired, take over
  }

  // Acquire lock
  const { error } = await supabase
    .from("lanes")
    .update({
      locked_by: userId,
      locked_at: new Date().toISOString(),
    })
    .eq("id", laneId);

  if (error) {
    return { locked: false, lockedByName: "Error al bloquear calle" };
  }

  return { locked: true };
}

/**
 * Refresh the lock heartbeat. Call periodically while scoring.
 */
export async function refreshLaneLock(laneId: string): Promise<void> {
  const session = await getCurrentSessionProfile();
  if (!session.user) return;

  const supabase = await createClient();
  await supabase
    .from("lanes")
    .update({ locked_at: new Date().toISOString() })
    .eq("id", laneId)
    .eq("locked_by", session.user.id);
}

/**
 * Release the lock when done scoring.
 */
export async function releaseLaneLock(laneId: string): Promise<void> {
  const session = await getCurrentSessionProfile();
  if (!session.user) return;

  const supabase = await createClient();
  await supabase
    .from("lanes")
    .update({ locked_by: null, locked_at: null })
    .eq("id", laneId)
    .eq("locked_by", session.user.id);
}
