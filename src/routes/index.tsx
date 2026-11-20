import { createFileRoute, Link } from "@tanstack/react-router";
import { Bell, PieChart, Target } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/app/AppShell";
import hero from "@/assets/hero-alcancia.jpg";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Alcancía — Finanzas personales para universitarios" },
      {
        name: "description",
        content: "Registra tus gastos por categoría, ahorra para tus metas y recibe recordatorios de pago. Gratis para estudiantes.",
      },
      { property: "og:title", content: "Alcancía — Finanzas personales para universitarios" },
      {
        property: "og:description",
        content: "Registra tus gastos por categoría, ahorra para tus metas y recibe recordatorios de pago.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Index,
});

const FEATURES = [
  { icon: PieChart, title: "Gastos por categoría", text: "Mira en un gráfico a dónde se va tu plata: comida, pasajes, fotocopias…" },
  { icon: Target, title: "Metas de ahorro", text: "La laptop, el viaje de fin de ciclo o tu fondo de emergencia, paso a paso." },
  { icon: Bell, title: "Recordatorios de pago", text: "La pensión, el cuarto y el celular, avisados antes de que venzan." },
];

function Index() {
  return (
    <div className="flex min-h-screen flex-col bg-background">
      <div className="bg-hero text-primary-foreground">
      <header className="mx-auto flex max-w-6xl items-center justify-between px-5 py-5">
        <Logo />
        <Button asChild variant="ghost" className="text-primary-foreground hover:bg-primary-foreground/10 hover:text-primary-foreground">
          <Link to="/auth">Iniciar sesión</Link>
        </Button>
      </header>

      <main className="mx-auto grid max-w-6xl items-center gap-10 px-5 pt-6 pb-16 md:grid-cols-2 md:pt-12">
        <div className="animate-rise">
          <span className="inline-block rounded-full bg-primary-foreground/10 px-3 py-1 text-xs font-semibold uppercase tracking-widest">
            Para estudiantes universitarios
          </span>
          <h1 className="mt-5 text-5xl font-extrabold leading-[1.02] md:text-6xl">
            Ahorra más.
            <br />
            <span className="text-accent">Gasta mejor.</span>
          </h1>
          <p className="mt-5 max-w-md text-lg opacity-80">
            Alcancía te ayuda a saber cuánto tienes, en qué gastas y qué pagos se vienen — todo en soles.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Button asChild size="lg" variant="lime">
              <Link to="/auth">Empezar gratis</Link>
            </Button>
          </div>
        </div>
        <img
          src={hero}
          alt="Alcancía verde con birrete sobre cuadernos junto a un celular con un gráfico circular"
          width={1024}
          height={1024}
          className="mx-auto w-full max-w-md rounded-[2rem] shadow-lift"
        />
      </main>
      </div>

      <section className="flex-1 text-foreground">
        <div className="mx-auto grid max-w-6xl gap-5 px-5 py-16 md:grid-cols-3">
          {FEATURES.map((f) => (
            <div key={f.title} className="rounded-3xl border border-border bg-card p-6 shadow-soft">
              <span className="grid size-12 place-items-center rounded-2xl bg-lime text-accent-foreground">
                <f.icon className="size-6" />
              </span>
              <h2 className="mt-4 text-xl font-bold">{f.title}</h2>
              <p className="mt-2 text-muted-foreground">{f.text}</p>
            </div>
          ))}
        </div>
      </section>
      <footer className="border-t border-border py-6 text-center text-sm text-muted-foreground">
        Alcancía · Finanzas personales para universitarios
      </footer>
    </div>
  );
}
