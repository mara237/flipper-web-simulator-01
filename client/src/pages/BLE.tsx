/*
 * FLIPPER WEB SIMULATOR — Bluetooth LE Module
 * BLE scanner, device connection, characteristic read/write, event log
 */
import { useState, useEffect, useRef } from "react";
import { Bluetooth, Search, Wifi, WifiOff, Activity, ChevronRight, ChevronDown } from "lucide-react";
import { toast } from "sonner";

interface BLEService {
  uuid: string;
  name: string;
  characteristics: BLECharacteristic[];
}

interface BLECharacteristic {
  uuid: string;
  name: string;
  properties: string[];
  value: string;
}

interface BLEDevice {
  id: string;
  name: string;
  address: string;
  rssi: number;
  services: BLEService[];
  manufacturer: string;
  connected?: boolean;
}

function randomMac() {
  return Array.from({ length: 6 }, () => Math.floor(Math.random() * 256).toString(16).toUpperCase().padStart(2, "0")).join(":");
}

function randomUUID() {
  const hex = () => Math.floor(Math.random() * 0xFFFF).toString(16).toUpperCase().padStart(4, "0");
  return `${hex()}${hex()}-${hex()}-${hex()}-${hex()}-${hex()}${hex()}${hex()}`;
}

const DEVICE_TEMPLATES = [
  { name: "Mi Band 7", manufacturer: "Xiaomi" },
  { name: "AirPods Pro", manufacturer: "Apple" },
  { name: "Galaxy Watch 5", manufacturer: "Samsung" },
  { name: "Tile Mate", manufacturer: "Tile" },
  { name: "Govee LED Strip", manufacturer: "Govee" },
  { name: "Polar H10", manufacturer: "Polar" },
  { name: "Fitbit Charge 5", manufacturer: "Fitbit" },
  { name: "JBL Flip 6", manufacturer: "JBL" },
];

const SERVICE_TEMPLATES = [
  {
    name: "Generic Access",
    uuid: "0x1800",
    characteristics: [
      { name: "Device Name", uuid: "0x2A00", properties: ["READ"], value: "BLE Device" },
      { name: "Appearance", uuid: "0x2A01", properties: ["READ"], value: "0x0000" },
    ],
  },
  {
    name: "Battery Service",
    uuid: "0x180F",
    characteristics: [
      { name: "Battery Level", uuid: "0x2A19", properties: ["READ", "NOTIFY"], value: `${Math.floor(Math.random() * 100)}%` },
    ],
  },
  {
    name: "Heart Rate",
    uuid: "0x180D",
    characteristics: [
      { name: "Heart Rate Measurement", uuid: "0x2A37", properties: ["NOTIFY"], value: `${Math.floor(Math.random() * 40 + 60)} bpm` },
      { name: "Body Sensor Location", uuid: "0x2A38", properties: ["READ"], value: "Wrist" },
    ],
  },
];

function generateDevice(): BLEDevice {
  const tmpl = DEVICE_TEMPLATES[Math.floor(Math.random() * DEVICE_TEMPLATES.length)];
  const serviceCount = Math.floor(Math.random() * 2) + 1;
  return {
    id: Date.now().toString() + Math.random(),
    name: tmpl.name,
    address: randomMac(),
    rssi: -(Math.floor(Math.random() * 60) + 40),
    manufacturer: tmpl.manufacturer,
    services: SERVICE_TEMPLATES.slice(0, serviceCount).map(s => ({
      ...s,
      uuid: s.uuid,
      characteristics: s.characteristics.map(c => ({ ...c })),
    })),
  };
}

