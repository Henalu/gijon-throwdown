"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { ArrowRight, BookOpen, CheckCircle2, Clock, Lock, Radio, ShieldCheck } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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

function formatScheduledAt(value: string | null) {
  if (!value) return "Sin hora";

  return new Intl.DateTimeFormat("es-ES", {
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

function canOpenHeat(heat: VolunteerHeatCard) {
  return heat.status === "active" || heat.is_live_entry_enabled;
}

function getLockedHeatLabel(heat: VolunteerHeatCard) {
  if (heat.status === "finished") return "Finalizado";
  if (heat.status === "pending") return "Pendiente";
  return "Sin live";
}

function SectionHeader({
  title,
  description,
}: {
  title: string;
  description?: string;
}) {
  return (
    <div className="min-w-0 space-y-1">
      <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
        {title}
      </h2>
      {description ? (
        <p className="break-words text-sm text-muted-foreground [overflow-wrap:anywhere]">
          {description}
        </p>
      ) : null}
    </div>
  );
}

function HeatCard({
  heat,
  href,
  locked = false,
  lockedLabel = "Sin live",
}: {
  heat: VolunteerHeatCard;
  href?: string;
  locked?: boolean;
  lockedLabel?: string;
}) {
  const config = statusConfig[heat.status] ?? statusConfig.pending;
  const Icon = locked ? Lock : config.icon;
  const containerClassName = locked
    ? "flex items-center justify-between rounded-[1.4rem] border border-border/60 bg-card/70 p-4"
    : "block rounded-[1.4rem] border border-border bg-card p-4 transition-colors hover:border-brand-green/40 active:scale-[0.98]";

  const content = (
    <div className="flex items-start justify-between gap-3">
      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-2">
          <p className="break-words font-bold text-foreground [overflow-wrap:anywhere]">
            {heat.workout?.name} - Heat {heat.heat_number}
          </p>
          <span className="text-[0.68rem] uppercase tracking-[0.2em] text-muted-foreground">
            {formatScheduledAt(heat.scheduled_at)}
          </span>
        </div>
        <p className="mt-1 break-words text-xs text-muted-foreground [overflow-wrap:anywhere]">
          {heat.category?.name}
          {heat.assignment?.notes ? ` | ${heat.assignment.notes}` : ""}
        </p>
        {heat.team_names.length > 0 && (
          <p className="mt-2 break-words text-xs text-muted-foreground [overflow-wrap:anywhere]">
            {heat.team_names.join(" | ")}
          </p>
        )}
      </div>
      <Badge
        className={
          locked
            ? "border-border/60 text-xs text-muted-foreground"
            : config.className
        }
      >
        <Icon size={12} className="mr-1" />
        {locked ? lockedLabel : config.label}
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

function JudgeWorkoutCard({
  workout,
}: {
  workout: {
    slug: string | null;
    name: string;
    heatCount: number;
    categories: string[];
  };
}) {
  const categoriesLabel = workout.categories.slice(0, 2).join(" | ");
  const content = (
    <div className="rounded-[1.4rem] border border-border bg-card p-4 transition-colors hover:border-brand-cyan/40">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="break-words text-sm font-bold text-foreground [overflow-wrap:anywhere]">
            {workout.name}
          </p>
          <p className="mt-1 break-words text-xs text-muted-foreground [overflow-wrap:anywhere]">
            {workout.heatCount} heat{workout.heatCount === 1 ? "" : "s"} asignado
            {workout.heatCount === 1 ? "" : "s"}
          </p>
          {categoriesLabel ? (
            <p className="mt-2 break-words text-xs text-muted-foreground [overflow-wrap:anywhere]">
              {categoriesLabel}
            </p>
          ) : null}
        </div>
        <BookOpen size={18} className="text-brand-cyan" />
      </div>
      <div className="mt-4 inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-brand-cyan">
        Ver standards
        <ArrowRight size={14} />
      </div>
    </div>
  );

  if (!workout.slug) {
    return <div className="opacity-60">{content}</div>;
  }

  return <Link href={`/wods/${workout.slug}`}>{content}</Link>;
}

function EmptyState({ message }: { message: string }) {
  return (
    <div className="rounded-2xl border border-dashed border-border/60 px-4 py-10 text-center">
      <Clock className="mx-auto mb-4 text-muted-foreground" size={36} />
      <p className="text-sm text-muted-foreground">{message}</p>
    </div>
  );
}

export function VolunteerDashboardClient({
  assigned,
  available,
  unavailable,
  isJudge = false,
}: {
  assigned: VolunteerHeatCard[];
  available: VolunteerHeatCard[];
  unavailable: VolunteerHeatCard[];
  isJudge?: boolean;
}) {
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");

  const allCards = useMemo(
    () => [...assigned, ...available, ...unavailable],
    [assigned, available, unavailable],
  );

  const categoryOptions = useMemo(
    () =>
      Array.from(
        new Set(allCards.map((heat) => heat.category?.name).filter(Boolean)),
      ) as string[],
    [allCards],
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

  const judgeAssignedOpen = filteredAssigned.filter((heat) => heat.status !== "finished");
  const judgeAssignedFinished = filteredAssigned.filter(
    (heat) => heat.status === "finished",
  );
  const judgeActiveGlobal = [...filteredAvailable, ...filteredUnavailable];
  const workoutMap = new Map<
    string,
    { slug: string | null; name: string; heatCount: number; categories: Set<string> }
  >();

  for (const heat of filteredAssigned) {
    if (!heat.workout?.name) continue;
    const key = `${heat.workout.slug ?? "no-slug"}:${heat.workout.name}`;
    const current = workoutMap.get(key) ?? {
      slug: heat.workout.slug ?? null,
      name: heat.workout.name,
      heatCount: 0,
      categories: new Set<string>(),
    };

    current.heatCount += 1;
    if (heat.category?.name) {
      current.categories.add(heat.category.name);
    }

    workoutMap.set(key, current);
  }

  const judgeWorkoutLinks = Array.from(workoutMap.values()).map((workout) => ({
    slug: workout.slug,
    name: workout.name,
    heatCount: workout.heatCount,
    categories: Array.from(workout.categories),
  }));

  const totalVisible = isJudge
    ? judgeAssignedOpen.length +
      judgeActiveGlobal.length +
      judgeAssignedFinished.length
    : filteredAssigned.length + filteredAvailable.length + filteredUnavailable.length;

  return (
    <div className="min-w-0 space-y-6">
      <div className="space-y-2">
        <h1 className="break-words text-2xl font-bold [overflow-wrap:anywhere]">
          {isJudge ? "Panel juez" : "Mis Heats"}
        </h1>
        <p className="break-words text-sm text-muted-foreground [overflow-wrap:anywhere]">
          {isJudge
            ? "Vista operativa para seguir tus asignaciones, el estado live del evento y los WODs que arbitras."
            : "Busca por categoria, heat, WOD o equipo y entra solo donde te toca operar."}
        </p>
      </div>

      {isJudge ? (
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <div className="rounded-[1.6rem] border border-white/10 bg-white/[0.03] p-4">
            <p className="text-[0.7rem] uppercase tracking-[0.22em] text-muted-foreground">
              Asignados
            </p>
            <p className="mt-3 text-3xl font-semibold text-white">
              {judgeAssignedOpen.length}
            </p>
          </div>
          <div className="rounded-[1.6rem] border border-white/10 bg-white/[0.03] p-4">
            <p className="text-[0.7rem] uppercase tracking-[0.22em] text-muted-foreground">
              Activos evento
            </p>
            <p className="mt-3 text-3xl font-semibold text-white">
              {judgeActiveGlobal.length}
            </p>
          </div>
          <div className="rounded-[1.6rem] border border-white/10 bg-white/[0.03] p-4">
            <p className="text-[0.7rem] uppercase tracking-[0.22em] text-muted-foreground">
              Finalizados
            </p>
            <p className="mt-3 text-3xl font-semibold text-white">
              {judgeAssignedFinished.length}
            </p>
          </div>
          <div className="rounded-[1.6rem] border border-white/10 bg-white/[0.03] p-4">
            <p className="text-[0.7rem] uppercase tracking-[0.22em] text-muted-foreground">
              WODs referencia
            </p>
            <p className="mt-3 text-3xl font-semibold text-white">
              {judgeWorkoutLinks.length}
            </p>
          </div>
        </div>
      ) : null}

      <div className="grid gap-3 md:grid-cols-[minmax(0,1fr)_15rem_auto] md:items-center">
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
        <p className="break-words text-sm text-muted-foreground [overflow-wrap:anywhere] md:text-right">
          {totalVisible} heats visibles
        </p>
      </div>

      {isJudge ? (
        <div className="space-y-6">
          <section className="space-y-3">
            <SectionHeader
              title="Heats asignados"
              description="Tus heats operativos o pendientes de arbitraje."
            />
            {judgeAssignedOpen.length > 0 ? (
              judgeAssignedOpen.map((heat) => (
                <HeatCard
                  key={`judge-assigned-${heat.id}`}
                  heat={heat}
                  href={canOpenHeat(heat) ? `/voluntario/heat/${heat.id}` : undefined}
                  locked={!canOpenHeat(heat)}
                  lockedLabel={getLockedHeatLabel(heat)}
                />
              ))
            ) : (
              <EmptyState message="No tienes heats asignados que coincidan con este filtro." />
            )}
          </section>

          <section className="space-y-3">
            <SectionHeader
              title="Heats activos del evento"
              description="Contexto live global fuera de tus asignaciones directas."
            />
            {judgeActiveGlobal.length > 0 ? (
              judgeActiveGlobal.map((heat) => (
                <HeatCard
                  key={`judge-active-${heat.id}`}
                  heat={heat}
                  href={heat.is_live_entry_enabled ? `/voluntario/heat/${heat.id}` : undefined}
                  locked={!heat.is_live_entry_enabled}
                  lockedLabel="Sin live"
                />
              ))
            ) : (
              <EmptyState message="Ahora mismo no hay otros heats activos del evento para este filtro." />
            )}
          </section>

          <section className="space-y-3">
            <SectionHeader
              title="WODs de mis asignaciones"
              description="Atajos rapidos a standards y detalle del WOD."
            />
            {judgeWorkoutLinks.length > 0 ? (
              <div className="grid gap-3 lg:grid-cols-2">
                {judgeWorkoutLinks.map((workout) => (
                  <JudgeWorkoutCard
                    key={`${workout.slug ?? "no-slug"}:${workout.name}`}
                    workout={workout}
                  />
                ))}
              </div>
            ) : (
              <EmptyState message="No hay WODs asociados a tus asignaciones con este filtro." />
            )}
          </section>

          <section className="space-y-3">
            <SectionHeader
              title="Heats finalizados"
              description="Tus heats ya cerrados o completados, utiles para seguimiento y revision."
            />
            {judgeAssignedFinished.length > 0 ? (
              judgeAssignedFinished.map((heat) => (
                <HeatCard
                  key={`judge-finished-${heat.id}`}
                  heat={heat}
                  locked
                  lockedLabel="Finalizado"
                />
              ))
            ) : (
              <EmptyState message="No hay heats finalizados de tus asignaciones con este filtro." />
            )}
          </section>
        </div>
      ) : (
        <div className="space-y-6">
          {filteredAssigned.length > 0 && (
            <section className="space-y-3">
              <SectionHeader title="Asignados" />
              {filteredAssigned.map((heat) => (
                <HeatCard
                  key={`assigned-${heat.id}`}
                  heat={heat}
                  href={canOpenHeat(heat) ? `/voluntario/heat/${heat.id}` : undefined}
                  locked={!canOpenHeat(heat)}
                  lockedLabel={getLockedHeatLabel(heat)}
                />
              ))}
            </section>
          )}

          {filteredAvailable.length > 0 && (
            <section className="space-y-3">
              <SectionHeader title="Disponibles para live" />
              {filteredAvailable.map((heat) => (
                <HeatCard
                  key={`available-${heat.id}`}
                  heat={heat}
                  href={`/voluntario/heat/${heat.id}`}
                />
              ))}
            </section>
          )}

          {filteredUnavailable.length > 0 && (
            <section className="space-y-3">
              <SectionHeader title="No disponibles" />
              {filteredUnavailable.map((heat) => (
                <HeatCard
                  key={`unavailable-${heat.id}`}
                  heat={heat}
                  locked
                  lockedLabel="Sin live"
                />
              ))}
            </section>
          )}

          {totalVisible === 0 && (
            <div className="rounded-2xl border border-dashed border-border/60 px-4 py-16 text-center">
              <ShieldCheck className="mx-auto mb-4 text-muted-foreground" size={44} />
              <p className="text-muted-foreground">
                No hay heats que coincidan con este filtro.
              </p>
              <p className="mt-2 text-xs text-muted-foreground">
                Prueba otra categoria o limpia la busqueda.
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
