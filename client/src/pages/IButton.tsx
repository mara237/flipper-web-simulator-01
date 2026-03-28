/*
 * FLIPPER WEB SIMULATOR — iButton Module
 * Key reader, emulator, library
 */
import { useState } from "react";
import { Key, RefreshCw, Play, Trash2, Save, Database } from "lucide-react";
import { toast } from "sonner";

type IButtonType = "DS1990A" | "DS1992" | "DS1996" | "Cyfral" | "Metakom";

interface IButtonKey {
  id: string;
  name: string;
  type: IButtonType;
  uid: string;
  data?: string;
  timestamp: string;
}

const IBUTTON_TYPES: IButtonType[] = ["DS1990A", "DS1992", "DS1996", "Cyfral", "Metakom"];

function randomHex(bytes: number) {
  return Array.from({ length: bytes }, () => Math.floor(Math.random() * 256).toString(16).toUpperCase().padStart(2, "0")).join(" ");
}

function generateKey(type: IButtonType): Omit<IButtonKey, "id" | "name" | "timestamp"> {
  const configs: Record<IButtonType, { uidBytes: number; hasData: boolean }> = {
    DS1990A: { uidBytes: 8, hasData: false },
    DS1992: { uidBytes: 8, hasData: true },
    DS1996: { uidBytes: 8, hasData: true },
    Cyfral: { uidBytes: 2, hasData: false },
    Metakom: { uidBytes: 4, hasData: false },
  };
  const cfg = configs[type];
  return {
    type,
    uid: randomHex(cfg.uidBytes),
    data: cfg.hasData ? randomHex(16) : undefined,
  };
}

