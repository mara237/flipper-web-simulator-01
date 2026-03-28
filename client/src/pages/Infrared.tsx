/*
 * FLIPPER WEB SIMULATOR — Infrared Module
 * IR database, learn, transmit, RAW editor
 */
import { useState } from "react";
import { Zap, Radio, Send, Plus, Trash2, Edit3, BookOpen } from "lucide-react";
import { toast } from "sonner";

interface IRCode {
  id: string;
  name: string;
  device: string;
  protocol: string;
  address: string;
  command: string;
  raw?: string;
}

const IR_DATABASE: IRCode[] = [
  { id: "1", name: "Power", device: "TV Samsung", protocol: "NEC", address: "0x0707", command: "0x02FD" },
  { id: "2", name: "Volume +", device: "TV Samsung", protocol: "NEC", address: "0x0707", command: "0x40BF" },
  { id: "3", name: "Volume -", device: "TV Samsung", protocol: "NEC", address: "0x0707", command: "0xC03F" },
  { id: "4", name: "Power", device: "AC LG", protocol: "NEC", address: "0x88", command: "0xC8" },
  { id: "5", name: "Cool 22°C", device: "AC LG", protocol: "NEC", address: "0x88", command: "0xA2" },
  { id: "6", name: "Power", device: "Projetor Epson", protocol: "NEC32", address: "0x6B86", command: "0x0102" },
  { id: "7", name: "Mute", device: "TV LG", protocol: "NEC", address: "0x04", command: "0x09F6" },
  { id: "8", name: "Source", device: "TV Sony", protocol: "SIRC", address: "0x01", command: "0x25" },
];

const DEVICES = ["TV Samsung", "TV LG", "TV Sony", "AC LG", "AC Daikin", "Projetor Epson", "Soundbar JBL", "Personalizado"];
const PROTOCOLS = ["NEC", "NEC32", "SIRC", "RC5", "RC6", "Samsung32", "RAW"];

function generateRaw(): string {
  const pulses = Array.from({ length: 32 }, () => Math.floor(Math.random() * 1000 + 200));
  return pulses.join(" ");
}

