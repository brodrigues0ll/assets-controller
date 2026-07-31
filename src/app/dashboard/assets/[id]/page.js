import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { redirect, notFound } from 'next/navigation';
import { getAssetById } from '@/lib/actions/assets';
import Link from 'next/link';
import {
  ChevronRight,
  Edit,
  Zap,
  Package,
  MapPin,
  Monitor,
  Wifi,
  FileText,
  Clock,
  Image as ImageIcon,
  Link2,
} from 'lucide-react';

function getSituacaoStyle(situacao) {
  const styles = {
    'Ativo':         { bg: '#00ff8820', color: '#00ff88', border: '#00ff8840' },
    'Em uso':        { bg: '#00ff8820', color: '#00ff88', border: '#00ff8840' },
    'Em estoque':    { bg: '#00d4ff20', color: '#00d4ff', border: '#00d4ff40' },
    'Com defeito':   { bg: '#ff2d5520', color: '#ff2d55', border: '#ff2d5540' },
    'Em manutenção': { bg: '#fbbf2420', color: '#fbbf24', border: '#fbbf2440' },
    'Reserva':       { bg: '#a855f720', color: '#a855f7', border: '#a855f740' },
    'Descartado':    { bg: '#6b728020', color: '#6b7280', border: '#6b728040' },
  };
  return styles[situacao] || styles['Descartado'];
}

function InfoRow({ label, value }) {
  if (!value) return null;
  return (
    <div
      className="flex items-start gap-4 py-2"
      style={{ borderBottom: '1px solid #1a3a4a20' }}
    >
      <span
        className="text-xs font-mono uppercase tracking-wider w-36 flex-shrink-0 pt-0.5"
        style={{ color: '#64748b' }}
      >
        {label}
      </span>
      <span className="text-sm flex-1" style={{ color: '#e2e8f0' }}>
        {value}
      </span>
    </div>
  );
}

function Section({ title, icon: Icon, children }) {
  return (
    <div
      className="rounded-lg p-5"
      style={{ background: '#0f0f1a', border: '1px solid #1a3a4a' }}
    >
      <div
        className="flex items-center gap-2 mb-4 pb-3"
        style={{ borderBottom: '1px solid #1a3a4a' }}
      >
        <Icon className="h-4 w-4" style={{ color: '#00d4ff' }} />
        <h3
          className="text-xs font-mono uppercase tracking-widest"
          style={{ color: '#00d4ff' }}
        >
          {title}
        </h3>
      </div>
      <div className="space-y-0.5">{children}</div>
    </div>
  );
}

