"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { getAssetById, updateAsset, searchAssetsByPatrimonio } from "@/lib/actions/assets";
import { getAllDNBs } from "@/lib/actions/dnbs";
import { getCategorias } from "@/lib/actions/categorias";
import { getFabricantes } from "@/lib/actions/fabricantes";
import { getSetores } from "@/lib/actions/setores";
import { getPredios } from "@/lib/actions/predios";
import Link from "next/link";
import { ChevronRight, Save, X, Upload, Trash2, Package, Wifi, Camera } from "lucide-react";
import { CameraCapture } from "@/components/CameraCapture";

const SITUACOES = [
  "Em estoque", "Em uso", "Ativo", "Reserva",
  "Em manutenção", "Com defeito", "Descartado",
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
      onFocus={(e) => { e.target.style.borderColor = "#00d4ff"; e.target.style.boxShadow = "0 0 0 1px #00d4ff"; }}
      onBlur={(e) => { e.target.style.borderColor = "#1a3a4a"; e.target.style.boxShadow = "none"; }}
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
      onFocus={(e) => { e.target.style.borderColor = "#00d4ff"; }}
      onBlur={(e) => { e.target.style.borderColor = "#1a3a4a"; }}
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
      onFocus={(e) => { e.target.style.borderColor = "#00d4ff"; e.target.style.boxShadow = "0 0 0 1px #00d4ff"; }}
      onBlur={(e) => { e.target.style.borderColor = "#1a3a4a"; e.target.style.boxShadow = "none"; }}
      {...props}
    />
  );
}

