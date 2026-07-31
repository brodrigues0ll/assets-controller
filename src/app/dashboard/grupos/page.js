"use client";

import { useState, useEffect } from "react";
import { getGrupos, createGrupo, updateGrupo, deleteGrupo } from "@/lib/actions/grupos";
import { getAllDNBs } from "@/lib/actions/dnbs";
import { useSession } from "next-auth/react";
import { Shield, Plus, Edit, Trash2, AlertTriangle, X, Check } from "lucide-react";

const MODULOS_PERMISSAO = [
  {
    key: "ativos",
    label: "Ativos",
    perms: [
      { key: "ver", label: "Ver" },
      { key: "criar", label: "Criar" },
      { key: "editar", label: "Editar" },
      { key: "excluir", label: "Excluir" },
    ],
  },
  {
    key: "usuarios",
    label: "Usuários",
    perms: [
      { key: "ver", label: "Ver" },
      { key: "criar", label: "Criar" },
      { key: "editar", label: "Editar" },
      { key: "excluir", label: "Excluir" },
    ],
  },
  {
    key: "categorias",
    label: "Categorias",
    perms: [
      { key: "ver", label: "Ver" },
      { key: "criar", label: "Criar" },
      { key: "editar", label: "Editar" },
      { key: "excluir", label: "Excluir" },
    ],
  },
  {
    key: "relatorios",
    label: "Relatórios",
    perms: [
      { key: "ver", label: "Ver" },
      { key: "exportar", label: "Exportar" },
    ],
  },
  {
    key: "audit",
    label: "Auditoria",
    perms: [{ key: "ver", label: "Ver" }],
  },
];

const defaultPermissoes = {
  ativos: { criar: false, editar: false, excluir: false, ver: true },
  usuarios: { criar: false, editar: false, excluir: false, ver: false },
  categorias: { criar: false, editar: false, excluir: false, ver: true },
  relatorios: { ver: false, exportar: false },
  audit: { ver: false },
};

