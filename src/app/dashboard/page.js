import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { redirect } from 'next/navigation';
import connectDB from '@/lib/mongodb';
import Asset from '@/lib/models/Asset';
import DNB from '@/lib/models/DNB';
import User from '@/lib/models/User';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Package, MapPin, Users, Wrench, TrendingUp, AlertTriangle } from 'lucide-react';

async function getDashboardStats(userRole, userDnb) {
  await connectDB();

  let assetQuery = {};

  // Técnico só vê ativos da sua DNB
  if (userRole === 'tecnico' && userDnb) {
    assetQuery.dnb = userDnb.id;
  }

  const [
    totalAssets,
    activeAssets,
    maintenanceAssets,
    reserveAssets,
    discardedAssets,
    totalDNBs,
    totalUsers,
    assetsByType,
    assetsByDNB,
    recentAssets
  ] = await Promise.all([
    Asset.countDocuments(assetQuery),
    Asset.countDocuments({ ...assetQuery, situacao: 'Ativo' }),
    Asset.countDocuments({ ...assetQuery, situacao: 'Em manutenção' }),
    Asset.countDocuments({ ...assetQuery, situacao: 'Reserva' }),
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
    discardedAssets,
    totalDNBs,
    totalUsers,
    assetsByType,
    assetsByDNB,
    recentAssets
  };
}

export default async function DashboardPage() {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect('/login');
  }

  const stats = await getDashboardStats(session.user.role, session.user.dnb);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-600 mt-1">Visão geral do inventário</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Total de Ativos</CardTitle>
            <Package className="h-4 w-4 text-gray-400" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{stats.totalAssets}</div>
            <p className="text-xs text-gray-600 mt-1">Patrimônios cadastrados</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Em Operação</CardTitle>
            <Package className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-600">{stats.activeAssets}</div>
            <p className="text-xs text-gray-600 mt-1">Ativos ativos</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Manutenção</CardTitle>
            <Wrench className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-orange-600">{stats.maintenanceAssets}</div>
            <p className="text-xs text-gray-600 mt-1">Aguardando reparo</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Reserva</CardTitle>
            <Package className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-blue-600">{stats.reserveAssets}</div>
            <p className="text-xs text-gray-600 mt-1">Equipamentos reserva</p>
          </CardContent>
        </Card>
      </div>

      {(session.user.role === 'gestor' || session.user.role === 'administrador') && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>DNBs Cadastradas</CardTitle>
                <CardDescription>Total de localidades</CardDescription>
              </div>
              <MapPin className="h-8 w-8 text-gray-400" />
            </CardHeader>
            <CardContent>
              <div className="text-4xl font-bold">{stats.totalDNBs}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Usuários Ativos</CardTitle>
                <CardDescription>Total de usuários</CardDescription>
              </div>
              <Users className="h-8 w-8 text-gray-400" />
            </CardHeader>
            <CardContent>
              <div className="text-4xl font-bold">{stats.totalUsers}</div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Estatísticas por Tipo */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Ativos por Tipo
            </CardTitle>
            <CardDescription>Top 5 tipos de equipamentos</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {stats.assetsByType.length > 0 ? (
                stats.assetsByType.map((item) => {
                  const percentage = ((item.count / stats.totalAssets) * 100).toFixed(1);
                  return (
                    <div key={item._id} className="space-y-1">
                      <div className="flex items-center justify-between text-sm">
                        <span className="font-medium">{item._id || 'Não especificado'}</span>
                        <span className="text-gray-600">{item.count} ({percentage}%)</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-blue-600 h-2 rounded-full"
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                    </div>
                  );
                })
              ) : (
                <p className="text-sm text-gray-500">Nenhum ativo cadastrado</p>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MapPin className="h-5 w-5" />
              Ativos por DNB
            </CardTitle>
            <CardDescription>Distribuição por localidade</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {stats.assetsByDNB.length > 0 ? (
                stats.assetsByDNB.slice(0, 5).map((item) => {
                  const percentage = ((item.count / stats.totalAssets) * 100).toFixed(1);
                  return (
                    <div key={item._id} className="space-y-1">
                      <div className="flex items-center justify-between text-sm">
                        <span className="font-medium font-mono">{item._id}</span>
                        <span className="text-gray-600">{item.count} ({percentage}%)</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-green-600 h-2 rounded-full"
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                    </div>
                  );
                })
              ) : (
                <p className="text-sm text-gray-500">Nenhum ativo cadastrado</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Ativos Recentes */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            Ativos Cadastrados Recentemente
          </CardTitle>
          <CardDescription>Últimos 5 ativos adicionados ao sistema</CardDescription>
        </CardHeader>
        <CardContent>
          {stats.recentAssets.length > 0 ? (
            <div className="space-y-3">
              {stats.recentAssets.map((asset) => (
                <div key={asset._id} className="flex items-center justify-between border-b border-gray-100 pb-3 last:border-0 last:pb-0">
                  <div>
                    <p className="font-medium text-sm">{asset.patrimonio}</p>
                    <p className="text-xs text-gray-600">{asset.tipoEquipamento} - {asset.subtipo}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs font-mono text-gray-600">{asset.dnb?.code}</p>
                    <p className="text-xs text-gray-500">
                      {new Date(asset.createdAt).toLocaleDateString('pt-BR')}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-gray-500 text-center py-4">Nenhum ativo cadastrado</p>
          )}
        </CardContent>
      </Card>

      {/* Alerta de Manutenção */}
      {stats.maintenanceAssets > 0 && (
        <Card className="border-orange-200 bg-orange-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-orange-800">
              <AlertTriangle className="h-5 w-5" />
              Atenção: Equipamentos em Manutenção
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-orange-700">
              Existem <strong>{stats.maintenanceAssets}</strong> equipamentos aguardando manutenção.
              Verifique a lista de ativos para mais detalhes.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
