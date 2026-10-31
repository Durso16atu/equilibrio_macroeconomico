/**
 * Renderizador Gráfico 2D (Canvas 60 FPS) — Engenharia da Estabilidade
 * Desenha o Tanque Hidráulico (Estoque/Fluxo), o Duto Tesouro Selic, a Caldeira Termodinâmica
 * e a Ponte Suspensa com Sacos de Desoneração e Pilares Sociais.
 */

window.CanvasRenderer = (function () {
  let canvas = null;
  let ctx = null;
  let tick = 0;
  let getStateFn = null;

  function init(canvasElement, stateCallback) {
    canvas = canvasElement;
    ctx = canvas.getContext("2d");
    getStateFn = stateCallback;
    requestAnimationFrame(loop);
  }

  function loop() {
    tick += 0.05;
    if (canvas && ctx && getStateFn) {
      draw(getStateFn());
    }
    requestAnimationFrame(loop);
  }

  function draw(state) {
    const isLight = document.documentElement.classList.contains("light");
    
    // Paleta de laboratório técnico / blueprint
    const fg = isLight ? "#111422" : "#f0f2f8";
    const muted = isLight ? "#5e6682" : "#8b92a8";
    const bg = isLight ? "#f5f6fa" : "#06080e";
    const cardBg = isLight ? "#ffffff" : "#11131c";
    const borderCol = isLight ? "#d4d8e6" : "#222638";
    const cyan = isLight ? "#0891b2" : "#06b6d4";

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Grade técnica de engenharia no fundo
    ctx.strokeStyle = isLight ? "rgba(212, 216, 230, 0.45)" : "rgba(34, 38, 56, 0.55)";
    ctx.lineWidth = 1;
    for (let gx = 0; gx < canvas.width; gx += 28) {
      ctx.beginPath();
      ctx.moveTo(gx, 0);
      ctx.lineTo(gx, canvas.height);
      ctx.stroke();
    }
    for (let gy = 0; gy < canvas.height; gy += 28) {
      ctx.beginPath();
      ctx.moveTo(0, gy);
      ctx.lineTo(canvas.width, gy);
      ctx.stroke();
    }

    ctx.save();
    // Tremor de câmera 2D em caso de Game Over
    if (state.mode === "collapse_boiler" || state.mode === "collapse_social") {
      const shakeX = (Math.random() - 0.5) * 4.5;
      const shakeY = (Math.random() - 0.5) * 4.5;
      ctx.translate(shakeX, shakeY);
    }

    // =========================================================================
    // ESTAÇÃO 1 (ESQUERDA): TANQUE HIDRÁULICO (DÍVIDA / PIB)
    // =========================================================================
    const tankCenterX = 165;
    const tankHalfW = Math.max(54, Math.min(96, 74 + state.pibGrowth * 6));
    const tankTop = 68;
    const tankBottom = 272;
    const tankH = tankBottom - tankTop;

    ctx.fillStyle = fg;
    ctx.font = "700 12px 'Plus Jakarta Sans', sans-serif";
    ctx.textAlign = "center";
    ctx.fillText("1. TANQUE DÍVIDA / PIB", tankCenterX, 26);
    ctx.fillStyle = muted;
    ctx.font = "11px 'Plus Jakarta Sans', sans-serif";
    ctx.fillText("Largura = PIB (Y) | Nível = Estoque", tankCenterX, 42);

    // Nível de água proporcional à Dívida/PIB
    const fillRatio = Math.max(0.2, Math.min(0.96, (state.dividaProj - 60) / 36));
    const waterY = tankBottom - tankH * fillRatio;

    let waterColor = "rgba(16, 185, 129, 0.55)";
    if (state.dividaProj >= 85.5) waterColor = "rgba(244, 63, 94, 0.65)";
    else if (state.dividaProj >= 81.5) waterColor = "rgba(245, 158, 11, 0.60)";

    // Fluido com ondas senoidais
    ctx.fillStyle = waterColor;
    ctx.beginPath();
    ctx.moveTo(tankCenterX - tankHalfW, tankBottom);
    for (let x = -tankHalfW; x <= tankHalfW; x += 8) {
      const wave = Math.sin(tick * 2.2 + x * 0.07) * 3.5;
      ctx.lineTo(tankCenterX + x, waterY + wave);
    }
    ctx.lineTo(tankCenterX + tankHalfW, tankBottom);
    ctx.closePath();
    ctx.fill();

    // Linha de Alerta de Transbordamento
    ctx.strokeStyle = "#f43f5e";
    ctx.lineWidth = 1.5;
    ctx.setLineDash([5, 4]);
    ctx.beginPath();
    ctx.moveTo(tankCenterX - tankHalfW - 8, tankTop + 26);
    ctx.lineTo(tankCenterX + tankHalfW + 8, tankTop + 26);
    ctx.stroke();
    ctx.setLineDash([]);

    // Paredes Móveis do Tanque
    ctx.strokeStyle = borderCol;
    ctx.lineWidth = 3;
    ctx.strokeRect(tankCenterX - tankHalfW, tankTop, tankHalfW * 2, tankH);

    // Indicadores dentro do Tanque (usando fonte mono para os números)
    ctx.fillStyle = fg;
    ctx.font = "700 21px 'JetBrains Mono', monospace";
    ctx.fillText(`${state.dividaProj.toFixed(1).replace(".", ",")}%`, tankCenterX, tankBottom - 38);
    ctx.font = "600 11px 'JetBrains Mono', monospace";
    ctx.fillStyle = cyan;
    ctx.fillText(`PIB (Y): ${state.pibGrowth >= 0 ? "+" : ""}${state.pibGrowth.toFixed(1).replace(".", ",")}%`, tankCenterX, tankBottom - 18);
    ctx.fillStyle = muted;
    ctx.font = "11px 'JetBrains Mono', monospace";
    ctx.fillText(`Rolagem: ${state.matYears.toFixed(1).replace(".", ",")} anos`, tankCenterX, tankBottom + 20);

    // =========================================================================
    // DUTO DE RECIRCULAÇÃO TESOURO SELIC (SELIC -> ESTOQUE DA DÍVIDA)
    // =========================================================================
    const pipeThickness = Math.max(2, (105 - state.reforma) / 10);
    ctx.strokeStyle = "#f59e0b";
    ctx.lineWidth = pipeThickness;
    ctx.beginPath();
    ctx.moveTo(405, 145);
    ctx.lineTo(tankCenterX + tankHalfW, 145);
    ctx.stroke();

    // Partículas de juros fluindo pelo duto Tesouro Selic
    const pipeLen = 405 - (tankCenterX + tankHalfW);
    for (let p = 0; p < 3; p++) {
      const offset = ((tick * 38 + p * (pipeLen / 3)) % pipeLen);
      ctx.fillStyle = "#f59e0b";
      ctx.beginPath();
      ctx.arc(405 - offset, 145, 3.8, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.font = "600 11px 'Plus Jakarta Sans', sans-serif";
    ctx.fillStyle = muted;
    ctx.fillText("Duto Tesouro Selic", 332, 130);
    ctx.font = "600 11px 'JetBrains Mono', monospace";
    ctx.fillStyle = "#f59e0b";
    ctx.fillText(`Juros: ${state.jurosFluxo.toFixed(1).replace(".", ",")}% PIB`, 332, 165);

    // =========================================================================
    // ESTAÇÃO 2 (CENTRO): CALDEIRA TERMODINÂMICA (INFLAÇÃO & SELIC)
    // =========================================================================
    const boilerX = 468;
    const boilerY = 185;
    const boilerR = 64;

    ctx.fillStyle = fg;
    ctx.font = "700 12px 'Plus Jakarta Sans', sans-serif";
    ctx.fillText("2. CALDEIRA MONETÁRIA", boilerX, 26);
    ctx.fillStyle = muted;
    ctx.font = "11px 'Plus Jakarta Sans', sans-serif";
    ctx.fillText("Pressão = Inflação | Válvula = Selic", boilerX, 42);

    let boilerColor = "#10b981";
    if (state.inflacao > 5.5) boilerColor = "#f43f5e";
    else if (state.inflacao > 4.3) boilerColor = "#f59e0b";

    // Vapor escapando no topo da caldeira
    const steamCount = state.inflacao > 5.5 ? 6 : (state.inflacao > 4.2 ? 3 : 1);
    ctx.fillStyle = boilerColor;
    for (let i = 0; i < steamCount; i++) {
      const py = boilerY - boilerR - 8 - ((tick * 28 + i * 14) % 46);
      const px = boilerX + Math.sin(tick * 3 + i) * 15;
      ctx.globalAlpha = 0.45;
      ctx.beginPath();
      ctx.arc(px, py, 5 + i * 1.3, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1.0;

    // Casco da Caldeira
    ctx.fillStyle = cardBg;
    ctx.strokeStyle = boilerColor;
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.arc(boilerX, boilerY, boilerR, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    // Leituras da Caldeira
    ctx.fillStyle = fg;
    ctx.font = "700 19px 'JetBrains Mono', monospace";
    ctx.fillText(`${state.inflacao.toFixed(1).replace(".", ",")}% a.a.`, boilerX, boilerY - 6);
    ctx.font = "600 11px 'JetBrains Mono', monospace";
    ctx.fillStyle = muted;
    ctx.fillText(`Selic: ${state.selic.toFixed(2).replace(".", ",")}%`, boilerX, boilerY + 14);
    ctx.font = "10px 'Plus Jakarta Sans', sans-serif";
    ctx.fillText(state.reforma >= 60 ? "Meta 4% Crível" : "Meta 3% Sem Âncora", boilerX, boilerY + 32);
    ctx.font = "600 11px 'JetBrains Mono', monospace";
    ctx.fillText(`Nominal: ${state.nominal.toFixed(1).replace(".", ",")}% PIB`, boilerX, tankBottom + 20);

    // =========================================================================
    // ESTAÇÃO 3 (DIREITA): PONTE SUSPENSA (CARGAS, RENÚNCIAS E SOCIAL)
    // =========================================================================
    const bridgeCenterX = 745;
    const bridgeY = 168;
    const bridgeSpan = 126;

    ctx.fillStyle = fg;
    ctx.font = "700 12px 'Plus Jakarta Sans', sans-serif";
    ctx.fillText("3. PONTE SOCIAL & PRODUTIVA", bridgeCenterX, 26);
    ctx.fillStyle = muted;
    ctx.font = "11px 'Plus Jakarta Sans', sans-serif";
    ctx.fillText("Pesos = Desonerações | Pilares = Social", bridgeCenterX, 42);

    // Espessura dos Pilares Sociais
    const pillarW = Math.max(6, 18 - (state.cortes > 75 ? (state.cortes - 75) * 0.05 : 0));
    ctx.fillStyle = state.cortes >= 175 ? "#f43f5e" : "#475569";
    ctx.fillRect(bridgeCenterX - bridgeSpan + 12, bridgeY, pillarW, 104);
    ctx.fillRect(bridgeCenterX + bridgeSpan - 12 - pillarW, bridgeY, pillarW, 104);

    // Tabuleiro da Ponte
    ctx.save();
    ctx.translate(bridgeCenterX, bridgeY);
    let tilt = 0;
    if (state.cortes >= 150) tilt = -0.15;
    else if (state.dividaProj >= 86) tilt = 0.10;
    ctx.rotate(tilt);

    ctx.fillStyle = state.mode === "ok" ? "#10b981" : (state.mode.startsWith("collapse") ? "#f43f5e" : cyan);
    ctx.fillRect(-bridgeSpan, -5, bridgeSpan * 2, 10);

    // Sacos de Desoneração
    const remainingBags = Math.max(1, Math.round((350 - state.renuncias) / 70));
    for (let b = 0; b < remainingBags; b++) {
      const bx = -76 + b * 38;
      ctx.fillStyle = "#f59e0b";
      ctx.fillRect(bx - 11, 5, 22, 22);
      ctx.fillStyle = "#090a0f";
      ctx.font = "700 10px 'JetBrains Mono', monospace";
      ctx.fillText("R$", bx, 20);
    }
    ctx.restore();

    // Vento Externo
    if (state.extWind !== 0) {
      ctx.fillStyle = state.extWind > 0 ? "#10b981" : "#f43f5e";
      ctx.font = "600 11px 'Plus Jakarta Sans', sans-serif";
      const windLabel = state.extWind > 0 ? "🌬️ Vento Externo (Commodities +)" : "🌩️ Choque Externo Adverso (-)";
      ctx.fillText(windLabel, bridgeCenterX, 115);
    }

    ctx.fillStyle = muted;
    ctx.font = "11px 'Plus Jakarta Sans', sans-serif";
    ctx.fillText(`Sacos de Renúncias: ${remainingBags}x`, bridgeCenterX, tankBottom - 4);
    ctx.fillStyle = fg;
    ctx.font = "600 12px 'JetBrains Mono', monospace";
    ctx.fillText(`Coesão Social: ${state.coesao}%`, bridgeCenterX, tankBottom + 20);

    ctx.restore();
  }

  return {
    init
  };
})();
