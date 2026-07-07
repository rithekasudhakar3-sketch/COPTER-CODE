"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { BarChart3, ChevronRight, FileText, LayoutDashboard, LogOut, Package, Settings, Users } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

const navItems = [
  { title: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { title: "Invoices", href: "/invoices", icon: FileText },
  { title: "Customers", href: "/customers", icon: Users },
  { title: "Products", href: "/products", icon: Package },
  { title: "Reports", href: "/reports", icon: BarChart3 },
  { title: "Settings", href: "/settings", icon: Settings },
];

export function Sidebar() {
  const pathname = usePathname();

  const logout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    window.location.href = "/login";
  };

  return (
    <aside className="hidden w-64 flex-col border-r bg-background/50 backdrop-blur-xl md:flex glass">
      <div className="flex h-16 items-center border-b px-6">
        <div className="flex items-center gap-2 font-bold text-xl gradient-text">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-xs font-bold text-primary-foreground">
            GST
          </div>
          GST Invoice
        </div>
      </div>
      <div className="flex-1 overflow-auto py-4">
        <nav className="grid gap-1 px-4">
          {navItems.map((item) => {
            const isActive = pathname === item.href || pathname?.startsWith(`${item.href}/`);
            const Icon = item.icon;
            return (
              <Link key={item.href} href={item.href}>
                <span
                  className={cn(
                    "group flex items-center justify-between rounded-md px-3 py-2.5 text-sm font-medium transition-all duration-200 hover:bg-accent hover:text-accent-foreground",
                    isActive ? "bg-primary text-primary-foreground shadow-md" : "text-muted-foreground"
                  )}
                >
                  <span className="flex items-center gap-3">
                    <Icon className={cn("h-4 w-4", isActive ? "text-primary-foreground" : "text-muted-foreground group-hover:text-accent-foreground")} />
                    <span>{item.title}</span>
                  </span>
                  {isActive && <ChevronRight className="h-4 w-4 opacity-50" />}
                </span>
              </Link>
            );
          })}
        </nav>
      </div>
      <div className="border-t p-4">
        <Button onClick={logout} variant="outline" className="w-full justify-start gap-3 glass transition-all duration-300 hover:bg-destructive hover:text-destructive-foreground">
          <LogOut className="h-4 w-4" />
          Logout
        </Button>
      </div>
    </aside>
  );
}
