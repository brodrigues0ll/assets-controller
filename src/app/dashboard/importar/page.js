"use client";

import { useState, useRef, useCallback } from "react";
import { Upload, FileSpreadsheet, CheckCircle, XCircle, AlertTriangle, Info } from "lucide-react";

const COLUNAS_ESPERADAS = [
  { col: "A", nome: "Entidade", campo: "(ignorado)" },
  { col: "B", nome: "Aeroporto / DNB", campo: "dnb (por código)" },
  { col: "C", nome: "Proprietário", campo: "proprietario" },
  { col: "D", nome: "Conta Nav", campo: "contaNav" },
  { col: "E", nome: "Contabilizado", campo: "contabilizado" },
  { col: "F", nome: "Categoria (código SAP)", campo: "(ignorado — diferente de categoria da app)" },
  { col: "G", nome: "Ativo nº", campo: "ativoSAP" },
  { col: "H", nome: "Denominação do imobilizado", campo: "tipoEquipamento" },
  { col: "I", nome: "Data de incorporação", campo: "dataAquisicao" },
  { col: "J", nome: "Data de serviço", campo: "dataServico" },
  { col: "K", nome: "Vida útil (meses)", campo: "vidaUtilMeses" },
  { col: "L", nome: "Vida útil restante", campo: "(calculado)" },
  { col: "M", nome: "Depreciação mensal", campo: "(calculado)" },
  { col: "N", nome: "Valor do Bem", campo: "valor" },
  { col: "O", nome: "Valor Líquido", campo: "(calculado)" },
  { col: "P", nome: "Depreciação Acumulada", campo: "(calculado)" },
  { col: "Q", nome: "Valor Residual", campo: "valorResidual" },
  { col: "R", nome: "Centro de Custo", campo: "centroCusto" },
  { col: "S", nome: "Detentor - Matrícula", campo: "detentorMatricula" },
  { col: "T", nome: "Detentor", campo: "detentorNome" },
  { col: "U", nome: "Localização (legado)", campo: "localizacaoSetor" },
  { col: "V", nome: "Número de série", campo: "numeroSerie" },
  { col: "W", nome: "Fabricante", campo: "fabricante" },
  { col: "X", nome: "Modelo", campo: "subtipo" },
  { col: "Y", nome: "Plaqueta", campo: "patrimonio (chave de upsert)" },
  { col: "Z", nome: "Situação do Bem", campo: "situacaoBem" },
  { col: "AA", nome: "Situação", campo: "situacaoOperacional" },
  { col: "AB", nome: "Status", campo: "statusLocalizacao" },
  { col: "AC", nome: "Condições de Uso", campo: "condicoesUso" },
  { col: "AD", nome: "Classificação", campo: "classificacaoInservivel" },
  { col: "AE", nome: "Descrição (texto)", campo: "descricaoCompleta (bool)" },
  { col: "AF", nome: "Plaqueta NAV", campo: "plaquetaNAV" },
  { col: "AG", nome: "Localização atualizada", campo: "setor (por codigoOficial)" },
  { col: "AH", nome: "Observação", campo: "observacoes" },
];

