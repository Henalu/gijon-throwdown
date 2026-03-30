import type { Metadata } from "next";
import { LegalPageShell } from "@/components/shared/legal-page-shell";
import { requireLegalDocumentByHref } from "@/lib/legal-content";

const document = requireLegalDocumentByHref("/bases-legales");

export const metadata: Metadata = {
  title: document.title,
  description: document.description,
};

export default function LegalTermsPage() {
  return <LegalPageShell document={document} currentHref="/bases-legales" />;
}
