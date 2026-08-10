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

const SITUACOES = [
  "Em estoque",
  "Em uso",
  "Ativo",
  "Reserva",
  "Em manutenção",
  "Com defeito",
  "Descartado",
];

const inputClass = "w-full h-10 px-3 rounded text-sm font-mono transition-all duration-150";
const inputStyle = {
  background: "#141428",
  border: "1px solid #1a3a4a",
  color: "#e2e8f0",
  outline: "none",
};

function CyberInput({ id, ...props }) {
  return (
    <input
      id={id}
      className={inputClass}
      style={inputStyle}
      onFocus={(e) => {
        e.target.style.borderColor = "#00d4ff";
        e.target.style.boxShadow = "0 0 0 1px #00d4ff";
      }}
      onBlur={(e) => {
        e.target.style.borderColor = "#1a3a4a";
        e.target.style.boxShadow = "none";
      }}
      {...props}
    />
  );
}

function CyberSelect({ id, children, ...props }) {
  return (
    <select
      id={id}
      className={inputClass}
      style={inputStyle}
      onFocus={(e) => {
        e.target.style.borderColor = "#00d4ff";
      }}
      onBlur={(e) => {
        e.target.style.borderColor = "#1a3a4a";
      }}
      {...props}
    >
      {children}
    </select>
  );
}

function CyberTextarea({ id, ...props }) {
  return (
    <textarea
      id={id}
      className="w-full px-3 py-2 rounded text-sm font-mono transition-all duration-150 resize-none"
      style={inputStyle}
      onFocus={(e) => {
        e.target.style.borderColor = "#00d4ff";
        e.target.style.boxShadow = "0 0 0 1px #00d4ff";
      }}
      onBlur={(e) => {
        e.target.style.borderColor = "#1a3a4a";
        e.target.style.boxShadow = "none";
      }}
      {...props}
    />
  );
}

function SectionTitle({ children }) {
  return (
    <h3
      className="text-xs font-mono uppercase tracking-widest pb-2"
      style={{ color: "#00d4ff", borderBottom: "1px solid #1a3a4a" }}
    >
      {children}
    </h3>
  );
}

function CyberLabel({ htmlFor, children }) {
  return (
    <label
      htmlFor={htmlFor}
      className="block text-xs font-mono uppercase tracking-wider mb-1.5"
      style={{ color: "#64748b" }}
    >
      {children}
    </label>
  );
}

