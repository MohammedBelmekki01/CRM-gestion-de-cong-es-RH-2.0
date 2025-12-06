"use client";

import React, { useEffect, useCallback } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { cn } from "@/lib/utils";
import { useTheme } from "next-themes";
import {
  LayoutDashboard,
  Users,
  Building2,
  Briefcase,
  CalendarDays,
  FileText,
  Settings,
  LogOut,
  Bell,
  ClipboardList,
  User,
  Menu,
  ChevronDown,
  Sun,
  Moon,
  Monitor,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
} from "@/components/ui/dropdown-menu";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";

interface NavItem {
  title: string;
  href: string;
  icon: React.ElementType;
  badge?: number;
  roles?: string[];
}

const adminNavItems: NavItem[] = [
  { title: "Tableau de bord", href: "/dashboard/hr", icon: LayoutDashboard },
  { title: "Employés", href: "/admin/employees", icon: Users },
  { title: "Départements", href: "/admin/departments", icon: Building2 },
  { title: "Postes", href: "/admin/positions", icon: Briefcase },
  { title: "Types de congés", href: "/admin/leave-types", icon: CalendarDays },
  {
    title: "Demandes de congés",
    href: "/admin/leave-requests",
    icon: ClipboardList,
  },
  { title: "Calendrier", href: "/dashboard/calendar", icon: CalendarDays },
  { title: "Jours fériés", href: "/admin/public-holidays", icon: CalendarDays },
  { title: "Rapports", href: "/admin/reports", icon: FileText },
  { title: "Exports", href: "/admin/exports", icon: FileText },
  { title: "Journal d'audit", href: "/admin/audit-logs", icon: ClipboardList },
];

const employeeNavItems: NavItem[] = [
  {
    title: "Mon tableau de bord",
    href: "/dashboard/employee",
    icon: LayoutDashboard,
  },
  {
    title: "Mes congés",
    href: "/dashboard/employee/leaves",
    icon: CalendarDays,
  },
  {
    title: "Nouvelle demande",
    href: "/dashboard/employee/new-request",
    icon: ClipboardList,
  },
  { title: "Calendrier", href: "/dashboard/calendar", icon: CalendarDays },
  { title: "Notifications", href: "/dashboard/notifications", icon: Bell },
  { title: "Mon profil", href: "/dashboard/employee/profile", icon: User },
];

function NavLink({ item, onClick }: { item: NavItem; onClick?: () => void }) {
  const pathname = usePathname();
  const isActive =
    pathname === item.href || pathname.startsWith(item.href + "/");
  const Icon = item.icon;

  return (
    <Link
      href={item.href}
      onClick={onClick}
      className={cn(
        "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-all hover:bg-accent",
        isActive
          ? "bg-accent text-accent-foreground"
          : "text-muted-foreground hover:text-foreground"
      )}
    >
      <Icon className="h-4 w-4" />
      {item.title}
      {item.badge && item.badge > 0 && (
        <Badge variant="secondary" className="ml-auto">
          {item.badge}
        </Badge>
      )}
    </Link>
  );
}

