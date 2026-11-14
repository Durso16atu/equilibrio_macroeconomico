#!/usr/bin/env python3
"""
Conector Python Oficial (Lei #3: SDK `google-genai` + `Pydantic`) para o Consultor ChangeMacro.

Realiza a busca determinística no índice local homologado (`src/data/knowledge_index.json`)
e, caso `GEMINI_API_KEY` esteja presente no ambiente, utiliza o SDK oficial `google-genai`
com resposta estruturada via Pydantic (`ConsultorMacroResponse`), garantindo escopo
100% restrito às 7 fontes homologadas do projeto.
"""

from __future__ import annotations

from dataclasses import asdict, dataclass, field
import json
import os
import re
from typing import Any
import unicodedata

try:
    from pydantic import BaseModel, Field

    HAS_PYDANTIC = True
except ImportError:
    HAS_PYDANTIC = False

ROOT_DIR = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
INDEX_JSON_PATH = os.path.join(ROOT_DIR, "src", "data", "knowledge_index.json")

if HAS_PYDANTIC:

    class CitacaoHomologada(BaseModel):  # type: ignore[no-redef]
        """Citação verificável de uma fonte homologada no projeto."""

        fonte_id: str = Field(description="Identificador da fonte (ex: Fonte #1 a Fonte #7)")
        autor_titulo: str = Field(description="Autor e título da fonte homologada")
        minutagem: str = Field(description="Minutagem [MM:SS] ou seção do documento")
        url: str = Field(description="URL oficial no Substack")

    class ConsultorMacroResponse(BaseModel):  # type: ignore[no-redef]
        """Schema Pydantic estrito para respostas do Consultor ChangeMacro (Lei #3)."""

        dentro_do_escopo: bool = Field(
            description="True somente se a pergunta puder ser respondida pelas 7 fontes homologadas."
        )
        resposta_engenharia: str = Field(
            description="Explicação objetiva usando a linguagem de Engenharia do Simulador (Tanque, Caldeira, Ponte)."
        )
        citacoes: list[CitacaoHomologada] = Field(
            default_factory=list,
            description="Lista de fontes homologadas utilizadas na resposta.",
        )

else:

    @dataclass
    class CitacaoHomologada:
        """Citação verificável de uma fonte homologada no projeto."""

        fonte_id: str
        autor_titulo: str
        minutagem: str
        url: str

    @dataclass
    class ConsultorMacroResponse:
        """Schema estruturado para respostas do Consultor ChangeMacro."""

        dentro_do_escopo: bool
        resposta_engenharia: str
        citacoes: list[CitacaoHomologada] = field(default_factory=list)

        def model_dump(self) -> dict[str, Any]:
            return asdict(self)


def normalize_text(text: str) -> str:
    """Remove acentos e normaliza para busca léxica."""
    nfkd = unicodedata.normalize("NFKD", text.lower())
    cleaned = "".join(c for c in nfkd if not unicodedata.combining(c))
    return re.sub(r"[^a-z0-9\s%.,-]", " ", cleaned)


STOPWORDS_PT = {
    "qual", "quais", "como", "para", "porque", "por", "que", "uma", "uns", "umas",
    "dos", "das", "nos", "nas", "com", "sem", "mais", "menos", "sobre", "entre",
    "isso", "isto", "esse", "essa", "este", "esta", "pelo", "pela", "seu", "sua",
    "meu", "minha", "tem", "sao", "foi", "ser", "esta", "estao", "fazer", "jogo"
}

DOMAIN_VOCAB = {
    "selic", "juro", "juros", "divida", "pib", "lft", "lfts", "tesouro", "tanque",
    "caldeira", "ponte", "valvula", "fiscal", "monetaria", "cambio", "dolar", "ptax",
    "swap", "swaps", "futuro", "derivativo", "derivativos", "reservas", "fmi",
    "inflacao", "demanda", "oferta", "consumo", "investimento", "gasto", "gastos",
    "renuncia", "renuncias", "desoneracao", "desoneracoes", "tesouraco", "negacionismo",
    "cfmn", "lara", "resende", "bolle", "monica", "kupfer", "orenstein", "jaccuse",
    "racionalidade", "phillips", "primario", "nominal", "dbgg", "dlsp", "estoque",
    "fluxo", "paeg", "cruzado", "real", "urv", "ortn", "indexacao", "simulador",
    "estabilidade", "51,6%", "51.6%", "52%", "82,9%", "corte", "cortes", "reforma",
    "tabelamento", "meta", "habito", "comportamental", "circular", "bola", "neve", "inacabada"
}


