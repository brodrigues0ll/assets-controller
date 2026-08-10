"use client";

import { useState, useEffect, useRef } from "react";
import { getAllCategorias, createCategoria, updateCategoria, deleteCategoria } from "@/lib/actions/categorias";
import { useSession } from "next-auth/react";
import { Plus, Edit, Trash2, Tag, Wifi, Monitor, AlertTriangle, X, Check } from "lucide-react";

const DEFAULT_CATEGORIA_FORM = { nome: "", descricao: "", icone: "package", temRede: false, temSO: false, ativo: true };

function CategoriaDialog({ open, onClose, onSuccess, onRefresh, categoria }) {
  const isEdit = !!categoria;
  const formRef = useRef(null);
  const saveAndNextRef = useRef(false);
  const [formData, setFormData] = useState(DEFAULT_CATEGORIA_FORM);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [savedFlash, setSavedFlash] = useState(false);

  useEffect(() => {
    if (categoria) {
      setFormData({
        nome: categoria.nome || "",
        descricao: categoria.descricao || "",
        icone: categoria.icone || "package",
        temRede: categoria.temRede || false,
        temSO: categoria.temSO || false,
        ativo: categoria.ativo !== undefined ? categoria.ativo : true,
      });
    } else {
      setFormData({ nome: "", descricao: "", icone: "package", temRede: false, temSO: false, ativo: true });
    }
    setError("");
  }, [categoria, open]);

  async function handleSubmit(e) {
    e.preventDefault();
    const isNext = saveAndNextRef.current;
    saveAndNextRef.current = false;
    setError("");
    setSubmitting(true);
    try {
      if (isEdit) {
        await updateCategoria(categoria._id, formData);
      } else {
        await createCategoria(formData);
      }
      if (isNext) {
        setFormData(DEFAULT_CATEGORIA_FORM);
        setSavedFlash(true);
        setTimeout(() => setSavedFlash(false), 2000);
        onRefresh?.();
      } else {
        onSuccess();
      }
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
        className="relative w-full max-w-md rounded-lg p-6 z-10"
        style={{ background: "#0f0f1a", border: "1px solid #00d4ff30" }}
      >
        <div className="flex items-center justify-between mb-5">
          <h2 className="font-mono font-bold text-base" style={{ color: "#00d4ff" }}>
            {isEdit ? "EDITAR CATEGORIA" : "NOVA CATEGORIA"}
          </h2>
          <button onClick={onClose} style={{ color: "#64748b" }}>
            <X className="h-5 w-5" />
          </button>
        </div>

        {error && (
          <div
            className="flex items-center gap-2 px-3 py-2 rounded mb-4 text-sm"
            style={{ background: "#ff2d5510", border: "1px solid #ff2d5540", color: "#ff2d55" }}
          >
            <AlertTriangle className="h-4 w-4" />
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} ref={formRef} className="space-y-4">
          <div>
            <label className="block text-xs font-mono uppercase tracking-widest mb-2" style={{ color: "#64748b" }}>
              Nome *
            </label>
            <input
              required
              value={formData.nome}
              onChange={(e) => setFormData((p) => ({ ...p, nome: e.target.value }))}
              placeholder="Ex: Computadores e Notebooks"
              className="w-full h-10 px-3 rounded text-sm font-mono"
              style={inputStyle}
              onFocus={(e) => { e.target.style.borderColor = "#00d4ff"; e.target.style.boxShadow = "0 0 0 1px #00d4ff"; }}
              onBlur={(e) => { e.target.style.borderColor = "#1a3a4a"; e.target.style.boxShadow = "none"; }}
            />
          </div>

          <div>
            <label className="block text-xs font-mono uppercase tracking-widest mb-2" style={{ color: "#64748b" }}>
              Descrição
            </label>
            <textarea
              value={formData.descricao}
              onChange={(e) => setFormData((p) => ({ ...p, descricao: e.target.value }))}
              placeholder="Descrição da categoria..."
              rows={3}
              className="w-full px-3 py-2 rounded text-sm font-mono resize-none"
              style={inputStyle}
              onFocus={(e) => { e.target.style.borderColor = "#00d4ff"; e.target.style.boxShadow = "0 0 0 1px #00d4ff"; }}
              onBlur={(e) => { e.target.style.borderColor = "#1a3a4a"; e.target.style.boxShadow = "none"; }}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <label
              className="flex items-center gap-3 p-3 rounded cursor-pointer transition-all"
              style={{
                background: formData.temRede ? "#00d4ff15" : "#141428",
                border: `1px solid ${formData.temRede ? "#00d4ff40" : "#1a3a4a"}`,
              }}
            >
              <input
                type="checkbox"
                checked={formData.temRede}
                onChange={(e) => setFormData((p) => ({ ...p, temRede: e.target.checked }))}
                className="sr-only"
              />
              <div
                className="w-5 h-5 rounded flex items-center justify-center flex-shrink-0"
                style={{ background: formData.temRede ? "#00d4ff" : "#1a3a4a" }}
              >
                {formData.temRede && <Check className="h-3 w-3 text-black" />}
              </div>
              <div>
                <p className="text-xs font-mono font-semibold" style={{ color: "#e2e8f0" }}>Tem Rede</p>
                <p className="text-xs" style={{ color: "#64748b" }}>Exibe campos de rede</p>
              </div>
            </label>

            <label
              className="flex items-center gap-3 p-3 rounded cursor-pointer transition-all"
              style={{
                background: formData.temSO ? "#00d4ff15" : "#141428",
                border: `1px solid ${formData.temSO ? "#00d4ff40" : "#1a3a4a"}`,
              }}
            >
              <input
                type="checkbox"
                checked={formData.temSO}
                onChange={(e) => setFormData((p) => ({ ...p, temSO: e.target.checked }))}
                className="sr-only"
              />
              <div
                className="w-5 h-5 rounded flex items-center justify-center flex-shrink-0"
                style={{ background: formData.temSO ? "#00d4ff" : "#1a3a4a" }}
              >
                {formData.temSO && <Check className="h-3 w-3 text-black" />}
              </div>
              <div>
                <p className="text-xs font-mono font-semibold" style={{ color: "#e2e8f0" }}>Tem SO</p>
                <p className="text-xs" style={{ color: "#64748b" }}>Exibe campo de SO</p>
              </div>
            </label>
          </div>

          {isEdit && (
            <label
              className="flex items-center gap-3 cursor-pointer"
            >
              <div
                className="relative w-10 h-6 rounded-full transition-all"
                style={{ background: formData.ativo ? "#00d4ff" : "#1a3a4a" }}
                onClick={() => setFormData((p) => ({ ...p, ativo: !p.ativo }))}
              >
                <div
                  className="absolute top-1 w-4 h-4 rounded-full bg-white transition-all"
                  style={{ left: formData.ativo ? "22px" : "2px" }}
                />
              </div>
              <span className="text-sm font-mono" style={{ color: "#e2e8f0" }}>
                {formData.ativo ? "Ativa" : "Inativa"}
              </span>
            </label>
          )}

          {savedFlash && (
            <div className="flex items-center gap-2 px-3 py-2 rounded text-sm" style={{ background: "#00ff8810", border: "1px solid #00ff8840", color: "#00ff88" }}>
              ✓ Criado com sucesso!
            </div>
          )}
          <div className="flex gap-2 pt-2">
            <button type="button" onClick={onClose} disabled={submitting}
              className="h-10 px-4 rounded font-mono text-sm font-semibold"
              style={{ background: "#141428", border: "1px solid #1a3a4a", color: "#64748b" }}>
              Cancelar
            </button>
            {!isEdit && (
              <button type="button" disabled={submitting}
                onClick={() => { saveAndNextRef.current = true; formRef.current?.requestSubmit(); }}
                className="flex-1 h-10 rounded font-mono text-sm font-semibold"
                style={{ background: "#141428", border: "1px solid #00d4ff40", color: "#00d4ff" }}>
                + Próximo
              </button>
            )}
            <button type="submit" disabled={submitting}
              className="flex-1 h-10 rounded font-mono text-sm font-semibold"
              style={{ background: submitting ? "#00d4ff60" : "#00d4ff", color: "#0a0a0f", cursor: submitting ? "not-allowed" : "pointer" }}>
              {submitting ? "Salvando..." : isEdit ? "Atualizar" : "Salvar"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function CategoriasPage() {
  const { data: session } = useSession();
  const [categorias, setCategorias] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedCategoria, setSelectedCategoria] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    try {
      setLoading(true);
      const data = await getAllCategorias();
      setCategorias(data);
    } catch (err) {
      setError("Erro ao carregar categorias");
    } finally {
      setLoading(false);
    }
  }

  async function refreshSilent() {
    try {
      const data = await getAllCategorias();
      setCategorias(data);
    } catch {}
  }

  function handleCreate() {
    setSelectedCategoria(null);
    setDialogOpen(true);
  }

  function handleEdit(cat) {
    setSelectedCategoria(cat);
    setDialogOpen(true);
  }

  async function handleDelete(id, nome) {
    if (!confirm(`Excluir a categoria "${nome}"? Esta ação não pode ser desfeita.`)) return;
    try {
      await deleteCategoria(id);
      loadData();
    } catch (err) {
      alert(err.message || "Erro ao excluir");
    }
  }

  const canManage = session?.user?.role === "gestor" || session?.user?.role === "administrador";
  const canDelete = session?.user?.role === "administrador";

  if (loading) {
    return (
      <div className="flex items-center justify-center h-48">
        <p className="font-mono" style={{ color: "#64748b" }}>Carregando...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold font-mono" style={{ color: "#e2e8f0" }}>
            Categorias
          </h1>
          <p className="text-sm mt-1" style={{ color: "#64748b" }}>
            Gerencie as categorias de ativos
          </p>
        </div>
        {canManage && (
          <button
            onClick={handleCreate}
            className="flex items-center gap-2 px-4 py-2 rounded font-mono text-sm font-semibold transition-all"
            style={{
              background: "#00d4ff",
              color: "#0a0a0f",
              boxShadow: "0 0 10px rgba(0,212,255,0.3)",
            }}
          >
            <Plus className="h-4 w-4" />
            Nova Categoria
          </button>
        )}
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

      {/* Categorias grid */}
      {categorias.length === 0 ? (
        <div
          className="flex flex-col items-center justify-center py-16 rounded-lg"
          style={{ background: "#0f0f1a", border: "1px solid #1a3a4a" }}
        >
          <Tag className="h-12 w-12 mb-4" style={{ color: "#1a3a4a" }} />
          <p className="font-mono text-sm" style={{ color: "#64748b" }}>
            Nenhuma categoria cadastrada
          </p>
          {canManage && (
            <button
              onClick={handleCreate}
              className="mt-4 px-4 py-2 rounded font-mono text-sm transition-all"
              style={{
                background: "#00d4ff15",
                border: "1px solid #00d4ff40",
                color: "#00d4ff",
              }}
            >
              Criar primeira categoria
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {categorias.map((cat) => (
            <div
              key={cat._id}
              className="rounded-lg p-5 transition-all group"
              style={{
                background: "#0f0f1a",
                border: `1px solid ${cat.ativo ? "#1a3a4a" : "#1a3a4a50"}`,
                opacity: cat.ativo ? 1 : 0.6,
              }}
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div
                    className="w-10 h-10 rounded flex items-center justify-center"
                    style={{ background: "#00d4ff10", border: "1px solid #00d4ff20" }}
                  >
                    <Tag className="h-5 w-5" style={{ color: "#00d4ff" }} />
                  </div>
                  <div>
                    <h3 className="font-semibold text-sm" style={{ color: "#e2e8f0" }}>
                      {cat.nome}
                    </h3>
                    {!cat.ativo && (
                      <span className="text-xs font-mono" style={{ color: "#ff2d55" }}>
                        INATIVA
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex gap-1">
                  {canManage && (
                    <button
                      onClick={() => handleEdit(cat)}
                      className="p-1.5 rounded transition-all"
                      style={{ color: "#64748b" }}
                      onMouseEnter={(e) => { e.currentTarget.style.color = "#00d4ff"; e.currentTarget.style.background = "#00d4ff10"; }}
                      onMouseLeave={(e) => { e.currentTarget.style.color = "#64748b"; e.currentTarget.style.background = "transparent"; }}
                    >
                      <Edit className="h-4 w-4" />
                    </button>
                  )}
                  {canDelete && (
                    <button
                      onClick={() => handleDelete(cat._id, cat.nome)}
                      className="p-1.5 rounded transition-all"
                      style={{ color: "#64748b" }}
                      onMouseEnter={(e) => { e.currentTarget.style.color = "#ff2d55"; e.currentTarget.style.background = "#ff2d5510"; }}
                      onMouseLeave={(e) => { e.currentTarget.style.color = "#64748b"; e.currentTarget.style.background = "transparent"; }}
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  )}
                </div>
              </div>

              {cat.descricao && (
                <p className="text-xs mb-3" style={{ color: "#64748b" }}>
                  {cat.descricao}
                </p>
              )}

              <div className="flex gap-2">
                {cat.temRede && (
                  <span
                    className="flex items-center gap-1 px-2 py-1 rounded text-xs font-mono"
                    style={{ background: "#00d4ff10", color: "#00d4ff", border: "1px solid #00d4ff20" }}
                  >
                    <Wifi className="h-3 w-3" />
                    Rede
                  </span>
                )}
                {cat.temSO && (
                  <span
                    className="flex items-center gap-1 px-2 py-1 rounded text-xs font-mono"
                    style={{ background: "#a855f710", color: "#a855f7", border: "1px solid #a855f720" }}
                  >
                    <Monitor className="h-3 w-3" />
                    SO
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      <CategoriaDialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        onSuccess={() => { setDialogOpen(false); loadData(); }}
        onRefresh={refreshSilent}
        categoria={selectedCategoria}
      />
    </div>
  );
}
