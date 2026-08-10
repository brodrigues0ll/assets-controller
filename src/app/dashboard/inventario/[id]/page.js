"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams } from "next/navigation";
import { getInventarioById, updateRegistro, finalizarInventario } from "@/lib/actions/inventario";
import { exportarFormatoNAV } from "@/lib/exportAssets";
import { useSession } from "next-auth/react";
import Link from "next/link";
import {
  CheckCircle, XCircle, Clock, AlertTriangle, Download,
  ChevronLeft, MapPin, User, Package,
} from "lucide-react";

const STATUS_COLOR = {
  "Localizado":     { bg: "#00ff8820", color: "#00ff88", border: "#00ff8840" },
  "Não Localizado": { bg: "#ff2d5520", color: "#ff2d55", border: "#ff2d5540" },
  "Pendente":       { bg: "#1a3a4a40", color: "#64748b", border: "#1a3a4a" },
};

function groupBySetor(registros) {
  const groups = {};
  for (const r of registros) {
    const setor = r.asset?.setor?.nome || r.asset?.localizacaoSetor || "Sem Setor";
    const predio = r.asset?.setor?.predio?.nome || "—";
    const key = setor;
    if (!groups[key]) groups[key] = { setor, predio, registros: [] };
    groups[key].registros.push(r);
  }
  return Object.values(groups).sort((a, b) => a.setor.localeCompare(b.setor, "pt"));
}

function SetorProgress({ registros }) {
  const total = registros.length;
  const conferidos = registros.filter(r => r.statusEncontrado !== "Pendente").length;
  const pct = total > 0 ? Math.round((conferidos / total) * 100) : 0;
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-1 rounded-full" style={{ background: "#141428" }}>
        <div className="h-1 rounded-full" style={{ width: `${pct}%`, background: pct === 100 ? "#00ff88" : "#00d4ff" }} />
      </div>
      <span className="text-xs font-mono" style={{ color: pct === 100 ? "#00ff88" : "#64748b" }}>
        {conferidos}/{total}
      </span>
    </div>
  );
}