export default async function AssetDetailPage({ params }) {
  const session = await getServerSession(authOptions);
  if (!session) redirect('/login');

  let asset;
  try {
    asset = await getAssetById(params.id);
  } catch (err) {
    notFound();
  }

  const canEdit =
    session.user.role === 'gestor' || session.user.role === 'administrador';
  const situacaoStyle = getSituacaoStyle(asset.situacao);

  const formatDate = (date) => {
    if (!date) return null;
    try {
      return new Date(date).toLocaleString('pt-BR');
    } catch {
      return null;
    }
  };

  return (
    <div className="space-y-6">
      {/* Breadcrumb */}
      <div className="flex items-center gap-1 text-xs font-mono" style={{ color: '#64748b' }}>
        <Link href="/dashboard" className="hover:text-cyber-cyan transition-colors" style={{ color: '#64748b' }}>
          Dashboard
        </Link>
        <ChevronRight className="h-3 w-3" />
        <Link href="/dashboard/assets" style={{ color: '#64748b' }}>
          Ativos
        </Link>
        <ChevronRight className="h-3 w-3" />
        <span style={{ color: '#00d4ff' }}>{asset.patrimonio}</span>
      </div>

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-start gap-4 justify-between">
        <div className="flex items-start gap-4">
          {/* Image */}
          <div
            className="w-20 h-20 rounded-lg flex items-center justify-center flex-shrink-0"
            style={{
              background: '#141428',
              border: '1px solid #1a3a4a',
              overflow: 'hidden',
            }}
          >
            {asset.imagemUrl ? (
              <img
                src={asset.imagemUrl}
                alt={asset.patrimonio}
                className="w-full h-full object-cover"
              />
            ) : (
              <Package className="h-8 w-8" style={{ color: '#1a3a4a' }} />
            )}
          </div>
          <div>
            <h1
              className="text-2xl font-bold font-mono"
              style={{ color: '#e2e8f0' }}
            >
              {asset.patrimonio}
            </h1>
            <p className="text-sm mt-0.5" style={{ color: '#64748b' }}>
              {asset.tipoEquipamento} — {asset.subtipo}
            </p>
            <div className="mt-2">
              <span
                className="inline-flex items-center px-3 py-1 rounded-full text-xs font-mono font-semibold"
                style={{
                  background: situacaoStyle.bg,
                  color: situacaoStyle.color,
                  border: `1px solid ${situacaoStyle.border}`,
                }}
              >
                {asset.situacao}
              </span>
            </div>
          </div>
        </div>
        <div className="flex gap-2 flex-shrink-0">
          <Link
            href={`/dashboard/assets/${asset._id}/quick-edit`}
            className="flex items-center gap-2 px-4 py-2 rounded text-sm font-mono font-semibold transition-all"
            style={{
              background: '#00d4ff15',
              border: '1px solid #00d4ff40',
              color: '#00d4ff',
            }}
          >
            <Zap className="h-4 w-4" />
            Edição Rápida
          </Link>
          {canEdit && (
            <Link
              href="/dashboard/assets"
              className="flex items-center gap-2 px-4 py-2 rounded text-sm font-mono font-semibold transition-all"
              style={{
                background: '#00d4ff',
                color: '#0a0a0f',
                boxShadow: '0 0 10px rgba(0,212,255,0.3)',
              }}
            >
              <Edit className="h-4 w-4" />
              Editar
            </Link>
          )}
        </div>
      </div>

      {/* Grid de seções */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Section title="Informações Básicas" icon={Package}>
          <InfoRow label="Patrimônio" value={asset.patrimonio} />
          <InfoRow label="Tipo" value={asset.tipoEquipamento} />
          <InfoRow label="Subtipo / Modelo" value={asset.subtipo} />
          <InfoRow label="Fabricante" value={asset.fabricante} />
          <InfoRow label="Quantidade" value={asset.quantidade?.toString()} />
          <InfoRow label="Situação" value={asset.situacao} />
        </Section>

        <Section title="Localização" icon={MapPin}>
          <InfoRow
            label="DNB"
            value={asset.dnb ? `${asset.dnb.code} — ${asset.dnb.name}` : null}
          />
          <InfoRow label="Setor" value={asset.localizacaoSetor} />
          <InfoRow label="Responsável" value={asset.usuarioResponsavel} />
          <InfoRow label="Função / Perfil" value={asset.funcaoPerfil} />
        </Section>

        <Section title="Identificação" icon={Monitor}>
          <InfoRow label="Número de Série" value={asset.numeroSerie} />
          <InfoRow label="Hostname" value={asset.hostname} />
          <InfoRow label="Sistema Operacional" value={asset.sistemaOperacional} />
        </Section>

        {(asset.enderecoIp || asset.ipGerencia || asset.redeVlan || asset.portasConexoes) && (
          <Section title="Configuração de Rede" icon={Wifi}>
            <InfoRow label="Endereço IP" value={asset.enderecoIp} />
            <InfoRow label="IP de Gerência" value={asset.ipGerencia} />
            <InfoRow label="Rede / VLAN" value={asset.redeVlan} />
            <InfoRow label="Portas / Conexões" value={asset.portasConexoes} />
          </Section>
        )}

        {asset.vinculadoA && (
          <Section title="Ativo Vinculado" icon={Link2}>
            <InfoRow
              label="Vinculado a"
              value={
                typeof asset.vinculadoA === 'object'
                  ? asset.vinculadoA.patrimonio
                  : asset.vinculadoA
              }
            />
          </Section>
        )}
      </div>

      {/* Observações */}
      {asset.observacoes && (
        <div
          className="rounded-lg p-5"
          style={{ background: '#0f0f1a', border: '1px solid #1a3a4a' }}
        >
          <div
            className="flex items-center gap-2 mb-3 pb-2"
            style={{ borderBottom: '1px solid #1a3a4a' }}
          >
            <FileText className="h-4 w-4" style={{ color: '#00d4ff' }} />
            <h3
              className="text-xs font-mono uppercase tracking-widest"
              style={{ color: '#00d4ff' }}
            >
              Observações
            </h3>
          </div>
          <p
            className="text-sm whitespace-pre-wrap font-mono"
            style={{ color: '#94a3b8' }}
          >
            {asset.observacoes}
          </p>
        </div>
      )}

      {/* Auditoria */}
      <div
        className="rounded-lg p-5"
        style={{ background: '#0f0f1a', border: '1px solid #1a3a4a' }}
      >
        <div
          className="flex items-center gap-2 mb-4 pb-3"
          style={{ borderBottom: '1px solid #1a3a4a' }}
        >
          <Clock className="h-4 w-4" style={{ color: '#00d4ff' }} />
          <h3
            className="text-xs font-mono uppercase tracking-widest"
            style={{ color: '#00d4ff' }}
          >
            Auditoria
          </h3>
        </div>
        <div className="space-y-0.5">
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
        <div className="mt-4 pt-3" style={{ borderTop: '1px solid #1a3a4a20' }}>
          <p className="text-xs font-mono" style={{ color: '#1a3a4a' }}>
            ASSET_ID: <span style={{ color: '#64748b' }}>{asset.assetId}</span>
          </p>
        </div>
      </div>
    </div>
  );
}
