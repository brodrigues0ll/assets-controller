"use client";

import { useState, useEffect } from "react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { getAuditLogs, exportAuditLogs } from "@/lib/actions/audit";
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
import { Download, Filter, Search, FileText } from "lucide-react";
import { useSession } from "next-auth/react";

export default function AuditPage() {
  const { data: session } = useSession();
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterAction, setFilterAction] = useState("");
  const [filterEntity, setFilterEntity] = useState("");

  useEffect(() => {
    loadLogs();
  }, []);

  async function loadLogs() {
    try {
      setLoading(true);
      const data = await getAuditLogs();
      setLogs(data);
    } catch (error) {
      console.error("Erro ao carregar logs:", error);
      alert("Erro ao carregar logs de auditoria");
    } finally {
      setLoading(false);
    }
  }

  async function handleExport() {
    try {
      const csvContent = await exportAuditLogs(filteredLogs);
      const blob = new Blob(['\uFEFF' + csvContent], {
        type: "text/csv;charset=utf-8;",
      });
      const link = document.createElement("a");
      const url = URL.createObjectURL(blob);
      const timestamp = new Date().toISOString().split("T")[0];

      link.setAttribute("href", url);
      link.setAttribute("download", `audit_logs_${timestamp}.csv`);
      link.style.visibility = "hidden";

      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      alert("Erro ao exportar logs");
    }
  }

  const filteredLogs = logs.filter((log) => {
    const matchSearch =
      !searchTerm ||
      log.user?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.description?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchAction = !filterAction || log.action === filterAction;
    const matchEntity = !filterEntity || log.entityType === filterEntity;

    return matchSearch && matchAction && matchEntity;
  });

  const getActionBadge = (action) => {
    const colors = {
      create: "bg-green-100 text-green-800",
      update: "bg-blue-100 text-blue-800",
      delete: "bg-red-100 text-red-800",
      movimentacao: "bg-purple-100 text-purple-800",
    };
    const labels = {
      create: "Criação",
      update: "Atualização",
      delete: "Exclusão",
      movimentacao: "Movimentação",
    };
    return { color: colors[action], label: labels[action] || action };
  };

  const getEntityLabel = (entityType) => {
    const labels = {
      asset: "Ativo",
      user: "Usuário",
      dnb: "DNB",
    };
    return labels[entityType] || entityType;
  };

  const formatDate = (date) => {
    try {
      return format(new Date(date), "dd/MM/yyyy HH:mm:ss", { locale: ptBR });
    } catch {
      return "-";
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-gray-600">Carregando logs...</p>
      </div>
    );
  }

  // Somente administradores e gestores podem ver logs
  if (session?.user?.role === "tecnico") {
    return (
      <div className="flex items-center justify-center h-full">
        <Card>
          <CardHeader>
            <CardTitle>Acesso Restrito</CardTitle>
            <CardDescription>
              Você não tem permissão para visualizar logs de auditoria
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            Logs de Auditoria
          </h1>
          <p className="text-gray-600 mt-1">
            Histórico de ações realizadas no sistema
          </p>
        </div>
        <Button
          variant="outline"
          className="gap-2"
          onClick={handleExport}
          disabled={filteredLogs.length === 0}
        >
          <Download className="h-4 w-4" />
          Exportar CSV
        </Button>
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
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="text-sm font-medium text-gray-700 mb-2 block">
                Buscar
              </label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Usuário, descrição..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            <div>
              <label className="text-sm font-medium text-gray-700 mb-2 block">
                Ação
              </label>
              <select
                value={filterAction}
                onChange={(e) => setFilterAction(e.target.value)}
                className="w-full h-10 px-3 rounded-md border border-gray-300 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Todas</option>
                <option value="create">Criação</option>
                <option value="update">Atualização</option>
                <option value="delete">Exclusão</option>
                <option value="movimentacao">Movimentação</option>
              </select>
            </div>

            <div>
              <label className="text-sm font-medium text-gray-700 mb-2 block">
                Entidade
              </label>
              <select
                value={filterEntity}
                onChange={(e) => setFilterEntity(e.target.value)}
                className="w-full h-10 px-3 rounded-md border border-gray-300 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Todas</option>
                <option value="asset">Ativo</option>
                <option value="user">Usuário</option>
                <option value="dnb">DNB</option>
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tabela */}
      <Card>
        <CardHeader>
          <CardTitle>
            {filteredLogs.length}{" "}
            {filteredLogs.length === 1
              ? "registro encontrado"
              : "registros encontrados"}
          </CardTitle>
          <CardDescription>
            Histórico completo de ações no sistema
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Data/Hora</TableHead>
                  <TableHead>Usuário</TableHead>
                  <TableHead>Ação</TableHead>
                  <TableHead>Entidade</TableHead>
                  <TableHead>Descrição</TableHead>
                  <TableHead>DNB</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredLogs.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={6}
                      className="text-center py-8 text-gray-500"
                    >
                      <FileText className="h-12 w-12 mx-auto mb-2 text-gray-400" />
                      <p>Nenhum registro encontrado</p>
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredLogs.map((log) => {
                    const actionBadge = getActionBadge(log.action);
                    return (
                      <TableRow key={log._id}>
                        <TableCell className="font-mono text-sm">
                          {formatDate(log.timestamp)}
                        </TableCell>
                        <TableCell>
                          <div>
                            <p className="font-medium text-sm">
                              {log.user?.name || "-"}
                            </p>
                            <p className="text-xs text-gray-500">
                              {log.user?.email || "-"}
                            </p>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge className={actionBadge.color}>
                            {actionBadge.label}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">
                            {getEntityLabel(log.entityType)}
                          </Badge>
                        </TableCell>
                        <TableCell className="max-w-md">
                          <p className="text-sm text-gray-700 truncate">
                            {log.description}
                          </p>
                        </TableCell>
                        <TableCell>
                          {log.dnb ? (
                            <span className="font-mono text-sm">
                              {log.dnb.code}
                            </span>
                          ) : (
                            <span className="text-gray-400">-</span>
                          )}
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
