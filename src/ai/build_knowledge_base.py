#!/usr/bin/env python3
"""
Indexador do Acervo Homologado — Consultor ChangeMacro (Basicão de Economia 2.0).

Lê exclusivamente os documentos e transcrições homologados no repositório:
  - docs/AULA_01_BASICAO_2_0.md
  - glossario.html
  - docs/transcricoes/*.txt

Gera:
  - src/data/knowledge_index.json (Índice estruturado para RAG / Python / API)
  - src/data/knowledge_index.js   (Bundle JS para carregamento estático sem CORS)
"""

from __future__ import annotations

from datetime import datetime, timezone
import json
import os
import re
from typing import Any

ROOT_DIR = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
DOCS_DIR = os.path.join(ROOT_DIR, "docs")
TRANSCRICOES_DIR = os.path.join(DOCS_DIR, "transcricoes")
DATA_DIR = os.path.join(ROOT_DIR, "src", "data")

# Metadados oficiais das 7 Fontes Homologadas
OFFICIAL_SOURCES: dict[str, dict[str, str]] = {
    "fonte_1": {
        "id": "Fonte #1",
        "title": "Basicão de Economia 2.0: Introdução aos Conceitos Básicos",
        "author": "Monica de Bolle",
        "date": "30/10/2026",
        "url": "https://bolle.substack.com/",
        "file": "2026-10-30_basicao_2_0_intro.txt",
    },
    "fonte_2": {
        "id": "Fonte #2",
        "title": "Basicão: Política Monetária",
        "author": "Monica de Bolle",
        "date": "06/11/2026",
        "url": "https://bolle.substack.com/p/basicao-politica-monetaria",
        "file": "2026-11-06_basicao_politica_monetaria.txt",
    },
    "fonte_3": {
        "id": "Fonte #3",
        "title": "Juros do Banco Central: Falsa Racionalidade?",
        "author": "André Lara Resende & Luiz Orenstein",
        "date": "30/10/2026",
        "url": "https://andrelararesende.substack.com/p/juros-do-banco-central-falsa-racionalidade",
        "file": "",
    },
    "fonte_4": {
        "id": "Fonte #4",
        "title": "Eu Acuso / J’Accuse: Uma proposta para eliminar os juros absurdos",
        "author": "André Lara Resende",
        "date": "25/09/2026",
        "url": "https://andrelararesende.substack.com/p/eu-acuso-uma-proposta-para-eliminar",
        "file": "",
    },
    "fonte_5": {
        "id": "Fonte #5",
        "title": "Juros, Dívida Pública e Política Fiscal",
        "author": "Monica de Bolle & José Paulo Kupfer",
        "date": "05/11/2026",
        "url": "https://bolle.substack.com/p/juros-divida-publica-e-politica-fiscal",
        "file": "",
    },
    "fonte_6": {
        "id": "Fonte #6",
        "title": "Câmbio e Juros, com José Paulo Kupfer",
        "author": "Monica de Bolle & José Paulo Kupfer",
        "date": "12/11/2026",
        "url": "https://bolle.substack.com/p/cambio-e-juros-com-jose-paulo-kupfer",
        "file": "2026-11-12_cambio_e_juros_kupfer.txt",
    },
    "fonte_7": {
        "id": "Fonte #7",
        "title": "Basicão: Juros, Dívida, Ajuste — o que é preciso saber",
        "author": "Monica de Bolle",
        "date": "13/11/2026",
        "url": "https://bolle.substack.com/p/basicao-juros-divida-ajusteo-que",
        "file": "2026-11-13_basicao_juros_divida_ajuste.txt",
    },
}

