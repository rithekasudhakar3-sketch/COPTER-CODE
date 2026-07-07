"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTheme } from "next-themes";
import { Moon, Sun, Bell, Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { navItems } from "./Sidebar";
import { useEffect, useState } from "react";

export function Navbar() {
  const { setTheme, theme } = useTheme();
  const pathname = usePathname();
  const [mounted, setMounted] = useState(false);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  useEffect(() => {
    const frame = requestAnimationFrame(() => setMounted(true));
    return () => cancelAnimationFrame(frame);
  }, []);

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center gap-4 border-b bg-background/50 px-6 backdrop-blur-xl glass">
      <Button variant="ghost" size="icon" className="md:hidden" onClick={() => setMobileNavOpen(true)}>
        <Menu className="h-5 w-5" />
        <span className="sr-only">Toggle Sidebar</span>
      </Button>

      <div className="flex flex-1 items-center justify-end gap-4">
        <Button variant="ghost" size="icon" className="relative rounded-full">
          <Bell className="h-5 w-5 text-muted-foreground" />
          <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-red-500 animate-pulse" />
        </Button>

        {mounted && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="rounded-full">
                {theme === "dark" ? (
                  <Moon className="h-5 w-5 text-muted-foreground" />
                ) : (
                  <Sun className="h-5 w-5 text-muted-foreground" />
                )}
                <span className="sr-only">Toggle theme</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => setTheme("light")}>
                Light
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setTheme("dark")}>
                Dark
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setTheme("system")}>
                System
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}

        <div className="h-8 w-8 rounded-full bg-gradient-to-tr from-blue-600 to-violet-600 shadow-inner overflow-hidden border-2 border-background flex items-center justify-center text-xs font-bold text-white">
          JD
        </div>
      </div>

      <Dialog open={mobileNavOpen} onOpenChange={setMobileNavOpen}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Navigate</DialogTitle>
          </DialogHeader>
          <div className="flex flex-col gap-2">
            {navItems.map((item) => {
              const isActive = pathname === item.href || pathname?.startsWith(`${item.href}/`);
              const Icon = item.icon;
              return (
                <Link key={item.href} href={item.href} onClick={() => setMobileNavOpen(false)}>
                  <span className={cn(
                    "flex items-center justify-between rounded-md px-3 py-2.5 text-sm font-medium transition-all duration-200",
                    isActive ? "bg-primary text-primary-foreground" : "bg-muted/40 text-foreground"
                  )}>
                    <span className="flex items-center gap-3">
                      <Icon className="h-4 w-4" />
                      <span>{item.title}</span>
                    </span>
                  </span>
                </Link>
              );
            })}
          </div>
        </DialogContent>
      </Dialog>
    </header>
  );
}
