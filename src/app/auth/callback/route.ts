import { NextResponse } from "next/server";
import type { EmailOtpType } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";
import { sanitizeRedirect } from "@/lib/auth/permissions";

const emailOtpTypes: EmailOtpType[] = [
  "signup",
  "invite",
  "magiclink",
  "recovery",
  "email_change",
  "email",
];

function isEmailOtpType(value: string | null): value is EmailOtpType {
  return value !== null && emailOtpTypes.includes(value as EmailOtpType);
}

function getDefaultNext(type: EmailOtpType | null) {
  if (type === "invite") {
    return "/auth/setup";
  }

  if (type === "recovery") {
    return "/auth/reset-password";
  }

  return "/";
}

function resolveNextTarget(
  searchParams: URLSearchParams,
  origin: string,
  fallback: string,
) {
  const next = searchParams.get("next");
  if (next) {
    return sanitizeRedirect(next, fallback);
  }

  const redirectTo = searchParams.get("redirect_to");
  if (!redirectTo) {
    return fallback;
  }

  try {
    const redirectUrl = new URL(redirectTo);
    if (redirectUrl.origin !== origin) {
      return fallback;
    }

    const resolvedPath = `${redirectUrl.pathname}${redirectUrl.search}`;
    return sanitizeRedirect(resolvedPath, fallback);
  } catch {
    return sanitizeRedirect(redirectTo, fallback);
  }
}

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const tokenHash = searchParams.get("token_hash");
  const rawType = searchParams.get("type");
  const type = isEmailOtpType(rawType) ? rawType : null;
  const fallbackNext = getDefaultNext(type);
  const next = resolveNextTarget(searchParams, origin, fallbackNext);
  const supabase = await createClient();

  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      return NextResponse.redirect(`${origin}${next}`);
    }
  }

  if (tokenHash && type) {
    const { error } = await supabase.auth.verifyOtp({
      token_hash: tokenHash,
      type,
    });

    if (!error) {
      return NextResponse.redirect(`${origin}${next}`);
    }
  }

  const errorCode =
    type === "recovery"
      ? "recovery_failed"
      : type === "invite"
        ? "invite_failed"
        : "auth_failed";

  return NextResponse.redirect(`${origin}/auth/login?error=${errorCode}`);
}
