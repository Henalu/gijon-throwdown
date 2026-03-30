export function getYoutubeVideoId(url: string | null | undefined): string | null {
  if (!url) return null;

  try {
    const parsed = new URL(url);
    const hostname = parsed.hostname.replace(/^www\./, "");

    if (hostname === "youtu.be") {
      return parsed.pathname.split("/").filter(Boolean)[0] ?? null;
    }

    if (hostname === "youtube.com" || hostname === "m.youtube.com") {
      if (parsed.pathname === "/watch") {
        return parsed.searchParams.get("v");
      }

      if (
        parsed.pathname.startsWith("/embed/") ||
        parsed.pathname.startsWith("/live/") ||
        parsed.pathname.startsWith("/shorts/")
      ) {
        return parsed.pathname.split("/").filter(Boolean)[1] ?? null;
      }
    }
  } catch {
    return null;
  }

  return null;
}

export function getYoutubeEmbedUrl(url: string | null | undefined): string | null {
  const videoId = getYoutubeVideoId(url);
  if (!videoId) return null;
  return `https://www.youtube.com/embed/${videoId}`;
}

export function getYoutubeThumbnailUrl(
  url: string | null | undefined,
  quality: "maxresdefault" | "hqdefault" = "maxresdefault",
): string | null {
  const videoId = getYoutubeVideoId(url);
  if (!videoId) return null;
  return `https://img.youtube.com/vi/${videoId}/${quality}.jpg`;
}

export function formatSessionDateRange(
  startedAt: string | null | undefined,
  endedAt: string | null | undefined,
): string {
  if (!startedAt && !endedAt) {
    return "Horario por confirmar";
  }

  const formatter = new Intl.DateTimeFormat("es-ES", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });

  const startLabel = startedAt ? formatter.format(new Date(startedAt)) : null;
  const endLabel = endedAt ? formatter.format(new Date(endedAt)) : null;

  if (startLabel && endLabel) {
    return `${startLabel} - ${endLabel}`;
  }

  return startLabel ?? endLabel ?? "Horario por confirmar";
}