export default function Infrared() {
  const [activeTab, setActiveTab] = useState<"db" | "learn" | "transmit" | "raw">("db");
  const [userCodes, setUserCodes] = useState<IRCode[]>([]);
  const [learning, setLearning] = useState(false);
  const [learnedCode, setLearnedCode] = useState<IRCode | null>(null);
  const [newName, setNewName] = useState("Botão Personalizado");
  const [newDevice, setNewDevice] = useState("TV Samsung");
  const [newProtocol, setNewProtocol] = useState("NEC");
  const [newAddress, setNewAddress] = useState("0x0707");
  const [newCommand, setNewCommand] = useState("0x02FD");
  const [rawCode, setRawCode] = useState("");
  const [transmitting, setTransmitting] = useState<string | null>(null);

  const handleLearn = async () => {
    setLearning(true);
    setLearnedCode(null);
    await new Promise(r => setTimeout(r, 2000));
    const protocols = PROTOCOLS.filter(p => p !== "RAW");
    const proto = protocols[Math.floor(Math.random() * protocols.length)];
    const addr = "0x" + Math.floor(Math.random() * 0xFFFF).toString(16).toUpperCase().padStart(4, "0");
    const cmd = "0x" + Math.floor(Math.random() * 0xFFFF).toString(16).toUpperCase().padStart(4, "0");
    const code: IRCode = {
      id: Date.now().toString(),
      name: "Código Aprendido",
      device: "Controle Remoto",
      protocol: proto,
      address: addr,
      command: cmd,
    };
    setLearnedCode(code);
    setLearning(false);
    toast.success(`Código IR aprendido! Protocolo: ${proto}`);
  };

  const handleSaveLearned = () => {
    if (!learnedCode) return;
    setUserCodes(c => [{ ...learnedCode, name: newName, device: newDevice }, ...c]);
    setLearnedCode(null);
    toast.success(`"${newName}" salvo!`);
  };

  const handleTransmit = async (code: IRCode) => {
    setTransmitting(code.id);
    toast.info(`Transmitindo "${code.name}" (${code.device})...`);
    await new Promise(r => setTimeout(r, 1000));
    setTransmitting(null);
    toast.success(`"${code.name}" transmitido com sucesso!`);
  };

  const handleAddCustom = () => {
    const code: IRCode = {
      id: Date.now().toString(),
      name: newName,
      device: newDevice,
      protocol: newProtocol,
      address: newAddress,
      command: newCommand,
    };
    setUserCodes(c => [code, ...c]);
    toast.success(`"${newName}" adicionado!`);
  };

  const handleTransmitRaw = async () => {
    if (!rawCode.trim()) { toast.error("Insira um código RAW válido."); return; }
    toast.info("Transmitindo código RAW...");
    await new Promise(r => setTimeout(r, 1200));
    toast.success("Código RAW transmitido!");
  };

  const TABS = [
    { id: "db", label: "Banco de Dados" },
    { id: "learn", label: "Aprender" },
    { id: "transmit", label: "Transmitir" },
    { id: "raw", label: "Editor RAW" },
  ] as const;

  const allCodes = [...IR_DATABASE, ...userCodes];

  return (
    <div className="space-y-4 animate-fade-up">
      <div className="flex items-center gap-3">
        <div className="p-2 rounded-lg" style={{ background: "rgba(253,186,116,0.1)", border: "1px solid rgba(253,186,116,0.2)" }}>
          <Zap className="w-5 h-5 text-orange-300" />
        </div>
        <div>
          <h2 className="text-lg font-bold text-foreground">Infrared</h2>
          <p className="text-xs text-muted-foreground">Banco de Dados e Transmissor IR</p>
        </div>
      </div>

      <div className="flex gap-1 p-1 rounded-lg" style={{ background: "oklch(0.13 0.01 240)", border: "1px solid oklch(0.22 0.01 240)" }}>
        {TABS.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex-1 py-1.5 px-2 rounded-md text-xs font-medium transition-all ${activeTab === tab.id ? "bg-orange-500/20 text-orange-400" : "text-muted-foreground hover:text-foreground"}`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === "db" && (
        <div className="space-y-2">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {allCodes.map(code => (
              <div key={code.id} className="rounded-lg p-4 border border-border flex items-center gap-3">
                <div className="p-1.5 rounded-md flex-shrink-0" style={{ background: "rgba(253,186,116,0.1)" }}>
                  <Radio className="w-4 h-4 text-orange-300" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground truncate">{code.name}</p>
                  <p className="text-xs text-muted-foreground font-mono truncate">{code.device} · {code.protocol} · {code.command}</p>
                </div>
                <button
                  onClick={() => handleTransmit(code)}
                  disabled={transmitting === code.id}
                  className="flex-shrink-0 p-1.5 rounded-md text-orange-400 hover:bg-orange-500/10 transition-colors disabled:opacity-50"
                >
                  {transmitting === code.id ? <span className="animate-spin text-xs">⟳</span> : <Send className="w-4 h-4" />}
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === "learn" && (
        <div className="space-y-4">
          <div className="rounded-lg p-4 border border-orange-500/20 space-y-4">
            <div className="flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-orange-400" />
              <div>
                <p className="font-semibold text-foreground text-sm">Modo Aprendizado</p>
                <p className="text-xs text-muted-foreground">Aponte um controle remoto virtual e capture o código IR</p>
              </div>
            </div>
            <button
              onClick={handleLearn}
              disabled={learning}
              className={`w-full flex items-center justify-center gap-2 py-3 rounded-md font-semibold text-sm transition-all ${learning ? "bg-orange-500/20 text-orange-400 border border-orange-500/30" : "px-4 py-2 rounded-md font-semibold text-sm bg-orange-500 text-white hover:bg-orange-400 transition-all disabled:opacity-50"}`}
            >
              {learning ? (
                <><span className="animate-pulse">📡</span> Aguardando sinal IR...</>
              ) : (
                <><Radio className="w-4 h-4" /> Iniciar Aprendizado</>
              )}
            </button>
            {learnedCode && (
              <div className="space-y-3 p-3 rounded-md" style={{ background: "rgba(63,185,80,0.08)", border: "1px solid rgba(63,185,80,0.2)" }}>
                <p className="text-xs font-semibold text-green-400">✓ Código Capturado</p>
                <div className="grid grid-cols-2 gap-2 text-xs font-mono">
                  {[["Protocolo", learnedCode.protocol], ["Endereço", learnedCode.address], ["Comando", learnedCode.command]].map(([k, v]) => (
                    <div key={k}>
                      <span className="text-muted-foreground">{k}: </span>
                      <span className="font-mono text-cyan-400">{v}</span>
                    </div>
                  ))}
                </div>
                <div className="flex gap-2">
                  <input value={newName} onChange={e => setNewName(e.target.value)} className="w-full px-3 py-2 rounded-md text-sm border border-border bg-secondary text-foreground font-mono focus:outline-none focus:border-orange-500 flex-1 text-xs" placeholder="Nome" />
                  <select value={newDevice} onChange={e => setNewDevice(e.target.value)} className="w-full px-3 py-2 rounded-md text-sm border border-border bg-secondary text-foreground font-mono focus:outline-none focus:border-orange-500 text-xs">
                    {DEVICES.map(d => <option key={d}>{d}</option>)}
                  </select>
                </div>
                <button onClick={handleSaveLearned} className="w-full px-4 py-2 rounded-md font-semibold text-sm bg-orange-500 text-white hover:bg-orange-400 transition-all disabled:opacity-50 text-xs flex items-center justify-center gap-1">
                  <Plus className="w-3.5 h-3.5" /> Salvar Código
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {activeTab === "transmit" && (
        <div className="space-y-4">
          <div className="rounded-lg p-4 border border-border space-y-3">
            <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Transmitir Código Personalizado</p>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-xs text-muted-foreground">Protocolo</label>
                <select value={newProtocol} onChange={e => setNewProtocol(e.target.value)} className="w-full px-3 py-2 rounded-md text-sm border border-border bg-secondary text-foreground font-mono focus:outline-none focus:border-orange-500 mt-1">
                  {PROTOCOLS.map(p => <option key={p}>{p}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs text-muted-foreground">Dispositivo</label>
                <select value={newDevice} onChange={e => setNewDevice(e.target.value)} className="w-full px-3 py-2 rounded-md text-sm border border-border bg-secondary text-foreground font-mono focus:outline-none focus:border-orange-500 mt-1">
                  {DEVICES.map(d => <option key={d}>{d}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs text-muted-foreground">Endereço (HEX)</label>
                <input value={newAddress} onChange={e => setNewAddress(e.target.value)} className="w-full px-3 py-2 rounded-md text-sm border border-border bg-secondary text-foreground font-mono focus:outline-none focus:border-orange-500 mt-1" />
              </div>
              <div>
                <label className="text-xs text-muted-foreground">Comando (HEX)</label>
                <input value={newCommand} onChange={e => setNewCommand(e.target.value)} className="w-full px-3 py-2 rounded-md text-sm border border-border bg-secondary text-foreground font-mono focus:outline-none focus:border-orange-500 mt-1" />
              </div>
            </div>
            <div className="flex gap-2">
              <button onClick={handleAddCustom} className="px-4 py-2 rounded-md font-semibold text-sm border border-border text-muted-foreground hover:bg-secondary hover:text-foreground transition-all flex items-center gap-1.5 text-sm">
                <Plus className="w-4 h-4" /> Adicionar
              </button>
              <button onClick={() => handleTransmit({ id: "custom", name: newName, device: newDevice, protocol: newProtocol, address: newAddress, command: newCommand })} className="px-4 py-2 rounded-md font-semibold text-sm bg-orange-500 text-white hover:bg-orange-400 transition-all disabled:opacity-50 flex items-center gap-1.5 text-sm flex-1 justify-center">
                <Send className="w-4 h-4" /> Transmitir Agora
              </button>
            </div>
          </div>
          {userCodes.length > 0 && (
            <div className="rounded-lg p-4 border border-border space-y-2">
              <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Meus Códigos ({userCodes.length})</p>
              {userCodes.map(code => (
                <div key={code.id} className="flex items-center gap-3 p-2 rounded" style={{ background: "rgba(255,255,255,0.03)" }}>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-foreground">{code.name}</p>
                    <p className="text-xs text-muted-foreground font-mono">{code.device} · {code.protocol}</p>
                  </div>
                  <button onClick={() => handleTransmit(code)} className="p-1.5 text-orange-400 hover:bg-orange-500/10 rounded transition-colors">
                    <Send className="w-4 h-4" />
                  </button>
                  <button onClick={() => setUserCodes(c => c.filter(x => x.id !== code.id))} className="p-1.5 text-muted-foreground hover:text-red-400 rounded transition-colors">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {activeTab === "raw" && (
        <div className="space-y-4">
          <div className="rounded-lg p-4 border border-border space-y-3">
            <div className="flex items-center justify-between">
              <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Editor de Código RAW</p>
              <button onClick={() => setRawCode(generateRaw())} className="px-4 py-2 rounded-md font-semibold text-sm border border-border text-muted-foreground hover:bg-secondary hover:text-foreground transition-all text-xs flex items-center gap-1">
                <Edit3 className="w-3.5 h-3.5" /> Gerar Exemplo
              </button>
            </div>
            <textarea
              value={rawCode}
              onChange={e => setRawCode(e.target.value)}
              placeholder="Cole ou gere um código RAW (pulsos em microssegundos separados por espaço)..."
              className="w-full px-3 py-2 rounded-md text-sm border border-border bg-secondary text-foreground font-mono focus:outline-none focus:border-orange-500 font-mono text-xs resize-none"
              rows={6}
            />
            <p className="text-xs text-muted-foreground">
              Formato: sequência de pulsos em microssegundos (ex: 9000 4500 560 1690 560 560...)
            </p>
            <button onClick={handleTransmitRaw} className="w-full px-4 py-2 rounded-md font-semibold text-sm bg-orange-500 text-white hover:bg-orange-400 transition-all disabled:opacity-50 flex items-center justify-center gap-2">
              <Send className="w-4 h-4" /> Transmitir RAW
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
