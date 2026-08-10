"use client";

import { useState, useEffect } from "react";
import { getAssets } from "@/lib/actions/assets";
import { AlertTriangle, ExternalLink, Download } from "lucide-react";
import Link from "next/link";

const CLASSIF_STYLE = {
  "Irrecuperável":  { bg: "#ff2d5520", color: "#ff2d55", border: "#ff2d5540" },
  "Antieconômico":  { bg: "#fbbf2420", color: "#fbbf24", border: "#fbbf2440" },
  "Ocioso":         { bg: "#a855f720", color: "#a855f7", border: "#a855f740" },
  "Recuperável":    { bg: "#00d4ff20", color: "#00d4ff", border: "#00d4ff40" },
};

function calcValorLiquido(asset) {
  if (!asset.valor || !asset.vidaUtilMeses || asset.vidaUtilMeses <= 0) return null;
  const residual = asset.valorResidual || 0;
  const depMensal = (asset.valor - residual) / asset.vidaUtilMeses;
  const dataBase = asset.dataServico || asset.dataAquisicao;
  if (!dataBase) return null;
  const inicio = new Date(dataBase);
  const hoje = new Date();
  const meses = Math.max(0, (hoje.getFullYear() - inicio.getFullYear()) * 12 + (hoje.getMonth() - inicio.getMonth()));
  return Math.max(residual, asset.valor - depMensal * meses);
}

function getVal(obj, path) {
  return path.split(".").reduce((o, k) => o?.[k], obj) ?? "";
}

function exportCSV(assets) {
  const headers = ["Patrimônio/Plaqueta","Ativo nº (SAP)","Denominação","Modelo","Fabricante","Classificação","Proprietário","Valor Original (R$)","Valor Líquido (R$)","DNB","Prédio","Setor","Detentor","Matrícula","Sit. Operacional","Sit. do Bem"];
  const rows = assets.map(a => [
    a.patrimonio || "", a.ativoSAP || "", a.tipoEquipamento || "", a.subtipo || "",
    a.fabricante || "", a.classificacaoInservivel || "", a.proprietario || "",
    a.valor != null ? a.valor.toLocaleString("pt-BR", { minimumFractionDigits: 2 }) : "",
    calcValorLiquido(a) != null ? calcValorLiquido(a).toLocaleString("pt-BR", { minimumFractionDigits: 2 }) : "",
    a.dnb?.code || "", a.setor?.predio?.nome || "", a.setor?.nome || a.localizacaoSetor || "",
    a.detentorNome || "", a.detentorMatricula || "", a.situacaoOperacional || "", a.situacaoBem || "",
  ]);
  const csv = [headers, ...rows].map(r => r.map(c => `"${String(c).replace(/"/g, '""')}"`).join(",")).join("\n");
  const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `alienacao_${new Date().toISOString().split("T")[0]}.csv`;
  a.click();
}

