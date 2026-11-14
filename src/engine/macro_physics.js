/**
 * Motor Físico e Macroeconômico — Basicão de Economia 2.0
 * Traduz as relações macroeconômicas (Y = C+I+G+X-M, Primário vs Nominal,
 * Estoque Dívida/PIB, Indexação Selic e Credibilidade) em variáveis físicas 2D.
 */

window.MacroEngine = (function () {
  const SCENARIOS = {
    // =========================================================================
    // BLOCO 1: MOMENTO ATUAL — ARENA DE DECISÃO (2026–2030)
    // =========================================================================
    atual: {
      id: "atual",
      block: "atual",
      icon: "📍",
      shortTitle: "Base Nov/2026",
      subtitle: "DBGG 82,9% | LFT 51,6%",
      name: "Momento Atual: Tanque da Dívida & Expansão Endógena de LFTs (Novembro de 2026)",
      desc: "A Dívida Bruta chegou a 82,9% do PIB e as LFTs (pós-fixadas à Selic de 13,75%) saltaram de 38% (2022) para 51,6% do estoque! Essa camada laranja tem expansão endógena (+5,7% a.a. acima do PIB), elevando o nível do tanque mesmo com as válvulas do primário fechadas.",
      historicalContext: "🎯 Desafio de Engenharia 2026–2030: Atuar na composição estrutural do tanque (51,6% em LFTs pós-Selic, diferencial r − g e câmbio futuro).",
      externalWind: 0,
      renuncias: 50,
      cortes: 20,
      selic: 13.75,
      reforma: 20
    },
    equilibrio: {
      id: "equilibrio",
      block: "atual",
      icon: "🏆",
      shortTitle: "Missão: Equilíbrio",
      subtitle: "CFMN + Swap LFT",
      name: "Solução Calibrada: Coordenação CFMN + Swap Gradual de LFTs + Revisão de Renúncias",
      desc: "Você cortou R$ 225 bi de privilégios tributários, preservou o investimento social e ativou a Coordenação CFMN com troca gradual (swap) de LFTs. Na descida coordenada da Selic, a camada autoexpansiva recua de 51,6% rumo a ~35% e gera alívio imediato de ~4% do PIB!",
      historicalContext: "✅ Resultado rumo a 2030: O tanque hidráulico estabiliza a pressão, o diferencial r − g recua e o PIB (Y) cresce alargando as paredes do reservatório!",
      externalWind: 0,
      renuncias: 225,
      cortes: 75,
      selic: 10.0,
      reforma: 80
    },
    tesouraco: {
      id: "tesouraco",
      block: "atual",
      icon: "✂️",
      shortTitle: "Armadilha: Tesouraço",
      subtitle: "Corte Social + Selic 14,25%",
      name: "Extremo 1 ('Faria Lima'): Estrangular a Válvula Social Ignorando a Indexação Selic",
      desc: "Você estrangulou o investimento e gasto social (G), manteve R$ 600–800 bi de renúncias e subiu a Selic para 14,25%. Como 51,6% do tanque é composto por LFTs pós-fixadas (camada autoexpansiva), o estoque continuou crescendo por inércia de juros enquanto o PIB encolheu!",
      historicalContext: "🚨 Lição de Engenharia (Basicão 13/11 & J’Accuse): Fechar a válvula primária não estanca o tanque quando 51,6% do fluido expande endogenamente à taxa Selic.",
      externalWind: 0,
      renuncias: 25,
      cortes: 275,
      selic: 14.25,
      reforma: 10
    },
    negacionismo: {
      id: "negacionismo",
      block: "atual",
      icon: "🙈",
      shortTitle: "Armadilha: Negacionismo",
      subtitle: "Gastar + Juro na marra",
      name: "Extremo 2 ('Negacionismo Fiscal'): Ignorar a Pressão do Tanque e Baixar Juros na Marra",
      desc: "Você ignorou o desequilíbrio do tanque e tentou derrubar a Selic na marra para 7,5% sem coordenação institucional. O mercado futuro de câmbio (US$ 20–35 bi/dia na B3) disparou a PTAX, gerou perdas nos swaps do BC e explodiu a caldeira termodinâmica!",
      historicalContext: "💥 Lição (De Bolle & Kupfer): Juros são endógenos; forçar a válvula sem desindexar o tanque provoca colapso via câmbio futuro e inflação.",
      externalWind: 0,
      renuncias: 0,
      cortes: -125,
      selic: 7.5,
      reforma: 0
    },

    // =========================================================================
    // BLOCO 2: CONHECIMENTO HISTÓRICO — CÁPSULA DO TEMPO (PARA QUEM NÃO VIVEU)
    // =========================================================================
    anos80: {
      id: "anos80",
      block: "historico",
      icon: "🕰️",
      shortTitle: "Anos 1980: Moratória",
      subtitle: "Indexação & Dólar Futuro",
      name: "Memória Histórica (Anos 1980): Moratória, Hiperinflação e Origem dos Futuros",
      desc: "Nos anos 1980, o Brasil declarou moratória externa e viveu hiperinflação. Para evitar a dolarização selvagem na rua (como na Argentina), o país criou barreiras ao dólar físico à vista, mas gestou a indexação geral (LFTs) e a cultura de proteção em contratos futuros.",
      historicalContext: "🧬 Cicatriz que ficou para hoje: Rolagem curta da dívida e hipertrofia do mercado futuro de câmbio na B3 frente a um mercado à vista minúsculo.",
      externalWind: -1,
      renuncias: 0,
      cortes: -100,
      selic: 17.5,
      reforma: 0
    },
    real1994: {
      id: "real1994",
      block: "historico",
      icon: "🛡️",
      shortTitle: "1994: Plano Real (URV)",
      subtitle: "Fim da Hiper + LFTs",
      name: "Memória Histórica (1994): A Engenharia da URV e a Sobrevivência das LFTs",
      desc: "Para acabar com a hiperinflação sem congelar preços, o Plano Real criou a URV. A caldeira foi domada, mas os títulos pós-fixados à Selic (LFTs) sobreviveram — e entre 2022 e 2026 saltaram de 38% para 51,6% da dívida sob a falácia de alongar o prazo (6 anos).",
      historicalContext: "🧬 Cicatriz que ficou para hoje: As novas LFTs têm vencimento de 73,6 meses (6 anos), mas liquidez diária: não compram segurança e dão vida própria à dívida.",
      externalWind: 0,
      renuncias: 75,
      cortes: 50,
      selic: 16.0,
      reforma: 30
    },
    boom2000: {
      id: "boom2000",
      block: "historico",
      icon: "🚀",
      shortTitle: "2002–2010: FMI & Boom",
      subtitle: "Swaps (2002) & Reservas",
      name: "Memória Histórica (2002–2010): Acordo FMI (Swaps Cambiais) e Boom de Commodities",
      desc: "Na crise de 2002, o FMI proibiu queimar reservas à vista e o BC passou a intervir no câmbio futuro via swaps cambiais. Em seguida (2003–2010), o boom de commodities fez o PIB crescer e permitiu acumular > US$ 350 bi em reservas (cujo custo de carregamento entra na DBGG).",
      historicalContext: "🧬 Cicatriz que ficou para hoje: O BC assumiu o risco cambial via swaps na B3 e o carregamento das reservas passou a inflar a Dívida Bruta (DBGG vs. DLSP).",
      externalWind: 2,
      renuncias: 150,
      cortes: 50,
      selic: 11.25,
      reforma: 60
    },
    dilma2014: {
      id: "dilma2014",
      block: "historico",
      icon: "⚠️",
      shortTitle: "2012–2015: Desonerações",
      subtitle: "Virada Externa + Crise",
      name: "Memória Histórica (2012–2015): Fim do Vento Externo e Explosão de Renúncias",
      desc: "Nos pós-crise de 2008, o ciclo internacional virou contra a partir de 2011. Tentou-se segurar o crescimento multiplicando desonerações setoriais e baixando juros sem coordenação fiscal. A arrecadação despencou e levou ao Teto de Gastos (2016).",
      historicalContext: "🧬 Cicatriz que ficou para hoje: Os 'sacos de chumbo' das desonerações se acumularam de governo em governo até chegar nos atuais R$ 600–800 bilhões (6% do PIB)!",
      externalWind: -1,
      renuncias: 0,
      cortes: -75,
      selic: 9.0,
      reforma: 10
    }
  };

  function calculateMacroState(inputs, activeScenarioId) {
    const renuncias = Number(inputs.renuncias);
    const cortes = Number(inputs.cortes);
    const selic = Number(inputs.selic);
    const reforma = Number(inputs.reforma);
    const scenario = SCENARIOS[activeScenarioId] || SCENARIOS.atual;
    const extWind = scenario.externalWind || 0;

    // 1. Fluxo Primário (% do PIB): ~R$ 100 bi equivale a ~1% do PIB (As Torneiras da Pia)
    const esforcoFiscalPIB = (renuncias + cortes) / 100.0;
    const primario = -1.3 + esforcoFiscalPIB + (extWind * 0.25);

    // 2. Juro de Equilíbrio Endógeno e Banda Estrutural CFMN (Lara Resende / De Bolle)
    const juroEquilibrio = 12.6 - (primario * 1.45) - (reforma * 0.032) - (extWind * 0.5);
    const hiatoJuros = selic - juroEquilibrio; // Negativo = tentou baixar Selic "na marra" sem âncora

    // 3. Pressão na Caldeira (Inflação % a.a.) + Efeito de Dominância Fiscal/Risco
    let inflacao = 4.2 - (hiatoJuros * 0.45) - (reforma * 0.007);
    if (primario < -1.0) {
      inflacao += Math.abs(primario + 1.0) * 1.2;
    }
    // Falsa Racionalidade (Lara Resende): Selic extrema (>15%) sem reforma pressiona risco intertemporal
    if (selic > 15.0 && reforma < 40) {
      inflacao += (selic - 15.0) * 0.25;
    }
    inflacao = Math.max(2.2, Math.min(18.0, inflacao));

    // 4. Participação das LFTs ("Água Laranja com Fermento": 51,6% em Nov/2026 vs 38% em 2022)
    // A coordenação CFMN + swap gradual reduz a fatia pós-fixada; juros extremos sem reforma aumentam a demanda por LFT
    const lftShare = Math.max(30.0, Math.min(58.0,
      51.6 - ((reforma - 20) * 0.24) + ((selic - 13.75) * 0.85)
    ));

    // Serviço de Juros da Dívida e Efeito Duplo da Duration Curta do Tesouro Selic ("Eu Acuso" & "Basicão 13/11")
    const fatorIndexacao = 0.68 - (reforma * 0.0032);
    const premioRisco = hiatoJuros < -1.5 ? Math.abs(hiatoJuros + 1.5) * 0.95 : 0;
    const bonusTransicaoCFMN = (reforma >= 60 && selic <= 11.25 && hiatoJuros >= -1.4) ? 0.65 : 0;
    const jurosFluxo = -Math.max(3.2, ((selic * fatorIndexacao) + premioRisco - bonusTransicaoCFMN));
    const nominal = primario + jurosFluxo;

    // Estado do Duto Tesouro Selic: "alivio_cfmn" vs "drenagem_critica"
    const pipeFlowMode = (reforma >= 60 && Math.abs(jurosFluxo) <= 6.2 && hiatoJuros >= -1.4)
      ? "alivio_cfmn"
      : (Math.abs(jurosFluxo) >= 8.2 ? "drenagem_critica" : "neutro");

    // 5. Crescimento Endógeno do PIB (Y = C + I + G + X - M)
    let pibGrowth = 2.2 + (extWind * 0.9);
    pibGrowth += (primario > -0.5 && primario <= 2.2) ? 0.65 : -0.8;
    if (cortes > 100) {
      pibGrowth -= ((cortes - 100) / 100.0) * 1.85;
    }
    if (selic > 12.75) {
      pibGrowth -= (selic - 12.75) * 0.38;
    }
    if (inflacao > 5.5) {
      pibGrowth -= (inflacao - 5.5) * 0.55;
    }
    pibGrowth += (reforma * 0.009);
    pibGrowth = Math.max(-3.5, Math.min(5.2, pibGrowth));

    // Decomposição didática da Identidade Y = C + I + G + (X - M)
    const custoCredito = (selic - 11.0);
    const compC = Math.max(45, Math.min(68, Math.round(
      62 - (custoCredito * 0.45) - (cortes > 100 ? (cortes - 100) * 0.03 : 0) - (inflacao > 5 ? (inflacao - 5) * 0.75 : 0)
    )));
    const compI = Math.max(10, Math.min(24, Math.round(
      17 - (custoCredito * 0.75) + (reforma * 0.035)
    )));
    const compG = Math.max(12, Math.min(25, Math.round(19 - (cortes / 45))));
    const compNX = Math.max(-3, Math.min(6, Math.round(2 + extWind * 1.5)));

    // 6. Estoque Dívida/PIB projetado
    let dividaProj = 82.9 - primario + (Math.abs(jurosFluxo) * 0.56) - (pibGrowth * 1.18);
    dividaProj = Math.max(66.0, Math.min(98.0, dividaProj));

    // 7. Coesão Social e Conflito Distributivo (De Bolle & Kupfer)
    let coesao = 76;
    if (cortes > 75) coesao -= (cortes - 75) * 0.22;
    if (inflacao > 5.0) coesao -= (inflacao - 5.0) * 4.5;
    if (pibGrowth < 1.0) coesao -= (1.0 - pibGrowth) * 6.0;
    if (Math.abs(jurosFluxo) > 8.5 && renuncias < 100) coesao -= 4;
    coesao = Math.max(10, Math.min(96, Math.round(coesao)));

    // 8. Prazo Médio Efetivo de Rolagem da Dívida (em anos; média atual ~3 a 4 anos apesar das LFTs de 6 anos)
    const matYears = Math.max(1.2, 3.5 + (reforma * 0.025) + (primario * 0.35) - (inflacao > 5 ? 1.0 : 0));

    // 9. Saúde Geral (HP rumo a 2030)
    let hp = 87;
    if (dividaProj > 80) hp -= (dividaProj - 80) * 2.2;
    if (inflacao > 4.5) hp -= (inflacao - 4.5) * 5.5;
    if (coesao < 70) hp -= (70 - coesao) * 1.1;
    if (pibGrowth < 1.5) hp -= (1.5 - pibGrowth) * 6.0;
    hp = Math.max(5, Math.min(100, Math.round(hp)));

    // 10. Determinação do Modo de Operação / Diagnóstico Teórico Integrado
    let mode = "ok";
    let statusText = "✅ Tanque Estabilizado: Coordenação CFMN & Swap Gradual de LFTs!";
    let failureReason = "A revisão de privilégios (~R$ " + renuncias + " bi) somada à Coordenação CFMN e ao swap gradual reduziu a camada autoexpansiva (LFTs recuando para " + lftShare.toFixed(1).replace(".", ",") + "% da dívida). Na descida coordenada da Selic, o gasto com juros caiu para " + Math.abs(jurosFluxo).toFixed(1).replace(".", ",") + "% do PIB e destravou o PIB (Y).";

    if (cortes >= 175) {
      mode = "collapse_social";
      statusText = "🚨 GAME OVER: Colapso da Ponte por Estrangulamento da Válvula Social!";
      failureReason = "Ao cortar profundamente programas sociais e investimentos (G), a demanda agregada (Y = C+I+G+X-M) despencou. Fechar a válvula primária não impediu a camada autoexpansiva (" + lftShare.toFixed(1).replace(".", ",") + "% em LFTs pós-fixadas) de elevar o nível do tanque sozinha!";
    } else if (hiatoJuros < -1.75 || primario < -1.2) {
      mode = "collapse_boiler";
      statusText = "💥 GAME OVER: Explosão da Caldeira (Câmbio Futuro & Juro na Marra)!";
      failureReason = "Baixar a Selic 'na marra' sem CFMN ou expandir déficit sem receita disparou apostas no mercado futuro de câmbio (US$ 20–35 bi/dia na B3 vs. US$ 1–3 bi à vista). O 'rabo abanou o cachorro': a PTAX saltou, os swaps do BC geraram perdas na DBGG e a caldeira explodiu.";
    } else if (selic >= 13.25 && primario >= 0.2 && dividaProj >= 83.5) {
      mode = "warning";
      statusText = "⚠️ Expansão Endógena de LFTs (" + lftShare.toFixed(1).replace(".", ",") + "% | r − g = +5,7%)";
      failureReason = "Você fechou as válvulas do primário, mas manteve a Selic em " + selic.toFixed(2).replace(".", ",") + "% com " + lftShare.toFixed(1).replace(".", ",") + "% da dívida em LFTs pós-fixadas (De Bolle 13/11 & J’Accuse). A camada autoexpansiva no tanque cresce por inércia de juros e drena " + Math.abs(jurosFluxo).toFixed(1).replace(".", ",") + "% do PIB!";
    } else if (dividaProj >= 85.5 || hp < 72) {
      mode = "warning";
      statusText = "⚠️ Sobrecarga no Tanque: Indexação LFT (" + lftShare.toFixed(1).replace(".", ",") + "%) & Drenagem de Juros";
      failureReason = "O país não quebra porque emite dívida em Reais, mas os " + lftShare.toFixed(1).replace(".", ",") + "% de LFTs pós-fixadas (expansão endógena à Selic), o serviço de juros (" + Math.abs(jurosFluxo).toFixed(1).replace(".", ",") + "% do PIB) e as renúncias fiscais sobrecarregam o tanque rumo a 86%–87% do PIB, provocando crise de crédito privado.";
    }

    return {
      renuncias,
      cortes,
      selic,
      reforma,
      extWind,
      primario,
      jurosFluxo,
      nominal,
      inflacao,
      pibGrowth,
      dividaProj,
      coesao,
      matYears,
      lftShare,
      hp,
      mode,
      pipeFlowMode,
      statusText,
      failureReason,
      components: { C: compC, I: compI, G: compG, NX: compNX }
    };
  }

  return {
    SCENARIOS,
    calculateMacroState
  };
})();