function SidebarContent({ onItemClick }: { onItemClick?: () => void }) {
  const { user } = useAuth();
  const isHR = user?.role?.name === "RH" || user?.role?.name === "Admin";
  const navItems = isHR ? adminNavItems : employeeNavItems;

  return (
    <div className="flex h-full flex-col gap-2">
      <div className="flex h-14 items-center border-b px-4 lg:h-[60px] lg:px-6">
        <Link
          href="/dashboard"
          className="flex items-center gap-2 font-semibold"
        >
          <CalendarDays className="h-6 w-6 text-primary" />
          <span>GestConges RH</span>
        </Link>
      </div>
      <div className="flex-1 overflow-auto py-2">
        <nav className="grid gap-1 px-2 lg:px-4">
          {navItems.map((item) => (
            <NavLink key={item.href} item={item} onClick={onItemClick} />
          ))}
        </nav>
      </div>
      <div className="mt-auto border-t p-4">
        <div className="flex items-center gap-3 rounded-lg bg-muted p-3">
          <Avatar className="h-9 w-9">
            <AvatarFallback>
              {user ? `${user.firstName[0]}${user.lastName[0]}` : "?"}
            </AvatarFallback>
          </Avatar>
          <div className="flex flex-col">
            <span className="text-sm font-medium">
              {user ? `${user.firstName} ${user.lastName}` : "Chargement..."}
            </span>
            <span className="text-xs text-muted-foreground">
              {user?.role?.name || ""}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, loading, logout } = useAuth();
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = React.useState(false);
  const [notifications, setNotifications] = React.useState<number>(0);
  const [mounted, setMounted] = React.useState(false);
  const { theme, setTheme } = useTheme();

  // Fetch unread notification count
  const fetchNotificationCount = useCallback(async () => {
    try {
      const response = await fetch("/api/notifications?unreadOnly=true");
      if (response.ok) {
        const data = await response.json();
        setNotifications(data.length || 0);
      }
    } catch (error) {
      console.error("Error fetching notifications:", error);
    }
  }, []);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!loading && !user) {
      router.push("/");
    }
  }, [loading, user, router]);

  useEffect(() => {
    if (user) {
      fetchNotificationCount();
      // Refresh notification count every 30 seconds
      const interval = setInterval(fetchNotificationCount, 30000);
      return () => clearInterval(interval);
    }
  }, [user, fetchNotificationCount]);

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Skeleton className="h-12 w-12 rounded-full" />
          <Skeleton className="h-4 w-32" />
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Skeleton className="h-12 w-12 rounded-full" />
          <Skeleton className="h-4 w-32" />
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen">
      {/* Desktop Sidebar */}
      <aside className="hidden w-64 flex-col border-r bg-background lg:flex">
        <SidebarContent />
      </aside>

      {/* Mobile Sidebar */}
      <Sheet open={sidebarOpen} onOpenChange={setSidebarOpen}>
        <SheetContent side="left" className="w-64 p-0">
          <SidebarContent onItemClick={() => setSidebarOpen(false)} />
        </SheetContent>
      </Sheet>

      {/* Main Content */}
      <div className="flex flex-1 flex-col">
        {/* Header */}
        <header className="sticky top-0 z-30 flex h-14 items-center gap-4 border-b bg-background px-4 lg:h-[60px] lg:px-6">
          <Sheet>
            <SheetTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="lg:hidden"
                onClick={() => setSidebarOpen(true)}
              >
                <Menu className="h-5 w-5" />
                <span className="sr-only">Toggle menu</span>
              </Button>
            </SheetTrigger>
          </Sheet>

          <div className="flex-1" />

          <div className="flex items-center gap-2">
            {/* Theme Toggle */}
            {mounted && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon">
                    <Sun className="h-5 w-5 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
                    <Moon className="absolute h-5 w-5 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
                    <span className="sr-only">Toggle theme</span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuRadioGroup
                    value={theme}
                    onValueChange={setTheme}
                  >
                    <DropdownMenuRadioItem value="light">
                      <Sun className="mr-2 h-4 w-4" />
                      Clair
                    </DropdownMenuRadioItem>
                    <DropdownMenuRadioItem value="dark">
                      <Moon className="mr-2 h-4 w-4" />
                      Sombre
                    </DropdownMenuRadioItem>
                    <DropdownMenuRadioItem value="system">
                      <Monitor className="mr-2 h-4 w-4" />
                      Système
                    </DropdownMenuRadioItem>
                  </DropdownMenuRadioGroup>
                </DropdownMenuContent>
              </DropdownMenu>
            )}

            {/* Notifications */}
            <Link href="/dashboard/notifications">
              <Button variant="ghost" size="icon" className="relative">
                <Bell className="h-5 w-5" />
                {notifications > 0 && (
                  <span className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-xs text-white animate-pulse">
                    {notifications > 9 ? "9+" : notifications}
                  </span>
                )}
              </Button>
            </Link>

            {/* User Menu */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="flex items-center gap-2">
                  <Avatar className="h-8 w-8">
                    <AvatarFallback>
                      {user ? `${user.firstName[0]}${user.lastName[0]}` : "?"}
                    </AvatarFallback>
                  </Avatar>
                  <span className="hidden md:inline-block">
                    {user?.firstName} {user?.lastName}
                  </span>
                  <ChevronDown className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel>Mon compte</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link href="/dashboard/employee/profile">
                    <User className="mr-2 h-4 w-4" />
                    Profil
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/dashboard/settings">
                    <Settings className="mr-2 h-4 w-4" />
                    Paramètres
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={logout} className="text-red-600">
                  <LogOut className="mr-2 h-4 w-4" />
                  Déconnexion
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-auto bg-muted/30 p-4 lg:p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
