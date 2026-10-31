/**
 * Renderizador Gráfico 2D (Canvas 60 FPS) — Engenharia da Estabilidade
 * Desenha o Tanque Hidráulico (Estoque/Fluxo), o Duto LFT, a Caldeira Termodinâmica
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
    const fg = isLight ? "#0f172a" : "#f8fafc";
    const muted = isLight ? "#475569" : "#94a3b8";
    const bg = isLight ? "#f1f5f9" : "#0b1120";
    const cardBg = isLight ? "#ffffff" : "#1e293b";
    const borderCol = isLight ? "#cbd5e1" : "#334155";

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Grade sutil de blueprint de engenharia no fundo
    ctx.strokeStyle = isLight ? "rgba(148, 163, 184, 0.18)" : "rgba(51, 65, 85, 0.35)";
    ctx.lineWidth = 1;
    for (let gx = 0; gx < canvas.width; gx += 32) {
      ctx.beginPath();
      ctx.moveTo(gx, 0);
      ctx.lineTo(gx, canvas.height);
      ctx.stroke();
    }
    for (let gy = 0; gy < canvas.height; gy += 32) {
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
    ctx.font = "bold 13px sans-serif";
    ctx.textAlign = "center";
    ctx.fillText("1. TANQUE DÍVIDA / PIB", tankCenterX, 26);
    ctx.fillStyle = muted;
    ctx.font = "11px sans-serif";
    ctx.fillText("Largura = PIB (Y) | Nível = Estoque", tankCenterX, 44);

    // Nível de água proporcional à Dívida/PIB
    const fillRatio = Math.max(0.2, Math.min(0.96, (state.dividaProj - 60) / 36));
    const waterY = tankBottom - tankH * fillRatio;

    let waterColor = "rgba(16, 185, 129, 0.55)";
    if (state.dividaProj >= 85.5) waterColor = "rgba(239, 68, 68, 0.65)";
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

    // Linha de Alerta de Transbordamento (Rolagem curta de 3 anos)
    ctx.strokeStyle = "#ef4444";
    ctx.lineWidth = 1.5;
    ctx.setLineDash([5, 4]);
    ctx.beginPath();
    ctx.moveTo(tankCenterX - tankHalfW - 8, tankTop + 26);
    ctx.lineTo(tankCenterX + tankHalfW + 8, tankTop + 26);
    ctx.stroke();
    ctx.setLineDash([]);

    // Paredes Móveis do Tanque
    ctx.strokeStyle = borderCol;
    ctx.lineWidth = 4;
    ctx.strokeRect(tankCenterX - tankHalfW, tankTop, tankHalfW * 2, tankH);

    // Indicadores dentro do Tanque
    ctx.fillStyle = fg;
    ctx.font = "bold 20px sans-serif";
    ctx.fillText(`${state.dividaProj.toFixed(1).replace(".", ",")}%`, tankCenterX, tankBottom - 38);
    ctx.font = "bold 11px sans-serif";
    ctx.fillStyle = muted;
    ctx.fillText(`PIB (Y): ${state.pibGrowth >= 0 ? "+" : ""}${state.pibGrowth.toFixed(1).replace(".", ",")}%`, tankCenterX, tankBottom - 18);
    ctx.fillText(`Prazo Rolagem: ${state.matYears.toFixed(1).replace(".", ",")} anos`, tankCenterX, tankBottom + 20);

    // =========================================================================
    // DUTO DE RECIRCULAÇÃO LFT (SELIC -> ESTOQUE DA DÍVIDA)
    // =========================================================================
    const pipeThickness = Math.max(2, (105 - state.reforma) / 10);
    ctx.strokeStyle = "#f59e0b";
    ctx.lineWidth = pipeThickness;
    ctx.beginPath();
    ctx.moveTo(405, 145);
    ctx.lineTo(tankCenterX + tankHalfW, 145);
    ctx.stroke();

    // Partículas de juros fluindo pelo duto LFT
    const pipeLen = 405 - (tankCenterX + tankHalfW);
    for (let p = 0; p < 3; p++) {
      const offset = ((tick * 38 + p * (pipeLen / 3)) % pipeLen);
      ctx.fillStyle = "#f59e0b";
      ctx.beginPath();
      ctx.arc(405 - offset, 145, 3.8, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.font = "bold 11px sans-serif";
    ctx.fillStyle = muted;
    ctx.fillText("Duto LFT (Selic → Dívida)", 332, 130);
    ctx.font = "11px sans-serif";
    ctx.fillText(`Juros: ${state.jurosFluxo.toFixed(1).replace(".", ",")}% PIB`, 332, 165);

    // =========================================================================
    // ESTAÇÃO 2 (CENTRO): CALDEIRA TERMODINÂMICA (INFLAÇÃO & SELIC)
    // =========================================================================
    const boilerX = 468;
    const boilerY = 185;
    const boilerR = 64;

    ctx.fillStyle = fg;
    ctx.font = "bold 13px sans-serif";
    ctx.fillText("2. CALDEIRA MONETÁRIA", boilerX, 26);
    ctx.fillStyle = muted;
    ctx.font = "11px sans-serif";
    ctx.fillText("Pressão = Inflação | Válvula = Selic", boilerX, 44);

    let boilerColor = "#10b981";
    if (state.inflacao > 5.5) boilerColor = "#ef4444";
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
    ctx.lineWidth = 5;
    ctx.beginPath();
    ctx.arc(boilerX, boilerY, boilerR, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    // Leituras da Caldeira
    ctx.fillStyle = fg;
    ctx.font = "bold 19px sans-serif";
    ctx.fillText(`${state.inflacao.toFixed(1).replace(".", ",")}% a.a.`, boilerX, boilerY - 6);
    ctx.font = "11px sans-serif";
    ctx.fillStyle = muted;
    ctx.fillText(`Selic: ${state.selic.toFixed(2).replace(".", ",")}%`, boilerX, boilerY + 14);
    ctx.fillText(state.reforma >= 60 ? "Meta 4% Crível" : "Meta 3% Sem Âncora", boilerX, boilerY + 32);
    ctx.fillText(`Nominal: ${state.nominal.toFixed(1).replace(".", ",")}% PIB`, boilerX, tankBottom + 20);

    // =========================================================================
    // ESTAÇÃO 3 (DIREITA): PONTE SUSPENSA (CARGAS, RENÚNCIAS E SOCIAL)
    // =========================================================================
    const bridgeCenterX = 745;
    const bridgeY = 168;
    const bridgeSpan = 126;

    ctx.fillStyle = fg;
    ctx.font = "bold 13px sans-serif";
    ctx.fillText("3. PONTE SOCIAL & PRODUTIVA", bridgeCenterX, 26);
    ctx.fillStyle = muted;
    ctx.font = "11px sans-serif";
    ctx.fillText("Pesos = Desonerações | Pilares = Social", bridgeCenterX, 44);

    // Espessura dos Pilares Sociais (afinados pelo Tesouraço)
    const pillarW = Math.max(6, 18 - (state.cortes > 75 ? (state.cortes - 75) * 0.05 : 0));
    ctx.fillStyle = state.cortes >= 175 ? "#ef4444" : "#64748b";
    ctx.fillRect(bridgeCenterX - bridgeSpan + 12, bridgeY, pillarW, 104);
    ctx.fillRect(bridgeCenterX + bridgeSpan - 12 - pillarW, bridgeY, pillarW, 104);

    // Tabuleiro da Ponte
    ctx.save();
    ctx.translate(bridgeCenterX, bridgeY);
    let tilt = 0;
    if (state.cortes >= 150) tilt = -0.15;
    else if (state.dividaProj >= 86) tilt = 0.10;
    ctx.rotate(tilt);

    ctx.fillStyle = state.mode === "ok" ? "#10b981" : (state.mode.startsWith("collapse") ? "#ef4444" : "#3b82f6");
    ctx.fillRect(-bridgeSpan, -6, bridgeSpan * 2, 12);

    // Sacos de Chumbo das Desonerações / Renúncias Fiscais pendurados na ponte
    const remainingBags = Math.max(1, Math.round((350 - state.renuncias) / 70));
    for (let b = 0; b < remainingBags; b++) {
      const bx = -76 + b * 38;
      ctx.fillStyle = "#eab308";
      ctx.fillRect(bx - 11, 6, 22, 24);
      ctx.fillStyle = "#0f172a";
      ctx.font = "bold 10px sans-serif";
      ctx.fillText("R$", bx, 22);
    }
    ctx.restore();

    // Vento Externo (Turbina 2003-2010 quando ativa nos Flashbacks)
    if (state.extWind !== 0) {
      ctx.fillStyle = state.extWind > 0 ? "#10b981" : "#ef4444";
      ctx.font = "bold 11px sans-serif";
      const windLabel = state.extWind > 0 ? "🌬️ Vento Externo Favorável (Commodities +)" : "🌩️ Choque Externo Adverso (-)";
      ctx.fillText(windLabel, bridgeCenterX, 115);
    }

    ctx.fillStyle = muted;
    ctx.font = "11px sans-serif";
    ctx.fillText(`Sacos de Desoneração: ${remainingBags}x`, bridgeCenterX, tankBottom - 4);
    ctx.fillStyle = fg;
    ctx.font = "bold 12px sans-serif";
    ctx.fillText(`Coesão Social: ${state.coesao}%`, bridgeCenterX, tankBottom + 20);

    ctx.restore();
  }

  return {
    init
  };
})();
