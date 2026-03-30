import "server-only";

import {
  syncProfileEditionLinks,
  upsertStaffEditionParticipation,
  upsertVolunteerEditionParticipation,
} from "@/lib/editions";
import { createAdminClient } from "@/lib/supabase/admin";
import type { RegistrationMemberGender, UserRole } from "@/types";

type AdminClient = ReturnType<typeof createAdminClient>;

interface PersonInput {
  fullName: string;
  email?: string | null;
  gender?: RegistrationMemberGender | null;
  shirtSize?: string | null;
  dietaryRestrictions?: string | null;
  notes?: string | null;
}

interface ProfileRow {
  id: string;
  person_id: string | null;
  role: UserRole;
  full_name: string;
  email: string;
  is_active: boolean;
  is_judge: boolean;
  can_validate_scores: boolean;
  invited_at: string | null;
  setup_completed_at: string | null;
}

interface PersonRow {
  id: string;
  first_name: string;
  last_name: string | null;
  full_name: string;
  primary_email: string | null;
  gender: RegistrationMemberGender | null;
  shirt_size: string | null;
  dietary_restrictions: string | null;
  notes: string | null;
}

export function normalizeEmail(email: string | null | undefined): string | null {
  const normalized = email?.trim().toLowerCase();
  return normalized ? normalized : null;
}

export function splitFullName(fullName: string) {
  const normalized = fullName.trim().replace(/\s+/g, " ");
  const [firstName = "", ...rest] = normalized.split(" ");
  return {
    fullName: normalized,
    firstName: firstName || normalized,
    lastName: rest.join(" ").trim() || null,
  };
}