export function CreateAssetDialog({ open, onClose, onSuccess, dnbs, categorias = [], fabricantes = [], setores = [] }) {
  const { data: session } = useSession();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const [formData, setFormData] = useState({
    categoria: "",
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
    redeVlan: "",
    portasConexoes: "",
    quantidade: "1",
    situacao: "Em estoque",
    observacoes: "",
    vinculadoA: "",
  });

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      const payload = { ...formData };
      if (!payload.vinculadoA) delete payload.vinculadoA;
      await createAsset(payload);
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
      <DialogContent
        className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto"
        style={{ background: "#0f0f1a", border: "1px solid #00d4ff30" }}
      >
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle className="font-mono" style={{ color: "#00d4ff" }}>
              NOVO ATIVO
            </DialogTitle>
            <DialogDescription style={{ color: "#64748b" }}>
              Cadastre um novo ativo no inventário
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-5 py-4">
            {/* Informações Básicas */}
            <div className="space-y-4">
              <SectionTitle>Informações Básicas</SectionTitle>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <CyberLabel htmlFor="categoria">Categoria / Tipo *</CyberLabel>
                  <CyberSelect
                    id="categoria"
                    value={formData.categoria}
                    onChange={(e) => handleChange("categoria", e.target.value)}
                    required
                  >
                    <option value="">Selecione</option>
                    {categorias.map((cat) => (
                      <option key={cat._id} value={cat._id}>{cat.nome}</option>
                    ))}
                  </CyberSelect>
                </div>

                <div>
                  <CyberLabel htmlFor="subtipo">Subtipo / Modelo *</CyberLabel>
                  <CyberInput
                    id="subtipo"
                    placeholder="Ex: Dell Optiplex 7010"
                    value={formData.subtipo}
                    onChange={(e) => handleChange("subtipo", e.target.value)}
                    required
                  />
                </div>

                <div>
                  <CyberLabel htmlFor="fabricante">Fabricante</CyberLabel>
                  <CyberSelect
                    id="fabricante"
                    value={formData.fabricante}
                    onChange={(e) => handleChange("fabricante", e.target.value)}
                  >
                    <option value="">Selecione</option>
                    {fabricantes.map((fab) => (
                      <option key={fab._id} value={fab.nome}>{fab.nome}</option>
                    ))}
                  </CyberSelect>
                </div>

                <div>
                  <CyberLabel htmlFor="patrimonio">Patrimônio *</CyberLabel>
                  <CyberInput
                    id="patrimonio"
                    placeholder="Número de patrimônio"
                    value={formData.patrimonio}
                    onChange={(e) => handleChange("patrimonio", e.target.value)}
                    required
                  />
                </div>

                <div>
                  <CyberLabel htmlFor="vinculadoA">Vinculado a (Patrimônio do Ativo Pai)</CyberLabel>
                  <CyberInput
                    id="vinculadoA"
                    placeholder="Patrimônio do ativo pai (opcional)"
                    value={formData.vinculadoA}
                    onChange={(e) => handleChange("vinculadoA", e.target.value)}
                  />
                </div>
              </div>
            </div>

            {/* Localização */}
            <div className="space-y-4">
              <SectionTitle>Localização</SectionTitle>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <CyberLabel htmlFor="dnb">DNB / Localidade *</CyberLabel>
                  <CyberSelect
                    id="dnb"
                    value={formData.dnb}
                    onChange={(e) => handleChange("dnb", e.target.value)}
                    required
                  >
                    <option value="">Selecione</option>
                    {dnbs.map((dnb) => (
                      <option key={dnb._id} value={dnb._id}>
                        {dnb.code} — {dnb.name}
                      </option>
                    ))}
                  </CyberSelect>
                </div>

                <div>
                  <CyberLabel htmlFor="localizacaoSetor">Setor</CyberLabel>
                  <CyberSelect
                    id="localizacaoSetor"
                    value={formData.localizacaoSetor}
                    onChange={(e) => handleChange("localizacaoSetor", e.target.value)}
                  >
                    <option value="">Selecione</option>
                    {setores.map((setor) => (
                      <option key={setor._id} value={setor.nome}>{setor.nome}</option>
                    ))}
                  </CyberSelect>
                </div>

                <div>
                  <CyberLabel htmlFor="usuarioResponsavel">Usuário Responsável</CyberLabel>
                  <CyberInput
                    id="usuarioResponsavel"
                    placeholder="Nome do usuário"
                    value={formData.usuarioResponsavel}
                    onChange={(e) => handleChange("usuarioResponsavel", e.target.value)}
                  />
                </div>

                <div>
                  <CyberLabel htmlFor="funcaoPerfil">Função / Perfil</CyberLabel>
                  <CyberInput
                    id="funcaoPerfil"
                    placeholder="Ex: OPR, ADM, Téc."
                    value={formData.funcaoPerfil}
                    onChange={(e) => handleChange("funcaoPerfil", e.target.value)}
                  />
                </div>
              </div>
            </div>

            {/* Identificação */}
            <div className="space-y-4">
              <SectionTitle>Identificação</SectionTitle>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <CyberLabel htmlFor="numeroSerie">Número de Série</CyberLabel>
                  <CyberInput
                    id="numeroSerie"
                    placeholder="S/N do equipamento"
                    value={formData.numeroSerie}
                    onChange={(e) => handleChange("numeroSerie", e.target.value)}
                  />
                </div>

                <div>
                  <CyberLabel htmlFor="hostname">Hostname / Identificação</CyberLabel>
                  <CyberInput
                    id="hostname"
                    placeholder="Nome na rede"
                    value={formData.hostname}
                    onChange={(e) => handleChange("hostname", e.target.value)}
                  />
                </div>

                <div>
                  <CyberLabel htmlFor="sistemaOperacional">Sistema Operacional / Firmware</CyberLabel>
                  <CyberInput
                    id="sistemaOperacional"
                    placeholder="Ex: Windows 11, Linux"
                    value={formData.sistemaOperacional}
                    onChange={(e) => handleChange("sistemaOperacional", e.target.value)}
                  />
                </div>
              </div>
            </div>

            {/* Rede (opcional) */}
            <div className="space-y-4">
              <SectionTitle>Configuração de Rede (Opcional)</SectionTitle>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <CyberLabel htmlFor="enderecoIp">Endereço IP</CyberLabel>
                  <CyberInput
                    id="enderecoIp"
                    placeholder="Ex: 192.168.1.100"
                    value={formData.enderecoIp}
                    onChange={(e) => handleChange("enderecoIp", e.target.value)}
                  />
                </div>

                <div>
                  <CyberLabel htmlFor="ipGerencia">IP de Gerência</CyberLabel>
                  <CyberInput
                    id="ipGerencia"
                    placeholder="IP de gerenciamento"
                    value={formData.ipGerencia}
                    onChange={(e) => handleChange("ipGerencia", e.target.value)}
                  />
                </div>

                <div>
                  <CyberLabel htmlFor="redeVlan">Rede / VLAN</CyberLabel>
                  <CyberSelect
                    id="redeVlan"
                    value={formData.redeVlan}
                    onChange={(e) => handleChange("redeVlan", e.target.value)}
                  >
                    <option value="">Selecione</option>
                    <option value="Operacional">Operacional</option>
                    <option value="Administrativa">Administrativa</option>
                    <option value="N/A">N/A</option>
                  </CyberSelect>
                </div>

                <div>
                  <CyberLabel htmlFor="portasConexoes">Portas / Conexões</CyberLabel>
                  <CyberInput
                    id="portasConexoes"
                    placeholder="Ex: Porta 1, Uplink"
                    value={formData.portasConexoes}
                    onChange={(e) => handleChange("portasConexoes", e.target.value)}
                  />
                </div>
              </div>
            </div>

            {/* Status */}
            <div className="space-y-4">
              <SectionTitle>Status e Observações</SectionTitle>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <CyberLabel htmlFor="situacao">Situação *</CyberLabel>
                  <CyberSelect
                    id="situacao"
                    value={formData.situacao}
                    onChange={(e) => handleChange("situacao", e.target.value)}
                    required
                  >
                    {SITUACOES.map((s) => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </CyberSelect>
                </div>

                <div>
                  <CyberLabel htmlFor="quantidade">Quantidade *</CyberLabel>
                  <CyberInput
                    id="quantidade"
                    type="number"
                    min="1"
                    value={formData.quantidade}
                    onChange={(e) => handleChange("quantidade", e.target.value)}
                    required
                  />
                </div>
              </div>

              <div>
                <CyberLabel htmlFor="observacoes">Observações</CyberLabel>
                <CyberTextarea
                  id="observacoes"
                  placeholder="Informações adicionais..."
                  value={formData.observacoes}
                  onChange={(e) => handleChange("observacoes", e.target.value)}
                  rows={3}
                />
              </div>
            </div>

            {error && (
              <div
                className="text-sm px-4 py-3 rounded"
                style={{
                  background: "#ff2d5510",
                  border: "1px solid #ff2d5540",
                  color: "#ff2d55",
                }}
              >
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
              style={{
                background: "#141428",
                border: "1px solid #1a3a4a",
                color: "#64748b",
              }}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={submitting}
              style={{
                background: submitting ? "#00d4ff60" : "#00d4ff",
                color: "#0a0a0f",
                fontFamily: "monospace",
                fontWeight: 600,
              }}
            >
              {submitting ? "Criando..." : "Criar Ativo"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
