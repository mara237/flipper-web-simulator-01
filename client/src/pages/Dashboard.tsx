/*
 * FLIPPER WEB SIMULATOR — Dashboard Page
 * Hero section with device overview and module shortcuts
 */
import { Link } from "wouter";
import {
  Radio, CreditCard, Terminal, Cpu, Zap, Key, Bluetooth, FolderOpen,
  Activity, Shield, Wifi, Battery, Thermometer, Clock,
} from "lucide-react";
import { useState, useEffect } from "react";

const MODULES = [
  {
    path: "/subghz",
    label: "Sub-GHz",
    description: "Escuta e transmissão de sinais de rádio frequência",
    icon: Radio,
    color: "text-cyan-400",
    bg: "rgba(0,212,255,0.08)",
    border: "rgba(0,212,255,0.2)",
    glow: "rgba(0,212,255,0.15)",
    stat: "433.92 MHz",
  },
  {
    path: "/nfc",
    label: "NFC / RFID",
    description: "Leitura, emulação e análise de cartões NFC e RFID",
    icon: CreditCard,
    color: "text-purple-400",
    bg: "rgba(168,85,247,0.08)",
    border: "rgba(168,85,247,0.2)",
    glow: "rgba(168,85,247,0.15)",
    stat: "13.56 MHz",
  },
  {
    path: "/badusb",
    label: "BadUSB",
    description: "Editor e executor de scripts Duckyscript",
    icon: Terminal,
    color: "text-red-400",
    bg: "rgba(239,68,68,0.08)",
    border: "rgba(239,68,68,0.2)",
    glow: "rgba(239,68,68,0.15)",
    stat: "HID Emulator",
  },
  {
    path: "/gpio",
    label: "GPIO",
    description: "Controle de pinos de entrada e saída de propósito geral",
    icon: Cpu,
    color: "text-yellow-400",
    bg: "rgba(234,179,8,0.08)",
    border: "rgba(234,179,8,0.2)",
    glow: "rgba(234,179,8,0.15)",
    stat: "18 Pinos",
  },
  {
    path: "/infrared",
    label: "Infrared",
    description: "Banco de dados e transmissão de códigos IR",
    icon: Zap,
    color: "text-orange-300",
    bg: "rgba(253,186,116,0.08)",
    border: "rgba(253,186,116,0.2)",
    glow: "rgba(253,186,116,0.15)",
    stat: "38 kHz",
  },
  {
    path: "/ibutton",
    label: "iButton",
    description: "Leitura e emulação de chaves iButton Dallas/Maxim",
    icon: Key,
    color: "text-emerald-400",
    bg: "rgba(52,211,153,0.08)",
    border: "rgba(52,211,153,0.2)",
    glow: "rgba(52,211,153,0.15)",
    stat: "1-Wire",
  },
  {
    path: "/ble",
    label: "Bluetooth LE",
    description: "Scanner e interação com dispositivos BLE próximos",
    icon: Bluetooth,
    color: "text-blue-400",
    bg: "rgba(96,165,250,0.08)",
    border: "rgba(96,165,250,0.2)",
    glow: "rgba(96,165,250,0.15)",
    stat: "2.4 GHz",
  },
  {
    path: "/files",
    label: "Arquivos",
    description: "Sistema de arquivos virtual do cartão SD do Flipper",
    icon: FolderOpen,
    color: "text-slate-400",
    bg: "rgba(148,163,184,0.08)",
    border: "rgba(148,163,184,0.2)",
    glow: "rgba(148,163,184,0.15)",
    stat: "Virtual SD",
  },
];

function AnimatedCounter({ value, suffix = "" }: { value: number; suffix?: string }) {
  const [count, setCount] = useState(0);
  useEffect(() => {
    const step = value / 40;
    let current = 0;
    const t = setInterval(() => {
      current += step;
      if (current >= value) { setCount(value); clearInterval(t); }
      else setCount(Math.floor(current));
    }, 20);
    return () => clearInterval(t);
  }, [value]);
  return <span>{count}{suffix}</span>;
}

