"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { ScanLine, Camera, Search, X, AlertTriangle, ChevronLeft, ZoomIn, Plus, RotateCcw } from "lucide-react";
import Link from "next/link";
import jsQR from "jsqr";

const ZOOM_LEVELS = [1, 2, 3, 4];

export default function ScanPage() {
  const router = useRouter();
  const [patrimonio, setPatrimonio] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [cameraError, setCameraError] = useState("");
  const [cameraActive, setCameraActive] = useState(false);
  const [zoom, setZoom] = useState(1);
  const [availableZooms, setAvailableZooms] = useState([1]);
  const [scanning, setScanning] = useState(false);
  const [notFoundPatrimonio, setNotFoundPatrimonio] = useState("");
  const lastScannedRef = useRef("");

  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);
  const trackRef = useRef(null);
  const rafRef = useRef(null);
  const inputRef = useRef(null);
  const searchingRef = useRef(false);

  useEffect(() => {
    return () => stopCamera();
  }, []);

  function stopCamera() {
    if (rafRef.current) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
      trackRef.current = null;
    }
    setCameraActive(false);
    setScanning(false);
    setZoom(1);
    setAvailableZooms([1]);
    lastScannedRef.current = "";
  }

  async function startCamera() {
    setCameraError("");
    try {
      // Pede a câmera traseira com resolução alta para melhor leitura de QR
      const constraints = {
        video: {
          facingMode: { ideal: "environment" },
          width: { ideal: 1920 },
          height: { ideal: 1080 },
        },
      };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      streamRef.current = stream;

      const track = stream.getVideoTracks()[0];
      trackRef.current = track;

      // Detecta zoom nativo disponível no dispositivo
      const caps = track.getCapabilities?.();
      let initialZoom = 1;
      if (caps?.zoom) {
        const maxZoom = Math.floor(caps.zoom.max);
        const zooms = ZOOM_LEVELS.filter((z) => z <= maxZoom);
        if (zooms.length === 0) zooms.push(1);
        setAvailableZooms(zooms);

        // Inicia em 3x se disponível, senão no maior zoom disponível
        initialZoom = zooms.includes(3) ? 3 : zooms[zooms.length - 1];
        try {
          await track.applyConstraints({ advanced: [{ zoom: initialZoom }] });
        } catch {}
      } else {
        setAvailableZooms([1]);
      }

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }

      setCameraActive(true);
      setScanning(true);
      setZoom(initialZoom);
      requestScanFrame();
    } catch (err) {
      setCameraError("Não foi possível acessar a câmera. Verifique as permissões do navegador.");
    }
  }

  async function applyZoom(level) {
    if (!trackRef.current) return;
    try {
      await trackRef.current.applyConstraints({ advanced: [{ zoom: level }] });
      setZoom(level);
    } catch {
      // Zoom não suportado neste nível
    }
  }

  function requestScanFrame() {
    rafRef.current = requestAnimationFrame(scanFrame);
  }

  function scanFrame() {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas || video.readyState < video.HAVE_ENOUGH_DATA) {
      rafRef.current = requestAnimationFrame(scanFrame);
      return;
    }

    const w = video.videoWidth;
    const h = video.videoHeight;
    if (w === 0 || h === 0) {
      rafRef.current = requestAnimationFrame(scanFrame);
      return;
    }

    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext("2d", { willReadFrequently: true });
    ctx.drawImage(video, 0, 0, w, h);

    const imageData = ctx.getImageData(0, 0, w, h);
    const code = jsQR(imageData.data, w, h, {
      inversionAttempts: "dontInvert",
    });

    if (code && code.data && !searchingRef.current && code.data !== lastScannedRef.current) {
      lastScannedRef.current = code.data;
      handleSearch(code.data);
      return; // para o loop enquanto busca
    }

    rafRef.current = requestAnimationFrame(scanFrame);
  }

  async function handleSearch(pat) {
    const query = (typeof pat === "string" ? pat : patrimonio).trim();
    if (!query || searchingRef.current) return;

    searchingRef.current = true;
    setLoading(true);
    setError("");

    try {
      const res = await fetch(`/api/assets/scan?patrimonio=${encodeURIComponent(query)}`);
      const data = await res.json();

      if (!res.ok) {
        if (res.status === 404) {
          setNotFoundPatrimonio(query);
        } else {
          setError(data.error || "Erro ao buscar ativo");
          setTimeout(() => {
            lastScannedRef.current = "";
            searchingRef.current = false;
            if (cameraActive) requestScanFrame();
          }, 2000);
        }
        return;
      }

      router.push(`/dashboard/assets/${data._id}`);
    } catch {
      setError("Erro ao buscar ativo. Tente novamente.");
      setTimeout(() => {
        lastScannedRef.current = "";
        searchingRef.current = false;
        if (cameraActive) requestScanFrame();
      }, 2000);
    } finally {
      setLoading(false);
      searchingRef.current = false;
    }
  }

  function handleNotFoundClose() {
    setNotFoundPatrimonio("");
    lastScannedRef.current = "";
    searchingRef.current = false;
    if (cameraActive) requestScanFrame();
  }

  return (
    <div
      className="min-h-screen flex flex-col"
      style={{
        background: "#0a0a0f",
        backgroundImage: `linear-gradient(rgba(0,212,255,0.02) 1px, transparent 1px), linear-gradient(90deg, rgba(0,212,255,0.02) 1px, transparent 1px)`,
        backgroundSize: "40px 40px",
      }}
    >
      {/* Modal: ativo não encontrado */}
      {notFoundPatrimonio && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "rgba(10,10,15,0.85)", backdropFilter: "blur(4px)" }}>
          <div className="w-full max-w-sm rounded-xl p-6 space-y-5" style={{ background: "#0f0f1a", border: "1px solid #ff2d5540", boxShadow: "0 0 40px rgba(255,45,85,0.15)" }}>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: "#ff2d5510", border: "1px solid #ff2d5540" }}>
                <AlertTriangle className="h-5 w-5" style={{ color: "#ff2d55" }} />
              </div>
              <div>
                <p className="font-mono font-semibold text-sm" style={{ color: "#e2e8f0" }}>Ativo não encontrado</p>
                <p className="text-xs font-mono mt-0.5" style={{ color: "#64748b" }}>Patrimônio: <span style={{ color: "#ff2d55" }}>{notFoundPatrimonio}</span></p>
              </div>
            </div>
            <div className="space-y-2">
              <Link
                href={`/dashboard/assets/new?patrimonio=${encodeURIComponent(notFoundPatrimonio)}`}
                className="flex items-center justify-center gap-2 w-full h-11 rounded font-mono text-sm font-semibold transition-all"
                style={{ background: "#00d4ff", color: "#0a0a0f", boxShadow: "0 0 10px rgba(0,212,255,0.3)" }}
              >
                <Plus className="h-4 w-4" />
                Cadastrar ativo
              </Link>
              <button
                onClick={handleNotFoundClose}
                className="flex items-center justify-center gap-2 w-full h-11 rounded font-mono text-sm font-semibold transition-all"
                style={{ background: "#141428", border: "1px solid #1a3a4a", color: "#64748b" }}
              >
                <RotateCcw className="h-4 w-4" />
                Nova busca
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div
        className="flex items-center gap-3 px-4 h-14 flex-shrink-0"
        style={{ background: "#0f0f1a", borderBottom: "1px solid #1a3a4a" }}
      >
        <Link href="/dashboard" className="flex items-center gap-1 text-sm" style={{ color: "#64748b" }}>
          <ChevronLeft className="h-4 w-4" />
          Dashboard
        </Link>
        <span style={{ color: "#1a3a4a" }}>/</span>
        <span className="font-mono text-sm" style={{ color: "#00d4ff" }}>SCANNER</span>
      </div>

      <div className="flex-1 flex flex-col items-center justify-start pt-6 px-4 max-w-lg mx-auto w-full">
        {/* Title */}
        <div className="text-center mb-6">
          <div
            className="w-14 h-14 rounded-xl flex items-center justify-center mx-auto mb-3"
            style={{ background: "#00d4ff10", border: "1px solid #00d4ff30", boxShadow: "0 0 20px rgba(0,212,255,0.1)" }}
          >
            <ScanLine className="h-7 w-7" style={{ color: "#00d4ff" }} />
          </div>
          <h1 className="text-xl font-bold font-mono tracking-widest" style={{ color: "#00d4ff" }}>
            SCANNER
          </h1>
          <p className="text-sm mt-1" style={{ color: "#64748b" }}>
            QR code ou número de patrimônio
          </p>
        </div>

        {/* Error */}
        {error && (
          <div
            className="flex items-center gap-2 w-full px-4 py-3 rounded mb-4 text-sm"
            style={{ background: "#ff2d5510", border: "1px solid #ff2d5540", color: "#ff2d55" }}
          >
            <AlertTriangle className="h-4 w-4 flex-shrink-0" />
            {error}
            <button className="ml-auto" onClick={() => setError("")}>
              <X className="h-4 w-4" />
            </button>
          </div>
        )}

        <div className="w-full space-y-3">
            {cameraError && (
              <div
                className="flex items-center gap-2 px-4 py-3 rounded text-sm"
                style={{ background: "#ff2d5510", border: "1px solid #ff2d5540", color: "#ff2d55" }}
              >
                <AlertTriangle className="h-4 w-4" />
                {cameraError}
              </div>
            )}

            {/* Viewport */}
            <div
              className="relative w-full rounded-lg overflow-hidden"
              style={{ border: "1px solid #1a3a4a", background: "#0f0f1a", aspectRatio: "4/3" }}
            >
              <video
                ref={videoRef}
                playsInline
                muted
                className="w-full h-full object-cover"
                style={{ display: cameraActive ? "block" : "none" }}
              />
              {/* Canvas oculto para processamento */}
              <canvas ref={canvasRef} className="hidden" />

              {!cameraActive && (
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-3">
                  <Camera className="h-12 w-12" style={{ color: "#1a3a4a" }} />
                  <p className="text-sm font-mono" style={{ color: "#64748b" }}>Câmera inativa</p>
                </div>
              )}

              {cameraActive && (
                <>
                  {/* Mira de scan */}
                  <div className="absolute inset-0 pointer-events-none" style={{ background: "linear-gradient(transparent 40%, rgba(0,212,255,0.04) 50%, transparent 60%)" }} />
                  <div
                    className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-52 h-52 pointer-events-none"
                    style={{ border: "1px solid #00d4ff30", borderRadius: "4px" }}
                  >
                    <div className="absolute top-0 left-0 w-6 h-6" style={{ borderTop: "2px solid #00d4ff", borderLeft: "2px solid #00d4ff" }} />
                    <div className="absolute top-0 right-0 w-6 h-6" style={{ borderTop: "2px solid #00d4ff", borderRight: "2px solid #00d4ff" }} />
                    <div className="absolute bottom-0 left-0 w-6 h-6" style={{ borderBottom: "2px solid #00d4ff", borderLeft: "2px solid #00d4ff" }} />
                    <div className="absolute bottom-0 right-0 w-6 h-6" style={{ borderBottom: "2px solid #00d4ff", borderRight: "2px solid #00d4ff" }} />
                  </div>

                  {/* Status */}
                  <div className="absolute top-3 left-0 right-0 flex justify-center">
                    {loading ? (
                      <span className="px-3 py-1 rounded-full text-xs font-mono" style={{ background: "#00d4ff20", color: "#00d4ff", border: "1px solid #00d4ff40" }}>
                        Buscando...
                      </span>
                    ) : (
                      <span className="px-3 py-1 rounded-full text-xs font-mono" style={{ background: "#00ff8820", color: "#00ff88", border: "1px solid #00ff8840" }}>
                        ● Lendo
                      </span>
                    )}
                  </div>

                  <p className="absolute bottom-3 left-0 right-0 text-center text-xs font-mono" style={{ color: "#00d4ff60" }}>
                    Aponte para o QR code
                  </p>
                </>
              )}
            </div>

            {/* Zoom controls */}
            {cameraActive && availableZooms.length > 1 && (
              <div className="flex items-center justify-center gap-2">
                <ZoomIn className="h-3.5 w-3.5 flex-shrink-0" style={{ color: "#64748b" }} />
                <div className="flex gap-1">
                  {availableZooms.map((z) => (
                    <button
                      key={z}
                      onClick={() => applyZoom(z)}
                      className="w-10 h-9 rounded font-mono text-sm font-semibold transition-all"
                      style={
                        zoom === z
                          ? { background: "#00d4ff", color: "#0a0a0f" }
                          : { background: "#141428", border: "1px solid #1a3a4a", color: "#64748b" }
                      }
                    >
                      {z}×
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Botão ativar/parar */}
            <div className="flex gap-3">
              {!cameraActive ? (
                <button
                  onClick={startCamera}
                  className="flex-1 h-12 rounded font-mono font-semibold text-sm tracking-wider flex items-center justify-center gap-2 transition-all"
                  style={{ background: "#00d4ff", color: "#0a0a0f", boxShadow: "0 0 15px rgba(0,212,255,0.3)" }}
                >
                  <Camera className="h-4 w-4" />
                  ATIVAR CÂMERA
                </button>
              ) : (
                <button
                  onClick={stopCamera}
                  className="flex-1 h-12 rounded font-mono font-semibold text-sm tracking-wider flex items-center justify-center gap-2 transition-all"
                  style={{ background: "#ff2d5520", color: "#ff2d55", border: "1px solid #ff2d5540" }}
                >
                  <X className="h-4 w-4" />
                  PARAR
                </button>
              )}
            </div>

            {/* Input manual inline */}
            <div className="p-4 rounded-lg space-y-3" style={{ background: "#0f0f1a", border: "1px solid #1a3a4a" }}>
              <p className="text-xs font-mono uppercase tracking-widest" style={{ color: "#64748b" }}>
                Ou informe manualmente
              </p>
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Número do patrimônio"
                  value={patrimonio}
                  onChange={(e) => setPatrimonio(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                  className="flex-1 h-11 px-3 rounded text-sm font-mono"
                  style={{ background: "#141428", border: "1px solid #1a3a4a", color: "#e2e8f0", outline: "none" }}
                  onFocus={(e) => { e.target.style.borderColor = "#00d4ff"; e.target.style.boxShadow = "0 0 0 1px #00d4ff"; }}
                  onBlur={(e) => { e.target.style.borderColor = "#1a3a4a"; e.target.style.boxShadow = "none"; }}
                />
                <button
                  onClick={() => handleSearch()}
                  disabled={loading || !patrimonio.trim()}
                  className="h-11 px-4 rounded font-mono text-sm font-semibold transition-all"
                  style={{
                    background: loading || !patrimonio.trim() ? "#00d4ff40" : "#00d4ff",
                    color: "#0a0a0f",
                    cursor: loading || !patrimonio.trim() ? "not-allowed" : "pointer",
                  }}
                >
                  <Search className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
  );
}
