import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import {
  canAccessVolunteerSurfaceProfile,
  canValidateScoresProfile,
  getDefaultRouteForRole,
  isAdminLikeRole,
  isSuperadminRole,
  sanitizeRedirect,
  type AuthProfile,
} from "@/lib/auth/permissions";

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          supabaseResponse = NextResponse.next({
            request,
          });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const pathname = request.nextUrl.pathname;
  const isAdminPath = pathname.startsWith("/admin");
  const isVolunteerPath = pathname.startsWith("/voluntario");

  const redirectToLogin = (error?: string) => {
    const url = request.nextUrl.clone();
    url.pathname = "/auth/login";
    url.searchParams.set("redirect", sanitizeRedirect(pathname));

    if (error) {
      url.searchParams.set("error", error);
    }

    return NextResponse.redirect(url);
  };

  const redirectToApp = (target: string) => {
    const url = request.nextUrl.clone();
    url.pathname = target;
    url.search = "";
    return NextResponse.redirect(url);
  };

  if (isAdminPath || isVolunteerPath) {
    if (!user) {
      return redirectToLogin();
    }
  }

  let profile: AuthProfile | null = null;

  if (user && (isAdminPath || isVolunteerPath)) {
    const { data } = await supabase
      .from("profiles")
      .select(
        "id, person_id, role, full_name, email, is_active, is_judge, can_validate_scores, invited_at, setup_completed_at",
      )
      .eq("id", user.id)
      .maybeSingle();

    profile = (data as AuthProfile | null) ?? null;

    if (!profile) {
      return redirectToLogin("missing_profile");
    }

    if (!profile.is_active) {
      return redirectToLogin("inactive");
    }
  }

  if ((isAdminPath || isVolunteerPath) && profile && !profile.setup_completed_at) {
    return redirectToApp("/auth/setup");
  }

  if (isAdminPath) {
    if (!profile || !isAdminLikeRole(profile.role)) {
      return redirectToApp(getDefaultRouteForRole(profile));
    }

    if (pathname.startsWith("/admin/usuarios") && !isSuperadminRole(profile.role)) {
      return redirectToApp("/admin");
    }

    if (pathname.startsWith("/admin/validacion") && !canValidateScoresProfile(profile)) {
      return redirectToApp("/admin");
    }
  }

  if (isVolunteerPath) {
    if (!profile || !canAccessVolunteerSurfaceProfile(profile)) {
      return redirectToApp(getDefaultRouteForRole(profile));
    }
  }

  return supabaseResponse;
}
