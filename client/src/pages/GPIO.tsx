/*
 * FLIPPER WEB SIMULATOR — GPIO Module
 * Virtual pin panel, LED/button components, MicroPython editor, pin monitor
 */
import { useState } from "react";
import { Cpu, Play, Square, Zap, ToggleLeft, ToggleRight } from "lucide-react";
import { toast } from "sonner";

type PinMode = "INPUT" | "OUTPUT" | "PWM" | "ADC";
interface Pin {
  id: number;
  name: string;
  mode: PinMode;
  value: number; // 0 or 1 for digital, 0-100 for PWM/ADC
  voltage: "3.3V" | "5V" | "GND" | "NC";
}

const INITIAL_PINS: Pin[] = [
  { id: 1, name: "PA7", mode: "OUTPUT", value: 0, voltage: "3.3V" },
  { id: 2, name: "PA6", mode: "OUTPUT", value: 0, voltage: "3.3V" },
  { id: 3, name: "PA4", mode: "INPUT", value: 0, voltage: "3.3V" },
  { id: 4, name: "PB3", mode: "PWM", value: 50, voltage: "3.3V" },
  { id: 5, name: "PB2", mode: "OUTPUT", value: 0, voltage: "3.3V" },
  { id: 6, name: "PC3", mode: "ADC", value: 75, voltage: "3.3V" },
  { id: 7, name: "PC1", mode: "OUTPUT", value: 0, voltage: "3.3V" },
  { id: 8, name: "PC0", mode: "INPUT", value: 0, voltage: "3.3V" },
  { id: 9, name: "GND", mode: "OUTPUT", value: 0, voltage: "GND" },
  { id: 10, name: "3.3V", mode: "OUTPUT", value: 1, voltage: "3.3V" },
  { id: 11, name: "5V", mode: "OUTPUT", value: 1, voltage: "5V" },
  { id: 12, name: "GND", mode: "OUTPUT", value: 0, voltage: "GND" },
];

const EXAMPLE_SCRIPT = `# MicroPython - Flipper GPIO
import time

# Piscar LED no pino PA7
for i in range(10):
    pin_set("PA7", HIGH)
    delay(500)
    pin_set("PA7", LOW)
    delay(500)
    print(f"Ciclo {i+1}/10")

# Ler valor analógico
adc_val = pin_read("PC3")
print(f"ADC PC3: {adc_val}")

# PWM no pino PB3
for duty in range(0, 101, 10):
    pwm_set("PB3", duty)
    delay(100)
    print(f"PWM: {duty}%")
`;

function interpretMicroPython(script: string, pins: Pin[]): string[] {
  const lines = script.split("\n");
  const output: string[] = [">>> Iniciando execução MicroPython..."];
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    if (trimmed.startsWith("print(")) {
      const match = trimmed.match(/print\(f?"(.+?)"\)/);
      if (match) output.push(`>>> ${match[1].replace(/\{.*?\}/g, "[valor]")}`);
    } else if (trimmed.includes("pin_set(")) {
      const match = trimmed.match(/pin_set\("(\w+)",\s*(\w+)\)/);
      if (match) output.push(`>>> GPIO ${match[1]} = ${match[2]}`);
    } else if (trimmed.includes("pin_read(")) {
      const match = trimmed.match(/pin_read\("(\w+)"\)/);
      if (match) {
        const pin = pins.find(p => p.name === match[1]);
        output.push(`>>> GPIO ${match[1]} = ${pin?.value ?? 0}`);
      }
    } else if (trimmed.includes("pwm_set(")) {
      const match = trimmed.match(/pwm_set\("(\w+)",\s*(\d+)\)/);
      if (match) output.push(`>>> PWM ${match[1]} = ${match[2]}%`);
    } else if (trimmed.includes("delay(")) {
      const match = trimmed.match(/delay\((\d+)\)/);
      if (match) output.push(`>>> [DELAY ${match[1]}ms]`);
    }
  }
  output.push(">>> Execução concluída.");
  return output;
}

