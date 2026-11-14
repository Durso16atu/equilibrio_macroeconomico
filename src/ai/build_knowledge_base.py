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

import json
import os
import re
from datetime import datetime, timezone
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

# Tópicos Canônicos de Engenharia Homologados (Sínteses de Alta Precisão)
CANONICAL_TOPICS: list[dict[str, Any]] = [
    {
        "id": "canon_tanque_lft",
        "title": "Tanque Hidráulico da Dívida & Expansão Endógena das LFTs (51,6%)",
        "source_id": "Fonte #7",
        "author": "Monica de Bolle (13/11/2026) & André Lara Resende (Set/2026)",
        "url": "https://bolle.substack.com/p/basicao-juros-divida-ajusteo-que",
        "timestamp": "16:07–34:15",
        "keywords": [
            "lft", "tesouro selic", "51,6", "51.6", "38%", "tanque", "divida", "dívida",
            "estoque", "pos-fixada", "pós-fixada", "liquidez", "alongamento", "73,6",
            "6 anos", "swap", "expansao endogena", "expansão endógena", "camada autoexpansiva"
        ],
        "synthesis": (
            "As Letras Financeiras do Tesouro (LFTs / Tesouro Selic) saltaram de 38% (2022) "
            "para 51,6% da dívida pública em novembro de 2026. Embora o prazo contratual médio "
            "seja de ~6 anos (73,6 meses), elas possuem liquidez diária sem marcação a mercado "
            "(duration zero). No Tanque Hidráulico do simulador, essa fração de 51,6% compõe a "
            "camada superior autoexpansiva: cada alta da Selic expande o estoque da dívida "
            "automaticamente, mesmo com as válvulas do resultado primário fechadas. Em contrapartida, "
            "uma redução coordenada da Selic combinada a swaps graduais de dívida gera alívio "
            "imediato sobre o estoque."
        ),
    },
    {
        "id": "canon_falsa_racionalidade",
        "title": "Falsa Racionalidade & Aritmética Explosiva (r − g = +5,7% a.a.)",
        "source_id": "Fonte #4",
        "author": "André Lara Resende (Eu Acuso / J’Accuse & CEBRI)",
        "url": "https://andrelararesende.substack.com/p/eu-acuso-uma-proposta-para-eliminar",
        "timestamp": "Artigo Integral",
        "keywords": [
            "falsa racionalidade", "lara resende", "eu acuso", "jaccuse", "j'accuse",
            "r - g", "r-g", "12,7%", "7,0%", "5,7%", "aritmética", "aritmetica",
            "dominancia", "dominância", "curva de phillips", "cfmn", "conselho"
        ],
        "synthesis": (
            "André Lara Resende demonstra que o resultado primário brasileiro está próximo do "
            "equilíbrio (déficit < 0,6% do PIB), mas o serviço de juros consome de R$ 1,15 trilhão "
            "(8,7% do PIB na DLSP) a R$ 1,4 trilhão (10,5% do PIB na DBGG). Com os juros fazendo "
            "a dívida crescer 12,7% a.a. contra 7,0% a.a. do PIB nominal, a razão Dívida/PIB "
            "salta +5,7% ao ano por inércia financeira. Com a Curva de Phillips achatada, "
            "elevar juros para conter choques de oferta é uma 'falsa racionalidade' que agrava "
            "o risco fiscal e deprecia o câmbio. A saída estrutural é a criação do Conselho "
            "Fiscal-Monetário Nacional (CFMN), bandas para a Selic e alongamento efetivo da dívida."
        ),
    },
    {
        "id": "canon_cambio_derivativos",
        "title": "Mercado Futuro de Câmbio ('O Rabo Abana o Cachorro'), PTAX e Swaps",
        "source_id": "Fonte #6",
        "author": "Monica de Bolle & José Paulo Kupfer (12/11/2026)",
        "url": "https://bolle.substack.com/p/cambio-e-juros-com-jose-paulo-kupfer",
        "timestamp": "11:40–31:20",
        "keywords": [
            "cambio", "câmbio", "dolar", "dólar", "ptax", "futuro", "derivativos",
            "rabo abana o cachorro", "kupfer", "swaps", "swap cambial", "reservas",
            "350 bi", "fmi", "2002", "b3", "especulacao", "especulação"
        ],
        "synthesis": (
            "No Brasil, a taxa de câmbio PTAX é formada no mercado futuro de derivativos da B3 "
            "(que movimenta US$ 20 a US$ 35 bilhões/dia, liquidados em Reais sem entrega física) "
            "e não no mercado à vista (apenas US$ 1 a US$ 3 bilhões/dia): 'o rabo abana o cachorro'. "
            "Por isso, tentar reduzir a Selic 'na marra' sem coordenação dispara apostas especulativas "
            "nos derivativos, pressiona a PTAX, gera prejuízos nos swaps cambiais do Banco Central "
            "(criados no acordo com o FMI em 2002) e encarece o custo de carregamento das reservas "
            "internacionais (~US$ 350–360 bi), inflando a Dívida Bruta (DBGG) e a Caldeira Monetária."
        ),
    },
    {
        "id": "canon_renuncias_tesouraco",
        "title": "Gastos Tributários (Renúncias de R$ 600–800 bi) vs. Armadilha do Tesouraço",
        "source_id": "Fonte #1",
        "author": "Monica de Bolle (30/10/2026) & Kupfer (05/11/2026)",
        "url": "https://bolle.substack.com/",
        "timestamp": "42:10–1:18:00",
        "keywords": [
            "renuncias", "renúncias", "desoneracoes", "desonerações", "gastos tributarios",
            "gastos tributários", "600 bi", "800 bi", "tesouraco", "tesouraço", "corte",
            "ponte", "coesao social", "coesão social", "pib", "demanda agregada", "privilegios"
        ],
        "synthesis": (
            "O orçamento brasileiro carrega entre R$ 600 bilhões e R$ 800 bilhões/ano (~6% do PIB) "
            "em gastos tributários (desonerações e privilégios fiscais sem contrapartida). "
            "A 'Armadilha do Tesouraço' consiste em preservar esses privilégios e estrangular "
            "investimentos públicos e proteção social (G). Na identidade Y = C + I + G + (X - M), "
            "cortar G abruptamente contrai o denominador (PIB), reduz a arrecadação, rompe a "
            "Ponte de Coesão Social e não estanca a expansão das LFTs no Tanque da Dívida. "
            "O ajuste eficiente revisa desonerações improdutivas (Válvula 1) preservando o PIB."
        ),
    },
    {
        "id": "canon_transmissao_monetaria",
        "title": "Caldeira Monetária: Juros como Preço do Dinheiro e Canal de Transmissão",
        "source_id": "Fonte #2",
        "author": "Monica de Bolle (06/11/2026)",
        "url": "https://bolle.substack.com/p/basicao-politica-monetaria",
        "timestamp": "08:30–36:40",
        "keywords": [
            "politica monetaria", "política monetária", "caldeira", "inflacao", "inflação",
            "selic", "preco do dinheiro", "preço do dinheiro", "custo de oportunidade",
            "credito", "crédito", "consumo", "investimento", "demanda", "oferta"
        ],
        "synthesis": (
            "A taxa básica de juros (Selic) funciona sob duas óticas: custo de oportunidade "
            "(para quem aplica em títulos) e preço do crédito (para famílias e empresas). "
            "Quando o BC sobe a Selic (i ↑), encarece o crédito e incentiva a poupança financeira, "
            "freando o Consumo (C) e o Investimento (I) para esfriar a Demanda Agregada. "
            "Porém, esse mecanismo só é eficaz contra inflação de demanda; diante de choques "
            "de oferta (alimentos, energia, clima) ou com 51,6% da dívida indexada à própria Selic, "
            "juros extremos travam o investimento produtivo (Y ↓) e realimentam o custo fiscal."
        ),
    },
    {
        "id": "canon_conflito_distributivo",
        "title": "Conflito Distributivo e Transferência Regressiva via Juros",
        "source_id": "Fonte #5",
        "author": "Monica de Bolle & José Paulo Kupfer (05/11/2026)",
        "url": "https://bolle.substack.com/p/juros-divida-publica-e-politica-fiscal",
        "timestamp": "15:00–48:00",
        "keywords": [
            "conflito distributivo", "regressivo", "rentismo", "transferencia", "transferência",
            "impostos", "orcamento", "orçamento", "kupfer", "desigualdade", "distribuicao"
        ],
        "synthesis": (
            "O orçamento público reflete o conflito distributivo da sociedade. Quando o Estado "
            "drena de 8,7% a 10,5% do PIB por ano para pagar juros nominais sobre a dívida "
            "pública — financiado por um sistema tributário regressivo sobre o consumo —, "
            "ocorre uma transferência contínua de renda da base produtiva e dos contribuintes "
            "para os detentores de riqueza financeira líquida indexada ao overnight."
        ),
    },
    {
        "id": "canon_historia_planos",
        "title": "Cápsula Histórica: PAEG (1964), Cruzado (1986), Real (1994) e Crise (2015)",
        "source_id": "Fonte #1",
        "author": "Monica de Bolle & André Lara Resende",
        "url": "https://bolle.substack.com/",
        "timestamp": "Bloco Histórico",
        "keywords": [
            "paeg", "1964", "ortn", "cruzado", "1986", "congelamento", "plano real",
            "urv", "1994", "1999", "2015", "historia", "história", "inercia", "inércia"
        ],
        "synthesis": (
            "O Bloco 2 do simulador resgata 4 marcos estruturais: (1) PAEG 1964–67 (Roberto Campos "
            "e Bulhões): criou o BC, o CMN e a correção monetária (ORTN), viabilizando o mercado "
            "de títulos mas plantando a semente da indexação; (2) Plano Cruzado 1986: tentou "
            "congelar preços no grito com expansão de demanda, gerando desabastecimento; "
            "(3) Plano Real 1994 (Lara Resende, Persio Arida e equipe): usou a URV para alinhar "
            "preços relativos e quebrar a inércia sem congelamento, mas a criação das LFTs na "
            "crise de 1998–99 perpetuou a indexação no overnight; (4) Crise 2015–16: combinação "
            "de desonerações sem retorno com choque recessivo e Selic a 14,25%."
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
