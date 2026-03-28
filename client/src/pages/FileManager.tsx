/*
 * FLIPPER WEB SIMULATOR — File Manager Module
 * Virtual SD card filesystem, upload/download, firmware update simulation
 */
import { useState } from "react";
import {
  FolderOpen, Folder, FileText, File, Upload, Download, Trash2,
  ChevronRight, HardDrive, RefreshCw, Plus,
} from "lucide-react";
import { toast } from "sonner";

interface VirtualFile {
  id: string;
  name: string;
  type: "file" | "folder";
  size?: number;
  content?: string;
  children?: VirtualFile[];
  modified: string;
  extension?: string;
}

const INITIAL_FS: VirtualFile[] = [
  {
    id: "1", name: "subghz", type: "folder", modified: "28/03/2026",
    children: [
      { id: "1a", name: "garage_door.sub", type: "file", size: 256, modified: "28/03/2026", extension: "sub", content: "Filetype: Flipper SubGhz Key File\nVersion: 1\nFrequency: 433920000\nPreset: FuriHalSubGhzPresetOok650Async\nProtocol: Keeloq\nBit: 64\nKey: 0xDEADBEEF12345678" },
      { id: "1b", name: "car_alarm.sub", type: "file", size: 312, modified: "27/03/2026", extension: "sub" },
    ],
  },
  {
    id: "2", name: "nfc", type: "folder", modified: "28/03/2026",
    children: [
      { id: "2a", name: "mifare_card.nfc", type: "file", size: 1024, modified: "28/03/2026", extension: "nfc" },
      { id: "2b", name: "em4100_key.rfid", type: "file", size: 128, modified: "26/03/2026", extension: "rfid" },
    ],
  },
  {
    id: "3", name: "badusb", type: "folder", modified: "28/03/2026",
    children: [
      { id: "3a", name: "hello_world.txt", type: "file", size: 180, modified: "28/03/2026", extension: "txt", content: "REM Hello World\nDELAY 1000\nGUI r\nSTRING notepad\nENTER" },
      { id: "3b", name: "open_browser.txt", type: "file", size: 95, modified: "27/03/2026", extension: "txt" },
    ],
  },
  {
    id: "4", name: "infrared", type: "folder", modified: "28/03/2026",
    children: [
      { id: "4a", name: "samsung_tv.ir", type: "file", size: 512, modified: "28/03/2026", extension: "ir" },
      { id: "4b", name: "lg_ac.ir", type: "file", size: 768, modified: "25/03/2026", extension: "ir" },
    ],
  },
  {
    id: "5", name: "ibutton", type: "folder", modified: "28/03/2026",
    children: [
      { id: "5a", name: "office_key.ibtn", type: "file", size: 64, modified: "28/03/2026", extension: "ibtn" },
    ],
  },
  { id: "6", name: "apps", type: "folder", modified: "28/03/2026", children: [] },
  { id: "7", name: "dolphin", type: "folder", modified: "28/03/2026", children: [] },
];

function formatSize(bytes?: number) {
  if (!bytes) return "-";
  if (bytes < 1024) return `${bytes} B`;
  return `${(bytes / 1024).toFixed(1)} KB`;
}

const EXT_COLORS: Record<string, string> = {
  sub: "text-cyan-400", nfc: "text-purple-400", rfid: "text-purple-400",
  ir: "text-orange-300", ibtn: "text-emerald-400", txt: "text-yellow-400",
  py: "text-blue-400", js: "text-yellow-300",
};

