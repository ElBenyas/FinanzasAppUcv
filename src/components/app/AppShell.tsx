import type { ReactNode } from "react";
import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Bell, Home, LogOut, Menu, PiggyBank, ReceiptText, Target } from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuBadge,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  useSidebar,
} from "@/components/ui/sidebar";
import { supabase } from "@/integrations/supabase/client";
import { profileQuery, remindersQuery } from "@/lib/queries";
import { reminderStatus } from "@/lib/finance";

const NAV = [
  { to: "/dashboard", label: "Inicio", icon: Home },
  { to: "/movimientos", label: "Gastos e ingresos", icon: ReceiptText },
  { to: "/ahorro", label: "Metas de ahorro", icon: Target },
  { to: "/recordatorios", label: "Recordatorios", icon: Bell },
] as const;

export function Logo({ className = "" }: { className?: string }) {
  return (
    <span className={`flex items-center gap-2 ${className}`}>
      <span className="grid size-9 place-items-center rounded-xl bg-lime text-accent-foreground shadow-lift">
        <PiggyBank className="size-5" />
      </span>
      <span className="font-display text-xl font-extrabold tracking-tight">Alcancía</span>
    </span>
  );
}

function AppSidebar() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const { setOpenMobile } = useSidebar();
  const { data: profile } = useQuery(profileQuery);
  const { data: reminders = [] } = useQuery(remindersQuery);
  const urgent = reminders.filter((r) => {
    const s = reminderStatus(r);
    return s === "overdue" || s === "soon";
  }).length;
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  async function signOut() {
    await queryClient.cancelQueries();
    queryClient.clear();
    await supabase.auth.signOut();
    navigate({ to: "/auth", replace: true });
  }

  return (
    <Sidebar collapsible="offcanvas">
      <SidebarHeader className="px-4 pt-6 pb-4">
        <Logo />
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu className="gap-1.5 px-2">
              {NAV.map((item) => {
                const active = pathname === item.to;
                return (
                  <SidebarMenuItem key={item.to}>
                    <SidebarMenuButton
                      asChild
                      isActive={active}
                      size="lg"
                      className="rounded-xl px-3 font-semibold data-[active=true]:bg-sidebar-primary data-[active=true]:text-sidebar-primary-foreground"
                    >
                      <Link to={item.to} onClick={() => setOpenMobile(false)}>
                        <item.icon />
                        <span>{item.label}</span>
                      </Link>
                    </SidebarMenuButton>
                    {item.to === "/recordatorios" && urgent > 0 && (
                      <SidebarMenuBadge className="rounded-full bg-warning text-warning-foreground">
                        {urgent}
                      </SidebarMenuBadge>
                    )}
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter className="p-4">
        <div className="rounded-2xl bg-sidebar-accent p-3">
          <p className="truncate text-sm font-semibold">{profile?.name ?? "…"}</p>
          <p className="truncate text-xs opacity-70">{profile?.email}</p>
          <button
            onClick={signOut}
            className="mt-3 flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-sm font-medium opacity-80 transition hover:bg-sidebar-border hover:opacity-100"
          >
            <LogOut className="size-4" /> Cerrar sesión
          </button>
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}

function MobileTopBar() {
  const { toggleSidebar } = useSidebar();
  return (
    <header className="sticky top-0 z-20 flex items-center justify-between border-b border-border bg-background/85 px-4 py-3 backdrop-blur md:hidden">
      <Logo />
      <button
        onClick={toggleSidebar}
        aria-label="Abrir menú"
        className="grid size-10 place-items-center rounded-xl border border-border bg-card text-foreground shadow-soft"
      >
        <Menu className="size-5" />
      </button>
    </header>
  );
}

export function AppShell({ children }: { children: ReactNode }) {
  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset className="bg-background">
        <MobileTopBar />
        <main className="mx-auto w-full max-w-6xl px-4 py-6 md:px-8 md:py-10">{children}</main>
      </SidebarInset>
    </SidebarProvider>
  );
}

export function PageHeader({
  title,
  subtitle,
  action,
}: {
  title: string;
  subtitle?: string;
  action?: ReactNode;
}) {
  return (
    <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between md:mb-8">
      <div>
        <h1 className="text-3xl font-extrabold md:text-4xl">{title}</h1>
        {subtitle && <p className="mt-1 text-muted-foreground">{subtitle}</p>}
      </div>
      {action}
    </div>
  );
}
