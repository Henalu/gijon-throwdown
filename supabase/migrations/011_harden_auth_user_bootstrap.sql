-- ============================================================
-- 011_harden_auth_user_bootstrap.sql
-- Harden auth.users bootstrap and auto-link/create canonical people
-- ============================================================

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  resolved_full_name TEXT;
  resolved_first_name TEXT;
  resolved_last_name TEXT;
  resolved_role public.user_role := 'athlete';
  requested_role_text TEXT;
  requested_person_id_text TEXT;
  requested_person_id UUID;
  resolved_person_id UUID;
BEGIN
  resolved_full_name := COALESCE(
    NULLIF(btrim(NEW.raw_user_meta_data->>'full_name'), ''),
    NULLIF(btrim(NEW.email), ''),
    'Usuario sin nombre'
  );

  requested_role_text := NULLIF(btrim(NEW.raw_user_meta_data->>'role'), '');
  IF requested_role_text IN ('superadmin', 'admin', 'volunteer', 'athlete') THEN
    resolved_role := requested_role_text::public.user_role;
  END IF;

  requested_person_id_text := NULLIF(
    btrim(NEW.raw_user_meta_data->>'person_id'),
    ''
  );

  IF requested_person_id_text ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$' THEN
    requested_person_id := requested_person_id_text::UUID;
  END IF;

  IF requested_person_id IS NOT NULL THEN
    SELECT people.id
    INTO resolved_person_id
    FROM public.people AS people
    WHERE people.id = requested_person_id
      AND NOT EXISTS (
        SELECT 1
        FROM public.profiles AS profiles_table
        WHERE profiles_table.person_id = people.id
          AND profiles_table.id <> NEW.id
      )
    LIMIT 1;
  END IF;

  IF resolved_person_id IS NULL AND NEW.email IS NOT NULL THEN
    SELECT people.id
    INTO resolved_person_id
    FROM public.people AS people
    WHERE people.primary_email IS NOT NULL
      AND lower(people.primary_email) = lower(NEW.email)
      AND NOT EXISTS (
        SELECT 1
        FROM public.profiles AS profiles_table
        WHERE profiles_table.person_id = people.id
          AND profiles_table.id <> NEW.id
      )
    ORDER BY people.created_at
    LIMIT 1;
  END IF;

  IF resolved_person_id IS NULL THEN
    resolved_first_name := COALESCE(
      NULLIF(split_part(resolved_full_name, ' ', 1), ''),
      resolved_full_name
    );
    resolved_last_name := NULLIF(
      btrim(
        substring(
          resolved_full_name
          FROM char_length(split_part(resolved_full_name, ' ', 1)) + 1
        )
      ),
      ''
    );

    BEGIN
      INSERT INTO public.people (
        first_name,
        last_name,
        full_name,
        primary_email,
        notes
      )
      VALUES (
        resolved_first_name,
        resolved_last_name,
        resolved_full_name,
        NEW.email,
        'Persona creada automaticamente desde auth.users'
      )
      RETURNING id INTO resolved_person_id;
    EXCEPTION
      WHEN unique_violation THEN
        IF NEW.email IS NOT NULL THEN
          SELECT people.id
          INTO resolved_person_id
          FROM public.people AS people
          WHERE people.primary_email IS NOT NULL
            AND lower(people.primary_email) = lower(NEW.email)
          ORDER BY people.created_at
          LIMIT 1;
        END IF;
    END;
  END IF;

  INSERT INTO public.profiles (
    id,
    email,
    full_name,
    role,
    invited_at,
    person_id
  )
  VALUES (
    NEW.id,
    NEW.email,
    resolved_full_name,
    resolved_role,
    now(),
    resolved_person_id
  );

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;
