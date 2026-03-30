import { createClient } from "@/lib/supabase/server";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { Workout, WorkoutStage } from "@/types";
import { WodsClient } from "./wods-client";
import {
  WorkoutStagesClient,
  type WorkoutStageRow,
} from "./workout-stages-client";

export default async function WodsPage() {
  const supabase = await createClient();

  const [{ data: workouts }, { data: stages }] = await Promise.all([
    supabase.from("workouts").select("*").order("sort_order", { ascending: true }),
    supabase
      .from("workout_stages")
      .select("*")
      .order("sort_order", { ascending: true }),
  ]);

  const workoutRows = (workouts ?? []) as Workout[];
  const stageRows: WorkoutStageRow[] = ((stages ?? []) as WorkoutStage[]).map(
    (stage) => ({
      ...stage,
      workoutName:
        workoutRows.find((workout) => workout.id === stage.workout_id)?.name ?? null,
    }),
  );

  return (
    <div>
      <h1 className="text-2xl font-bold">WODs</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Gestiona los workouts y sus stages operativos desde un mismo sitio.
      </p>
      <div className="mt-6">
        <Tabs
          defaultValue="wods"
          className="flex-col gap-4 md:flex-row md:items-start md:gap-6"
        >
          <TabsList
            className="grid h-auto w-full grid-cols-2 gap-1 rounded-2xl border border-border/60 bg-card/80 p-1 md:sticky md:top-6 md:flex md:w-[15rem] md:flex-col md:items-stretch md:justify-start md:gap-2 md:rounded-[1.75rem] md:p-2"
          >
            <TabsTrigger
              value="wods"
              className="min-h-11 rounded-xl px-2 py-2 text-center text-sm leading-tight whitespace-normal md:min-h-[4.5rem] md:w-full md:justify-start md:px-4 md:py-4 md:text-left md:after:hidden"
            >
              WODs
            </TabsTrigger>
            <TabsTrigger
              value="stages"
              className="min-h-11 rounded-xl px-2 py-2 text-center text-sm leading-tight whitespace-normal md:min-h-[4.5rem] md:w-full md:justify-start md:px-4 md:py-4 md:text-left md:after:hidden"
            >
              Stages
            </TabsTrigger>
          </TabsList>

          <div className="min-w-0 flex-1 space-y-4">
            <TabsContent value="wods" className="min-w-0 flex-1 space-y-4">
              <WodsClient workouts={workoutRows} />
            </TabsContent>

            <TabsContent value="stages" className="min-w-0 flex-1 space-y-4">
              <WorkoutStagesClient stages={stageRows} workouts={workoutRows} />
            </TabsContent>
          </div>
        </Tabs>
      </div>
    </div>
  );
}