export default function IButton() {
  const [selectedType, setSelectedType] = useState<IButtonType>("DS1990A");
  const [currentKey, setCurrentKey] = useState<Omit<IButtonKey, "id" | "name" | "timestamp"> | null>(null);
  const [library, setLibrary] = useState<IButtonKey[]>([]);
  const [emulating, setEmulating] = useState<string | null>(null);
  const [keyName, setKeyName] = useState("Chave Virtual");
  const [activeTab, setActiveTab] = useState<"reader" | "library">("reader");

  const handleRead = () => {
    const key = generateKey(selectedType);
    setCurrentKey(key);
    toast.success(`Chave ${selectedType} lida com sucesso!`);
  };

  const handleSave = () => {
    if (!currentKey) return;
    const saved: IButtonKey = {
      ...currentKey,
      id: Date.now().toString(),
      name: keyName,
      timestamp: new Date().toLocaleTimeString("pt-BR"),
    };
    setLibrary(l => [saved, ...l]);
    toast.success(`"${keyName}" salva na biblioteca!`);
  };

  const handleEmulate = (key: IButtonKey) => {
    if (emulating === key.id) {
      setEmulating(null);
      toast.info("Emulação encerrada.");
    } else {
      setEmulating(key.id);
      toast.success(`Emulando "${key.name}" (${key.type})`);
    }
  };

  const TABS = [
    { id: "reader", label: "Leitor" },
    { id: "library", label: `Biblioteca (${library.length})` },
  ] as const;

  const typeColors: Record<IButtonType, string> = {
    DS1990A: "text-emerald-400",
    DS1992: "text-cyan-400",
    DS1996: "text-blue-400",
    Cyfral: "text-orange-400",
    Metakom: "text-purple-400",
  };

  return (
    <div className="space-y-4 animate-fade-up">
      <div className="flex items-center gap-3">
        <div className="p-2 rounded-lg" style={{ background: "rgba(52,211,153,0.1)", border: "1px solid rgba(52,211,153,0.2)" }}>
          <Key className="w-5 h-5 text-emerald-400" />
        </div>
        <div>
          <h2 className="text-lg font-bold text-foreground">iButton</h2>
          <p className="text-xs text-muted-foreground">Leitor e Emulador de Chaves Dallas/Maxim 1-Wire</p>
        </div>
        {emulating && (
          <div className="ml-auto inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-mono font-medium bg-green-500/12 text-green-400 border border-green-500/20">
            <span className="inline-block w-2 h-2 rounded-full bg-green-400 shadow-[0_0_6px_theme(colors.green.400)] animate-pulse" /> Emulando
          </div>
        )}
      </div>

      <div className="flex gap-1 p-1 rounded-lg" style={{ background: "oklch(0.13 0.01 240)", border: "1px solid oklch(0.22 0.01 240)" }}>
        {TABS.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex-1 py-1.5 px-3 rounded-md text-sm font-medium transition-all ${activeTab === tab.id ? "bg-emerald-500/20 text-emerald-400" : "text-muted-foreground hover:text-foreground"}`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === "reader" && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div className="space-y-4">
            <div className="rounded-lg p-4 border border-border space-y-3">
              <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Tipo de Chave iButton</p>
              <div className="grid grid-cols-1 gap-2">
                {IBUTTON_TYPES.map(t => (
                  <button
                    key={t}
                    onClick={() => setSelectedType(t)}
                    className={`flex items-center gap-3 py-2 px-3 rounded-md border transition-all text-left ${selectedType === t ? "bg-emerald-500/10 border-emerald-500/30" : "bg-white/3 border-border hover:bg-white/5"}`}
                  >
                    <Key className={`w-4 h-4 flex-shrink-0 ${selectedType === t ? "text-emerald-400" : typeColors[t]}`} />
                    <div>
                      <p className={`text-sm font-medium ${selectedType === t ? "text-emerald-400" : "text-foreground"}`}>{t}</p>
                      <p className="text-xs text-muted-foreground">
                        {t === "DS1990A" && "8 bytes UID, sem memória"}
                        {t === "DS1992" && "8 bytes UID + 128 bytes SRAM"}
                        {t === "DS1996" && "8 bytes UID + 512 bytes SRAM"}
                        {t === "Cyfral" && "2 bytes UID, protocolo Cyfral"}
                        {t === "Metakom" && "4 bytes UID, protocolo Metakom"}
                      </p>
                    </div>
                  </button>
                ))}
              </div>
              <button onClick={handleRead} className="w-full px-4 py-2 rounded-md font-semibold text-sm bg-orange-500 text-white hover:bg-orange-400 transition-all disabled:opacity-50 flex items-center justify-center gap-2">
                <RefreshCw className="w-4 h-4" /> Ler Chave Virtual
              </button>
            </div>
          </div>

          <div className="space-y-4">
            {currentKey ? (
              <div className="rounded-lg p-4 border border-cyan-500/20 space-y-3">
                <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Chave Lida</p>
                <div className="space-y-3">
                  {/* Visual key representation */}
                  <div className="flex items-center justify-center py-4">
                    <div
                      className="w-16 h-16 rounded-full flex items-center justify-center"
                      style={{
                        background: "radial-gradient(circle, oklch(0.25 0.01 240) 60%, oklch(0.18 0.01 240) 100%)",
                        border: "3px solid oklch(0.65 0.22 40)",
                        boxShadow: "0 0 20px rgba(255,107,0,0.3)",
                      }}
                    >
                      <Key className="w-8 h-8 text-orange-400" />
                    </div>
                  </div>
                  <div className="space-y-2 font-mono text-xs">
                    {[
                      ["Tipo", currentKey.type],
                      ["UID", currentKey.uid],
                      ...(currentKey.data ? [["Dados", currentKey.data]] : []),
                      ["Protocolo", "1-Wire"],
                    ].map(([k, v]) => (
                      <div key={k} className="flex justify-between items-center py-1.5 border-b border-border/50">
                        <span className="text-muted-foreground">{k}</span>
                        <span className="font-mono text-cyan-400 break-all text-right max-w-48">{v}</span>
                      </div>
                    ))}
                  </div>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={keyName}
                      onChange={e => setKeyName(e.target.value)}
                      placeholder="Nome da chave"
                      className="w-full px-3 py-2 rounded-md text-sm border border-border bg-secondary text-foreground font-mono focus:outline-none focus:border-orange-500 flex-1 text-xs"
                    />
                    <button onClick={handleSave} className="px-4 py-2 rounded-md font-semibold text-sm bg-orange-500 text-white hover:bg-orange-400 transition-all disabled:opacity-50 flex items-center gap-1 text-xs">
                      <Save className="w-3.5 h-3.5" /> Salvar
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="rounded-lg p-4 border border-border text-center py-12">
                <Key className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
                <p className="text-sm text-muted-foreground">Nenhuma chave lida ainda</p>
                <p className="text-xs text-muted-foreground mt-1">Selecione um tipo e clique em "Ler Chave Virtual"</p>
              </div>
            )}
          </div>
        </div>
      )}

      {activeTab === "library" && (
        <div className="space-y-3">
          {library.length === 0 ? (
            <div className="rounded-lg p-4 border border-border text-center py-12">
              <Database className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
              <p className="text-sm text-muted-foreground">Nenhuma chave salva ainda.</p>
              <p className="text-xs text-muted-foreground mt-1">Leia e salve chaves na aba "Leitor".</p>
            </div>
          ) : (
            library.map(key => (
              <div key={key.id} className="rounded-lg p-4 border border-border flex items-center gap-4">
                <div
                  className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0"
                  style={{
                    background: "oklch(0.18 0.01 240)",
                    border: `2px solid ${emulating === key.id ? "oklch(0.65 0.18 145)" : "oklch(0.3 0.01 240)"}`,
                    boxShadow: emulating === key.id ? "0 0 10px rgba(63,185,80,0.3)" : "none",
                  }}
                >
                  <Key className={`w-5 h-5 ${typeColors[key.type]}`} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-sm text-foreground">{key.name}</p>
                  <p className="text-xs text-muted-foreground font-mono truncate">{key.type} · {key.uid} · {key.timestamp}</p>
                </div>
                <div className="flex gap-2 flex-shrink-0">
                  <button
                    onClick={() => handleEmulate(key)}
                    className={`flex items-center gap-1.5 text-xs py-1.5 px-3 rounded-md border transition-all ${emulating === key.id ? "bg-green-500/20 text-green-400 border-green-500/30" : "px-4 py-2 rounded-md font-semibold text-sm border border-border text-muted-foreground hover:bg-secondary hover:text-foreground transition-all"}`}
                  >
                    <Play className="w-3.5 h-3.5" />
                    {emulating === key.id ? "Emulando" : "Emular"}
                  </button>
                  <button onClick={() => setLibrary(l => l.filter(c => c.id !== key.id))} className="p-1.5 text-muted-foreground hover:text-red-400 transition-colors">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
