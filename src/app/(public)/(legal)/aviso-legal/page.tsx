import type { Metadata } from "next";
import { LegalPageShell } from "@/components/shared/legal-page-shell";
import { requireLegalDocumentByHref } from "@/lib/legal-content";

const document = requireLegalDocumentByHref("/aviso-legal");

export const metadata: Metadata = {
  title: document.title,
  description: document.description,
};

export default function LegalNoticePage() {
  return <LegalPageShell document={document} currentHref="/aviso-legal" />;
}
