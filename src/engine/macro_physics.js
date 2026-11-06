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
      shortTitle: "Base Out/2026",
      subtitle: "Dívida 82,9% | Selic 13,75%",
      name: "Momento Atual: Brasil Pós-Eleição (Outubro de 2026)",
      desc: "A dívida subiu para 82,9% do PIB. Enquanto o déficit primário é < 1% do PIB, o serviço de juros consome ~9% do PIB (Falsa Racionalidade). A Selic real excessiva inunda a dívida via Tesouro Selic e transfere orçamento público para o rentismo.",
      historicalContext: "🎯 Desafio 2026–2030: Estancar a drenagem de ~9% do PIB em juros e revisar privilégios tributários sem destruir os pilares sociais nem explodir a caldeira.",
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
      desc: "Você cortou R$ 225 bi de renúncias fiscais ineficientes, preservou o investimento social e ativou a Coordenação Fiscal-Monetária (CFMN + Meta 4% + Escudo Cambial). Na descida coordenada, a duration curta do Tesouro Selic gera alívio fiscal imediato!",
      historicalContext: "✅ Resultado rumo a 2030: O serviço de juros recua fortemente, o PIB (Y) cresce alargando o tanque e o conflito distributivo é desarmado!",
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
      desc: "Você manteve R$ 600–800 bi de privilégios tributários intactos, cortou investimentos e proteção social (G) e subiu a Selic para 14,25%. O denominador (PIB) encolheu e a conta de juros continuou engolindo o orçamento (conflito distributivo regressivo).",
      historicalContext: "🚨 Lição (Lara Resende & Kupfer): Nenhum corte primário compensa juros reais de ~9% do PIB; cortar a base social deprime Y e eleva a razão Dívida/PIB.",
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
      desc: "Você ignorou o ajuste pelo lado da receita, expandiu gastos sem âncora e derrubou a Selic na marra para 7,5% sem coordenação institucional (CFMN). A fuga de carry-trade desancorou o câmbio e explodiu a caldeira inflacionária!",
      historicalContext: "💥 Lição de Engenharia: Baixar juro 'na marra' sem âncora fiscal nem blindagem cambial dispara o prêmio de risco e força juros ainda maiores depois.",
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
      subtitle: "Década Perdida & Indexação",
      name: "Memória Histórica (Anos 1980): Moratória da Dívida e Hiperinflação",
      desc: "Nos anos 1980, o Brasil declarou moratória (deixou de pagar a dívida externa) e enfrentou 25 anos de hiperinflação. Para a economia funcionar, criamos a 'correção monetária' (indexação geral de contratos e títulos públicos).",
      historicalContext: "🧬 Cicatriz que ficou para hoje: Todo país que já deu moratória paga prêmio de risco maior e só consegue rolar dívida em prazo curto (3 anos no Brasil vs. décadas no Japão).",
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
      subtitle: "Fim da Hiper + Juro Alto",
      name: "Memória Histórica (1994): A Engenharia da URV e o Plano Real",
      desc: "Para acabar com a hiperinflação sem congelar preços, o Plano Real criou uma moeda virtual (URV) que alinhou os preços relativos antes de virar o Real. A caldeira foi domada, mas a indexação dos títulos públicos à taxa Selic (o Tesouro Selic) sobreviveu.",
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
      shortTitle: "2003–2010: Commodities",
      subtitle: "Vento Externo & PIB Alto",
      name: "Memória Histórica (2003–2010): O Superciclo Mundial de Commodities",
      desc: "Durante os dois primeiros governos Lula, a economia mundial e a China cresciam acelerado comprando matérias-primas. O denominador da fração (PIB) crescia tanto que a razão Dívida/PIB caía mesmo com o gasto subindo.",
      historicalContext: "🧬 Cicatriz que ficou para hoje: Criou a ilusão em parte do debate de que 'basta crescer que a dívida se resolve sozinha', esquecendo que o vento externo favorável acabou.",
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
    const compC = Math.max(45, Math.min(68, Math.round(62 - (cortes > 100 ? (cortes - 100) * 0.03 : 0) - (inflacao > 5 ? (inflacao - 5) * 0.8 : 0))));
    const compI = Math.max(11, Math.min(24, Math.round(17 - (selic - 11) * 0.6 + (reforma * 0.035))));
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
    let failureReason = "A revisão de privilégios tributários (~R$ " + renuncias + " bi) somada à Coordenação Fiscal-Monetária (CFMN) permitiu reduzir a Selic com segurança. A duration curta do Tesouro Selic funcionou a favor na descida, derrubando o gasto com juros para " + Math.abs(jurosFluxo).toFixed(1).replace(".", ",") + "% do PIB e destravando o PIB (Y).";

    if (cortes >= 175) {
      mode = "collapse_social";
      statusText = "🚨 GAME OVER: Colapso da Ponte por Tesouraço!";
      failureReason = "Ao cortar profundamente programas sociais e investimentos públicos (G), a demanda agregada (Y = C+I+G+X-M) despencou. O tanque do PIB estreitou, agravando o conflito distributivo (De Bolle & Kupfer) sem resolver a razão Dívida/PIB.";
    } else if (hiatoJuros < -1.75 || primario < -1.2) {
      mode = "collapse_boiler";
      statusText = "💥 GAME OVER: Explosão da Caldeira (Juro na Marra / Sem Âncora)!";
      failureReason = "Baixar a Selic 'na marra' sem coordenação institucional (CFMN) ou expandir déficit sem receita provocou fuga de capitais e disparada do prêmio de risco. Como o Brasil rola a dívida em 3 anos, a caldeira inflacionária explodiu.";
    } else if (selic >= 13.25 && primario >= 0.2 && dividaProj >= 83.5) {
      mode = "warning";
      statusText = "⚠️ Armadilha da 'Falsa Racionalidade' (Juros Alimentando a Dívida)";
      failureReason = "Mesmo com esforço primário positivo, manter a Selic em " + selic.toFixed(2).replace(".", ",") + "% drena " + Math.abs(jurosFluxo).toFixed(1).replace(".", ",") + "% do PIB em juros via Tesouro Selic (Lara Resende). Sem ativar a Coordenação CFMN e reduzir a Selic para a banda estrutural, o próprio juro impede a queda da Dívida/PIB.";
    } else if (dividaProj >= 85.5 || hp < 72) {
      mode = "warning";
      statusText = "⚠️ Alerta de Fadiga: Drenagem de Juros & Conflito Distributivo";
      failureReason = "O país não quebra porque emite dívida em Reais, mas o serviço de juros (" + Math.abs(jurosFluxo).toFixed(1).replace(".", ",") + "% do PIB) e os 'sacos de chumbo' das renúncias fiscais empurram a dívida rumo a 86%–87%, comprimindo o orçamento público.";
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
