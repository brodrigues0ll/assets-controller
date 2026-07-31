import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { redirect } from 'next/navigation';
import connectDB from '@/lib/mongodb';
import Asset from '@/lib/models/Asset';
import DNB from '@/lib/models/DNB';
import User from '@/lib/models/User';
import { Package, MapPin, Users, Wrench, TrendingUp, AlertTriangle, Activity, AlertCircle } from 'lucide-react';

async function getDashboardStats(userRole, userDnb) {
  await connectDB();

  let assetQuery = {};

  if (userRole === 'tecnico' && userDnb) {
    assetQuery.dnb = userDnb.id;
  }

  const inUseStatuses = ['Ativo', 'Em uso'];
  const defectStatuses = ['Com defeito'];

  const [
    totalAssets,
    activeAssets,
    maintenanceAssets,
    reserveAssets,
    defectAssets,
    discardedAssets,
    totalDNBs,
    totalUsers,
    assetsByType,
    assetsByDNB,
    recentAssets
  ] = await Promise.all([
    Asset.countDocuments(assetQuery),
    Asset.countDocuments({ ...assetQuery, situacao: { $in: inUseStatuses } }),
    Asset.countDocuments({ ...assetQuery, situacao: 'Em manutenção' }),
    Asset.countDocuments({ ...assetQuery, situacao: 'Reserva' }),
    Asset.countDocuments({ ...assetQuery, situacao: { $in: defectStatuses } }),
    Asset.countDocuments({ ...assetQuery, situacao: 'Descartado' }),
    DNB.countDocuments({ active: true }),
    User.countDocuments({ active: true }),
    Asset.aggregate([
      { $match: assetQuery },
      { $group: { _id: '$tipoEquipamento', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 5 }
    ]),
    Asset.aggregate([
      { $match: assetQuery },
      {
        $lookup: {
          from: 'dnbs',
          localField: 'dnb',
          foreignField: '_id',
          as: 'dnbData'
        }
      },
      { $unwind: '$dnbData' },
      { $group: { _id: '$dnbData.code', count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]),
    Asset.find(assetQuery)
      .populate('dnb', 'code name')
      .sort({ createdAt: -1 })
      .limit(5)
      .lean()
  ]);

  return {
    totalAssets,
    activeAssets,
    maintenanceAssets,
    reserveAssets,
    defectAssets,
    discardedAssets,
    totalDNBs,
    totalUsers,
    assetsByType,
    assetsByDNB,
    recentAssets
  };
}

function StatCard({ title, value, subtitle, color, icon: Icon }) {
  return (
    <div
      className="rounded-lg p-5 transition-all"
      style={{
        background: '#0f0f1a',
        border: `1px solid ${color}30`,
      }}
    >
      <div className="flex items-center justify-between mb-3">
        <p className="text-xs font-mono uppercase tracking-widest" style={{ color: '#64748b' }}>
          {title}
        </p>
        <div
          className="w-8 h-8 rounded flex items-center justify-center"
          style={{ background: `${color}15` }}
        >
          <Icon className="h-4 w-4" style={{ color }} />
        </div>
      </div>
      <div className="text-4xl font-bold font-mono" style={{ color }}>
        {value}
      </div>
      <p className="text-xs mt-1" style={{ color: '#64748b' }}>
        {subtitle}
      </p>
    </div>
  );
}

function getSituacaoBadgeStyle(situacao) {
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

export default async function DashboardPage() {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect('/login');
  }

  const stats = await getDashboardStats(session.user.role, session.user.dnb);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold font-mono" style={{ color: '#e2e8f0' }}>
          Dashboard
        </h1>
        <p className="text-sm mt-1 font-mono" style={{ color: '#64748b' }}>
          Visão geral do inventário — {new Date().toLocaleDateString('pt-BR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
        </p>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total de Ativos"
          value={stats.totalAssets}
          subtitle="Patrimônios cadastrados"
          color="#00d4ff"
          icon={Package}
        />
        <StatCard
          title="Em Operação"
          value={stats.activeAssets}
          subtitle="Ativos em uso"
          color="#00ff88"
          icon={Activity}
        />
        <StatCard
          title="Manutenção"
          value={stats.maintenanceAssets}
          subtitle="Aguardando reparo"
          color="#fbbf24"
          icon={Wrench}
        />
        <StatCard
          title="Com Defeito"
          value={stats.defectAssets}
          subtitle="Requerem atenção"
          color="#ff2d55"
          icon={AlertCircle}
        />
      </div>

      {/* Admin/Gestor extra stats */}
      {(session.user.role === 'gestor' || session.user.role === 'administrador') && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <StatCard
            title="Reserva"
            value={stats.reserveAssets}
            subtitle="Em reserva"
            color="#a855f7"
            icon={Package}
          />
          <StatCard
            title="Descartados"
            value={stats.discardedAssets}
            subtitle="Fora de serviço"
            color="#6b7280"
            icon={Package}
          />
          <StatCard
            title="DNBs Ativas"
            value={stats.totalDNBs}
            subtitle="Total de localidades"
            color="#00d4ff"
            icon={MapPin}
          />
          <StatCard
            title="Usuários"
            value={stats.totalUsers}
            subtitle="Usuários ativos"
            color="#00ff88"
            icon={Users}
          />
        </div>
      )}

      {/* Charts row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Assets by type */}
        <div
          className="rounded-lg p-5"
          style={{ background: '#0f0f1a', border: '1px solid #1a3a4a' }}
        >
          <div className="flex items-center gap-2 mb-4 pb-3" style={{ borderBottom: '1px solid #1a3a4a' }}>
            <TrendingUp className="h-4 w-4" style={{ color: '#00d4ff' }} />
            <h3 className="text-xs font-mono uppercase tracking-widest" style={{ color: '#00d4ff' }}>
              Ativos por Tipo
            </h3>
          </div>
          <div className="space-y-3">
            {stats.assetsByType.length > 0 ? (
              stats.assetsByType.map((item, idx) => {
                const percentage = stats.totalAssets > 0 ? ((item.count / stats.totalAssets) * 100).toFixed(1) : 0;
                const colors = ['#00d4ff', '#00ff88', '#a855f7', '#fbbf24', '#ff2d55'];
                const color = colors[idx % colors.length];
                return (
                  <div key={item._id}>
                    <div className="flex items-center justify-between text-xs mb-1.5">
                      <span className="font-mono" style={{ color: '#e2e8f0' }}>{item._id || 'N/A'}</span>
                      <span className="font-mono" style={{ color: '#64748b' }}>{item.count} ({percentage}%)</span>
                    </div>
                    <div className="h-1.5 rounded-full" style={{ background: '#141428' }}>
                      <div
                        className="h-1.5 rounded-full transition-all"
                        style={{
                          width: `${percentage}%`,
                          background: `linear-gradient(90deg, ${color}, ${color}80)`,
                          boxShadow: `0 0 6px ${color}60`,
                        }}
                      />
                    </div>
                  </div>
                );
              })
            ) : (
              <p className="text-sm font-mono text-center py-4" style={{ color: '#64748b' }}>
                Nenhum ativo cadastrado
              </p>
            )}
          </div>
        </div>

        {/* Assets by DNB */}
        <div
          className="rounded-lg p-5"
          style={{ background: '#0f0f1a', border: '1px solid #1a3a4a' }}
        >
          <div className="flex items-center gap-2 mb-4 pb-3" style={{ borderBottom: '1px solid #1a3a4a' }}>
            <MapPin className="h-4 w-4" style={{ color: '#00d4ff' }} />
            <h3 className="text-xs font-mono uppercase tracking-widest" style={{ color: '#00d4ff' }}>
              Ativos por DNB
            </h3>
          </div>
          <div className="space-y-3">
            {stats.assetsByDNB.length > 0 ? (
              stats.assetsByDNB.slice(0, 5).map((item, idx) => {
                const percentage = stats.totalAssets > 0 ? ((item.count / stats.totalAssets) * 100).toFixed(1) : 0;
                const colors = ['#00ff88', '#00d4ff', '#a855f7', '#fbbf24', '#ff2d55'];
                const color = colors[idx % colors.length];
                return (
                  <div key={item._id}>
                    <div className="flex items-center justify-between text-xs mb-1.5">
                      <span className="font-mono" style={{ color: '#e2e8f0' }}>{item._id}</span>
                      <span className="font-mono" style={{ color: '#64748b' }}>{item.count} ({percentage}%)</span>
                    </div>
                    <div className="h-1.5 rounded-full" style={{ background: '#141428' }}>
                      <div
                        className="h-1.5 rounded-full"
                        style={{
                          width: `${percentage}%`,
                          background: `linear-gradient(90deg, ${color}, ${color}80)`,
                          boxShadow: `0 0 6px ${color}60`,
                        }}
                      />
                    </div>
                  </div>
                );
              })
            ) : (
              <p className="text-sm font-mono text-center py-4" style={{ color: '#64748b' }}>
                Nenhum ativo cadastrado
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Recent assets */}
      <div
        className="rounded-lg p-5"
        style={{ background: '#0f0f1a', border: '1px solid #1a3a4a' }}
      >
        <div className="flex items-center gap-2 mb-4 pb-3" style={{ borderBottom: '1px solid #1a3a4a' }}>
          <Package className="h-4 w-4" style={{ color: '#00d4ff' }} />
          <h3 className="text-xs font-mono uppercase tracking-widest" style={{ color: '#00d4ff' }}>
            Cadastros Recentes
          </h3>
        </div>
        {stats.recentAssets.length > 0 ? (
          <div className="space-y-0">
            {stats.recentAssets.map((asset, idx) => {
              const s = getSituacaoBadgeStyle(asset.situacao);
              return (
                <div
                  key={asset._id}
                  className="flex items-center justify-between py-3"
                  style={{
                    borderBottom: idx < stats.recentAssets.length - 1 ? '1px solid #1a3a4a20' : 'none',
                  }}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className="w-2 h-2 rounded-full flex-shrink-0"
                      style={{ background: s.color, boxShadow: `0 0 4px ${s.color}` }}
                    />
                    <div>
                      <p className="font-mono text-sm font-semibold" style={{ color: '#e2e8f0' }}>
                        {asset.patrimonio}
                      </p>
                      <p className="text-xs" style={{ color: '#64748b' }}>
                        {asset.tipoEquipamento} — {asset.subtipo}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-xs font-mono" style={{ color: '#64748b' }}>
                      {asset.dnb?.code}
                    </p>
                    <p className="text-xs font-mono" style={{ color: '#1a3a4a' }}>
                      {new Date(asset.createdAt).toLocaleDateString('pt-BR')}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <p className="text-sm font-mono text-center py-4" style={{ color: '#64748b' }}>
            Nenhum ativo cadastrado
          </p>
        )}
      </div>

      {/* Alert banner */}
      {(stats.maintenanceAssets > 0 || stats.defectAssets > 0) && (
        <div
          className="flex items-start gap-3 px-5 py-4 rounded-lg"
          style={{
            background: '#fbbf2410',
            border: '1px solid #fbbf2440',
          }}
        >
          <AlertTriangle className="h-5 w-5 flex-shrink-0 mt-0.5" style={{ color: '#fbbf24' }} />
          <div>
            <p className="text-sm font-mono font-semibold" style={{ color: '#fbbf24' }}>
              Atenção Necessária
            </p>
            <p className="text-sm mt-1" style={{ color: '#94a3b8' }}>
              {stats.maintenanceAssets > 0 && (
                <span>{stats.maintenanceAssets} equipamento{stats.maintenanceAssets !== 1 ? 's' : ''} em manutenção. </span>
              )}
              {stats.defectAssets > 0 && (
                <span>{stats.defectAssets} equipamento{stats.defectAssets !== 1 ? 's' : ''} com defeito registrado.</span>
              )}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
