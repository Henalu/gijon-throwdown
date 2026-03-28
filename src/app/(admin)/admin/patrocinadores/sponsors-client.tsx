"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
} from "@/components/ui/dialog";
import { Plus, Pencil, Trash2 } from "lucide-react";
import type { Sponsor } from "@/types";
import {
  createSponsor,
  updateSponsor,
  deleteSponsor,
} from "@/lib/actions/sponsors";

interface SponsorsClientProps {
  sponsors: Sponsor[];
}

const tierColors: Record<string, string> = {
  title: "border-brand-green text-brand-green",
  gold: "border-yellow-500 text-yellow-500",
  silver: "border-gray-400 text-gray-400",
  bronze: "border-orange-600 text-orange-600",
  partner: "border-muted-foreground text-muted-foreground",
};

function SponsorForm({ sponsor, onDone }: { sponsor?: Sponsor; onDone: () => void }) {
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    const formData = new FormData(e.currentTarget);
    const result = sponsor
      ? await updateSponsor(sponsor.id, formData)
      : await createSponsor(formData);
    setLoading(false);
    if ("error" in result) toast.error(result.error);
    else { toast.success(sponsor ? "Sponsor actualizado" : "Sponsor creado"); onDone(); }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label>Nombre</Label>
        <Input name="name" defaultValue={sponsor?.name} required />
      </div>
      <div className="space-y-2">
        <Label>Logo URL</Label>
        <Input name="logo_url" defaultValue={sponsor?.logo_url} required placeholder="/images/sponsors/logo.svg" />
      </div>
      <div className="space-y-2">
        <Label>Web</Label>
        <Input name="website_url" defaultValue={sponsor?.website_url || ""} placeholder="https://..." />
      </div>
      <div className="space-y-2">
        <Label>Tier</Label>
        <Select name="tier" defaultValue={sponsor?.tier || "partner"}>
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="title">Title</SelectItem>
            <SelectItem value="gold">Gold</SelectItem>
            <SelectItem value="silver">Silver</SelectItem>
            <SelectItem value="bronze">Bronze</SelectItem>
            <SelectItem value="partner">Partner</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <Button type="submit" disabled={loading} className="w-full bg-brand-green text-black hover:bg-brand-green/90">
        {loading ? "Guardando..." : sponsor ? "Actualizar" : "Crear Sponsor"}
      </Button>
    </form>
  );
}

export function SponsorsClient({ sponsors }: SponsorsClientProps) {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Sponsor | undefined>();

  async function handleDelete(id: string) {
    if (!confirm("Eliminar sponsor?")) return;
    const result = await deleteSponsor(id);
    if ("error" in result) toast.error(result.error);
    else toast.success("Sponsor eliminado");
  }

  return (
    <>
      <div className="flex justify-end mb-4">
        <Button onClick={() => { setEditing(undefined); setDialogOpen(true); }} className="bg-brand-green text-black hover:bg-brand-green/90">
          <Plus size={16} className="mr-2" /> Nuevo Sponsor
        </Button>
      </div>

      <div className="space-y-3">
        {sponsors.map((s) => (
          <div key={s.id} className="flex items-center justify-between p-4 rounded-xl bg-card border border-border">
            <div className="flex items-center gap-3">
              <h3 className="font-bold text-foreground">{s.name}</h3>
              <Badge variant="outline" className={tierColors[s.tier] || tierColors.partner}>
                {s.tier}
              </Badge>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="sm" onClick={() => { setEditing(s); setDialogOpen(true); }}>
                <Pencil size={16} />
              </Button>
              <Button variant="ghost" size="sm" onClick={() => handleDelete(s.id)}>
                <Trash2 size={16} className="text-destructive" />
              </Button>
            </div>
          </div>
        ))}
        {sponsors.length === 0 && <p className="text-center text-muted-foreground py-8">No hay sponsors.</p>}
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>{editing ? "Editar Sponsor" : "Nuevo Sponsor"}</DialogTitle></DialogHeader>
          <SponsorForm sponsor={editing} onDone={() => setDialogOpen(false)} />
        </DialogContent>
      </Dialog>
    </>
  );
}