export function generateTeamSlug(name: string): string {
  return name
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

export async function getProfileByEmail(
  adminClient: AdminClient,
  email: string | null | undefined,
) {
  const normalizedEmail = normalizeEmail(email);

  if (!normalizedEmail) {
    return null;
  }

  const { data } = await adminClient
    .from("profiles")
    .select(
      "id, person_id, role, full_name, email, is_active, is_judge, can_validate_scores, invited_at, setup_completed_at",
    )
    .eq("email", normalizedEmail)
    .maybeSingle();

  return (data as ProfileRow | null) ?? null;
}

export async function getProfileByPersonId(
  adminClient: AdminClient,
  personId: string | null | undefined,
) {
  const normalizedPersonId = personId?.trim();

  if (!normalizedPersonId) {
    return null;
  }

  const { data } = await adminClient
    .from("profiles")
    .select(
      "id, person_id, role, full_name, email, is_active, is_judge, can_validate_scores, invited_at, setup_completed_at",
    )
    .eq("person_id", normalizedPersonId)
    .maybeSingle();

  return (data as ProfileRow | null) ?? null;
}

export async function getPersonByEmail(
  adminClient: AdminClient,
  email: string | null | undefined,
) {
  const normalizedEmail = normalizeEmail(email);

  if (!normalizedEmail) {
    return null;
  }

  const { data } = await adminClient
    .from("people")
    .select(
      "id, first_name, last_name, full_name, primary_email, gender, shirt_size, dietary_restrictions, notes",
    )
    .eq("primary_email", normalizedEmail)
    .maybeSingle();

  return (data as PersonRow | null) ?? null;
}

function buildPersonPatch(current: PersonRow | null, input: PersonInput) {
  const nameParts = splitFullName(input.fullName);
  const patch: Record<string, string | RegistrationMemberGender | null> = {};
  const normalizedEmail = normalizeEmail(input.email);
  const notes = input.notes?.trim() || null;
  const dietaryRestrictions = input.dietaryRestrictions?.trim() || null;
  const shirtSize = input.shirtSize?.trim() || null;

  if (!current) {
    return {
      first_name: nameParts.firstName,
      last_name: nameParts.lastName,
      full_name: nameParts.fullName,
      primary_email: normalizedEmail,
      gender: input.gender ?? null,
      shirt_size: shirtSize,
      dietary_restrictions: dietaryRestrictions,
      notes,
    };
  }

  if (!current.first_name && nameParts.firstName) {
    patch.first_name = nameParts.firstName;
  }
  if (!current.last_name && nameParts.lastName) {
    patch.last_name = nameParts.lastName;
  }
  if (!current.full_name && nameParts.fullName) {
    patch.full_name = nameParts.fullName;
  }
  if (!current.primary_email && normalizedEmail) {
    patch.primary_email = normalizedEmail;
  }
  if (!current.gender && input.gender) {
    patch.gender = input.gender;
  }
  if (!current.shirt_size && shirtSize) {
    patch.shirt_size = shirtSize;
  }
  if (!current.dietary_restrictions && dietaryRestrictions) {
    patch.dietary_restrictions = dietaryRestrictions;
  }
  if (!current.notes && notes) {
    patch.notes = notes;
  }

  return patch;
}

export async function findOrCreatePerson(
  adminClient: AdminClient,
  input: PersonInput & {
    preferredPersonId?: string | null;
  },
) {
  let person: PersonRow | null = null;

  if (input.preferredPersonId) {
    const { data } = await adminClient
      .from("people")
      .select(
        "id, first_name, last_name, full_name, primary_email, gender, shirt_size, dietary_restrictions, notes",
      )
      .eq("id", input.preferredPersonId)
      .maybeSingle();
    person = (data as PersonRow | null) ?? null;
  }

  if (!person) {
    person = await getPersonByEmail(adminClient, input.email);
  }

  if (person) {
    const patch = buildPersonPatch(person, input);
    if (Object.keys(patch).length > 0) {
      const { data, error } = await adminClient
        .from("people")
        .update({
          ...patch,
          updated_at: new Date().toISOString(),
        })
        .eq("id", person.id)
        .select(
          "id, first_name, last_name, full_name, primary_email, gender, shirt_size, dietary_restrictions, notes",
        )
        .single();

      if (error) {
        throw new Error(error.message);
      }

      return data as PersonRow;
    }

    return person;
  }

  const { data, error } = await adminClient
    .from("people")
    .insert(buildPersonPatch(null, input))
    .select(
      "id, first_name, last_name, full_name, primary_email, gender, shirt_size, dietary_restrictions, notes",
    )
    .single();

  if (error || !data) {
    throw new Error(error?.message ?? "No se pudo crear la persona");
  }

  return data as PersonRow;
}

function resolveProfileRole(
  currentRole: UserRole | null | undefined,
  requestedRole: UserRole,
): UserRole {
  if (currentRole === "superadmin" || currentRole === "admin") {
    return currentRole;
  }

  if (currentRole === "volunteer" || requestedRole === "volunteer") {
    return "volunteer";
  }

  return requestedRole;
}

export async function ensureProfileForPerson(params: {
  adminClient: AdminClient;
  personId: string;
  email: string;
  fullName: string;
  requestedRole: UserRole;
  isJudge?: boolean;
  canValidateScores?: boolean;
  isActive?: boolean;
}) {
  const {
    adminClient,
    personId,
    email,
    fullName,
    requestedRole,
    isJudge = false,
    canValidateScores = false,
    isActive = true,
  } = params;

  const normalizedEmail = normalizeEmail(email);
  if (!normalizedEmail) {
    throw new Error("La persona necesita un email para crear o reutilizar una cuenta");
  }

  const [existingProfileByEmail, existingProfileByPerson] = await Promise.all([
    getProfileByEmail(adminClient, normalizedEmail),
    getProfileByPersonId(adminClient, personId),
  ]);

  if (
    existingProfileByEmail &&
    existingProfileByPerson &&
    existingProfileByEmail.id !== existingProfileByPerson.id
  ) {
    throw new Error(
      `El email ${normalizedEmail} ya pertenece a otra cuenta y la persona ya tiene un perfil distinto enlazado`,
    );
  }

  if (
    existingProfileByPerson &&
    normalizeEmail(existingProfileByPerson.email) !== normalizedEmail
  ) {
    throw new Error(
      `La persona ya tiene una cuenta vinculada a ${existingProfileByPerson.email}`,
    );
  }

  const existingProfile = existingProfileByEmail ?? existingProfileByPerson;
  const role = resolveProfileRole(existingProfile?.role, requestedRole);

  if (existingProfile) {
    const profileId = existingProfile.id;
    const effectivePersonId = existingProfile.person_id ?? personId;
    const { error } = await adminClient
      .from("profiles")
      .update({
        person_id: effectivePersonId,
        full_name: fullName.trim(),
        email: normalizedEmail,
        role,
        is_active: isActive,
        is_judge: role === "volunteer" ? isJudge : false,
        can_validate_scores: role === "admin" ? canValidateScores : false,
        updated_at: new Date().toISOString(),
      })
      .eq("id", existingProfile.id);

    if (error) {
      throw new Error(error.message);
    }

    await syncProfileEditionLinks({
      adminClient,
      personId: effectivePersonId,
      profileId,
      invitedAt: existingProfile.invited_at,
      activatedAt: existingProfile.setup_completed_at,
    });

    if (role === "volunteer") {
      await upsertVolunteerEditionParticipation({
        adminClient,
        personId: effectivePersonId,
        profileId,
        invitedAt: existingProfile.invited_at,
        activatedAt: existingProfile.setup_completed_at,
      });
    }

    if (role === "admin" || role === "superadmin") {
      await upsertStaffEditionParticipation({
        adminClient,
        personId: effectivePersonId,
        profileId,
        invitedAt: existingProfile.invited_at,
        activatedAt: existingProfile.setup_completed_at,
      });
    }

    return {
      profileId,
      personId: effectivePersonId,
      invited: false,
      role,
    };
  }

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL?.trim().replace(/\/$/, "");
  if (!siteUrl) {
    throw new Error("Falta configurar NEXT_PUBLIC_SITE_URL para las invitaciones");
  }

  const redirectTo = `${siteUrl}/auth/callback?next=${encodeURIComponent("/auth/setup")}`;
  const { data, error } = await adminClient.auth.admin.inviteUserByEmail(
    normalizedEmail,
    {
      data: {
        full_name: fullName.trim(),
        role,
      },
      redirectTo,
    },
  );

  if (error) {
    throw new Error(error.message);
  }

  const userId = data.user?.id;
  if (!userId) {
    throw new Error("No se pudo crear la invitacion en Supabase");
  }

  const { error: profileError } = await adminClient
    .from("profiles")
    .update({
      person_id: personId,
      full_name: fullName.trim(),
      email: normalizedEmail,
      role,
      is_active: isActive,
      is_judge: role === "volunteer" ? isJudge : false,
      can_validate_scores: role === "admin" ? canValidateScores : false,
      invited_at: new Date().toISOString(),
      setup_completed_at: null,
      updated_at: new Date().toISOString(),
    })
    .eq("id", userId);

  if (profileError) {
    throw new Error(profileError.message);
  }

  await syncProfileEditionLinks({
    adminClient,
    personId,
    profileId: userId,
    invitedAt: new Date().toISOString(),
  });

  if (role === "volunteer") {
    await upsertVolunteerEditionParticipation({
      adminClient,
      personId,
      profileId: userId,
      invitedAt: new Date().toISOString(),
    });
  }

  if (role === "admin" || role === "superadmin") {
    await upsertStaffEditionParticipation({
      adminClient,
      personId,
      profileId: userId,
      invitedAt: new Date().toISOString(),
    });
  }

  return {
    profileId: userId,
    personId,
    invited: true,
    role,
  };
}

export async function createUniqueTeamSlug(params: {
  adminClient: AdminClient;
  categoryId: string;
  editionId?: string | null;
  teamName: string;
}) {
  const { adminClient, categoryId, editionId, teamName } = params;
  const baseSlug = generateTeamSlug(teamName);
  let candidate = baseSlug;
  let suffix = 2;

  while (true) {
    let query = adminClient
      .from("teams")
      .select("id")
      .eq("category_id", categoryId)
      .eq("slug", candidate);

    query =
      editionId === null
        ? query.is("edition_id", null)
        : editionId
          ? query.eq("edition_id", editionId)
          : query;

    const { data } = await query.maybeSingle();

    if (!data) {
      return candidate;
    }

    candidate = `${baseSlug}-${suffix}`;
    suffix += 1;
  }
}
