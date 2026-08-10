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
