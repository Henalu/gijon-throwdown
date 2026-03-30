import { requireSuperadminProfile } from "@/lib/auth/session";
import { UsersClient } from "./users-client";

export default async function UsuariosPage() {
  const { supabase } = await requireSuperadminProfile("/admin/usuarios");

  const { data: users } = await supabase
    .from("profiles")
    .select(
      "id, full_name, email, role, is_active, is_judge, can_validate_scores, invited_at, setup_completed_at, created_at, updated_at",
    )
    .order("created_at", { ascending: false });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Usuarios</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Gestiona accesos internos, roles operativos e invitaciones de la
          plataforma.
        </p>
      </div>

      <UsersClient users={(users ?? []) as never[]} />
    </div>
  );
}
