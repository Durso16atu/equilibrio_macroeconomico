/**
 * Controlador Principal de Interface e Gamificação — Basicão de Economia 2.0
 * Gerencia os 2 Blocos (Momento Atual vs. Conhecimento Histórico),
 * a Mesa de Comando com Botão de Reset e o sistema de Conquistas (Achievements).
 */

window.AppController = (function () {
  let currentScenarioKey = "atual";
  let isModified = false;
  let currentState = null;

  const unlockedBadges = {
    equilibrista: false,
    cacador_renuncias: false,
    historiador: new Set()
  };

  function init() {
    renderScenarioBlocks();
    const canvasEl = document.getElementById("gameCanvas");
    window.CanvasRenderer.init(canvasEl, function () {
      return currentState;
    });
    loadScenario("atual");
  }

  function renderScenarioBlocks() {
    const containerAtual = document.getElementById("block-atual-buttons");
    const containerHistorico = document.getElementById("block-historico-buttons");
    containerAtual.innerHTML = "";
    containerHistorico.innerHTML = "";

    Object.values(window.MacroEngine.SCENARIOS).forEach((sc) => {
      const btn = document.createElement("button");
      btn.id = "btn-sc-" + sc.id;
      btn.type = "button";
      btn.onclick = function () {
        loadScenario(sc.id);
      };
      btn.className = "game-btn text-left p-2.5 rounded-xl border transition-all";
      btn.innerHTML = `
        <div class="text-xs font-bold flex items-center gap-1">
          <span>${sc.icon}</span>
          <span>${sc.shortTitle}</span>
        </div>
        <div class="text-xs opacity-75 mt-0.5">${sc.subtitle}</div>
      `;
      if (sc.block === "atual") {
        containerAtual.appendChild(btn);
      } else {
        containerHistorico.appendChild(btn);
      }
    });
  }

  function highlightActiveScenario(activeKey) {
    Object.keys(window.MacroEngine.SCENARIOS).forEach((k) => {
      const btn = document.getElementById("btn-sc-" + k);
      if (!btn) return;
      if (k === activeKey) {
        btn.className = "game-btn text-left p-2.5 rounded-xl border-2 border-blue-500 bg-blue-500/10 shadow-sm";
      } else {
        btn.className = "game-btn text-left p-2.5 rounded-xl border border-slate-700/60 hover:border-slate-500 bg-slate-800/40";
      }
    });
  }

  function loadScenario(key) {
    const sc = window.MacroEngine.SCENARIOS[key];
    if (!sc) return;

    currentScenarioKey = key;
    isModified = false;

    document.getElementById("s-renuncias").value = sc.renuncias;
    document.getElementById("s-cortes").value = sc.cortes;
    document.getElementById("s-selic").value = sc.selic;
    document.getElementById("s-reforma").value = sc.reforma;

    document.getElementById("story-icon").textContent = sc.icon;
    document.getElementById("story-title").textContent = sc.name;
    document.getElementById("story-desc").textContent = sc.desc;
    document.getElementById("story-lesson").textContent = sc.historicalContext;

    const pill = document.getElementById("active-mode-pill");
    if (sc.block === "historico") {
      pill.textContent = "⏳ Bloco 2: Conhecimento Histórico (Flashback)";
      pill.className = "text-xs font-bold px-2.5 py-1 rounded-lg bg-purple-500/20 text-purple-400 border border-purple-500/30";
      unlockedBadges.historiador.add(key);
    } else {
      pill.textContent = "🎯 Bloco 1: Arena Momento Atual (2026–2030)";
      pill.className = "text-xs font-bold px-2.5 py-1 rounded-lg bg-blue-500/20 text-blue-400 border border-blue-500/30";
    }

    // Desabilita botão de Reset pois os sliders voltaram ao estado original da fase
    document.getElementById("modified-badge").classList.add("hidden");
    document.getElementById("btn-reset-sliders").disabled = true;

    highlightActiveScenario(key);
    recalculate();
  }

  function onSliderChange() {
    isModified = true;
    document.getElementById("modified-badge").classList.remove("hidden");
    document.getElementById("btn-reset-sliders").disabled = false;
    recalculate();
  }

  function resetCurrentScenarioSliders() {
    loadScenario(currentScenarioKey);
  }

  function recalculate() {
    const inputs = {
      renuncias: document.getElementById("s-renuncias").value,
      cortes: document.getElementById("s-cortes").value,
      selic: document.getElementById("s-selic").value,
      reforma: document.getElementById("s-reforma").value
    };

    currentState = window.MacroEngine.calculateMacroState(inputs, currentScenarioKey);

    // Atualiza labels das alavancas
    document.getElementById("v-renuncias").textContent = `R$ ${currentState.renuncias} bi`;
    document.getElementById("v-cortes").textContent =
      currentState.cortes >= 0
        ? `R$ ${currentState.cortes} bi`
        : `+R$ ${Math.abs(currentState.cortes)} bi expansão`;
    document.getElementById("v-selic").textContent = `${currentState.selic.toFixed(2).replace(".", ",")}% a.a.`;
    document.getElementById("v-reforma").textContent = `${currentState.reforma}%`;

    // Atualiza HUD de HP e Diagnóstico
    const hpBar = document.getElementById("hp-bar");
    const hpText = document.getElementById("hp-text");
    const hudStatus = document.getElementById("hud-status-text");

    hpBar.style.width = `${currentState.hp}%`;
    hpText.textContent = `${currentState.hp} / 100 HP`;
    hudStatus.textContent = currentState.statusText;

    if (currentState.mode === "ok") {
      hpBar.className = "h-full transition-all duration-300 bg-emerald-500";
      hpText.className = "text-emerald-400 font-extrabold";
      hudStatus.className = "text-xs font-bold text-center mt-1.5 text-emerald-400";
    } else if (currentState.mode === "warning") {
      hpBar.className = "h-full transition-all duration-300 bg-amber-500";
      hpText.className = "text-amber-400 font-extrabold";
      hudStatus.className = "text-xs font-semibold text-center mt-1.5 text-amber-400";
    } else {
      hpBar.className = "h-full transition-all duration-300 bg-red-500";
      hpText.className = "text-red-400 font-extrabold";
      hudStatus.className = "text-xs font-bold text-center mt-1.5 text-red-400";
    }

    // Atualiza barra da Identidade Macro Y = C + I + G + (X - M)
    document.getElementById("id-c").textContent = `C: ${currentState.components.C}%`;
    document.getElementById("id-i").textContent = `I: ${currentState.components.I}%`;
    document.getElementById("id-g").textContent = `G: ${currentState.components.G}%`;
    document.getElementById("id-nx").textContent = `X-M: ${currentState.components.NX >= 0 ? "+" : ""}${currentState.components.NX}%`;
    document.getElementById("diag-feedback").textContent = currentState.failureReason;

    // Verifica Conquistas de Descanso Produtivo
    checkAchievements(currentState);
  }

  function checkAchievements(state) {
    if (state.mode === "ok" && state.hp >= 85 && state.coesao >= 75) {
      unlockedBadges.equilibrista = true;
    }
    if (state.renuncias >= 200 && state.cortes <= 75) {
      unlockedBadges.cacador_renuncias = true;
    }

    setBadgeUI("badge-equilibrista", unlockedBadges.equilibrista);
    setBadgeUI("badge-renuncias", unlockedBadges.cacador_renuncias);
    setBadgeUI("badge-historiador", unlockedBadges.historiador.size >= 4);
  }

  function setBadgeUI(elId, unlocked) {
    const el = document.getElementById(elId);
    if (!el) return;
    if (unlocked) {
      el.className = "px-2.5 py-1 rounded-lg text-xs font-bold border border-emerald-500/50 bg-emerald-500/15 text-emerald-300 flex items-center gap-1.5";
    }
  }

  function toggleTheme() {
    document.documentElement.classList.toggle("light");
  }

  return {
    init,
    loadScenario,
    onSliderChange,
    resetCurrentScenarioSliders,
    toggleTheme
  };
})();

window.addEventListener("DOMContentLoaded", function () {
  window.AppController.init();
});