function GrupoDialog({ open, onClose, onSuccess, grupo, dnbs }) {
  const isEdit = !!grupo;
  const [formData, setFormData] = useState({
    nome: "",
    descricao: "",
    permissoes: JSON.parse(JSON.stringify(defaultPermissoes)),
    dnbs: [],
    ativo: true,
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (grupo) {
      setFormData({
        nome: grupo.nome || "",
        descricao: grupo.descricao || "",
        permissoes: grupo.permissoes || JSON.parse(JSON.stringify(defaultPermissoes)),
        dnbs: grupo.dnbs?.map((d) => d._id || d) || [],
        ativo: grupo.ativo !== undefined ? grupo.ativo : true,
      });
    } else {
      setFormData({
        nome: "",
        descricao: "",
        permissoes: JSON.parse(JSON.stringify(defaultPermissoes)),
        dnbs: [],
        ativo: true,
      });
    }
    setError("");
  }, [grupo, open]);

  function togglePerm(modulo, perm) {
    setFormData((p) => ({
      ...p,
      permissoes: {
        ...p.permissoes,
        [modulo]: {
          ...p.permissoes[modulo],
          [perm]: !p.permissoes[modulo][perm],
        },
      },
    }));
  }

  function toggleDnb(id) {
    setFormData((p) => ({
      ...p,
      dnbs: p.dnbs.includes(id) ? p.dnbs.filter((d) => d !== id) : [...p.dnbs, id],
    }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      if (isEdit) {
        await updateGrupo(grupo._id, formData);
      } else {
        await createGrupo(formData);
      }
      onSuccess();
    } catch (err) {
      setError(err.message || "Erro ao salvar");
    } finally {
      setSubmitting(false);
    }
  }

  if (!open) return null;

  const inputStyle = {
    background: "#141428",
    border: "1px solid #1a3a4a",
    color: "#e2e8f0",
    outline: "none",
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0"
        style={{ background: "#0a0a0f90" }}
        onClick={onClose}
      />
      <div
        className="relative w-full max-w-2xl rounded-lg z-10 max-h-[90vh] overflow-y-auto"
        style={{ background: "#0f0f1a", border: "1px solid #00d4ff30" }}
      >
        <div className="sticky top-0 z-10 flex items-center justify-between px-6 py-4" style={{ background: "#0f0f1a", borderBottom: "1px solid #1a3a4a" }}>
          <h2 className="font-mono font-bold text-base" style={{ color: "#00d4ff" }}>
            {isEdit ? "EDITAR GRUPO" : "NOVO GRUPO"}
          </h2>
          <button onClick={onClose} style={{ color: "#64748b" }}>
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {error && (
            <div
              className="flex items-center gap-2 px-3 py-2 rounded text-sm"
              style={{ background: "#ff2d5510", border: "1px solid #ff2d5540", color: "#ff2d55" }}
            >
              <AlertTriangle className="h-4 w-4" />
              {error}
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-mono uppercase tracking-widest mb-2" style={{ color: "#64748b" }}>
                Nome *
              </label>
              <input
                required
                value={formData.nome}
                onChange={(e) => setFormData((p) => ({ ...p, nome: e.target.value }))}
                placeholder="Ex: Técnico Campo"
                className="w-full h-10 px-3 rounded text-sm font-mono"
                style={inputStyle}
                onFocus={(e) => { e.target.style.borderColor = "#00d4ff"; }}
                onBlur={(e) => { e.target.style.borderColor = "#1a3a4a"; }}
              />
            </div>
            <div>
              <label className="block text-xs font-mono uppercase tracking-widest mb-2" style={{ color: "#64748b" }}>
                Descrição
              </label>
              <input
                value={formData.descricao}
                onChange={(e) => setFormData((p) => ({ ...p, descricao: e.target.value }))}
                placeholder="Descrição do grupo"
                className="w-full h-10 px-3 rounded text-sm font-mono"
                style={inputStyle}
                onFocus={(e) => { e.target.style.borderColor = "#00d4ff"; }}
                onBlur={(e) => { e.target.style.borderColor = "#1a3a4a"; }}
              />
            </div>
          </div>

          {/* Permissões */}
          <div>
            <p className="text-xs font-mono uppercase tracking-widest mb-3" style={{ color: "#64748b" }}>
              Permissões
            </p>
            <div className="space-y-3">
              {MODULOS_PERMISSAO.map((modulo) => (
                <div
                  key={modulo.key}
                  className="rounded-lg p-4"
                  style={{ background: "#141428", border: "1px solid #1a3a4a" }}
                >
                  <p className="text-xs font-mono font-semibold mb-3" style={{ color: "#e2e8f0" }}>
                    {modulo.label}
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {modulo.perms.map((perm) => {
                      const enabled = formData.permissoes?.[modulo.key]?.[perm.key];
                      return (
                        <button
                          key={perm.key}
                          type="button"
                          onClick={() => togglePerm(modulo.key, perm.key)}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-mono font-semibold transition-all"
                          style={
                            enabled
                              ? { background: "#00d4ff20", color: "#00d4ff", border: "1px solid #00d4ff40" }
                              : { background: "#0a0a0f", color: "#64748b", border: "1px solid #1a3a4a" }
                          }
                        >
                          {enabled && <Check className="h-3 w-3" />}
                          {perm.label}
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* DNBs */}
          {dnbs.length > 0 && (
            <div>
              <p className="text-xs font-mono uppercase tracking-widest mb-3" style={{ color: "#64748b" }}>
                DNBs (deixe vazio para todas)
              </p>
              <div className="flex flex-wrap gap-2">
                {dnbs.map((dnb) => {
                  const selected = formData.dnbs.includes(dnb._id);
                  return (
                    <button
                      key={dnb._id}
                      type="button"
                      onClick={() => toggleDnb(dnb._id)}
                      className="px-3 py-1.5 rounded text-xs font-mono font-semibold transition-all"
                      style={
                        selected
                          ? { background: "#a855f720", color: "#a855f7", border: "1px solid #a855f740" }
                          : { background: "#141428", color: "#64748b", border: "1px solid #1a3a4a" }
                      }
                    >
                      {dnb.code}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              disabled={submitting}
              className="flex-1 h-10 rounded font-mono text-sm font-semibold"
              style={{ background: "#141428", border: "1px solid #1a3a4a", color: "#64748b" }}
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="flex-1 h-10 rounded font-mono text-sm font-semibold transition-all"
              style={{
                background: submitting ? "#00d4ff60" : "#00d4ff",
                color: "#0a0a0f",
                cursor: submitting ? "not-allowed" : "pointer",
              }}
            >
              {submitting ? "Salvando..." : isEdit ? "Atualizar" : "Criar"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function GruposPage() {
  const { data: session } = useSession();
  const [grupos, setGrupos] = useState([]);
  const [dnbs, setDnbs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedGrupo, setSelectedGrupo] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    if (session?.user?.role === "administrador") {
      loadData();
    } else {
      setLoading(false);
      setError("Apenas administradores podem acessar esta página");
    }
  }, [session]);

  async function loadData() {
    try {
      setLoading(true);
      const [gruposData, dnbsData] = await Promise.all([getGrupos(), getAllDNBs()]);
      setGrupos(gruposData);
      setDnbs(dnbsData);
    } catch (err) {
      setError(err.message || "Erro ao carregar dados");
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete(id, nome) {
    if (!confirm(`Excluir o grupo "${nome}"? Esta ação não pode ser desfeita.`)) return;
    try {
      await deleteGrupo(id);
      loadData();
    } catch (err) {
      alert(err.message || "Erro ao excluir");
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-48">
        <p className="font-mono" style={{ color: "#64748b" }}>Carregando...</p>
      </div>
    );
  }

  if (session?.user?.role !== "administrador") {
    return (
      <div
        className="flex flex-col items-center justify-center py-16 rounded-lg"
        style={{ background: "#0f0f1a", border: "1px solid #ff2d5540" }}
      >
        <Shield className="h-12 w-12 mb-4" style={{ color: "#ff2d55" }} />
        <p className="font-mono text-sm" style={{ color: "#ff2d55" }}>
          Acesso restrito a administradores
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold font-mono" style={{ color: "#e2e8f0" }}>
            Grupos de Permissões
          </h1>
          <p className="text-sm mt-1" style={{ color: "#64748b" }}>
            Controle de acesso por módulo
          </p>
        </div>
        <button
          onClick={() => { setSelectedGrupo(null); setDialogOpen(true); }}
          className="flex items-center gap-2 px-4 py-2 rounded font-mono text-sm font-semibold transition-all"
          style={{
            background: "#00d4ff",
            color: "#0a0a0f",
            boxShadow: "0 0 10px rgba(0,212,255,0.3)",
          }}
        >
          <Plus className="h-4 w-4" />
          Novo Grupo
        </button>
      </div>

      {error && (
        <div
          className="flex items-center gap-2 px-4 py-3 rounded text-sm"
          style={{ background: "#ff2d5510", border: "1px solid #ff2d5540", color: "#ff2d55" }}
        >
          <AlertTriangle className="h-4 w-4" />
          {error}
        </div>
      )}

      {grupos.length === 0 ? (
        <div
          className="flex flex-col items-center justify-center py-16 rounded-lg"
          style={{ background: "#0f0f1a", border: "1px solid #1a3a4a" }}
        >
          <Shield className="h-12 w-12 mb-4" style={{ color: "#1a3a4a" }} />
          <p className="font-mono text-sm" style={{ color: "#64748b" }}>
            Nenhum grupo cadastrado
          </p>
          <button
            onClick={() => { setSelectedGrupo(null); setDialogOpen(true); }}
            className="mt-4 px-4 py-2 rounded font-mono text-sm transition-all"
            style={{ background: "#00d4ff15", border: "1px solid #00d4ff40", color: "#00d4ff" }}
          >
            Criar primeiro grupo
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {grupos.map((grupo) => (
            <div
              key={grupo._id}
              className="rounded-lg p-5"
              style={{
                background: "#0f0f1a",
                border: "1px solid #1a3a4a",
                opacity: grupo.ativo ? 1 : 0.6,
              }}
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div
                    className="w-10 h-10 rounded flex items-center justify-center"
                    style={{ background: "#a855f710", border: "1px solid #a855f720" }}
                  >
                    <Shield className="h-5 w-5" style={{ color: "#a855f7" }} />
                  </div>
                  <div>
                    <h3 className="font-semibold text-sm" style={{ color: "#e2e8f0" }}>
                      {grupo.nome}
                    </h3>
                    {!grupo.ativo && (
                      <span className="text-xs font-mono" style={{ color: "#ff2d55" }}>INATIVO</span>
                    )}
                  </div>
                </div>
                <div className="flex gap-1">
                  <button
                    onClick={() => { setSelectedGrupo(grupo); setDialogOpen(true); }}
                    className="p-1.5 rounded transition-all"
                    style={{ color: "#64748b" }}
                    onMouseEnter={(e) => { e.currentTarget.style.color = "#00d4ff"; e.currentTarget.style.background = "#00d4ff10"; }}
                    onMouseLeave={(e) => { e.currentTarget.style.color = "#64748b"; e.currentTarget.style.background = "transparent"; }}
                  >
                    <Edit className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(grupo._id, grupo.nome)}
                    className="p-1.5 rounded transition-all"
                    style={{ color: "#64748b" }}
                    onMouseEnter={(e) => { e.currentTarget.style.color = "#ff2d55"; e.currentTarget.style.background = "#ff2d5510"; }}
                    onMouseLeave={(e) => { e.currentTarget.style.color = "#64748b"; e.currentTarget.style.background = "transparent"; }}
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>

              {grupo.descricao && (
                <p className="text-xs mb-3" style={{ color: "#64748b" }}>
                  {grupo.descricao}
                </p>
              )}

              {/* Resumo de permissões */}
              <div className="space-y-1">
                {MODULOS_PERMISSAO.map((modulo) => {
                  const perms = grupo.permissoes?.[modulo.key] || {};
                  const activePerms = modulo.perms.filter((p) => perms[p.key]);
                  if (activePerms.length === 0) return null;
                  return (
                    <div key={modulo.key} className="flex items-center gap-2">
                      <span className="text-xs font-mono w-20 flex-shrink-0" style={{ color: "#64748b" }}>
                        {modulo.label}:
                      </span>
                      <div className="flex flex-wrap gap-1">
                        {activePerms.map((p) => (
                          <span
                            key={p.key}
                            className="text-xs font-mono px-1.5 py-0.5 rounded"
                            style={{ background: "#00d4ff10", color: "#00d4ff" }}
                          >
                            {p.label}
                          </span>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>

              {grupo.dnbs && grupo.dnbs.length > 0 && (
                <div className="mt-3 pt-3" style={{ borderTop: "1px solid #1a3a4a" }}>
                  <p className="text-xs font-mono mb-1" style={{ color: "#64748b" }}>DNBs:</p>
                  <div className="flex flex-wrap gap-1">
                    {grupo.dnbs.map((dnb) => (
                      <span
                        key={dnb._id}
                        className="text-xs font-mono px-1.5 py-0.5 rounded"
                        style={{ background: "#a855f710", color: "#a855f7" }}
                      >
                        {dnb.code}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      <GrupoDialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        onSuccess={() => { setDialogOpen(false); loadData(); }}
        grupo={selectedGrupo}
        dnbs={dnbs}
      />
    </div>
  );
}
