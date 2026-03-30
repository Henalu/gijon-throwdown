import { Suspense } from "react";
import { SetupPageClient } from "./setup-page-client";

export default function AuthSetupPage() {
  return (
    <Suspense>
      <SetupPageClient />
    </Suspense>
  );
}
