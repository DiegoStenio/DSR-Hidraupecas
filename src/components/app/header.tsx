"use client";

import { Bell, Menu, Moon, Search, Sun } from "lucide-react";
import { useState, useEffect } from "react";
import { useTheme } from "@/hooks/use-theme";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { useRouter } from "next/navigation";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { createClient } from "@/lib/supabase/client";
import { useCurrentUser } from "@/hooks/use-current-user";

export function Header({ onOpenMobile }: { onOpenMobile: () => void }) {
  const { theme, toggle } = useTheme();
  const [cmdOpen, setCmdOpen] = useState(false);
  const router = useRouter();
  const { user } = useCurrentUser();
  const fullName = ((user?.user_metadata?.full_name ?? user?.user_metadata?.name) as string | undefined)?.trim();
  const avatarUrl = user?.user_metadata?.avatar_url as string | undefined;
  const displayName = fullName || user?.email?.split("@")[0] || "Usuário";
  const initials = displayName.slice(0, 2).toUpperCase();

  const signOut = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  };

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setCmdOpen((o) => !o);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const go = (path: string) => {
    setCmdOpen(false);
    router.push(path);
  };

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center gap-3 border-b border-border bg-background/85 px-4 backdrop-blur-md md:px-6">
      <button
        onClick={onOpenMobile}
        className="grid h-9 w-9 place-items-center rounded-lg text-foreground hover:bg-muted md:hidden"
        aria-label="Abrir menu"
      >
        <Menu className="h-5 w-5" strokeWidth={1.5} />
      </button>

      <button
        onClick={() => setCmdOpen(true)}
        className="flex flex-1 max-w-md items-center gap-3 rounded-xl border border-border bg-card px-3.5 py-2 text-left text-sm text-muted-foreground transition-colors hover:border-[var(--gold)]/40"
      >
        <Search className="h-4 w-4" strokeWidth={1.5} />
        <span className="flex-1 truncate">Buscar clientes, leads, orçamentos…</span>
        <kbd className="hidden md:inline-flex items-center gap-1 rounded border border-border bg-muted px-1.5 py-0.5 text-[10px] font-mono font-medium">
          ⌘K
        </kbd>
      </button>

      <div className="flex items-center gap-1.5">
        <button
          onClick={toggle}
          className="grid h-9 w-9 place-items-center rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
          aria-label="Alternar tema"
        >
          {theme === "dark" ? <Sun className="h-4 w-4" strokeWidth={1.5} /> : <Moon className="h-4 w-4" strokeWidth={1.5} />}
        </button>
        <button
          className="hidden sm:grid h-9 w-9 place-items-center rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground transition-colors relative"
          aria-label="Notificações"
        >
          <Bell className="h-4 w-4" strokeWidth={1.5} />
          <span className="absolute top-2 right-2 h-1.5 w-1.5 rounded-full bg-[var(--gold)]" />
        </button>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="flex items-center gap-2 rounded-xl border border-border bg-card px-2 py-1.5 hover:border-[var(--gold)]/40 transition-colors">
              {avatarUrl ? (
                <img src={avatarUrl} alt={displayName} className="h-7 w-7 rounded-lg object-cover" />
              ) : (
                <div className="grid h-7 w-7 place-items-center rounded-lg bg-primary text-primary-foreground text-xs font-semibold">
                  {initials}
                </div>
              )}
              <div className="hidden sm:block text-left leading-tight pr-1">
                <div className="text-xs font-semibold text-foreground capitalize">{displayName}</div>
                <div className="text-[10px] text-muted-foreground">{user?.email}</div>
              </div>
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-52">
            <DropdownMenuLabel>Minha conta</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => router.push("/configuracoes")}>Perfil</DropdownMenuItem>
            <DropdownMenuItem onClick={() => router.push("/configuracoes")}>Configurações</DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={signOut} className="text-destructive">
              Sair
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <CommandDialog open={cmdOpen} onOpenChange={setCmdOpen}>
        <CommandInput placeholder="Buscar em todo o app…" />
        <CommandList>
          <CommandEmpty>Nada encontrado.</CommandEmpty>
          <CommandGroup heading="Navegar">
            <CommandItem onSelect={() => go("/")}>Dashboard</CommandItem>
            <CommandItem onSelect={() => go("/crm")}>CRM — Leads</CommandItem>
            <CommandItem onSelect={() => go("/clientes")}>Clientes</CommandItem>
            <CommandItem onSelect={() => go("/orcamentos")}>Orçamentos</CommandItem>
            <CommandItem onSelect={() => go("/vendedores")}>Vendedores</CommandItem>
            <CommandItem onSelect={() => go("/planos")}>Planos de Pagamento</CommandItem>
            <CommandItem onSelect={() => go("/configuracoes")}>Configurações</CommandItem>
          </CommandGroup>
          <CommandGroup heading="Ações rápidas">
            <CommandItem onSelect={() => go("/orcamentos")}>+ Novo orçamento</CommandItem>
            <CommandItem onSelect={() => go("/clientes")}>+ Novo cliente</CommandItem>
            <CommandItem onSelect={() => go("/crm")}>Buscar novos leads</CommandItem>
          </CommandGroup>
        </CommandList>
      </CommandDialog>
    </header>
  );
}
