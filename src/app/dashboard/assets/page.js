"use client";

import { useState, useEffect, useRef } from "react";
import { getAssets, deleteAsset } from "@/lib/actions/assets";
import { getAllDNBs } from "@/lib/actions/dnbs";
import { getCategorias } from "@/lib/actions/categorias";
import {
  Plus, Search, Download, Filter, Edit, Trash2, Eye, ScanLine, ChevronLeft, ChevronRight,
} from "lucide-react";
import { useSession } from "next-auth/react";
import { exportAssetsToCSV } from "@/lib/exportAssets";
import Link from "next/link";

const PAGE_SIZE = 25;

const SITUACOES = [
  "Ativo", "Em uso", "Em estoque", "Com defeito", "Em manutenção", "Reserva", "Descartado",
];

function getSituacaoStyle(situacao) {
  const styles = {
    Ativo:           { bg: "#00ff8820", color: "#00ff88", border: "#00ff8840" },
    "Em uso":        { bg: "#00ff8820", color: "#00ff88", border: "#00ff8840" },
    "Em estoque":    { bg: "#00d4ff20", color: "#00d4ff", border: "#00d4ff40" },
    "Com defeito":   { bg: "#ff2d5520", color: "#ff2d55", border: "#ff2d5540" },
    "Em manutenção": { bg: "#fbbf2420", color: "#fbbf24", border: "#fbbf2440" },
    Reserva:         { bg: "#a855f720", color: "#a855f7", border: "#a855f740" },
    Descartado:      { bg: "#6b728020", color: "#6b7280", border: "#6b728040" },
  };
  return styles[situacao] || styles["Descartado"];
}

const selectStyle = {
  background: "#0f0f1a",
  border: "1px solid #1a3a4a",
  color: "#e2e8f0",
  outline: "none",
};

