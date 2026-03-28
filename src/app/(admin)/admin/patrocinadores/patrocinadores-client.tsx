"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  createSponsor,
  updateSponsor,
  deleteSponsor,
} from "@/lib/actions/sponsors";
import type { Sponsor, SponsorTier } from "@/types";

const TIER_OPTIONS: { value: SponsorTier; label: string }[] = [
  { value: "title", label: "Title" },
  { value: "gold", label: "Gold" },
  { value: "silver", label: "Silver" },
  { value: "bronze", label: "Bronze" },
  { value: "partner", label: "Partner" },
];

const TIER_STYLES: Record<SponsorTier, string> = {
  title: "bg-yellow-500/10 text-yellow-500 border-yellow-500/20",
  gold: "bg-amber-500/10 text-amber-500 border-amber-500/20",
  silver: "bg-gray-400/10 text-gray-400 border-gray-400/20",
  bronze: "bg-orange-600/10 text-orange-600 border-orange-600/20",
  partner: "bg-blue-500/10 text-blue-500 border-blue-500/20",
};

export function PatrocinadoresClient({
  sponsors,
}: {
  sponsors: Sponsor[];
}) {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Sponsor | null>(null);
  const [isPending, startTransition] = useTransition();

  function openCreate() {
    setEditing(null);
    setDialogOpen(true);
  }

  function openEdit(sponsor: Sponsor) {
    setEditing(sponsor);
    setDialogOpen(true);
  }

  function handleSubmit(formData: FormData) {
    startTransition(async () => {
      const result = editing
        ? await updateSponsor(editing.id, formData)
        : await createSponsor(formData);

      if ("error" in result) {
        toast.error(result.error);
      } else {
        toast.success(
          editing ? "Patrocinador actualizado" : "Patrocinador creado"
        );
        setDialogOpen(false);
        setEditing(null);
      }
    });
  }

  function handleDelete(id: string) {
    if (!confirm("Eliminar este patrocinador?")) return;
    startTransition(async () => {
      const result = await deleteSponsor(id);
      if ("error" in result) {
        toast.error(result.error);
      } else {
        toast.success("Patrocinador eliminado");
      }
    });
  }

  return (
    <>
      <div className="flex items-center justify-between mb-4">
        <span className="text-sm text-muted-foreground">
          {sponsors.length} patrocinadores
        </span>
        <Button onClick={openCreate} size="sm">
          <Plus data-icon="inline-start" />
          Nuevo patrocinador
        </Button>
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Nombre</TableHead>
            <TableHead>Tier</TableHead>
            <TableHead>Logo URL</TableHead>
            <TableHead>Web</TableHead>
            <TableHead>Activo</TableHead>
            <TableHead>Orden</TableHead>
            <TableHead className="w-[100px]">Acciones</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {sponsors.length === 0 && (
            <TableRow>
              <TableCell
                colSpan={7}
                className="text-center text-muted-foreground"
              >
                No hay patrocinadores
              </TableCell>
            </TableRow>
          )}
          {sponsors.map((s) => (
            <TableRow key={s.id}>
              <TableCell className="font-medium">{s.name}</TableCell>
              <TableCell>
                <Badge className={TIER_STYLES[s.tier]}>
                  {s.tier}
                </Badge>
              </TableCell>
              <TableCell className="text-muted-foreground max-w-[200px] truncate">
                {s.logo_url}
              </TableCell>
              <TableCell className="text-muted-foreground max-w-[150px] truncate">
                {s.website_url ?? "-"}
              </TableCell>
              <TableCell>
                <Badge
                  variant={s.is_active ? "default" : "outline"}
                  className={
                    s.is_active
                      ? "bg-green-500/10 text-green-500 border-green-500/20"
                      : ""
                  }
                >
                  {s.is_active ? "Si" : "No"}
                </Badge>
              </TableCell>
              <TableCell>{s.sort_order}</TableCell>
              <TableCell>
                <div className="flex items-center gap-1">
                  <Button
                    variant="ghost"
                    size="icon-xs"
                    onClick={() => openEdit(s)}
                  >
                    <Pencil />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon-xs"
                    onClick={() => handleDelete(s.id)}
                    disabled={isPending}
                  >
                    <Trash2 />
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {editing ? "Editar patrocinador" : "Nuevo patrocinador"}
            </DialogTitle>
            <DialogDescription>
              {editing
                ? "Modifica los datos del patrocinador"
                : "Rellena los datos del nuevo patrocinador"}
            </DialogDescription>
          </DialogHeader>
          <SponsorForm
            sponsor={editing}
            onSubmit={handleSubmit}
            isPending={isPending}
          />
        </DialogContent>
      </Dialog>
    </>
  );
}

function SponsorForm({
  sponsor,
  onSubmit,
  isPending,
}: {
  sponsor: Sponsor | null;
  onSubmit: (formData: FormData) => void;
  isPending: boolean;
}) {
  const [tier, setTier] = useState<string>(sponsor?.tier ?? "partner");
  const [isActive, setIsActive] = useState(sponsor?.is_active ?? true);

  return (
    <form action={onSubmit} className="space-y-4">
      <input type="hidden" name="tier" value={tier} />
      <input type="hidden" name="is_active" value={isActive ? "true" : "false"} />

      <div className="space-y-1.5">
        <Label htmlFor="sponsor-name">Nombre</Label>
        <Input
          id="sponsor-name"
          name="name"
          defaultValue={sponsor?.name ?? ""}
          required
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="sponsor-logo">Logo URL</Label>
        <Input
          id="sponsor-logo"
          name="logo_url"
          defaultValue={sponsor?.logo_url ?? ""}
          required
          placeholder="https://..."
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="sponsor-web">Website URL</Label>
        <Input
          id="sponsor-web"
          name="website_url"
          type="url"
          defaultValue={sponsor?.website_url ?? ""}
          placeholder="https://..."
        />
      </div>

      <div className="space-y-1.5">
        <Label>Tier</Label>
        <Select value={tier} onValueChange={(v) => { if (v) setTier(v); }}>
          <SelectTrigger className="w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {TIER_OPTIONS.map((t) => (
              <SelectItem key={t.value} value={t.value}>
                {t.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <Label htmlFor="sponsor-sort">Orden</Label>
          <Input
            id="sponsor-sort"
            name="sort_order"
            type="number"
            defaultValue={sponsor?.sort_order ?? 0}
          />
        </div>
        <div className="flex items-center gap-3 pt-6">
          <Switch
            checked={isActive}
            onCheckedChange={setIsActive}
          />
          <Label>Activo</Label>
        </div>
      </div>

      <DialogFooter>
        <Button type="submit" disabled={isPending}>
          {isPending ? "Guardando..." : sponsor ? "Actualizar" : "Crear"}
        </Button>
      </DialogFooter>
    </form>
  );
}
