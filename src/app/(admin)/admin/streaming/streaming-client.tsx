"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  ExternalLink,
  MonitorPlay,
  Pencil,
  Plus,
  Radio,
  Trash2,
  Video,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { deleteStreamSession, saveStreamSession, updateFallbackStreamUrl } from "@/lib/actions/streaming";
import { formatSessionDateRange, getYoutubeEmbedUrl } from "@/lib/streaming";
import type { StreamSession } from "@/types";

interface StreamingClientProps {
  eventId: string;
  currentUrl: string;
  sessions: StreamSession[];
}

function toLocalDateTimeValue(value: string | null | undefined) {
  if (!value) return "";
  const date = new Date(value);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  const hours = String(date.getHours()).padStart(2, "0");
  const minutes = String(date.getMinutes()).padStart(2, "0");
  return `${year}-${month}-${day}T${hours}:${minutes}`;
}

export function StreamingClient({
  eventId,
  currentUrl,
  sessions,
}: StreamingClientProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [fallbackUrl, setFallbackUrl] = useState(currentUrl);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<StreamSession | null>(null);
  const [sessionForm, setSessionForm] = useState({
    title: "",
    description: "",
    youtubeUrl: "",
    isLive: false,
    isPublic: true,
    startedAt: "",
    endedAt: "",
    sortOrder: 0,
  });

  const liveSessions = useMemo(
    () => sessions.filter((session) => session.is_live),
    [sessions],
  );
  const publicSessions = useMemo(
    () => sessions.filter((session) => session.is_public),
    [sessions],
  );
  const archivedSessions = useMemo(
    () => sessions.filter((session) => !session.is_live),
    [sessions],
  );

  const activePreviewUrl =
    getYoutubeEmbedUrl(sessionForm.youtubeUrl) ||
    getYoutubeEmbedUrl(fallbackUrl) ||
    null;

  function openCreate() {
    setEditing(null);
    setSessionForm({
      title: "",
      description: "",
      youtubeUrl: "",
      isLive: false,
      isPublic: true,
      startedAt: "",
      endedAt: "",
      sortOrder: 0,
    });
    setDialogOpen(true);
  }

  function openEdit(session: StreamSession) {
    setEditing(session);
    setSessionForm({
      title: session.title,
      description: session.description ?? "",
      youtubeUrl: session.youtube_url ?? "",
      isLive: session.is_live,
      isPublic: session.is_public,
      startedAt: toLocalDateTimeValue(session.started_at),
      endedAt: toLocalDateTimeValue(session.ended_at),
      sortOrder: session.sort_order,
    });
    setDialogOpen(true);
  }

  function handleFallbackSave() {
    startTransition(async () => {
      const result = await updateFallbackStreamUrl({
        eventId,
        streamUrl: fallbackUrl,
      });

      if ("error" in result) {
        toast.error(result.error);
        return;
      }

      toast.success("URL principal del directo actualizada");
      router.refresh();
    });
  }

  function handleSessionSave() {
    startTransition(async () => {
      const result = await saveStreamSession({
        id: editing?.id,
        title: sessionForm.title,
        description: sessionForm.description,
        youtubeUrl: sessionForm.youtubeUrl,
        isLive: sessionForm.isLive,
        isPublic: sessionForm.isPublic,
        startedAt: sessionForm.startedAt,
        endedAt: sessionForm.endedAt,
        sortOrder: Number(sessionForm.sortOrder),
      });

      if ("error" in result) {
        toast.error(result.error);
        return;
      }

      toast.success(editing ? "Sesion actualizada" : "Sesion creada");
      setDialogOpen(false);
      setEditing(null);
      router.refresh();
    });
  }

  function handleDelete(id: string) {
    if (!confirm("Eliminar esta sesion de streaming?")) return;

    startTransition(async () => {
      const result = await deleteStreamSession({ id });

      if ("error" in result) {
        toast.error(result.error);
        return;
      }

      toast.success("Sesion eliminada");
      router.refresh();
    });
  }

  return (
    <>
      <div className="space-y-6">
        <div className="grid gap-3 md:grid-cols-3">
          <div className="rounded-2xl border border-border/60 bg-card/80 p-4">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Radio size={16} />
              Sesiones live
            </div>
            <p className="mt-3 text-3xl font-black text-foreground">
              {liveSessions.length}
            </p>
          </div>
          <div className="rounded-2xl border border-border/60 bg-card/80 p-4">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Video size={16} />
              Publicas
            </div>
            <p className="mt-3 text-3xl font-black text-foreground">
              {publicSessions.length}
            </p>
          </div>
          <div className="rounded-2xl border border-border/60 bg-card/80 p-4">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <MonitorPlay size={16} />
              Archivo
            </div>
            <p className="mt-3 text-3xl font-black text-foreground">
              {archivedSessions.length}
            </p>
          </div>
        </div>

        <Tabs defaultValue="principal" className="space-y-4">
          <TabsList
            variant="line"
            className="grid w-full gap-2 rounded-2xl border border-border/60 bg-card/80 p-1 md:inline-flex md:w-fit md:border-0 md:bg-transparent md:p-0"
          >
            <TabsTrigger
              value="principal"
              className="w-full justify-start px-3 py-2 text-left whitespace-normal md:w-auto md:flex-none md:justify-center md:px-1.5 md:py-0.5"
            >
              Directo principal
            </TabsTrigger>
            <TabsTrigger
              value="sesiones"
              className="w-full justify-start px-3 py-2 text-left whitespace-normal md:w-auto md:flex-none md:justify-center md:px-1.5 md:py-0.5"
            >
              Sesiones
            </TabsTrigger>
          </TabsList>

          <TabsContent value="principal" className="space-y-6">
            <div className="rounded-2xl border border-border/60 bg-card/80 p-5">
              <div className="space-y-2">
                <Label htmlFor="fallback-stream-url">URL principal de YouTube</Label>
                <div className="flex flex-col gap-3 lg:flex-row">
                  <Input
                    id="fallback-stream-url"
                    value={fallbackUrl}
                    onChange={(event) => setFallbackUrl(event.target.value)}
                    placeholder="https://www.youtube.com/watch?v=..."
                    className="flex-1"
                  />
                  <Button
                    onClick={handleFallbackSave}
                    disabled={isPending}
                    className="bg-brand-green text-black hover:bg-brand-green/90"
                  >
                    {isPending ? "Guardando..." : "Guardar URL principal"}
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground">
                  Esta URL actua como fallback cuando no hay una sesion live
                  marcada en el archivo de streaming.
                </p>
              </div>

              {fallbackUrl && (
                <div className="mt-4 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                  <ExternalLink size={12} />
                  <span>Visible en la ruta publica</span>
                  <code className="rounded bg-muted/60 px-2 py-0.5">/directo</code>
                </div>
              )}
            </div>

            {activePreviewUrl ? (
              <div className="overflow-hidden rounded-2xl border border-border/60 bg-card/80">
                <div className="flex items-center gap-2 border-b border-border/60 px-4 py-3 text-sm text-muted-foreground">
                  <MonitorPlay size={16} />
                  Preview del embed principal
                </div>
                <div className="aspect-video bg-black">
                  <iframe
                    src={activePreviewUrl}
                    className="h-full w-full"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                    title="Preview del streaming"
                  />
                </div>
              </div>
            ) : (
              <div className="rounded-2xl border border-dashed border-border/60 p-10 text-center text-sm text-muted-foreground">
                Todavia no hay URL principal configurada para el directo.
              </div>
            )}
          </TabsContent>

          <TabsContent value="sesiones" className="space-y-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <p className="min-w-0 text-sm text-muted-foreground">
                Crea sesiones publicas para destacar el directo, replays o
                bloques especiales del evento.
              </p>
              <Button onClick={openCreate} size="sm">
                <Plus data-icon="inline-start" />
                Nueva sesion
              </Button>
            </div>

            {sessions.length > 0 ? (
              <div className="grid gap-4 lg:grid-cols-2">
                {sessions.map((session) => {
                  const embedUrl = getYoutubeEmbedUrl(session.youtube_url);

                  return (
                    <div
                      key={session.id}
                      className="overflow-hidden rounded-2xl border border-border/60 bg-card/80"
                    >
                      <div className="space-y-4 p-5">
                        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                          <div className="min-w-0">
                            <div className="flex flex-wrap items-center gap-2">
                              <p className="text-lg font-semibold text-foreground break-words">
                                {session.title}
                              </p>
                              {session.is_live && (
                                <Badge className="border-red-500/20 bg-red-500/10 text-red-400">
                                  LIVE
                                </Badge>
                              )}
                              <Badge
                                variant="outline"
                                className={
                                  session.is_public
                                    ? "border-brand-green/30 text-brand-green"
                                    : "text-muted-foreground"
                                }
                              >
                                {session.is_public ? "Publica" : "Oculta"}
                              </Badge>
                            </div>
                            <p className="mt-2 text-sm text-muted-foreground">
                              {formatSessionDateRange(
                                session.started_at,
                                session.ended_at,
                              )}
                            </p>
                          </div>
                          <div className="flex items-center gap-1">
                            <Button
                              variant="ghost"
                              size="icon-xs"
                              onClick={() => openEdit(session)}
                            >
                              <Pencil />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon-xs"
                              onClick={() => handleDelete(session.id)}
                              disabled={isPending}
                            >
                              <Trash2 />
                            </Button>
                          </div>
                        </div>

                        {session.description && (
                          <p className="text-sm leading-6 text-muted-foreground break-words">
                            {session.description}
                          </p>
                        )}

                        {embedUrl ? (
                          <div className="overflow-hidden rounded-[1.2rem] border border-border/60">
                            <div className="aspect-video bg-black">
                              <iframe
                                src={embedUrl}
                                className="h-full w-full"
                                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                allowFullScreen
                                title={session.title}
                              />
                            </div>
                          </div>
                        ) : (
                          <div className="rounded-[1.2rem] border border-dashed border-border/60 p-6 text-sm text-muted-foreground">
                            La URL guardada no genera embed valido todavia.
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="rounded-2xl border border-dashed border-border/60 p-10 text-center text-sm text-muted-foreground">
                No hay sesiones creadas aun. La web seguira tirando del embed
                principal hasta que prepares el archivo de directos.
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {editing ? "Editar sesion" : "Nueva sesion de streaming"}
            </DialogTitle>
            <DialogDescription>
              Configura el bloque publico que aparecera en la pagina de directo.
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-1.5 md:col-span-2">
              <Label htmlFor="stream-session-title">Titulo</Label>
              <Input
                id="stream-session-title"
                value={sessionForm.title}
                onChange={(event) =>
                  setSessionForm((current) => ({
                    ...current,
                    title: event.target.value,
                  }))
                }
                placeholder="Arena principal - Sabado manana"
              />
            </div>

            <div className="space-y-1.5 md:col-span-2">
              <Label htmlFor="stream-session-url">URL de YouTube</Label>
              <Input
                id="stream-session-url"
                value={sessionForm.youtubeUrl}
                onChange={(event) =>
                  setSessionForm((current) => ({
                    ...current,
                    youtubeUrl: event.target.value,
                  }))
                }
                placeholder="https://www.youtube.com/watch?v=..."
              />
            </div>

            <div className="space-y-1.5 md:col-span-2">
              <Label htmlFor="stream-session-description">Descripcion</Label>
              <Textarea
                id="stream-session-description"
                rows={4}
                value={sessionForm.description}
                onChange={(event) =>
                  setSessionForm((current) => ({
                    ...current,
                    description: event.target.value,
                  }))
                }
                placeholder="Que bloque cubre, para que sirve y que va a encontrar la gente aqui."
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="stream-session-started-at">Empieza</Label>
              <Input
                id="stream-session-started-at"
                type="datetime-local"
                value={sessionForm.startedAt}
                onChange={(event) =>
                  setSessionForm((current) => ({
                    ...current,
                    startedAt: event.target.value,
                  }))
                }
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="stream-session-ended-at">Termina</Label>
              <Input
                id="stream-session-ended-at"
                type="datetime-local"
                value={sessionForm.endedAt}
                onChange={(event) =>
                  setSessionForm((current) => ({
                    ...current,
                    endedAt: event.target.value,
                  }))
                }
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="stream-session-sort-order">Orden</Label>
              <Input
                id="stream-session-sort-order"
                type="number"
                min={0}
                max={999}
                value={sessionForm.sortOrder}
                onChange={(event) =>
                  setSessionForm((current) => ({
                    ...current,
                    sortOrder: Number(event.target.value || 0),
                  }))
                }
              />
            </div>

            <div className="grid gap-4 rounded-2xl border border-border/60 bg-background/60 p-4 md:col-span-2 md:grid-cols-2">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="min-w-0">
                  <p className="text-sm font-medium text-foreground">Marcar como live</p>
                  <p className="text-xs text-muted-foreground">
                    Si activas esta opcion, se convierte en la sesion principal del directo.
                  </p>
                </div>
                <Switch
                  checked={sessionForm.isLive}
                  onCheckedChange={(checked) =>
                    setSessionForm((current) => ({
                      ...current,
                      isLive: checked,
                    }))
                  }
                />
              </div>

              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="min-w-0">
                  <p className="text-sm font-medium text-foreground">Visible en web</p>
                  <p className="text-xs text-muted-foreground">
                    Controla si aparece o no en la pagina publica de streaming.
                  </p>
                </div>
                <Switch
                  checked={sessionForm.isPublic}
                  onCheckedChange={(checked) =>
                    setSessionForm((current) => ({
                      ...current,
                      isPublic: checked,
                    }))
                  }
                />
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              onClick={handleSessionSave}
              disabled={isPending}
            >
              {isPending
                ? "Guardando..."
                : editing
                  ? "Actualizar sesion"
                  : "Crear sesion"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
