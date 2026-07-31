"use client";

import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Package, Zap } from "lucide-react";
import Link from "next/link";

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

export function ViewAssetDialog({ open, onClose, asset }) {
  if (!asset) return null;

  const formatDate = (date) => {
    if (!date) return null;
    try {
      return format(new Date(date), "dd/MM/yyyy HH:mm", { locale: ptBR });
    } catch {
      return null;
    }
  };

  const s = getSituacaoStyle(asset.situacao);

  const InfoRow = ({ label, value }) => {
    if (!value) return null;
    return (
      <div
        className="flex items-start gap-3 py-2"
        style={{ borderBottom: "1px solid #1a3a4a15" }}
      >
        <span
          className="text-xs font-mono uppercase tracking-wider w-32 flex-shrink-0 pt-0.5"
          style={{ color: "#64748b" }}
        >
          {label}
        </span>
        <span className="text-sm flex-1" style={{ color: "#e2e8f0" }}>
          {value}
        </span>
      </div>
    );
  };

  const SectionTitle = ({ children }) => (
    <h3
      className="text-xs font-mono uppercase tracking-widest pb-2 mb-3"
      style={{ color: "#00d4ff", borderBottom: "1px solid #1a3a4a" }}
    >
      {children}
    </h3>
  );

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent
        className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto"
        style={{ background: "#0f0f1a", border: "1px solid #00d4ff30" }}
      >
        <DialogHeader>
          <div className="flex items-start gap-4">
            {/* Image or placeholder */}
            <div
              className="w-16 h-16 rounded-lg flex items-center justify-center flex-shrink-0 overflow-hidden"
              style={{ background: "#141428", border: "1px solid #1a3a4a" }}
            >
              {asset.imagemUrl ? (
                <img
                  src={asset.imagemUrl}
                  alt={asset.patrimonio}
                  className="w-full h-full object-cover"
                />
              ) : (
                <Package className="h-7 w-7" style={{ color: "#1a3a4a" }} />
              )}
            </div>
            <div className="flex-1 min-w-0">
              <DialogTitle
                className="font-mono flex items-center gap-3 flex-wrap"
                style={{ color: "#e2e8f0" }}
              >
                {asset.patrimonio}
                <span
                  className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-mono font-semibold"
                  style={{ background: s.bg, color: s.color, border: `1px solid ${s.border}` }}
                >
                  {asset.situacao}
                </span>
              </DialogTitle>
              <DialogDescription style={{ color: "#64748b" }}>
                {asset.tipoEquipamento} — {asset.subtipo} — {asset.fabricante}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-5 py-4">
          {/* Vinculado a */}
          {asset.vinculadoA && (
            <div
              className="flex items-center gap-2 px-3 py-2 rounded text-sm"
              style={{ background: "#00d4ff10", border: "1px solid #00d4ff20", color: "#00d4ff" }}
            >
              <span className="text-xs font-mono">Vinculado a:</span>
              <span className="font-mono font-semibold">
                {typeof asset.vinculadoA === "object"
                  ? asset.vinculadoA.patrimonio
                  : asset.vinculadoA}
              </span>
            </div>
          )}

          {/* Informações Básicas */}
          <div>
            <SectionTitle>Informações Básicas</SectionTitle>
            <InfoRow label="Patrimônio" value={asset.patrimonio} />
            <InfoRow label="Tipo" value={asset.tipoEquipamento} />
            <InfoRow label="Subtipo/Modelo" value={asset.subtipo} />
            <InfoRow label="Fabricante" value={asset.fabricante} />
            <InfoRow label="Quantidade" value={asset.quantidade?.toString()} />
            {asset.categoria && (
              <InfoRow
                label="Categoria"
                value={
                  typeof asset.categoria === "object"
                    ? asset.categoria.nome
                    : asset.categoria
                }
              />
            )}
          </div>

          {/* Localização */}
          <div>
            <SectionTitle>Localização</SectionTitle>
            <InfoRow
              label="DNB"
              value={asset.dnb ? `${asset.dnb.code} — ${asset.dnb.name}` : null}
            />
            <InfoRow label="Setor" value={asset.localizacaoSetor} />
            <InfoRow label="Responsável" value={asset.usuarioResponsavel} />
            <InfoRow label="Função/Perfil" value={asset.funcaoPerfil} />
          </div>

          {/* Identificação */}
          <div>
            <SectionTitle>Identificação</SectionTitle>
            <InfoRow label="Número de Série" value={asset.numeroSerie} />
            <InfoRow label="Hostname" value={asset.hostname} />
            <InfoRow label="Sistema Operacional" value={asset.sistemaOperacional} />
          </div>

          {/* Configuração de Rede */}
          {(asset.enderecoIp || asset.ipGerencia || asset.redeVlan || asset.portasConexoes) && (
            <div>
              <SectionTitle>Configuração de Rede</SectionTitle>
              <InfoRow label="Endereço IP" value={asset.enderecoIp} />
              <InfoRow label="IP de Gerência" value={asset.ipGerencia} />
              <InfoRow label="Rede/VLAN" value={asset.redeVlan} />
              <InfoRow label="Portas/Conexões" value={asset.portasConexoes} />
            </div>
          )}

          {/* Observações */}
          {asset.observacoes && (
            <div>
              <SectionTitle>Observações</SectionTitle>
              <p
                className="text-sm font-mono whitespace-pre-wrap p-3 rounded"
                style={{ background: "#141428", color: "#94a3b8" }}
              >
                {asset.observacoes}
              </p>
            </div>
          )}

          {/* Auditoria */}
          <div>
            <SectionTitle>Auditoria</SectionTitle>
            <InfoRow
              label="Cadastrado por"
              value={
                asset.cadastradoPor
                  ? `${asset.cadastradoPor.name} (${asset.cadastradoPor.email})`
                  : null
              }
            />
            <InfoRow label="Data de Cadastro" value={formatDate(asset.createdAt)} />
            <InfoRow
              label="Editado por"
              value={
                asset.editadoPor
                  ? `${asset.editadoPor.name} (${asset.editadoPor.email})`
                  : null
              }
            />
            <InfoRow label="Última Atualização" value={formatDate(asset.updatedAt)} />
          </div>

          {/* ID do Sistema */}
          <div
            className="px-3 py-2 rounded"
            style={{ background: "#141428", border: "1px solid #1a3a4a20" }}
          >
            <p className="text-xs font-mono" style={{ color: "#1a3a4a" }}>
              ASSET_ID:{" "}
              <span style={{ color: "#64748b" }}>{asset.assetId}</span>
            </p>
          </div>
        </div>

        <DialogFooter className="gap-2">
          <Link
            href={`/dashboard/assets/${asset._id}/quick-edit`}
            className="flex items-center gap-2 px-4 py-2 rounded text-sm font-mono font-semibold transition-all"
            style={{
              background: "#00d4ff15",
              border: "1px solid #00d4ff40",
              color: "#00d4ff",
            }}
            onClick={onClose}
          >
            <Zap className="h-4 w-4" />
            Edição Rápida
          </Link>
          <Button
            variant="outline"
            onClick={onClose}
            style={{
              background: "#141428",
              border: "1px solid #1a3a4a",
              color: "#64748b",
            }}
          >
            Fechar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