# 12 Fichas Didáticas Granulares (Pensadas para quem não é economista)
CANONICAL_TOPICS: list[dict[str, Any]] = [
    {
        "id": "canon_calculo_pib",
        "title": "Como se Calcula o PIB (Y = C + I + G + X − M)",
        "source_id": "Fonte #1",
        "author": "Monica de Bolle (Basicão 2.0: Introdução, 30/10/2026)",
        "url": "https://bolle.substack.com/",
        "timestamp": "15:26–31:40",
        "primary_triggers": [
            "como calcula pib", "calcula o pib", "calculo do pib", "calcular o pib",
            "o que e pib", "o que e o pib", "formula do pib", "equacao do pib",
            "componentes do pib", "c + i + g", "bens finais", "dupla contagem"
        ],
        "keywords": [
            "pib", "calcula", "calcular", "calculo", "formula", "produto interno bruto",
            "bens finais", "consumo", "investimento", "exportacoes", "importacoes"
        ],
        "synthesis": (
            "1️⃣ Em linguagem simples: O PIB (Produto Interno Bruto) é a soma de todos os bens e "
            "serviços FINAIS produzidos no país durante um período (trimestre ou ano). Como explica "
            "Monica de Bolle (Fonte #1 [15:26]), conta-se apenas o bem final (ex: o pão na padaria) "
            "e não os insumos intermediários (trigo e farinha) para evitar dupla contagem.\n\n"
            "2️⃣ A Fórmula pela Ótica da Demanda: Y = C + I + G + (X − M)\n"
            "• C (Consumo das Famílias): ~63% a 65% do PIB no Brasil (alimentos, serviços, bens);\n"
            "• I (Investimento / FBCF): máquinas, fábricas, obras e infraestrutura (~16% a 18% do PIB);\n"
            "• G (Gasto e Investimento Público): saúde, educação, segurança e obras do Estado;\n"
            "• X − M (Setor Externo): Exportações (X) menos Importações (M).\n\n"
            "3️⃣ No Simulador 2D: O PIB (Y) é a LARGURA das paredes do Tanque Hidráulico (porque a "
            "dívida é medida em % do PIB: Dívida ÷ PIB). Se você faz um corte brusco em G ou sobe "
            "demais a Selic (travando C e I), o PIB encolhe, o tanque fica mais estreito e o nível "
            "de Dívida/PIB sobe mesmo sem criar dívida nova!"
        ),
    },
    {
        "id": "canon_estoque_fluxo",
        "title": "Diferença entre Estoque (Dívida) e Fluxo (Déficit / Superávit)",
        "source_id": "Fonte #1",
        "author": "Monica de Bolle (30/10/2026 & 13/11/2026)",
        "url": "https://bolle.substack.com/",
        "timestamp": "32:10–41:50",
        "primary_triggers": [
            "estoque e fluxo", "estoque vs fluxo", "diferenca entre divida e deficit",
            "o que e deficit", "o que e superavit", "fluxo e estoque"
        ],
        "keywords": [
            "estoque", "fluxo", "deficit", "déficit", "superavit", "superávit", "diferenca"
        ],
        "synthesis": (
            "1️⃣ Em linguagem simples: Pense em uma caixa d'água. O FLUXO é a água que entra ou "
            "sai pelas válvulas a cada ano (o déficit ou superávit anual do governo). O ESTOQUE é "
            "o volume total acumulado dentro do reservatório ao longo de décadas (a Dívida Pública).\n\n"
            "2️⃣ Por que confundem os dois no debate? Fechar a válvula do fluxo primário (zerar o "
            "déficit do ano) impede que entre água nova pela tubulação fiscal, mas NÃO reduz "
            "automaticamente o estoque acumulado se o fluido que já está dentro do tanque estiver "
            "crescendo sozinho por causa dos juros (51,6% em LFTs indexadas à Selic).\n\n"
            "3️⃣ No Simulador 2D: As Válvulas 1 e 2 controlam o Fluxo Primário (T − G), enquanto "
            "o Tanque Hidráulico mostra o Estoque Total (DBGG em % do PIB)."
        ),
    },
    {
        "id": "canon_primario_nominal",
        "title": "Resultado Primário vs. Nominal e Dívida Bruta (DBGG) vs. Líquida (DLSP)",
        "source_id": "Fonte #4",
        "author": "André Lara Resende (Set/2026) & Monica de Bolle (13/11/2026)",
        "url": "https://andrelararesende.substack.com/p/eu-acuso-uma-proposta-para-eliminar",
        "timestamp": "09:15–15:50",
        "primary_triggers": [
            "primario e nominal", "primario vs nominal", "resultado primario", "resultado nominal",
            "divida bruta", "divida liquida", "dbgg", "dlsp", "diferenca entre bruta e liquida"
        ],
        "keywords": [
            "primario", "nominal", "dbgg", "dlsp", "bruta", "liquida", "1,15", "1,4"
        ],
        "synthesis": (
            "1️⃣ Resultado Primário vs. Nominal:\n"
            "• Resultado Primário (T − G): é a diferença entre o que o governo arrecada em impostos (T) "
            "e o que gasta na máquina pública e programas sociais (G), SEM contar os juros. Hoje está "
            "praticamente equilibrado (déficit < 0,6% do PIB).\n"
            "• Resultado Nominal: é o Primário somado à conta de juros da dívida (que consome de "
            "R$ 1,15 trilhão a R$ 1,4 trilhão/ano, ou 8,7% a 10,5% do PIB).\n\n"
            "2️⃣ Dívida Líquida (DLSP — 69,1% do PIB) vs. Dívida Bruta (DBGG — 82,9% do PIB):\n"
            "A Dívida Líquida desconta os ativos do país (como os US$ 350–360 bi de reservas "
            "internacionais). Já a Dívida Bruta (DBGG) soma apenas os passivos, incluindo o custo "
            "de carregamento das reservas e as perdas com swaps cambiais do Banco Central."
        ),
    },
    {
        "id": "canon_tanque_lft",
        "title": "O que é LFT (Tesouro Selic) e por que 51,6% geram Expansão Endógena",
        "source_id": "Fonte #7",
        "author": "Monica de Bolle (13/11/2026) & André Lara Resende (Set/2026)",
        "url": "https://bolle.substack.com/p/basicao-juros-divida-ajusteo-que",
        "timestamp": "16:07–34:15",
        "primary_triggers": [
            "que e lft", "o que e lft", "o que sao lfts", "tesouro selic", "51,6%", "51.6%",
            "expansao endogena", "camada autoexpansiva", "modalidades de titulos", "pre-fixado", "ipca+"
        ],
        "keywords": [
            "lft", "lfts", "tesouro selic", "51,6", "51.6", "38%", "tanque", "pos-fixada",
            "liquidez", "alongamento", "73,6", "6 anos", "swap", "expansao", "endogena"
        ],
        "synthesis": (
            "1️⃣ As 3 modalidades de títulos da dívida pública (Fonte #7 [16:07]):\n"
            "• Pré-fixados: taxa travada na emissão;\n"
            "• IPCA+ (NTN-B): inflação mais juro real;\n"
            "• Pós-fixados (LFT / Tesouro Selic): rendem 100% da taxa Selic diária.\n\n"
            "2️⃣ O problema estrutural (51,6% em LFTs): As LFTs saltaram de 38% (2022) para 51,6% "
            "da dívida em novembro de 2026. Embora tenham vencimento formal de ~6 anos (73,6 meses), "
            "possuem liquidez diária sem perda de valor (duration zero). Quando o BC sobe a Selic "
            "para conter a inflação, 51,6% do estoque da dívida cresce automaticamente no mesmo dia.\n\n"
            "3️⃣ No Simulador 2D: É a camada superior laranja do Tanque Hidráulico. Com a Coordenação "
            "CFMN + Swap gradual de LFTs (Controle 4) e queda calibrada da Selic (Controle 3), essa "
            "camada recua de 51,6% rumo a ~34%, gerando alívio imediato de ~4% do PIB."
        ),
    },
    {
        "id": "canon_transmissao_monetaria",
        "title": "O que é a Taxa Selic e Como Funciona a Caldeira Monetária",
        "source_id": "Fonte #2",
        "author": "Monica de Bolle (Basicão: Política Monetária, 06/11/2026)",
        "url": "https://bolle.substack.com/p/basicao-politica-monetaria",
        "timestamp": "08:30–36:40",
        "primary_triggers": [
            "o que e selic", "que e selic", "para que serve a selic", "como funciona a selic",
            "politica monetaria", "caldeira monetaria", "preco do dinheiro", "inflacao de demanda",
            "inflacao de oferta"
        ],
        "keywords": [
            "selic", "caldeira", "monetaria", "inflacao", "preco do dinheiro",
            "custo de oportunidade", "credito", "oferta", "demanda"
        ],
        "synthesis": (
            "1️⃣ Em linguagem simples: A Selic é o 'preço do dinheiro' na economia (Fonte #2 [08:30]). "
            "Ela age de duas formas: é o custo do crédito (para quem toma empréstimo ou financia) e "
            "o custo de oportunidade (quanto você ganha deixando o dinheiro parado em títulos públicos "
            "em vez de consumir ou investir na produção).\n\n"
            "2️⃣ Limite de eficácia (Demanda vs. Oferta): Subir a Selic encarece o crédito e esfria o "
            "Consumo (C) e o Investimento (I). Isso funciona quando a inflação é de DEMANDA (economia "
            "superaquecida), mas NÃO resolve choques de OFERTA (seca, alimentos, tarifa de energia) e "
            "ainda sobrecarrega o Tanque da Dívida via LFTs.\n\n"
            "3️⃣ No Simulador 2D: É a Estação 2 (Caldeira Monetária) e a Válvula 3."
        ),
    },
    {
        "id": "canon_falsa_racionalidade",
        "title": "Falsa Racionalidade & Aritmética Explosiva (r − g = +5,7% a.a.)",
        "source_id": "Fonte #4",
        "author": "André Lara Resende (Eu Acuso / J’Accuse & CEBRI)",
        "url": "https://andrelararesende.substack.com/p/eu-acuso-uma-proposta-para-eliminar",
        "timestamp": "Artigo Integral",
        "primary_triggers": [
            "falsa racionalidade", "r - g", "r-g", "eu acuso", "jaccuse", "j'accuse",
            "lara resende", "curva de phillips", "cfmn", "5,7%"
        ],
        "keywords": [
            "falsa racionalidade", "lara resende", "eu acuso", "jaccuse",
            "12,7%", "7,0%", "5,7%", "aritmetica", "dominancia", "phillips", "cfmn"
        ],
        "synthesis": (
            "1️⃣ O Conceito (André Lara Resende): É o erro de manter juros reais extremos achando que "
            "isso protege a moeda, quando na verdade o próprio juro se tornou a fonte primária do "
            "desequilíbrio fiscal (Dominância Financeira).\n\n"
            "2️⃣ A Aritmética Explosiva (r − g = +5,7% a.a.): Os juros fazem a dívida bruta crescer "
            "12,7% ao ano, enquanto o PIB nominal cresce 7,0% ao ano. Essa diferença (+5,7% a.a.) faz "
            "a razão Dívida/PIB saltar sozinha todo ano.\n\n"
            "3️⃣ A Solução Institucional (Controle 4): Criar o Conselho Fiscal-Monetário Nacional "
            "(CFMN), estabelecer bandas para a Selic e substituir gradualmente as LFTs."
        ),
    },
    {
        "id": "canon_cambio_derivativos",
        "title": "Câmbio Futuro ('O Rabo Abana o Cachorro'), PTAX, Reservas e Swaps",
        "source_id": "Fonte #6",
        "author": "Monica de Bolle & José Paulo Kupfer (12/11/2026)",
        "url": "https://bolle.substack.com/p/cambio-e-juros-com-jose-paulo-kupfer",
        "timestamp": "11:40–31:20",
        "primary_triggers": [
            "cambio futuro", "ptax", "rabo abana o cachorro", "swap cambial", "swaps",
            "reservas internacionais", "dolar", "derivativos"
        ],
        "keywords": [
            "cambio", "dolar", "ptax", "futuro", "derivativos", "rabo", "cachorro",
            "swaps", "reservas", "350 bi", "fmi", "2002"
        ],
        "synthesis": (
            "1️⃣ A Jabuticaba do Câmbio no Brasil (Fonte #6 [11:40]): Diferente de outros países, "
            "a taxa oficial de câmbio (PTAX) no Brasil nasce no mercado futuro da B3 (que gira "
            "US$ 20 a US$ 35 bilhões/dia em contratos liquidados em Reais) e não no dólar à vista "
            "(apenas US$ 1 a US$ 3 bilhões/dia). Ou seja: 'o rabo (derivativos) abana o cachorro (à vista)'.\n\n"
            "2️⃣ Swaps Cambiais e Reservas: Se o governo tenta baixar a Selic 'na marra' sem coordenação, "
            "o mercado futuro dispara apostas no dólar, pressiona a inflação na Caldeira e gera "
            "prejuízos nos swaps cambiais do BC (criados no acordo com o FMI em 2002), que entram "
            "direto na conta de juros da Dívida Bruta (DBGG)."
        ),
    },
    {
        "id": "canon_renuncias_tesouraco",
        "title": "Gastos Tributários (Renúncias de R$ 600–800 bi) vs. Armadilha do Tesouraço",
        "source_id": "Fonte #1",
        "author": "Monica de Bolle (30/10/2026) & Kupfer (05/11/2026)",
        "url": "https://bolle.substack.com/",
        "timestamp": "42:10–1:18:00",
        "primary_triggers": [
            "renuncias fiscais", "desoneracoes", "gastos tributarios", "tesouraco",
            "600 bi", "800 bi", "corte social", "ponte de coesao"
        ],
        "keywords": [
            "renuncias", "desoneracoes", "gastos tributarios", "600 bi", "800 bi",
            "tesouraco", "ponte", "coesao", "privilegios"
        ],
        "synthesis": (
            "1️⃣ O que são Gastos Tributários (Válvula 1): São isenções, desonerações e benefícios "
            "fiscais a setores específicos que somam de R$ 600 bi a R$ 800 bi por ano (~6% do PIB), "
            "muitas vezes sem geração comprovada de emprego ou produtividade.\n\n"
            "2️⃣ Por que o 'Tesouraço' falha (Válvula 2): Cortar investimentos públicos e proteção "
            "social (G) mantendo os R$ 600–800 bi de privilégios derruba o PIB (Y), reduz a própria "
            "arrecadação e colapsa a Ponte de Coesão Social, enquanto o Tanque continua subindo "
            "pela Selic nas LFTs."
        ),
    },
    {
        "id": "canon_conflito_distributivo",
        "title": "Conflito Distributivo e Transferência Regressiva via Juros",
        "source_id": "Fonte #5",
        "author": "Monica de Bolle & José Paulo Kupfer (05/11/2026)",
        "url": "https://bolle.substack.com/p/juros-divida-publica-e-politica-fiscal",
        "timestamp": "15:00–48:00",
        "primary_triggers": [
            "conflito distributivo", "transferencia de renda", "rentismo", "imposto regressivo"
        ],
        "keywords": [
            "conflito distributivo", "regressivo", "rentismo", "transferencia", "desigualdade"
        ],
        "synthesis": (
            "1️⃣ Em linguagem simples: O orçamento público define quem paga impostos e quem recebe "
            "recursos do Estado.\n\n"
            "2️⃣ O mecanismo regressivo: Quando o Brasil destina de 8,7% a 10,5% do PIB por ano ao "
            "pagamento de juros da dívida — financiado por tributos indiretos sobre o consumo da "
            "população —, ocorre uma transferência contínua de renda do setor produtivo e dos "
            "trabalhadores para os detentores de aplicações financeiras atreladas à Selic."
        ),
    },
    {
        "id": "canon_historia_planos",
        "title": "Cápsula Histórica: PAEG (1964), Cruzado (1986), Real (1994) e Crise (2015)",
        "source_id": "Fonte #1",
        "author": "Monica de Bolle & André Lara Resende",
        "url": "https://bolle.substack.com/",
        "timestamp": "Bloco Histórico",
        "primary_triggers": [
            "paeg", "plano cruzado", "plano real", "urv", "ortn", "crise de 2015", "historia"
        ],
        "keywords": [
            "paeg", "1964", "ortn", "cruzado", "1986", "congelamento", "plano real",
            "urv", "1994", "1999", "2015", "historia", "inercia"
        ],
        "synthesis": (
            "1️⃣ PAEG (1964–67): Criou o Banco Central, o CMN e a correção monetária (ORTN), "
            "viabilizando a dívida pública, mas iniciando a cultura de indexação.\n"
            "2️⃣ Plano Cruzado (1986): Tentou congelar preços por decreto com juros baixos na marra, "
            "gerando explosão de demanda e desabastecimento.\n"
            "3️⃣ Plano Real (1994): Usou a URV para coordenar expectativas e eliminar a hiperinflação "
            "inercial sem congelamento; porém, na crise externa de 1998–99, a difusão das LFTs "
            "reintroduziu a indexação financeira diária no estoque da dívida.\n"
            "4️⃣ Crise 2015–16: Combinação de desonerações improdutivas com contração fiscal abrupta "
            "e Selic a 14,25%, provocando recessão de ~7% no PIB."
        ),
    },
]


