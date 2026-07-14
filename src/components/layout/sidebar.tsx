"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  FolderOpen,
  Settings,
  Wand2,
  Video,
  Mic,
  ImageIcon,
  FileText,
  Download,
} from "lucide-react";
import { cn } from "@/lib/utils";

const navItems = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard },
  { href: "/projects", label: "Projets", icon: FolderOpen },
  { href: "/tools", label: "Outils IA", icon: Wand2 },
  { href: "/settings", label: "Paramètres", icon: Settings },
];

const pipelineIcons = [
  { icon: FileText, label: "Script" },
  { icon: ImageIcon, label: "Personnage" },
  { icon: Mic, label: "Voix" },
  { icon: Video, label: "Animation" },
  { icon: Download, label: "Export" },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="fixed left-0 top-0 z-40 flex h-screen w-64 flex-col border-r border-border bg-card">
      <div className="flex h-16 items-center gap-3 border-b border-border px-6">
        <div className="flex size-9 items-center justify-center rounded-lg bg-primary">
          <Video className="size-5 text-primary-foreground" />
        </div>
        <div>
          <p className="text-sm font-bold tracking-tight">MedVid Studio</p>
          <p className="text-xs text-muted-foreground">Création vidéo IA</p>
        </div>
      </div>

      <nav className="flex-1 space-y-1 p-4">
        {navItems.map((item) => {
          const active =
            item.href === "/"
              ? pathname === "/"
              : pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                active
                  ? "bg-primary/15 text-primary"
                  : "text-muted-foreground hover:bg-secondary hover:text-foreground"
              )}
            >
              <item.icon className="size-4" />
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="border-t border-border p-4">
        <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Pipeline
        </p>
        <div className="space-y-2">
          {pipelineIcons.map((step, i) => (
            <div
              key={step.label}
              className="flex items-center gap-2 text-xs text-muted-foreground"
            >
              <span className="flex size-5 items-center justify-center rounded-full bg-secondary text-[10px] font-bold">
                {i + 1}
              </span>
              <step.icon className="size-3" />
              {step.label}
            </div>
          ))}
        </div>
      </div>
    </aside>
  );
}