export default function ImportarPage() {
  const [dragging, setDragging] = useState(false);
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");
  const [showMapa, setShowMapa] = useState(false);
  const inputRef = useRef(null);

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    setDragging(false);
    const dropped = e.dataTransfer.files[0];
    if (dropped && (dropped.name.endsWith(".xlsx") || dropped.name.endsWith(".xls"))) {
      setFile(dropped);
      setResult(null);
      setError("");
    } else {
      setError("Apenas arquivos .xlsx ou .xls são aceitos.");
    }
  }, []);

  async function handleImport() {
    if (!file) return;
    setLoading(true);
    setResult(null);
    setError("");

    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await fetch("/api/assets/import", { method: "POST", body: fd });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Erro na importação");
      setResult(data);
    } catch (err) {
      setError(err.message || "Erro inesperado");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h1 className="text-2xl font-bold font-mono" style={{ color: "#e2e8f0" }}>Importar Planilha NAV Brasil</h1>
        <p className="text-sm mt-1" style={{ color: "#64748b" }}>
          Importa bens diretamente da planilha <span style={{ color: "#00d4ff" }}>047 - DNME - formato NAV Brasil</span>.
          Registros existentes (pela Plaqueta) são atualizados; novos são criados.
        </p>
      </div>

      {/* Aviso importante */}
      <div className="flex items-start gap-3 px-4 py-3 rounded"
        style={{ background: "#fbbf2410", border: "1px solid #fbbf2440", color: "#fbbf24" }}>
        <AlertTriangle className="h-4 w-4 flex-shrink-0 mt-0.5" />
        <div className="text-sm">
          <strong>Atenção:</strong> A importação usa a coluna <strong>Plaqueta (col Y)</strong> como chave de identificação.
          Bens existentes serão sobrescritos. A ação é registrada no log de auditoria.
        </div>
      </div>

      {/* Zona de upload */}
      <div
        className="rounded-lg border-2 border-dashed transition-all cursor-pointer"
        style={{ borderColor: dragging ? "#00d4ff" : "#1a3a4a", background: dragging ? "#00d4ff08" : "#0f0f1a" }}
        onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={handleDrop}
        onClick={() => inputRef.current?.click()}>
        <input ref={inputRef} type="file" accept=".xlsx,.xls" className="hidden"
          onChange={(e) => {
            const f = e.target.files[0];
            if (f) { setFile(f); setResult(null); setError(""); }
          }} />
        <div className="flex flex-col items-center justify-center py-12 px-6 text-center">
          <FileSpreadsheet className="h-12 w-12 mb-4" style={{ color: file ? "#00ff88" : "#1a3a4a" }} />
          {file ? (
            <div>
              <p className="font-mono font-semibold" style={{ color: "#00ff88" }}>{file.name}</p>
              <p className="text-xs mt-1" style={{ color: "#64748b" }}>
                {(file.size / 1024).toFixed(1)} KB — clique para trocar
              </p>
            </div>
          ) : (
            <div>
              <p className="font-mono" style={{ color: "#64748b" }}>Arraste o arquivo .xlsx aqui</p>
              <p className="text-xs mt-1" style={{ color: "#374151" }}>ou clique para selecionar</p>
            </div>
          )}
        </div>
      </div>

      {error && (
        <div className="flex items-center gap-2 px-4 py-3 rounded text-sm"
          style={{ background: "#ff2d5510", border: "1px solid #ff2d5540", color: "#ff2d55" }}>
          <XCircle className="h-4 w-4" />{error}
        </div>
      )}

      {/* Botão importar */}
      {file && !result && (
        <button onClick={handleImport} disabled={loading}
          className="flex items-center gap-2 px-6 py-3 rounded font-mono font-semibold transition-all"
          style={{
            background: loading ? "#00d4ff10" : "#00d4ff20",
            border: "1px solid #00d4ff40",
            color: loading ? "#00d4ff60" : "#00d4ff",
            cursor: loading ? "not-allowed" : "pointer",
          }}>
          <Upload className="h-4 w-4" />
          {loading ? "Importando..." : "Importar Planilha"}
        </button>
      )}

      {/* Resultado */}
      {result && (
        <div className="space-y-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {[
              { label: "Linhas lidas", value: result.totalLinhas, color: "#00d4ff" },
              { label: "Criados", value: result.criados, color: "#00ff88" },
              { label: "Atualizados", value: result.atualizados, color: "#a855f7" },
              { label: "Erros", value: result.erros?.length || 0, color: result.erros?.length > 0 ? "#ff2d55" : "#374151" },
            ].map(({ label, value, color }) => (
              <div key={label} className="rounded-lg p-4" style={{ background: "#0f0f1a", border: "1px solid #1a3a4a" }}>
                <p className="text-3xl font-bold font-mono" style={{ color }}>{value}</p>
                <p className="text-xs font-mono mt-1" style={{ color: "#64748b" }}>{label}</p>
              </div>
            ))}
          </div>

          <div className="flex items-center gap-2 px-4 py-3 rounded text-sm"
            style={{ background: "#00ff8810", border: "1px solid #00ff8840", color: "#00ff88" }}>
            <CheckCircle className="h-4 w-4" />
            Importação concluída — {result.criados} criados, {result.atualizados} atualizados.
            {result.ignorados > 0 && <span style={{ color: "#64748b" }}> {result.ignorados} linhas vazias ignoradas.</span>}
          </div>

          {result.erros?.length > 0 && (
            <div className="rounded-lg overflow-hidden" style={{ background: "#0f0f1a", border: "1px solid #ff2d5540" }}>
              <div className="px-4 py-3 flex items-center gap-2" style={{ borderBottom: "1px solid #ff2d5520", background: "#ff2d5510" }}>
                <XCircle className="h-4 w-4" style={{ color: "#ff2d55" }} />
                <span className="text-sm font-mono font-semibold" style={{ color: "#ff2d55" }}>
                  {result.erros.length} erro{result.erros.length !== 1 ? "s" : ""}
                </span>
              </div>
              <div className="divide-y" style={{ divideColor: "#1a3a4a10" }}>
                {result.erros.map((e, i) => (
                  <div key={i} className="px-4 py-2.5 flex items-start gap-3 text-sm">
                    <span className="font-mono text-xs px-2 py-0.5 rounded" style={{ background: "#ff2d5515", color: "#ff2d55" }}>
                      L{e.linha}
                    </span>
                    <span className="font-mono font-semibold" style={{ color: "#e2e8f0" }}>{e.patrimonio}</span>
                    <span style={{ color: "#64748b" }}>{e.erro}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          <button onClick={() => { setFile(null); setResult(null); }}
            className="text-xs font-mono underline" style={{ color: "#64748b" }}>
            Importar outro arquivo
          </button>
        </div>
      )}

      {/* Mapa de colunas */}
      <div className="rounded-lg overflow-hidden" style={{ background: "#0f0f1a", border: "1px solid #1a3a4a" }}>
        <button
          className="w-full flex items-center justify-between px-4 py-3 text-left"
          style={{ borderBottom: showMapa ? "1px solid #1a3a4a" : "none" }}
          onClick={() => setShowMapa(v => !v)}>
          <span className="flex items-center gap-2 text-xs font-mono uppercase tracking-wider" style={{ color: "#00d4ff" }}>
            <Info className="h-4 w-4" />
            Mapeamento de Colunas da Planilha NAV
          </span>
          <span className="text-xs" style={{ color: "#374151" }}>{showMapa ? "▲ ocultar" : "▼ mostrar"}</span>
        </button>
        {showMapa && (
          <div className="overflow-x-auto">
            <table className="w-full text-xs font-mono">
              <thead>
                <tr style={{ background: "#141428", borderBottom: "1px solid #1a3a4a" }}>
                  <th className="px-4 py-2 text-left" style={{ color: "#00d4ff" }}>Col</th>
                  <th className="px-4 py-2 text-left" style={{ color: "#00d4ff" }}>Nome na Planilha</th>
                  <th className="px-4 py-2 text-left" style={{ color: "#00d4ff" }}>Campo no Sistema</th>
                </tr>
              </thead>
              <tbody>
                {COLUNAS_ESPERADAS.map((c, i) => (
                  <tr key={c.col}
                    style={{ borderBottom: "1px solid #1a3a4a10", background: i % 2 === 0 ? "transparent" : "#141428" }}>
                    <td className="px-4 py-2" style={{ color: "#374151" }}>{c.col}</td>
                    <td className="px-4 py-2" style={{ color: "#e2e8f0" }}>{c.nome}</td>
                    <td className="px-4 py-2" style={{ color: c.campo.startsWith("(") ? "#374151" : "#00ff88" }}>
                      {c.campo}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