export default function AlienacaoPage() {
  const [assets, setAssets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [filtroClassif, setFiltroClassif] = useState("");
  const [sortCol, setSortCol] = useState(null);
  const [sortDir, setSortDir] = useState("asc");

  useEffect(() => { load(); }, []);

  async function load() {
    try {
      setLoading(true);
      const result = await getAssets({ situacaoOperacional: "Inservível", limit: 0 });
      setAssets(result.assets || []);
    } catch {
      setError("Erro ao carregar bens para alienação");
    } finally {
      setLoading(false);
    }
  }

  function handleSort(col) {
    if (sortCol === col) setSortDir(d => d === "asc" ? "desc" : "asc");
    else { setSortCol(col); setSortDir("asc"); }
  }

  const filtered = filtroClassif ? assets.filter(a => a.classificacaoInservivel === filtroClassif) : assets;
  const sorted = sortCol
    ? [...filtered].sort((a, b) => {
        const av = String(getVal(a, sortCol) ?? "").toLowerCase();
        const bv = String(getVal(b, sortCol) ?? "").toLowerCase();
        return sortDir === "asc" ? av.localeCompare(bv, "pt") : bv.localeCompare(av, "pt");
      })
    : filtered;

  const thStyle = { color: "#00d4ff", background: "#141428" };
  const thClass = "px-4 py-3 text-left text-xs font-mono uppercase tracking-wider cursor-pointer select-none";

  function Th({ col, children }) {
    return (
      <th className={thClass} style={thStyle} onClick={() => handleSort(col)}
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

  const contagens = ["Irrecuperável","Antieconômico","Ocioso","Recuperável"].map(c => ({
    label: c, count: assets.filter(a => a.classificacaoInservivel === c).length,
    semClassif: assets.filter(a => !a.classificacaoInservivel).length,
  }));

  if (loading) return (
    <div className="flex items-center justify-center h-48">
      <p className="font-mono" style={{ color: "#64748b" }}>Carregando...</p>
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold font-mono" style={{ color: "#e2e8f0" }}>Bens para Alienação</h1>
          <p className="text-sm mt-1" style={{ color: "#64748b" }}>
            Bens com Situação Operacional = Inservível — equivale à Aba V da planilha NAV Brasil
          </p>
        </div>
        <button onClick={() => exportCSV(sorted)}
          className="flex items-center gap-2 px-4 py-2 rounded font-mono text-sm font-semibold transition-all"
          style={{ background: "#00d4ff15", border: "1px solid #00d4ff40", color: "#00d4ff" }}>
          <Download className="h-4 w-4" />
          Exportar CSV
        </button>
      </div>

      {/* Cards de contagem por classificação */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {["Irrecuperável","Antieconômico","Ocioso","Recuperável"].map(c => {
          const st = CLASSIF_STYLE[c];
          const count = assets.filter(a => a.classificacaoInservivel === c).length;
          return (
            <button key={c} onClick={() => setFiltroClassif(filtroClassif === c ? "" : c)}
              className="p-3 rounded-lg text-left transition-all"
              style={{ background: filtroClassif === c ? st.bg : "#0f0f1a", border: `1px solid ${filtroClassif === c ? st.border : "#1a3a4a"}` }}>
              <p className="text-2xl font-bold font-mono" style={{ color: st.color }}>{count}</p>
              <p className="text-xs font-mono mt-0.5" style={{ color: "#64748b" }}>{c}</p>
            </button>
          );
        })}
      </div>

      {assets.filter(a => !a.classificacaoInservivel).length > 0 && (
        <div className="flex items-center gap-2 px-4 py-2 rounded text-sm"
          style={{ background: "#fbbf2410", border: "1px solid #fbbf2440", color: "#fbbf24" }}>
          <AlertTriangle className="h-4 w-4" />
          {assets.filter(a => !a.classificacaoInservivel).length} bens inservíveis sem classificação — edite-os para definir Irrecuperável, Antieconômico, Ocioso ou Recuperável.
        </div>
      )}

      {filtroClassif && (
        <div className="flex items-center gap-2 text-xs font-mono" style={{ color: "#64748b" }}>
          Filtrando por: <span style={{ color: CLASSIF_STYLE[filtroClassif]?.color }}>{filtroClassif}</span>
          <button onClick={() => setFiltroClassif("")} className="underline" style={{ color: "#64748b" }}>limpar</button>
        </div>
      )}

      {error && (
        <div className="flex items-center gap-2 px-4 py-3 rounded text-sm"
          style={{ background: "#ff2d5510", border: "1px solid #ff2d5540", color: "#ff2d55" }}>
          <AlertTriangle className="h-4 w-4" />{error}
        </div>
      )}

      <div className="rounded-lg overflow-hidden" style={{ background: "#0f0f1a", border: "1px solid #1a3a4a" }}>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr style={{ borderBottom: "1px solid #1a3a4a" }}>
                <Th col="patrimonio">Patrimônio / Plaqueta</Th>
                <Th col="tipoEquipamento">Denominação</Th>
                <Th col="classificacaoInservivel">Classificação</Th>
                <Th col="proprietario">Proprietário</Th>
                <Th col="valor">Valor Original</Th>
                <th className="px-4 py-3 text-left text-xs font-mono uppercase tracking-wider" style={thStyle}>Valor Líquido</th>
                <Th col="dnb.code">DNB</Th>
                <Th col="setor.nome">Setor</Th>
                <Th col="detentorNome">Detentor</Th>
                <th className="px-4 py-3 text-left text-xs font-mono uppercase tracking-wider" style={thStyle}>Ver</th>
              </tr>
            </thead>
            <tbody>
              {sorted.length === 0 ? (
                <tr><td colSpan={10} className="px-4 py-8 text-center font-mono text-sm" style={{ color: "#64748b" }}>Nenhum registro encontrado</td></tr>
              ) : sorted.map((asset, idx) => {
                const st = CLASSIF_STYLE[asset.classificacaoInservivel] || { bg: "#6b728020", color: "#6b7280", border: "#6b728040" };
                const vl = calcValorLiquido(asset);
                return (
                  <tr key={asset._id}
                    style={{ borderBottom: "1px solid #1a3a4a20", background: idx % 2 === 0 ? "transparent" : "#141428" }}>
                    <td className="px-4 py-3">
                      <span className="font-mono text-sm font-semibold" style={{ color: "#e2e8f0" }}>{asset.patrimonio}</span>
                      {asset.ativoSAP && <p className="text-xs mt-0.5" style={{ color: "#374151" }}>{asset.ativoSAP}</p>}
                    </td>
                    <td className="px-4 py-3 text-sm font-mono" style={{ color: "#e2e8f0" }}>
                      <div>{asset.tipoEquipamento || "—"}</div>
                      {asset.subtipo && <div className="text-xs" style={{ color: "#64748b" }}>{asset.subtipo}</div>}
                    </td>
                    <td className="px-4 py-3">
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-mono"
                        style={{ background: st.bg, color: st.color, border: `1px solid ${st.border}` }}>
                        {asset.classificacaoInservivel || "Não classificado"}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-xs font-mono" style={{ color: "#64748b" }}>{asset.proprietario || "—"}</td>
                    <td className="px-4 py-3 text-sm font-mono" style={{ color: "#e2e8f0" }}>
                      {asset.valor != null ? asset.valor.toLocaleString("pt-BR", { style: "currency", currency: "BRL" }) : "—"}
                    </td>
                    <td className="px-4 py-3 text-sm font-mono" style={{ color: vl != null && vl < (asset.valor || 0) * 0.1 ? "#ff2d55" : "#94a3b8" }}>
                      {vl != null ? vl.toLocaleString("pt-BR", { style: "currency", currency: "BRL" }) : "—"}
                    </td>
                    <td className="px-4 py-3 text-xs font-mono" style={{ color: "#64748b" }}>{asset.dnb?.code || "—"}</td>
                    <td className="px-4 py-3 text-sm" style={{ color: "#64748b" }}>
                      {asset.setor?.nome || asset.localizacaoSetor || "—"}
                    </td>
                    <td className="px-4 py-3 text-sm" style={{ color: "#94a3b8" }}>
                      <div>{asset.detentorNome || asset.usuarioResponsavel || "—"}</div>
                      {asset.detentorMatricula && <div className="text-xs" style={{ color: "#374151" }}>Mat: {asset.detentorMatricula}</div>}
                    </td>
                    <td className="px-4 py-3">
                      <Link href={`/dashboard/assets/${asset._id}`}
                        className="p-1.5 rounded transition-all inline-flex"
                        style={{ color: "#64748b" }}
                        onMouseEnter={(e) => { e.currentTarget.style.color = "#00d4ff"; }}
                        onMouseLeave={(e) => { e.currentTarget.style.color = "#64748b"; }}>
                        <ExternalLink className="h-4 w-4" />
                      </Link>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
