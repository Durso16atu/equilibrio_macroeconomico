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
      subtitle: "DBGG 82,9% | Selic 13,75%",
      name: "Momento Atual: Brasil Pós-Eleição (Novembro de 2026)",
      desc: "A Dívida Bruta (DBGG) chegou a 82,9% do PIB (R$ 10,9 tri; Líquida DLSP em 69,1%, pois a bruta carrega US$ 350 bi de reservas e swaps do BC). O primário é < 1% do PIB, mas os juros fazem a dívida crescer 12,7% a.a. contra 7% do PIB nominal (+5,7% a.a. — J’Accuse).",
      historicalContext: "🎯 Desafio 2026–2030: Desarmar a bomba de juros (R$ 1,15–1,4 tri/ano) e o nó do câmbio futuro sem Tesouraço nem Negacionismo.",
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
      subtitle: "CFMN + Ajuste Justo",
      name: "Solução Calibrada: Coordenação CFMN + Revisão de Gastos Tributários",
      desc: "Você cortou R$ 225 bi de renúncias fiscais ineficientes, preservou o investimento social e ativou a Coordenação CFMN (banda da Selic + reservas > US$ 350 bi + freio à alavancagem no câmbio futuro). Na descida coordenada, a duration curta das LFTs gera alívio imediato de ~4% do PIB!",
      historicalContext: "✅ Resultado rumo a 2030: O diferencial r − g recua, os swaps cambiais deixam de pressionar a DBGG e o PIB (Y) cresce alargando o tanque!",
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
      subtitle: "Cortar social + Juro 14,25%",
      name: "Extremo 1 ('Faria Lima'): Tesouraço no Social + Juro Real Excessivo",
      desc: "Você manteve R$ 600–800 bi de privilégios tributários intactos, cortou investimentos e proteção social (G) e subiu a Selic para 14,25%. O denominador (PIB) encolheu e a conta de juros (R$ 1,4 tri na DBGG) continuou engolindo o orçamento.",
      historicalContext: "🚨 Lição (J’Accuse & Kupfer): Nenhum corte primário compensa juros de 8,7% a 10,5% do PIB; cortar a base social deprime Y e eleva a razão Dívida/PIB.",
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
      name: "Extremo 2 ('Negacionismo Fiscal'): Ignorar a Dívida e Baixar Juros na Marra",
      desc: "Você ignorou o ajuste pela receita e derrubou a Selic na marra para 7,5% sem coordenação (CFMN). No Brasil 'o rabo abana o cachorro': o desmonte de apostas no câmbio futuro (US$ 20–35 bi/dia na B3) disparou a PTAX, gerou perdas nos swaps do BC e explodiu a caldeira!",
      historicalContext: "💥 Lição (De Bolle & Kupfer): Como o câmbio é formado no futuro com margem baixa, cortar juro sem âncora nem escudo cambial dispara a PTAX e a inflação.",
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
      historicalContext: "🧬 Cicatriz que ficou para hoje: Rolagem curta da dívida (3 anos) e hipertrofia do mercado futuro de câmbio na B3 frente a um mercado à vista minúsculo.",
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
      name: "Memória Histórica (1994): A Engenharia da URV e o Plano Real",
      desc: "Para acabar com a hiperinflação sem congelar preços, o Plano Real criou uma moeda virtual (URV) que alinhou os preços relativos antes de virar o Real. A caldeira foi domada, mas a indexação dos títulos públicos à taxa Selic (o Tesouro Selic / LFT) sobreviveu.",
      historicalContext: "🧬 Cicatriz que ficou para hoje: Vencemos a hiperinflação, mas mantivemos o 'Duto Tesouro Selic' que liga a taxa de juros diretamente ao estoque da dívida pública.",
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

    // 1. Fluxo Primário (% do PIB): ~R$ 100 bi equivale a ~1% do PIB
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

    // 4. Serviço de Juros da Dívida e Efeito Duplo da Duration Curta do Tesouro Selic ("Eu Acuso")
    // Na subida sem reforma: contágio alto (~68%). Na descida coordenada (CFMN >= 60): a duration curta acelera o alívio fiscal!
    const fatorIndexacao = 0.68 - (reforma * 0.0032);
    const premioRisco = hiatoJuros < -1.5 ? Math.abs(hiatoJuros + 1.5) * 0.95 : 0;
    const bonusTransicaoCFMN = (reforma >= 60 && selic <= 11.25 && hiatoJuros >= -1.4) ? 0.65 : 0;
    const jurosFluxo = -Math.max(3.2, ((selic * fatorIndexacao) + premioRisco - bonusTransicaoCFMN));
    const nominal = primario + jurosFluxo;

    // Estado do Duto Tesouro Selic: "alivio_cfmn" vs "drenagem_rentista"
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
    // Canal de Transmissão Monetária (De Bolle, Basicão: Política Monetária): ↑i encarece o crédito e reduz tanto C quanto I
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
    // Drenagem regressiva: juros altos + renúncias intocadas comprimem coesão
    if (Math.abs(jurosFluxo) > 8.5 && renuncias < 100) coesao -= 4;
    coesao = Math.max(10, Math.min(96, Math.round(coesao)));

    // 8. Prazo Médio de Rolagem da Dívida (em anos)
    const matYears = Math.max(1.2, 3.0 + (reforma * 0.03) + (primario * 0.4) - (inflacao > 5 ? 1.0 : 0));

    // 9. Saúde Geral (HP rumo a 2030)
    let hp = 87;
    if (dividaProj > 80) hp -= (dividaProj - 80) * 2.2;
    if (inflacao > 4.5) hp -= (inflacao - 4.5) * 5.5;
    if (coesao < 70) hp -= (70 - coesao) * 1.1;
    if (pibGrowth < 1.5) hp -= (1.5 - pibGrowth) * 6.0;
    hp = Math.max(5, Math.min(100, Math.round(hp)));

    // 10. Determinação do Modo de Operação / Diagnóstico Teórico Integrado
    let mode = "ok";
    let statusText = "✅ Planta Estável: Coordenação CFMN & Crescimento Endógeno!";
    let failureReason = "A revisão de privilégios (~R$ " + renuncias + " bi) somada à Coordenação CFMN (banda da Selic + reservas > US$ 350 bi + disciplina no câmbio futuro) permitiu reduzir a Selic com segurança. A duration curta das LFTs gerou alívio imediato (~4% do PIB), derrubando os juros para " + Math.abs(jurosFluxo).toFixed(1).replace(".", ",") + "% do PIB e destravando o PIB (Y).";

    if (cortes >= 175) {
      mode = "collapse_social";
      statusText = "🚨 GAME OVER: Colapso da Ponte por Tesouraço!";
      failureReason = "Ao cortar profundamente programas sociais e investimentos públicos (G), a demanda agregada (Y = C+I+G+X-M) despencou. O tanque do PIB estreitou, agravando o conflito distributivo (De Bolle & Kupfer) sem resolver a razão Dívida/PIB.";
    } else if (hiatoJuros < -1.75 || primario < -1.2) {
      mode = "collapse_boiler";
      statusText = "💥 GAME OVER: Explosão da Caldeira (Câmbio Futuro & Juro na Marra)!";
      failureReason = "Baixar a Selic 'na marra' sem CFMN ou expandir déficit sem receita disparou apostas no mercado futuro de câmbio (US$ 20–35 bi/dia na B3 vs. US$ 1–3 bi à vista). O 'rabo abanou o cachorro': a PTAX saltou, os swaps cambiais do BC geraram perdas na DBGG e a caldeira inflacionária explodiu.";
    } else if (selic >= 13.25 && primario >= 0.2 && dividaProj >= 83.5) {
      mode = "warning";
      statusText = "⚠️ Armadilha da 'Falsa Racionalidade' (r − g = +5,7% a.a.)";
      failureReason = "Mesmo com esforço primário, manter a Selic em " + selic.toFixed(2).replace(".", ",") + "% drena " + Math.abs(jurosFluxo).toFixed(1).replace(".", ",") + "% do PIB em juros via LFTs e eleva o custo de carregar as reservas na DBGG (Lara Resende — J’Accuse). Sem ativar o CFMN e reduzir a Selic rumo à banda potencial, o próprio juro expande a Dívida/PIB.";
    } else if (dividaProj >= 85.5 || hp < 72) {
      mode = "warning";
      statusText = "⚠️ Alerta de Fadiga: Drenagem de Juros (DBGG) & Conflito Distributivo";
      failureReason = "O país não quebra porque emite dívida em Reais, mas o serviço de juros (" + Math.abs(jurosFluxo).toFixed(1).replace(".", ",") + "% do PIB), o carregamento de reservas/swaps na DBGG (82,9% vs. 69,1% DLSP) e as renúncias fiscais empurram a dívida rumo a 86%–87%, comprimindo o orçamento público.";
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
