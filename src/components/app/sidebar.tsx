"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Users,
  UserCircle2,
  FileText,
  Briefcase,
  Wrench,
  CreditCard,
  Settings,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";

type NavItem = { to: string; label: string; icon: typeof LayoutDashboard; exact?: boolean };
const nav: NavItem[] = [
  { to: "/", label: "Dashboard", icon: LayoutDashboard, exact: true },
  { to: "/crm", label: "CRM (Leads)", icon: Users },
  { to: "/clientes", label: "Clientes", icon: UserCircle2 },
  { to: "/prestadores", label: "Prestadores", icon: Wrench },
  { to: "/orcamentos", label: "Orçamentos", icon: FileText },
  { to: "/vendedores", label: "Vendedores", icon: Briefcase },
  { to: "/planos", label: "Planos de Pagamento", icon: CreditCard },
  { to: "/configuracoes", label: "Configurações", icon: Settings },
];

export function Sidebar({ mobileOpen, onCloseMobile }: { mobileOpen: boolean; onCloseMobile: () => void }) {
  const [collapsed, setCollapsed] = useState(false);
  const pathname = usePathname();

  const isActive = (to: string, exact?: boolean) =>
    exact ? pathname === to : pathname === to || pathname.startsWith(to + "/");

  return (
    <>
      {/* Mobile backdrop */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm md:hidden animate-in fade-in"
          onClick={onCloseMobile}
        />
      )}
      <aside
        className={cn(
          "z-50 flex flex-col bg-sidebar text-sidebar-foreground transition-all duration-300",
          "fixed inset-y-0 left-0 w-72 md:relative md:translate-x-0",
          mobileOpen ? "translate-x-0" : "-translate-x-full",
          collapsed ? "md:w-20" : "md:w-64",
        )}
      >
        {/* Brand */}
        <div className="flex items-center justify-between px-5 py-6 border-b border-[var(--sidebar-border)]">
          <Link href="/" className="flex items-center gap-2 min-w-0" onClick={onCloseMobile}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/logo-dsr-dark.png" alt="DSR Hidraupeças" className="h-9 w-9 shrink-0 object-contain" />
            {!collapsed && (
              <div className="min-w-0">
                <div className="font-display text-base font-semibold tracking-tight truncate">
                  DSR-Hidraupecas
                </div>
                <div className="text-[10px] uppercase tracking-[0.18em] text-[var(--sidebar-muted)]">
                  Painel interno
                </div>
              </div>
            )}
          </Link>
          <button
            onClick={() => setCollapsed((c) => !c)}
            className="hidden md:grid h-7 w-7 place-items-center rounded-md text-[var(--sidebar-muted)] hover:text-white hover:bg-[var(--sidebar-accent)] transition-colors"
            aria-label="Recolher menu"
          >
            {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
          </button>
        </div>

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto p-3 space-y-1">
          {nav.map((item) => {
            const active = isActive(item.to, item.exact);
            const Icon = item.icon;
            return (
              <Link
                key={item.to}
                href={item.to}
                onClick={onCloseMobile}
                className={cn(
                  "group relative flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm font-medium transition-all duration-200",
                  active
                    ? "bg-[var(--sidebar-accent)] text-white shadow-sm font-semibold"
                    : "text-[var(--sidebar-muted)] hover:text-white hover:bg-[var(--sidebar-accent)]/40",
                )}
              >
                <Icon className={cn("h-[18px] w-[18px] shrink-0 transition-transform duration-200 group-hover:scale-105", active && "text-[var(--gold)]")} strokeWidth={1.75} />
                {!collapsed && <span className="truncate">{item.label}</span>}
                {active && (
                  <span className="absolute left-0 top-2.5 bottom-2.5 w-[3px] rounded-r bg-[var(--gold)]" />
                )}
              </Link>
            );
          })}
        </nav>

        <div className="border-t border-[var(--sidebar-border)] p-4">
          {!collapsed ? (
            <div className="text-[11px] text-[var(--sidebar-muted)] leading-relaxed">
              v1.0 · Protótipo<br />
              <span className="text-white/80">Equipe interna DSR</span>
            </div>
          ) : (
            <div className="h-2 w-2 mx-auto rounded-full bg-[var(--gold)] pulse-dot" />
          )}
        </div>
      </aside>
    </>
  );
}
