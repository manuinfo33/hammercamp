import { useBranding } from "@/lib/branding";
import { createFileRoute } from "@tanstack/react-router";
import { Header } from "@/components/site/Header";
import { Footer } from "@/components/site/Footer";

export const Route = createFileRoute("/nosotros")({
  component: Page,
  head: () => ({ meta: [{ title: "Nosotros — La Superliga" }] }),
});

function Page() {
  const { aboutDescription } = useBranding();
  const paragraphs = aboutDescription
    .split(/\n\s*\n/)
    .map((p) => p.trim())
    .filter(Boolean);

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      <main className="container mx-auto px-4 py-8 sm:px-6 sm:py-14 md:py-20 flex-1">
        <div className="flex items-center gap-3">
          <span className="w-1.5 h-7 bg-primary rounded-full inline-block shadow-sm" />
          <div>
            <p className="text-[11px] md:text-xs uppercase tracking-[0.3em] text-primary font-bold">
              El complejo
            </p>
            <h1 className="font-display text-3xl sm:text-4xl md:text-6xl font-bold uppercase mt-0.5 leading-none">
              Nosotros
            </h1>
          </div>
        </div>
        <div className="mt-6 sm:mt-8 max-w-3xl bg-surface rounded-2xl border border-border/70 p-5 sm:p-8 shadow-xs text-muted-foreground space-y-4 sm:space-y-5 text-sm sm:text-base leading-relaxed">
          {paragraphs.map((paragraph, idx) => (
            <p key={idx} className="whitespace-pre-line">
              {paragraph}
            </p>
          ))}
        </div>
      </main>
      <Footer />
    </div>
  );
}
