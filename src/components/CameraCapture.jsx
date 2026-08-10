"use client";

import { useEffect, useRef, useState } from "react";
import { Camera, X, Circle } from "lucide-react";

export function CameraCapture({ onCapture, onClose }) {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);
  const [ready, setReady] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    async function start() {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: { ideal: "environment" }, width: { ideal: 1920 }, height: { ideal: 1080 } },
        });
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          await videoRef.current.play();
          setReady(true);
        }
      } catch {
        setError("Não foi possível acessar a câmera. Verifique as permissões do navegador.");
      }
    }
    start();
    return () => stopStream();
  }, []);

  function stopStream() {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
  }

  function capture() {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas) return;

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    canvas.getContext("2d").drawImage(video, 0, 0);

    canvas.toBlob(
      (blob) => {
        if (!blob) return;
        const file = new File([blob], `foto-${Date.now()}.jpg`, { type: "image/jpeg" });
        stopStream();
        onCapture(file);
      },
      "image/jpeg",
      0.92
    );
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: "rgba(10,10,15,0.92)", backdropFilter: "blur(4px)" }}
    >
      <div
        className="w-full max-w-md rounded-xl overflow-hidden"
        style={{ background: "#0f0f1a", border: "1px solid #1a3a4a" }}
      >
        {/* Header */}
        <div
          className="flex items-center justify-between px-4 py-3"
          style={{ borderBottom: "1px solid #1a3a4a" }}
        >
          <div className="flex items-center gap-2">
            <Camera className="h-4 w-4" style={{ color: "#00d4ff" }} />
            <span className="font-mono text-sm font-semibold" style={{ color: "#e2e8f0" }}>
              Tirar Foto
            </span>
          </div>
          <button
            onClick={() => { stopStream(); onClose(); }}
            className="p-1 rounded transition-all"
            style={{ color: "#64748b" }}
            onMouseEnter={(e) => { e.currentTarget.style.color = "#ff2d55"; }}
            onMouseLeave={(e) => { e.currentTarget.style.color = "#64748b"; }}
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Viewport */}
        <div className="relative" style={{ background: "#000", aspectRatio: "4/3" }}>
          <video ref={videoRef} playsInline muted className="w-full h-full object-cover" />
          <canvas ref={canvasRef} className="hidden" />

          {!ready && !error && (
            <div className="absolute inset-0 flex items-center justify-center">
              <p className="font-mono text-sm" style={{ color: "#64748b" }}>Iniciando câmera...</p>
            </div>
          )}

          {error && (
            <div className="absolute inset-0 flex items-center justify-center p-6 text-center">
              <p className="font-mono text-sm" style={{ color: "#ff2d55" }}>{error}</p>
            </div>
          )}
        </div>

        {/* Capturar */}
        <div className="flex justify-center py-5" style={{ borderTop: "1px solid #1a3a4a" }}>
          <button
            onClick={capture}
            disabled={!ready}
            className="w-16 h-16 rounded-full flex items-center justify-center transition-all"
            style={{
              background: ready ? "#00d4ff" : "#00d4ff40",
              boxShadow: ready ? "0 0 20px rgba(0,212,255,0.4)" : "none",
              cursor: ready ? "pointer" : "not-allowed",
            }}
          >
            <Circle className="h-8 w-8" style={{ color: ready ? "#0a0a0f" : "#0a0a0f80" }} />
          </button>
        </div>
      </div>
    </div>
  );
}