export default function Dashboard() {
  const [uptime, setUptime] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setUptime(u => u + 1), 1000);
    return () => clearInterval(t);
  }, []);

  const formatUptime = (s: number) => {
    const h = Math.floor(s / 3600);
    const m = Math.floor((s % 3600) / 60);
    const sec = s % 60;
    return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(sec).padStart(2, "0")}`;
  };

  return (
    <div className="space-y-6 animate-fade-up">
      {/* Hero Banner */}
      <div
        className="relative rounded-xl overflow-hidden"
        style={{ minHeight: 200 }}
      >
        <img
          src="https://d2xsxph8kpxj0f.cloudfront.net/310519663486709659/dQxpGxqm8de3YhCWLyTMQz/fws-hero-bg-B3SdzkuSjNqSEu5kYafHAA.webp"
          alt="FWS Hero"
          className="absolute inset-0 w-full h-full object-cover"
        />
        <div
          className="absolute inset-0"
          style={{ background: "linear-gradient(135deg, rgba(13,17,23,0.85) 0%, rgba(13,17,23,0.6) 100%)" }}
        />
        <div className="relative z-10 flex items-center gap-6 p-6 lg:p-8">
          <img
            src="https://d2xsxph8kpxj0f.cloudfront.net/310519663486709659/dQxpGxqm8de3YhCWLyTMQz/fws-dolphin-ioqUMcAihtso5mVXwXWYUB.webp"
            alt="FWS Dolphin"
            className="w-20 h-20 lg:w-28 lg:h-28 object-contain flex-shrink-0 drop-shadow-2xl"
          />
          <div>
            <h1 className="text-2xl lg:text-4xl font-bold text-white leading-tight">
              Flipper Web Simulator
            </h1>
            <p className="text-sm lg:text-base mt-1" style={{ color: "rgba(230,237,243,0.75)" }}>
              O gêmeo digital do Flipper Zero — explore todas as funcionalidades sem precisar do dispositivo físico
            </p>
            <div className="flex flex-wrap gap-2 mt-3">
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-mono font-medium bg-orange-500/15 text-orange-400 border border-orange-500/25">
                <Activity className="w-3 h-3" /> Simulador Ativo
              </span>
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-mono font-medium bg-cyan-500/12 text-cyan-400 border border-cyan-500/20">
                <Shield className="w-3 h-3" /> Modo Educacional
              </span>
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-mono font-medium bg-green-500/12 text-green-400 border border-green-500/20">
                <Wifi className="w-3 h-3" /> 8 Módulos
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Status Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: "Uptime", value: formatUptime(uptime), icon: Clock, color: "text-cyan-400" },
          { label: "Bateria Virtual", value: "87%", icon: Battery, color: "text-green-400" },
          { label: "Temperatura", value: "36°C", icon: Thermometer, color: "text-orange-400" },
          { label: "Módulos", value: "8 ativos", icon: Activity, color: "text-purple-400" },
        ].map((stat) => {
          const Icon = stat.icon;
          return (
            <div key={stat.label} className="rounded-lg p-4 border border-border flex items-center gap-3">
              <div className="p-2 rounded-lg" style={{ background: "rgba(255,255,255,0.05)" }}>
                <Icon className={`w-4 h-4 ${stat.color}`} />
              </div>
              <div className="min-w-0">
                <p className="text-xs text-muted-foreground">{stat.label}</p>
                <p className="text-sm font-semibold text-foreground font-mono truncate">{stat.value}</p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Modules Grid */}
      <div>
        <h2 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-3">Módulos Disponíveis</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
          {MODULES.map((mod, i) => {
            const Icon = mod.icon;
            return (
              <Link key={mod.path} href={mod.path}>
                <div
                  className="rounded-lg p-4 cursor-pointer transition-all duration-200 group"
                  style={{
                    background: mod.bg,
                    border: `1px solid ${mod.border}`,
                    animationDelay: `${i * 50}ms`,
                  }}
                  onMouseEnter={(e) => {
                    (e.currentTarget as HTMLElement).style.boxShadow = `0 0 20px ${mod.glow}`;
                  }}
                  onMouseLeave={(e) => {
                    (e.currentTarget as HTMLElement).style.boxShadow = "none";
                  }}
                >
                  <div className="flex items-start justify-between mb-3">
                    <div
                      className="p-2 rounded-lg"
                      style={{ background: "rgba(255,255,255,0.06)" }}
                    >
                      <Icon className={`w-5 h-5 ${mod.color}`} />
                    </div>
                    <span
                      className="text-xs font-mono px-2 py-0.5 rounded"
                      style={{ background: "rgba(255,255,255,0.06)", color: "oklch(0.55 0.01 240)" }}
                    >
                      {mod.stat}
                    </span>
                  </div>
                  <h3 className="font-semibold text-foreground text-sm mb-1 group-hover:text-white transition-colors">
                    {mod.label}
                  </h3>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    {mod.description}
                  </p>
                </div>
              </Link>
            );
          })}
        </div>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: "Sinais RF Capturados", value: 0, suffix: "" },
          { label: "Cartões NFC Virtuais", value: 0, suffix: "" },
          { label: "Scripts BadUSB", value: 0, suffix: "" },
        ].map((s) => (
          <div key={s.label} className="rounded-lg p-4 border border-border text-center">
            <p className="text-2xl font-bold font-mono" style={{ color: "oklch(0.65 0.22 40)" }}>
              <AnimatedCounter value={s.value} suffix={s.suffix} />
            </p>
            <p className="text-xs text-muted-foreground mt-1">{s.label}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
