"use client";

import { useState, useEffect } from "react";
import { getAssets } from "@/lib/actions/assets";
import { FileWarning, ExternalLink, AlertTriangle } from "lucide-react";
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

const CAMPOS_OBRIGATORIOS = [
  { key: "tipoEquipamento", label: "Denominação" },
  { key: "subtipo", label: "Modelo" },
  { key: "fabricante", label: "Fabricante" },
  { key: "detentorNome", label: "Detentor" },
  { key: "detentorMatricula", label: "Matrícula" },
  { key: "valor", label: "Valor" },
  { key: "dataAquisicao", label: "Data Incorporação" },
  { key: "vidaUtilMeses", label: "Vida Útil" },
  { key: "proprietario", label: "Proprietário" },
];

function camposFaltando(asset) {
  return CAMPOS_OBRIGATORIOS.filter(c => {
    const v = asset[c.key];
    return v === null || v === undefined || v === "";
  }).map(c => c.label);
}

export default function DescricaoIncompletaPage() {
  const [assets, setAssets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [sortCol, setSortCol] = useState(null);
  const [sortDir, setSortDir] = useState("asc");

  useEffect(() => { load(); }, []);

  async function load() {
    try {
      setLoading(true);
      const result = await getAssets({ descricaoCompleta: "false", limit: 0 });
      setAssets(result.assets || []);
    } catch {
      setError("Erro ao carregar bens com descrição incompleta");
    } finally {
      setLoading(false);
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
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold font-mono" style={{ color: "#e2e8f0" }}>Descrição Incompleta</h1>
          <p className="text-sm mt-1" style={{ color: "#64748b" }}>
            Bens com campo <span style={{ color: "#fbbf24" }}>Descrição Completa = Não</span> — requerem complementação para o inventário NAV Brasil
          </p>
        </div>
        <span className="inline-flex items-center px-3 py-1.5 rounded-full text-sm font-mono font-bold"
          style={{ background: assets.length > 0 ? "#fbbf2420" : "#00ff8820", color: assets.length > 0 ? "#fbbf24" : "#00ff88", border: `1px solid ${assets.length > 0 ? "#fbbf2440" : "#00ff8840"}` }}>
          <FileWarning className="h-4 w-4 mr-1.5" />
          {assets.length}
        </span>
      </div>

      <div className="flex items-start gap-2 px-4 py-3 rounded text-sm"
        style={{ background: "#fbbf2410", border: "1px solid #fbbf2440", color: "#fbbf24" }}>
        <AlertTriangle className="h-4 w-4 flex-shrink-0 mt-0.5" />
        <span>
          Campos mínimos exigidos: <span className="font-mono">{CAMPOS_OBRIGATORIOS.map(c => c.label).join(", ")}</span>.
          Edite cada ativo e marque "Descrição Completa" quando todos os campos estiverem preenchidos.
        </span>
      </div>

      {error && (
        <div className="flex items-center gap-2 px-4 py-3 rounded text-sm"
          style={{ background: "#ff2d5510", border: "1px solid #ff2d5540", color: "#ff2d55" }}>
          <AlertTriangle className="h-4 w-4" />{error}
        </div>
      )}

      {assets.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 rounded-lg"
          style={{ background: "#0f0f1a", border: "1px solid #1a3a4a" }}>
          <FileWarning className="h-12 w-12 mb-4" style={{ color: "#00ff88" }} />
          <p className="font-mono text-sm" style={{ color: "#00ff88" }}>Todos os bens com descrição completa</p>
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
                  <Th col="setor.nome">Setor</Th>
                  <th className="px-4 py-3 text-left text-xs font-mono uppercase tracking-wider" style={thStyle}>
                    Campos em Falta
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-mono uppercase tracking-wider" style={thStyle}>Editar</th>
                </tr>
              </thead>
              <tbody>
                {sorted.map((asset, idx) => {
                  const faltando = camposFaltando(asset);
                  return (
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
                        <div>{asset.tipoEquipamento || <span style={{ color: "#374151" }}>—</span>}</div>
                        {asset.subtipo && <div className="text-xs mt-0.5" style={{ color: "#64748b" }}>{asset.subtipo}</div>}
                      </td>
                      <td className="px-4 py-3 text-sm" style={{ color: "#94a3b8" }}>
                        <div>{asset.detentorNome || asset.usuarioResponsavel || <span style={{ color: "#374151" }}>—</span>}</div>
                        {asset.detentorMatricula && <div className="text-xs" style={{ color: "#374151" }}>Mat: {asset.detentorMatricula}</div>}
                      </td>
                      <td className="px-4 py-3 text-sm font-mono" style={{ color: "#64748b" }}>
                        {asset.dnb?.code || "—"}
                      </td>
                      <td className="px-4 py-3 text-sm" style={{ color: "#64748b" }}>
                        {asset.setor?.nome || asset.localizacaoSetor || "—"}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex flex-wrap gap-1">
                          {faltando.length === 0 ? (
                            <span className="text-xs font-mono px-2 py-0.5 rounded-full"
                              style={{ background: "#00ff8820", color: "#00ff88", border: "1px solid #00ff8840" }}>
                              Completo
                            </span>
                          ) : faltando.map(f => (
                            <span key={f} className="text-xs font-mono px-2 py-0.5 rounded-full"
                              style={{ background: "#fbbf2415", color: "#fbbf24", border: "1px solid #fbbf2430" }}>
                              {f}
                            </span>
                          ))}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <Link href={`/dashboard/assets/${asset._id}/edit`}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-mono font-semibold transition-all"
                          style={{ background: "#00d4ff15", border: "1px solid #00d4ff40", color: "#00d4ff" }}>
                          Editar
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
