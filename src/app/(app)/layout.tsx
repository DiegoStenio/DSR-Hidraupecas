"use client";

import { useState } from "react";
import { Sidebar } from "@/components/app/sidebar";
import { Header } from "@/components/app/header";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="flex min-h-screen w-full bg-background text-foreground">
      <Sidebar mobileOpen={mobileOpen} onCloseMobile={() => setMobileOpen(false)} />
      <div className="flex flex-1 flex-col min-w-0">
        <Header onOpenMobile={() => setMobileOpen(true)} />
        <main className="flex-1 min-w-0 p-4 md:p-8">{children}</main>
      </div>
    </div>
  );
}
