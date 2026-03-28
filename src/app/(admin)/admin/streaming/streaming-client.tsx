"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { MonitorPlay, ExternalLink } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

interface StreamingClientProps {
  eventId: string;
  currentUrl: string;
}

function getEmbedUrl(url: string): string {
  if (!url) return "";
  // Convert watch URL to embed
  return url.replace("watch?v=", "embed/");
}

export function StreamingClient({ eventId, currentUrl }: StreamingClientProps) {
  const [url, setUrl] = useState(currentUrl);
  const [loading, setLoading] = useState(false);

  async function handleSave() {
    setLoading(true);
    const supabase = createClient();
    const { error } = await supabase
      .from("event_config")
      .update({ stream_url: url || null })
      .eq("id", eventId);
    setLoading(false);

    if (error) toast.error(error.message);
    else toast.success("URL de stream actualizada");
  }

  const embedUrl = getEmbedUrl(url);

  return (
    <div className="space-y-6">
      <div className="p-6 rounded-xl bg-card border border-border space-y-4">
        <div className="space-y-2">
          <Label>URL de YouTube</Label>
          <div className="flex gap-2">
            <Input
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://www.youtube.com/watch?v=..."
              className="flex-1"
            />
            <Button
              onClick={handleSave}
              disabled={loading}
              className="bg-brand-green text-black hover:bg-brand-green/90"
            >
              {loading ? "Guardando..." : "Guardar"}
            </Button>
          </div>
          <p className="text-xs text-muted-foreground">
            Pega la URL completa del video o stream de YouTube.
          </p>
        </div>

        {url && (
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <ExternalLink size={12} />
            <span>URL publica: </span>
            <code className="bg-muted/50 px-2 py-0.5 rounded">/directo</code>
          </div>
        )}
      </div>

      {/* Preview */}
      {embedUrl ? (
        <div className="rounded-xl overflow-hidden border border-border">
          <div className="p-3 bg-muted/50 flex items-center gap-2">
            <MonitorPlay size={16} className="text-muted-foreground" />
            <span className="text-sm text-muted-foreground">Preview</span>
          </div>
          <div className="aspect-video bg-black">
            <iframe
              src={embedUrl}
              className="w-full h-full"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
              title="Stream preview"
            />
          </div>
        </div>
      ) : (
        <div className="rounded-xl border border-border p-12 text-center">
          <MonitorPlay size={48} className="mx-auto text-muted-foreground mb-3" />
          <p className="text-muted-foreground">
            Configura una URL de YouTube para ver el preview.
          </p>
        </div>
      )}
    </div>
  );
}
