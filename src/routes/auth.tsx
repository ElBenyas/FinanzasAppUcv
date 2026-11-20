import { useEffect, useState, type FormEvent } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Logo } from "@/components/app/AppShell";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "Ingresar — Alcancía" },
      { name: "description", content: "Crea tu cuenta gratis o inicia sesión en Alcancía." },
      { property: "og:title", content: "Ingresar — Alcancía" },
      { property: "og:description", content: "Crea tu cuenta gratis o inicia sesión en Alcancía." },
    ],
  }),
  component: AuthPage,
});

function GoogleLogo() {
  return (
    <svg aria-hidden="true" width="18" height="18" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path fill="#4285F4" d="M23.49 12.27c0-.79-.07-1.54-.19-2.27H12v4.51h6.47c-.29 1.48-1.14 2.73-2.4 3.58v3h3.86c2.26-2.09 3.56-5.17 3.56-8.82z"/><path fill="#34A853" d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.86-3c-1.08.72-2.45 1.16-4.07 1.16-3.13 0-5.78-2.11-6.73-4.96H1.29v3.09C3.26 21.3 7.31 24 12 24z"/><path fill="#FBBC05" d="M5.27 14.29c-.25-.72-.38-1.49-.38-2.29s.14-1.57.38-2.29V6.62H1.29C.47 8.24 0 10.06 0 12s.47 3.76 1.29 5.38l3.98-3.09z"/><path fill="#EA4335" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.31 0 3.26 2.7 1.29 6.62l3.98 3.09c.95-2.85 3.6-4.96 6.73-4.96z"/></svg>
  );
}

function AuthPage() {
  const navigate = useNavigate();
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [checkEmail, setCheckEmail] = useState(false);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (data.user) navigate({ to: "/dashboard", replace: true });
    });
    const { data } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "SIGNED_IN" && session) navigate({ to: "/dashboard", replace: true });
    });
    return () => data.subscription.unsubscribe();
  }, [navigate]);

  async function submit(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      if (mode === "signup") {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: window.location.origin + "/dashboard",
            data: { display_name: name.trim() || undefined },
          },
        });
        if (error) throw error;
        if (!data.session) setCheckEmail(true);
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Error";
      toast.error(
        msg.includes("Invalid login")
          ? "Correo o contraseña incorrectos"
          : msg.toLowerCase().includes("weak")
            ? "Esa contraseña es muy fácil de adivinar. Prueba con otra más segura."
            : msg.includes("Email not confirmed")
              ? "Primero confirma tu correo con el enlace que te enviamos."
              : msg.includes("already registered")
                ? "Ese correo ya tiene una cuenta. Inicia sesión."
                : msg,
      );
    } finally {
      setLoading(false);
    }
  }

  async function signInWithGoogle() {
    // Supabase redirige a Google y, al volver, onAuthStateChange (useEffect) lleva a /dashboard.
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: window.location.origin + "/dashboard" },
    });
    if (error) toast.error("No se pudo iniciar sesión con Google");
  }

  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      <aside className="relative hidden flex-col justify-between overflow-hidden bg-hero p-12 text-primary-foreground lg:flex">
        <Link to="/">
          <Logo />
        </Link>
        <div>
          <h2 className="max-w-md text-5xl font-extrabold leading-[1.05]">
            Tu plata de estudiante, bajo control.
          </h2>
          <p className="mt-4 max-w-sm opacity-80">
            Registra gastos, cumple tus metas de ahorro y nunca más olvides pagar la pensión.
          </p>
        </div>
        <p className="text-sm opacity-60">Hecho para universitarios 🇵🇪</p>
      </aside>

      <main className="flex items-center justify-center px-5 py-10">
        <div className="w-full max-w-sm animate-rise">
          <Link to="/" className="mb-8 inline-block lg:hidden">
            <Logo />
          </Link>

          {checkEmail ? (
            <div className="rounded-3xl border border-border bg-card p-6 text-center shadow-soft">
              <h1 className="text-2xl font-extrabold">Revisa tu correo 📬</h1>
              <p className="mt-2 text-sm text-muted-foreground">
                Te enviamos un enlace a <strong>{email}</strong> para confirmar tu cuenta.
              </p>
              <Button variant="soft" className="mt-5" onClick={() => { setCheckEmail(false); setMode("signin"); }}>
                Volver a iniciar sesión
              </Button>
            </div>
          ) : (
            <>
              <h1 className="text-3xl font-extrabold">
                {mode === "signin" ? "¡Hola de nuevo!" : "Crea tu cuenta"}
              </h1>
              <p className="mt-1 text-muted-foreground">
                {mode === "signin" ? "Ingresa para ver tus finanzas." : "Es gratis y toma un minuto."}
              </p>

              <div className="mt-6 grid gap-2.5">
                <button
                  type="button"
                  onClick={signInWithGoogle}
                  className="btn-google"
                >
                  <GoogleLogo />
                  Continuar con Google
                </button>
              </div>

              <div className="my-6 flex items-center gap-3 text-xs uppercase tracking-widest text-muted-foreground">
                <span className="h-px flex-1 bg-border" /> o con tu correo <span className="h-px flex-1 bg-border" />
              </div>

              <form onSubmit={submit} className="grid gap-4">
                {mode === "signup" && (
                  <div className="grid gap-1.5">
                    <Label htmlFor="name">¿Cómo te llamas?</Label>
                    <Input id="name" value={name} onChange={(e) => setName(e.target.value)} className="h-11 rounded-xl" placeholder="Tu nombre" maxLength={60} />
                  </div>
                )}
                <div className="grid gap-1.5">
                  <Label htmlFor="email">Correo</Label>
                  <Input id="email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} className="h-11 rounded-xl" placeholder="tu@universidad.edu.pe" />
                </div>
                <div className="grid gap-1.5">
                  <Label htmlFor="password">Contraseña</Label>
                  <Input id="password" type="password" required minLength={6} value={password} onChange={(e) => setPassword(e.target.value)} className="h-11 rounded-xl" placeholder="Mínimo 6 caracteres" />
                </div>
                <Button type="submit" size="lg" disabled={loading}>
                  {loading ? "Un momento…" : mode === "signin" ? "Iniciar sesión" : "Crear cuenta"}
                </Button>
              </form>

              <p className="mt-6 text-center text-sm text-muted-foreground">
                {mode === "signin" ? "¿No tienes cuenta?" : "¿Ya tienes cuenta?"}{" "}
                <button
                  type="button"
                  onClick={() => setMode(mode === "signin" ? "signup" : "signin")}
                  className="font-semibold text-primary hover:underline"
                >
                  {mode === "signin" ? "Regístrate" : "Inicia sesión"}
                </button>
              </p>
            </>
          )}
        </div>
      </main>
    </div>
  );
}
