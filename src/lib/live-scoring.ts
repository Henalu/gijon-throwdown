import type {
  LiveLaneCloseReason,
  LiveMetricType,
  ScoreType,
  WodType,
} from "@/types";

export function getDefaultLiveMetric(scoreType: ScoreType): LiveMetricType {
  switch (scoreType) {
    case "weight":
      return "weight";
    case "rounds_reps":
      return "rounds";
    case "points":
      return "points";
    case "reps":
    case "time":
    default:
      return "reps";
  }
}

export function getLiveMetricLabel(metric: LiveMetricType): string {
  switch (metric) {
    case "calories":
      return "Cal";
    case "weight":
      return "Kg";
    case "rounds":
      return "Rondas";
    case "points":
      return "Pts";
    case "reps":
    default:
      return "Reps";
  }
}

export function getElapsedMs(
  heatStartedAt: string | null,
  now = Date.now(),
): number | null {
  if (!heatStartedAt) return null;
  return Math.max(0, now - new Date(heatStartedAt).getTime());
}

export function hasTimeCapElapsed(
  heatStartedAt: string | null,
  timeCapSeconds: number | null,
  now = Date.now(),
): boolean {
  if (!heatStartedAt || !timeCapSeconds) return false;
  const elapsed = getElapsedMs(heatStartedAt, now);
  if (elapsed == null) return false;
  return elapsed >= timeCapSeconds * 1000;
}

export function formatElapsedMs(elapsedMs: number | null): string {
  if (elapsedMs == null) return "--:--.-";

  const totalSeconds = elapsedMs / 1000;
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = (totalSeconds % 60).toFixed(1);

  return `${minutes}:${seconds.padStart(4, "0")}`;
}

export function isTimedWorkout(
  wodType: WodType | string,
  timeCapSeconds: number | null,
): boolean {
  return Boolean(timeCapSeconds) || wodType === "for_time" || wodType === "amrap" || wodType === "emom";
}

export function shouldTreatTimeCapAsScore(
  wodType: WodType | string,
): boolean {
  return wodType === "for_time";
}

export function getPublicLaneResultLabel(
  closeReason: LiveLaneCloseReason | null | undefined,
): string {
  switch (closeReason) {
    case "completed":
      return "Finalizado";
    case "time_cap":
      return "CAP";
    case "manual":
      return "Cerrado";
    default:
      return "En curso";
  }
}
