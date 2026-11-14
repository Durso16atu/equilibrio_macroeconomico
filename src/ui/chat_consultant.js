/**
 * Consultor ChangeMacro — Assistente de Engenharia Macroeconômica (RAG Estrito + Google AI Studio).
 *
 * Opera exclusivamente sobre o Índice Local Homologado (window.ChangeMacroKnowledgeIndex)
 * e a telemetria ao vivo dos 4 controles do Simulador 2D (window.MacroEngine.calculateMacroState).
 * Suporta conexão direta com Google AI Studio (gemini-2.5-flash com Structured Outputs JSON)
 * ou Proxy gratuito via Google Apps Script.
 */

window.ChangeMacroConsultant = (function () {
  const STORAGE_KEY_API = "changemacro_ai_studio_key";
  const STORAGE_KEY_PROXY = "changemacro_apps_script_url";
  const GEMINI_MODEL = "gemini-2.5-flash";

  let isOpen = false;
  let isConfigOpen = false;
  let lastSuccessfulQuery = "Diagnosticar meu painel atual de engenharia e explicar LFTs 51,6%";

  // Vocabulário amplo do domínio macroeconômico e de engenharia do simulador
  const DOMAIN_TERMS = [
    "selic", "juro", "juros", "divida", "dívida", "pib", "lft", "lfts", "tesouro",
    "tanque", "caldeira", "ponte", "valvula", "válvula", "fiscal", "monetaria", "monetária",
    "cambio", "câmbio", "dolar", "dólar", "ptax", "swap", "swaps", "futuro", "derivativo",
    "derivativos", "reservas", "fmi", "inflacao", "inflação", "demanda", "oferta", "consumo",
    "investimento", "gasto", "gastos", "renuncia", "renúncias", "renuncias", "desoneracao",
    "desonerações", "desoneracoes", "tesouraco", "tesouraço", "negacionismo", "cfmn",
    "lara", "resende", "bolle", "monica", "kupfer", "orenstein", "jaccuse", "j'accuse", "acuso",
    "racionalidade", "phillips", "primario", "primário", "nominal", "dbgg", "dlsp",
    "estoque", "fluxo", "paeg", "cruzado", "real", "urv", "ortn", "indexacao", "indexação",
    "painel", "cenário", "cenario", "simulador", "hp", "estabilidade", "r-g", "r - g", "51,6",
    "51.6", "38%", "82,9", "600", "800", "corte", "cortes", "social", "reforma", "equilibrio",
    "equilíbrio", "economia", "ajuste", "orcamento", "orçamento", "imposto", "tributario",
    "credito", "crédito", "preço", "preco", "planta", "hidraulico", "hidráulico"
  ];

  // Comandos curtos de continuação de conversa
  const FOLLOWUP_TERMS = [
    "explique", "explica", "detalhe", "detalhar", "como assim", "por que", "porque",
    "resuma", "resumo", "exemplo", "na pratica", "na prática", "ajuda", "oi", "ola", "olá"
  ];

  function normalize(str) {
    return (str || "")
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9\s%.,-]/g, " ")
      .replace(/\s+/g, " ")
      .trim();
  }

  function getLiveSimulatorState() {
    try {
      if (!window.MacroEngine || typeof window.MacroEngine.calculateMacroState !== "function") {
        return null;
      }
      const elRen = document.getElementById("s-renuncias");
      const elCor = document.getElementById("s-cortes");
      const elSel = document.getElementById("s-selic");
      const elRef = document.getElementById("s-reforma");
      if (!elRen || !elCor || !elSel || !elRef) return null;

      const params = {
        renuncias: parseFloat(elRen.value) || 50,
        cortes: parseFloat(elCor.value) || 20,
        selic: parseFloat(elSel.value) || 13.75,
        reforma: parseFloat(elRef.value) || 20,
        externalWind: 0
      };
      return window.MacroEngine.calculateMacroState(params);
    } catch (e) {
      return null;
    }
  }

  function searchHomologatedIndex(rawQuery) {
    const index = window.ChangeMacroKnowledgeIndex;
    if (!index) {
      return { inScope: false, isPanelDiag: false, canonicals: [], chunks: [] };
    }

    let normQ = normalize(rawQuery);
    const isFollowUp = FOLLOWUP_TERMS.some((ft) => normQ === normalize(ft) || normQ.startsWith(normalize(ft) + " "));
    if (isFollowUp && normQ.split(" ").length <= 3) {
      normQ = normalize(lastSuccessfulQuery + " " + rawQuery);
    }

    const tokens = normQ.split(/\s+/).filter((t) => t.length >= 2);

    const isPanelDiag =
      normQ.includes("painel") ||
      normQ.includes("meu cenario") ||
      normQ.includes("minha simulacao") ||
      normQ.includes("diagnosticar") ||
      normQ.includes("planta") ||
      normQ.includes("configuracao atual");

    const hasDomainTerm =
      DOMAIN_TERMS.some((term) => normQ.includes(normalize(term))) || isPanelDiag || isFollowUp;

    const scoredCanon = [];
    (index.canonical_topics || []).forEach((topic) => {
      let score = 0;
      const hay = normalize(
        topic.title + " " + topic.synthesis + " " + (topic.keywords || []).join(" ")
      );
      (topic.keywords || []).forEach((kw) => {
        const nkw = normalize(kw);
        if (nkw && normQ.includes(nkw)) score += 7.0;
      });
      tokens.forEach((tok) => {
        if (tok.length >= 3 && hay.includes(tok)) score += 2.5;
      });
      if (score > 0) scoredCanon.push({ score, topic });
    });
    scoredCanon.sort((a, b) => b.score - a.score);

    const scoredChunks = [];
    (index.transcript_chunks || []).forEach((chk) => {
      let score = 0;
      const hay = normalize(chk.text + " " + chk.title);
      tokens.forEach((tok) => {
        if (tok.length >= 3 && hay.includes(tok)) score += 2.0;
      });
      if (score > 0) scoredChunks.push({ score, chk });
    });
    scoredChunks.sort((a, b) => b.score - a.score);

    const topCanonScore = scoredCanon.length ? scoredCanon[0].score : 0;
    const topChunkScore = scoredChunks.length ? scoredChunks[0].score : 0;
    const inScope = isPanelDiag || (hasDomainTerm && (topCanonScore >= 2.0 || topChunkScore >= 2.0));

    if (inScope && !isFollowUp) {
      lastSuccessfulQuery = rawQuery;
    }

    return {
      inScope,
      isPanelDiag,
      canonicals: scoredCanon.slice(0, 2).map((x) => x.topic),
      chunks: scoredChunks.slice(0, 3).map((x) => x.chk)
    };
  }

  function buildLocalDeterministicAnswer(query, retrieval, liveState) {
    if (!retrieval.inScope) {
      return {
        dentro_do_escopo: false,
        resposta_engenharia:
          "🔒 Fora do Escopo Homologado: O Consultor ChangeMacro responde exclusivamente com base nas 7 fontes homologadas no projeto (Monica de Bolle, André Lara Resende e José Paulo Kupfer) e nos parâmetros de engenharia do Simulador 2D.",
        analise_painel_atual: "",
        citacoes: []
      };
    }

    const paragraphs = [];
    const citacoes = [];

    if (retrieval.isPanelDiag && liveState) {
      paragraphs.push(
        `• Diagnóstico da Planta Atual: ${liveState.statusText}\n${liveState.failureReason}`
      );
    }

    if (retrieval.canonicals.length > 0) {
      retrieval.canonicals.forEach((c) => {
        paragraphs.push(`• ${c.title}:\n${c.synthesis}`);
        citacoes.push({
          fonte_id: c.source_id,
          autor_titulo: `${c.author} — ${c.title}`,
          minutagem: c.timestamp,
          url: c.url
        });
      });
    } else if (retrieval.chunks.length > 0) {
      const top = retrieval.chunks[0];
      paragraphs.push(
        `• Trecho Homologado (${top.source_id} [${top.timestamp}]):\n"${top.text.slice(0, 360)}..."`
      );
    }

    retrieval.chunks.slice(0, 2).forEach((chk) => {
      if (!citacoes.some((c) => c.fonte_id === chk.source_id && c.minutagem === chk.timestamp)) {
        citacoes.push({
          fonte_id: chk.source_id,
          autor_titulo: `${chk.author} — ${chk.title}`,
          minutagem: chk.timestamp,
          url: chk.url
        });
      }
    });

    let analisePainel = "";
    if (liveState) {
      analisePainel =
        `Tanque da Dívida: ${liveState.dividaProj.toFixed(1).replace(".", ",")}% do PIB ` +
        `(Camada Autoexpansiva LFT: ${liveState.lftShare.toFixed(1).replace(".", ",")}%) | ` +
        `Selic: ${liveState.selic.toFixed(2).replace(".", ",")}% a.a. | ` +
        `PIB (Y): ${liveState.pibGrowth >= 0 ? "+" : ""}${liveState.pibGrowth.toFixed(1).replace(".", ",")}% | ` +
        `Estabilidade: ${liveState.hp}/100 HP.`;
    }

    return {
      dentro_do_escopo: true,
      resposta_engenharia: paragraphs.join("\n\n"),
      analise_painel_atual: analisePainel,
      citacoes: citacoes.slice(0, 3)
    };
  }

  async function callGoogleAIStudio(query, retrieval, liveState, apiKey, proxyUrl) {
    const contextPayload = {
      regras_estritas:
        "Responda EXCLUSIVAMENTE com base nas fontes homologadas abaixo e na telemetria da planta 2D. " +
        "Use a terminologia de engenharia do app (Tanque Hidráulico, Camada Autoexpansiva de LFTs 51,6%, " +
        "Caldeira Monetária, Válvulas do Primário e Ponte de Coesão Social).",
      telemetria_planta_2d: liveState
        ? {
            divida_pib_proj: liveState.dividaProj,
            lft_share_pct: liveState.lftShare,
            selic_aa: liveState.selic,
            renuncias_revisadas_bi: liveState.renuncias,
            corte_social_bi: liveState.cortes,
            coordenacao_cfmn_pct: liveState.reforma,
            pib_growth_pct: liveState.pibGrowth,
            hp_estabilidade: liveState.hp,
            status_planta: liveState.statusText,
            diagnostico_motor: liveState.failureReason
          }
        : null,
      topicos_canonicos_homologados: retrieval.canonicals,
      trechos_transcricoes_minutados: retrieval.chunks
    };

    const responseSchema = {
      type: "OBJECT",
      properties: {
        dentro_do_escopo: { type: "BOOLEAN" },
        resposta_engenharia: { type: "STRING" },
        analise_painel_atual: { type: "STRING" },
        citacoes: {
          type: "ARRAY",
          items: {
            type: "OBJECT",
            properties: {
              fonte_id: { type: "STRING" },
              autor_titulo: { type: "STRING" },
              minutagem: { type: "STRING" },
              url: { type: "STRING" }
            },
            required: ["fonte_id", "autor_titulo", "minutagem", "url"]
          }
        }
      },
      required: ["dentro_do_escopo", "resposta_engenharia", "analise_painel_atual", "citacoes"]
    };

    const bodyData = {
      systemInstruction: {
        parts: [
          {
            text:
              "Você é o Consultor ChangeMacro (Holding Change • Autoria: José Eduardo dos Santos). " +
              "Responda exclusivamente com os dados homologados no JSON fornecido."
          }
        ]
      },
      contents: [
        {
          role: "user",
          parts: [
            {
              text:
                "CONTEXTO HOMOLOGADO DO PROJETO:\n" +
                JSON.stringify(contextPayload) +
                "\n\nPERGUNTA DO KEY USER:\n" +
                query
            }
          ]
        }
      ],
      generationConfig: {
        temperature: 0.15,
        responseMimeType: "application/json",
        responseSchema: responseSchema
      }
    };

    const endpoint = proxyUrl
      ? proxyUrl
      : `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${encodeURIComponent(apiKey)}`;

    const res = await fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(bodyData)
    });

    if (!res.ok) {
      throw new Error(`HTTP ${res.status}`);
    }

    const data = await res.json();
    const rawText =
      data?.candidates?.[0]?.content?.parts?.[0]?.text ||
      (typeof data === "string" ? data : JSON.stringify(data));
    return JSON.parse(rawText);
  }

  function renderMessageBubble(role, payload) {
    const container = document.getElementById("cm-chat-messages");
    if (!container) return;

    const wrapper = document.createElement("div");
    if (role === "user") {
      wrapper.style.display = "flex";
      wrapper.style.justifyContent = "flex-end";
      const bubble = document.createElement("div");
      bubble.style.maxWidth = "85%";
      bubble.style.backgroundColor = "#0e7490";
      bubble.style.color = "#ffffff";
      bubble.style.border = "1px solid #22d3ee";
      bubble.style.borderRadius = "12px 12px 2px 12px";
      bubble.style.padding = "8px 12px";
      bubble.style.fontSize = "12.5px";
      bubble.style.fontWeight = "600";
      bubble.style.boxShadow = "0 4px 12px rgba(0,0,0,0.35)";
      bubble.textContent = payload;
      wrapper.appendChild(bubble);
    } else {
      wrapper.style.display = "flex";
      wrapper.style.justifyContent = "flex-start";
      const card = document.createElement("div");
      card.style.width = "100%";
      card.style.backgroundColor = "#0f172a";
      card.style.color = "#f8fafc";
      card.style.border = payload.dentro_do_escopo ? "1px solid #10b981" : "1px solid #f59e0b";
      card.style.borderRadius = "12px";
      card.style.padding = "12px";
      card.style.fontSize = "12.5px";
      card.style.boxShadow = "0 6px 16px rgba(0,0,0,0.45)";

      const badgeRow = document.createElement("div");
      badgeRow.style.display = "flex";
      badgeRow.style.justifyContent = "space-between";
      badgeRow.style.alignItems = "center";
      badgeRow.style.borderBottom = "1px solid #334155";
      badgeRow.style.paddingBottom = "6px";
      badgeRow.style.marginBottom = "8px";
      badgeRow.innerHTML = payload.dentro_do_escopo
        ? `<span style="font-size:11px;font-weight:700;color:#34d399;font-family:'JetBrains Mono',monospace;">✅ Resposta Homologada</span>
           <span style="font-size:10px;color:#cbd5e1;font-family:'JetBrains Mono',monospace;">${payload.engine_label || "Índice Local"}</span>`
        : `<span style="font-size:11px;font-weight:700;color:#fbbf24;font-family:'JetBrains Mono',monospace;">🔒 Escopo Estrito</span>
           <span style="font-size:10px;color:#cbd5e1;font-family:'JetBrains Mono',monospace;">Filtro de Segurança</span>`;
      card.appendChild(badgeRow);

      const bodyP = document.createElement("div");
      bodyP.style.color = "#f1f5f9";
      bodyP.style.lineHeight = "1.55";
      bodyP.style.whiteSpace = "pre-line";
      bodyP.textContent = payload.resposta_engenharia;
      card.appendChild(bodyP);

      if (payload.analise_painel_atual) {
        const telemetryBox = document.createElement("div");
        telemetryBox.style.marginTop = "10px";
        telemetryBox.style.padding = "8px 10px";
        telemetryBox.style.borderRadius = "8px";
        telemetryBox.style.backgroundColor = "#1e293b";
        telemetryBox.style.border = "1px solid #38bdf8";
        telemetryBox.style.fontSize = "11px";
        telemetryBox.style.color = "#e0f2fe";
        telemetryBox.style.fontFamily = "'JetBrains Mono', monospace";
        telemetryBox.innerHTML = `<strong style="color:#38bdf8;display:block;margin-bottom:3px;">⚙️ Telemetria da Sua Planta Agora:</strong>`;
        const spanT = document.createElement("span");
        spanT.textContent = payload.analise_painel_atual;
        telemetryBox.appendChild(spanT);
        card.appendChild(telemetryBox);
      }

      if (payload.citacoes && payload.citacoes.length > 0) {
        const citeBox = document.createElement("div");
        citeBox.style.marginTop = "10px";
        citeBox.style.paddingTop = "8px";
        citeBox.style.borderTop = "1px solid #334155";
        citeBox.innerHTML = `<div style="font-size:10px;font-weight:700;color:#94a3b8;text-transform:uppercase;margin-bottom:6px;font-family:'JetBrains Mono',monospace;">📚 Fontes Homologadas Citadas:</div>`;
        const list = document.createElement("div");
        list.style.display = "flex";
        list.style.flexWrap = "wrap";
        list.style.gap = "6px";
        payload.citacoes.forEach((cit) => {
          const a = document.createElement("a");
          a.href = cit.url || "glossario.html";
          a.target = "_blank";
          a.rel = "noopener noreferrer";
          a.style.fontSize = "11px";
          a.style.fontFamily = "'JetBrains Mono', monospace";
          a.style.padding = "3px 8px";
          a.style.borderRadius = "6px";
          a.style.backgroundColor = "#064e3b";
          a.style.color = "#6ee7b7";
          a.style.border = "1px solid #10b981";
          a.style.textDecoration = "none";
          a.style.fontWeight = "600";
          a.textContent = `${cit.fonte_id} [${cit.minutagem}] ↗`;
          a.title = cit.autor_titulo;
          list.appendChild(a);
        });
        citeBox.appendChild(list);
        card.appendChild(citeBox);
      }

      wrapper.appendChild(card);
    }

    container.appendChild(wrapper);
    container.scrollTop = container.scrollHeight;
  }

  async function askQuestion(rawText) {
    try {
      const input = document.getElementById("cm-chat-input");
      const query = (rawText !== undefined ? rawText : input?.value || "").trim();
      if (!query) return;
      if (input && rawText === undefined) input.value = "";

      if (!isOpen) toggleDrawer(true);
      renderMessageBubble("user", query);

      const retrieval = searchHomologatedIndex(query);
      const liveState = getLiveSimulatorState();

      if (!retrieval.inScope) {
        const outRes = buildLocalDeterministicAnswer(query, retrieval, liveState);
        renderMessageBubble("assistant", outRes);
        return;
      }

      const apiKey = (localStorage.getItem(STORAGE_KEY_API) || "").trim();
      const proxyUrl = (localStorage.getItem(STORAGE_KEY_PROXY) || "").trim();

      if (apiKey || proxyUrl) {
        try {
          const aiRes = await callGoogleAIStudio(query, retrieval, liveState, apiKey, proxyUrl);
          aiRes.engine_label = "Gemini 2.5 Flash (AI Studio)";
          renderMessageBubble("assistant", aiRes);
          return;
        } catch (err) {
          const fallback = buildLocalDeterministicAnswer(query, retrieval, liveState);
          fallback.engine_label = "Índice Local (Fallback)";
          renderMessageBubble("assistant", fallback);
          return;
        }
      }

      const localRes = buildLocalDeterministicAnswer(query, retrieval, liveState);
      localRes.engine_label = "Índice Local Homologado";
      renderMessageBubble("assistant", localRes);
    } catch (unexpectedErr) {
      renderMessageBubble("assistant", {
        dentro_do_escopo: true,
        engine_label: "Diagnóstico de Segurança",
        resposta_engenharia:
          "Ocorreu um erro inesperado ao processar a consulta: " + String(unexpectedErr),
        analise_painel_atual: "",
        citacoes: []
      });
    }
  }

  function updateEngineBadge() {
    const badge = document.getElementById("cm-engine-status");
    if (!badge) return;
    const hasKey =
      Boolean((localStorage.getItem(STORAGE_KEY_API) || "").trim()) ||
      Boolean((localStorage.getItem(STORAGE_KEY_PROXY) || "").trim());
    if (hasKey) {
      badge.textContent = "⚡ Google AI Studio Ativo";
      badge.style.backgroundColor = "#064e3b";
      badge.style.color = "#6ee7b7";
      badge.style.borderColor = "#10b981";
    } else {
      badge.textContent = "🟢 Índice Local (7 Fontes)";
      badge.style.backgroundColor = "#164e63";
      badge.style.color = "#67e8f9";
      badge.style.borderColor = "#06b6d4";
    }
  }

  function saveCredentials() {
    const keyEl = document.getElementById("cm-input-apikey");
    const proxyEl = document.getElementById("cm-input-proxy");
    if (keyEl) localStorage.setItem(STORAGE_KEY_API, keyEl.value.trim());
    if (proxyEl) localStorage.setItem(STORAGE_KEY_PROXY, proxyEl.value.trim());
    updateEngineBadge();
    toggleConfig(false);
  }

  function toggleConfig(force) {
    isConfigOpen = force !== undefined ? force : !isConfigOpen;
    const panel = document.getElementById("cm-config-panel");
    if (panel) {
      panel.style.display = isConfigOpen ? "block" : "none";
    }
  }

  function toggleDrawer(force) {
    isOpen = force !== undefined ? force : !isOpen;
    const drawer = document.getElementById("cm-consultant-drawer");
    if (drawer) {
      drawer.style.display = isOpen ? "flex" : "none";
    }
  }

  function mountWidget() {
    if (document.getElementById("cm-consultant-root")) return;

    const root = document.createElement("div");
    root.id = "cm-consultant-root";
    root.innerHTML = `
      <!-- Botão Flutuante de Alto Contraste -->
      <button
        id="cm-floating-btn"
        type="button"
        onclick="ChangeMacroConsultant.toggleDrawer()"
        style="position:fixed;bottom:18px;right:18px;z-index:9990;background-color:#0f172a;color:#ffffff;border:2px solid #06b6d4;border-radius:9999px;padding:10px 18px;font-weight:800;font-size:13px;box-shadow:0 12px 32px rgba(0,0,0,0.85);display:flex;align-items:center;gap:8px;cursor:pointer;"
        title="Abrir Consultor ChangeMacro (Treinado exclusivamente nas 7 fontes homologadas)"
      >
        <span>💬 Consultor Change<span style="color:#22d3ee;">Macro</span></span>
        <span style="font-size:10px;font-family:'JetBrains Mono',monospace;padding:2px 7px;border-radius:6px;background-color:#064e3b;color:#6ee7b7;border:1px solid #10b981;">7 Fontes</span>
      </button>

      <!-- Painel Sólido Opaco de Alto Contraste (Sem transparência sobre o fundo) -->
      <aside
        id="cm-consultant-drawer"
        style="display:none;position:fixed;bottom:74px;right:18px;z-index:9999;width:min(94vw, 450px);max-height:82vh;background-color:#1e293b;color:#f8fafc;border:2px solid #22d3ee;border-radius:16px;box-shadow:0 25px 65px rgba(0,0,0,0.95);flex-direction:column;overflow:hidden;"
        aria-label="Consultor ChangeMacro"
      >
        <!-- Cabeçalho Sólido com Logo Nítido -->
        <div style="padding:12px 14px;background-color:#0f172a;border-bottom:2px solid #334155;display:flex;align-items:center;justify-content:space-between;gap:10px;">
          <div style="display:flex;align-items:center;gap:10px;">
            <img src="src/assets/change_logo.svg" alt="ChangeMacro" style="width:42px;height:42px;border-radius:50%;border:1.5px solid #22d3ee;background-color:#080c14;flex-shrink:0;" />
            <div>
              <div style="display:flex;align-items:center;gap:6px;flex-wrap:wrap;">
                <span style="font-size:14px;font-weight:800;color:#ffffff;">Consultor Change<span style="color:#22d3ee;">Macro</span></span>
                <span id="cm-engine-status" style="font-size:10px;font-family:'JetBrains Mono',monospace;padding:2px 7px;border-radius:6px;background-color:#164e63;color:#67e8f9;border:1px solid #06b6d4;font-weight:700;">🟢 Índice Local (7 Fontes)</span>
              </div>
              <div style="font-size:11px;color:#cbd5e1;margin-top:2px;">
                Escopo 100% restrito aos dados homologados no projeto
              </div>
            </div>
          </div>
          <div style="display:flex;align-items:center;gap:6px;flex-shrink:0;">
            <button
              type="button"
              onclick="ChangeMacroConsultant.toggleConfig()"
              style="padding:5px 9px;border-radius:8px;font-size:11px;font-family:'JetBrains Mono',monospace;background-color:#1e293b;border:1px solid #475569;color:#e2e8f0;cursor:pointer;font-weight:600;"
              title="Configurar chave gratuita do Google AI Studio ou Proxy Apps Script"
            >
              🔑 AI Studio
            </button>
            <button
              type="button"
              onclick="ChangeMacroConsultant.toggleDrawer(false)"
              style="padding:5px 10px;border-radius:8px;font-size:13px;font-weight:800;background-color:#334155;border:1px solid #64748b;color:#ffffff;cursor:pointer;"
              title="Fechar"
            >
              ✕
            </button>
          </div>
        </div>

        <!-- Painel Opcional de Conexão Google AI Studio -->
        <div id="cm-config-panel" style="display:none;padding:12px 14px;background-color:#0f172a;border-bottom:2px solid #06b6d4;font-size:12px;">
          <div style="font-weight:700;color:#38bdf8;display:flex;align-items:center;justify-content:space-between;margin-bottom:6px;">
            <span>🔑 Conector Google AI Studio (Gemini 2.5 Flash)</span>
            <a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noopener noreferrer" style="font-size:11px;color:#34d399;text-decoration:underline;">Gerar Chave Gratuita ↗</a>
          </div>
          <p style="font-size:11px;color:#cbd5e1;line-height:1.45;margin-bottom:8px;">
            Sem chave, o consultor responde na hora pelo <strong>Índice Local Homologado</strong>. Com chave do AI Studio, ativa a síntese generativa Gemini Flash restrita às 7 fontes.
          </p>
          <input
            id="cm-input-apikey"
            type="password"
            placeholder="Cole sua GEMINI_API_KEY (AIza...)"
            style="width:100%;padding:7px 10px;border-radius:8px;background-color:#1e293b;border:1px solid #475569;color:#ffffff;font-size:12px;margin-bottom:6px;font-family:'JetBrains Mono',monospace;"
          />
          <input
            id="cm-input-proxy"
            type="url"
            placeholder="Opcional: URL do seu Google Apps Script Proxy"
            style="width:100%;padding:7px 10px;border-radius:8px;background-color:#1e293b;border:1px solid #475569;color:#ffffff;font-size:12px;margin-bottom:8px;font-family:'JetBrains Mono',monospace;"
          />
          <div style="display:flex;justify-content:flex-end;gap:8px;">
            <button type="button" onclick="ChangeMacroConsultant.toggleConfig(false)" style="padding:5px 10px;border-radius:8px;background-color:#334155;color:#e2e8f0;font-size:11px;border:none;cursor:pointer;">Cancelar</button>
            <button type="button" onclick="ChangeMacroConsultant.saveCredentials()" style="padding:5px 12px;border-radius:8px;background-color:#059669;color:#ffffff;font-weight:700;font-size:11px;border:none;cursor:pointer;">Salvar no Navegador</button>
          </div>
        </div>

        <!-- Botões Rápidos de Perguntas Homologadas -->
        <div style="padding:9px 12px;background-color:#172033;border-bottom:1px solid #334155;display:flex;flex-wrap:wrap;gap:6px;">
          <button type="button" onclick="ChangeMacroConsultant.askQuestion('Diagnosticar meu painel atual de engenharia')" style="font-size:11px;padding:4px 9px;border-radius:8px;background-color:#0e7490;color:#ffffff;border:1px solid #22d3ee;font-weight:700;cursor:pointer;">
            ⚙️ Diagnosticar meu painel
          </button>
          <button type="button" onclick="ChangeMacroConsultant.askQuestion('Por que os 51,6% de LFTs geram expansão endógena no Tanque?')" style="font-size:11px;padding:4px 9px;border-radius:8px;background-color:#78350f;color:#fef3c7;border:1px solid #f59e0b;font-weight:700;cursor:pointer;">
            🔗 LFTs 51,6% no Tanque
          </button>
          <button type="button" onclick="ChangeMacroConsultant.askQuestion('O que é a Falsa Racionalidade (r - g = +5,7%) de Lara Resende?')" style="font-size:11px;padding:4px 9px;border-radius:8px;background-color:#064e3b;color:#d1fae5;border:1px solid #10b981;font-weight:700;cursor:pointer;">
            📐 Falsa Racionalidade (r−g)
          </button>
          <button type="button" onclick="ChangeMacroConsultant.askQuestion('Como o mercado futuro de câmbio e swaps afetam a PTAX e a dívida?')" style="font-size:11px;padding:4px 9px;border-radius:8px;background-color:#334155;color:#f8fafc;border:1px solid #94a3b8;font-weight:700;cursor:pointer;">
            💵 Câmbio Futuro &amp; Swaps
          </button>
        </div>

        <!-- Área de Mensagens com Fundo Sólido Opaco (#1e293b) -->
        <div id="cm-chat-messages" style="padding:14px;background-color:#1e293b;overflow-y:auto;max-height:350px;display:flex;flex-direction:column;gap:12px;flex:1;">
          <div style="border-radius:12px;padding:12px;font-size:12.5px;background-color:#0f172a;border:1px solid #38bdf8;color:#f1f5f9;">
            <div style="font-weight:800;color:#38bdf8;margin-bottom:4px;">👷 Olá! Sou o Consultor ChangeMacro.</div>
            <div style="line-height:1.5;">
              Respondo <strong>exclusivamente</strong> com base nas <strong>7 fontes homologadas</strong> (Monica de Bolle, André Lara Resende e José Paulo Kupfer — 364 blocos minutados) e leio em tempo real os controles da sua planta 2D. Clique em um dos temas acima ou digite sua dúvida abaixo!
            </div>
          </div>
        </div>

        <!-- Barra de Digitação Sólida -->
        <form
          onsubmit="event.preventDefault(); ChangeMacroConsultant.askQuestion();"
          style="padding:10px 12px;background-color:#0f172a;border-top:2px solid #334155;display:flex;align-items:center;gap:8px;"
        >
          <input
            id="cm-chat-input"
            type="text"
            placeholder="Ex: O que é LFT? Como funciona o câmbio futuro?"
            style="flex:1;padding:9px 12px;border-radius:10px;background-color:#1e293b;border:1px solid #64748b;color:#ffffff;font-size:12.5px;outline:none;"
          />
          <button
            type="submit"
            style="padding:9px 16px;border-radius:10px;background-color:#0891b2;color:#ffffff;border:1px solid #22d3ee;font-size:12.5px;font-weight:800;cursor:pointer;"
          >
            Enviar
          </button>
        </form>
      </aside>
    `;

    document.body.appendChild(root);

    const savedKey = localStorage.getItem(STORAGE_KEY_API) || "";
    const savedProxy = localStorage.getItem(STORAGE_KEY_PROXY) || "";
    const keyEl = document.getElementById("cm-input-apikey");
    const proxyEl = document.getElementById("cm-input-proxy");
    if (keyEl) keyEl.value = savedKey;
    if (proxyEl) proxyEl.value = savedProxy;
    updateEngineBadge();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", mountWidget);
  } else {
    mountWidget();
  }

  return {
    toggleDrawer,
    toggleConfig,
    saveCredentials,
    askQuestion,
    searchHomologatedIndex
  };
})();
