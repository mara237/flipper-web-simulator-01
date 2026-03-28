/*
 * FLIPPER WEB SIMULATOR — BadUSB Module
 * Duckyscript editor, virtual terminal, payload library
 */
import { useState, useRef, useEffect } from "react";
import { Terminal, Play, Square, Save, Trash2, Plus, Copy, FileCode } from "lucide-react";
import { toast } from "sonner";

interface Payload {
  id: string;
  name: string;
  content: string;
  timestamp: string;
}

const EXAMPLE_PAYLOADS: Payload[] = [
  {
    id: "1",
    name: "Hello World",
    timestamp: "Exemplo",
    content: `REM Hello World Payload
DELAY 1000
GUI r
DELAY 500
STRING notepad
ENTER
DELAY 1000
STRING Hello from Flipper Web Simulator!
ENTER
STRING Este é um teste do módulo BadUSB.`,
  },
  {
    id: "2",
    name: "Open Browser",
    timestamp: "Exemplo",
    content: `REM Abrir Navegador
DELAY 500
GUI r
DELAY 300
STRING https://flipper.net
ENTER`,
  },
  {
    id: "3",
    name: "System Info",
    timestamp: "Exemplo",
    content: `REM Informações do Sistema
DELAY 500
GUI r
DELAY 300
STRING cmd
ENTER
DELAY 500
STRING systeminfo
ENTER`,
  },
];

// Simplified Duckyscript interpreter
function interpretDuckyscript(script: string): string[] {
  const lines = script.split("\n").map(l => l.trim()).filter(l => l);
  const output: string[] = [];
  let virtualClipboard = "";

  for (const line of lines) {
    if (line.startsWith("REM ")) {
      output.push(`[COMMENT] ${line.slice(4)}`);
    } else if (line.startsWith("STRING ")) {
      const text = line.slice(7);
      output.push(`[TYPE] ${text}`);
    } else if (line.startsWith("DELAY ")) {
      const ms = parseInt(line.slice(6));
      output.push(`[DELAY] ${ms}ms`);
    } else if (line === "ENTER") {
      output.push(`[KEY] ENTER`);
    } else if (line === "SPACE") {
      output.push(`[KEY] SPACE`);
    } else if (line === "TAB") {
      output.push(`[KEY] TAB`);
    } else if (line === "BACKSPACE") {
      output.push(`[KEY] BACKSPACE`);
    } else if (line === "DELETE") {
      output.push(`[KEY] DELETE`);
    } else if (line === "ESCAPE" || line === "ESC") {
      output.push(`[KEY] ESCAPE`);
    } else if (line.startsWith("GUI ")) {
      output.push(`[COMBO] WIN + ${line.slice(4).toUpperCase()}`);
    } else if (line.startsWith("CTRL ")) {
      output.push(`[COMBO] CTRL + ${line.slice(5).toUpperCase()}`);
    } else if (line.startsWith("ALT ")) {
      output.push(`[COMBO] ALT + ${line.slice(4).toUpperCase()}`);
    } else if (line.startsWith("SHIFT ")) {
      output.push(`[COMBO] SHIFT + ${line.slice(6).toUpperCase()}`);
    } else if (line.startsWith("DEFAULTDELAY ") || line.startsWith("DEFAULT_DELAY ")) {
      output.push(`[CONFIG] Default delay set`);
    } else {
      output.push(`[KEY] ${line}`);
    }
  }
  return output;
}

// Syntax highlighting for Duckyscript
function highlightLine(line: string): React.ReactNode {
  if (line.startsWith("REM ")) return <><span style={{ color: "#6a9955" }}>{line}</span></>;
  if (line.startsWith("STRING ")) return <><span style={{ color: "#9cdcfe" }}>STRING </span><span style={{ color: "#ce9178" }}>{line.slice(7)}</span></>;
  if (line.startsWith("DELAY ") || line.startsWith("DEFAULTDELAY ")) return <><span style={{ color: "#c586c0" }}>{line.split(" ")[0]} </span><span style={{ color: "#b5cea8" }}>{line.split(" ")[1]}</span></>;
  if (line.startsWith("GUI ") || line.startsWith("CTRL ") || line.startsWith("ALT ") || line.startsWith("SHIFT ")) {
    const parts = line.split(" ");
    return <><span style={{ color: "#569cd6" }}>{parts[0]} </span><span style={{ color: "#4ec9b0" }}>{parts.slice(1).join(" ")}</span></>;
  }
  if (["ENTER", "SPACE", "TAB", "BACKSPACE", "DELETE", "ESCAPE", "ESC", "UP", "DOWN", "LEFT", "RIGHT"].includes(line)) {
    return <span style={{ color: "#569cd6" }}>{line}</span>;
  }
  return <span style={{ color: "#d4d4d4" }}>{line}</span>;
}