def parse_transcript_chunks(filepath: str, source_meta: dict[str, str]) -> list[dict[str, Any]]:
    """Agrupa linhas minutadas [MM:SS] em blocos semânticos de ~150 palavras."""
    if not os.path.isfile(filepath):
        return []

    with open(filepath, encoding="utf-8") as f:
        lines = f.readlines()

    chunks: list[dict[str, Any]] = []
    current_lines: list[str] = []
    current_words = 0
    start_ts = "00:00"
    last_ts = "00:00"
    chunk_idx = 1

    ts_pattern = re.compile(r"^\[(\d{2}:\d{2}(?::\d{2})?)\]\s*(.*)$")

    for raw_line in lines:
        line = raw_line.strip()
        if not line:
            continue
        m = ts_pattern.match(line)
        if m:
            ts, text = m.group(1), m.group(2)
            if not current_lines:
                start_ts = ts
            last_ts = ts
        else:
            text = line

        words = text.split()
        current_lines.append(text)
        current_words += len(words)

        if current_words >= 155:
            joined_text = " ".join(current_lines)
            chunks.append(
                {
                    "id": f"{source_meta['id'].lower().replace(' ', '').replace('#', '_')}_c{chunk_idx}",
                    "source_id": source_meta["id"],
                    "title": source_meta["title"],
                    "author": source_meta["author"],
                    "date": source_meta["date"],
                    "url": source_meta["url"],
                    "timestamp": f"{start_ts}–{last_ts}",
                    "text": joined_text,
                }
            )
            chunk_idx += 1
            current_lines = []
            current_words = 0

    if current_lines:
        joined_text = " ".join(current_lines)
        chunks.append(
            {
                "id": f"{source_meta['id'].lower().replace(' ', '').replace('#', '_')}_c{chunk_idx}",
                "source_id": source_meta["id"],
                "title": source_meta["title"],
                "author": source_meta["author"],
                "date": source_meta["date"],
                "url": source_meta["url"],
                "timestamp": f"{start_ts}–{last_ts}",
                "text": joined_text,
            }
        )

    return chunks