export default function FileManager() {
  const [fs, setFs] = useState<VirtualFile[]>(INITIAL_FS);
  const [currentPath, setCurrentPath] = useState<string[]>([]);
  const [selectedFile, setSelectedFile] = useState<VirtualFile | null>(null);
  const [firmwareUpdating, setFirmwareUpdating] = useState(false);
  const [firmwareProgress, setFirmwareProgress] = useState(0);
  const [activeTab, setActiveTab] = useState<"files" | "firmware">("files");

  const getCurrentFolder = (): VirtualFile[] => {
    if (currentPath.length === 0) return fs;
    let current = fs;
    for (const segment of currentPath) {
      const folder = current.find(f => f.name === segment && f.type === "folder");
      if (!folder?.children) return [];
      current = folder.children;
    }
    return current;
  };

  const currentFiles = getCurrentFolder();
  const totalSize = fs.reduce((acc, f) => acc + (f.children?.reduce((a, c) => a + (c.size || 0), 0) || 0), 0);

  const handleNavigate = (folder: VirtualFile) => {
    if (folder.type === "folder") {
      setCurrentPath([...currentPath, folder.name]);
      setSelectedFile(null);
    } else {
      setSelectedFile(folder);
    }
  };

  const handleBack = () => {
    setCurrentPath(currentPath.slice(0, -1));
    setSelectedFile(null);
  };

  const handleDelete = (file: VirtualFile) => {
    toast.success(`"${file.name}" removido.`);
    setSelectedFile(null);
  };

  const handleDownload = (file: VirtualFile) => {
    const content = file.content || `# ${file.name}\n# Arquivo virtual do Flipper Web Simulator`;
    const blob = new Blob([content], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = file.name;
    a.click();
    URL.revokeObjectURL(url);
    toast.success(`"${file.name}" baixado!`);
  };

  const handleUpload = () => {
    const input = document.createElement("input");
    input.type = "file";
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;
      const newFile: VirtualFile = {
        id: Date.now().toString(),
        name: file.name,
        type: "file",
        size: file.size,
        modified: new Date().toLocaleDateString("pt-BR"),
        extension: file.name.split(".").pop(),
      };
      toast.success(`"${file.name}" enviado para /${currentPath.join("/") || "SD"}`);
    };
    input.click();
  };

  const handleFirmwareUpdate = async () => {
    setFirmwareUpdating(true);
    setFirmwareProgress(0);
    const steps = [
      "Verificando integridade do firmware...",
      "Fazendo backup das configurações...",
      "Apagando memória flash...",
      "Gravando novo firmware...",
      "Verificando escrita...",
      "Reiniciando dispositivo...",
    ];
    for (let i = 0; i < steps.length; i++) {
      await new Promise(r => setTimeout(r, 800));
      setFirmwareProgress(Math.round(((i + 1) / steps.length) * 100));
      toast.info(steps[i]);
    }
    setFirmwareUpdating(false);
    toast.success("Firmware atualizado com sucesso! Versão: 0.99.1 (dev)");
  };

  const TABS = [
    { id: "files", label: "Sistema de Arquivos" },
    { id: "firmware", label: "Firmware" },
  ] as const;

  return (
    <div className="space-y-4 animate-fade-up">
      <div className="flex items-center gap-3">
        <div className="p-2 rounded-lg" style={{ background: "rgba(148,163,184,0.1)", border: "1px solid rgba(148,163,184,0.2)" }}>
          <FolderOpen className="w-5 h-5 text-slate-400" />
        </div>
        <div>
          <h2 className="text-lg font-bold text-foreground">Gerenciador de Arquivos</h2>
          <p className="text-xs text-muted-foreground">Sistema de Arquivos Virtual do Cartão SD</p>
        </div>
        <div className="ml-auto flex items-center gap-2">
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-mono font-medium bg-cyan-500/12 text-cyan-400 border border-cyan-500/20 text-xs">
            <HardDrive className="w-3 h-3" /> {formatSize(totalSize)} usados
          </span>
        </div>
      </div>

      <div className="flex gap-1 p-1 rounded-lg" style={{ background: "oklch(0.13 0.01 240)", border: "1px solid oklch(0.22 0.01 240)" }}>
        {TABS.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex-1 py-1.5 px-3 rounded-md text-sm font-medium transition-all ${activeTab === tab.id ? "bg-slate-500/20 text-slate-300" : "text-muted-foreground hover:text-foreground"}`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === "files" && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* File browser */}
          <div className="lg:col-span-2 rounded-lg p-4 border border-border">
            {/* Breadcrumb */}
            <div className="flex items-center gap-1 mb-3 text-sm">
              <button
                onClick={() => { setCurrentPath([]); setSelectedFile(null); }}
                className="text-orange-400 hover:text-orange-300 transition-colors font-medium"
              >
                SD
              </button>
              {currentPath.map((segment, i) => (
                <span key={i} className="flex items-center gap-1">
                  <ChevronRight className="w-3.5 h-3.5 text-muted-foreground" />
                  <button
                    onClick={() => { setCurrentPath(currentPath.slice(0, i + 1)); setSelectedFile(null); }}
                    className="text-orange-400 hover:text-orange-300 transition-colors"
                  >
                    {segment}
                  </button>
                </span>
              ))}
            </div>

            {/* Toolbar */}
            <div className="flex items-center gap-2 mb-3">
              {currentPath.length > 0 && (
                <button onClick={handleBack} className="px-4 py-2 rounded-md font-semibold text-sm border border-border text-muted-foreground hover:bg-secondary hover:text-foreground transition-all text-xs flex items-center gap-1">
                  ← Voltar
                </button>
              )}
              <button onClick={handleUpload} className="px-4 py-2 rounded-md font-semibold text-sm bg-orange-500 text-white hover:bg-orange-400 transition-all disabled:opacity-50 text-xs flex items-center gap-1 ml-auto">
                <Upload className="w-3.5 h-3.5" /> Upload
              </button>
            </div>

            {/* File list */}
            <div className="space-y-0.5">
              {currentFiles.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground text-sm">Pasta vazia</div>
              ) : (
                currentFiles.map(file => {
                  const Icon = file.type === "folder" ? Folder : (file.extension ? FileText : File);
                  const extColor = file.extension ? (EXT_COLORS[file.extension] || "text-slate-400") : "text-slate-400";
                  return (
                    <div
                      key={file.id}
                      className={`flex items-center gap-3 px-3 py-2 rounded-md cursor-pointer transition-all group ${selectedFile?.id === file.id ? "bg-orange-500/10 border border-orange-500/20" : "hover:bg-white/5"}`}
                      onClick={() => handleNavigate(file)}
                    >
                      <Icon className={`w-4 h-4 flex-shrink-0 ${file.type === "folder" ? "text-orange-400" : extColor}`} />
                      <span className="flex-1 text-sm text-foreground truncate">{file.name}</span>
                      <span className="text-xs text-muted-foreground font-mono">{formatSize(file.size)}</span>
                      <span className="text-xs text-muted-foreground hidden sm:block">{file.modified}</span>
                      {file.type === "folder" && <ChevronRight className="w-3.5 h-3.5 text-muted-foreground" />}
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* File details */}
          <div className="space-y-3">
            {selectedFile ? (
              <div className="rounded-lg p-4 border border-border space-y-3">
                <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Detalhes do Arquivo</p>
                <div className="flex items-center gap-3">
                  <div className="p-3 rounded-lg" style={{ background: "rgba(255,255,255,0.05)" }}>
                    <FileText className={`w-8 h-8 ${selectedFile.extension ? (EXT_COLORS[selectedFile.extension] || "text-slate-400") : "text-slate-400"}`} />
                  </div>
                  <div>
                    <p className="font-semibold text-foreground text-sm">{selectedFile.name}</p>
                    <p className="text-xs text-muted-foreground">{formatSize(selectedFile.size)}</p>
                  </div>
                </div>
                {selectedFile.content && (
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-1">Conteúdo</p>
                    <pre className="rounded-lg p-4 font-mono text-xs bg-black/60 border border-border text-green-400 min-h-[200px] overflow-y-auto text-xs" style={{ minHeight: "auto", maxHeight: 160 }}>
                      {selectedFile.content}
                    </pre>
                  </div>
                )}
                <div className="flex gap-2">
                  <button onClick={() => handleDownload(selectedFile)} className="px-4 py-2 rounded-md font-semibold text-sm bg-orange-500 text-white hover:bg-orange-400 transition-all disabled:opacity-50 text-xs flex items-center gap-1 flex-1 justify-center">
                    <Download className="w-3.5 h-3.5" /> Download
                  </button>
                  <button onClick={() => handleDelete(selectedFile)} className="p-2 rounded-md text-muted-foreground hover:text-red-400 hover:bg-red-500/10 transition-colors">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ) : (
              <div className="rounded-lg p-4 border border-border text-center py-8">
                <File className="w-10 h-10 text-muted-foreground mx-auto mb-2" />
                <p className="text-xs text-muted-foreground">Selecione um arquivo para ver detalhes</p>
              </div>
            )}

            {/* Storage info */}
            <div className="rounded-lg p-4 border border-border space-y-2">
              <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Armazenamento Virtual</p>
              <div className="space-y-1">
                <div className="flex justify-between text-xs">
                  <span className="text-muted-foreground">Usado</span>
                  <span className="font-mono text-cyan-400">{formatSize(totalSize)}</span>
                </div>
                <div className="h-1.5 rounded-full overflow-hidden" style={{ background: "oklch(0.18 0.01 240)" }}>
                  <div className="h-full rounded-full" style={{ width: "15%", background: "oklch(0.65 0.22 40)" }} />
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-muted-foreground">Total</span>
                  <span className="font-mono text-cyan-400">128 MB</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === "firmware" && (
        <div className="space-y-4">
          <div className="rounded-lg p-4 border border-orange-500/20 space-y-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg" style={{ background: "rgba(255,107,0,0.1)" }}>
                <RefreshCw className="w-5 h-5 text-orange-400" />
              </div>
              <div>
                <p className="font-bold text-foreground">Atualização de Firmware</p>
                <p className="text-xs text-muted-foreground">Simula o processo de atualização do firmware do Flipper Zero</p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3 text-xs">
              {[
                ["Versão Atual", "0.99.0 (dev)"],
                ["Versão Disponível", "0.99.1 (dev)"],
                ["Tamanho", "1.2 MB"],
                ["Canal", "Dev"],
              ].map(([k, v]) => (
                <div key={k} className="flex flex-col gap-0.5">
                  <span className="text-muted-foreground">{k}</span>
                  <span className="font-mono text-foreground font-medium">{v}</span>
                </div>
              ))}
            </div>
            {firmwareUpdating && (
              <div className="space-y-2">
                <div className="flex justify-between text-xs">
                  <span className="text-muted-foreground">Progresso</span>
                  <span className="font-mono text-cyan-400">{firmwareProgress}%</span>
                </div>
                <div className="h-2 rounded-full overflow-hidden" style={{ background: "oklch(0.18 0.01 240)" }}>
                  <div
                    className="h-full rounded-full transition-all duration-300"
                    style={{ width: `${firmwareProgress}%`, background: "linear-gradient(90deg, #ff6b00, #00d4ff)" }}
                  />
                </div>
              </div>
            )}
            <button
              onClick={handleFirmwareUpdate}
              disabled={firmwareUpdating}
              className="w-full px-4 py-2 rounded-md font-semibold text-sm bg-orange-500 text-white hover:bg-orange-400 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {firmwareUpdating ? <><span className="animate-spin">⟳</span> Atualizando...</> : <><RefreshCw className="w-4 h-4" /> Iniciar Atualização</>}
            </button>
            <p className="text-xs text-muted-foreground text-center">
              ⚠️ Simulação apenas — nenhum arquivo real é modificado
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