export default function BadUSB() {
  const [script, setScript] = useState(EXAMPLE_PAYLOADS[0].content);
  const [terminalLines, setTerminalLines] = useState<string[]>([]);
  const [running, setRunning] = useState(false);
  const [payloads, setPayloads] = useState<Payload[]>(EXAMPLE_PAYLOADS);
  const [payloadName, setPayloadName] = useState("Meu Payload");
  const [activeTab, setActiveTab] = useState<"editor" | "library">("editor");
  const terminalRef = useRef<HTMLDivElement>(null);
  const runRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (terminalRef.current) {
      terminalRef.current.scrollTop = terminalRef.current.scrollHeight;
    }
  }, [terminalLines]);

  const handleRun = async () => {
    if (running) {
      setRunning(false);
      if (runRef.current) clearTimeout(runRef.current);
      setTerminalLines(l => [...l, "[STOPPED] Execução interrompida pelo usuário."]);
      return;
    }
    setRunning(true);
    setTerminalLines([]);
    const lines = interpretDuckyscript(script);
    setTerminalLines([`[INIT] Iniciando execução de "${payloadName}"...`, "[USB] Dispositivo HID conectado"]);

    for (let i = 0; i < lines.length; i++) {
      if (!running && i > 0) break;
      await new Promise<void>(resolve => {
        runRef.current = setTimeout(() => {
          setTerminalLines(prev => [...prev, lines[i]]);
          resolve();
        }, 80 + Math.random() * 60);
      });
    }
    setTerminalLines(prev => [...prev, "[DONE] Script concluído com sucesso."]);
    setRunning(false);
  };

  const handleSave = () => {
    const p: Payload = {
      id: Date.now().toString(),
      name: payloadName,
      content: script,
      timestamp: new Date().toLocaleTimeString("pt-BR"),
    };
    setPayloads(prev => [p, ...prev.filter(x => !["1","2","3"].includes(x.id))]);
    toast.success(`"${payloadName}" salvo!`);
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(script).then(() => toast.success("Script copiado!"));
  };

  const TABS = [
    { id: "editor", label: "Editor" },
    { id: "library", label: `Biblioteca (${payloads.length})` },
  ] as const;

  return (
    <div className="space-y-4 animate-fade-up">
      <div className="flex items-center gap-3">
        <div className="p-2 rounded-lg" style={{ background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.2)" }}>
          <Terminal className="w-5 h-5 text-red-400" />
        </div>
        <div>
          <h2 className="text-lg font-bold text-foreground">BadUSB</h2>
          <p className="text-xs text-muted-foreground">Editor Duckyscript e Terminal Virtual</p>
        </div>
        {running && <div className="ml-auto inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-mono font-medium" style={{ background: "rgba(239,68,68,0.1)", color: "#f87171", border: "1px solid rgba(239,68,68,0.2)" }}><span className="inline-block w-2 h-2 rounded-full bg-yellow-400 shadow-[0_0_6px_theme(colors.yellow.400)]" /> Executando</div>}
      </div>

      <div className="flex gap-1 p-1 rounded-lg" style={{ background: "oklch(0.13 0.01 240)", border: "1px solid oklch(0.22 0.01 240)" }}>
        {TABS.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex-1 py-1.5 px-3 rounded-md text-sm font-medium transition-all ${activeTab === tab.id ? "bg-red-500/20 text-red-400" : "text-muted-foreground hover:text-foreground"}`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === "editor" && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Editor */}
          <div className="space-y-3">
            <div className="rounded-lg p-4 border border-border space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Duckyscript Editor</p>
                <div className="flex gap-1.5">
                  <button onClick={handleCopy} className="p-1.5 text-muted-foreground hover:text-foreground rounded transition-colors">
                    <Copy className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
              {/* Syntax-highlighted editor simulation */}
              <div className="relative">
                <textarea
                  value={script}
                  onChange={e => setScript(e.target.value)}
                  className="w-full font-mono text-xs resize-none rounded-md p-3 focus:outline-none"
                  style={{
                    background: "oklch(0.07 0.005 240)",
                    border: "1px solid oklch(0.22 0.01 240)",
                    color: "#d4d4d4",
                    minHeight: 280,
                    lineHeight: 1.6,
                  }}
                  rows={14}
                  spellCheck={false}
                />
              </div>
              <div className="flex gap-2">
                <input
                  value={payloadName}
                  onChange={e => setPayloadName(e.target.value)}
                  className="w-full px-3 py-2 rounded-md text-sm border border-border bg-secondary text-foreground font-mono focus:outline-none focus:border-orange-500 flex-1 text-xs"
                  placeholder="Nome do payload"
                />
                <button onClick={handleSave} className="px-4 py-2 rounded-md font-semibold text-sm border border-border text-muted-foreground hover:bg-secondary hover:text-foreground transition-all text-xs flex items-center gap-1">
                  <Save className="w-3.5 h-3.5" /> Salvar
                </button>
              </div>
              <button
                onClick={handleRun}
                className={`w-full flex items-center justify-center gap-2 py-2.5 rounded-md font-semibold text-sm transition-all ${running ? "bg-red-500/20 text-red-400 border border-red-500/30" : "px-4 py-2 rounded-md font-semibold text-sm bg-orange-500 text-white hover:bg-orange-400 transition-all disabled:opacity-50"}`}
              >
                {running ? <><Square className="w-4 h-4" /> Parar</> : <><Play className="w-4 h-4" /> Executar Script</>}
              </button>
            </div>

            {/* Quick reference */}
            <div className="rounded-lg p-4 border border-border">
              <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-2">Referência Rápida</p>
              <div className="grid grid-cols-2 gap-1 text-xs font-mono">
                {[
                  ["REM ...", "Comentário"],
                  ["STRING ...", "Digitar texto"],
                  ["DELAY ms", "Aguardar"],
                  ["ENTER", "Tecla Enter"],
                  ["GUI r", "Win + R"],
                  ["CTRL c", "Ctrl + C"],
                  ["ALT F4", "Alt + F4"],
                  ["SHIFT TAB", "Shift + Tab"],
                ].map(([cmd, desc]) => (
                  <div key={cmd} className="flex gap-2">
                    <span style={{ color: "#569cd6" }}>{cmd}</span>
                    <span className="text-muted-foreground truncate">{desc}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Terminal */}
          <div className="space-y-3">
            <div className="rounded-lg p-4 border border-border">
              <div className="flex items-center justify-between mb-3">
                <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Terminal Virtual</p>
                <button onClick={() => setTerminalLines([])} className="text-xs text-muted-foreground hover:text-foreground transition-colors">
                  Limpar
                </button>
              </div>
              <div
                ref={terminalRef}
                className="rounded-lg p-4 font-mono text-xs bg-black/60 border border-border text-green-400 min-h-[200px] overflow-y-auto"
                style={{ minHeight: 320, maxHeight: 400 }}
              >
                {terminalLines.length === 0 ? (
                  <p className="text-muted-foreground text-xs">Aguardando execução do script...<span className="animate-blink">█</span></p>
                ) : (
                  terminalLines.map((line, i) => {
                    let color = "oklch(0.65 0.18 145)";
                    if (line.startsWith("[COMMENT]")) color = "#6a9955";
                    else if (line.startsWith("[TYPE]")) color = "#9cdcfe";
                    else if (line.startsWith("[DELAY]")) color = "#c586c0";
                    else if (line.startsWith("[COMBO]")) color = "#569cd6";
                    else if (line.startsWith("[KEY]")) color = "#4ec9b0";
                    else if (line.startsWith("[INIT]") || line.startsWith("[USB]")) color = "#ff6b00";
                    else if (line.startsWith("[DONE]")) color = "#3fb950";
                    else if (line.startsWith("[STOPPED]")) color = "#f87171";
                    return (
                      <div key={i} style={{ color, marginBottom: 2 }}>
                        <span style={{ color: "#555", marginRight: 8, fontSize: 10 }}>{String(i).padStart(3, "0")}</span>
                        {line}
                      </div>
                    );
                  })
                )}
                {running && <p className="text-orange-400 text-xs mt-1">Executando<span className="animate-blink">█</span></p>}
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === "library" && (
        <div className="space-y-3">
          {payloads.map(p => (
            <div key={p.id} className="rounded-lg p-4 border border-border">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="p-1.5 rounded-md flex-shrink-0" style={{ background: "rgba(239,68,68,0.1)" }}>
                    <FileCode className="w-4 h-4 text-red-400" />
                  </div>
                  <div className="min-w-0">
                    <p className="font-semibold text-sm text-foreground">{p.name}</p>
                    <p className="text-xs text-muted-foreground">{p.timestamp} · {p.content.split("\n").length} linhas</p>
                  </div>
                </div>
                <div className="flex gap-1.5 flex-shrink-0">
                  <button
                    onClick={() => { setScript(p.content); setPayloadName(p.name); setActiveTab("editor"); }}
                    className="px-4 py-2 rounded-md font-semibold text-sm border border-border text-muted-foreground hover:bg-secondary hover:text-foreground transition-all text-xs py-1 px-2 flex items-center gap-1"
                  >
                    <Play className="w-3.5 h-3.5" /> Abrir
                  </button>
                  {!["1","2","3"].includes(p.id) && (
                    <button onClick={() => setPayloads(prev => prev.filter(x => x.id !== p.id))} className="p-1.5 text-muted-foreground hover:text-red-400 transition-colors">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
              <pre className="mt-2 text-xs font-mono text-muted-foreground overflow-hidden" style={{ maxHeight: 60, maskImage: "linear-gradient(to bottom, black 60%, transparent)" }}>
                {p.content}
              </pre>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
