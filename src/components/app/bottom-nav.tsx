"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, Users, FileText, Menu } from "lucide-react";
import { cn } from "@/lib/utils";

type BottomNavItem = {
  to?: string;
  label: string;
  icon: typeof LayoutDashboard;
  exact?: boolean;
  onClick?: () => void;
};

export function BottomNav({ onOpenMobile }: { onOpenMobile: () => void }) {
  const pathname = usePathname();

  const isActive = (to: string, exact?: boolean) =>
    exact ? pathname === to : pathname === to || pathname.startsWith(to + "/");

  const items: BottomNavItem[] = [
    { to: "/", label: "Início", icon: LayoutDashboard, exact: true },
    { to: "/crm", label: "CRM", icon: Users },
    { to: "/orcamentos", label: "Orçamentos", icon: FileText },
    { label: "Mais", icon: Menu, onClick: onOpenMobile },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 block border-t border-border bg-card/80 px-4 py-2.5 backdrop-blur-lg md:hidden shadow-[0_-4px_20px_0_rgba(0,0,0,0.03)] dark:shadow-[0_-4px_20px_0_rgba(0,0,0,0.15)]">
      <div className="mx-auto flex max-w-md items-center justify-around">
        {items.map((item, idx) => {
          const Icon = item.icon;
          const active = item.to ? isActive(item.to, item.exact) : false;

          const buttonContent = (
            <span className="flex flex-col items-center gap-1">
              <span className={cn(
                "flex h-8 w-12 items-center justify-center rounded-2xl transition-all duration-200",
                active 
                  ? "bg-primary text-primary-foreground scale-105" 
                  : "text-muted-foreground group-hover:text-foreground group-active:scale-95"
              )}>
                <Icon className="h-5 w-5" strokeWidth={1.75} />
              </span>
              <span className={cn(
                "text-[10px] font-semibold tracking-wide transition-colors",
                active ? "text-foreground font-bold" : "text-muted-foreground"
              )}>
                {item.label}
              </span>
            </span>
          );

          if (item.to) {
            return (
              <Link
                key={idx}
                href={item.to}
                className="group flex flex-1 flex-col items-center focus:outline-none"
              >
                {buttonContent}
              </Link>
            );
          }

          return (
            <button
              key={idx}
              onClick={item.onClick}
              className="group flex flex-1 flex-col items-center focus:outline-none"
            >
              {buttonContent}
            </button>
          );
        })}
      </div>
    </nav>
  );
}
