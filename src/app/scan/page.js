"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { ScanLine, Keyboard, Camera, Search, X, AlertTriangle, ChevronLeft } from "lucide-react";
import Link from "next/link";

export default function ScanPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState("manual");
  const [patrimonio, setPatrimonio] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [cameraError, setCameraError] = useState("");
  const [cameraActive, setCameraActive] = useState(false);
  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    if (activeTab === "manual" && inputRef.current) {
      inputRef.current.focus();
    }
    if (activeTab !== "camera") {
      stopCamera();
    }
  }, [activeTab]);

  useEffect(() => {
    return () => stopCamera();
  }, []);

  function stopCamera() {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
    setCameraActive(false);
  }

  async function startCamera() {
    setCameraError("");
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment" },
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      }
      setCameraActive(true);
    } catch (err) {
      setCameraError(
        "Não foi possível acessar a câmera. Verifique as permissões do navegador."
      );
    }
  }

  async function handleSearch(pat) {
    const query = (pat || patrimonio).trim();
    if (!query) return;

    setLoading(true);
    setError("");

    try {
      const res = await fetch(
        `/api/assets/scan?patrimonio=${encodeURIComponent(query)}`
      );
      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Ativo não encontrado");
        return;
      }

      router.push(`/dashboard/assets/${data._id}`);
    } catch (err) {
      setError("Erro ao buscar ativo. Tente novamente.");
    } finally {
      setLoading(false);
    }
  }

  const cyberInput =
    "w-full h-14 px-4 rounded text-base font-mono transition-all duration-150";
  const cyberInputStyle = {
    background: "#141428",
    border: "1px solid #1a3a4a",
    color: "#e2e8f0",
    outline: "none",
  };

  return (
    <div
      className="min-h-screen flex flex-col"
      style={{
        background: "#0a0a0f",
        backgroundImage: `linear-gradient(rgba(0,212,255,0.02) 1px, transparent 1px), linear-gradient(90deg, rgba(0,212,255,0.02) 1px, transparent 1px)`,
        backgroundSize: "40px 40px",
      }}
    >
      {/* Header */}
      <div
        className="flex items-center gap-3 px-4 h-14"
        style={{
          background: "#0f0f1a",
          borderBottom: "1px solid #1a3a4a",
        }}
      >
        <Link
          href="/dashboard"
          className="flex items-center gap-1 text-sm"
          style={{ color: "#64748b" }}
        >
          <ChevronLeft className="h-4 w-4" />
          Dashboard
        </Link>
        <span style={{ color: "#1a3a4a" }}>/</span>
        <span className="font-mono text-sm" style={{ color: "#00d4ff" }}>
          SCANNER
        </span>
      </div>

      <div className="flex-1 flex flex-col items-center justify-start pt-8 px-4 max-w-lg mx-auto w-full">
        {/* Title */}
        <div className="text-center mb-8">
          <div
            className="w-16 h-16 rounded-xl flex items-center justify-center mx-auto mb-4"
            style={{
              background: "#00d4ff10",
              border: "1px solid #00d4ff30",
              boxShadow: "0 0 20px rgba(0,212,255,0.1)",
            }}
          >
            <ScanLine className="h-8 w-8" style={{ color: "#00d4ff" }} />
          </div>
          <h1
            className="text-2xl font-bold font-mono tracking-widest"
            style={{ color: "#00d4ff" }}
          >
            SCANNER
          </h1>
          <p className="text-sm mt-1" style={{ color: "#64748b" }}>
            Localize um ativo pelo número de patrimônio
          </p>
        </div>

        {/* Tabs */}
        <div
          className="flex w-full rounded-lg overflow-hidden mb-6"
          style={{ border: "1px solid #1a3a4a" }}
        >
          <button
            className="flex-1 flex items-center justify-center gap-2 py-3 text-sm font-mono font-medium transition-all"
            style={
              activeTab === "manual"
                ? { background: "#00d4ff15", color: "#00d4ff", borderBottom: "2px solid #00d4ff" }
                : { background: "#0f0f1a", color: "#64748b" }
            }
            onClick={() => setActiveTab("manual")}
          >
            <Keyboard className="h-4 w-4" />
            MANUAL
          </button>
          <button
            className="flex-1 flex items-center justify-center gap-2 py-3 text-sm font-mono font-medium transition-all"
            style={
              activeTab === "camera"
                ? { background: "#00d4ff15", color: "#00d4ff", borderBottom: "2px solid #00d4ff" }
                : { background: "#0f0f1a", color: "#64748b" }
            }
            onClick={() => setActiveTab("camera")}
          >
            <Camera className="h-4 w-4" />
            CÂMERA
          </button>
        </div>

        {/* Error display */}
        {error && (
          <div
            className="flex items-center gap-2 w-full px-4 py-3 rounded mb-4 text-sm"
            style={{
              background: "#ff2d5510",
              border: "1px solid #ff2d5540",
              color: "#ff2d55",
            }}
          >
            <AlertTriangle className="h-4 w-4 flex-shrink-0" />
            {error}
            <button
              className="ml-auto"
              onClick={() => setError("")}
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        )}

        {/* Manual Tab */}
        {activeTab === "manual" && (
          <div className="w-full space-y-4">
            <div>
              <label
                className="block text-xs font-mono uppercase tracking-widest mb-2"
                style={{ color: "#64748b" }}
              >
                Número de Patrimônio
              </label>
              <input
                ref={inputRef}
                type="text"
                placeholder="Ex: NAV-00123"
                value={patrimonio}
                onChange={(e) => setPatrimonio(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                className={cyberInput}
                style={cyberInputStyle}
                onFocus={(e) => {
                  e.target.style.borderColor = "#00d4ff";
                  e.target.style.boxShadow = "0 0 0 1px #00d4ff, 0 0 10px #00d4ff20";
                }}
                onBlur={(e) => {
                  e.target.style.borderColor = "#1a3a4a";
                  e.target.style.boxShadow = "none";
                }}
              />
            </div>
            <button
              onClick={() => handleSearch()}
              disabled={loading || !patrimonio.trim()}
              className="w-full h-14 rounded font-mono font-semibold text-base tracking-wider flex items-center justify-center gap-2 transition-all duration-150"
              style={{
                background: loading || !patrimonio.trim() ? "#00d4ff40" : "#00d4ff",
                color: "#0a0a0f",
                cursor: loading || !patrimonio.trim() ? "not-allowed" : "pointer",
                boxShadow: loading || !patrimonio.trim() ? "none" : "0 0 15px rgba(0,212,255,0.3)",
              }}
            >
              <Search className="h-5 w-5" />
              {loading ? "BUSCANDO..." : "LOCALIZAR ATIVO"}
            </button>
          </div>
        )}

        {/* Camera Tab */}
        {activeTab === "camera" && (
          <div className="w-full space-y-4">
            {cameraError && (
              <div
                className="flex items-center gap-2 px-4 py-3 rounded text-sm"
                style={{
                  background: "#ff2d5510",
                  border: "1px solid #ff2d5540",
                  color: "#ff2d55",
                }}
              >
                <AlertTriangle className="h-4 w-4" />
                {cameraError}
              </div>
            )}

            {/* Video viewport */}
            <div
              className="relative w-full rounded-lg overflow-hidden"
              style={{
                border: "1px solid #1a3a4a",
                background: "#0f0f1a",
                aspectRatio: "4/3",
              }}
            >
              <video
                ref={videoRef}
                playsInline
                muted
                className="w-full h-full object-cover"
                style={{ display: cameraActive ? "block" : "none" }}
              />
              {!cameraActive && (
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-3">
                  <Camera className="h-12 w-12" style={{ color: "#1a3a4a" }} />
                  <p className="text-sm font-mono" style={{ color: "#64748b" }}>
                    Câmera inativa
                  </p>
                </div>
              )}
              {cameraActive && (
                <>
                  {/* Scan overlay */}
                  <div
                    className="absolute inset-0 pointer-events-none"
                    style={{
                      background: "linear-gradient(transparent 40%, rgba(0,212,255,0.05) 50%, transparent 60%)",
                    }}
                  />
                  <div
                    className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-48 h-48 rounded-lg pointer-events-none"
                    style={{ border: "2px solid #00d4ff60" }}
                  >
                    <div className="absolute top-0 left-0 w-5 h-5" style={{ borderTop: "2px solid #00d4ff", borderLeft: "2px solid #00d4ff" }} />
                    <div className="absolute top-0 right-0 w-5 h-5" style={{ borderTop: "2px solid #00d4ff", borderRight: "2px solid #00d4ff" }} />
                    <div className="absolute bottom-0 left-0 w-5 h-5" style={{ borderBottom: "2px solid #00d4ff", borderLeft: "2px solid #00d4ff" }} />
                    <div className="absolute bottom-0 right-0 w-5 h-5" style={{ borderBottom: "2px solid #00d4ff", borderRight: "2px solid #00d4ff" }} />
                  </div>
                  <p
                    className="absolute bottom-3 left-0 right-0 text-center text-xs font-mono"
                    style={{ color: "#00d4ff80" }}
                  >
                    Aponte para o QR code ou etiqueta
                  </p>
                </>
              )}
            </div>

            <div className="flex gap-3">
              {!cameraActive ? (
                <button
                  onClick={startCamera}
                  className="flex-1 h-12 rounded font-mono font-semibold text-sm tracking-wider flex items-center justify-center gap-2 transition-all"
                  style={{
                    background: "#00d4ff",
                    color: "#0a0a0f",
                    boxShadow: "0 0 15px rgba(0,212,255,0.3)",
                  }}
                >
                  <Camera className="h-4 w-4" />
                  ATIVAR CÂMERA
                </button>
              ) : (
                <button
                  onClick={stopCamera}
                  className="flex-1 h-12 rounded font-mono font-semibold text-sm tracking-wider flex items-center justify-center gap-2 transition-all"
                  style={{
                    background: "#ff2d5520",
                    color: "#ff2d55",
                    border: "1px solid #ff2d5540",
                  }}
                >
                  <X className="h-4 w-4" />
                  PARAR
                </button>
              )}
            </div>

            {/* Manual fallback within camera tab */}
            <div
              className="p-4 rounded-lg space-y-3"
              style={{ background: "#0f0f1a", border: "1px solid #1a3a4a" }}
            >
              <p className="text-xs font-mono uppercase tracking-widest" style={{ color: "#64748b" }}>
                Ou informe o número manualmente
              </p>
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Número do patrimônio"
                  value={patrimonio}
                  onChange={(e) => setPatrimonio(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                  className="flex-1 h-11 px-3 rounded text-sm font-mono"
                  style={{
                    background: "#141428",
                    border: "1px solid #1a3a4a",
                    color: "#e2e8f0",
                    outline: "none",
                  }}
                  onFocus={(e) => {
                    e.target.style.borderColor = "#00d4ff";
                    e.target.style.boxShadow = "0 0 0 1px #00d4ff";
                  }}
                  onBlur={(e) => {
                    e.target.style.borderColor = "#1a3a4a";
                    e.target.style.boxShadow = "none";
                  }}
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
        )}
      </div>
    </div>
  );
}
