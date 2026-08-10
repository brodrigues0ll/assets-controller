import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import connectDB from '@/lib/mongodb';
import Asset from '@/lib/models/Asset';
import DNB from '@/lib/models/DNB';
import Setor from '@/lib/models/Setor';
import AuditLog from '@/lib/models/AuditLog';
import * as XLSX from 'xlsx';

// Mapeamento: índice da coluna (0-based) → campo do Asset
// Baseado na planilha 047 - DNME - MACAÉ - 2026
const COL_MAP = {
  2:  { field: 'proprietario',           type: 'string'  },
  3:  { field: 'contaNav',               type: 'string'  },
  4:  { field: 'contabilizado',          type: 'bool'    },
  // col 5 = codigoContabil SAP (categoria da planilha) — não mapear para categoria da app
  6:  { field: 'ativoSAP',              type: 'string'  },
  7:  { field: 'tipoEquipamento',        type: 'string'  },
  8:  { field: 'dataAquisicao',          type: 'date'    },
  9:  { field: 'dataServico',            type: 'date'    },
  10: { field: 'vidaUtilMeses',          type: 'number'  },
  // col 11 = vida útil restante (calculado)
  // col 12 = depreciação mensal (calculado)
  13: { field: 'valor',                  type: 'number'  },
  // col 14 = valor líquido (calculado)
  // col 15 = depreciação acumulada (calculado)
  16: { field: 'valorResidual',          type: 'number'  },
  17: { field: 'centroCusto',            type: 'string'  },
  18: { field: 'detentorMatricula',      type: 'string'  },
  19: { field: 'detentorNome',           type: 'string'  },
  // col 20 = localização antiga (string) → localizacaoSetor legado
  20: { field: 'localizacaoSetor',       type: 'string'  },
  21: { field: 'numeroSerie',            type: 'string'  },
  22: { field: 'fabricante',             type: 'string'  },
  23: { field: 'subtipo',                type: 'string'  },
  24: { field: 'patrimonio',             type: 'string'  },
  25: { field: 'situacaoBem',            type: 'string'  },
  26: { field: 'situacaoOperacional',    type: 'string'  },
  27: { field: 'statusLocalizacao',      type: 'string'  },
  28: { field: 'condicoesUso',           type: 'bool'    },
  29: { field: 'classificacaoInservivel',type: 'string'  },
  // col 30 = Descrição (texto de preenchimento) — se preenchido = descricaoCompleta: true
  30: { field: '_descricao',             type: 'string'  },
  31: { field: 'plaquetaNAV',            type: 'string'  },
  // col 32 = localização atualizada (codigoOficial do setor)
  32: { field: '_localizacaoAtualizada', type: 'string'  },
  33: { field: 'observacoes',            type: 'string'  },
};

function parseCell(raw, type) {
  if (raw === null || raw === undefined || raw === '') return undefined;
  const s = String(raw).trim();
  if (!s) return undefined;

  if (type === 'string') return s;

  if (type === 'number') {
    // Remove formatação pt-BR de moeda/número
    const n = parseFloat(String(raw).replace(/\./g, '').replace(',', '.').replace(/[^0-9.-]/g, ''));
    return isNaN(n) ? undefined : n;
  }

  if (type === 'date') {
    // xlsx retorna datas como número serial ou string
    if (typeof raw === 'number') {
      const d = XLSX.SSF.parse_date_code(raw);
      if (d) return new Date(d.y, d.m - 1, d.d);
    }
    if (typeof raw === 'string') {
      // Suporta DD/MM/YYYY e YYYY-MM-DD
      if (/^\d{2}\/\d{2}\/\d{4}$/.test(s)) {
        const [dd, mm, yyyy] = s.split('/');
        return new Date(`${yyyy}-${mm}-${dd}`);
      }
      const d = new Date(s);
      return isNaN(d.getTime()) ? undefined : d;
    }
    return undefined;
  }

  if (type === 'bool') {
    const lower = s.toLowerCase();
    if (['sim', 's', 'yes', 'true', '1', 'x'].includes(lower)) return true;
    if (['não', 'nao', 'n', 'no', 'false', '0'].includes(lower)) return false;
    return undefined;
  }

  return undefined;
}

function normalizeSituacao(val) {
  if (!val) return undefined;
  const map = {
    'em uso': 'Em uso', 'inservivel': 'Inservível', 'inservível': 'Inservível',
    'não localizado': 'Não Localizado', 'nao localizado': 'Não Localizado',
    'outros': 'Outros',
  };
  return map[val.toLowerCase()] || val;
}

function normalizeStatusLoc(val) {
  if (!val) return undefined;
  const lower = val.toLowerCase();
  if (['localizado', 'loc'].includes(lower)) return 'Localizado';
  if (['não localizado', 'nao localizado', 'não loc'].includes(lower)) return 'Não Localizado';
  return val;
}

function normalizeSituacaoBem(val) {
  if (!val) return undefined;
  const map = {
    'uso próprio': 'Uso próprio', 'uso proprio': 'Uso próprio',
    'em andamento': 'Em andamento', 'em depósito': 'Em depósito',
    'em deposito': 'Em depósito', 'não localizado': 'Não Localizado', 'nao localizado': 'Não Localizado',
  };
  return map[val.toLowerCase()] || val;
}

function normalizeClassif(val) {
  if (!val) return undefined;
  const map = {
    'ocioso': 'Ocioso', 'recuperável': 'Recuperável', 'recuperavel': 'Recuperável',
    'antieconômico': 'Antieconômico', 'antieconomico': 'Antieconômico',
    'irrecuperável': 'Irrecuperável', 'irrecuperavel': 'Irrecuperável',
  };
  return map[val.toLowerCase()] || val;
}

