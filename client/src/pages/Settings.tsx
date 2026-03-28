/*
 * FLIPPER WEB SIMULATOR — Settings Module
 * Device configuration, themes, personalization
 */
import { useState } from "react";
import { Settings as SettingsIcon, Volume2, Sun, Battery, Wifi, Bluetooth, Shield, Info, Palette } from "lucide-react";
import { toast } from "sonner";

interface DeviceSettings {
  volume: number;
  brightness: number;
  vibration: boolean;
  bluetooth: boolean;
  wifi: boolean;
  powerSave: boolean;
  screenTimeout: number;
  language: string;
  theme: string;
  dolphinMood: string;
}

const THEMES = [
  { id: "default", name: "Padrão", colors: ["#ff6b00", "#00d4ff", "#0d1117"] },
  { id: "matrix", name: "Matrix", colors: ["#00ff41", "#003300", "#0a0e0a"] },
  { id: "ocean", name: "Oceano", colors: ["#0ea5e9", "#06b6d4", "#0c1a2e"] },
  { id: "sunset", name: "Pôr do Sol", colors: ["#f97316", "#ec4899", "#1a0a1a"] },
  { id: "forest", name: "Floresta", colors: ["#22c55e", "#84cc16", "#0a1a0a"] },
];

const DOLPHIN_MOODS = ["Feliz 😊", "Animado 🎉", "Curioso 🤔", "Sonolento 😴", "Hacker 😎"];