export default function AssetsPage() {
  const { data: session } = useSession();

  const [assets, setAssets] = useState([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);

  const [dnbs, setDnbs] = useState([]);
  const [categorias, setCategorias] = useState([]);

  const [searchTerm, setSearchTerm] = useState("");
  const [filterDnb, setFilterDnb] = useState("");
  const [filterCategoria, setFilterCategoria] = useState("");
  const [filterSituacao, setFilterSituacao] = useState("");

  const debounceRef = useRef(null);
  const [sortCol, setSortCol] = useState(null);
  const [sortDir, setSortDir] = useState('asc');

  function handleSort(col) {
    if (sortCol === col) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    else { setSortCol(col); setSortDir('asc'); }
  }

  function getVal(obj, path) {
    return path.split('.').reduce((o, k) => o?.[k], obj) ?? '';
  }

  const sortedAssets = [...assets].sort((a, b) => {
    if (!sortCol) return 0;
    const av = String(getVal(a, sortCol)).toLowerCase();
    const bv = String(getVal(b, sortCol)).toLowerCase();
    return sortDir === 'asc' ? av.localeCompare(bv, 'pt') : bv.localeCompare(av, 'pt');
  });

  // Carrega DNBs e categorias uma vez
  useEffect(() => {
    Promise.all([getAllDNBs(), getCategorias().catch(() => [])]).then(([d, c]) => {
      setDnbs(d);
      setCategorias(c);
    });
  }, []);

  // Dispara busca ao mudar filtros ou página (com debounce na busca textual)
  useEffect(() => {
    clearTimeout(debounceRef.current);
    const delay = searchTerm.length > 0 && searchTerm.length < 2 ? 0 : searchTerm ? 400 : 0;
    debounceRef.current = setTimeout(async () => {
      setLoading(true);
      try {
        const data = await getAssets({
          page,
          limit: PAGE_SIZE,
          search: searchTerm,
          dnb: filterDnb,
          categoria: filterCategoria,
          situacao: filterSituacao,
        });
        setAssets(data.assets);
        setTotal(data.total);
        setTotalPages(data.totalPages);
      } catch {
        // silencioso
      } finally {
        setLoading(false);
      }
    }, delay);
    return () => clearTimeout(debounceRef.current);
  }, [searchTerm, filterDnb, filterCategoria, filterSituacao, page]);

  function handleFilter(setter) {
    return (e) => { setter(e.target.value); setPage(1); };
  }

  function handleSearch(e) {
    setSearchTerm(e.target.value);
    setPage(1);
  }

  async function handleDelete(id) {
    if (!confirm("Tem certeza que deseja excluir este ativo?")) return;
    try {
      await deleteAsset(id);
      // Recarrega a página atual
      const data = await getAssets({ page, limit: PAGE_SIZE, search: searchTerm, dnb: filterDnb, categoria: filterCategoria, situacao: filterSituacao });
      setAssets(data.assets);
      setTotal(data.total);
      setTotalPages(data.totalPages);
    } catch (error) {
      alert(error.message || "Erro ao excluir ativo");
    }
  }

  async function handleExportCSV() {
    try {
      const data = await getAssets({ page: 1, limit: 0, search: searchTerm, dnb: filterDnb, categoria: filterCategoria, situacao: filterSituacao });
      exportAssetsToCSV(data.assets, "ativos_nav_brasil");
    } catch {
      alert("Erro ao exportar");
    }
  }

  const canEdit = session?.user?.role === "gestor" || session?.user?.role === "administrador";
  const canCreate = session?.user?.role !== "tecnico" || session?.user?.dnb;

  const start = total === 0 ? 0 : (page - 1) * PAGE_SIZE + 1;
  const end = Math.min(page * PAGE_SIZE, total);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold font-mono" style={{ color: "#e2e8f0" }}>Ativos</h1>
          <p className="text-sm mt-1" style={{ color: "#64748b" }}>
            Inventário de patrimônios ({total} registros)
          </p>
        </div>
        <div className="flex gap-2">
          <Link
            href="/scan"
            className="flex items-center gap-2 px-3 py-2 rounded text-sm font-mono font-semibold transition-all"
            style={{ background: "#00d4ff10", border: "1px solid #00d4ff30", color: "#00d4ff" }}
          >
            <ScanLine className="h-4 w-4" />
            Scanner
          </Link>
          <button
            className="flex items-center gap-2 px-3 py-2 rounded text-sm font-mono font-semibold transition-all"
            style={{ background: "#141428", border: "1px solid #1a3a4a", color: "#64748b" }}
            onClick={handleExportCSV}
            disabled={total === 0}
          >
            <Download className="h-4 w-4" />
            CSV
          </button>
          {canCreate && (
            <Link
              href="/dashboard/assets/new"
              className="flex items-center gap-2 px-4 py-2 rounded text-sm font-mono font-semibold transition-all"
              style={{ background: "#00d4ff", color: "#0a0a0f", boxShadow: "0 0 10px rgba(0,212,255,0.3)" }}
            >
              <Plus className="h-4 w-4" />
              Novo Ativo
            </Link>
          )}
        </div>
      </div>

      {/* Filtros */}
      <div className="rounded-lg p-5" style={{ background: "#0f0f1a", border: "1px solid #1a3a4a" }}>
        <div className="flex items-center gap-2 mb-4 pb-3" style={{ borderBottom: "1px solid #1a3a4a" }}>
          <Filter className="h-4 w-4" style={{ color: "#00d4ff" }} />
          <h3 className="text-xs font-mono uppercase tracking-widest" style={{ color: "#00d4ff" }}>Filtros</h3>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <div className="relative lg:col-span-2">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4" style={{ color: "#64748b" }} />
            <input
              placeholder="Buscar patrimônio, hostname, usuário, S/N..."
              value={searchTerm}
              onChange={handleSearch}
              className="w-full h-10 pl-9 pr-3 rounded text-sm font-mono"
              style={selectStyle}
              onFocus={(e) => { e.target.style.borderColor = "#00d4ff"; }}
              onBlur={(e) => { e.target.style.borderColor = "#1a3a4a"; }}
            />
          </div>

          <select value={filterDnb} onChange={handleFilter(setFilterDnb)} className="h-10 px-3 rounded text-sm font-mono" style={selectStyle}>
            <option value="">Todas as DNBs</option>
            {dnbs.map((dnb) => <option key={dnb._id} value={dnb._id}>{dnb.code} — {dnb.name}</option>)}
          </select>

          <select value={filterSituacao} onChange={handleFilter(setFilterSituacao)} className="h-10 px-3 rounded text-sm font-mono" style={selectStyle}>
            <option value="">Todas as Situações</option>
            {SITUACOES.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>

          <select value={filterCategoria} onChange={handleFilter(setFilterCategoria)} className="h-10 px-3 rounded text-sm font-mono" style={selectStyle}>
            <option value="">Todas as Categorias</option>
            {categorias.map((cat) => <option key={cat._id} value={cat._id}>{cat.nome}</option>)}
          </select>
        </div>
      </div>

      {/* Tabela */}
      <div className="rounded-lg overflow-hidden" style={{ background: "#0f0f1a", border: "1px solid #1a3a4a" }}>
        <div className="flex items-center justify-between px-5 py-3" style={{ borderBottom: "1px solid #1a3a4a" }}>
          <p className="text-xs font-mono uppercase tracking-widest" style={{ color: "#00d4ff" }}>
            {loading ? "Carregando..." : total === 0 ? "Nenhum ativo encontrado" : `${start}–${end} de ${total} ${total === 1 ? "ativo" : "ativos"}`}
          </p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr style={{ borderBottom: "1px solid #1a3a4a" }}>
                <th
                  onClick={() => handleSort('patrimonio')}
                  className="px-4 py-3 text-left text-xs font-mono uppercase tracking-wider cursor-pointer select-none"
                  style={{ color: "#00d4ff", background: "#141428" }}
                  onMouseEnter={(e) => { e.currentTarget.style.color = "#e2e8f0"; }}
                  onMouseLeave={(e) => { e.currentTarget.style.color = "#00d4ff"; }}
                >
                  <span className="flex items-center gap-1">
                    Patrimônio
                    <span style={{ opacity: sortCol === 'patrimonio' ? 1 : 0.25, fontSize: '10px' }}>
                      {sortCol === 'patrimonio' && sortDir === 'desc' ? '▼' : '▲'}
                    </span>
                  </span>
                </th>
                <th
                  onClick={() => handleSort('categoria.nome')}
                  className="px-4 py-3 text-left text-xs font-mono uppercase tracking-wider cursor-pointer select-none"
                  style={{ color: "#00d4ff", background: "#141428" }}
                  onMouseEnter={(e) => { e.currentTarget.style.color = "#e2e8f0"; }}
                  onMouseLeave={(e) => { e.currentTarget.style.color = "#00d4ff"; }}
                >
                  <span className="flex items-center gap-1">
                    Tipo
                    <span style={{ opacity: sortCol === 'categoria.nome' ? 1 : 0.25, fontSize: '10px' }}>
                      {sortCol === 'categoria.nome' && sortDir === 'desc' ? '▼' : '▲'}
                    </span>
                  </span>
                </th>
                <th
                  onClick={() => handleSort('subtipo')}
                  className="px-4 py-3 text-left text-xs font-mono uppercase tracking-wider cursor-pointer select-none"
                  style={{ color: "#00d4ff", background: "#141428" }}
                  onMouseEnter={(e) => { e.currentTarget.style.color = "#e2e8f0"; }}
                  onMouseLeave={(e) => { e.currentTarget.style.color = "#00d4ff"; }}
                >
                  <span className="flex items-center gap-1">
                    Modelo
                    <span style={{ opacity: sortCol === 'subtipo' ? 1 : 0.25, fontSize: '10px' }}>
                      {sortCol === 'subtipo' && sortDir === 'desc' ? '▼' : '▲'}
                    </span>
                  </span>
                </th>
                <th
                  onClick={() => handleSort('dnb.code')}
                  className="px-4 py-3 text-left text-xs font-mono uppercase tracking-wider cursor-pointer select-none"
                  style={{ color: "#00d4ff", background: "#141428" }}
                  onMouseEnter={(e) => { e.currentTarget.style.color = "#e2e8f0"; }}
                  onMouseLeave={(e) => { e.currentTarget.style.color = "#00d4ff"; }}
                >
                  <span className="flex items-center gap-1">
                    DNB
                    <span style={{ opacity: sortCol === 'dnb.code' ? 1 : 0.25, fontSize: '10px' }}>
                      {sortCol === 'dnb.code' && sortDir === 'desc' ? '▼' : '▲'}
                    </span>
                  </span>
                </th>
                <th
                  onClick={() => handleSort('funcaoPerfil')}
                  className="px-4 py-3 text-left text-xs font-mono uppercase tracking-wider cursor-pointer select-none"
                  style={{ color: "#00d4ff", background: "#141428" }}
                  onMouseEnter={(e) => { e.currentTarget.style.color = "#e2e8f0"; }}
                  onMouseLeave={(e) => { e.currentTarget.style.color = "#00d4ff"; }}
                >
                  <span className="flex items-center gap-1">
                    Função
                    <span style={{ opacity: sortCol === 'funcaoPerfil' ? 1 : 0.25, fontSize: '10px' }}>
                      {sortCol === 'funcaoPerfil' && sortDir === 'desc' ? '▼' : '▲'}
                    </span>
                  </span>
                </th>
                <th
                  onClick={() => handleSort('localizacaoSetor')}
                  className="px-4 py-3 text-left text-xs font-mono uppercase tracking-wider cursor-pointer select-none"
                  style={{ color: "#00d4ff", background: "#141428" }}
                  onMouseEnter={(e) => { e.currentTarget.style.color = "#e2e8f0"; }}
                  onMouseLeave={(e) => { e.currentTarget.style.color = "#00d4ff"; }}
                >
                  <span className="flex items-center gap-1">
                    Setor
                    <span style={{ opacity: sortCol === 'localizacaoSetor' ? 1 : 0.25, fontSize: '10px' }}>
                      {sortCol === 'localizacaoSetor' && sortDir === 'desc' ? '▼' : '▲'}
                    </span>
                  </span>
                </th>
                <th
                  onClick={() => handleSort('situacao')}
                  className="px-4 py-3 text-left text-xs font-mono uppercase tracking-wider cursor-pointer select-none"
                  style={{ color: "#00d4ff", background: "#141428" }}
                  onMouseEnter={(e) => { e.currentTarget.style.color = "#e2e8f0"; }}
                  onMouseLeave={(e) => { e.currentTarget.style.color = "#00d4ff"; }}
                >
                  <span className="flex items-center gap-1">
                    Situação
                    <span style={{ opacity: sortCol === 'situacao' ? 1 : 0.25, fontSize: '10px' }}>
                      {sortCol === 'situacao' && sortDir === 'desc' ? '▼' : '▲'}
                    </span>
                  </span>
                </th>
                <th className="px-4 py-3 text-left text-xs font-mono uppercase tracking-wider"
                  style={{ color: "#00d4ff", background: "#141428" }}>
                  Ações
                </th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={8} className="text-center py-10 font-mono text-sm" style={{ color: "#64748b" }}>
                    Carregando ativos...
                  </td>
                </tr>
              ) : assets.length === 0 ? (
                <tr>
                  <td colSpan={8} className="text-center py-10 font-mono text-sm" style={{ color: "#64748b" }}>
                    Nenhum ativo encontrado
                  </td>
                </tr>
              ) : (
                sortedAssets.map((asset, idx) => {
                  const s = getSituacaoStyle(asset.situacao);
                  return (
                    <tr key={asset._id} style={{ borderBottom: "1px solid #1a3a4a20", background: idx % 2 === 0 ? "transparent" : "#141428" }}>
                      <td className="px-4 py-3 text-sm font-mono font-semibold" style={{ color: "#e2e8f0" }}>
                        {asset.patrimonio}
                      </td>
                      <td className="px-4 py-3 text-sm" style={{ color: "#94a3b8" }}>
                        {asset.categoria?.nome || asset.tipoEquipamento || "-"}
                      </td>
                      <td className="px-4 py-3 text-sm" style={{ color: "#94a3b8" }}>{asset.subtipo}</td>
                      <td className="px-4 py-3 text-xs font-mono" style={{ color: "#64748b" }}>{asset.dnb?.code || "-"}</td>
                      <td className="px-4 py-3 text-sm" style={{ color: "#94a3b8" }}>{asset.funcaoPerfil || "-"}</td>
                      <td className="px-4 py-3 text-sm" style={{ color: "#94a3b8" }}>{asset.setor?.nome || asset.localizacaoSetor || "-"}</td>
                      <td className="px-4 py-3">
                        <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-mono font-semibold"
                          style={{ background: s.bg, color: s.color, border: `1px solid ${s.border}` }}>
                          {asset.situacao}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1">
                          <Link href={`/dashboard/assets/${asset._id}`} className="p-1.5 rounded transition-all"
                            style={{ color: "#64748b" }}
                            onMouseEnter={(e) => { e.currentTarget.style.color = "#00d4ff"; e.currentTarget.style.background = "#00d4ff10"; }}
                            onMouseLeave={(e) => { e.currentTarget.style.color = "#64748b"; e.currentTarget.style.background = "transparent"; }}>
                            <Eye className="h-4 w-4" />
                          </Link>
                          {canEdit && (
                            <>
                              <Link href={`/dashboard/assets/${asset._id}/edit`} className="p-1.5 rounded transition-all"
                                style={{ color: "#64748b" }}
                                onMouseEnter={(e) => { e.currentTarget.style.color = "#00d4ff"; e.currentTarget.style.background = "#00d4ff10"; }}
                                onMouseLeave={(e) => { e.currentTarget.style.color = "#64748b"; e.currentTarget.style.background = "transparent"; }}>
                                <Edit className="h-4 w-4" />
                              </Link>
                              <button onClick={() => handleDelete(asset._id)} className="p-1.5 rounded transition-all"
                                style={{ color: "#64748b" }}
                                onMouseEnter={(e) => { e.currentTarget.style.color = "#ff2d55"; e.currentTarget.style.background = "#ff2d5510"; }}
                                onMouseLeave={(e) => { e.currentTarget.style.color = "#64748b"; e.currentTarget.style.background = "transparent"; }}>
                                <Trash2 className="h-4 w-4" />
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Paginação */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-5 py-3" style={{ borderTop: "1px solid #1a3a4a" }}>
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1 || loading}
              className="flex items-center gap-1 px-3 py-1.5 rounded font-mono text-sm transition-all"
              style={{
                background: page === 1 ? "transparent" : "#141428",
                border: "1px solid #1a3a4a",
                color: page === 1 ? "#1a3a4a" : "#64748b",
                cursor: page === 1 ? "not-allowed" : "pointer",
              }}
            >
              <ChevronLeft className="h-4 w-4" />
              Anterior
            </button>

            <span className="text-xs font-mono" style={{ color: "#64748b" }}>
              Página <span style={{ color: "#e2e8f0" }}>{page}</span> de <span style={{ color: "#e2e8f0" }}>{totalPages}</span>
            </span>

            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages || loading}
              className="flex items-center gap-1 px-3 py-1.5 rounded font-mono text-sm transition-all"
              style={{
                background: page === totalPages ? "transparent" : "#141428",
                border: "1px solid #1a3a4a",
                color: page === totalPages ? "#1a3a4a" : "#64748b",
                cursor: page === totalPages ? "not-allowed" : "pointer",
              }}
            >
              Próxima
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