export default function InventarioExecucaoPage() {
  const { id } = useParams();
  const { data: session } = useSession();
  const [inv, setInv] = useState(null);
  const [loading, setLoading] = useState(true);
  const [setorAtivo, setSetorAtivo] = useState(null);
  const [saving, setSaving] = useState(null);
  const [finalizando, setFinalizando] = useState(false);
  const [error, setError] = useState("");
  const [flash, setFlash] = useState("");
  const [obsAberta, setObsAberta] = useState(null);
  const [obsTexto, setObsTexto] = useState("");

  const reload = useCallback(async () => {
    try {
      const data = await getInventarioById(id);
      setInv(data);
      if (!setorAtivo) {
        const groups = groupBySetor(data.registros || []);
        if (groups.length > 0) setSetorAtivo(groups[0].setor);
      }
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [id, setorAtivo]);

  useEffect(() => { reload(); }, []);

  async function marcar(assetId, status, extra = {}) {
    setSaving(assetId);
    try {
      await updateRegistro(id, assetId, { statusEncontrado: status, ...extra });
      setFlash(status === "Localizado" ? "Marcado como Localizado" : "Marcado como Não Localizado");
      setTimeout(() => setFlash(""), 2500);
      await reload();
    } catch (e) {
      setError(e.message);
    } finally {
      setSaving(null);
    }
  }

  async function salvarObs(assetId) {
    setSaving(assetId);
    try {
      await updateRegistro(id, assetId, { observacao: obsTexto, statusEncontrado: "Localizado" });
      setObsAberta(null);
      await reload();
    } catch (e) {
      setError(e.message);
    } finally {
      setSaving(null);
    }
  }

  async function handleFinalizar() {
    if (!confirm("Finalizar inventário? Esta ação não pode ser desfeita.")) return;
    setFinalizando(true);
    try {
      await finalizarInventario(id);
      await reload();
    } catch (e) {
      setError(e.message);
    } finally {
      setFinalizando(false);
    }
  }

  function handleExportar() {
    if (!inv) return;
    const assets = inv.registros.map(r => r.asset).filter(Boolean);
    exportarFormatoNAV(assets, inv.dnb?.code, `inventario_${inv.nome.replace(/\s+/g, '_')}`);
  }

  if (loading) return (
    <div className="flex items-center justify-center h-48">
      <p className="font-mono" style={{ color: "#64748b" }}>Carregando...</p>
    </div>
  );

  if (!inv) return (
    <div className="flex items-center gap-2 px-4 py-3 rounded"
      style={{ background: "#ff2d5510", border: "1px solid #ff2d5540", color: "#ff2d55" }}>
      <AlertTriangle className="h-4 w-4" />Inventário não encontrado
    </div>
  );

  const groups = groupBySetor(inv.registros || []);
  const totalGeral = inv.registros?.length || 0;
  const conferidosGeral = inv.registros?.filter(r => r.statusEncontrado !== "Pendente").length || 0;
  const naoLocGeral = inv.registros?.filter(r => r.statusEncontrado === "Não Localizado").length || 0;
  const pctGeral = totalGeral > 0 ? Math.round((conferidosGeral / totalGeral) * 100) : 0;
  const concluido = inv.status === "Concluído";
  const canManage = session?.user?.role === "gestor" || session?.user?.role === "administrador";

  const setorAtivoGroup = groups.find(g => g.setor === setorAtivo);

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-start justify-between flex-wrap gap-3">
        <div>
          <Link href="/dashboard/inventario" className="flex items-center gap-1 text-xs font-mono mb-2"
            style={{ color: "#64748b" }}>
            <ChevronLeft className="h-3 w-3" />Inventários
          </Link>
          <h1 className="text-2xl font-bold font-mono" style={{ color: "#e2e8f0" }}>{inv.nome}</h1>
          <p className="text-sm mt-1" style={{ color: "#64748b" }}>
            {inv.dnb?.code} — {inv.ano} —{" "}
            <span style={{ color: concluido ? "#00ff88" : "#00d4ff" }}>{inv.status}</span>
          </p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <button onClick={handleExportar}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-mono font-semibold"
            style={{ background: "#00d4ff15", border: "1px solid #00d4ff40", color: "#00d4ff" }}>
            <Download className="h-3.5 w-3.5" />
            Exportar NAV
          </button>
          {!concluido && canManage && (
            <button onClick={handleFinalizar} disabled={finalizando || pctGeral < 100}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-mono font-semibold"
              style={{
                background: pctGeral === 100 ? "#00ff8820" : "#1a3a4a40",
                border: `1px solid ${pctGeral === 100 ? "#00ff8840" : "#1a3a4a"}`,
                color: pctGeral === 100 ? "#00ff88" : "#374151",
                cursor: pctGeral < 100 ? "not-allowed" : "pointer",
              }}>
              <CheckCircle className="h-3.5 w-3.5" />
              {finalizando ? "Finalizando..." : "Finalizar Inventário"}
            </button>
          )}
        </div>
      </div>

      {/* Progresso geral */}
      <div className="rounded-lg p-4 grid grid-cols-2 md:grid-cols-4 gap-3"
        style={{ background: "#0f0f1a", border: "1px solid #1a3a4a" }}>
        {[
          { label: "Total de bens", value: totalGeral, color: "#e2e8f0" },
          { label: "Conferidos", value: conferidosGeral, color: "#00d4ff" },
          { label: "Não Localizados", value: naoLocGeral, color: naoLocGeral > 0 ? "#ff2d55" : "#374151" },
          { label: "Progresso", value: `${pctGeral}%`, color: pctGeral === 100 ? "#00ff88" : "#00d4ff" },
        ].map(({ label, value, color }) => (
          <div key={label}>
            <p className="text-2xl font-bold font-mono" style={{ color }}>{value}</p>
            <p className="text-xs font-mono mt-0.5" style={{ color: "#64748b" }}>{label}</p>
          </div>
        ))}
      </div>

      {error && (
        <div className="flex items-center gap-2 px-4 py-3 rounded text-sm"
          style={{ background: "#ff2d5510", border: "1px solid #ff2d5540", color: "#ff2d55" }}>
          <AlertTriangle className="h-4 w-4" />{error}
          <button onClick={() => setError("")} className="ml-auto text-xs">✕</button>
        </div>
      )}

      {flash && (
        <div className="flex items-center gap-2 px-4 py-3 rounded text-sm"
          style={{ background: "#00ff8810", border: "1px solid #00ff8840", color: "#00ff88" }}>
          <CheckCircle className="h-4 w-4" />{flash}
        </div>
      )}

      {/* Layout principal: lista de setores + registros */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4" style={{ alignItems: "start" }}>
        {/* Painel de setores */}
        <div className="rounded-lg overflow-hidden" style={{ background: "#0f0f1a", border: "1px solid #1a3a4a" }}>
          <div className="px-4 py-3 text-xs font-mono uppercase tracking-wider"
            style={{ borderBottom: "1px solid #1a3a4a", color: "#00d4ff", background: "#141428" }}>
            Setores ({groups.length})
          </div>
          <div className="divide-y" style={{ divideColor: "#1a3a4a10" }}>
            {groups.map(g => {
              const conf = g.registros.filter(r => r.statusEncontrado !== "Pendente").length;
              const isActive = g.setor === setorAtivo;
              return (
                <button key={g.setor} onClick={() => setSetorAtivo(g.setor)}
                  className="w-full text-left px-4 py-3 transition-all"
                  style={{
                    background: isActive ? "#00d4ff0f" : "transparent",
                    borderLeft: isActive ? "2px solid #00d4ff" : "2px solid transparent",
                  }}>
                  <div className="flex items-center justify-between gap-2 mb-1">
                    <span className="text-sm font-mono truncate" style={{ color: isActive ? "#00d4ff" : "#e2e8f0" }}>
                      {g.setor}
                    </span>
                    {conf === g.registros.length && (
                      <CheckCircle className="h-3.5 w-3.5 flex-shrink-0" style={{ color: "#00ff88" }} />
                    )}
                  </div>
                  <p className="text-xs mb-1" style={{ color: "#374151" }}>{g.predio}</p>
                  <SetorProgress registros={g.registros} />
                </button>
              );
            })}
          </div>
        </div>

        {/* Lista de bens do setor ativo */}
        <div className="lg:col-span-3 rounded-lg overflow-hidden" style={{ background: "#0f0f1a", border: "1px solid #1a3a4a" }}>
          <div className="px-4 py-3 flex items-center justify-between"
            style={{ borderBottom: "1px solid #1a3a4a", background: "#141428" }}>
            <div className="flex items-center gap-2">
              <MapPin className="h-4 w-4" style={{ color: "#00d4ff" }} />
              <span className="text-xs font-mono uppercase tracking-wider" style={{ color: "#00d4ff" }}>
                {setorAtivo || "Selecione um setor"}
              </span>
            </div>
            {setorAtivoGroup && (
              <span className="text-xs font-mono" style={{ color: "#64748b" }}>
                {setorAtivoGroup.registros.filter(r => r.statusEncontrado !== "Pendente").length}/{setorAtivoGroup.registros.length}
              </span>
            )}
          </div>

          {!setorAtivoGroup ? (
            <div className="flex items-center justify-center py-12">
              <p className="font-mono text-sm" style={{ color: "#374151" }}>Selecione um setor à esquerda</p>
            </div>
          ) : (
            <div className="divide-y" style={{ divideColor: "#1a3a4a15" }}>
              {setorAtivoGroup.registros.map(reg => {
                const asset = reg.asset;
                if (!asset) return null;
                const st = STATUS_COLOR[reg.statusEncontrado] || STATUS_COLOR["Pendente"];
                const isSaving = saving === asset._id;
                const isObsOpen = obsAberta === asset._id;
                return (
                  <div key={reg._id} className="px-4 py-3"
                    style={{ borderLeft: `3px solid ${st.border}` }}>
                    <div className="flex items-start justify-between gap-3 flex-wrap">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-mono font-semibold text-sm" style={{ color: "#e2e8f0" }}>
                            {asset.patrimonio}
                          </span>
                          {asset.ativoSAP && (
                            <span className="text-xs font-mono" style={{ color: "#374151" }}>{asset.ativoSAP}</span>
                          )}
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-mono"
                            style={{ background: st.bg, color: st.color, border: `1px solid ${st.border}` }}>
                            {reg.statusEncontrado === "Pendente" && <Clock className="h-3 w-3" />}
                            {reg.statusEncontrado === "Localizado" && <CheckCircle className="h-3 w-3" />}
                            {reg.statusEncontrado === "Não Localizado" && <XCircle className="h-3 w-3" />}
                            {reg.statusEncontrado}
                          </span>
                        </div>
                        <div className="mt-1 flex items-center gap-3 text-xs" style={{ color: "#64748b" }}>
                          <span className="flex items-center gap-1">
                            <Package className="h-3 w-3" />
                            {asset.tipoEquipamento || "—"}
                            {asset.subtipo && ` / ${asset.subtipo}`}
                          </span>
                          {asset.detentorNome && (
                            <span className="flex items-center gap-1">
                              <User className="h-3 w-3" />{asset.detentorNome}
                            </span>
                          )}
                        </div>
                        {reg.observacao && (
                          <p className="text-xs mt-1 italic" style={{ color: "#64748b" }}>"{reg.observacao}"</p>
                        )}
                        {reg.conferidoEm && (
                          <p className="text-xs mt-1" style={{ color: "#374151" }}>
                            Conferido em {new Date(reg.conferidoEm).toLocaleString("pt-BR")}
                          </p>
                        )}
                      </div>

                      {/* Botões de ação */}
                      {!concluido && (
                        <div className="flex items-center gap-2 flex-shrink-0">
                          <button
                            onClick={() => marcar(asset._id, "Localizado")}
                            disabled={isSaving}
                            className="flex items-center gap-1 px-3 py-1.5 rounded text-xs font-mono font-semibold transition-all"
                            style={{
                              background: reg.statusEncontrado === "Localizado" ? "#00ff8830" : "#00ff8815",
                              border: `1px solid ${reg.statusEncontrado === "Localizado" ? "#00ff88" : "#00ff8840"}`,
                              color: "#00ff88",
                              cursor: isSaving ? "not-allowed" : "pointer",
                            }}>
                            <CheckCircle className="h-3 w-3" />
                            {isSaving ? "..." : "Localizado"}
                          </button>
                          <button
                            onClick={() => marcar(asset._id, "Não Localizado")}
                            disabled={isSaving}
                            className="flex items-center gap-1 px-3 py-1.5 rounded text-xs font-mono font-semibold transition-all"
                            style={{
                              background: reg.statusEncontrado === "Não Localizado" ? "#ff2d5530" : "#ff2d5515",
                              border: `1px solid ${reg.statusEncontrado === "Não Localizado" ? "#ff2d55" : "#ff2d5540"}`,
                              color: "#ff2d55",
                              cursor: isSaving ? "not-allowed" : "pointer",
                            }}>
                            <XCircle className="h-3 w-3" />
                            {isSaving ? "..." : "Não Loc."}
                          </button>
                          <button
                            onClick={() => { setObsAberta(isObsOpen ? null : asset._id); setObsTexto(reg.observacao || ""); }}
                            className="px-2 py-1.5 rounded text-xs font-mono"
                            style={{ border: "1px solid #1a3a4a", color: "#64748b" }}>
                            Obs.
                          </button>
                        </div>
                      )}
                    </div>

                    {/* Campo de observação inline */}
                    {isObsOpen && !concluido && (
                      <div className="mt-3 flex gap-2">
                        <input
                          type="text"
                          value={obsTexto}
                          onChange={e => setObsTexto(e.target.value)}
                          placeholder="Observação sobre este bem..."
                          className="flex-1 rounded px-3 py-1.5 text-xs font-mono outline-none"
                          style={{ background: "#141428", border: "1px solid #1a3a4a", color: "#e2e8f0" }}
                        />
                        <button onClick={() => salvarObs(asset._id)}
                          className="px-3 py-1.5 rounded text-xs font-mono"
                          style={{ background: "#00d4ff15", border: "1px solid #00d4ff40", color: "#00d4ff" }}>
                          Salvar
                        </button>
                        <button onClick={() => setObsAberta(null)}
                          className="px-3 py-1.5 rounded text-xs font-mono"
                          style={{ border: "1px solid #1a3a4a", color: "#64748b" }}>
                          ✕
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Bens pendentes — alerta quando há pendentes */}
      {!concluido && (totalGeral - conferidosGeral) > 0 && (
        <div className="flex items-center gap-2 px-4 py-3 rounded text-sm"
          style={{ background: "#fbbf2410", border: "1px solid #fbbf2440", color: "#fbbf24" }}>
          <AlertTriangle className="h-4 w-4" />
          {totalGeral - conferidosGeral} bem(ns) ainda pendentes de conferência.
          {pctGeral === 100 ? "" : " Confira todos os setores para poder finalizar."}
        </div>
      )}
    </div>
  );
}
