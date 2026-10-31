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
      btn.className = "game-btn text-left p-2.5 rounded-lg border border-slate-800 bg-slate-900/60 hover:bg-slate-800/80 hover:border-slate-700 transition-all";
      btn.innerHTML = `
        <div class="text-xs font-bold flex items-center gap-1.5 text-slate-200">
          <span class="text-sm">${sc.icon}</span>
          <span>${sc.shortTitle}</span>
        </div>
        <div class="text-[11px] text-slate-400 mt-0.5">${sc.subtitle}</div>
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
        btn.className = "game-btn text-left p-2.5 rounded-lg border border-sky-500/60 bg-sky-500/10 shadow-sm ring-1 ring-sky-500/30";
      } else {
        btn.className = "game-btn text-left p-2.5 rounded-lg border border-slate-800 bg-slate-900/60 hover:bg-slate-800/80 hover:border-slate-700";
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
      pill.className = "text-[11px] font-semibold px-2 py-0.5 rounded bg-violet-500/15 text-violet-300 border border-violet-500/30";
      unlockedBadges.historiador.add(key);
    } else {
      pill.textContent = "🎯 Bloco 1: Momento Atual (2026–2030)";
      pill.className = "text-[11px] font-semibold px-2 py-0.5 rounded bg-sky-500/15 text-sky-300 border border-sky-500/30";
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
      hpText.className = "text-emerald-400 font-bold tabular-numbers";
      hudStatus.className = "text-xs font-semibold text-center mt-1.5 text-emerald-400";
    } else if (currentState.mode === "warning") {
      hpBar.className = "h-full transition-all duration-300 bg-amber-500";
      hpText.className = "text-amber-400 font-bold tabular-numbers";
      hudStatus.className = "text-xs font-semibold text-center mt-1.5 text-amber-400";
    } else {
      hpBar.className = "h-full transition-all duration-300 bg-rose-500";
      hpText.className = "text-rose-400 font-bold tabular-numbers";
      hudStatus.className = "text-xs font-semibold text-center mt-1.5 text-rose-400";
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
      el.className = "px-2.5 py-1 rounded-md text-xs font-semibold border border-emerald-500/40 bg-emerald-500/10 text-emerald-300 flex items-center gap-1.5";
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
