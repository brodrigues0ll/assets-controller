"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import { createAsset } from "@/lib/actions/assets";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

export function CreateAssetDialog({ open, onClose, onSuccess, dnbs }) {
  const { data: session } = useSession();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const [formData, setFormData] = useState({
    tipoEquipamento: "",
    subtipo: "",
    fabricante: "",
    usuarioResponsavel: "",
    funcaoPerfil: "",
    localizacaoSetor: "",
    dnb: "",
    patrimonio: "",
    numeroSerie: "",
    hostname: "",
    enderecoIp: "",
    sistemaOperacional: "",
    ipGerencia: "",
    redeVlan: "N/A",
    portasConexoes: "",
    quantidade: "1",
    situacao: "Ativo",
    observacoes: "",
  });

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setSubmitting(true);

    try {
      await createAsset(formData);
      onSuccess();
    } catch (err) {
      setError(err.message || "Erro ao criar ativo");
    } finally {
      setSubmitting(false);
    }
  }

  function handleChange(field, value) {
    setFormData((prev) => ({ ...prev, [field]: value }));
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[700px] max-h-[85vh] overflow-y-auto">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Novo Ativo</DialogTitle>
            <DialogDescription>
              Cadastre um novo ativo no inventário
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            {/* Informações Básicas */}
            <div className="space-y-4">
              <h3 className="font-semibold text-sm text-gray-700 border-b pb-2">
                Informações Básicas
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="tipoEquipamento">
                    Tipo de Equipamento *
                  </Label>
                  <select
                    id="tipoEquipamento"
                    value={formData.tipoEquipamento}
                    onChange={(e) =>
                      handleChange("tipoEquipamento", e.target.value)
                    }
                    className="w-full h-10 px-3 rounded-md border border-gray-300 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  >
                    <option value="">Selecione</option>
                    <option value="Computador">Computador</option>
                    <option value="Notebook">Notebook</option>
                    <option value="Monitor">Monitor</option>
                    <option value="Switch">Switch</option>
                    <option value="Roteador">Roteador</option>
                    <option value="Impressora">Impressora</option>
                    <option value="Servidor">Servidor</option>
                    <option value="Telefone">Telefone</option>
                    <option value="Câmera">Câmera</option>
                    <option value="Mobiliário">Mobiliário</option>
                    <option value="Outro">Outro</option>
                  </select>
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="subtipo">Subtipo / Modelo *</Label>
                  <Input
                    id="subtipo"
                    placeholder="Ex: Dell Optiplex 7010"
                    value={formData.subtipo}
                    onChange={(e) => handleChange("subtipo", e.target.value)}
                    required
                  />
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="fabricante">Fabricante *</Label>
                  <Input
                    id="fabricante"
                    placeholder="Ex: Dell, HP, Cisco"
                    value={formData.fabricante}
                    onChange={(e) => handleChange("fabricante", e.target.value)}
                    required
                  />
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="patrimonio">Patrimônio *</Label>
                  <Input
                    id="patrimonio"
                    placeholder="Número de patrimônio NAV"
                    value={formData.patrimonio}
                    onChange={(e) => handleChange("patrimonio", e.target.value)}
                    required
                  />
                </div>
              </div>
            </div>

            {/* Localização */}
            <div className="space-y-4">
              <h3 className="font-semibold text-sm text-gray-700 border-b pb-2">
                Localização
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="dnb">DNB / Localidade *</Label>
                  <select
                    id="dnb"
                    value={formData.dnb}
                    onChange={(e) => handleChange("dnb", e.target.value)}
                    className="w-full h-10 px-3 rounded-md border border-gray-300 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  >
                    <option value="">Selecione</option>
                    {dnbs.map((dnb) => (
                      <option key={dnb._id} value={dnb._id}>
                        {dnb.code} - {dnb.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="localizacaoSetor">
                    Localização / Setor *
                  </Label>
                  <Input
                    id="localizacaoSetor"
                    placeholder="Ex: OPR, ADM, TI"
                    value={formData.localizacaoSetor}
                    onChange={(e) =>
                      handleChange("localizacaoSetor", e.target.value)
                    }
                    required
                  />
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="usuarioResponsavel">
                    Usuário Responsável
                  </Label>
                  <Input
                    id="usuarioResponsavel"
                    placeholder="Nome do usuário"
                    value={formData.usuarioResponsavel}
                    onChange={(e) =>
                      handleChange("usuarioResponsavel", e.target.value)
                    }
                  />
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="funcaoPerfil">Função / Perfil</Label>
                  <Input
                    id="funcaoPerfil"
                    placeholder="Ex: OPR, ADM, Téc."
                    value={formData.funcaoPerfil}
                    onChange={(e) =>
                      handleChange("funcaoPerfil", e.target.value)
                    }
                  />
                </div>
              </div>
            </div>

            {/* Identificação */}
            <div className="space-y-4">
              <h3 className="font-semibold text-sm text-gray-700 border-b pb-2">
                Identificação
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="numeroSerie">Número de Série</Label>
                  <Input
                    id="numeroSerie"
                    placeholder="S/N do equipamento"
                    value={formData.numeroSerie}
                    onChange={(e) =>
                      handleChange("numeroSerie", e.target.value)
                    }
                  />
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="hostname">Hostname / Identificação</Label>
                  <Input
                    id="hostname"
                    placeholder="Nome na rede"
                    value={formData.hostname}
                    onChange={(e) => handleChange("hostname", e.target.value)}
                  />
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="sistemaOperacional">
                    Sistema Operacional / Firmware
                  </Label>
                  <Input
                    id="sistemaOperacional"
                    placeholder="Ex: Windows 11, Linux"
                    value={formData.sistemaOperacional}
                    onChange={(e) =>
                      handleChange("sistemaOperacional", e.target.value)
                    }
                  />
                </div>
              </div>
            </div>

            {/* Rede */}
            <div className="space-y-4">
              <h3 className="font-semibold text-sm text-gray-700 border-b pb-2">
                Configuração de Rede
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="enderecoIp">Endereço IP</Label>
                  <Input
                    id="enderecoIp"
                    placeholder="Ex: 192.168.1.100"
                    value={formData.enderecoIp}
                    onChange={(e) =>
                      handleChange("enderecoIp", e.target.value)
                    }
                  />
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="ipGerencia">IP de Gerência</Label>
                  <Input
                    id="ipGerencia"
                    placeholder="IP de gerenciamento"
                    value={formData.ipGerencia}
                    onChange={(e) =>
                      handleChange("ipGerencia", e.target.value)
                    }
                  />
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="redeVlan">Rede / VLAN</Label>
                  <select
                    id="redeVlan"
                    value={formData.redeVlan}
                    onChange={(e) => handleChange("redeVlan", e.target.value)}
                    className="w-full h-10 px-3 rounded-md border border-gray-300 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="N/A">N/A</option>
                    <option value="Rede Operacional">Rede Operacional</option>
                    <option value="Rede Administrativa">
                      Rede Administrativa
                    </option>
                  </select>
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="portasConexoes">Portas / Conexões</Label>
                  <Input
                    id="portasConexoes"
                    placeholder="Ex: Porta 1, Uplink"
                    value={formData.portasConexoes}
                    onChange={(e) =>
                      handleChange("portasConexoes", e.target.value)
                    }
                  />
                </div>
              </div>
            </div>

            {/* Status */}
            <div className="space-y-4">
              <h3 className="font-semibold text-sm text-gray-700 border-b pb-2">
                Status e Observações
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="situacao">Situação *</Label>
                  <select
                    id="situacao"
                    value={formData.situacao}
                    onChange={(e) => handleChange("situacao", e.target.value)}
                    className="w-full h-10 px-3 rounded-md border border-gray-300 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  >
                    <option value="Ativo">Ativo</option>
                    <option value="Reserva">Reserva</option>
                    <option value="Em manutenção">Em manutenção</option>
                    <option value="Descartado">Descartado</option>
                  </select>
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="quantidade">Quantidade *</Label>
                  <Input
                    id="quantidade"
                    type="number"
                    min="1"
                    value={formData.quantidade}
                    onChange={(e) => handleChange("quantidade", e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="observacoes">Observações</Label>
                <Textarea
                  id="observacoes"
                  placeholder="Informações adicionais..."
                  value={formData.observacoes}
                  onChange={(e) => handleChange("observacoes", e.target.value)}
                  rows={3}
                />
              </div>
            </div>

            {error && (
              <div className="text-sm text-red-600 bg-red-50 p-3 rounded-md">
                {error}
              </div>
            )}
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={submitting}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={submitting}>
              {submitting ? "Criando..." : "Criar Ativo"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
