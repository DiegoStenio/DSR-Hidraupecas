"use client";

import { useState } from "react";
import { Sidebar } from "@/components/app/sidebar";
import { Header } from "@/components/app/header";
import { BottomNav } from "@/components/app/bottom-nav";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="flex min-h-screen w-full bg-background text-foreground">
      <Sidebar mobileOpen={mobileOpen} onCloseMobile={() => setMobileOpen(false)} />
      <div className="relative flex flex-1 flex-col min-w-0 overflow-hidden ambient-glow">
        <Header onOpenMobile={() => setMobileOpen(true)} />
        <div
          aria-hidden
          className="pointer-events-none fixed inset-0 z-0 flex items-center justify-center opacity-[0.04] dark:opacity-[0.06]"
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/logo-dsr-light.png" alt="" className="h-[55vh] w-[55vh] object-contain dark:hidden" />
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/logo-dsr-dark.png" alt="" className="hidden h-[55vh] w-[55vh] object-contain dark:block" />
        </div>
        <main className="relative z-10 flex-1 min-w-0 p-4 md:p-8 pb-20 md:pb-8">{children}</main>
        <BottomNav onOpenMobile={() => setMobileOpen(true)} />
      </div>
    </div>
  );
}
