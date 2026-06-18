import React from "react";
import { Link, useLocation } from "wouter";
import { Home, ClipboardList, Target, User } from "lucide-react";

export function Layout({ children, currentPhase = 0 }: { children: React.ReactNode, currentPhase?: number }) {
  const [location] = useLocation();

  return (
    <div className="min-h-[100dvh] bg-background w-full flex justify-center text-foreground font-sans">
      <div className="w-full max-w-[480px] relative pb-20 flex flex-col shadow-xl bg-card border-x border-border">
        <main className="flex-1 overflow-y-auto">
          {children}
        </main>

        <nav className="fixed bottom-0 w-full max-w-[480px] bg-card border-t border-border flex justify-around items-center p-4 z-50">
          <Link href="/">
            <button className={`flex flex-col items-center gap-1 ${location === "/" ? "text-primary" : "text-muted-foreground"}`}>
              <Home size={24} />
              <span className="text-[10px] font-mono tracking-wider">HOME</span>
            </button>
          </Link>
          <Link href="/progress">
            <button className={`flex flex-col items-center gap-1 ${location.startsWith("/progress") ? "text-primary" : "text-muted-foreground"}`}>
              <Target size={24} />
              <span className="text-[10px] font-mono tracking-wider">PROGRESS</span>
            </button>
          </Link>
          <Link href="/competition-review">
            <button className={`flex flex-col items-center gap-1 ${location.startsWith("/competition") ? "text-primary" : "text-muted-foreground"}`}>
              <ClipboardList size={24} />
              <span className="text-[10px] font-mono tracking-wider">REVIEW</span>
            </button>
          </Link>
          <Link href="/capstone">
            <button className={`flex flex-col items-center gap-1 ${location.startsWith("/capstone") ? "text-primary" : "text-muted-foreground"}`}>
              <User size={24} />
              <span className="text-[10px] font-mono tracking-wider">CAPSTONE</span>
            </button>
          </Link>
        </nav>
      </div>
    </div>
  );
}

export function PageHeader({ title, subtitle, phaseColor }: { title: string, subtitle?: string, phaseColor?: string }) {
  return (
    <div className="px-6 pt-10 pb-6 mb-4 border-b border-border bg-card">
      {subtitle && <p className="font-mono text-xs text-muted-foreground tracking-widest mb-2" style={{ color: phaseColor }}>{subtitle}</p>}
      <h1 className="font-heading text-4xl leading-none uppercase">{title}</h1>
    </div>
  );
}
