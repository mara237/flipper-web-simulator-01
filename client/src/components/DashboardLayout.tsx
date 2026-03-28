/*
 * FLIPPER WEB SIMULATOR — DashboardLayout
 * Persistent sidebar with module navigation
 * Design: Cyber Dashboard — sidebar #0d1117, border #30363d, primary orange
 */
import { useState, useEffect } from "react";
import { useLocation, Link } from "wouter";
import {
  Radio,
  CreditCard,
  Terminal,
  Cpu,
  Zap,
  Key,
  Bluetooth,
  FolderOpen,
  Settings,
  LayoutDashboard,
  ChevronLeft,
  ChevronRight,
  Battery,
  Wifi,
  Clock,
  Menu,
  X,
} from "lucide-react";

const NAV_ITEMS = [
  { path: "/", label: "Dashboard", icon: LayoutDashboard, color: "text-orange-400" },
  { path: "/subghz", label: "Sub-GHz", icon: Radio, color: "text-cyan-400" },
  { path: "/nfc", label: "NFC / RFID", icon: CreditCard, color: "text-purple-400" },
  { path: "/badusb", label: "BadUSB", icon: Terminal, color: "text-red-400" },
  { path: "/gpio", label: "GPIO", icon: Cpu, color: "text-yellow-400" },
  { path: "/infrared", label: "Infrared", icon: Zap, color: "text-orange-300" },
  { path: "/ibutton", label: "iButton", icon: Key, color: "text-emerald-400" },
  { path: "/ble", label: "Bluetooth LE", icon: Bluetooth, color: "text-blue-400" },
  { path: "/files", label: "Arquivos", icon: FolderOpen, color: "text-slate-400" },
  { path: "/settings", label: "Configurações", icon: Settings, color: "text-gray-400" },
];

function VirtualClock() {
  const [time, setTime] = useState(new Date());
  useEffect(() => {
    const t = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(t);
  }, []);
  return (
    <span className="font-mono text-xs text-muted-foreground tabular-nums">
      {time.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit", second: "2-digit" })}
    </span>
  );
}

interface DashboardLayoutProps {
  children: React.ReactNode;
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  const [location] = useLocation();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  const sidebarW = collapsed ? "w-16" : "w-60";

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/60 lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`
          fixed lg:relative z-50 lg:z-auto flex flex-col h-full
          ${sidebarW} transition-all duration-300 ease-in-out
          ${mobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}
        `}
        style={{
          background: "oklch(0.11 0.01 240)",
          borderRight: "1px solid oklch(0.22 0.01 240)",
        }}
      >
        {/* Logo */}
        <div
          className="flex items-center gap-3 px-3 py-4 border-b"
          style={{ borderColor: "oklch(0.22 0.01 240)" }}
        >
          <div className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 overflow-hidden"
            style={{ background: "rgba(255,107,0,0.12)", border: "1px solid rgba(255,107,0,0.25)" }}>
            <img
              src="https://d2xsxph8kpxj0f.cloudfront.net/310519663486709659/dQxpGxqm8de3YhCWLyTMQz/fws-dolphin-ioqUMcAihtso5mVXwXWYUB.webp"
              alt="FWS Dolphin"
              className="w-8 h-8 object-contain"
            />
          </div>
          {!collapsed && (
            <div className="min-w-0">
              <p className="text-sm font-bold text-foreground leading-tight truncate">Flipper Web</p>
              <p className="text-xs text-muted-foreground truncate">Simulator v1.0</p>
            </div>
          )}
        </div>

        {/* Status bar */}
        {!collapsed && (
          <div
            className="flex items-center justify-between px-3 py-2 border-b"
            style={{ borderColor: "oklch(0.22 0.01 240)", background: "oklch(0.09 0.008 240)" }}
          >
            <div className="flex items-center gap-1.5">
              <span className="inline-block w-2 h-2 rounded-full bg-green-400 shadow-[0_0_6px_theme(colors.green.400)] animate-pulse" />
              <span className="text-xs text-muted-foreground">Online</span>
            </div>
            <div className="flex items-center gap-2">
              <Battery className="w-3.5 h-3.5 text-green-400" />
              <Wifi className="w-3.5 h-3.5 text-cyan-400" />
              <Clock className="w-3.5 h-3.5 text-muted-foreground" />
              <VirtualClock />
            </div>
          </div>
        )}

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto py-2 px-2">
          {!collapsed && (
            <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground px-2 py-2">Módulos</p>
          )}
          <ul className="space-y-0.5">
            {NAV_ITEMS.map((item) => {
              const Icon = item.icon;
              const isActive = location === item.path;
              return (
                <li key={item.path}>
                  <Link href={item.path}>
                    <div
                      className={`
                        flex items-center gap-3 px-2 py-2.5 rounded-md cursor-pointer
                        transition-all duration-150 group relative
                        ${isActive
                          ? "bg-orange-500/10 text-orange-400 border border-orange-500/20"
                          : "text-muted-foreground hover:text-foreground hover:bg-white/5"
                        }
                      `}
                      onClick={() => setMobileOpen(false)}
                    >
                      <Icon
                        className={`w-4 h-4 flex-shrink-0 ${isActive ? "text-orange-400" : item.color} transition-colors`}
                      />
                      {!collapsed && (
                        <span className="text-sm font-medium truncate">{item.label}</span>
                      )}
                      {isActive && !collapsed && (
                        <span
                          className="absolute right-2 w-1.5 h-1.5 rounded-full"
                          style={{ background: "oklch(0.65 0.22 40)" }}
                        />
                      )}
                      {collapsed && (
                        <div className="absolute left-full ml-2 px-2 py-1 rounded bg-popover border border-border text-xs text-foreground whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50">
                          {item.label}
                        </div>
                      )}
                    </div>
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        {/* Collapse toggle */}
        <div
          className="border-t p-2"
          style={{ borderColor: "oklch(0.22 0.01 240)" }}
        >
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="w-full flex items-center justify-center p-2 rounded-md text-muted-foreground hover:text-foreground hover:bg-white/5 transition-colors hidden lg:flex"
          >
            {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
          </button>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top header */}
        <header
          className="flex items-center gap-3 px-4 py-3 border-b flex-shrink-0"
          style={{
            background: "oklch(0.11 0.01 240)",
            borderColor: "oklch(0.22 0.01 240)",
          }}
        >
          <button
            className="lg:hidden p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-white/5"
            onClick={() => setMobileOpen(!mobileOpen)}
          >
            {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
          <div className="flex-1 min-w-0">
            <h1 className="text-sm font-semibold text-foreground truncate">
              {NAV_ITEMS.find((n) => n.path === location)?.label ?? "Flipper Web Simulator"}
            </h1>
          </div>
          <div className="flex items-center gap-3">
            <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-mono font-medium bg-orange-500/15 text-orange-400 border border-orange-500/25 hidden sm:flex">
              <span className="inline-block w-2 h-2 rounded-full bg-green-400 shadow-[0_0_6px_theme(colors.green.400)] animate-pulse w-1.5 h-1.5" />
              FWS v1.0
            </div>
            <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-mono font-medium bg-cyan-500/12 text-cyan-400 border border-cyan-500/20 hidden sm:flex">
              <span>Simulador Ativo</span>
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto p-4 lg:p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
