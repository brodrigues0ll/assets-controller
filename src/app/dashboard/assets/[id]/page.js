import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { redirect, notFound } from 'next/navigation';
import { getAssetById } from '@/lib/actions/assets';
import Link from 'next/link';
import {
  ChevronRight, Edit, Zap, Package, MapPin, Monitor,
  Wifi, FileText, Clock, Link2, ShieldCheck, User,
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

function getSituacaoOpStyle(situacao) {
  const styles = {
    'Em uso':         { bg: '#00ff8820', color: '#00ff88', border: '#00ff8840' },
    'Inservível':     { bg: '#ff2d5520', color: '#ff2d55', border: '#ff2d5540' },
    'Não Localizado': { bg: '#6b728020', color: '#6b7280', border: '#6b728040' },
    'Outros':         { bg: '#fbbf2420', color: '#fbbf24', border: '#fbbf2440' },
  };
  return styles[situacao] || { bg: '#6b728020', color: '#6b7280', border: '#6b728040' };
}

function InfoRow({ label, value }) {
  if (value === null || value === undefined || value === '') return null;
  return (
    <div className="flex items-start gap-4 py-2" style={{ borderBottom: '1px solid #1a3a4a20' }}>
      <span className="text-xs font-mono uppercase tracking-wider w-40 flex-shrink-0 pt-0.5" style={{ color: '#64748b' }}>
        {label}
      </span>
      <span className="text-sm flex-1" style={{ color: '#e2e8f0' }}>{value}</span>
    </div>
  );
}

function BadgeRow({ label, value, bg, color, border }) {
  if (!value) return null;
  return (
    <div className="flex items-start gap-4 py-2" style={{ borderBottom: '1px solid #1a3a4a20' }}>
      <span className="text-xs font-mono uppercase tracking-wider w-40 flex-shrink-0 pt-0.5" style={{ color: '#64748b' }}>
        {label}
      </span>
      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-mono"
        style={{ background: bg, color, border: `1px solid ${border}` }}>
        {value}
      </span>
    </div>
  );
}

function BoolRow({ label, trueLabel, falseLabel, value }) {
  if (value === null || value === undefined) return null;
  const isTrue = value === true;
  return (
    <div className="flex items-start gap-4 py-2" style={{ borderBottom: '1px solid #1a3a4a20' }}>
      <span className="text-xs font-mono uppercase tracking-wider w-40 flex-shrink-0 pt-0.5" style={{ color: '#64748b' }}>
        {label}
      </span>
      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-mono"
        style={isTrue
          ? { background: '#00ff8820', color: '#00ff88', border: '1px solid #00ff8840' }
          : { background: '#ff2d5520', color: '#ff2d55', border: '1px solid #ff2d5540' }}>
        {isTrue ? trueLabel : falseLabel}
      </span>
    </div>
  );
}

function Section({ title, icon: Icon, children }) {
  return (
    <div className="rounded-lg p-5" style={{ background: '#0f0f1a', border: '1px solid #1a3a4a' }}>
      <div className="flex items-center gap-2 mb-4 pb-3" style={{ borderBottom: '1px solid #1a3a4a' }}>
        <Icon className="h-4 w-4" style={{ color: '#00d4ff' }} />
        <h3 className="text-xs font-mono uppercase tracking-widest" style={{ color: '#00d4ff' }}>
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
  } catch {
    notFound();
  }

  const canEdit = session.user.role === 'gestor' || session.user.role === 'administrador';
  const situacaoStyle = getSituacaoStyle(asset.situacao);
  const situacaoOpStyle = asset.situacaoOperacional
    ? getSituacaoOpStyle(asset.situacaoOperacional)
    : null;

  const formatDate = (date) => {
    if (!date) return null;
    try { return new Date(date).toLocaleString('pt-BR'); } catch { return null; }
  };

  const hasPatrimonial = asset.situacaoBem || asset.situacaoOperacional ||
    asset.condicoesUso !== undefined || asset.statusLocalizacao ||
    asset.classificacaoInservivel;

  const hasDetentor = asset.detentorNome || asset.detentorMatricula;
  const hasRede = asset.enderecoIp || asset.ipGerencia || asset.redeVlan || asset.portasConexoes;

  return (
    <div className="space-y-6">
      {/* Breadcrumb */}
      <div className="flex items-center gap-1 text-xs font-mono" style={{ color: '#64748b' }}>
        <Link href="/dashboard" style={{ color: '#64748b' }}>Dashboard</Link>
        <ChevronRight className="h-3 w-3" />
        <Link href="/dashboard/assets" style={{ color: '#64748b' }}>Ativos</Link>
        <ChevronRight className="h-3 w-3" />
        <span style={{ color: '#00d4ff' }}>{asset.patrimonio}</span>
      </div>

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-start gap-4 justify-between">
        <div className="flex items-start gap-4">
          <div className="w-20 h-20 rounded-lg flex items-center justify-center flex-shrink-0"
            style={{ background: '#141428', border: '1px solid #1a3a4a', overflow: 'hidden' }}>
            {asset.imagemUrl
              ? <img src={asset.imagemUrl} alt={asset.patrimonio} loading="lazy" className="w-full h-full object-cover" />
              : <Package className="h-8 w-8" style={{ color: '#1a3a4a' }} />}
          </div>
          <div>
            <h1 className="text-2xl font-bold font-mono" style={{ color: '#e2e8f0' }}>
              {asset.patrimonio}
            </h1>
            {asset.tipoEquipamento && (
              <p className="text-sm mt-0.5 font-mono" style={{ color: '#94a3b8' }}>
                {asset.tipoEquipamento}
              </p>
            )}
            <p className="text-sm mt-0.5" style={{ color: '#64748b' }}>
              {asset.categoria?.nome} {asset.subtipo ? `— ${asset.subtipo}` : ''}
            </p>
            <div className="flex flex-wrap gap-2 mt-2">
              <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-mono font-semibold"
                style={{ background: situacaoStyle.bg, color: situacaoStyle.color, border: `1px solid ${situacaoStyle.border}` }}>
                TI: {asset.situacao}
              </span>
              {situacaoOpStyle && (
                <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-mono font-semibold"
                  style={{ background: situacaoOpStyle.bg, color: situacaoOpStyle.color, border: `1px solid ${situacaoOpStyle.border}` }}>
                  {asset.situacaoOperacional}
                </span>
              )}
              {asset.statusLocalizacao === 'Não Localizado' && (
                <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-mono font-semibold"
                  style={{ background: '#ff2d5520', color: '#ff2d55', border: '1px solid #ff2d5540' }}>
                  Não Localizado
                </span>
              )}
            </div>
          </div>
        </div>
        <div className="flex gap-2 flex-shrink-0">
          <Link href={`/dashboard/assets/${asset._id}/quick-edit`}
            className="flex items-center gap-2 px-4 py-2 rounded text-sm font-mono font-semibold transition-all"
            style={{ background: '#00d4ff15', border: '1px solid #00d4ff40', color: '#00d4ff' }}>
            <Zap className="h-4 w-4" />
            Edição Rápida
          </Link>
          {canEdit && (
            <Link href={`/dashboard/assets/${asset._id}/edit`}
              className="flex items-center gap-2 px-4 py-2 rounded text-sm font-mono font-semibold transition-all"
              style={{ background: '#00d4ff', color: '#0a0a0f', boxShadow: '0 0 10px rgba(0,212,255,0.3)' }}>
              <Edit className="h-4 w-4" />
              Editar
            </Link>
          )}
        </div>
      </div>

      {/* Grid principal */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">

        {/* Identificação do Bem */}
        <Section title="Identificação do Bem" icon={Package}>
          <InfoRow label="Patrimônio / Plaqueta" value={asset.patrimonio} />
          <InfoRow label="Ativo nº (SAP)" value={asset.ativoSAP} />
          <InfoRow label="Plaqueta NAV" value={asset.plaquetaNAV} />
          <InfoRow label="Denominação" value={asset.tipoEquipamento} />
          <InfoRow label="Categoria / Tipo" value={asset.categoria?.nome} />
          <InfoRow label="Modelo" value={asset.subtipo} />
          <InfoRow label="Fabricante" value={asset.fabricante} />
          <InfoRow label="Número de Série" value={asset.numeroSerie} />
          <InfoRow label="Quantidade" value={asset.quantidade?.toString()} />
        </Section>

        {/* Localização */}
        <Section title="Localização" icon={MapPin}>
          <InfoRow label="DNB" value={asset.dnb ? `${asset.dnb.code} — ${asset.dnb.name}` : null} />
          <InfoRow label="Prédio" value={asset.setor?.predio?.nome || null} />
          <InfoRow label="Setor / Sala" value={asset.setor?.nome || asset.localizacaoSetor || null} />
        </Section>

        {/* Situação Patrimonial */}
        {hasPatrimonial && (
          <Section title="Situação Patrimonial" icon={ShieldCheck}>
            <BadgeRow label="Situação do Bem" value={asset.situacaoBem}
              bg="#00d4ff20" color="#00d4ff" border="#00d4ff40" />
            {situacaoOpStyle && (
              <BadgeRow label="Situação Operacional" value={asset.situacaoOperacional}
                bg={situacaoOpStyle.bg} color={situacaoOpStyle.color} border={situacaoOpStyle.border} />
            )}
            {asset.classificacaoInservivel && (
              <BadgeRow label="Classificação" value={asset.classificacaoInservivel}
                bg="#ff2d5510" color="#ff2d55" border="#ff2d5540" />
            )}
            <BadgeRow label="Localização" value={asset.statusLocalizacao}
              bg={asset.statusLocalizacao === 'Localizado' ? '#00ff8820' : '#ff2d5520'}
              color={asset.statusLocalizacao === 'Localizado' ? '#00ff88' : '#ff2d55'}
              border={asset.statusLocalizacao === 'Localizado' ? '#00ff8840' : '#ff2d5540'} />
            <BoolRow label="Condições de Uso"
              trueLabel="Em condições de uso" falseLabel="Sem condições de uso"
              value={asset.condicoesUso} />
            <BoolRow label="Descrição"
              trueLabel="Completa" falseLabel="Incompleta"
              value={asset.descricaoCompleta} />
          </Section>
        )}

        {/* Detentor Patrimonial */}
        {hasDetentor && (
          <Section title="Detentor Patrimonial" icon={User}>
            <InfoRow label="Detentor" value={asset.detentorNome} />
            <InfoRow label="Matrícula" value={asset.detentorMatricula} />
          </Section>
        )}

        {/* Uso Operacional */}
        {(asset.usuarioResponsavel || asset.funcaoPerfil) && (
          <Section title="Uso Operacional" icon={Monitor}>
            <InfoRow label="Usuário Responsável" value={asset.usuarioResponsavel} />
            <InfoRow label="Função / Perfil" value={asset.funcaoPerfil} />
            <InfoRow label="Hostname" value={asset.hostname} />
            <InfoRow label="Sistema Operacional" value={asset.sistemaOperacional} />
          </Section>
        )}

        {/* Rede */}
        {hasRede && (
          <Section title="Configuração de Rede" icon={Wifi}>
            <InfoRow label="Endereço IP" value={asset.enderecoIp} />
            <InfoRow label="IP de Gerência" value={asset.ipGerencia} />
            <InfoRow label="Rede / VLAN" value={asset.redeVlan} />
            <InfoRow label="Portas / Conexões" value={asset.portasConexoes} />
          </Section>
        )}

        {/* Situação (TI) */}
        <Section title="Situação (TI)" icon={Monitor}>
          <BadgeRow label="Situação Interna" value={asset.situacao}
            bg={situacaoStyle.bg} color={situacaoStyle.color} border={situacaoStyle.border} />
          <InfoRow label="Quantidade" value={asset.quantidade?.toString()} />
        </Section>

        {/* Vinculado */}
        {asset.vinculadoA && (
          <Section title="Ativo Vinculado" icon={Link2}>
            <InfoRow label="Vinculado a"
              value={typeof asset.vinculadoA === 'object' ? asset.vinculadoA.patrimonio : asset.vinculadoA} />
          </Section>
        )}
      </div>

      {/* Observações */}
      {asset.observacoes && (
        <div className="rounded-lg p-5" style={{ background: '#0f0f1a', border: '1px solid #1a3a4a' }}>
          <div className="flex items-center gap-2 mb-3 pb-2" style={{ borderBottom: '1px solid #1a3a4a' }}>
            <FileText className="h-4 w-4" style={{ color: '#00d4ff' }} />
            <h3 className="text-xs font-mono uppercase tracking-widest" style={{ color: '#00d4ff' }}>Observações</h3>
          </div>
          <p className="text-sm whitespace-pre-wrap font-mono" style={{ color: '#94a3b8' }}>{asset.observacoes}</p>
        </div>
      )}

      {/* Auditoria */}
      <div className="rounded-lg p-5" style={{ background: '#0f0f1a', border: '1px solid #1a3a4a' }}>
        <div className="flex items-center gap-2 mb-4 pb-3" style={{ borderBottom: '1px solid #1a3a4a' }}>
          <Clock className="h-4 w-4" style={{ color: '#00d4ff' }} />
          <h3 className="text-xs font-mono uppercase tracking-widest" style={{ color: '#00d4ff' }}>Auditoria</h3>
        </div>
        <div className="space-y-0.5">
          <InfoRow label="Cadastrado por"
            value={asset.cadastradoPor ? `${asset.cadastradoPor.name} (${asset.cadastradoPor.email})` : null} />
          <InfoRow label="Data de Cadastro" value={formatDate(asset.createdAt)} />
          <InfoRow label="Editado por"
            value={asset.editadoPor ? `${asset.editadoPor.name} (${asset.editadoPor.email})` : null} />
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
