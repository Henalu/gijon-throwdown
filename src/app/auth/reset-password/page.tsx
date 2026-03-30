import { Suspense } from "react";
import { ResetPasswordPageClient } from "./reset-password-page-client";

export default function ResetPasswordPage() {
  return (
    <Suspense>
      <ResetPasswordPageClient />
    </Suspense>
  );
}
