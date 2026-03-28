"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { updateEvent } from "@/lib/actions/event";
import type { EventConfig } from "@/types";

const STATUS_OPTIONS = [
  { value: "draft", label: "Borrador" },
  { value: "published", label: "Publicado" },
  { value: "live", label: "En vivo" },
  { value: "finished", label: "Finalizado" },
] as const;

export function EventForm({ event }: { event: EventConfig }) {
  const [isPending, startTransition] = useTransition();
  const [status, setStatus] = useState(event.status);

  function handleSubmit(formData: FormData) {
    formData.set("status", status);
    startTransition(async () => {
      const result = await updateEvent(formData);
      if ("error" in result) {
        toast.error(result.error);
      } else {
        toast.success("Evento actualizado");
      }
    });
  }

  return (
    <form action={handleSubmit} className="space-y-5">
      <input type="hidden" name="id" value={event.id} />

      <div className="space-y-1.5">
        <Label htmlFor="name">Nombre</Label>
        <Input id="name" name="name" defaultValue={event.name} required />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="description">Descripcion</Label>
        <Textarea
          id="description"
          name="description"
          defaultValue={event.description ?? ""}
          rows={3}
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <Label htmlFor="date">Fecha inicio</Label>
          <Input
            id="date"
            name="date"
            type="date"
            defaultValue={event.date?.split("T")[0] ?? ""}
            required
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="end_date">Fecha fin</Label>
          <Input
            id="end_date"
            name="end_date"
            type="date"
            defaultValue={event.end_date?.split("T")[0] ?? ""}
          />
        </div>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="location">Ubicacion</Label>
        <Input
          id="location"
          name="location"
          defaultValue={event.location ?? ""}
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <Label htmlFor="venue_name">Nombre del venue</Label>
          <Input
            id="venue_name"
            name="venue_name"
            defaultValue={event.venue_name ?? ""}
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="venue_address">Direccion</Label>
          <Input
            id="venue_address"
            name="venue_address"
            defaultValue={event.venue_address ?? ""}
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <Label htmlFor="primary_color">Color primario</Label>
          <Input
            id="primary_color"
            name="primary_color"
            defaultValue={event.primary_color}
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="secondary_color">Color secundario</Label>
          <Input
            id="secondary_color"
            name="secondary_color"
            defaultValue={event.secondary_color}
          />
        </div>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="stream_url">URL del stream</Label>
        <Input
          id="stream_url"
          name="stream_url"
          type="url"
          defaultValue={event.stream_url ?? ""}
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="rules_url">URL de las reglas</Label>
        <Input
          id="rules_url"
          name="rules_url"
          type="url"
          defaultValue={event.rules_url ?? ""}
        />
      </div>

      <div className="space-y-1.5">
        <Label>Estado</Label>
        <Select value={status} onValueChange={(v) => { if (v) setStatus(v as typeof status); }}>
          <SelectTrigger className="w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {STATUS_OPTIONS.map((opt) => (
              <SelectItem key={opt.value} value={opt.value}>
                {opt.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <Button type="submit" disabled={isPending}>
        {isPending ? "Guardando..." : "Guardar cambios"}
      </Button>
    </form>
  );
}
