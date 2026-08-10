import * as XLSX from 'xlsx';

/**
 * Exporta ativos para CSV com todos os campos patrimoniais e operacionais.
 * Nomenclatura alinhada com a planilha NAV Brasil para evitar confusão.
 */
export function exportAssetsToCSV(assets, filename = 'ativos') {
  if (!assets || assets.length === 0) {
    alert('Nenhum ativo para exportar');
    return;
  }

  // Cabeçalhos alinhados com a nomenclatura da planilha NAV Brasil
  const headers = [
    // ── Identificação ─────────────────────────────────────────────────────
    'Patrimônio / Plaqueta',   // = "Plaqueta" na planilha NAV
    'Ativo nº (SAP)',          // = "Ativo nº" na planilha NAV
    'Plaqueta NAV',            // = "Plaqueta NAV" na planilha NAV
    'Denominação / Tipo do Bem', // = "Denominação do imobilizado" na planilha NAV
    'Categoria / Tipo',
    'Modelo',                  // = "Modelo" na planilha NAV
    'Fabricante',
    'Número de Série',
    'Quantidade',
    // ── Localização ───────────────────────────────────────────────────────
    'DNB',
    'Prédio',
    'Setor / Sala',
    // ── Detentor Patrimonial ──────────────────────────────────────────────
    'Detentor',                // = "Detentor" na planilha NAV
    'Matrícula do Detentor',   // = "Detentor - Matrícula" na planilha NAV
    // ── Uso Operacional ───────────────────────────────────────────────────
    'Usuário Responsável',
    'Função / Perfil',
    // ── Situação Patrimonial ──────────────────────────────────────────────
    'Situação do Bem',         // = "Situação do Bem" na planilha NAV
    'Situação Operacional',    // = "Situação" na planilha NAV
    'Status de Localização',   // = "Status" na planilha NAV
    'Condições de Uso',        // = "Condições de Uso" na planilha NAV
    'Classificação (Inservível)', // = "Classificação" na planilha NAV
    'Descrição Completa',      // = "Descrição" na planilha NAV
    // ── Dados Financeiros ─────────────────────────────────────────────────
    'Proprietário',            // = "Proprietário" na planilha NAV
    'Valor do Bem (R$)',       // = "Valor do Bem" na planilha NAV
    'Valor Residual (R$)',     // = "Valor Residual" na planilha NAV
    'Data de Incorporação',    // = "Data de incorporação" na planilha NAV
    'Data de Serviço',         // = "Data de serviço" na planilha NAV
    'Vida Útil (meses)',       // = "Vida útil" na planilha NAV
    'Conta Nav',               // = "Conta Nav" na planilha NAV
    'Centro de Custo',         // = "Centro de Custo" na planilha NAV
    'Contabilizado',
    // ── Situação Interna de TI ────────────────────────────────────────────
    'Situação (TI)',
    // ── Rede ─────────────────────────────────────────────────────────────
    'Hostname',
    'Endereço IP',
    'Sistema Operacional',
    'IP de Gerência',
    'Rede / VLAN',
    'Portas / Conexões',
    // ── Outros ───────────────────────────────────────────────────────────
    'Observações',
    'Data de Cadastro',
    'Cadastrado Por',
    'Última Atualização',
  ];

  const boolStr = (val) => {
    if (val === true) return 'Sim';
    if (val === false) return 'Não';
    return '';
  };

  const rows = assets.map((asset) => [
    asset.patrimonio || '',
    asset.ativoSAP || '',
    asset.plaquetaNAV || '',
    asset.tipoEquipamento || '',
    asset.categoria?.nome || '',
    asset.subtipo || '',
    asset.fabricante || '',
    asset.numeroSerie || '',
    asset.quantidade || '',
    asset.dnb?.code ? `${asset.dnb.code} — ${asset.dnb.name}` : (asset.dnb?.name || ''),
    asset.setor?.predio?.nome || '',
    asset.setor?.nome || asset.localizacaoSetor || '',
    asset.detentorNome || '',
    asset.detentorMatricula || '',
    asset.usuarioResponsavel || '',
    asset.funcaoPerfil || '',
    asset.situacaoBem || '',
    asset.situacaoOperacional || '',
    asset.statusLocalizacao || '',
    boolStr(asset.condicoesUso),
    asset.classificacaoInservivel || '',
    boolStr(asset.descricaoCompleta),
    asset.proprietario || '',
    asset.valor != null ? asset.valor.toLocaleString('pt-BR', { minimumFractionDigits: 2 }) : '',
    asset.valorResidual != null ? asset.valorResidual.toLocaleString('pt-BR', { minimumFractionDigits: 2 }) : '',
    asset.dataAquisicao ? new Date(asset.dataAquisicao).toLocaleDateString('pt-BR') : '',
    asset.dataServico ? new Date(asset.dataServico).toLocaleDateString('pt-BR') : '',
    asset.vidaUtilMeses != null ? String(asset.vidaUtilMeses) : '',
    asset.contaNav || '',
    asset.centroCusto || '',
    boolStr(asset.contabilizado),
    asset.situacao || '',
    asset.hostname || '',
    asset.enderecoIp || '',
    asset.sistemaOperacional || '',
    asset.ipGerencia || '',
    asset.redeVlan || '',
    asset.portasConexoes || '',
    (asset.observacoes || '').replace(/"/g, '""'),
    asset.createdAt ? new Date(asset.createdAt).toLocaleString('pt-BR') : '',
    asset.cadastradoPor?.name || '',
    asset.updatedAt ? new Date(asset.updatedAt).toLocaleString('pt-BR') : '',
  ]);

  const csvContent = [
    headers.map((h) => `"${h}"`).join(','),
    ...rows.map((row) => row.map((cell) => `"${String(cell)}"`).join(',')),
  ].join('\n');

  const BOM = '\uFEFF';
  const blob = new Blob([BOM + csvContent], { type: 'text/csv;charset=utf-8;' });
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

/**
 * Gera arquivo .xlsx no formato exato da planilha NAV Brasil (34 colunas + abas auxiliares).
 * Campos calculados (depreciação, valor líquido) são preenchidos automaticamente.
 */
export function exportarFormatoNAV(assets, dnbCode = '', filename = 'nav-brasil') {
  if (!assets || assets.length === 0) {
    alert('Nenhum ativo para exportar');
    return;
  }

  const boolStr = (v) => v === true ? 'Sim' : v === false ? 'Não' : '';
  const fmtDate = (d) => d ? new Date(d).toLocaleDateString('pt-BR') : '';
  const fmtNum = (n) => n != null ? Number(n).toLocaleString('pt-BR', { minimumFractionDigits: 2 }) : '';

  function calcDeprec(asset) {
    const { valor, valorResidual, vidaUtilMeses, dataServico, dataAquisicao } = asset;
    if (!valor || !vidaUtilMeses || vidaUtilMeses <= 0) return {};
    const residual = valorResidual || 0;
    const depMensal = (valor - residual) / vidaUtilMeses;
    const dataBase = dataServico || dataAquisicao;
    if (!dataBase) return { depMensal };
    const inicio = new Date(dataBase);
    const hoje = new Date();
    const meses = Math.max(0, (hoje.getFullYear() - inicio.getFullYear()) * 12 + (hoje.getMonth() - inicio.getMonth()));
    const deprecAcum = Math.min(valor - residual, depMensal * meses);
    const valorLiquido = Math.max(residual, valor - deprecAcum);
    const vidaRestante = Math.max(0, vidaUtilMeses - meses);
    return { depMensal, deprecAcum, valorLiquido, vidaRestante };
  }

  const headers = [
    'Entidade',
    'Aeroporto',
    'Proprietário',
    'Conta Nav',
    'Contabilizado',
    'Categoria',
    'Ativo nº',
    'Denominação do imobilizado',
    'Data de incorporação',
    'Data de serviço',
    'Vida útil',
    'Vida útil restante',
    'Depreciação mensal',
    'Valor do Bem',
    'Valor Líquido',
    'Depreciação Acumulada',
    'Valor Residual',
    'Centro de Custo',
    'Detentor - Matrícula',
    'Detentor',
    'Localização',
    'Número de série',
    'Fabricante',
    'Modelo',
    'Plaqueta',
    'Situação do Bem',
    'Situação',
    'Status',
    'Condições de Uso',
    'Classificação',
    'Descrição',
    'Plaqueta NAV',
    'Localização atualizada',
    'Observação',
  ];

  const mainRows = assets.map((a) => {
    const d = calcDeprec(a);
    return [
      '047',
      a.dnb?.code || dnbCode,
      a.proprietario || '',
      a.contaNav || '',
      boolStr(a.contabilizado),
      a.contaNav || '',
      a.ativoSAP || '',
      a.tipoEquipamento || '',
      fmtDate(a.dataAquisicao),
      fmtDate(a.dataServico),
      a.vidaUtilMeses != null ? String(a.vidaUtilMeses) : '',
      d.vidaRestante != null ? String(d.vidaRestante) : '',
      d.depMensal != null ? fmtNum(d.depMensal) : '',
      fmtNum(a.valor),
      d.valorLiquido != null ? fmtNum(d.valorLiquido) : '',
      d.deprecAcum != null ? fmtNum(d.deprecAcum) : '',
      fmtNum(a.valorResidual),
      a.centroCusto || '',
      a.detentorMatricula || '',
      a.detentorNome || '',
      a.setor?.nome || a.localizacaoSetor || '',
      a.numeroSerie || '',
      a.fabricante || '',
      a.subtipo || '',
      a.patrimonio || '',
      a.situacaoBem || '',
      a.situacaoOperacional || '',
      a.statusLocalizacao || '',
      boolStr(a.condicoesUso),
      a.classificacaoInservivel || '',
      a.descricaoCompleta ? 'Completa' : '',
      a.plaquetaNAV || '',
      a.setor?.codigoOficial || '',
      a.observacoes || '',
    ];
  });

  const wb = XLSX.utils.book_new();

  // Aba I — Dados principais
  const wsMain = XLSX.utils.aoa_to_sheet([headers, ...mainRows]);
  wsMain['!cols'] = headers.map(() => ({ wch: 18 }));
  XLSX.utils.book_append_sheet(wb, wsMain, 'I - Inventário');

  // Aba III — Não Localizados
  const naoLoc = assets.filter(a => a.statusLocalizacao === 'Não Localizado');
  const wsNaoLoc = XLSX.utils.aoa_to_sheet([
    ['Plaqueta', 'Denominação', 'Detentor', 'Matrícula', 'DNB', 'Setor', 'Sit. Operacional', 'Atualizado em'],
    ...naoLoc.map(a => [
      a.patrimonio, a.tipoEquipamento, a.detentorNome, a.detentorMatricula,
      a.dnb?.code, a.setor?.nome || a.localizacaoSetor, a.situacaoOperacional,
      fmtDate(a.updatedAt),
    ]),
  ]);
  XLSX.utils.book_append_sheet(wb, wsNaoLoc, 'III - Não Localizados');

  // Aba IV — Descrição Incompleta
  const incompletos = assets.filter(a => a.descricaoCompleta === false);
  const wsIncompletos = XLSX.utils.aoa_to_sheet([
    ['Plaqueta', 'Denominação', 'Modelo', 'Fabricante', 'Nº Série', 'Detentor', 'DNB'],
    ...incompletos.map(a => [
      a.patrimonio, a.tipoEquipamento, a.subtipo, a.fabricante,
      a.numeroSerie, a.detentorNome, a.dnb?.code,
    ]),
  ]);
  XLSX.utils.book_append_sheet(wb, wsIncompletos, 'IV - Descrição Incompleta');

  // Aba V — Inservíveis / Alienação
  const inservíveis = assets.filter(a => a.situacaoOperacional === 'Inservível');
  const wsAlienacao = XLSX.utils.aoa_to_sheet([
    ['Plaqueta', 'Denominação', 'Classificação', 'Valor Original', 'Valor Líquido', 'Detentor', 'DNB', 'Setor'],
    ...inservíveis.map(a => {
      const d = calcDeprec(a);
      return [
        a.patrimonio, a.tipoEquipamento, a.classificacaoInservivel,
        fmtNum(a.valor), d.valorLiquido != null ? fmtNum(d.valorLiquido) : '',
        a.detentorNome, a.dnb?.code, a.setor?.nome || a.localizacaoSetor,
      ];
    }),
  ]);
  XLSX.utils.book_append_sheet(wb, wsAlienacao, 'V - Alienação');

  const timestamp = new Date().toISOString().split('T')[0];
  XLSX.writeFile(wb, `${filename}_${timestamp}.xlsx`);
}
