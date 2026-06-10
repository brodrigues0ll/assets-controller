"use client";

import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";

export function ViewAssetDialog({ open, onClose, asset }) {
  if (!asset) return null;

  const formatDate = (date) => {
    if (!date) return "-";
    try {
      return format(new Date(date), "dd/MM/yyyy HH:mm", { locale: ptBR });
    } catch {
      return "-";
    }
  };

  const getSituacaoBadge = (situacao) => {
    const colors = {
      Ativo: "bg-green-100 text-green-800",
      Reserva: "bg-blue-100 text-blue-800",
      "Em manutenção": "bg-orange-100 text-orange-800",
      Descartado: "bg-gray-100 text-gray-800",
    };
    return colors[situacao] || "bg-gray-100 text-gray-800";
  };

  const InfoRow = ({ label, value }) => (
    <div className="flex flex-col sm:grid sm:grid-cols-3 sm:gap-4 py-2 border-b border-gray-100 gap-0.5">
      <Label className="text-xs font-semibold text-gray-500 uppercase tracking-wide sm:text-sm sm:normal-case sm:tracking-normal sm:font-semibold sm:text-gray-600">{label}</Label>
      <span className="col-span-2 text-sm text-gray-900">
        {value || <span className="text-gray-400">-</span>}
      </span>
    </div>
  );

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[700px] max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3">
            Detalhes do Ativo
            <Badge className={getSituacaoBadge(asset.situacao)}>
              {asset.situacao}
            </Badge>
          </DialogTitle>
          <DialogDescription>
            Visualização completa das informações do ativo
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Informações Básicas */}
          <div>
            <h3 className="font-semibold text-base text-gray-900 mb-3 pb-2 border-b-2 border-blue-500">
              Informações Básicas
            </h3>
            <div className="space-y-1">
              <InfoRow label="Patrimônio" value={asset.patrimonio} />
              <InfoRow label="Tipo" value={asset.tipoEquipamento} />
              <InfoRow label="Subtipo/Modelo" value={asset.subtipo} />
              <InfoRow label="Fabricante" value={asset.fabricante} />
              <InfoRow
                label="Quantidade"
                value={asset.quantidade?.toString()}
              />
            </div>
          </div>

          {/* Localização */}
          <div>
            <h3 className="font-semibold text-base text-gray-900 mb-3 pb-2 border-b-2 border-blue-500">
              Localização
            </h3>
            <div className="space-y-1">
              <InfoRow
                label="DNB"
                value={
                  asset.dnb
                    ? `${asset.dnb.code} - ${asset.dnb.name}`
                    : undefined
                }
              />
              <InfoRow label="Setor" value={asset.localizacaoSetor} />
              <InfoRow label="Responsável" value={asset.usuarioResponsavel} />
              <InfoRow label="Função/Perfil" value={asset.funcaoPerfil} />
            </div>
          </div>

          {/* Identificação */}
          <div>
            <h3 className="font-semibold text-base text-gray-900 mb-3 pb-2 border-b-2 border-blue-500">
              Identificação
            </h3>
            <div className="space-y-1">
              <InfoRow label="Número de Série" value={asset.numeroSerie} />
              <InfoRow label="Hostname" value={asset.hostname} />
              <InfoRow
                label="Sistema Operacional"
                value={asset.sistemaOperacional}
              />
            </div>
          </div>

          {/* Configuração de Rede */}
          {(asset.enderecoIp ||
            asset.ipGerencia ||
            asset.redeVlan ||
            asset.portasConexoes) && (
            <div>
              <h3 className="font-semibold text-base text-gray-900 mb-3 pb-2 border-b-2 border-blue-500">
                Configuração de Rede
              </h3>
              <div className="space-y-1">
                <InfoRow label="Endereço IP" value={asset.enderecoIp} />
                <InfoRow label="IP de Gerência" value={asset.ipGerencia} />
                <InfoRow label="Rede/VLAN" value={asset.redeVlan} />
                <InfoRow label="Portas/Conexões" value={asset.portasConexoes} />
              </div>
            </div>
          )}

          {/* Observações */}
          {asset.observacoes && (
            <div>
              <h3 className="font-semibold text-base text-gray-900 mb-3 pb-2 border-b-2 border-blue-500">
                Observações
              </h3>
              <p className="text-sm text-gray-700 whitespace-pre-wrap bg-gray-50 p-3 rounded-md">
                {asset.observacoes}
              </p>
            </div>
          )}

          {/* Auditoria */}
          <div>
            <h3 className="font-semibold text-base text-gray-900 mb-3 pb-2 border-b-2 border-blue-500">
              Auditoria
            </h3>
            <div className="space-y-1">
              <InfoRow
                label="Cadastrado por"
                value={
                  asset.cadastradoPor
                    ? `${asset.cadastradoPor.name} (${asset.cadastradoPor.email})`
                    : undefined
                }
              />
              <InfoRow
                label="Data de Cadastro"
                value={formatDate(asset.dataCadastro)}
              />
              <InfoRow
                label="Editado por"
                value={
                  asset.editadoPor
                    ? `${asset.editadoPor.name} (${asset.editadoPor.email})`
                    : undefined
                }
              />
              <InfoRow
                label="Última Atualização"
                value={formatDate(asset.ultimaAtualizacao)}
              />
            </div>
          </div>

          {/* ID do Sistema */}
          <div className="bg-gray-50 p-3 rounded-md">
            <p className="text-xs text-gray-500">
              <span className="font-semibold">ID do Sistema:</span>{" "}
              <code className="font-mono">{asset.assetId}</code>
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