export default function GPIO() {
  const [pins, setPins] = useState<Pin[]>(INITIAL_PINS);
  const [script, setScript] = useState(EXAMPLE_SCRIPT);
  const [terminalLines, setTerminalLines] = useState<string[]>([]);
  const [running, setRunning] = useState(false);
  const [activeTab, setActiveTab] = useState<"panel" | "script" | "monitor">("panel");

  const togglePin = (id: number) => {
    setPins(prev => prev.map(p => {
      if (p.id !== id || p.mode === "INPUT" || p.voltage === "GND" || p.voltage === "5V" || p.voltage === "3.3V" && p.name === "3.3V") return p;
      const newVal = p.mode === "PWM" ? p.value : (p.value === 0 ? 1 : 0);
      return { ...p, value: newVal };
    }));
  };

  const setPWM = (id: number, value: number) => {
    setPins(prev => prev.map(p => p.id === id ? { ...p, value } : p));
  };

  const handleRun = async () => {
    setRunning(true);
    setTerminalLines([]);
    const lines = interpretMicroPython(script, pins);
    for (let i = 0; i < lines.length; i++) {
      await new Promise(r => setTimeout(r, 100));
      setTerminalLines(prev => [...prev, lines[i]]);
    }
    setRunning(false);
    toast.success("Script MicroPython executado!");
  };

  const TABS = [
    { id: "panel", label: "Painel de Pinos" },
    { id: "script", label: "MicroPython" },
    { id: "monitor", label: "Monitor" },
  ] as const;

  const modeColor: Record<PinMode, string> = {
    OUTPUT: "text-orange-400",
    INPUT: "text-cyan-400",
    PWM: "text-purple-400",
    ADC: "text-yellow-400",
  };

  return (
    <div className="space-y-4 animate-fade-up">
      <div className="flex items-center gap-3">
        <div className="p-2 rounded-lg" style={{ background: "rgba(234,179,8,0.1)", border: "1px solid rgba(234,179,8,0.2)" }}>
          <Cpu className="w-5 h-5 text-yellow-400" />
        </div>
        <div>
          <h2 className="text-lg font-bold text-foreground">GPIO</h2>
          <p className="text-xs text-muted-foreground">Painel de Pinos e Editor MicroPython</p>
        </div>
      </div>

      <div className="flex gap-1 p-1 rounded-lg" style={{ background: "oklch(0.13 0.01 240)", border: "1px solid oklch(0.22 0.01 240)" }}>
        {TABS.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex-1 py-1.5 px-3 rounded-md text-sm font-medium transition-all ${activeTab === tab.id ? "bg-yellow-500/20 text-yellow-400" : "text-muted-foreground hover:text-foreground"}`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === "panel" && (
        <div className="space-y-4">
          {/* Virtual LED indicators */}
          <div className="rounded-lg p-4 border border-border">
            <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-3">Componentes Virtuais</p>
            <div className="flex flex-wrap gap-4 items-center">
              {pins.filter(p => p.mode === "OUTPUT" && p.voltage === "3.3V").slice(0, 5).map(pin => (
                <div key={pin.id} className="flex flex-col items-center gap-1.5 cursor-pointer" onClick={() => togglePin(pin.id)}>
                  <div
                    className="w-8 h-8 rounded-full transition-all duration-200"
                    style={{
                      background: pin.value === 1
                        ? "radial-gradient(circle, #ff6b00 30%, rgba(255,107,0,0.3) 70%)"
                        : "oklch(0.22 0.01 240)",
                      boxShadow: pin.value === 1 ? "0 0 12px rgba(255,107,0,0.6)" : "none",
                      border: "2px solid " + (pin.value === 1 ? "rgba(255,107,0,0.5)" : "oklch(0.3 0.01 240)"),
                    }}
                  />
                  <span className="text-xs font-mono text-muted-foreground">{pin.name}</span>
                  <span className="text-xs" style={{ color: pin.value === 1 ? "#ff6b00" : "oklch(0.4 0.01 240)" }}>
                    {pin.value === 1 ? "HIGH" : "LOW"}
                  </span>
                </div>
              ))}
              {/* Virtual button */}
              <div className="flex flex-col items-center gap-1.5">
                <button
                  className="w-10 h-10 rounded-full transition-all duration-100 active:scale-95"
                  style={{
                    background: "oklch(0.25 0.01 240)",
                    border: "2px solid oklch(0.35 0.01 240)",
                    boxShadow: "0 3px 0 oklch(0.18 0.01 240)",
                  }}
                  onMouseDown={() => setPins(prev => prev.map(p => p.id === 3 ? { ...p, value: 1 } : p))}
                  onMouseUp={() => setPins(prev => prev.map(p => p.id === 3 ? { ...p, value: 0 } : p))}
                >
                  <span className="text-xs text-muted-foreground">BTN</span>
                </button>
                <span className="text-xs font-mono text-muted-foreground">PA4</span>
              </div>
            </div>
          </div>

          {/* Pin table */}
          <div className="rounded-lg p-4 border border-border overflow-x-auto">
            <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-3">Pinos GPIO ({pins.length})</p>
            <table className="w-full text-xs">
              <thead>
                <tr style={{ borderBottom: "1px solid oklch(0.22 0.01 240)" }}>
                  {["Pino", "Nome", "Modo", "Valor", "Controle"].map(h => (
                    <th key={h} className="text-left py-2 px-2 text-muted-foreground font-medium">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {pins.map(pin => (
                  <tr key={pin.id} style={{ borderBottom: "1px solid rgba(255,255,255,0.03)" }}>
                    <td className="py-2 px-2 font-mono text-muted-foreground">{pin.id}</td>
                    <td className="py-2 px-2 font-mono text-foreground">{pin.name}</td>
                    <td className="py-2 px-2">
                      <span className={`font-mono font-medium ${modeColor[pin.mode]}`}>{pin.mode}</span>
                    </td>
                    <td className="py-2 px-2">
                      {pin.mode === "PWM" || pin.mode === "ADC" ? (
                        <span className="font-mono text-cyan-400">{pin.value}%</span>
                      ) : (
                        <span className={pin.value === 1 ? "text-green-400" : "text-muted-foreground"}>
                          {pin.value === 1 ? "HIGH" : "LOW"}
                        </span>
                      )}
                    </td>
                    <td className="py-2 px-2">
                      {pin.mode === "OUTPUT" && pin.voltage === "3.3V" && pin.name !== "3.3V" && (
                        <button onClick={() => togglePin(pin.id)} className="text-muted-foreground hover:text-foreground transition-colors">
                          {pin.value === 1 ? <ToggleRight className="w-5 h-5 text-orange-400" /> : <ToggleLeft className="w-5 h-5" />}
                        </button>
                      )}
                      {pin.mode === "PWM" && (
                        <input
                          type="range"
                          min={0}
                          max={100}
                          value={pin.value}
                          onChange={e => setPWM(pin.id, parseInt(e.target.value))}
                          className="w-20 accent-purple-400"
                        />
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === "script" && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div className="rounded-lg p-4 border border-border space-y-3">
            <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Editor MicroPython</p>
            <textarea
              value={script}
              onChange={e => setScript(e.target.value)}
              className="w-full font-mono text-xs resize-none rounded-md p-3 focus:outline-none"
              style={{
                background: "oklch(0.07 0.005 240)",
                border: "1px solid oklch(0.22 0.01 240)",
                color: "#d4d4d4",
                minHeight: 300,
                lineHeight: 1.6,
              }}
              rows={16}
              spellCheck={false}
            />
            <button
              onClick={handleRun}
              disabled={running}
              className="w-full px-4 py-2 rounded-md font-semibold text-sm bg-orange-500 text-white hover:bg-orange-400 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {running ? <><span className="animate-spin">⟳</span> Executando...</> : <><Play className="w-4 h-4" /> Executar</>}
            </button>
          </div>
          <div className="rounded-lg p-4 border border-border">
            <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-3">Saída</p>
            <div className="rounded-lg p-4 font-mono text-xs bg-black/60 border border-border text-green-400 min-h-[200px] overflow-y-auto" style={{ minHeight: 300 }}>
              {terminalLines.length === 0 ? (
                <p className="text-muted-foreground text-xs">Aguardando execução...<span className="animate-blink">█</span></p>
              ) : (
                terminalLines.map((line, i) => (
                  <div key={i} className="text-xs mb-0.5" style={{ color: line.startsWith(">>> [DELAY") ? "#c586c0" : line.startsWith(">>> GPIO") ? "#9cdcfe" : line.startsWith(">>> PWM") ? "#c586c0" : line.includes("concluída") ? "#3fb950" : "#7bc67e" }}>
                    {line}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {activeTab === "monitor" && (
        <div className="rounded-lg p-4 border border-border">
          <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-3">Monitor de Pinos em Tempo Real</p>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
            {pins.map(pin => (
              <div
                key={pin.id}
                className="p-3 rounded-lg text-center"
                style={{
                  background: pin.value > 0 ? "rgba(255,107,0,0.08)" : "rgba(255,255,255,0.03)",
                  border: `1px solid ${pin.value > 0 ? "rgba(255,107,0,0.2)" : "oklch(0.22 0.01 240)"}`,
                }}
              >
                <p className="font-mono text-sm font-bold text-foreground">{pin.name}</p>
                <p className={`text-xs font-mono mt-1 ${modeColor[pin.mode]}`}>{pin.mode}</p>
                <p className="text-lg font-bold font-mono mt-1" style={{ color: pin.value > 0 ? "#ff6b00" : "oklch(0.4 0.01 240)" }}>
                  {pin.mode === "PWM" || pin.mode === "ADC" ? `${pin.value}%` : pin.value === 1 ? "1" : "0"}
                </p>
                <p className="text-xs text-muted-foreground">{pin.voltage}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