function SectionTitle({ children }) {
  return (
    <h3
      className="text-xs font-mono uppercase tracking-widest pb-2 mb-4"
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

function PatrimonioSearch({ value, onChange, excludeId }) {
  const [query, setQuery] = useState(value || "");
  const [results, setResults] = useState([]);
  const [open, setOpen] = useState(false);
  const debounceRef = useRef(null);
  const wrapRef = useRef(null);

  useEffect(() => {
    function onClickOutside(e) {
      if (wrapRef.current && !wrapRef.current.contains(e.target)) setOpen(false);
    }
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, []);

  function handleInput(e) {
    const v = e.target.value;
    setQuery(v);
    onChange(v);
    clearTimeout(debounceRef.current);
    if (v.length >= 2) {
      debounceRef.current = setTimeout(async () => {
        const res = await searchAssetsByPatrimonio(v);
        setResults(res.filter((a) => a._id !== excludeId));
        setOpen(true);
      }, 300);
    } else {
      setResults([]);
      setOpen(false);
    }
  }

  function select(asset) {
    setQuery(asset.patrimonio);
    onChange(asset.patrimonio);
    setOpen(false);
    setResults([]);
  }

  return (
    <div className="relative" ref={wrapRef}>
      <input
        className={inputClass} style={inputStyle}
        placeholder="Patrimônio do ativo pai (opcional)"
        value={query}
        onChange={handleInput}
        onFocus={(e) => { e.target.style.borderColor = "#00d4ff"; e.target.style.boxShadow = "0 0 0 1px #00d4ff"; if (results.length > 0) setOpen(true); }}
        onBlur={(e) => { e.target.style.borderColor = "#1a3a4a"; e.target.style.boxShadow = "none"; }}
        autoComplete="off"
      />
      {open && results.length > 0 && (
        <div className="absolute z-20 w-full top-full mt-1 rounded overflow-hidden shadow-lg" style={{ background: "#0f0f1a", border: "1px solid #1a3a4a" }}>
          {results.map((a) => (
            <button key={a._id} type="button" onClick={() => select(a)}
              className="w-full px-3 py-2.5 text-left text-sm font-mono flex items-center justify-between transition-all"
              style={{ color: "#e2e8f0", borderBottom: "1px solid #1a3a4a20" }}
              onMouseEnter={(e) => { e.currentTarget.style.background = "#00d4ff10"; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; }}
            >
              <span style={{ color: "#00d4ff" }}>{a.patrimonio}</span>
              <span className="text-xs" style={{ color: "#64748b" }}>{a.categoria?.nome || ""} {a.subtipo}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export default function EditAssetPage({ params }) {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [dnbs, setDnbs] = useState([]);
  const [categorias, setCategorias] = useState([]);
  const [fabricantes, setFabricantes] = useState([]);
  const [predios, setPredios] = useState([]);
  const [setores, setSetores] = useState([]);
  const [selectedPredio, setSelectedPredio] = useState("");
  const [imagemUrl, setImagemUrl] = useState("");
  const [uploadingImage, setUploadingImage] = useState(false);
  const [imageError, setImageError] = useState("");
  const [showRede, setShowRede] = useState(false);
  const [showCamera, setShowCamera] = useState(false);
  const fileInputRef = useRef(null);

  const [formData, setFormData] = useState({
    categoria: "",
    subtipo: "",
    fabricante: "",
    usuarioResponsavel: "",
    funcaoPerfil: "",
    setor: "",
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

  useEffect(() => {
    async function load() {
      try {
        const [asset, dnbsData, categoriasData, fabricantesData, prediosData, setoresData] = await Promise.all([
          getAssetById(params.id),
          getAllDNBs(),
          getCategorias().catch(() => []),
          getFabricantes().catch(() => []),
          getPredios().catch(() => []),
          getSetores().catch(() => []),
        ]);
        setDnbs(dnbsData);
        setCategorias(categoriasData);
        setFabricantes(fabricantesData);
        setPredios(prediosData);
        setSetores(setoresData);
        setImagemUrl(asset.imagemUrl || "");
        setShowRede(!!(asset.hostname || asset.enderecoIp || asset.sistemaOperacional || asset.ipGerencia || asset.redeVlan || asset.portasConexoes));
        const predioId = asset.setor?.predio?._id || asset.setor?.predio || "";
        setSelectedPredio(predioId);
        setFormData({
          categoria: asset.categoria?._id || asset.categoria || "",
          subtipo: asset.subtipo || "",
          fabricante: asset.fabricante || "",
          usuarioResponsavel: asset.usuarioResponsavel || "",
          funcaoPerfil: asset.funcaoPerfil || "",
          setor: asset.setor?._id || asset.setor || "",
          dnb: asset.dnb?._id || "",
          patrimonio: asset.patrimonio || "",
          numeroSerie: asset.numeroSerie || "",
          hostname: asset.hostname || "",
          enderecoIp: asset.enderecoIp || "",
          sistemaOperacional: asset.sistemaOperacional || "",
          ipGerencia: asset.ipGerencia || "",
          redeVlan: asset.redeVlan || "",
          portasConexoes: asset.portasConexoes || "",
          quantidade: asset.quantidade?.toString() || "1",
          situacao: asset.situacao || "Em estoque",
          observacoes: asset.observacoes || "",
          vinculadoA: asset.vinculadoA?._id || asset.vinculadoA || "",
        });
      } catch (err) {
        setError("Erro ao carregar ativo");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [params.id]);

  function handleChange(field, value) {
    setFormData((prev) => ({ ...prev, [field]: value }));
  }

  async function handleCameraCapture(file) {
    setShowCamera(false);
    await uploadImage(file);
  }

  async function handleImageUpload(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    await uploadImage(file);
  }

  async function uploadImage(file) {
    setImageError("");
    setUploadingImage(true);
    try {
      const form = new FormData();
      form.append("image", file);
      form.append("assetId", params.id);
      const res = await fetch("/api/assets/image-upload", { method: "POST", body: form });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Erro no upload");
      setImagemUrl(data.url);
    } catch (err) {
      setImageError(err.message);
    } finally {
      setUploadingImage(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      const payload = { ...formData };
      if (!payload.vinculadoA) delete payload.vinculadoA;
      if (!payload.setor) delete payload.setor;
      if (!showRede) {
        payload.hostname = "";
        payload.enderecoIp = "";
        payload.sistemaOperacional = "";
        payload.ipGerencia = "";
        payload.redeVlan = "";
        payload.portasConexoes = "";
      }
      await updateAsset(params.id, payload);
      router.push(`/dashboard/assets/${params.id}`);
    } catch (err) {
      setError(err.message || "Erro ao atualizar ativo");
      setSubmitting(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-48">
        <p className="font-mono" style={{ color: "#64748b" }}>Carregando...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-4xl">
      {showCamera && (
        <CameraCapture onCapture={handleCameraCapture} onClose={() => setShowCamera(false)} />
      )}

      {/* Breadcrumb */}
      <div className="flex items-center gap-1 text-xs font-mono" style={{ color: "#64748b" }}>
        <Link href="/dashboard" style={{ color: "#64748b" }}>Dashboard</Link>
        <ChevronRight className="h-3 w-3" />
        <Link href="/dashboard/assets" style={{ color: "#64748b" }}>Ativos</Link>
        <ChevronRight className="h-3 w-3" />
        <Link href={`/dashboard/assets/${params.id}`} style={{ color: "#64748b" }}>{formData.patrimonio}</Link>
        <ChevronRight className="h-3 w-3" />
        <span style={{ color: "#00d4ff" }}>Editar</span>
      </div>

      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold font-mono" style={{ color: "#e2e8f0" }}>
          Editar Ativo
        </h1>
        <Link
          href={`/dashboard/assets/${params.id}`}
          className="flex items-center gap-2 px-3 py-2 rounded text-sm font-mono transition-all"
          style={{ background: "#141428", border: "1px solid #1a3a4a", color: "#64748b" }}
        >
          <X className="h-4 w-4" />
          Cancelar
        </Link>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Informações Básicas */}
        <div className="rounded-lg p-5" style={{ background: "#0f0f1a", border: "1px solid #1a3a4a" }}>
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
                value={formData.patrimonio}
                onChange={(e) => handleChange("patrimonio", e.target.value)}
                required
              />
            </div>

            <div>
              <CyberLabel htmlFor="numeroSerie">Número de Série</CyberLabel>
              <CyberInput
                id="numeroSerie"
                placeholder="S/N do equipamento"
                value={formData.numeroSerie}
                onChange={(e) => handleChange("numeroSerie", e.target.value)}
              />
            </div>

            <div className="md:col-span-2">
              <CyberLabel>Vinculado a (Ativo Pai)</CyberLabel>
              <PatrimonioSearch
                value={formData.vinculadoA}
                onChange={(v) => handleChange("vinculadoA", v)}
                excludeId={params.id}
              />
            </div>
          </div>
        </div>

        {/* Localização */}
        <div className="rounded-lg p-5" style={{ background: "#0f0f1a", border: "1px solid #1a3a4a" }}>
          <SectionTitle>Localização</SectionTitle>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <CyberLabel htmlFor="dnb">DNB / Localidade *</CyberLabel>
              <CyberSelect
                id="dnb"
                value={formData.dnb}
                onChange={(e) => { handleChange("dnb", e.target.value); setSelectedPredio(""); handleChange("setor", ""); }}
                required
              >
                <option value="">Selecione</option>
                {dnbs.map((dnb) => (
                  <option key={dnb._id} value={dnb._id}>{dnb.code} — {dnb.name}</option>
                ))}
              </CyberSelect>
            </div>

            <div>
              <CyberLabel htmlFor="predio">Prédio</CyberLabel>
              <CyberSelect
                id="predio"
                value={selectedPredio}
                onChange={(e) => { setSelectedPredio(e.target.value); handleChange("setor", ""); }}
                disabled={!formData.dnb}
              >
                <option value="">Selecione</option>
                {predios.filter((p) => p.dnb?._id === formData.dnb || p.dnb === formData.dnb).map((p) => (
                  <option key={p._id} value={p._id}>{p.nome}</option>
                ))}
              </CyberSelect>
            </div>

            <div>
              <CyberLabel htmlFor="setor">Setor / Sala</CyberLabel>
              <CyberSelect
                id="setor"
                value={formData.setor}
                onChange={(e) => handleChange("setor", e.target.value)}
                disabled={!selectedPredio}
              >
                <option value="">Selecione</option>
                {setores.filter((s) => s.predio?._id === selectedPredio || s.predio === selectedPredio).map((s) => (
                  <option key={s._id} value={s._id}>{s.nome}</option>
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

        {/* Toggle de rede */}
        <div className="rounded-lg p-5" style={{ background: "#0f0f1a", border: "1px solid #1a3a4a" }}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Wifi className="h-4 w-4" style={{ color: showRede ? "#00d4ff" : "#1a3a4a" }} />
              <div>
                <p className="text-sm font-mono font-semibold" style={{ color: "#e2e8f0" }}>Ativo de Rede</p>
                <p className="text-xs" style={{ color: "#64748b" }}>Possui hostname, IP, VLAN, SO</p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setShowRede((v) => !v)}
              className="relative w-11 h-6 rounded-full transition-all flex-shrink-0"
              style={{ background: showRede ? "#00d4ff" : "#1a3a4a" }}
            >
              <div
                className="absolute top-1 w-4 h-4 rounded-full bg-white transition-all"
                style={{ left: showRede ? "23px" : "2px" }}
              />
            </button>
          </div>

          {showRede && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-5 pt-4" style={{ borderTop: "1px solid #1a3a4a" }}>
              <div>
                <CyberLabel htmlFor="hostname">Hostname</CyberLabel>
                <CyberInput id="hostname" placeholder="Nome na rede" value={formData.hostname}
                  onChange={(e) => handleChange("hostname", e.target.value)} />
              </div>
              <div>
                <CyberLabel htmlFor="sistemaOperacional">Sistema Operacional / Firmware</CyberLabel>
                <CyberInput id="sistemaOperacional" placeholder="Ex: Windows 11, Linux" value={formData.sistemaOperacional}
                  onChange={(e) => handleChange("sistemaOperacional", e.target.value)} />
              </div>
              <div>
                <CyberLabel htmlFor="enderecoIp">Endereço IP</CyberLabel>
                <CyberInput id="enderecoIp" placeholder="Ex: 192.168.1.100" value={formData.enderecoIp}
                  onChange={(e) => handleChange("enderecoIp", e.target.value)} />
              </div>
              <div>
                <CyberLabel htmlFor="ipGerencia">IP de Gerência</CyberLabel>
                <CyberInput id="ipGerencia" placeholder="IP de gerenciamento" value={formData.ipGerencia}
                  onChange={(e) => handleChange("ipGerencia", e.target.value)} />
              </div>
              <div>
                <CyberLabel htmlFor="redeVlan">Rede / VLAN</CyberLabel>
                <CyberSelect id="redeVlan" value={formData.redeVlan}
                  onChange={(e) => handleChange("redeVlan", e.target.value)}>
                  <option value="">Selecione</option>
                  <option value="Operacional">Operacional</option>
                  <option value="Administrativa">Administrativa</option>
                  <option value="N/A">N/A</option>
                </CyberSelect>
              </div>
              <div>
                <CyberLabel htmlFor="portasConexoes">Portas / Conexões</CyberLabel>
                <CyberInput id="portasConexoes" placeholder="Ex: Porta 1, Uplink" value={formData.portasConexoes}
                  onChange={(e) => handleChange("portasConexoes", e.target.value)} />
              </div>
            </div>
          )}
        </div>

        {/* Status */}
        <div className="rounded-lg p-5" style={{ background: "#0f0f1a", border: "1px solid #1a3a4a" }}>
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

          <div className="mt-4">
            <CyberLabel htmlFor="observacoes">Observações</CyberLabel>
            <CyberTextarea
              id="observacoes"
              placeholder="Informações adicionais..."
              value={formData.observacoes}
              onChange={(e) => handleChange("observacoes", e.target.value)}
              rows={4}
            />
          </div>
        </div>

        {/* Foto */}
        <div className="rounded-lg p-5" style={{ background: "#0f0f1a", border: "1px solid #1a3a4a" }}>
          <SectionTitle>Foto do Ativo</SectionTitle>
          <div className="flex items-start gap-5">
            <div
              className="w-32 h-32 rounded-lg flex items-center justify-center flex-shrink-0 overflow-hidden"
              style={{ background: "#141428", border: "1px solid #1a3a4a" }}
            >
              {imagemUrl ? (
                <img src={imagemUrl} alt="Foto do ativo" loading="lazy" className="w-full h-full object-cover" />
              ) : (
                <Package className="h-10 w-10" style={{ color: "#1a3a4a" }} />
              )}
            </div>
            <div className="flex flex-col gap-3">
              <p className="text-xs font-mono" style={{ color: "#64748b" }}>
                JPEG, PNG ou WebP · máx. 10MB
              </p>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                onChange={handleImageUpload}
                className="hidden"
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploadingImage}
                className="flex items-center gap-2 px-4 py-2 rounded font-mono text-sm font-semibold transition-all"
                style={{
                  background: "#00d4ff15",
                  border: "1px solid #00d4ff40",
                  color: uploadingImage ? "#00d4ff60" : "#00d4ff",
                  cursor: uploadingImage ? "not-allowed" : "pointer",
                }}
              >
                <Upload className="h-4 w-4" />
                {uploadingImage ? "Enviando..." : imagemUrl ? "Trocar arquivo" : "Enviar arquivo"}
              </button>
              <button
                type="button"
                onClick={() => setShowCamera(true)}
                disabled={uploadingImage}
                className="flex items-center gap-2 px-4 py-2 rounded font-mono text-sm font-semibold transition-all"
                style={{
                  background: "#00d4ff15",
                  border: "1px solid #00d4ff40",
                  color: uploadingImage ? "#00d4ff60" : "#00d4ff",
                  cursor: uploadingImage ? "not-allowed" : "pointer",
                }}
              >
                <Camera className="h-4 w-4" />
                {uploadingImage ? "Enviando..." : "Tirar foto"}
              </button>
              {imagemUrl && (
                <button
                  type="button"
                  onClick={() => setImagemUrl("")}
                  className="flex items-center gap-2 px-4 py-2 rounded font-mono text-sm transition-all"
                  style={{ background: "#ff2d5510", border: "1px solid #ff2d5540", color: "#ff2d55" }}
                >
                  <Trash2 className="h-4 w-4" />
                  Remover foto
                </button>
              )}
              {imageError && (
                <p className="text-xs font-mono" style={{ color: "#ff2d55" }}>{imageError}</p>
              )}
            </div>
          </div>
        </div>

        {error && (
          <div
            className="text-sm px-4 py-3 rounded"
            style={{ background: "#ff2d5510", border: "1px solid #ff2d5540", color: "#ff2d55" }}
          >
            {error}
          </div>
        )}

        {/* Ações */}
        <div className="flex justify-end gap-3 pb-6">
          <Link
            href={`/dashboard/assets/${params.id}`}
            className="flex items-center gap-2 px-5 py-2.5 rounded font-mono text-sm font-semibold transition-all"
            style={{ background: "#141428", border: "1px solid #1a3a4a", color: "#64748b" }}
          >
            Cancelar
          </Link>
          <button
            type="submit"
            disabled={submitting}
            className="flex items-center gap-2 px-5 py-2.5 rounded font-mono text-sm font-semibold transition-all"
            style={{
              background: submitting ? "#00d4ff60" : "#00d4ff",
              color: "#0a0a0f",
              cursor: submitting ? "not-allowed" : "pointer",
              boxShadow: submitting ? "none" : "0 0 10px rgba(0,212,255,0.3)",
            }}
          >
            <Save className="h-4 w-4" />
            {submitting ? "Salvando..." : "Salvar Alterações"}
          </button>
        </div>
      </form>
    </div>
  );
}
