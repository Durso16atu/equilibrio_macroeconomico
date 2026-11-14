/**
 * Consultor ChangeMacro — Assistente de Engenharia Macroeconômica (RAG Estrito + Google AI Studio).
 *
 * Opera exclusivamente sobre o Índice Local Homologado (window.ChangeMacroKnowledgeIndex)
 * e a telemetria ao vivo dos 4 controles do Simulador 2D (window.MacroEngine).
 * Suporta conexão direta com Google AI Studio (gemini-2.5-flash com Structured Outputs JSON)
 * ou Proxy gratuito via Google Apps Script.
 */

window.ChangeMacroConsultant = (function () {
  const STORAGE_KEY_API = "changemacro_ai_studio_key";
  const STORAGE_KEY_PROXY = "changemacro_apps_script_url";
  const GEMINI_MODEL = "gemini-2.5-flash";

  let isOpen = false;
  let isConfigOpen = false;

  // Sinônimos e termos de domínio para garantir cobertura semântica
  const DOMAIN_TERMS = [
    "selic", "juro", "juros", "divida", "dívida", "pib", "lft", "lfts", "tesouro",
    "tanque", "caldeira", "ponte", "valvula", "válvula", "fiscal", "monetaria", "monetária",
    "cambio", "câmbio", "dolar", "dólar", "ptax", "swap", "swaps", "futuro", "derivativo",
    "derivativos", "reservas", "fmi", "inflacao", "inflação", "demanda", "oferta", "consumo",
    "investimento", "gasto", "gastos", "renuncia", "renúncias", "renuncias", "desoneracao",
    "desonerações", "desoneracoes", "tesouraco", "tesouraço", "negacionismo", "cfmn",
    "lara resende", "bolle", "monica", "kupfer", "orenstein", "jaccuse", "j'accuse", "eu acuso",
    "falsa racionalidade", "phillips", "primario", "primário", "nominal", "dbgg", "dlsp",
    "estoque", "fluxo", "paeg", "cruzado", "real", "urv", "ortn", "indexacao", "indexação",
    "painel", "cenário", "cenario", "simulador", "hp", "estabilidade", "r-g", "r - g", "51,6",
    "38%", "82,9%", "600", "800", "corte", "cortes", "social", "reforma", "equilibrio", "equilíbrio"
  ];

  function normalize(str) {
    return (str || "")
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9\s%.,-]/g, " ");
  }

  function getLiveSimulatorState() {
    if (!window.MacroEngine) return null;
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
    return window.MacroEngine.calculate(params);
  }

  function searchHomologatedIndex(query) {
    const index = window.ChangeMacroKnowledgeIndex;
    if (!index) {
      return { inScope: false, canonicals: [], chunks: [] };
    }

    const normQ = normalize(query);
    const tokens = normQ.split(/\s+/).filter((t) => t.length >= 3);

    // Verifica se é pedido de diagnóstico do painel atual
    const isPanelDiag =
      normQ.includes("painel") ||
      normQ.includes("meu cenario") ||
      normQ.includes("minha simulacao") ||
      normQ.includes("diagnosticar") ||
      normQ.includes("configuracao atual");

    const hasDomainTerm = DOMAIN_TERMS.some((term) => normQ.includes(normalize(term))) || isPanelDiag;

    const scoredCanon = [];
    (index.canonical_topics || []).forEach((topic) => {
      let score = 0;
      const hay = normalize(
        topic.title + " " + topic.synthesis + " " + (topic.keywords || []).join(" ")
      );
      (topic.keywords || []).forEach((kw) => {
        if (normQ.includes(normalize(kw))) score += 6.5;
      });
      tokens.forEach((tok) => {
        if (hay.includes(tok)) score += 2.2;
      });
      if (score > 0) scoredCanon.push({ score, topic });
    });
    scoredCanon.sort((a, b) => b.score - a.score);

    const scoredChunks = [];
    (index.transcript_chunks || []).forEach((chk) => {
      let score = 0;
      const hay = normalize(chk.text + " " + chk.title);
      tokens.forEach((tok) => {
        if (hay.includes(tok)) score += 2.0;
      });
      if (score > 0) scoredChunks.push({ score, chk });
    });
    scoredChunks.sort((a, b) => b.score - a.score);

    const topCanonScore = scoredCanon.length ? scoredCanon[0].score : 0;
    const topChunkScore = scoredChunks.length ? scoredChunks[0].score : 0;
    const inScope = isPanelDiag || (hasDomainTerm && (topCanonScore >= 2.0 || topChunkScore >= 2.0));

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

    if (retrieval.canonicals.length > 0) {
      retrieval.canonicals.forEach((c) => {
        paragraphs.push(`• ${c.title}: ${c.synthesis}`);
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
        `• Registro Homologado (${top.source_id} [${top.timestamp}]): "${top.text.slice(0, 340)}..."`
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
        `Tanque da Dívida projetado em ${liveState.dividaProj.toFixed(1).replace(".", ",")}% do PIB ` +
        `(Camada Autoexpansiva LFT: ${liveState.lftShare.toFixed(1).replace(".", ",")}%) | ` +
        `Selic: ${liveState.selic.toFixed(2).replace(".", ",")}% a.a. | ` +
        `PIB (Y): ${liveState.pibGrowth >= 0 ? "+" : ""}${liveState.pibGrowth.toFixed(1).replace(".", ",")}% | ` +
        `Estabilidade: ${liveState.hp}/100 HP. Diagnóstico: ${liveState.statusText}`;
    }

    if (paragraphs.length === 0 && retrieval.isPanelDiag && liveState) {
      paragraphs.push(`• Diagnóstico de Engenharia da Planta: ${liveState.failureReason}`);
      citacoes.push({
        fonte_id: "Fonte #7",
        autor_titulo: "Monica de Bolle — Basicão: Juros, Dívida, Ajuste (13/11/2026)",
        minutagem: "16:07–34:15",
        url: "https://bolle.substack.com/p/basicao-juros-divida-ajusteo-que"
      });
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
        "Proibido usar conhecimento externo ou termos coloquiais fora da engenharia (use Tanque Hidráulico, " +
        "Camada Autoexpansiva de LFTs 51,6%, Caldeira Monetária, Válvulas do Primário e Ponte de Coesão Social).",
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
              "Responda exclusivamente com os dados homologados no JSON fornecido. Se a pergunta não tiver " +
              "relação com o acervo homologado do projeto, retorne dentro_do_escopo=false."
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
      wrapper.className = "flex justify-end";
      const bubble = document.createElement("div");
      bubble.className =
        "max-w-[85%] rounded-xl px-3 py-2 text-xs bg-cyan-500/20 text-cyan-100 border border-cyan-500/40 font-medium";
      bubble.textContent = payload;
      wrapper.appendChild(bubble);
    } else {
      wrapper.className = "flex justify-start";
      const card = document.createElement("div");
      card.className =
        "w-full rounded-xl p-3 text-xs bg-slate-900/95 border border-slate-700/90 space-y-2 shadow-sm";

      const badgeRow = document.createElement("div");
      badgeRow.className = "flex items-center justify-between gap-2 border-b border-slate-800 pb-1.5";
      badgeRow.innerHTML = payload.dentro_do_escopo
        ? `<span class="text-[10px] font-mono-num font-bold text-emerald-400">✅ Resposta Homologada • ChangeMacro</span>
           <span class="text-[10px] font-mono-num text-slate-400">${payload.engine_label || "Índice Local"}</span>`
        : `<span class="text-[10px] font-mono-num font-bold text-amber-400">🔒 Escopo Estrito</span>
           <span class="text-[10px] font-mono-num text-slate-400">Filtro de Segurança</span>`;
      card.appendChild(badgeRow);

      const bodyP = document.createElement("div");
      bodyP.className = "text-slate-200 leading-relaxed whitespace-pre-line";
      bodyP.textContent = payload.resposta_engenharia;
      card.appendChild(bodyP);

      if (payload.analise_painel_atual) {
        const telemetryBox = document.createElement("div");
        telemetryBox.className =
          "p-2 rounded-lg bg-cyan-950/40 border border-cyan-500/30 text-[11px] text-cyan-200 font-mono-num leading-snug";
        telemetryBox.innerHTML = `<strong class="text-cyan-400 block mb-0.5">⚙️ Leitura da Sua Planta Atual:</strong>`;
        const spanT = document.createElement("span");
        spanT.textContent = payload.analise_painel_atual;
        telemetryBox.appendChild(spanT);
        card.appendChild(telemetryBox);
      }

      if (payload.citacoes && payload.citacoes.length > 0) {
        const citeBox = document.createElement("div");
        citeBox.className = "pt-1.5 border-t border-slate-800/80 space-y-1";
        citeBox.innerHTML = `<div class="text-[10px] font-mono-num uppercase tracking-wider text-slate-400 font-bold">📚 Fontes Homologadas Citadas:</div>`;
        const list = document.createElement("div");
        list.className = "flex flex-wrap gap-1.5";
        payload.citacoes.forEach((cit) => {
          const a = document.createElement("a");
          a.href = cit.url || "glossario.html";
          a.target = "_blank";
          a.rel = "noopener noreferrer";
          a.className =
            "text-[10px] font-mono-num px-2 py-0.5 rounded bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 transition-colors";
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
    const input = document.getElementById("cm-chat-input");
    const query = (rawText !== undefined ? rawText : input?.value || "").trim();
    if (!query) return;
    if (input && rawText === undefined) input.value = "";

    if (!isOpen) toggleDrawer(true);
    renderMessageBubble("user", query);

    const retrieval = searchHomologatedIndex(query);
    const liveState = getLiveSimulatorState();

    // Se estiver fora do escopo, bloqueia imediatamente sem gastar API
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
  }

  function updateEngineBadge() {
    const badge = document.getElementById("cm-engine-status");
    if (!badge) return;
    const hasKey =
      Boolean((localStorage.getItem(STORAGE_KEY_API) || "").trim()) ||
      Boolean((localStorage.getItem(STORAGE_KEY_PROXY) || "").trim());
    if (hasKey) {
      badge.textContent = "⚡ Google AI Studio Ativo";
      badge.className =
        "text-[10px] font-mono-num px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/40";
    } else {
      badge.textContent = "🟢 Índice Local (7 Fontes)";
      badge.className =
        "text-[10px] font-mono-num px-2 py-0.5 rounded bg-cyan-500/15 text-cyan-300 border border-cyan-500/30";
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
      panel.classList.toggle("hidden", !isConfigOpen);
    }
  }

  function toggleDrawer(force) {
    isOpen = force !== undefined ? force : !isOpen;
    const drawer = document.getElementById("cm-consultant-drawer");
    if (drawer) {
      drawer.classList.toggle("hidden", !isOpen);
    }
  }

  function mountWidget() {
    if (document.getElementById("cm-consultant-root")) return;

    const root = document.createElement("div");
    root.id = "cm-consultant-root";
    root.innerHTML = `
      <!-- Botão Flutuante Discreto (LL-ENG-006) -->
      <button
        id="cm-floating-btn"
        type="button"
        onclick="ChangeMacroConsultant.toggleDrawer()"
        class="fixed bottom-4 right-4 z-40 px-4 py-2.5 rounded-full font-extrabold text-xs sm:text-sm shadow-xl border border-cyan-500/60 bg-slate-950/95 hover:bg-slate-900 text-cyan-300 flex items-center gap-2 transition-all"
        title="Abrir Consultor ChangeMacro (Treinado exclusivamente nas 7 fontes homologadas)"
      >
        <span>💬 Consultor ChangeMacro</span>
        <span class="text-[10px] font-mono-num px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">7 Fontes</span>
      </button>

      <!-- Gaveta Compacta do Consultor ChangeMacro -->
      <aside
        id="cm-consultant-drawer"
        class="hidden fixed bottom-16 right-4 z-50 w-[94vw] sm:w-[440px] max-h-[80vh] rounded-2xl border border-cyan-500/50 bg-slate-950/98 shadow-2xl flex flex-col overflow-hidden"
        aria-label="Consultor ChangeMacro"
      >
        <!-- Cabeçalho do Consultor -->
        <div class="p-3 bg-slate-900 border-b border-slate-800 flex items-center justify-between gap-2">
          <div class="flex items-center gap-2">
            <img src="src/assets/change_logo.svg" alt="ChangeMacro" class="w-7 h-7 rounded-full border border-cyan-500/40" />
            <div>
              <div class="text-xs font-extrabold text-white flex items-center gap-1.5">
                <span>Consultor Change<span class="text-cyan-400">Macro</span></span>
                <span id="cm-engine-status" class="text-[10px] font-mono-num px-2 py-0.5 rounded bg-cyan-500/15 text-cyan-300 border border-cyan-500/30">🟢 Índice Local (7 Fontes)</span>
              </div>
              <div class="text-[10px] text-slate-400">
                Escopo 100% restrito aos dados homologados no projeto
              </div>
            </div>
          </div>
          <div class="flex items-center gap-1">
            <button
              type="button"
              onclick="ChangeMacroConsultant.toggleConfig()"
              class="px-2 py-1 rounded text-[10px] font-mono-num border border-slate-700 hover:bg-slate-800 text-slate-300"
              title="Configurar chave gratuita do Google AI Studio ou Proxy Apps Script"
            >
              🔑 AI Studio
            </button>
            <button
              type="button"
              onclick="ChangeMacroConsultant.toggleDrawer(false)"
              class="px-2 py-1 rounded text-xs font-bold border border-slate-700 hover:bg-slate-800 text-slate-400"
              title="Fechar"
            >
              ✕
            </button>
          </div>
        </div>

        <!-- Painel Opcional de Conexão Google AI Studio -->
        <div id="cm-config-panel" class="hidden p-3 bg-slate-900/95 border-b border-cyan-500/30 space-y-2 text-xs">
          <div class="font-bold text-cyan-300 flex items-center justify-between">
            <span>🔑 Conector Google AI Studio (Gemini 2.5 Flash)</span>
            <a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noopener noreferrer" class="text-[10px] underline text-emerald-400">Gerar Chave Gratuita ↗</a>
          </div>
          <p class="text-[11px] text-slate-400 leading-snug">
            Sem chave, o consultor responde instantaneamente pelo <strong>Índice Local Homologado</strong>. Com chave do AI Studio (salva apenas no seu navegador), ativa a síntese generativa Gemini Flash restrita às 7 fontes.
          </p>
          <input
            id="cm-input-apikey"
            type="password"
            placeholder="Cole sua GEMINI_API_KEY (AIza...)"
            class="w-full px-2.5 py-1.5 rounded bg-slate-950 border border-slate-700 text-slate-200 text-xs font-mono-num"
          />
          <input
            id="cm-input-proxy"
            type="url"
            placeholder="Opcional: URL do seu Google Apps Script Proxy"
            class="w-full px-2.5 py-1.5 rounded bg-slate-950 border border-slate-700 text-slate-200 text-xs font-mono-num"
          />
          <div class="flex justify-end gap-2">
            <button type="button" onclick="ChangeMacroConsultant.toggleConfig(false)" class="px-2.5 py-1 rounded border border-slate-700 text-slate-400 text-[11px]">Cancelar</button>
            <button type="button" onclick="ChangeMacroConsultant.saveCredentials()" class="px-3 py-1 rounded bg-emerald-500/20 border border-emerald-500/50 text-emerald-300 font-bold text-[11px]">Salvar no Navegador</button>
          </div>
        </div>

        <!-- Atalhos de Perguntas Homologadas -->
        <div class="px-3 py-2 bg-slate-900/60 border-b border-slate-800/80 flex flex-wrap gap-1.5">
          <button type="button" onclick="ChangeMacroConsultant.askQuestion('Diagnosticar meu painel atual de engenharia')" class="text-[10px] px-2 py-1 rounded bg-cyan-500/15 hover:bg-cyan-500/25 text-cyan-300 border border-cyan-500/30 font-semibold">
            ⚙️ Diagnosticar meu painel
          </button>
          <button type="button" onclick="ChangeMacroConsultant.askQuestion('Por que os 51,6% de LFTs geram expansão endógena no Tanque?')" class="text-[10px] px-2 py-1 rounded bg-amber-500/15 hover:bg-amber-500/25 text-amber-300 border border-amber-500/30 font-semibold">
            🔗 LFTs 51,6% no Tanque
          </button>
          <button type="button" onclick="ChangeMacroConsultant.askQuestion('O que é a Falsa Racionalidade (r - g = +5,7%) de Lara Resende?')" class="text-[10px] px-2 py-1 rounded bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-300 border border-emerald-500/30 font-semibold">
            📐 Falsa Racionalidade (r−g)
          </button>
          <button type="button" onclick="ChangeMacroConsultant.askQuestion('Como o mercado futuro de câmbio e swaps afetam a PTAX e a dívida?')" class="text-[10px] px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 font-semibold">
            💵 Câmbio Futuro &amp; Swaps
          </button>
        </div>

        <!-- Histórico de Mensagens -->
        <div id="cm-chat-messages" class="p-3 space-y-2.5 overflow-y-auto max-h-[340px] flex-1">
          <div class="rounded-xl p-3 text-xs bg-slate-900/90 border border-slate-800 text-slate-300 space-y-1">
            <div class="font-bold text-cyan-400">👷 Olá! Sou o Consultor ChangeMacro.</div>
            <p class="leading-relaxed">
              Respondo <strong>exclusivamente</strong> com base nas <strong>7 fontes homologadas</strong> (Monica de Bolle, André Lara Resende e José Paulo Kupfer — 364 blocos minutados) e leio em tempo real os controles da sua planta 2D.
            </p>
          </div>
        </div>

        <!-- Input de Pergunta -->
        <form
          onsubmit="event.preventDefault(); ChangeMacroConsultant.askQuestion();"
          class="p-2.5 bg-slate-900 border-t border-slate-800 flex items-center gap-2"
        >
          <input
            id="cm-chat-input"
            type="text"
            placeholder="Pergunte sobre LFTs, Selic, Câmbio, Renúncias..."
            class="flex-1 px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 focus:border-cyan-500 outline-none text-xs text-slate-100"
          />
          <button
            type="submit"
            class="px-3.5 py-2 rounded-xl bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 border border-cyan-500/50 text-xs font-extrabold transition-colors"
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
