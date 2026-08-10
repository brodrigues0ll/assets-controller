"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { getAssetById } from "@/lib/actions/assets";
import { updateAsset } from "@/lib/actions/assets";
import { ChevronLeft, Save, AlertTriangle, CheckCircle } from "lucide-react";
import Link from "next/link";

const SITUACOES = [
  { value: "Em uso", label: "Em uso", color: "#00ff88" },
  { value: "Em estoque", label: "Em estoque", color: "#00d4ff" },
  { value: "Com defeito", label: "Com defeito", color: "#ff2d55" },
  { value: "Em manutenção", label: "Em manutenção", color: "#fbbf24" },
  { value: "Reserva", label: "Reserva", color: "#a855f7" },
  { value: "Descartado", label: "Descartado", color: "#6b7280" },
  { value: "Ativo", label: "Ativo (legado)", color: "#00ff88" },
];

export default function QuickEditPage() {
  const params = useParams();
  const router = useRouter();
  const [asset, setAsset] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const [formData, setFormData] = useState({
    situacao: "",
    localizacaoSetor: "",
    usuarioResponsavel: "",
    observacoes: "",
  });

  useEffect(() => {
    loadAsset();
  }, [params.id]);

  async function loadAsset() {
    try {
      const data = await getAssetById(params.id);
      setAsset(data);
      setFormData({
        situacao: data.situacao || "Em estoque",
        localizacaoSetor: data.localizacaoSetor || "",
        usuarioResponsavel: data.usuarioResponsavel || "",
        observacoes: data.observacoes || "",
      });
    } catch (err) {
      setError("Erro ao carregar ativo");
    } finally {
      setLoading(false);
    }
  }

  async function handleSave() {
    setSaving(true);
    setError("");
    try {
      await updateAsset(params.id, {
        ...asset,
        ...formData,
        dnb: asset.dnb?._id || asset.dnb,
      });
      setSuccess(true);
      setTimeout(() => {
        router.push(`/dashboard/assets/${params.id}`);
      }, 1000);
    } catch (err) {
      setError(err.message || "Erro ao salvar");
    } finally {
      setSaving(false);
    }
  }

  const cyberInput =
    "w-full px-4 py-4 rounded-lg text-base font-mono transition-all duration-150";
  const cyberInputStyle = {
    background: "#141428",
    border: "1px solid #1a3a4a",
    color: "#e2e8f0",
    outline: "none",
  };

  if (loading) {
    return (
      <div
        className="min-h-screen flex items-center justify-center"
        style={{ background: "#0a0a0f" }}
      >
        <p className="font-mono" style={{ color: "#64748b" }}>
          Carregando...
        </p>
      </div>
    );
  }

  return (
    <div className="max-w-lg mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link
          href={`/dashboard/assets/${params.id}`}
          className="flex items-center gap-1 text-sm font-mono transition-colors"
          style={{ color: "#64748b" }}
        >
          <ChevronLeft className="h-4 w-4" />
          Voltar
        </Link>
      </div>

      <div>
        <h1 className="text-xl font-bold font-mono" style={{ color: "#00d4ff" }}>
          EDIÇÃO RÁPIDA
        </h1>
        {asset && (
          <p className="text-sm mt-1 font-mono" style={{ color: "#64748b" }}>
            {asset.patrimonio} — {asset.categoria?.nome || asset.tipoEquipamento}
          </p>
        )}
      </div>

      {error && (
        <div
          className="flex items-center gap-2 px-4 py-3 rounded-lg text-sm"
          style={{
            background: "#ff2d5510",
            border: "1px solid #ff2d5540",
            color: "#ff2d55",
          }}
        >
          <AlertTriangle className="h-4 w-4 flex-shrink-0" />
          {error}
        </div>
      )}

      {success && (
        <div
          className="flex items-center gap-2 px-4 py-3 rounded-lg text-sm"
          style={{
            background: "#00ff8810",
            border: "1px solid #00ff8840",
            color: "#00ff88",
          }}
        >
          <CheckCircle className="h-4 w-4 flex-shrink-0" />
          Salvo com sucesso! Redirecionando...
        </div>
      )}

      <div className="space-y-5">
        {/* Situação */}
        <div>
          <label
            className="block text-xs font-mono uppercase tracking-widest mb-3"
            style={{ color: "#64748b" }}
          >
            Situação
          </label>
          <div className="grid grid-cols-2 gap-2">
            {SITUACOES.map((s) => (
              <button
                key={s.value}
                type="button"
                onClick={() => setFormData((p) => ({ ...p, situacao: s.value }))}
                className="px-4 py-4 rounded-lg text-sm font-mono font-semibold transition-all text-left"
                style={
                  formData.situacao === s.value
                    ? {
                        background: `${s.color}20`,
                        border: `2px solid ${s.color}`,
                        color: s.color,
                        boxShadow: `0 0 10px ${s.color}30`,
                      }
                    : {
                        background: "#0f0f1a",
                        border: "1px solid #1a3a4a",
                        color: "#64748b",
                      }
                }
              >
                {s.label}
              </button>
            ))}
          </div>
        </div>

        {/* Localização */}
        <div>
          <label
            className="block text-xs font-mono uppercase tracking-widest mb-2"
            style={{ color: "#64748b" }}
          >
            Localização / Setor
          </label>
          <input
            type="text"
            value={formData.localizacaoSetor}
            onChange={(e) =>
              setFormData((p) => ({ ...p, localizacaoSetor: e.target.value }))
            }
            placeholder="Ex: OPR, ADM, TI"
            className={cyberInput}
            style={cyberInputStyle}
            onFocus={(e) => {
              e.target.style.borderColor = "#00d4ff";
              e.target.style.boxShadow = "0 0 0 1px #00d4ff";
            }}
            onBlur={(e) => {
              e.target.style.borderColor = "#1a3a4a";
              e.target.style.boxShadow = "none";
            }}
          />
        </div>

        {/* Usuário Responsável */}
        <div>
          <label
            className="block text-xs font-mono uppercase tracking-widest mb-2"
            style={{ color: "#64748b" }}
          >
            Usuário Responsável
          </label>
          <input
            type="text"
            value={formData.usuarioResponsavel}
            onChange={(e) =>
              setFormData((p) => ({ ...p, usuarioResponsavel: e.target.value }))
            }
            placeholder="Nome do responsável"
            className={cyberInput}
            style={cyberInputStyle}
            onFocus={(e) => {
              e.target.style.borderColor = "#00d4ff";
              e.target.style.boxShadow = "0 0 0 1px #00d4ff";
            }}
            onBlur={(e) => {
              e.target.style.borderColor = "#1a3a4a";
              e.target.style.boxShadow = "none";
            }}
          />
        </div>

        {/* Observações */}
        <div>
          <label
            className="block text-xs font-mono uppercase tracking-widest mb-2"
            style={{ color: "#64748b" }}
          >
            Observações
          </label>
          <textarea
            value={formData.observacoes}
            onChange={(e) =>
              setFormData((p) => ({ ...p, observacoes: e.target.value }))
            }
            placeholder="Informações adicionais..."
            rows={4}
            className="w-full px-4 py-4 rounded-lg text-base font-mono transition-all duration-150 resize-none"
            style={cyberInputStyle}
            onFocus={(e) => {
              e.target.style.borderColor = "#00d4ff";
              e.target.style.boxShadow = "0 0 0 1px #00d4ff";
            }}
            onBlur={(e) => {
              e.target.style.borderColor = "#1a3a4a";
              e.target.style.boxShadow = "none";
            }}
          />
        </div>

        {/* Save button */}
        <button
          onClick={handleSave}
          disabled={saving || success}
          className="w-full h-16 rounded-lg font-mono font-bold text-base tracking-wider flex items-center justify-center gap-3 transition-all duration-150"
          style={{
            background: saving || success ? "#00d4ff60" : "#00d4ff",
            color: "#0a0a0f",
            boxShadow: saving || success ? "none" : "0 0 20px rgba(0,212,255,0.4)",
            cursor: saving || success ? "not-allowed" : "pointer",
          }}
        >
          <Save className="h-5 w-5" />
          {saving ? "SALVANDO..." : "SALVAR ALTERAÇÕES"}
        </button>
      </div>
    </div>
  );
}