def retrieve_homologated_context(query: str, top_k: int = 3) -> dict[str, Any]:
    """Busca determinística nos tópicos canônicos e blocos minutados do índice homologado."""
    if not os.path.isfile(INDEX_JSON_PATH):
        raise FileNotFoundError(f"Índice não encontrado em {INDEX_JSON_PATH}")

    with open(INDEX_JSON_PATH, encoding="utf-8") as f:
        index = json.load(f)

    norm_query = normalize_text(query)
    raw_tokens = [t for t in norm_query.split() if len(t) >= 3 and t not in STOPWORDS_PT]
    has_domain_token = any(t in DOMAIN_VOCAB for t in raw_tokens)

    scored_canon: list[tuple[float, dict[str, Any]]] = []
    for item in index.get("canonical_topics", []):
        score = 0.0
        haystack = normalize_text(
            item["title"] + " " + item["synthesis"] + " " + " ".join(item["keywords"])
        )
        for trig in item.get("primary_triggers", []):
            if normalize_text(trig) in norm_query:
                score += 25.0
        for kw in item["keywords"]:
            if normalize_text(kw) in norm_query:
                score += 6.0
        for tok in raw_tokens:
            if tok in DOMAIN_VOCAB and tok in normalize_text(item["title"]):
                score += 4.5
            elif tok in DOMAIN_VOCAB and tok in haystack:
                score += 1.5
        if score > 0:
            scored_canon.append((score, item))

    scored_canon.sort(key=lambda x: x[0], reverse=True)

    scored_chunks: list[tuple[float, dict[str, Any]]] = []
    if has_domain_token:
        for chunk in index.get("transcript_chunks", []):
            score = 0.0
            haystack = normalize_text(chunk["text"] + " " + chunk["title"])
            for tok in raw_tokens:
                if tok in DOMAIN_VOCAB:
                    count = haystack.count(tok)
                    if count > 0:
                        score += 2.5 + min(count, 4) * 0.5
            if score > 0:
                scored_chunks.append((score, chunk))

        scored_chunks.sort(key=lambda x: x[0], reverse=True)

    in_scope = has_domain_token and bool(
        (scored_canon and scored_canon[0][0] >= 2.5)
        or (scored_chunks and scored_chunks[0][0] >= 2.5)
    )

    return {
        "in_scope": in_scope,
        "canonical_matches": [c[1] for c in scored_canon[:1]],
        "chunk_matches": [c[1] for c in scored_chunks[:top_k]],
    }


def answer_query(query: str, api_key: str | None = None) -> ConsultorMacroResponse:
    """
    Responde a uma pergunta do usuário exclusivamente com os dados homologados.
    Se `api_key` (ou `GEMINI_API_KEY`) estiver disponível, utiliza o SDK oficial `google-genai`
    com schema estruturado Pydantic; caso contrário, utiliza o sintetizador determinístico local.
    """
    ctx = retrieve_homologated_context(query)
    if not ctx["in_scope"]:
        return ConsultorMacroResponse(
            dentro_do_escopo=False,
            resposta_engenharia=(
                "🔒 Fora do Escopo Homologado: O Consultor ChangeMacro responde exclusivamente "
                "com base nas 7 fontes homologadas no projeto (Monica de Bolle, André Lara Resende "
                "e José Paulo Kupfer) e nos parâmetros de engenharia do Simulador 2D."
            ),
            citacoes=[],
        )

    resolved_key = api_key or os.environ.get("GEMINI_API_KEY")
    if resolved_key:
        from google import genai
        from google.genai import types

        client = genai.Client(api_key=resolved_key)
        prompt_context = json.dumps(ctx, ensure_ascii=False, indent=2)
        sys_instruction = (
            "Você é o Consultor ChangeMacro, assistente de engenharia macroeconômica do simulador "
            "Basicão de Economia 2.0 (autoria de José Eduardo dos Santos • Holding Change). "
            "REGRA INEGOCIÁVEL: Responda EXCLUSIVAMENTE com base nos dados contidos no JSON "
            "de contexto homologado abaixo. Use a terminologia de engenharia do app "
            "(Tanque Hidráulico da Dívida, Camada Autoexpansiva de 51,6% em LFTs, Caldeira Monetária, "
            "Válvulas de Fluxo Primário e Ponte de Coesão Social). Se a pergunta fugir do contexto, "
            "defina dentro_do_escopo=False."
        )
        response = client.models.generate_content(
            model="gemini-2.5-flash",
            contents=f"CONTEXTO HOMOLOGADO:\n{prompt_context}\n\nPERGUNTA DO USUÁRIO:\n{query}",
            config=types.GenerateContentConfig(
                system_instruction=sys_instruction,
                response_mime_type="application/json",
                response_schema=ConsultorMacroResponse,
                temperature=0.1,
            ),
        )
        return ConsultorMacroResponse.model_validate_json(response.text)

    # Fallback determinístico local 100% homologado
    citacoes: list[CitacaoHomologada] = []
    parts: list[str] = []

    for canon in ctx["canonical_matches"]:
        parts.append(f"**{canon['title']}:** {canon['synthesis']}")
        citacoes.append(
            CitacaoHomologada(
                fonte_id=canon["source_id"],
                autor_titulo=f"{canon['author']} — {canon['title']}",
                minutagem=canon["timestamp"],
                url=canon["url"],
            )
        )

    for chk in ctx["chunk_matches"][:2]:
        if not parts:
            parts.append(f"Trecho homologado ({chk['source_id']} [{chk['timestamp']}]): \"{chk['text'][:320]}...\"")
        citacoes.append(
            CitacaoHomologada(
                fonte_id=chk["source_id"],
                autor_titulo=f"{chk['author']} — {chk['title']}",
                minutagem=chk["timestamp"],
                url=chk["url"],
            )
        )

    return ConsultorMacroResponse(
        dentro_do_escopo=True,
        resposta_engenharia="\n\n".join(parts),
        citacoes=citacoes[:3],
    )
