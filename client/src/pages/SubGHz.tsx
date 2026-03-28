/*
 * FLIPPER WEB SIMULATOR — Sub-GHz Module
 * RF Spectrum Visualizer, Signal Decoder, Transmitter, Signal Library
 */
import { useState, useEffect, useRef } from "react";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Area, AreaChart,
} from "recharts";
import { Radio, Play, Square, Send, Trash2, Plus, Zap } from "lucide-react";
import { toast } from "sonner";

interface RFPoint { freq: string; amp: number; }
interface CapturedSignal {
  id: string; protocol: string; address: string; data: string; freq: number; timestamp: string;
}

const PROTOCOLS = ["Hopping Code", "Fixed Code", "Keeloq", "Princeton", "Nice FLO", "RAW"];
const MODULATIONS = ["AM650", "AM270", "FM238", "FM476"];
const PRESET_FREQS = [315, 433.92, 868.35, 915];

const SIGNAL_LIBRARY = [
  { name: "Portão Residencial", protocol: "Keeloq", freq: 433.92, address: "0xA1B2", data: "0x3C4D" },
  { name: "Controle de Garagem", protocol: "Fixed Code", freq: 315, address: "0xF1F2", data: "0x0001" },
  { name: "Alarme Veicular", protocol: "Hopping Code", freq: 433.92, address: "0xDEAD", data: "0xBEEF" },
  { name: "Sensor de Temperatura", protocol: "RAW", freq: 868.35, address: "0x1234", data: "0x5678" },
];

function generateSpectrum(center: number): RFPoint[] {
  return Array.from({ length: 60 }, (_, i) => {
    const offset = (i - 30) * 0.02;
    const freq = (center + offset).toFixed(2);
    const noise = Math.random() * 15;
    const peak = Math.abs(offset) < 0.05 ? Math.random() * 60 + 30 : 0;
    const sidelobes = Math.abs(offset) < 0.2 ? Math.random() * 20 : 0;
    return { freq, amp: Math.min(100, noise + peak + sidelobes) };
  });
}

