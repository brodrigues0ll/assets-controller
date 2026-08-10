"use client";

import { useState, useEffect, useRef } from "react";
import { getAllFabricantes, createFabricante, updateFabricante, deleteFabricante } from "@/lib/actions/fabricantes";
import { useSession } from "next-auth/react";
import { Plus, Edit, Trash2, Factory, AlertTriangle, X } from "lucide-react";

const DEFAULT_FABRICANTE_FORM = { nome: "", ativo: true };

function FabricanteDialog({ open, onClose, onSuccess, onRefresh, fabricante }) {
  const isEdit = !!fabricante;
  const formRef = useRef(null);
  const saveAndNextRef = useRef(false);
  const [formData, setFormData] = useState(DEFAULT_FABRICANTE_FORM);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [savedFlash, setSavedFlash] = useState(false);

  useEffect(() => {
    if (fabricante) {
      setFormData({ nome: fabricante.nome || "", ativo: fabricante.ativo !== undefined ? fabricante.ativo : true });
    } else {
      setFormData({ nome: "", ativo: true });
    }
    setError("");
  }, [fabricante, open]);

  async function handleSubmit(e) {
    e.preventDefault();
    const isNext = saveAndNextRef.current;
    saveAndNextRef.current = false;
    setError("");
    setSubmitting(true);
    try {
      if (isEdit) {
        await updateFabricante(fabricante._id, formData);
      } else {
        await createFabricante(formData);
      }
      if (isNext) {
        setFormData(DEFAULT_FABRICANTE_FORM);
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
      <div className="absolute inset-0" style={{ background: "#0a0a0f90" }} onClick={onClose} />
      <div
        className="relative w-full max-w-sm rounded-lg p-6 z-10"
        style={{ background: "#0f0f1a", border: "1px solid #00d4ff30" }}
      >
        <div className="flex items-center justify-between mb-5">
          <h2 className="font-mono font-bold text-base" style={{ color: "#00d4ff" }}>
            {isEdit ? "EDITAR FABRICANTE" : "NOVO FABRICANTE"}
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
              placeholder="Ex: Dell, HP, Cisco"
              className="w-full h-10 px-3 rounded text-sm font-mono"
              style={inputStyle}
              onFocus={(e) => { e.target.style.borderColor = "#00d4ff"; e.target.style.boxShadow = "0 0 0 1px #00d4ff"; }}
              onBlur={(e) => { e.target.style.borderColor = "#1a3a4a"; e.target.style.boxShadow = "none"; }}
            />
          </div>

          {isEdit && (
            <label className="flex items-center gap-3 cursor-pointer">
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
                {formData.ativo ? "Ativo" : "Inativo"}
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

export default function FabricantesPage() {
  const { data: session } = useSession();
  const [fabricantes, setFabricantes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selected, setSelected] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    try {
      setLoading(true);
      const data = await getAllFabricantes();
      setFabricantes(data);
    } catch (err) {
      setError("Erro ao carregar fabricantes");
    } finally {
      setLoading(false);
    }
  }

  async function refreshSilent() {
    try {
      const data = await getAllFabricantes();
      setFabricantes(data);
    } catch {}
  }

  async function handleDelete(id, nome) {
    if (!confirm(`Excluir o fabricante "${nome}"? Esta ação não pode ser desfeita.`)) return;
    try {
      await deleteFabricante(id);
      loadData();
    } catch (err) {
      alert(err.message || "Erro ao excluir");
    }
  }

  const canManage = session?.user?.role === "gestor" || session?.user?.role === "administrador";
  const canDelete = session?.user?.role === "administrador";

  const [sortCol, setSortCol] = useState(null);
  const [sortDir, setSortDir] = useState('asc');

  function handleSort(col) {
    if (sortCol === col) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    else { setSortCol(col); setSortDir('asc'); }
  }

  function getVal(obj, path) {
    return path.split('.').reduce((o, k) => o?.[k], obj) ?? '';
  }

  const sortedFabricantes = [...fabricantes].sort((a, b) => {
    if (!sortCol) return 0;
    const av = String(getVal(a, sortCol)).toLowerCase();
    const bv = String(getVal(b, sortCol)).toLowerCase();
    return sortDir === 'asc' ? av.localeCompare(bv, 'pt') : bv.localeCompare(av, 'pt');
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center h-48">
        <p className="font-mono" style={{ color: "#64748b" }}>Carregando...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold font-mono" style={{ color: "#e2e8f0" }}>
            Fabricantes
          </h1>
          <p className="text-sm mt-1" style={{ color: "#64748b" }}>
            Gerencie os fabricantes de equipamentos
          </p>
        </div>
        {canManage && (
          <button
            onClick={() => { setSelected(null); setDialogOpen(true); }}
            className="flex items-center gap-2 px-4 py-2 rounded font-mono text-sm font-semibold transition-all"
            style={{ background: "#00d4ff", color: "#0a0a0f", boxShadow: "0 0 10px rgba(0,212,255,0.3)" }}
          >
            <Plus className="h-4 w-4" />
            Novo Fabricante
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

      {fabricantes.length === 0 ? (
        <div
          className="flex flex-col items-center justify-center py-16 rounded-lg"
          style={{ background: "#0f0f1a", border: "1px solid #1a3a4a" }}
        >
          <Factory className="h-12 w-12 mb-4" style={{ color: "#1a3a4a" }} />
          <p className="font-mono text-sm" style={{ color: "#64748b" }}>
            Nenhum fabricante cadastrado
          </p>
          {canManage && (
            <button
              onClick={() => { setSelected(null); setDialogOpen(true); }}
              className="mt-4 px-4 py-2 rounded font-mono text-sm transition-all"
              style={{ background: "#00d4ff15", border: "1px solid #00d4ff40", color: "#00d4ff" }}
            >
              Criar primeiro fabricante
            </button>
          )}
        </div>
      ) : (
        <div
          className="rounded-lg overflow-hidden"
          style={{ background: "#0f0f1a", border: "1px solid #1a3a4a" }}
        >
          <table className="w-full">
            <thead>
              <tr style={{ borderBottom: "1px solid #1a3a4a" }}>
                <th
                  onClick={() => handleSort('nome')}
                  className="px-4 py-3 text-left text-xs font-mono uppercase tracking-wider cursor-pointer select-none"
                  style={{ color: "#00d4ff", background: "#141428" }}
                  onMouseEnter={(e) => { e.currentTarget.style.color = "#e2e8f0"; }}
                  onMouseLeave={(e) => { e.currentTarget.style.color = "#00d4ff"; }}
                >
                  <span className="flex items-center gap-1">
                    Nome
                    <span style={{ opacity: sortCol === 'nome' ? 1 : 0.25, fontSize: '10px' }}>
                      {sortCol === 'nome' && sortDir === 'desc' ? '▼' : '▲'}
                    </span>
                  </span>
                </th>
                <th
                  onClick={() => handleSort('ativo')}
                  className="px-4 py-3 text-left text-xs font-mono uppercase tracking-wider cursor-pointer select-none"
                  style={{ color: "#00d4ff", background: "#141428" }}
                  onMouseEnter={(e) => { e.currentTarget.style.color = "#e2e8f0"; }}
                  onMouseLeave={(e) => { e.currentTarget.style.color = "#00d4ff"; }}
                >
                  <span className="flex items-center gap-1">
                    Status
                    <span style={{ opacity: sortCol === 'ativo' ? 1 : 0.25, fontSize: '10px' }}>
                      {sortCol === 'ativo' && sortDir === 'desc' ? '▼' : '▲'}
                    </span>
                  </span>
                </th>
                <th
                  onClick={() => handleSort('criadoPor.name')}
                  className="px-4 py-3 text-left text-xs font-mono uppercase tracking-wider cursor-pointer select-none"
                  style={{ color: "#00d4ff", background: "#141428" }}
                  onMouseEnter={(e) => { e.currentTarget.style.color = "#e2e8f0"; }}
                  onMouseLeave={(e) => { e.currentTarget.style.color = "#00d4ff"; }}
                >
                  <span className="flex items-center gap-1">
                    Criado por
                    <span style={{ opacity: sortCol === 'criadoPor.name' ? 1 : 0.25, fontSize: '10px' }}>
                      {sortCol === 'criadoPor.name' && sortDir === 'desc' ? '▼' : '▲'}
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
              {sortedFabricantes.map((fab, idx) => (
                <tr
                  key={fab._id}
                  style={{
                    borderBottom: "1px solid #1a3a4a20",
                    background: idx % 2 === 0 ? "transparent" : "#141428",
                  }}
                >
                  <td className="px-4 py-3 text-sm font-mono font-semibold" style={{ color: "#e2e8f0" }}>
                    {fab.nome}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-mono"
                      style={
                        fab.ativo
                          ? { background: "#00ff8820", color: "#00ff88", border: "1px solid #00ff8840" }
                          : { background: "#6b728020", color: "#6b7280", border: "1px solid #6b728040" }
                      }
                    >
                      {fab.ativo ? "Ativo" : "Inativo"}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm" style={{ color: "#64748b" }}>
                    {fab.criadoPor?.name || "-"}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1">
                      {canManage && (
                        <button
                          onClick={() => { setSelected(fab); setDialogOpen(true); }}
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
                          onClick={() => handleDelete(fab._id, fab.nome)}
                          className="p-1.5 rounded transition-all"
                          style={{ color: "#64748b" }}
                          onMouseEnter={(e) => { e.currentTarget.style.color = "#ff2d55"; e.currentTarget.style.background = "#ff2d5510"; }}
                          onMouseLeave={(e) => { e.currentTarget.style.color = "#64748b"; e.currentTarget.style.background = "transparent"; }}
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <FabricanteDialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        onSuccess={() => { setDialogOpen(false); loadData(); }}
        onRefresh={refreshSilent}
        fabricante={selected}
      />
    </div>
  );
}
