import { createClient } from "@/lib/supabase/server";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "FAQ",
  description: "Preguntas frecuentes sobre Gijon Throwdown, inscripciones y funcionamiento del evento",
};

export default async function FaqPage() {
  const supabase = await createClient();

  const { data: event } = await supabase
    .from("event_config")
    .select("faq")
    .single();

  const faqItems = (event?.faq || []) as { question: string; answer: string }[];

  return (
    <div className="min-h-screen">
      <section className="relative py-12 sm:py-20 px-4 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-[#061a12] to-background" />
        <div className="relative z-10 max-w-4xl mx-auto">
          <h1 className="text-3xl sm:text-5xl md:text-7xl font-black uppercase tracking-tighter text-foreground">
            FAQ
          </h1>
          <p className="text-muted-foreground text-lg mt-4">
            Toda la informacion util para atletas, equipos, publico y colaboradores.
          </p>
        </div>
      </section>

      <section className="px-4 pb-20">
        <div className="max-w-4xl mx-auto">
          {faqItems.length > 0 ? (
            <Accordion className="space-y-3">
              {faqItems.map((item, index) => (
                <AccordionItem
                  key={index}
                  value={`item-${index}`}
                  className="border border-border rounded-xl px-6 data-[state=open]:border-brand-green/30 transition-colors"
                >
                  <AccordionTrigger className="text-left text-foreground font-semibold hover:no-underline">
                    {item.question}
                  </AccordionTrigger>
                  <AccordionContent className="text-muted-foreground">
                    {item.answer}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          ) : (
            <p className="text-center text-muted-foreground py-20">
              Las preguntas frecuentes se publicaran muy pronto.
            </p>
          )}
        </div>
      </section>
    </div>
  );
}