export default function SubGHz() {
  const [isListening, setIsListening] = useState(false);
  const [frequency, setFrequency] = useState(433.92);
  const [modulation, setModulation] = useState("AM650");
  const [protocol, setProtocol] = useState("Hopping Code");
  const [txData, setTxData] = useState("0xABCD1234");
  const [spectrum, setSpectrum] = useState<RFPoint[]>([]);
  const [decoded, setDecoded] = useState<string | null>(null);
  const [captures, setCaptures] = useState<CapturedSignal[]>([]);
  const [transmitting, setTransmitting] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (isListening) {
      intervalRef.current = setInterval(() => {
        setSpectrum(generateSpectrum(frequency));
        if (Math.random() < 0.12) {
          const proto = PROTOCOLS[Math.floor(Math.random() * PROTOCOLS.length)];
          const addr = Math.floor(Math.random() * 0xFFFF).toString(16).toUpperCase().padStart(4, "0");
          const data = Math.floor(Math.random() * 0xFFFFFF).toString(16).toUpperCase().padStart(6, "0");
          setDecoded(`Protocolo: ${proto} | Endereço: 0x${addr} | Dados: 0x${data}`);
        } else {
          setDecoded(null);
        }
      }, 500);
    } else {
      if (intervalRef.current) clearInterval(intervalRef.current);
      setSpectrum([]);
      setDecoded(null);
    }
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [isListening, frequency]);

  const handleCapture = () => {
    if (!decoded) return;
    const parts = decoded.split("|");
    const proto = parts[0].split(":")[1].trim();
    const addr = parts[1].split(":")[1].trim();
    const data = parts[2].split(":")[1].trim();
    const sig: CapturedSignal = {
      id: Date.now().toString(),
      protocol: proto,
      address: addr,
      data,
      freq: frequency,
      timestamp: new Date().toLocaleTimeString("pt-BR"),
    };
    setCaptures(c => [sig, ...c]);
    toast.success("Sinal capturado com sucesso!");
  };

  const handleTransmit = async () => {
    setTransmitting(true);
    toast.info(`Transmitindo na frequência ${frequency} MHz...`);
    await new Promise(r => setTimeout(r, 1500));
    setTransmitting(false);
    toast.success(`Sinal transmitido! Protocolo: ${protocol} | Freq: ${frequency} MHz`);
  };

  const handleLibraryTransmit = async (sig: typeof SIGNAL_LIBRARY[0]) => {
    toast.info(`Transmitindo "${sig.name}"...`);
    await new Promise(r => setTimeout(r, 1200));
    toast.success(`"${sig.name}" transmitido com sucesso!`);
  };

  return (
    <div className="space-y-4 animate-fade-up">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="p-2 rounded-lg" style={{ background: "rgba(0,212,255,0.1)", border: "1px solid rgba(0,212,255,0.2)" }}>
          <Radio className="w-5 h-5 text-cyan-400" />
        </div>
        <div>
          <h2 className="text-lg font-bold text-foreground">Sub-GHz</h2>
          <p className="text-xs text-muted-foreground">Simulador de Rádio Frequência</p>
        </div>
        <div className="ml-auto flex items-center gap-2">
          {isListening && <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-mono font-medium bg-green-500/12 text-green-400 border border-green-500/20"><span className="inline-block w-2 h-2 rounded-full bg-green-400 shadow-[0_0_6px_theme(colors.green.400)] animate-pulse" /> Escutando</span>}
          {!isListening && <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-mono font-medium" style={{ background: "rgba(255,255,255,0.05)", color: "oklch(0.55 0.01 240)", border: "1px solid oklch(0.25 0.01 240)" }}>Inativo</span>}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Left: Controls */}
        <div className="space-y-4">
          {/* Frequency Control */}
          <div className="rounded-lg p-4 border border-border space-y-3">
            <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Frequência</p>
            <div className="flex gap-2 flex-wrap">
              {PRESET_FREQS.map(f => (
                <button
                  key={f}
                  onClick={() => setFrequency(f)}
                  className={`text-xs px-2 py-1 rounded font-mono transition-all ${frequency === f ? "bg-cyan-500/20 text-cyan-400 border border-cyan-500/30" : "bg-white/5 text-muted-foreground border border-border hover:text-foreground"}`}
                >
                  {f} MHz
                </button>
              ))}
            </div>
            <div className="flex items-center gap-2">
              <input
                type="number"
                step="0.01"
                value={frequency}
                onChange={e => setFrequency(parseFloat(e.target.value) || 433.92)}
                className="w-full px-3 py-2 rounded-md text-sm border border-border bg-secondary text-foreground font-mono focus:outline-none focus:border-orange-500 flex-1"
              />
              <span className="text-xs text-muted-foreground font-mono">MHz</span>
            </div>
          </div>

          {/* Listen / Stop */}
          <div className="rounded-lg p-4 border border-border space-y-3">
            <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Escuta</p>
            <button
              onClick={() => setIsListening(!isListening)}
              className={`w-full flex items-center justify-center gap-2 py-2.5 rounded-md font-semibold text-sm transition-all duration-200 ${isListening ? "bg-red-500/20 text-red-400 border border-red-500/30 hover:bg-red-500/30" : "px-4 py-2 rounded-md font-semibold text-sm bg-cyan-400 text-gray-900 hover:bg-cyan-300 transition-all"}`}
            >
              {isListening ? <><Square className="w-4 h-4" /> Parar Escuta</> : <><Play className="w-4 h-4" /> Iniciar Escuta</>}
            </button>
            {decoded && (
              <div
                className="p-3 rounded-md text-xs font-mono"
                style={{ background: "rgba(63,185,80,0.1)", border: "1px solid rgba(63,185,80,0.2)", color: "oklch(0.65 0.18 145)" }}
              >
                <p className="font-semibold mb-1">✓ Sinal Detectado</p>
                <p className="break-all">{decoded}</p>
                <button onClick={handleCapture} className="mt-2 px-4 py-2 rounded-md font-semibold text-sm bg-orange-500 text-white hover:bg-orange-400 transition-all disabled:opacity-50 text-xs py-1 px-2">
                  <Plus className="w-3 h-3 inline mr-1" />Capturar
                </button>
              </div>
            )}
          </div>

          {/* Transmitter */}
          <div className="rounded-lg p-4 border border-border space-y-3">
            <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Transmissor</p>
            <div className="space-y-2">
              <select value={modulation} onChange={e => setModulation(e.target.value)} className="w-full px-3 py-2 rounded-md text-sm border border-border bg-secondary text-foreground font-mono focus:outline-none focus:border-orange-500">
                {MODULATIONS.map(m => <option key={m} value={m}>{m}</option>)}
              </select>
              <select value={protocol} onChange={e => setProtocol(e.target.value)} className="w-full px-3 py-2 rounded-md text-sm border border-border bg-secondary text-foreground font-mono focus:outline-none focus:border-orange-500">
                {PROTOCOLS.map(p => <option key={p} value={p}>{p}</option>)}
              </select>
              <input
                type="text"
                value={txData}
                onChange={e => setTxData(e.target.value)}
                placeholder="Dados HEX (ex: 0xABCD)"
                className="w-full px-3 py-2 rounded-md text-sm border border-border bg-secondary text-foreground font-mono focus:outline-none focus:border-orange-500"
              />
            </div>
            <button
              onClick={handleTransmit}
              disabled={transmitting}
              className="w-full px-4 py-2 rounded-md font-semibold text-sm bg-orange-500 text-white hover:bg-orange-400 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {transmitting ? (
                <><span className="animate-spin">⟳</span> Transmitindo...</>
              ) : (
                <><Send className="w-4 h-4" /> Transmitir</>
              )}
            </button>
          </div>
        </div>

        {/* Center: Spectrum */}
        <div className="lg:col-span-2 space-y-4">
          <div className="rounded-lg p-4 border border-cyan-500/20">
            <div className="flex items-center justify-between mb-3">
              <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Visualizador de Espectro RF</p>
              <span className="font-mono text-cyan-400 text-xs">{frequency.toFixed(2)} MHz</span>
            </div>
            <div className="h-52">
              {spectrum.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={spectrum} margin={{ top: 5, right: 5, bottom: 5, left: -20 }}>
                    <defs>
                      <linearGradient id="rfGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#00d4ff" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#00d4ff" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                    <XAxis dataKey="freq" tick={{ fontSize: 9, fill: "#8b949e" }} interval={9} />
                    <YAxis tick={{ fontSize: 9, fill: "#8b949e" }} domain={[0, 100]} />
                    <Tooltip
                      contentStyle={{ background: "#161b22", border: "1px solid #30363d", borderRadius: 6, fontSize: 11 }}
                      formatter={(v: number) => [`${v.toFixed(1)} dBm`, "Amplitude"]}
                    />
                    <Area type="monotone" dataKey="amp" stroke="#00d4ff" fill="url(#rfGrad)" strokeWidth={1.5} dot={false} />
                  </AreaChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex flex-col items-center justify-center gap-2">
                  <img
                    src="https://d2xsxph8kpxj0f.cloudfront.net/310519663486709659/dQxpGxqm8de3YhCWLyTMQz/fws-rf-spectrum-9qbQvCo7wrhmD2BwfhzSa7.webp"
                    alt="RF Spectrum"
                    className="w-32 h-20 object-cover rounded opacity-30"
                  />
                  <p className="text-xs text-muted-foreground">Inicie a escuta para visualizar o espectro</p>
                </div>
              )}
            </div>
          </div>

          {/* Signal Library */}
          <div className="rounded-lg p-4 border border-border">
            <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-3">Biblioteca de Sinais</p>
            <div className="space-y-2">
              {SIGNAL_LIBRARY.map(sig => (
                <div
                  key={sig.name}
                  className="flex items-center justify-between p-2.5 rounded-md"
                  style={{ background: "rgba(255,255,255,0.03)", border: "1px solid oklch(0.22 0.01 240)" }}
                >
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">{sig.name}</p>
                    <p className="text-xs text-muted-foreground font-mono">
                      {sig.protocol} · {sig.freq} MHz · {sig.address}
                    </p>
                  </div>
                  <button
                    onClick={() => handleLibraryTransmit(sig)}
                    className="ml-3 flex-shrink-0 p-1.5 rounded-md text-orange-400 hover:bg-orange-500/10 transition-colors"
                  >
                    <Zap className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Captures */}
          {captures.length > 0 && (
            <div className="rounded-lg p-4 border border-border">
              <div className="flex items-center justify-between mb-3">
                <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Capturas ({captures.length})</p>
                <button onClick={() => setCaptures([])} className="text-xs text-muted-foreground hover:text-red-400 transition-colors">
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
              <div className="space-y-1.5 max-h-40 overflow-y-auto">
                {captures.map(c => (
                  <div key={c.id} className="flex items-center gap-2 text-xs font-mono p-2 rounded" style={{ background: "rgba(255,255,255,0.03)" }}>
                    <span className="text-muted-foreground">{c.timestamp}</span>
                    <span className="text-cyan-400">{c.freq} MHz</span>
                    <span className="text-foreground">{c.protocol}</span>
                    <span className="text-orange-400">{c.address}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
