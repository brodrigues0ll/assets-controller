"use client";

import { useState, useEffect } from "react";
import { getInventarios, createInventario, cancelarInventario } from "@/lib/actions/inventario";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { ClipboardList, Plus, CheckCircle, Clock, XCircle, ExternalLink, AlertTriangle } from "lucide-react";

const STATUS_STYLE = {
  "Em andamento": { bg: "#00d4ff20", color: "#00d4ff", border: "#00d4ff40", icon: Clock },
  "Concluído":    { bg: "#00ff8820", color: "#00ff88", border: "#00ff8840", icon: CheckCircle },
  "Cancelado":    { bg: "#6b728020", color: "#6b7280", border: "#6b728040", icon: XCircle },
};

function progress(inv) {
  if (!inv.registros?.length) return 0;
  const conferidos = inv.registros.filter(r => r.statusEncontrado !== "Pendente").length;
  return Math.round((conferidos / inv.registros.length) * 100);
}

export default function InventarioPage() {
  const { data: session } = useSession();
  const [inventarios, setInventarios] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ nome: "", ano: new Date().getFullYear(), dnbId: "" });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [flash, setFlash] = useState("");

  const canManage = session?.user?.role === "gestor" || session?.user?.role === "administrador";

  useEffect(() => { load(); }, []);

  async function load() {
    try {
      setLoading(true);
      setInventarios(await getInventarios());
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleCreate(e) {
    e.preventDefault();
    if (!form.nome || !form.dnbId) return;
    setSaving(true);
    setError("");
    try {
      await createInventario(form);
      setFlash("Inventário criado com sucesso");
      setShowForm(false);
      setForm({ nome: "", ano: new Date().getFullYear(), dnbId: "" });
      setTimeout(() => setFlash(""), 3000);
      await load();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  async function handleCancelar(id) {
    if (!confirm("Cancelar este inventário?")) return;
    try {
      await cancelarInventario(id);
      await load();
    } catch (err) {
      alert(err.message);
    }
  }

  const dnbsDisponiveis = session?.user?.role === "tecnico"
    ? (session?.user?.dnbs || (session?.user?.dnb ? [session.user.dnb] : []))
    : [];

  if (loading) return (
    <div className="flex items-center justify-center h-48">
      <p className="font-mono" style={{ color: "#64748b" }}>Carregando...</p>
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold font-mono" style={{ color: "#e2e8f0" }}>Inventário Físico</h1>
          <p className="text-sm mt-1" style={{ color: "#64748b" }}>
            Gerenciar inventários patrimoniais anuais por DNB
          </p>
        </div>
        {canManage && (
          <button onClick={() => setShowForm(v => !v)}
            className="flex items-center gap-2 px-4 py-2 rounded font-mono text-sm font-semibold transition-all"
            style={{ background: "#00d4ff15", border: "1px solid #00d4ff40", color: "#00d4ff" }}>
            <Plus className="h-4 w-4" />
            Novo Inventário
          </button>
        )}
      </div>

      {error && (
        <div className="flex items-center gap-2 px-4 py-3 rounded text-sm"
          style={{ background: "#ff2d5510", border: "1px solid #ff2d5540", color: "#ff2d55" }}>
          <AlertTriangle className="h-4 w-4" />{error}
        </div>
      )}

      {flash && (
        <div className="flex items-center gap-2 px-4 py-3 rounded text-sm"
          style={{ background: "#00ff8810", border: "1px solid #00ff8840", color: "#00ff88" }}>
          <CheckCircle className="h-4 w-4" />{flash}
        </div>
      )}

      {/* Formulário novo inventário */}
      {showForm && (
        <form onSubmit={handleCreate} className="rounded-lg p-5 space-y-4"
          style={{ background: "#0f0f1a", border: "1px solid #00d4ff40" }}>
          <p className="text-sm font-mono font-semibold" style={{ color: "#00d4ff" }}>Novo Inventário</p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-mono mb-1.5" style={{ color: "#64748b" }}>Nome</label>
              <input type="text" value={form.nome} onChange={e => setForm(f => ({ ...f, nome: e.target.value }))}
                placeholder="Ex: Inventário Macaé 2026"
                className="w-full rounded px-3 py-2 text-sm font-mono outline-none"
                style={{ background: "#141428", border: "1px solid #1a3a4a", color: "#e2e8f0" }}
                required />
            </div>
            <div>
              <label className="block text-xs font-mono mb-1.5" style={{ color: "#64748b" }}>Ano</label>
              <input type="number" value={form.ano} onChange={e => setForm(f => ({ ...f, ano: e.target.value }))}
                min={2020} max={2099}
                className="w-full rounded px-3 py-2 text-sm font-mono outline-none"
                style={{ background: "#141428", border: "1px solid #1a3a4a", color: "#e2e8f0" }}
                required />
            </div>
            <div>
              <label className="block text-xs font-mono mb-1.5" style={{ color: "#64748b" }}>Código da DNB</label>
              <input type="text" value={form.dnbId} onChange={e => setForm(f => ({ ...f, dnbId: e.target.value }))}
                placeholder="ID MongoDB da DNB"
                className="w-full rounded px-3 py-2 text-sm font-mono outline-none"
                style={{ background: "#141428", border: "1px solid #1a3a4a", color: "#e2e8f0" }}
                required />
              <p className="text-xs mt-1" style={{ color: "#374151" }}>Cole o ID da DNB (ex: da URL do cadastro)</p>
            </div>
          </div>
          <div className="flex gap-3">
            <button type="submit" disabled={saving}
              className="px-4 py-2 rounded font-mono text-sm font-semibold"
              style={{ background: "#00d4ff20", border: "1px solid #00d4ff40", color: saving ? "#00d4ff60" : "#00d4ff" }}>
              {saving ? "Criando..." : "Criar Inventário"}
            </button>
            <button type="button" onClick={() => setShowForm(false)}
              className="px-4 py-2 rounded font-mono text-sm"
              style={{ color: "#64748b", border: "1px solid #1a3a4a" }}>
              Cancelar
            </button>
          </div>
        </form>
      )}

      {inventarios.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 rounded-lg"
          style={{ background: "#0f0f1a", border: "1px solid #1a3a4a" }}>
          <ClipboardList className="h-12 w-12 mb-4" style={{ color: "#1a3a4a" }} />
          <p className="font-mono text-sm" style={{ color: "#64748b" }}>Nenhum inventário cadastrado</p>
          {canManage && (
            <p className="text-xs mt-2" style={{ color: "#374151" }}>Clique em "Novo Inventário" para começar</p>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          {inventarios.map((inv) => {
            const st = STATUS_STYLE[inv.status] || STATUS_STYLE["Em andamento"];
            const pct = progress(inv);
            const conferidos = inv.registros?.filter(r => r.statusEncontrado !== "Pendente").length || 0;
            const total = inv.registros?.length || 0;
            const naoLoc = inv.registros?.filter(r => r.statusEncontrado === "Não Localizado").length || 0;
            const StatusIcon = st.icon;
            return (
              <div key={inv._id} className="rounded-lg p-5"
                style={{ background: "#0f0f1a", border: "1px solid #1a3a4a" }}>
                <div className="flex items-start justify-between gap-4 flex-wrap">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 flex-wrap">
                      <h3 className="font-mono font-semibold" style={{ color: "#e2e8f0" }}>{inv.nome}</h3>
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-mono"
                        style={{ background: st.bg, color: st.color, border: `1px solid ${st.border}` }}>
                        <StatusIcon className="h-3 w-3" />
                        {inv.status}
                      </span>
                      <span className="text-xs font-mono" style={{ color: "#374151" }}>
                        {inv.ano} — {inv.dnb?.code || "—"}
                      </span>
                    </div>
                    {/* Barra de progresso */}
                    <div className="mt-3">
                      <div className="flex items-center justify-between text-xs font-mono mb-1">
                        <span style={{ color: "#64748b" }}>{conferidos}/{total} conferidos</span>
                        <span style={{ color: pct === 100 ? "#00ff88" : "#00d4ff" }}>{pct}%</span>
                      </div>
                      <div className="h-1.5 rounded-full" style={{ background: "#141428" }}>
                        <div className="h-1.5 rounded-full transition-all"
                          style={{ width: `${pct}%`, background: pct === 100 ? "#00ff88" : "#00d4ff", boxShadow: `0 0 6px ${pct === 100 ? "#00ff8860" : "#00d4ff60"}` }} />
                      </div>
                    </div>
                    {naoLoc > 0 && (
                      <p className="text-xs mt-2 font-mono" style={{ color: "#ff2d55" }}>
                        {naoLoc} bem(ns) não localizado(s)
                      </p>
                    )}
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    {inv.status === "Em andamento" && (
                      <Link href={`/dashboard/inventario/${inv._id}`}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-mono font-semibold"
                        style={{ background: "#00d4ff15", border: "1px solid #00d4ff40", color: "#00d4ff" }}>
                        <ExternalLink className="h-3.5 w-3.5" />
                        Executar
                      </Link>
                    )}
                    {inv.status === "Concluído" && (
                      <Link href={`/dashboard/inventario/${inv._id}`}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-mono"
                        style={{ border: "1px solid #1a3a4a", color: "#64748b" }}>
                        <ExternalLink className="h-3.5 w-3.5" />
                        Ver Relatório
                      </Link>
                    )}
                    {canManage && inv.status === "Em andamento" && (
                      <button onClick={() => handleCancelar(inv._id)}
                        className="px-3 py-1.5 rounded text-xs font-mono"
                        style={{ border: "1px solid #ff2d5540", color: "#ff2d55" }}>
                        Cancelar
                      </button>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-4 mt-3 text-xs font-mono" style={{ color: "#374151" }}>
                  <span>Criado por: {inv.criadoPor?.name || "—"}</span>
                  <span>Início: {new Date(inv.dataInicio).toLocaleDateString("pt-BR")}</span>
                  {inv.dataFim && <span>Fim: {new Date(inv.dataFim).toLocaleDateString("pt-BR")}</span>}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
