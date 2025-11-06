"use client";

import { useState, useEffect } from "react";
import { getAssets, deleteAsset } from "@/lib/actions/assets";
import { getAllDNBs } from "@/lib/actions/dnbs";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
} from "lucide-react";
import { useSession } from "next-auth/react";
import { CreateAssetDialog } from "@/components/assets/CreateAssetDialog";
import { EditAssetDialog } from "@/components/assets/EditAssetDialog";
import { ViewAssetDialog } from "@/components/assets/ViewAssetDialog";
import { exportAssetsToCSV } from "@/lib/exportAssets";

export default function AssetsPage() {
  const { data: session } = useSession();
  const [assets, setAssets] = useState([]);
  const [dnbs, setDnbs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showViewDialog, setShowViewDialog] = useState(false);
  const [selectedAsset, setSelectedAsset] = useState(null);

  // Filtros
  const [searchTerm, setSearchTerm] = useState("");
  const [filterDnb, setFilterDnb] = useState("");
  const [filterTipo, setFilterTipo] = useState("");
  const [filterSituacao, setFilterSituacao] = useState("");

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    try {
      setLoading(true);
      const [assetsData, dnbsData] = await Promise.all([
        getAssets(),
        getAllDNBs(),
      ]);
      setAssets(assetsData);
      setDnbs(dnbsData);
    } catch (error) {
      alert("Erro ao carregar dados");
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete(id) {
    if (!confirm("Tem certeza que deseja excluir este ativo?")) {
      return;
    }

    try {
      await deleteAsset(id);
      alert("Ativo excluído com sucesso!");
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

  function handleCreateSuccess() {
    setShowCreateDialog(false);
    loadData();
  }

  function handleEditSuccess() {
    setShowEditDialog(false);
    loadData();
  }

  // Filtrar ativos
  const filteredAssets = assets.filter((asset) => {
    const matchSearch =
      !searchTerm ||
      asset.patrimonio?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      asset.hostname?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      asset.usuarioResponsavel
        ?.toLowerCase()
        .includes(searchTerm.toLowerCase()) ||
      asset.numeroSerie?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchDnb = !filterDnb || asset.dnb?._id === filterDnb;
    const matchTipo = !filterTipo || asset.tipoEquipamento === filterTipo;
    const matchSituacao = !filterSituacao || asset.situacao === filterSituacao;

    return matchSearch && matchDnb && matchTipo && matchSituacao;
  });

  // Extrair tipos únicos
  const tiposUnicos = [...new Set(assets.map((a) => a.tipoEquipamento))].filter(
    Boolean
  );

  const canEdit =
    session?.user?.role === "gestor" || session?.user?.role === "administrador";
  const canCreate = session?.user?.role !== "tecnico" || session?.user?.dnb;

  const getSituacaoBadge = (situacao) => {
    const colors = {
      Ativo: "bg-green-100 text-green-800",
      Reserva: "bg-blue-100 text-blue-800",
      "Em manutenção": "bg-orange-100 text-orange-800",
      Descartado: "bg-gray-100 text-gray-800",
    };
    return colors[situacao] || "bg-gray-100 text-gray-800";
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-gray-600">Carregando ativos...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Ativos</h1>
          <p className="text-gray-600 mt-1">
            Gerencie o inventário de patrimônios
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            className="gap-2"
            onClick={() =>
              exportAssetsToCSV(filteredAssets, "ativos_nav_brasil")
            }
            disabled={filteredAssets.length === 0}
          >
            <Download className="h-4 w-4" />
            Exportar CSV
          </Button>
          {canCreate && (
            <Button onClick={() => setShowCreateDialog(true)} className="gap-2">
              <Plus className="h-4 w-4" />
              Novo Ativo
            </Button>
          )}
        </div>
      </div>

      {/* Filtros */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filtros
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <label className="text-sm font-medium text-gray-700 mb-2 block">
                Buscar
              </label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Patrimônio, hostname, usuário..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            <div>
              <label className="text-sm font-medium text-gray-700 mb-2 block">
                DNB
              </label>
              <select
                value={filterDnb}
                onChange={(e) => setFilterDnb(e.target.value)}
                className="w-full h-10 px-3 rounded-md border border-gray-300 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Todas</option>
                {dnbs.map((dnb) => (
                  <option key={dnb._id} value={dnb._id}>
                    {dnb.name} ({dnb.code})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-sm font-medium text-gray-700 mb-2 block">
                Tipo
              </label>
              <select
                value={filterTipo}
                onChange={(e) => setFilterTipo(e.target.value)}
                className="w-full h-10 px-3 rounded-md border border-gray-300 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Todos</option>
                {tiposUnicos.map((tipo) => (
                  <option key={tipo} value={tipo}>
                    {tipo}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-sm font-medium text-gray-700 mb-2 block">
                Situação
              </label>
              <select
                value={filterSituacao}
                onChange={(e) => setFilterSituacao(e.target.value)}
                className="w-full h-10 px-3 rounded-md border border-gray-300 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Todas</option>
                <option value="Ativo">Ativo</option>
                <option value="Reserva">Reserva</option>
                <option value="Em manutenção">Em manutenção</option>
                <option value="Descartado">Descartado</option>
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tabela */}
      <Card>
        <CardHeader>
          <CardTitle>
            {filteredAssets.length}{" "}
            {filteredAssets.length === 1
              ? "ativo encontrado"
              : "ativos encontrados"}
          </CardTitle>
          <CardDescription>
            Lista de todos os ativos cadastrados no sistema
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Patrimônio</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Modelo</TableHead>
                  <TableHead>DNB</TableHead>
                  <TableHead>Usuário</TableHead>
                  <TableHead>Situação</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredAssets.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={7}
                      className="text-center py-8 text-gray-500"
                    >
                      Nenhum ativo encontrado
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredAssets.map((asset) => (
                    <TableRow key={asset._id}>
                      <TableCell className="font-medium">
                        {asset.patrimonio}
                      </TableCell>
                      <TableCell>{asset.tipoEquipamento}</TableCell>
                      <TableCell>{asset.subtipo}</TableCell>
                      <TableCell>{asset.dnb?.code || "-"}</TableCell>
                      <TableCell>{asset.usuarioResponsavel || "-"}</TableCell>
                      <TableCell>
                        <Badge className={getSituacaoBadge(asset.situacao)}>
                          {asset.situacao}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleView(asset)}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          {canEdit && (
                            <>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleEdit(asset)}
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleDelete(asset._id)}
                                className="text-red-600 hover:text-red-700"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Dialogs */}
      {showCreateDialog && (
        <CreateAssetDialog
          open={showCreateDialog}
          onClose={() => setShowCreateDialog(false)}
          onSuccess={handleCreateSuccess}
          dnbs={dnbs}
        />
      )}

      {showEditDialog && selectedAsset && (
        <EditAssetDialog
          open={showEditDialog}
          onClose={() => setShowEditDialog(false)}
          onSuccess={handleEditSuccess}
          asset={selectedAsset}
          dnbs={dnbs}
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