export default function BLE() {
  const [scanning, setScanning] = useState(false);
  const [devices, setDevices] = useState<BLEDevice[]>([]);
  const [connectedDevice, setConnectedDevice] = useState<BLEDevice | null>(null);
  const [expandedService, setExpandedService] = useState<string | null>(null);
  const [eventLog, setEventLog] = useState<string[]>([]);
  const [writeValue, setWriteValue] = useState("");
  const [writingChar, setWritingChar] = useState<string | null>(null);
  const scanRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const addLog = (msg: string) => {
    const time = new Date().toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit", second: "2-digit" });
    setEventLog(prev => [`[${time}] ${msg}`, ...prev].slice(0, 50));
  };

  const handleScan = () => {
    if (scanning) {
      if (scanRef.current) clearInterval(scanRef.current);
      setScanning(false);
      addLog("Escaneamento encerrado.");
      return;
    }
    setScanning(true);
    setDevices([]);
    addLog("Iniciando escaneamento BLE...");
    let count = 0;
    scanRef.current = setInterval(() => {
      if (count >= 6) {
        clearInterval(scanRef.current!);
        setScanning(false);
        addLog(`Escaneamento concluído. ${count} dispositivos encontrados.`);
        return;
      }
      const dev = generateDevice();
      setDevices(prev => [...prev, dev]);
      addLog(`Dispositivo encontrado: ${dev.name} (${dev.address}) RSSI: ${dev.rssi} dBm`);
      count++;
    }, 600);
  };

  const handleConnect = async (device: BLEDevice) => {
    if (connectedDevice?.id === device.id) {
      setConnectedDevice(null);
      addLog(`Desconectado de ${device.name}`);
      toast.info(`Desconectado de ${device.name}`);
      return;
    }
    addLog(`Conectando a ${device.name}...`);
    await new Promise(r => setTimeout(r, 800));
    setConnectedDevice(device);
    addLog(`Conectado a ${device.name} (${device.address})`);
    addLog(`Descobrindo serviços de ${device.name}...`);
    await new Promise(r => setTimeout(r, 400));
    addLog(`${device.services.length} serviços descobertos.`);
    toast.success(`Conectado a ${device.name}!`);
  };

  const handleRead = (char: BLECharacteristic) => {
    addLog(`Lendo característica ${char.name} (${char.uuid}): ${char.value}`);
    toast.info(`${char.name}: ${char.value}`);
  };

  const handleWrite = async (char: BLECharacteristic) => {
    if (!writeValue.trim()) { toast.error("Insira um valor para escrever."); return; }
    setWritingChar(char.uuid);
    addLog(`Escrevendo "${writeValue}" em ${char.name} (${char.uuid})...`);
    await new Promise(r => setTimeout(r, 500));
    addLog(`Escrita concluída em ${char.name}`);
    setWritingChar(null);
    setWriteValue("");
    toast.success(`Valor escrito em ${char.name}!`);
  };

  const rssiColor = (rssi: number) => {
    if (rssi > -60) return "text-green-400";
    if (rssi > -75) return "text-yellow-400";
    return "text-red-400";
  };

  const rssiBars = (rssi: number) => {
    const strength = rssi > -60 ? 4 : rssi > -70 ? 3 : rssi > -80 ? 2 : 1;
    return Array.from({ length: 4 }, (_, i) => (
      <div
        key={i}
        className="w-1 rounded-sm transition-all"
        style={{
          height: `${(i + 1) * 4}px`,
          background: i < strength ? (rssi > -60 ? "#3fb950" : rssi > -75 ? "#d29922" : "#f87171") : "oklch(0.25 0.01 240)",
        }}
      />
    ));
  };

  return (
    <div className="space-y-4 animate-fade-up">
      <div className="flex items-center gap-3">
        <div className="p-2 rounded-lg" style={{ background: "rgba(96,165,250,0.1)", border: "1px solid rgba(96,165,250,0.2)" }}>
          <Bluetooth className="w-5 h-5 text-blue-400" />
        </div>
        <div>
          <h2 className="text-lg font-bold text-foreground">Bluetooth LE</h2>
          <p className="text-xs text-muted-foreground">Scanner e Interação com Dispositivos BLE</p>
        </div>
        {connectedDevice && (
          <div className="ml-auto inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-mono font-medium bg-green-500/12 text-green-400 border border-green-500/20">
            <span className="inline-block w-2 h-2 rounded-full bg-green-400 shadow-[0_0_6px_theme(colors.green.400)] animate-pulse" /> {connectedDevice.name}
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Scanner */}
        <div className="space-y-3">
          <div className="rounded-lg p-4 border border-border space-y-3">
            <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Scanner BLE</p>
            <button
              onClick={handleScan}
              className={`w-full flex items-center justify-center gap-2 py-2.5 rounded-md font-semibold text-sm transition-all ${scanning ? "bg-red-500/20 text-red-400 border border-red-500/30" : "px-4 py-2 rounded-md font-semibold text-sm bg-cyan-400 text-gray-900 hover:bg-cyan-300 transition-all"}`}
            >
              {scanning ? <><span className="animate-spin">⟳</span> Escaneando...</> : <><Search className="w-4 h-4" /> Iniciar Scan</>}
            </button>
            {scanning && (
              <div className="flex items-center gap-2 text-xs text-cyan-400">
                <Activity className="w-3.5 h-3.5 animate-pulse" />
                <span>Procurando dispositivos BLE...</span>
              </div>
            )}
          </div>

          {/* Device list */}
          <div className="rounded-lg p-4 border border-border">
            <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-2">Dispositivos ({devices.length})</p>
            {devices.length === 0 ? (
              <div className="text-center py-6">
                <img
                  src="https://d2xsxph8kpxj0f.cloudfront.net/310519663486709659/dQxpGxqm8de3YhCWLyTMQz/fws-ble-scan-h3tDYasiurohaUvZZPLpLL.webp"
                  alt="BLE Scan"
                  className="w-20 h-20 object-cover rounded-lg mx-auto mb-2 opacity-40"
                />
                <p className="text-xs text-muted-foreground">Inicie o scan para descobrir dispositivos</p>
              </div>
            ) : (
              <div className="space-y-1.5 max-h-64 overflow-y-auto">
                {devices.map(dev => (
                  <div
                    key={dev.id}
                    className={`flex items-center gap-2 p-2 rounded-md cursor-pointer transition-all ${connectedDevice?.id === dev.id ? "bg-blue-500/10 border border-blue-500/20" : "hover:bg-white/5"}`}
                    onClick={() => handleConnect(dev)}
                  >
                    <div className="flex items-end gap-0.5 flex-shrink-0">
                      {rssiBars(dev.rssi)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium text-foreground truncate">{dev.name}</p>
                      <p className="text-xs text-muted-foreground font-mono truncate">{dev.address}</p>
                    </div>
                    <div className="flex items-center gap-1.5 flex-shrink-0">
                      <span className={`text-xs font-mono ${rssiColor(dev.rssi)}`}>{dev.rssi}</span>
                      {connectedDevice?.id === dev.id ? (
                        <Wifi className="w-3.5 h-3.5 text-blue-400" />
                      ) : (
                        <WifiOff className="w-3.5 h-3.5 text-muted-foreground" />
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Device details */}
        <div className="lg:col-span-2 space-y-3">
          {connectedDevice ? (
            <div className="rounded-lg p-4 border border-cyan-500/20 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-bold text-foreground">{connectedDevice.name}</p>
                  <p className="text-xs text-muted-foreground font-mono">{connectedDevice.address} · {connectedDevice.manufacturer}</p>
                </div>
                <button
                  onClick={() => handleConnect(connectedDevice)}
                  className="px-4 py-2 rounded-md font-semibold text-sm border border-border text-muted-foreground hover:bg-secondary hover:text-foreground transition-all text-xs flex items-center gap-1"
                >
                  <WifiOff className="w-3.5 h-3.5" /> Desconectar
                </button>
              </div>

              <div className="space-y-2">
                <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Serviços e Características</p>
                {connectedDevice.services.map(service => (
                  <div key={service.uuid} className="rounded-md overflow-hidden" style={{ border: "1px solid oklch(0.22 0.01 240)" }}>
                    <button
                      className="w-full flex items-center gap-2 p-2.5 text-left hover:bg-white/5 transition-colors"
                      onClick={() => setExpandedService(expandedService === service.uuid ? null : service.uuid)}
                    >
                      {expandedService === service.uuid ? <ChevronDown className="w-4 h-4 text-cyan-400 flex-shrink-0" /> : <ChevronRight className="w-4 h-4 text-muted-foreground flex-shrink-0" />}
                      <span className="text-sm font-medium text-foreground">{service.name}</span>
                      <span className="text-xs font-mono text-muted-foreground ml-auto">{service.uuid}</span>
                    </button>
                    {expandedService === service.uuid && (
                      <div className="border-t p-2 space-y-2" style={{ borderColor: "oklch(0.22 0.01 240)", background: "rgba(0,0,0,0.2)" }}>
                        {service.characteristics.map(char => (
                          <div key={char.uuid} className="space-y-1.5">
                            <div className="flex items-center gap-2">
                              <div className="flex-1 min-w-0">
                                <p className="text-xs font-medium text-foreground">{char.name}</p>
                                <p className="text-xs font-mono text-muted-foreground">{char.uuid}</p>
                              </div>
                              <div className="flex gap-1 flex-shrink-0">
                                {char.properties.map(p => (
                                  <span key={p} className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-mono font-medium bg-cyan-500/12 text-cyan-400 border border-cyan-500/20 text-xs">{p}</span>
                                ))}
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <div className="flex-1 px-2 py-1 rounded text-xs font-mono" style={{ background: "rgba(0,212,255,0.05)", border: "1px solid rgba(0,212,255,0.1)", color: "oklch(0.78 0.15 200)" }}>
                                {char.value}
                              </div>
                              {char.properties.includes("READ") && (
                                <button onClick={() => handleRead(char)} className="px-4 py-2 rounded-md font-semibold text-sm border border-border text-muted-foreground hover:bg-secondary hover:text-foreground transition-all text-xs py-1 px-2">Ler</button>
                              )}
                              {char.properties.includes("WRITE") || char.properties.includes("WRITE WITHOUT RESPONSE") ? (
                                <div className="flex gap-1">
                                  <input
                                    value={writingChar === char.uuid ? writeValue : ""}
                                    onChange={e => { setWritingChar(char.uuid); setWriteValue(e.target.value); }}
                                    placeholder="Valor"
                                    className="w-full px-3 py-2 rounded-md text-sm border border-border bg-secondary text-foreground font-mono focus:outline-none focus:border-orange-500 text-xs w-20 py-1"
                                  />
                                  <button onClick={() => handleWrite(char)} className="px-4 py-2 rounded-md font-semibold text-sm bg-orange-500 text-white hover:bg-orange-400 transition-all disabled:opacity-50 text-xs py-1 px-2">Escrever</button>
                                </div>
                              ) : null}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="rounded-lg p-4 border border-border text-center py-12">
              <Bluetooth className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
              <p className="text-sm text-muted-foreground">Nenhum dispositivo conectado</p>
              <p className="text-xs text-muted-foreground mt-1">Escaneie e clique em um dispositivo para conectar</p>
            </div>
          )}

          {/* Event log */}
          <div className="rounded-lg p-4 border border-border">
            <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-2">Log de Eventos BLE</p>
            <div className="rounded-lg p-4 font-mono text-xs bg-black/60 border border-border text-green-400 min-h-[200px] overflow-y-auto" style={{ minHeight: 140, maxHeight: 200 }}>
              {eventLog.length === 0 ? (
                <p className="text-xs text-muted-foreground">Aguardando eventos...<span className="animate-blink">█</span></p>
              ) : (
                eventLog.map((line, i) => (
                  <div key={i} className="text-xs mb-0.5" style={{ color: line.includes("Conectado") ? "#3fb950" : line.includes("Desconectado") ? "#f87171" : line.includes("encontrado") ? "#00d4ff" : "#7bc67e" }}>
                    {line}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
