"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { CheckCircle2, Clock, Lock, Radio } from "lucide-react";
import type { VolunteerHeatCard } from "@/lib/auth/live-access";

const statusConfig: Record<
  string,
  { label: string; className: string; icon: typeof Radio }
> = {
  active: {
    label: "EN VIVO",
    className: "bg-red-500/20 text-red-400 border-red-500/30 animate-pulse-live",
    icon: Radio,
  },
  pending: {
    label: "Pendiente",
    className: "text-muted-foreground",
    icon: Clock,
  },
  finished: {
    label: "Finalizado",
    className: "text-muted-foreground",
    icon: CheckCircle2,
  },
};

function HeatCard({
  heat,
  href,
  locked = false,
}: {
  heat: VolunteerHeatCard;
  href?: string;
  locked?: boolean;
}) {
  const config = statusConfig[heat.status] ?? statusConfig.pending;
  const Icon = locked ? Lock : config.icon;
  const containerClassName = locked
    ? "flex items-center justify-between rounded-xl border border-border/60 bg-card/70 p-4"
    : "block rounded-xl border border-border bg-card p-4 transition-colors hover:border-brand-green/40 active:scale-[0.98]";

  const content = (
    <div className="flex items-center justify-between gap-3">
      <div>
        <p className="font-bold text-foreground">
          {heat.workout?.name} - Heat {heat.heat_number}
        </p>
        <p className="mt-0.5 text-xs text-muted-foreground">
          {heat.category?.name}
          {heat.assignment?.notes ? ` | ${heat.assignment.notes}` : ""}
        </p>
        {heat.team_names.length > 0 && (
          <p className="mt-2 text-xs text-muted-foreground">
            {heat.team_names.join(" | ")}
          </p>
        )}
      </div>
      <Badge className={locked ? "text-xs text-muted-foreground" : config.className}>
        <Icon size={12} className="mr-1" />
        {locked ? "Cerrado" : config.label}
      </Badge>
    </div>
  );

  if (!href) {
    return <div className={containerClassName}>{content}</div>;
  }

  return (
    <Link href={href} className={containerClassName}>
      {content}
    </Link>
  );
}

export function VolunteerDashboardClient({
  assigned,
  available,
  unavailable,
}: {
  assigned: VolunteerHeatCard[];
  available: VolunteerHeatCard[];
  unavailable: VolunteerHeatCard[];
}) {
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");

  const categoryOptions = useMemo(
    () =>
      Array.from(
        new Set(
          [...assigned, ...available, ...unavailable]
            .map((heat) => heat.category?.name)
            .filter(Boolean),
        ),
      ) as string[],
    [assigned, available, unavailable],
  );

  function applyFilters(cards: VolunteerHeatCard[]) {
    const query = search.trim().toLowerCase();

    return cards.filter((heat) => {
      const matchesCategory =
        categoryFilter === "all" || heat.category?.name === categoryFilter;
      const haystack = [
        heat.category?.name,
        heat.workout?.name,
        `heat ${heat.heat_number}`,
        ...(heat.team_names ?? []),
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      return matchesCategory && (!query || haystack.includes(query));
    });
  }

  const filteredAssigned = applyFilters(assigned);
  const filteredAvailable = applyFilters(available);
  const filteredUnavailable = applyFilters(unavailable);
  const totalVisible =
    filteredAssigned.length + filteredAvailable.length + filteredUnavailable.length;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Mis Heats</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Busca por categoria, heat, WOD o equipo y entra solo donde te toca operar.
        </p>
      </div>

      <div className="grid gap-3 md:grid-cols-[1fr_15rem_auto] md:items-center">
        <Input
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Busca heat, WOD o equipo"
        />
        <Select
          value={categoryFilter}
          onValueChange={(value) => {
            if (value) setCategoryFilter(value);
          }}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas las categorias</SelectItem>
            {categoryOptions.map((category) => (
              <SelectItem key={category} value={category}>
                {category}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <p className="text-sm text-muted-foreground">{totalVisible} heats visibles</p>
      </div>

      {filteredAssigned.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
            Asignados
          </h2>
          {filteredAssigned.map((heat) => (
            <HeatCard key={`assigned-${heat.id}`} heat={heat} href={`/voluntario/heat/${heat.id}`} />
          ))}
        </div>
      )}

      {filteredAvailable.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
            Disponibles para live
          </h2>
          {filteredAvailable.map((heat) => (
            <HeatCard key={`available-${heat.id}`} heat={heat} href={`/voluntario/heat/${heat.id}`} />
          ))}
        </div>
      )}

      {filteredUnavailable.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
            No disponibles
          </h2>
          {filteredUnavailable.map((heat) => (
            <HeatCard key={`unavailable-${heat.id}`} heat={heat} locked />
          ))}
        </div>
      )}

      {totalVisible === 0 && (
        <div className="rounded-2xl border border-dashed border-border/60 px-4 py-16 text-center">
          <Clock className="mx-auto mb-4 text-muted-foreground" size={44} />
          <p className="text-muted-foreground">
            No hay heats que coincidan con este filtro.
          </p>
          <p className="mt-2 text-xs text-muted-foreground">
            Prueba otra categoria o limpia la busqueda.
          </p>
        </div>
      )}
    </div>
  );
}
