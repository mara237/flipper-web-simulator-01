/*
 * FLIPPER WEB SIMULATOR — NFC/RFID Module
 * Card reader, editor, emulator, brute-force simulator, dump library
 */
import { useState, useRef } from "react";
import { CreditCard, RefreshCw, Play, Save, Trash2, Shield, Database, Edit3 } from "lucide-react";
import { toast } from "sonner";

type CardType = "Mifare Classic 1K" | "Mifare Classic 4K" | "Mifare Ultralight" | "EM-4100" | "HID Prox" | "DESFire EV1";

interface NFCCard {
  id: string;
  name: string;
  type: CardType;
  uid: string;
  atqa: string;
  sak: string;
  blocks: string[];
  timestamp: string;
}

function randomHex(bytes: number) {
  return Array.from({ length: bytes }, () => Math.floor(Math.random() * 256).toString(16).toUpperCase().padStart(2, "0")).join(" ");
}

function generateCard(type: CardType): Omit<NFCCard, "id" | "name" | "timestamp"> {
  const uid = randomHex(type === "EM-4100" ? 5 : 4);
  const configs: Record<CardType, { atqa: string; sak: string; blockCount: number }> = {
    "Mifare Classic 1K": { atqa: "00 04", sak: "08", blockCount: 64 },
    "Mifare Classic 4K": { atqa: "00 02", sak: "18", blockCount: 256 },
    "Mifare Ultralight": { atqa: "00 44", sak: "00", blockCount: 16 },
    "EM-4100": { atqa: "00 00", sak: "00", blockCount: 1 },
    "HID Prox": { atqa: "00 00", sak: "00", blockCount: 1 },
    "DESFire EV1": { atqa: "03 44", sak: "20", blockCount: 28 },
  };
  const cfg = configs[type];
  const blocks = Array.from({ length: Math.min(cfg.blockCount, 16) }, (_, i) => {
    if (i === 0) return uid.replace(/ /g, "") + " " + randomHex(12 - uid.split(" ").length);
    if ((i + 1) % 4 === 0) return "FF FF FF FF FF FF FF 07 80 69 FF FF FF FF FF FF";
    return randomHex(16);
  });
  return { type, uid, atqa: cfg.atqa, sak: cfg.sak, blocks };
}

const CARD_TYPES: CardType[] = ["Mifare Classic 1K", "Mifare Classic 4K", "Mifare Ultralight", "EM-4100", "HID Prox", "DESFire EV1"];

