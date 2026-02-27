"use client";

import { useEffect, useState, useRef } from "react";
import { usePathname, useRouter } from "next/navigation";
import clsx from "clsx";
import {
  LayoutDashboard,
  FileDown,
  Users,
  Building2,
  Briefcase,
  CalendarDays,
  PlusCircle,
  User,
  LogOut,
  Bell,
  Menu,
} from "lucide-react";

interface UserData {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  role: { name: string };
  department: { name: string };
}

interface NavItem {
  label: string;
  href: string;
  icon: React.ElementType;
}

interface Notification {
  id: number;
  title: string;
  message: string;
  type: string;
  isRead: boolean;
  createdAt: string;
}

const hrNav: NavItem[] = [
  { label: "Tableau de bord", href: "/dashboard/hr", icon: LayoutDashboard },
  { label: "Export rapports", href: "/dashboard/hr/export", icon: FileDown },
  { label: "Employes", href: "/admin/employees", icon: Users },
  { label: "Departements", href: "/admin/departments", icon: Building2 },
  { label: "Postes", href: "/admin/positions", icon: Briefcase },
  { label: "Types de conges", href: "/admin/leave-types", icon: CalendarDays },
];

const employeeNav: NavItem[] = [
  {
    label: "Tableau de bord",
    href: "/dashboard/employee",
    icon: LayoutDashboard,
  },
  {
    label: "Nouvelle demande",
    href: "/dashboard/employee/new-request",
    icon: PlusCircle,
  },
  { label: "Mon profil", href: "/dashboard/employee/profile", icon: User },
];

