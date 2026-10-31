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
      desc: "A dívida subiu de 71% (2022) para 82,9% do PIB. O Brasil NÃO vai quebrar porque emite dívida em Reais, mas como rola tudo em apenas 3 anos e tem títulos indexados à Selic (LFTs), o pagamento de juros consome ~9% do PIB por ano.",
      historicalContext: "🎯 Desafio 2026–2030: Impedir que a dívida salte para 87% do PIB sem destruir os pilares sociais nem explodir a caldeira da inflação.",
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
      subtitle: "Ajuste Justo + Coordenação",
      name: "Solução Calibrada: Revisão de Desonerações + Coordenação Fiscal-Monetária",
      desc: "Você removeu R$ 225 bi dos 'sacos de chumbo' (gastos tributários ineficientes), cortou desperdícios/penduricalhos preservando programas sociais, adotou meta crível de 4% e desindexou títulos da Selic (proposta Lara Resende / De Bolle).",
      historicalContext: "✅ Resultado rumo a 2030: O PIB cresce de forma endógena (alargando o tanque), os juros caem com segurança e o centro democrático se fortalece!",
      externalWind: 0,
      renuncias: 225,
      cortes: 75,
      selic: 10.25,
      reforma: 80
    },
    tesouraco: {
      id: "tesouraco",
      block: "atual",
      icon: "✂️",
      shortTitle: "Armadilha: Tesouraço",
      subtitle: "Cortar tudo no social",
      name: "Extremo 1 ('Faria Lima'): Tesouraço Linear em Investimento e Social",
      desc: "Você manteve os privilégios tributários intactos e passou a motosserra em programas sociais e investimentos públicos (G). A demanda agregada (Y = C+I+G+X-M) despencou, estreitando o tanque do PIB!",
      historicalContext: "🚨 Lição de Engenharia: Quando você corta o que sustenta a base, o denominador (PIB) encolhe, a fração Dívida/PIB não cai e a ponte social rui.",
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
      desc: "Você comparou o Brasil com Japão/EUA para dizer que 'dívida não importa', expandiu gastos sem receita e derrubou a Selic na marra para 7,5%. O prêmio de risco disparou e a caldeira inflacionária explodiu!",
      historicalContext: "💥 Lição de Engenharia: Crescimento não cai do céu ('rezar para pneu'). Sem âncora fiscal, baixar juro na marra gera inflação e força juros ainda maiores depois.",
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
      desc: "Para acabar com a hiperinflação sem congelar preços, o Plano Real criou uma moeda virtual (URV) que alinhou os preços relativos antes de virar o Real. A caldeira foi domada, mas a indexação dos títulos públicos à Selic (LFTs) sobreviveu.",
      historicalContext: "🧬 Cicatriz que ficou para hoje: Vencemos a hiperinflação, mas mantivemos o 'Duto LFT' que liga a Selic diretamente ao estoque da dívida pública.",
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

    // 2. Juro de Equilíbrio Endógeno vs. Selic escolhida
    const juroEquilibrio = 12.5 - (primario * 1.4) - (reforma * 0.025) - (extWind * 0.5);
    const hiatoJuros = selic - juroEquilibrio; // Negativo = tentou baixar Selic "na marra"

    // 3. Pressão na Caldeira (Inflação % a.a.)
    let inflacao = 4.2 - (hiatoJuros * 0.45) - (reforma * 0.006);
    if (primario < -1.0) {
      inflacao += Math.abs(primario + 1.0) * 1.2;
    }
    inflacao = Math.max(2.2, Math.min(18.0, inflacao));

    // 4. Serviço de Juros da Dívida (Fluxo Nominal)
    // Quanto menor a reforma de desindexação, maior o contágio Selic -> Dívida (LFTs)
    const fatorIndexacao = 0.68 - (reforma * 0.003);
    const premioRisco = hiatoJuros < -1.5 ? Math.abs(hiatoJuros + 1.5) * 0.9 : 0;
    const jurosFluxo = -((selic * fatorIndexacao) + premioRisco);
    const nominal = primario + jurosFluxo;

    // 5. Crescimento Endógeno do PIB (Y = C + I + G + X - M)
    let pibGrowth = 2.2 + (extWind * 0.9);
    pibGrowth += (primario > -0.5 && primario <= 2.0) ? 0.6 : -0.8;
    if (cortes > 100) {
      pibGrowth -= ((cortes - 100) / 100.0) * 1.8;
    }
    if (selic > 13.0) {
      pibGrowth -= (selic - 13.0) * 0.35;
    }
    if (inflacao > 5.5) {
      pibGrowth -= (inflacao - 5.5) * 0.55;
    }
    pibGrowth += (reforma * 0.008);
    pibGrowth = Math.max(-3.5, Math.min(5.2, pibGrowth));

    // Decomposição didática da Identidade Y = C + I + G + (X - M)
    const compC = Math.max(45, Math.min(68, Math.round(62 - (cortes > 100 ? (cortes - 100) * 0.03 : 0) - (inflacao > 5 ? (inflacao - 5) * 0.8 : 0))));
    const compI = Math.max(11, Math.min(24, Math.round(17 - (selic - 11) * 0.6 + (reforma * 0.03))));
    const compG = Math.max(12, Math.min(25, Math.round(19 - (cortes / 45))));
    const compNX = Math.max(-3, Math.min(6, Math.round(2 + extWind * 1.5)));

    // 6. Estoque Dívida/PIB projetado
    let dividaProj = 82.9 - primario + (Math.abs(jurosFluxo) * 0.55) - (pibGrowth * 1.15);
    dividaProj = Math.max(66.0, Math.min(98.0, dividaProj));

    // 7. Coesão Social e Estabilidade dos Pilares da Ponte
    let coesao = 75;
    if (cortes > 75) coesao -= (cortes - 75) * 0.22;
    if (inflacao > 5.0) coesao -= (inflacao - 5.0) * 4.5;
    if (pibGrowth < 1.0) coesao -= (1.0 - pibGrowth) * 6.0;
    coesao = Math.max(10, Math.min(95, Math.round(coesao)));

    // 8. Prazo Médio de Rolagem da Dívida (em anos)
    const matYears = Math.max(1.2, 3.0 + (reforma * 0.03) + (primario * 0.4) - (inflacao > 5 ? 1.0 : 0));

    // 9. Saúde Geral (HP rumo a 2030)
    let hp = 86;
    if (dividaProj > 80) hp -= (dividaProj - 80) * 2.2;
    if (inflacao > 4.5) hp -= (inflacao - 4.5) * 5.5;
    if (coesao < 70) hp -= (70 - coesao) * 1.1;
    if (pibGrowth < 1.5) hp -= (1.5 - pibGrowth) * 6.0;
    hp = Math.max(5, Math.min(100, Math.round(hp)));

    // 10. Determinação do Modo de Operação / Falha
    let mode = "ok";
    let statusText = "✅ Planta Estável: Crescimento Endógeno Ativo!";
    let failureReason = "A combinação de revisão de gastos tributários (desonerações), preservação dos pilares sociais e coordenação fiscal-monetária estabilizou a razão Dívida/PIB e permitiu queda segura da Selic.";

    if (cortes >= 175) {
      mode = "collapse_social";
      statusText = "🚨 GAME OVER: Colapso da Ponte por Tesouraço!";
      failureReason = "Ao cortar profundamente programas sociais e investimentos públicos (G), a demanda agregada (Y = C+I+G+X-M) despencou. O tanque do PIB estreitou, impedindo a queda da Dívida/PIB e rachando a coesão social rumo a 2030.";
    } else if (hiatoJuros < -1.75 || primario < -1.2) {
      mode = "collapse_boiler";
      statusText = "💥 GAME OVER: Explosão da Caldeira (Inflação & Risco)!";
      failureReason = "Negar o ajuste fiscal ou tentar baixar a Selic 'na marra' sem âncora fiscal fez o prêmio de risco explodir. Como o Brasil rola 100% da dívida em 3 anos, a inflação disparou e forçará juros ainda mais altos.";
    } else if (dividaProj >= 85.5 || hp < 72) {
      mode = "warning";
      statusText = "⚠️ Alerta de Fadiga: Bola de Neve dos Juros Ativa";
      failureReason = "O país não quebra porque a dívida é em Reais, mas o estoque Dívida/PIB continua subindo rumo a 86%–87%. Os 'sacos de chumbo' das desonerações e o duto de indexação LFT mantêm o déficit nominal perto de 9% do PIB.";
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