export default function NFC() {
  const [selectedType, setSelectedType] = useState<CardType>("Mifare Classic 1K");
  const [currentCard, setCurrentCard] = useState<Omit<NFCCard, "id" | "name" | "timestamp"> | null>(null);
  const [editingBlock, setEditingBlock] = useState<number | null>(null);
  const [editValue, setEditValue] = useState("");
  const [library, setLibrary] = useState<NFCCard[]>([]);
  const [emulating, setEmulating] = useState<string | null>(null);
  const [bruteForcing, setBruteForcing] = useState(false);
  const [bruteProgress, setBruteProgress] = useState(0);
  const [foundKeys, setFoundKeys] = useState<string[]>([]);
  const [cardName, setCardName] = useState("Cartão Virtual");
  const [activeTab, setActiveTab] = useState<"reader" | "library" | "brute">("reader");
  const bruteRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const handleRead = () => {
    const card = generateCard(selectedType);
    setCurrentCard(card);
    toast.success(`Cartão ${selectedType} lido com sucesso!`);
  };

  const handleSave = () => {
    if (!currentCard) return;
    const saved: NFCCard = {
      ...currentCard,
      id: Date.now().toString(),
      name: cardName,
      timestamp: new Date().toLocaleTimeString("pt-BR"),
    };
    setLibrary(l => [saved, ...l]);
    toast.success(`"${cardName}" salvo na biblioteca!`);
  };

  const handleEditBlock = (i: number) => {
    if (!currentCard) return;
    setEditingBlock(i);
    setEditValue(currentCard.blocks[i]);
  };

  const handleSaveBlock = () => {
    if (!currentCard || editingBlock === null) return;
    const newBlocks = [...currentCard.blocks];
    newBlocks[editingBlock] = editValue;
    setCurrentCard({ ...currentCard, blocks: newBlocks });
    setEditingBlock(null);
    toast.success(`Bloco ${editingBlock} atualizado!`);
  };

  const handleEmulate = (card: NFCCard) => {
    if (emulating === card.id) {
      setEmulating(null);
      toast.info("Emulação encerrada.");
    } else {
      setEmulating(card.id);
      toast.success(`Emulando "${card.name}" (${card.type})`);
    }
  };

  const handleBruteForce = () => {
    if (bruteForcing) {
      if (bruteRef.current) clearInterval(bruteRef.current);
      setBruteForcing(false);
      setBruteProgress(0);
      return;
    }
    setBruteForcing(true);
    setBruteProgress(0);
    setFoundKeys([]);
    let progress = 0;
    bruteRef.current = setInterval(() => {
      progress += Math.random() * 3 + 1;
      if (progress >= 100) {
        progress = 100;
        clearInterval(bruteRef.current!);
        setBruteForcing(false);
        const keys = [
          "FF FF FF FF FF FF (Padrão)",
          "A0 A1 A2 A3 A4 A5 (Setor 0)",
          "B0 B1 B2 B3 B4 B5 (Setor 1)",
        ];
        setFoundKeys(keys);
        toast.success("Ataque de dicionário concluído! 3 chaves encontradas.");
      }
      setBruteProgress(Math.min(100, progress));
    }, 120);
  };

  const TABS = [
    { id: "reader", label: "Leitor / Editor" },
    { id: "library", label: `Biblioteca (${library.length})` },
    { id: "brute", label: "Brute-Force" },
  ] as const;

  return (
    <div className="space-y-4 animate-fade-up">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="p-2 rounded-lg" style={{ background: "rgba(168,85,247,0.1)", border: "1px solid rgba(168,85,247,0.2)" }}>
          <CreditCard className="w-5 h-5 text-purple-400" />
        </div>
        <div>
          <h2 className="text-lg font-bold text-foreground">NFC / RFID</h2>
          <p className="text-xs text-muted-foreground">Leitor, Emulador e Analisador de Cartões</p>
        </div>
        {emulating && (
          <div className="ml-auto inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-mono font-medium bg-green-500/12 text-green-400 border border-green-500/20">
            <span className="inline-block w-2 h-2 rounded-full bg-green-400 shadow-[0_0_6px_theme(colors.green.400)] animate-pulse" /> Emulando
          </div>
        )}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 p-1 rounded-lg" style={{ background: "oklch(0.13 0.01 240)", border: "1px solid oklch(0.22 0.01 240)" }}>
        {TABS.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex-1 py-1.5 px-3 rounded-md text-sm font-medium transition-all ${activeTab === tab.id ? "bg-purple-500/20 text-purple-400" : "text-muted-foreground hover:text-foreground"}`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === "reader" && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Controls */}
          <div className="space-y-4">
            <div className="rounded-lg p-4 border border-border space-y-3">
              <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Tipo de Cartão</p>
              <div className="grid grid-cols-2 gap-2">
                {CARD_TYPES.map(t => (
                  <button
                    key={t}
                    onClick={() => setSelectedType(t)}
                    className={`text-xs py-1.5 px-2 rounded-md border transition-all text-left ${selectedType === t ? "bg-purple-500/20 text-purple-400 border-purple-500/30" : "bg-white/3 text-muted-foreground border-border hover:text-foreground"}`}
                  >
                    {t}
                  </button>
                ))}
              </div>
              <button onClick={handleRead} className="w-full px-4 py-2 rounded-md font-semibold text-sm bg-orange-500 text-white hover:bg-orange-400 transition-all disabled:opacity-50 flex items-center justify-center gap-2">
                <RefreshCw className="w-4 h-4" /> Ler Cartão Virtual
              </button>
            </div>

            {currentCard && (
              <div className="rounded-lg p-4 border border-border space-y-3">
                <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Dados do Cartão</p>
                <div className="space-y-2 font-mono text-xs">
                  {[
                    ["Tipo", currentCard.type],
                    ["UID", currentCard.uid],
                    ["ATQA", currentCard.atqa],
                    ["SAK", currentCard.sak],
                  ].map(([k, v]) => (
                    <div key={k} className="flex justify-between items-center py-1 border-b border-border/50">
                      <span className="text-muted-foreground">{k}</span>
                      <span className="font-mono text-cyan-400">{v}</span>
                    </div>
                  ))}
                </div>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={cardName}
                    onChange={e => setCardName(e.target.value)}
                    placeholder="Nome do cartão"
                    className="w-full px-3 py-2 rounded-md text-sm border border-border bg-secondary text-foreground font-mono focus:outline-none focus:border-orange-500 flex-1 text-xs"
                  />
                  <button onClick={handleSave} className="px-4 py-2 rounded-md font-semibold text-sm bg-orange-500 text-white hover:bg-orange-400 transition-all disabled:opacity-50 flex items-center gap-1 text-xs">
                    <Save className="w-3.5 h-3.5" /> Salvar
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Block Editor */}
          {currentCard && (
            <div className="rounded-lg p-4 border border-border">
              <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-3">Editor de Blocos</p>
              <div className="space-y-1 max-h-80 overflow-y-auto">
                {currentCard.blocks.map((block, i) => (
                  <div key={i}>
                    {editingBlock === i ? (
                      <div className="flex gap-2 p-1">
                        <input
                          value={editValue}
                          onChange={e => setEditValue(e.target.value)}
                          className="w-full px-3 py-2 rounded-md text-sm border border-border bg-secondary text-foreground font-mono focus:outline-none focus:border-orange-500 flex-1 text-xs font-mono"
                        />
                        <button onClick={handleSaveBlock} className="px-4 py-2 rounded-md font-semibold text-sm bg-orange-500 text-white hover:bg-orange-400 transition-all disabled:opacity-50 text-xs py-1 px-2">OK</button>
                        <button onClick={() => setEditingBlock(null)} className="px-4 py-2 rounded-md font-semibold text-sm border border-border text-muted-foreground hover:bg-secondary hover:text-foreground transition-all text-xs py-1 px-2">✕</button>
                      </div>
                    ) : (
                      <div
                        className="flex items-center gap-2 px-2 py-1.5 rounded text-xs font-mono group cursor-pointer hover:bg-white/5"
                        onClick={() => handleEditBlock(i)}
                      >
                        <span className="text-muted-foreground w-6 text-right flex-shrink-0">{i}</span>
                        <span className={`flex-1 truncate ${(i + 1) % 4 === 0 ? "text-red-400" : "font-mono text-cyan-400"}`}>{block}</span>
                        <Edit3 className="w-3 h-3 text-muted-foreground opacity-0 group-hover:opacity-100 flex-shrink-0" />
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {activeTab === "library" && (
        <div className="space-y-3">
          {library.length === 0 ? (
            <div className="rounded-lg p-4 border border-border text-center py-12">
              <Database className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
              <p className="text-sm text-muted-foreground">Nenhum cartão salvo ainda.</p>
              <p className="text-xs text-muted-foreground mt-1">Leia e salve cartões na aba "Leitor".</p>
            </div>
          ) : (
            library.map(card => (
              <div key={card.id} className="rounded-lg p-4 border border-border flex items-center gap-4">
                <div className="p-2 rounded-lg flex-shrink-0" style={{ background: "rgba(168,85,247,0.1)" }}>
                  <CreditCard className="w-5 h-5 text-purple-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-sm text-foreground">{card.name}</p>
                  <p className="text-xs text-muted-foreground font-mono">{card.type} · UID: {card.uid} · {card.timestamp}</p>
                </div>
                <div className="flex gap-2 flex-shrink-0">
                  <button
                    onClick={() => handleEmulate(card)}
                    className={`flex items-center gap-1.5 text-xs py-1.5 px-3 rounded-md border transition-all ${emulating === card.id ? "bg-green-500/20 text-green-400 border-green-500/30" : "px-4 py-2 rounded-md font-semibold text-sm border border-border text-muted-foreground hover:bg-secondary hover:text-foreground transition-all"}`}
                  >
                    <Play className="w-3.5 h-3.5" />
                    {emulating === card.id ? "Emulando" : "Emular"}
                  </button>
                  <button onClick={() => setLibrary(l => l.filter(c => c.id !== card.id))} className="p-1.5 text-muted-foreground hover:text-red-400 transition-colors">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {activeTab === "brute" && (
        <div className="space-y-4">
          <div className="rounded-lg p-4 border border-cyan-500/20 space-y-4">
            <div className="flex items-center gap-2">
              <Shield className="w-5 h-5 text-cyan-400" />
              <div>
                <p className="font-semibold text-foreground text-sm">Ataque de Dicionário — Mifare Classic</p>
                <p className="text-xs text-muted-foreground">Simula tentativas de chaves padrão nos setores do cartão</p>
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between text-xs">
                <span className="text-muted-foreground">Progresso</span>
                <span className="font-mono text-cyan-400">{bruteProgress.toFixed(1)}%</span>
              </div>
              <div className="h-2 rounded-full overflow-hidden" style={{ background: "oklch(0.18 0.01 240)" }}>
                <div
                  className="h-full rounded-full transition-all duration-300"
                  style={{
                    width: `${bruteProgress}%`,
                    background: bruteForcing
                      ? "linear-gradient(90deg, #00d4ff, #ff6b00)"
                      : foundKeys.length > 0
                      ? "oklch(0.65 0.18 145)"
                      : "oklch(0.65 0.22 40)",
                  }}
                />
              </div>
            </div>
            <button
              onClick={handleBruteForce}
              className={`w-full flex items-center justify-center gap-2 py-2.5 rounded-md font-semibold text-sm transition-all ${bruteForcing ? "bg-red-500/20 text-red-400 border border-red-500/30" : "px-4 py-2 rounded-md font-semibold text-sm bg-cyan-400 text-gray-900 hover:bg-cyan-300 transition-all"}`}
            >
              {bruteForcing ? <><span className="animate-spin">⟳</span> Parar Ataque</> : <><Shield className="w-4 h-4" /> Iniciar Brute-Force</>}
            </button>
            {foundKeys.length > 0 && (
              <div className="space-y-1.5">
                <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Chaves Encontradas</p>
                {foundKeys.map((k, i) => (
                  <div key={i} className="flex items-center gap-2 p-2 rounded text-xs font-mono" style={{ background: "rgba(63,185,80,0.08)", border: "1px solid rgba(63,185,80,0.2)" }}>
                    <span className="text-green-400">✓</span>
                    <span className="text-foreground">{k}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