export default function Settings() {
  const [settings, setSettings] = useState<DeviceSettings>({
    volume: 75,
    brightness: 80,
    vibration: true,
    bluetooth: false,
    wifi: true,
    powerSave: false,
    screenTimeout: 30,
    language: "pt-BR",
    theme: "default",
    dolphinMood: "Feliz 😊",
  });

  const update = (key: keyof DeviceSettings, value: DeviceSettings[keyof DeviceSettings]) => {
    setSettings(prev => ({ ...prev, [key]: value }));
    toast.success(`Configuração "${key}" atualizada!`);
  };

  const handleReset = () => {
    setSettings({
      volume: 75, brightness: 80, vibration: true, bluetooth: false, wifi: true,
      powerSave: false, screenTimeout: 30, language: "pt-BR", theme: "default", dolphinMood: "Feliz 😊",
    });
    toast.success("Configurações restauradas para o padrão!");
  };

  const SliderSetting = ({ label, icon: Icon, settingKey, min = 0, max = 100, step = 5, unit = "%" }: {
    label: string; icon: React.ElementType; settingKey: keyof DeviceSettings; min?: number; max?: number; step?: number; unit?: string;
  }) => (
    <div className="flex items-center gap-4">
      <Icon className="w-4 h-4 text-muted-foreground flex-shrink-0" />
      <div className="flex-1">
        <div className="flex justify-between text-xs mb-1">
          <span className="text-foreground">{label}</span>
          <span className="font-mono text-cyan-400">{settings[settingKey]}{unit}</span>
        </div>
        <input
          type="range"
          min={min}
          max={max}
          step={step}
          value={settings[settingKey] as number}
          onChange={e => update(settingKey, parseInt(e.target.value))}
          className="w-full accent-orange-400"
        />
      </div>
    </div>
  );

  const ToggleSetting = ({ label, icon: Icon, settingKey, description }: {
    label: string; icon: React.ElementType; settingKey: keyof DeviceSettings; description?: string;
  }) => (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-3">
        <Icon className="w-4 h-4 text-muted-foreground flex-shrink-0" />
        <div>
          <p className="text-sm text-foreground">{label}</p>
          {description && <p className="text-xs text-muted-foreground">{description}</p>}
        </div>
      </div>
      <button
        onClick={() => update(settingKey, !settings[settingKey])}
        className={`relative w-10 h-5 rounded-full transition-all duration-200 flex-shrink-0 ${settings[settingKey] ? "bg-orange-500" : "bg-border"}`}
      >
        <span
          className={`absolute top-0.5 w-4 h-4 rounded-full bg-white transition-all duration-200 ${settings[settingKey] ? "left-5.5" : "left-0.5"}`}
          style={{ left: settings[settingKey] ? "calc(100% - 18px)" : "2px" }}
        />
      </button>
    </div>
  );

  return (
    <div className="space-y-4 animate-fade-up">
      <div className="flex items-center gap-3">
        <div className="p-2 rounded-lg" style={{ background: "rgba(156,163,175,0.1)", border: "1px solid rgba(156,163,175,0.2)" }}>
          <SettingsIcon className="w-5 h-5 text-gray-400" />
        </div>
        <div>
          <h2 className="text-lg font-bold text-foreground">Configurações</h2>
          <p className="text-xs text-muted-foreground">Personalização do Dispositivo Virtual</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Device settings */}
        <div className="space-y-4">
          <div className="rounded-lg p-4 border border-border space-y-4">
            <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Dispositivo</p>
            <SliderSetting label="Volume" icon={Volume2} settingKey="volume" />
            <SliderSetting label="Brilho" icon={Sun} settingKey="brightness" />
            <SliderSetting label="Timeout da Tela" icon={Sun} settingKey="screenTimeout" min={10} max={120} step={10} unit="s" />
          </div>

          <div className="rounded-lg p-4 border border-border space-y-4">
            <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Conectividade</p>
            <ToggleSetting label="Bluetooth" icon={Bluetooth} settingKey="bluetooth" description="Habilitar BLE" />
            <ToggleSetting label="Wi-Fi" icon={Wifi} settingKey="wifi" description="Conectividade sem fio" />
            <ToggleSetting label="Modo de Economia" icon={Battery} settingKey="powerSave" description="Reduz consumo de bateria" />
            <ToggleSetting label="Vibração" icon={Shield} settingKey="vibration" description="Feedback háptico" />
          </div>

          <div className="rounded-lg p-4 border border-border space-y-3">
            <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Sistema</p>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Info className="w-4 h-4 text-muted-foreground" />
                <div>
                  <p className="text-sm text-foreground">Idioma</p>
                </div>
              </div>
              <select
                value={settings.language}
                onChange={e => update("language", e.target.value)}
                className="w-full px-3 py-2 rounded-md text-sm border border-border bg-secondary text-foreground font-mono focus:outline-none focus:border-orange-500 text-xs w-32"
              >
                <option value="pt-BR">Português (BR)</option>
                <option value="en-US">English (US)</option>
                <option value="es">Español</option>
                <option value="de">Deutsch</option>
              </select>
            </div>
          </div>
        </div>

        {/* Personalization */}
        <div className="space-y-4">
          <div className="rounded-lg p-4 border border-border space-y-3">
            <div className="flex items-center gap-2">
              <Palette className="w-4 h-4 text-orange-400" />
              <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Tema da Interface</p>
            </div>
            <div className="grid grid-cols-1 gap-2">
              {THEMES.map(theme => (
                <button
                  key={theme.id}
                  onClick={() => update("theme", theme.id)}
                  className={`flex items-center gap-3 p-2.5 rounded-md border transition-all text-left ${settings.theme === theme.id ? "border-orange-500/30 bg-orange-500/10" : "border-border hover:bg-white/5"}`}
                >
                  <div className="flex gap-1 flex-shrink-0">
                    {theme.colors.map((c, i) => (
                      <div key={i} className="w-4 h-4 rounded-full" style={{ background: c }} />
                    ))}
                  </div>
                  <span className={`text-sm ${settings.theme === theme.id ? "text-orange-400 font-medium" : "text-foreground"}`}>
                    {theme.name}
                  </span>
                  {settings.theme === theme.id && <span className="ml-auto text-xs text-orange-400">✓</span>}
                </button>
              ))}
            </div>
          </div>

          <div className="rounded-lg p-4 border border-border space-y-3">
            <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Humor do Golfinho</p>
            <div className="grid grid-cols-1 gap-1.5">
              {DOLPHIN_MOODS.map(mood => (
                <button
                  key={mood}
                  onClick={() => update("dolphinMood", mood)}
                  className={`flex items-center gap-2 p-2 rounded-md border transition-all text-left text-sm ${settings.dolphinMood === mood ? "border-orange-500/30 bg-orange-500/10 text-orange-400" : "border-border hover:bg-white/5 text-foreground"}`}
                >
                  {mood}
                  {settings.dolphinMood === mood && <span className="ml-auto text-xs">✓</span>}
                </button>
              ))}
            </div>
          </div>

          {/* Device info */}
          <div className="rounded-lg p-4 border border-border space-y-2">
            <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Sobre o Dispositivo</p>
            <div className="space-y-1.5 text-xs font-mono">
              {[
                ["Modelo", "Flipper Web Simulator"],
                ["Versão FW", "0.99.1 (dev)"],
                ["Hardware", "Virtual v1.0"],
                ["Build", "2026-03-28"],
                ["Plataforma", "Web (React)"],
              ].map(([k, v]) => (
                <div key={k} className="flex justify-between py-1 border-b border-border/30">
                  <span className="text-muted-foreground">{k}</span>
                  <span className="text-foreground">{v}</span>
                </div>
              ))}
            </div>
          </div>

          <button
            onClick={handleReset}
            className="w-full px-4 py-2 rounded-md font-semibold text-sm border border-border text-muted-foreground hover:bg-secondary hover:text-foreground transition-all text-sm flex items-center justify-center gap-2"
          >
            <SettingsIcon className="w-4 h-4" /> Restaurar Padrões
          </button>
        </div>
      </div>
    </div>
  );
}
