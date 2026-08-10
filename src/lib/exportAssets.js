/**
 * Exporta ativos para CSV
 * @param {Array} assets - Array de ativos a serem exportados
 * @param {String} filename - Nome do arquivo (sem extensão)
 */
export function exportAssetsToCSV(assets, filename = 'ativos') {
  if (!assets || assets.length === 0) {
    alert('Nenhum ativo para exportar');
    return;
  }

  // Definir cabeçalhos
  const headers = [
    'Patrimônio',
    'Tipo de Equipamento',
    'Subtipo/Modelo',
    'Fabricante',
    'Usuário Responsável',
    'Função/Perfil',
    'Prédio',
    'Setor',
    'DNB',
    'Número de Série',
    'Hostname',
    'Endereço IP',
    'Sistema Operacional',
    'IP de Gerência',
    'Rede/VLAN',
    'Portas/Conexões',
    'Quantidade',
    'Situação',
    'Observações',
    'Data de Cadastro',
    'Cadastrado Por',
  ];

  // Converter ativos para linhas CSV
  const rows = assets.map((asset) => {
    return [
      asset.patrimonio || '',
      asset.categoria?.nome || asset.tipoEquipamento || '',
      asset.subtipo || '',
      asset.fabricante || '',
      asset.usuarioResponsavel || '',
      asset.funcaoPerfil || '',
      asset.setor?.predio?.nome || '',
      asset.setor?.nome || asset.localizacaoSetor || '',
      asset.dnb?.code || '',
      asset.numeroSerie || '',
      asset.hostname || '',
      asset.enderecoIp || '',
      asset.sistemaOperacional || '',
      asset.ipGerencia || '',
      asset.redeVlan || '',
      asset.portasConexoes || '',
      asset.quantidade || '',
      asset.situacao || '',
      (asset.observacoes || '').replace(/"/g, '""'), // Escapar aspas duplas
      asset.dataCadastro
        ? new Date(asset.dataCadastro).toLocaleString('pt-BR')
        : '',
      asset.cadastradoPor?.name || '',
    ];
  });

  // Criar CSV
  const csvContent = [
    headers.map((h) => `"${h}"`).join(','),
    ...rows.map((row) => row.map((cell) => `"${cell}"`).join(',')),
  ].join('\n');

  // Adicionar BOM para UTF-8 (importante para Excel)
  const BOM = '\uFEFF';
  const csvWithBOM = BOM + csvContent;

  // Criar blob e fazer download
  const blob = new Blob([csvWithBOM], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);

  const timestamp = new Date().toISOString().split('T')[0];
  link.setAttribute('href', url);
  link.setAttribute('download', `${filename}_${timestamp}.csv`);
  link.style.visibility = 'hidden';

  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