export async function POST(request) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });
  if (!['gestor', 'administrador'].includes(session.user.role)) {
    return NextResponse.json({ error: 'Sem permissão para importar' }, { status: 403 });
  }

  let formData;
  try {
    formData = await request.formData();
  } catch {
    return NextResponse.json({ error: 'Falha ao ler arquivo enviado' }, { status: 400 });
  }

  const file = formData.get('file');
  if (!file) return NextResponse.json({ error: 'Nenhum arquivo enviado' }, { status: 400 });

  const arrayBuffer = await file.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);

  let workbook;
  try {
    workbook = XLSX.read(buffer, { type: 'buffer', cellDates: false });
  } catch {
    return NextResponse.json({ error: 'Arquivo inválido ou corrompido' }, { status: 400 });
  }

  // Usa a primeira aba (aba principal com os dados)
  const sheetName = workbook.SheetNames[0];
  const sheet = workbook.Sheets[sheetName];
  const rows = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: '' });

  // Detecta linha de cabeçalho (procura a linha com "Plaqueta" ou "Ativo")
  let headerRow = 0;
  for (let i = 0; i < Math.min(10, rows.length); i++) {
    const r = rows[i];
    if (r.some(c => String(c).toLowerCase().includes('plaqueta') || String(c).toLowerCase().includes('ativo'))) {
      headerRow = i;
      break;
    }
  }

  const dataRows = rows.slice(headerRow + 1).filter(r => {
    // Remove linhas completamente vazias
    return r.some(c => c !== '' && c !== null && c !== undefined);
  });

  await connectDB();

  // Cache de DNBs e Setores para evitar queries repetidas
  const dnbs = await DNB.find({}).lean();
  const setores = await Setor.find({}).populate('predio', 'nome').lean();

  const dnbByCode = {};
  for (const d of dnbs) dnbByCode[d.code?.toLowerCase()] = d._id;

  const setorByCode = {};
  const setorByNome = {};
  for (const s of setores) {
    if (s.codigoOficial) setorByCode[s.codigoOficial.toLowerCase()] = s._id;
    setorByNome[s.nome?.toLowerCase()] = s._id;
  }

  const report = { criados: 0, atualizados: 0, erros: [], ignorados: 0 };

  for (let i = 0; i < dataRows.length; i++) {
    const row = dataRows[i];
    const rowNum = headerRow + 2 + i;

    try {
      // Extrair patrimônio (col 24, 0-based)
      const patrimonio = String(row[24] ?? '').trim();
      if (!patrimonio) {
        report.ignorados++;
        continue;
      }

      const payload = {};

      // Processar cada coluna mapeada
      for (const [colIdx, mapping] of Object.entries(COL_MAP)) {
        const raw = row[Number(colIdx)];
        const val = parseCell(raw, mapping.type);
        if (val === undefined) continue;

        if (mapping.field === '_descricao') {
          payload.descricaoCompleta = !!val;
          continue;
        }

        if (mapping.field === '_localizacaoAtualizada') {
          const setor = setorByCode[val.toLowerCase()] || setorByNome[val.toLowerCase()];
          if (setor) payload.setor = setor;
          continue;
        }

        if (mapping.field === 'situacaoOperacional') {
          const norm = normalizeSituacao(val);
          if (norm) payload.situacaoOperacional = norm;
          continue;
        }

        if (mapping.field === 'statusLocalizacao') {
          const norm = normalizeStatusLoc(val);
          if (norm) payload.statusLocalizacao = norm;
          continue;
        }

        if (mapping.field === 'situacaoBem') {
          const norm = normalizeSituacaoBem(val);
          if (norm) payload.situacaoBem = norm;
          continue;
        }

        if (mapping.field === 'classificacaoInservivel') {
          const norm = normalizeClassif(val);
          if (norm) payload.classificacaoInservivel = norm;
          continue;
        }

        payload[mapping.field] = val;
      }

      // Resolver DNB a partir de col 1 (aeroporto/código DNB)
      const dnbRaw = String(row[1] ?? '').trim();
      if (dnbRaw) {
        const dnbId = dnbByCode[dnbRaw.toLowerCase()];
        if (dnbId) payload.dnb = dnbId;
      }

      const existingAsset = await Asset.findOne({ patrimonio });

      if (existingAsset) {
        Object.assign(existingAsset, payload);
        existingAsset.editadoPor = session.user.id;
        await existingAsset.save();

        await AuditLog.create({
          userId: session.user.id,
          action: 'update',
          entityType: 'asset',
          entityId: existingAsset._id,
          dnb: existingAsset.dnb,
          description: `Importação planilha NAV: atualizou ativo ${patrimonio} (linha ${rowNum})`,
        });

        report.atualizados++;
      } else {
        if (!payload.dnb) {
          report.erros.push({ linha: rowNum, patrimonio, erro: 'DNB não encontrada — ativo não criado' });
          continue;
        }

        const newAsset = await Asset.create({
          ...payload,
          patrimonio,
          cadastradoPor: session.user.id,
        });

        await AuditLog.create({
          userId: session.user.id,
          action: 'create',
          entityType: 'asset',
          entityId: newAsset._id,
          dnb: newAsset.dnb,
          description: `Importação planilha NAV: criou ativo ${patrimonio} (linha ${rowNum})`,
        });

        report.criados++;
      }
    } catch (err) {
      const patrimonio = String(row[24] ?? '').trim() || `linha ${rowNum}`;
      report.erros.push({ linha: rowNum, patrimonio, erro: err.message });
    }
  }

  return NextResponse.json({
    ok: true,
    totalLinhas: dataRows.length,
    ...report,
  });
}