def build_index() -> dict[str, Any]:
    """Constrói o índice completo a partir das fontes homologadas."""
    os.makedirs(DATA_DIR, exist_ok=True)
    all_chunks: list[dict[str, Any]] = []

    for key, meta in OFFICIAL_SOURCES.items():
        fname = meta.get("file")
        if fname:
            fpath = os.path.join(TRANSCRICOES_DIR, fname)
            all_chunks.extend(parse_transcript_chunks(fpath, meta))

    payload: dict[str, Any] = {
        "metadata": {
            "project": "ChangeMacro — Engenharia da Estabilidade (Basicão 2.0)",
            "author": "José Eduardo dos Santos • Holding Change (ChangeMacro)",
            "generated_at": datetime.now(timezone.utc).isoformat(),
            "total_official_sources": len(OFFICIAL_SOURCES),
            "total_canonical_topics": len(CANONICAL_TOPICS),
            "total_transcript_chunks": len(all_chunks),
            "strict_scope_policy": (
                "Responder exclusivamente com base nas 7 fontes homologadas no projeto "
                "e nos parâmetros físicos do Simulador 2D."
            ),
        },
        "sources": list(OFFICIAL_SOURCES.values()),
        "canonical_topics": CANONICAL_TOPICS,
        "transcript_chunks": all_chunks,
    }

    json_path = os.path.join(DATA_DIR, "knowledge_index.json")
    with open(json_path, "w", encoding="utf-8") as f:
        json.dump(payload, f, ensure_ascii=False, indent=2)

    js_path = os.path.join(DATA_DIR, "knowledge_index.js")
    with open(js_path, "w", encoding="utf-8") as f:
        f.write("// Arquivo gerado automaticamente por src/ai/build_knowledge_base.py\n")
        f.write("window.ChangeMacroKnowledgeIndex = ")
        json.dump(payload, f, ensure_ascii=False)
        f.write(";\n")

    return payload


if __name__ == "__main__":
    index_data = build_index()
    print(
        f"[OK] Índice homologado gerado: "
        f"{index_data['metadata']['total_official_sources']} fontes oficiais, "
        f"{index_data['metadata']['total_canonical_topics']} tópicos canônicos, "
        f"{index_data['metadata']['total_transcript_chunks']} blocos minutados."
    )
