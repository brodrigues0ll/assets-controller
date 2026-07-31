"use client";

import { useState, useEffect } from "react";
import { getAssets, deleteAsset } from "@/lib/actions/assets";
import { getAllDNBs } from "@/lib/actions/dnbs";
import { getCategorias } from "@/lib/actions/categorias";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Plus,
  Search,
  Download,
  Filter,
  Edit,
  Trash2,
  Eye,
  ScanLine,
} from "lucide-react";
import { useSession } from "next-auth/react";
import { CreateAssetDialog } from "@/components/assets/CreateAssetDialog";
import { EditAssetDialog } from "@/components/assets/EditAssetDialog";
import { ViewAssetDialog } from "@/components/assets/ViewAssetDialog";
import { exportAssetsToCSV } from "@/lib/exportAssets";
import Link from "next/link";

const SITUACOES = [
  "Ativo",
  "Em uso",
  "Em estoque",
  "Com defeito",
  "Em manutenção",
  "Reserva",
  "Descartado",
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
  const [dnbs, setDnbs] = useState([]);
  const [categorias, setCategorias] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showViewDialog, setShowViewDialog] = useState(false);
  const [selectedAsset, setSelectedAsset] = useState(null);

  const [searchTerm, setSearchTerm] = useState("");
  const [filterDnb, setFilterDnb] = useState("");
  const [filterTipo, setFilterTipo] = useState("");
  const [filterSituacao, setFilterSituacao] = useState("");
  const [filterCategoria, setFilterCategoria] = useState("");

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    try {
      setLoading(true);
      const [assetsData, dnbsData, categoriasData] = await Promise.all([
        getAssets(),
        getAllDNBs(),
        getCategorias().catch(() => []),
      ]);
      setAssets(assetsData);
      setDnbs(dnbsData);
      setCategorias(categoriasData);
    } catch (error) {
      alert("Erro ao carregar dados");
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete(id) {
    if (!confirm("Tem certeza que deseja excluir este ativo?")) return;
    try {
      await deleteAsset(id);
      loadData();
    } catch (error) {
      alert(error.message || "Erro ao excluir ativo");
    }
  }

  function handleEdit(asset) {
    setSelectedAsset(asset);
    setShowEditDialog(true);
  }

  function handleView(asset) {
    setSelectedAsset(asset);
    setShowViewDialog(true);
  }

  const filteredAssets = assets.filter((asset) => {
    const matchSearch =
      !searchTerm ||
      asset.patrimonio?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      asset.hostname?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      asset.usuarioResponsavel?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      asset.numeroSerie?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchDnb = !filterDnb || asset.dnb?._id === filterDnb;
    const matchTipo = !filterTipo || asset.tipoEquipamento === filterTipo;
    const matchSituacao = !filterSituacao || asset.situacao === filterSituacao;
    const matchCategoria = !filterCategoria || asset.categoria?._id === filterCategoria || asset.categoria === filterCategoria;

    return matchSearch && matchDnb && matchTipo && matchSituacao && matchCategoria;
  });

  const tiposUnicos = [...new Set(assets.map((a) => a.tipoEquipamento))].filter(Boolean);

  const canEdit =
    session?.user?.role === "gestor" || session?.user?.role === "administrador";
  const canCreate = session?.user?.role !== "tecnico" || session?.user?.dnb;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-48">
        <p className="font-mono" style={{ color: "#64748b" }}>
          Carregando ativos...
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold font-mono" style={{ color: "#e2e8f0" }}>
            Ativos
          </h1>
          <p className="text-sm mt-1" style={{ color: "#64748b" }}>
            Inventário de patrimônios ({assets.length} registros)
          </p>
        </div>
        <div className="flex gap-2">
          <Link
            href="/scan"
            className="flex items-center gap-2 px-3 py-2 rounded text-sm font-mono font-semibold transition-all"
            style={{
              background: "#00d4ff10",
              border: "1px solid #00d4ff30",
              color: "#00d4ff",
            }}
          >
            <ScanLine className="h-4 w-4" />
            Scanner
          </Link>
          <button
            className="flex items-center gap-2 px-3 py-2 rounded text-sm font-mono font-semibold transition-all"
            style={{
              background: "#141428",
              border: "1px solid #1a3a4a",
              color: "#64748b",
            }}
            onClick={() => exportAssetsToCSV(filteredAssets, "ativos_nav_brasil")}
            disabled={filteredAssets.length === 0}
          >
            <Download className="h-4 w-4" />
            CSV
          </button>
          {canCreate && (
            <button
              onClick={() => setShowCreateDialog(true)}
              className="flex items-center gap-2 px-4 py-2 rounded text-sm font-mono font-semibold transition-all"
              style={{
                background: "#00d4ff",
                color: "#0a0a0f",
                boxShadow: "0 0 10px rgba(0,212,255,0.3)",
              }}
            >
              <Plus className="h-4 w-4" />
              Novo Ativo
            </button>
          )}
        </div>
      </div>

      {/* Filtros */}
      <div
        className="rounded-lg p-5"
        style={{ background: "#0f0f1a", border: "1px solid #1a3a4a" }}
      >
        <div className="flex items-center gap-2 mb-4 pb-3" style={{ borderBottom: "1px solid #1a3a4a" }}>
          <Filter className="h-4 w-4" style={{ color: "#00d4ff" }} />
          <h3 className="text-xs font-mono uppercase tracking-widest" style={{ color: "#00d4ff" }}>
            Filtros
          </h3>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          <div className="relative lg:col-span-2">
            <Search
              className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4"
              style={{ color: "#64748b" }}
            />
            <input
              placeholder="Buscar patrimônio, hostname, usuário..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full h-10 pl-9 pr-3 rounded text-sm font-mono"
              style={selectStyle}
              onFocus={(e) => { e.target.style.borderColor = "#00d4ff"; }}
              onBlur={(e) => { e.target.style.borderColor = "#1a3a4a"; }}
            />
          </div>

          <select
            value={filterDnb}
            onChange={(e) => setFilterDnb(e.target.value)}
            className="h-10 px-3 rounded text-sm font-mono"
            style={selectStyle}
          >
            <option value="">Todas as DNBs</option>
            {dnbs.map((dnb) => (
              <option key={dnb._id} value={dnb._id}>
                {dnb.code} — {dnb.name}
              </option>
            ))}
          </select>

          <select
            value={filterTipo}
            onChange={(e) => setFilterTipo(e.target.value)}
            className="h-10 px-3 rounded text-sm font-mono"
            style={selectStyle}
          >
            <option value="">Todos os Tipos</option>
            {tiposUnicos.map((tipo) => (
              <option key={tipo} value={tipo}>{tipo}</option>
            ))}
          </select>

          <select
            value={filterSituacao}
            onChange={(e) => setFilterSituacao(e.target.value)}
            className="h-10 px-3 rounded text-sm font-mono"
            style={selectStyle}
          >
            <option value="">Todas as Situações</option>
            {SITUACOES.map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>

          {categorias.length > 0 && (
            <select
              value={filterCategoria}
              onChange={(e) => setFilterCategoria(e.target.value)}
              className="h-10 px-3 rounded text-sm font-mono"
              style={selectStyle}
            >
              <option value="">Todas as Categorias</option>
              {categorias.map((cat) => (
                <option key={cat._id} value={cat._id}>{cat.nome}</option>
              ))}
            </select>
          )}
        </div>
      </div>

      {/* Tabela */}
      <div
        className="rounded-lg overflow-hidden"
        style={{ background: "#0f0f1a", border: "1px solid #1a3a4a" }}
      >
        <div
          className="flex items-center justify-between px-5 py-3"
          style={{ borderBottom: "1px solid #1a3a4a" }}
        >
          <p className="text-xs font-mono uppercase tracking-widest" style={{ color: "#00d4ff" }}>
            {filteredAssets.length} {filteredAssets.length === 1 ? "ativo encontrado" : "ativos encontrados"}
          </p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr style={{ borderBottom: "1px solid #1a3a4a" }}>
                {["Patrimônio", "Tipo", "Modelo", "DNB", "Usuário", "Situação", "Ações"].map((h) => (
                  <th
                    key={h}
                    className="px-4 py-3 text-left text-xs font-mono uppercase tracking-wider"
                    style={{ color: "#00d4ff", background: "#141428" }}
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filteredAssets.length === 0 ? (
                <tr>
                  <td
                    colSpan={7}
                    className="text-center py-10 font-mono text-sm"
                    style={{ color: "#64748b" }}
                  >
                    Nenhum ativo encontrado
                  </td>
                </tr>
              ) : (
                filteredAssets.map((asset, idx) => {
                  const s = getSituacaoStyle(asset.situacao);
                  return (
                    <tr
                      key={asset._id}
                      style={{
                        borderBottom: "1px solid #1a3a4a20",
                        background: idx % 2 === 0 ? "transparent" : "#141428",
                      }}
                    >
                      <td
                        className="px-4 py-3 text-sm font-mono font-semibold"
                        style={{ color: "#e2e8f0" }}
                      >
                        {asset.patrimonio}
                      </td>
                      <td className="px-4 py-3 text-sm" style={{ color: "#94a3b8" }}>
                        {asset.tipoEquipamento}
                      </td>
                      <td className="px-4 py-3 text-sm" style={{ color: "#94a3b8" }}>
                        {asset.subtipo}
                      </td>
                      <td
                        className="px-4 py-3 text-xs font-mono"
                        style={{ color: "#64748b" }}
                      >
                        {asset.dnb?.code || "-"}
                      </td>
                      <td className="px-4 py-3 text-sm" style={{ color: "#94a3b8" }}>
                        {asset.usuarioResponsavel || "-"}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-mono font-semibold"
                          style={{
                            background: s.bg,
                            color: s.color,
                            border: `1px solid ${s.border}`,
                          }}
                        >
                          {asset.situacao}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => handleView(asset)}
                            className="p-1.5 rounded transition-all"
                            style={{ color: "#64748b" }}
                            onMouseEnter={(e) => { e.currentTarget.style.color = "#00d4ff"; e.currentTarget.style.background = "#00d4ff10"; }}
                            onMouseLeave={(e) => { e.currentTarget.style.color = "#64748b"; e.currentTarget.style.background = "transparent"; }}
                          >
                            <Eye className="h-4 w-4" />
                          </button>
                          {canEdit && (
                            <>
                              <button
                                onClick={() => handleEdit(asset)}
                                className="p-1.5 rounded transition-all"
                                style={{ color: "#64748b" }}
                                onMouseEnter={(e) => { e.currentTarget.style.color = "#00d4ff"; e.currentTarget.style.background = "#00d4ff10"; }}
                                onMouseLeave={(e) => { e.currentTarget.style.color = "#64748b"; e.currentTarget.style.background = "transparent"; }}
                              >
                                <Edit className="h-4 w-4" />
                              </button>
                              <button
                                onClick={() => handleDelete(asset._id)}
                                className="p-1.5 rounded transition-all"
                                style={{ color: "#64748b" }}
                                onMouseEnter={(e) => { e.currentTarget.style.color = "#ff2d55"; e.currentTarget.style.background = "#ff2d5510"; }}
                                onMouseLeave={(e) => { e.currentTarget.style.color = "#64748b"; e.currentTarget.style.background = "transparent"; }}
                              >
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
      </div>

      {showCreateDialog && (
        <CreateAssetDialog
          open={showCreateDialog}
          onClose={() => setShowCreateDialog(false)}
          onSuccess={() => { setShowCreateDialog(false); loadData(); }}
          dnbs={dnbs}
          categorias={categorias}
        />
      )}

      {showEditDialog && selectedAsset && (
        <EditAssetDialog
          open={showEditDialog}
          onClose={() => setShowEditDialog(false)}
          onSuccess={() => { setShowEditDialog(false); loadData(); }}
          asset={selectedAsset}
          dnbs={dnbs}
          categorias={categorias}
        />
      )}

      {showViewDialog && selectedAsset && (
        <ViewAssetDialog
          open={showViewDialog}
          onClose={() => setShowViewDialog(false)}
          asset={selectedAsset}
        />
      )}
    </div>
  );
}