export default function AppShell({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<UserData | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [notifOpen, setNotifOpen] = useState(false);
  const notifRef = useRef<HTMLDivElement>(null);
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    fetch("/api/auth/me")
      .then((res) => res.json())
      .then((data) => {
        if (data.user) setUser(data.user);
      });
  }, []);

  useEffect(() => {
    const fetchNotifs = () => {
      fetch("/api/notifications")
        .then((res) => res.json())
        .then((data) => {
          if (data.notifications) setNotifications(data.notifications);
          if (typeof data.unreadCount === "number")
            setUnreadCount(data.unreadCount);
        })
        .catch(() => {});
    };
    fetchNotifs();
    const interval = setInterval(fetchNotifs, 30000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setNotifOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const handleMarkAllRead = async () => {
    await fetch("/api/notifications", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "read-all" }),
    });
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
    setUnreadCount(0);
  };

  const handleLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/");
  };

  const isHR = user?.role?.name === "RH" || user?.role?.name === "Admin";
  const nav = isHR ? hrNav : employeeNav;

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-foreground/25 backdrop-blur-[2px] z-20 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={clsx(
          "fixed lg:static inset-y-0 left-0 z-30 w-[260px] bg-sidebar flex flex-col transition-transform duration-200",
          sidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0",
        )}
      >
        {/* Sidebar brand */}
        <div className="px-6 h-16 flex items-center border-b border-white/[0.06]">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
              <span className="text-xs font-bold text-white">RH</span>
            </div>
            <div>
              <h1 className="text-[15px] font-semibold text-white tracking-tight leading-tight">
                GestionRH
              </h1>
            </div>
          </div>
        </div>

        {/* User info */}
        {user && (
          <div className="px-5 py-4 border-b border-white/[0.06]">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-white/10 text-white/80 flex items-center justify-center text-[13px] font-medium">
                {user.firstName[0]}
                {user.lastName[0]}
              </div>
              <div className="min-w-0">
                <p className="text-[13px] font-medium text-white truncate">
                  {user.firstName} {user.lastName}
                </p>
                <p className="text-[11px] text-sidebar-foreground truncate">
                  {user.role?.name}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Navigation */}
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          {nav.map((item) => {
            const active = pathname === item.href;
            const Icon = item.icon;
            return (
              <a
                key={item.href}
                href={item.href}
                onClick={() => setSidebarOpen(false)}
                className={clsx(
                  "flex items-center gap-3 px-3 py-2.5 rounded-[10px] text-[13px] font-medium transition-all duration-150",
                  active
                    ? "bg-white/[0.12] text-white"
                    : "text-sidebar-foreground hover:bg-white/[0.06] hover:text-white",
                )}
              >
                <Icon size={18} strokeWidth={active ? 2 : 1.5} />
                {item.label}
              </a>
            );
          })}
        </nav>

        {/* Logout */}
        <div className="px-3 py-4 border-t border-white/[0.06]">
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 w-full px-3 py-2.5 rounded-[10px] text-[13px] font-medium text-sidebar-foreground hover:bg-white/[0.06] hover:text-white transition-all duration-150"
          >
            <LogOut size={18} strokeWidth={1.5} />
            Deconnexion
          </button>
        </div>
      </aside>

      {/* Main content area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Header */}
        <header className="h-16 border-b border-border bg-card flex items-center px-4 lg:px-6 shrink-0 shadow-[0_1px_2px_0_rgba(0,0,0,0.03)]">
          <button
            onClick={() => setSidebarOpen(true)}
            className="lg:hidden w-9 h-9 flex items-center justify-center rounded-lg text-muted hover:text-foreground hover:bg-background transition-colors -ml-1"
          >
            <Menu size={20} />
          </button>

          <div className="ml-auto flex items-center gap-2">
            {/* Notification bell */}
            <div className="relative" ref={notifRef}>
              <button
                onClick={() => setNotifOpen(!notifOpen)}
                className="relative w-9 h-9 flex items-center justify-center rounded-lg text-muted hover:text-foreground hover:bg-background transition-colors"
              >
                <Bell size={19} />
                {unreadCount > 0 && (
                  <span className="absolute top-1 right-1 flex items-center justify-center w-4 h-4 text-[10px] font-bold text-white bg-danger rounded-full">
                    {unreadCount > 9 ? "9+" : unreadCount}
                  </span>
                )}
              </button>

              {notifOpen && (
                <div className="absolute right-0 mt-2 w-80 bg-card border border-border rounded-[14px] shadow-[0_10px_15px_-3px_rgba(0,0,0,0.08),0_4px_6px_-4px_rgba(0,0,0,0.04)] z-50 overflow-hidden animate-scale-in">
                  <div className="flex items-center justify-between px-4 py-3.5 border-b border-border">
                    <h3 className="text-[13px] font-semibold text-foreground">
                      Notifications
                    </h3>
                    {unreadCount > 0 && (
                      <button
                        onClick={handleMarkAllRead}
                        className="text-[12px] text-primary font-medium hover:underline"
                      >
                        Tout marquer lu
                      </button>
                    )}
                  </div>
                  <div className="max-h-72 overflow-y-auto">
                    {notifications.length === 0 ? (
                      <div className="py-10 text-center text-[13px] text-muted">
                        Aucune notification
                      </div>
                    ) : (
                      notifications.map((n) => (
                        <div
                          key={n.id}
                          className={clsx(
                            "px-4 py-3 border-b border-border last:border-0 transition-colors",
                            !n.isRead && "bg-primary/[0.04]",
                          )}
                        >
                          <div className="flex items-start gap-2.5">
                            {!n.isRead && (
                              <span className="mt-1.5 w-2 h-2 rounded-full bg-primary shrink-0" />
                            )}
                            <div className="min-w-0">
                              <p className="text-[13px] font-medium text-foreground leading-snug">
                                {n.title}
                              </p>
                              <p className="text-[12px] text-muted mt-0.5 line-clamp-2">
                                {n.message}
                              </p>
                              <p className="text-[11px] text-muted-foreground mt-1">
                                {new Date(n.createdAt).toLocaleDateString(
                                  "fr-FR",
                                  {
                                    day: "numeric",
                                    month: "short",
                                    hour: "2-digit",
                                    minute: "2-digit",
                                  },
                                )}
                              </p>
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Separator */}
            <div className="hidden sm:block w-px h-6 bg-border mx-1" />

            {/* User avatar + name */}
            {user && (
              <div className="flex items-center gap-3">
                <div className="text-right hidden sm:block">
                  <p className="text-[13px] font-medium text-foreground leading-tight">
                    {user.firstName} {user.lastName}
                  </p>
                  <p className="text-[11px] text-muted">{user.role?.name}</p>
                </div>
                <div className="w-9 h-9 rounded-full bg-primary/10 text-primary flex items-center justify-center text-[13px] font-semibold">
                  {user.firstName[0]}
                  {user.lastName[0]}
                </div>
              </div>
            )}
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto p-5 lg:p-8">{children}</main>
      </div>
    </div>
  );
}
