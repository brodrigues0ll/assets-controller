"use client";

import { useState, useEffect } from "react";
import { getAssets, updateAsset } from "@/lib/actions/assets";
import { useSession } from "next-auth/react";
import { MapPinOff, CheckCircle, AlertTriangle, ExternalLink } from "lucide-react";
import Link from "next/link";

function getSortedData(data, col, dir) {
  if (!col) return data;
  return [...data].sort((a, b) => {
    const av = String(getVal(a, col) ?? "").toLowerCase();
    const bv = String(getVal(b, col) ?? "").toLowerCase();
    return dir === "asc" ? av.localeCompare(bv, "pt") : bv.localeCompare(av, "pt");
  });
}
function getVal(obj, path) {
  return path.split(".").reduce((o, k) => o?.[k], obj) ?? "";
}

export default function NaoLocalizadosPage() {
  const { data: session } = useSession();
  const [assets, setAssets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [sortCol, setSortCol] = useState(null);
  const [sortDir, setSortDir] = useState("asc");
  const [marking, setMarking] = useState(null);
  const [flash, setFlash] = useState("");

  const canEdit = session?.user?.role === "gestor" || session?.user?.role === "administrador";

  useEffect(() => { load(); }, []);

  async function load() {
    try {
      setLoading(true);
      const result = await getAssets({ statusLocalizacao: "Não Localizado", limit: 0 });
      setAssets(result.assets || []);
    } catch {
      setError("Erro ao carregar bens não localizados");
    } finally {
      setLoading(false);
    }
  }

  async function marcarLocalizado(asset) {
    if (!confirm(`Marcar "${asset.patrimonio} — ${asset.tipoEquipamento || asset.subtipo}" como Localizado?`)) return;
    setMarking(asset._id);
    try {
      await updateAsset(asset._id, { statusLocalizacao: "Localizado" });
      setFlash(`${asset.patrimonio} marcado como Localizado`);
      setTimeout(() => setFlash(""), 3000);
      await load();
    } catch (err) {
      alert(err.message || "Erro ao atualizar");
    } finally {
      setMarking(null);
    }
  }

  function handleSort(col) {
    if (sortCol === col) setSortDir(d => d === "asc" ? "desc" : "asc");
    else { setSortCol(col); setSortDir("asc"); }
  }

  const sorted = getSortedData(assets, sortCol, sortDir);

  const thStyle = { color: "#00d4ff", background: "#141428" };
  const thClass = "px-4 py-3 text-left text-xs font-mono uppercase tracking-wider cursor-pointer select-none";

  function Th({ col, children }) {
    return (
      <th className={thClass} style={thStyle}
        onClick={() => handleSort(col)}
        onMouseEnter={(e) => { e.currentTarget.style.color = "#e2e8f0"; }}
        onMouseLeave={(e) => { e.currentTarget.style.color = "#00d4ff"; }}>
        <span className="flex items-center gap-1">
          {children}
          <span style={{ opacity: sortCol === col ? 1 : 0.25, fontSize: "10px" }}>
            {sortCol === col && sortDir === "desc" ? "▼" : "▲"}
          </span>
        </span>
      </th>
    );
  }

  if (loading) return (
    <div className="flex items-center justify-center h-48">
      <p className="font-mono" style={{ color: "#64748b" }}>Carregando...</p>
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold font-mono" style={{ color: "#e2e8f0" }}>
            Bens Não Localizados
          </h1>
          <p className="text-sm mt-1" style={{ color: "#64748b" }}>
            {assets.length} {assets.length === 1 ? "bem não localizado" : "bens não localizados"} — equivale à Aba III da planilha NAV Brasil
          </p>
        </div>
        <span className="inline-flex items-center px-3 py-1.5 rounded-full text-sm font-mono font-bold"
          style={{ background: assets.length > 0 ? "#ff2d5520" : "#00ff8820", color: assets.length > 0 ? "#ff2d55" : "#00ff88", border: `1px solid ${assets.length > 0 ? "#ff2d5540" : "#00ff8840"}` }}>
          <MapPinOff className="h-4 w-4 mr-1.5" />
          {assets.length}
        </span>
      </div>

      {error && (
        <div className="flex items-center gap-2 px-4 py-3 rounded text-sm"
          style={{ background: "#ff2d5510", border: "1px solid #ff2d5540", color: "#ff2d55" }}>
          <AlertTriangle className="h-4 w-4" />{error}
        </div>
      )}

      {flash && (
        <div className="flex items-center gap-2 px-4 py-3 rounded text-sm"
          style={{ background: "#00ff8810", border: "1px solid #00ff8840", color: "#00ff88" }}>
          <CheckCircle className="h-4 w-4" />{flash}
        </div>
      )}

      {assets.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 rounded-lg"
          style={{ background: "#0f0f1a", border: "1px solid #1a3a4a" }}>
          <CheckCircle className="h-12 w-12 mb-4" style={{ color: "#00ff88" }} />
          <p className="font-mono text-sm" style={{ color: "#00ff88" }}>Nenhum bem não localizado</p>
        </div>
      ) : (
        <div className="rounded-lg overflow-hidden" style={{ background: "#0f0f1a", border: "1px solid #1a3a4a" }}>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr style={{ borderBottom: "1px solid #1a3a4a" }}>
                  <Th col="patrimonio">Patrimônio / Plaqueta</Th>
                  <Th col="tipoEquipamento">Denominação</Th>
                  <Th col="detentorNome">Detentor</Th>
                  <Th col="dnb.code">DNB</Th>
                  <Th col="setor.predio.nome">Prédio</Th>
                  <Th col="setor.nome">Setor</Th>
                  <Th col="situacaoOperacional">Sit. Operacional</Th>
                  <Th col="updatedAt">Atualizado em</Th>
                  <th className="px-4 py-3 text-left text-xs font-mono uppercase tracking-wider"
                    style={{ color: "#00d4ff", background: "#141428" }}>Ações</th>
                </tr>
              </thead>
              <tbody>
                {sorted.map((asset, idx) => (
                  <tr key={asset._id}
                    style={{ borderBottom: "1px solid #1a3a4a20", background: idx % 2 === 0 ? "transparent" : "#141428" }}>
                    <td className="px-4 py-3">
                      <Link href={`/dashboard/assets/${asset._id}`}
                        className="font-mono text-sm font-semibold flex items-center gap-1"
                        style={{ color: "#00d4ff" }}>
                        {asset.patrimonio}
                        <ExternalLink className="h-3 w-3" />
                      </Link>
                      {asset.ativoSAP && <p className="text-xs mt-0.5" style={{ color: "#374151" }}>{asset.ativoSAP}</p>}
                    </td>
                    <td className="px-4 py-3 text-sm font-mono" style={{ color: "#e2e8f0" }}>
                      <div>{asset.tipoEquipamento || "—"}</div>
                      {asset.subtipo && <div className="text-xs mt-0.5" style={{ color: "#64748b" }}>{asset.subtipo}</div>}
                    </td>
                    <td className="px-4 py-3 text-sm" style={{ color: "#94a3b8" }}>
                      <div>{asset.detentorNome || asset.usuarioResponsavel || "—"}</div>
                      {asset.detentorMatricula && <div className="text-xs" style={{ color: "#374151" }}>Mat: {asset.detentorMatricula}</div>}
                    </td>
                    <td className="px-4 py-3 text-sm font-mono" style={{ color: "#64748b" }}>
                      {asset.dnb?.code || "—"}
                    </td>
                    <td className="px-4 py-3 text-sm" style={{ color: "#64748b" }}>
                      {asset.setor?.predio?.nome || "—"}
                    </td>
                    <td className="px-4 py-3 text-sm" style={{ color: "#64748b" }}>
                      {asset.setor?.nome || asset.localizacaoSetor || "—"}
                    </td>
                    <td className="px-4 py-3">
                      {asset.situacaoOperacional ? (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-mono"
                          style={{ background: "#ff2d5510", color: "#ff2d55", border: "1px solid #ff2d5540" }}>
                          {asset.situacaoOperacional}
                        </span>
                      ) : "—"}
                    </td>
                    <td className="px-4 py-3 text-xs font-mono" style={{ color: "#64748b" }}>
                      {asset.updatedAt ? new Date(asset.updatedAt).toLocaleDateString("pt-BR") : "—"}
                    </td>
                    <td className="px-4 py-3">
                      {canEdit && (
                        <button
                          onClick={() => marcarLocalizado(asset)}
                          disabled={marking === asset._id}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-mono font-semibold transition-all"
                          style={{ background: "#00ff8815", border: "1px solid #00ff8840", color: marking === asset._id ? "#00ff8860" : "#00ff88", cursor: marking === asset._id ? "not-allowed" : "pointer" }}>
                          <CheckCircle className="h-3.5 w-3.5" />
                          {marking === asset._id ? "Salvando..." : "Localizado"}
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
