# 🕹️ Engenharia da Estabilidade — Basicão de Economia 2.0 (Game 2D)

Aplicação interativa em formato de **Game 2D de Descanso Produtivo** desenvolvida para traduzir conceitos fundamentais de macroeconomia brasileira (baseados na série *Basicão de Economia 2.0* de **Monica De Bolle**) utilizando a linguagem visual e física da **Engenharia** (Mecânica dos Fluidos, Termodinâmica e Resistência dos Materiais).

## 🎯 Propósito e Público-Alvo
Projetado especialmente para estudantes de **Engenharia** e jovens universitários que:
1. Estão começando a acompanhar fatores macroeconômicos, mas **não vivenciaram** os planos e crises anteriores do Brasil (Moratória e Hiperinflação dos anos 1980, Plano Real de 1994, Boom de Commodities 2003–2010 e Virada Fiscal de 2012–2015).
2. Buscam aprender em **momentos de descanso produtivo** (experiência visual de simulador/game 2D, sem aspecto de planilha ou relatório acadêmico pesado).
3. Precisam compreender na prática por que a estabilidade econômica exige **ajustes calibrados e coordenação**, fugindo tanto do *"Tesouraço"* quanto do *"Negacionismo Fiscal"*.

---

## ⚙️ As 3 Analogias de Engenharia no Palco 2D

1. **🌊 Reservatório Hidráulico com Paredes Móveis (`Estoque vs. Fluxo`)**
   - **Nível do Fluido:** Razão $\text{Dívida}/\text{PIB}$ (iniciando em $82,9\%$ em out/2026).
   - **Largura do Tanque (Parede Móvel):** Crescimento do $\text{PIB}$ ($Y$, o denominador da fração). Se o PIB cresce, o tanque alarga e o nível relativo desce; em recessão, o tanque estreita e a água sobe rumo ao transbordamento.
   - **Duto de Recirculação LFT (`Selic → Dívida`):** Representa a anomalia brasileira herdada da hiperinflação (títulos indexados à Selic e prazo curto de rolagem de ~3 anos).

2. **🔥 Caldeira Termodinâmica (`Política Monetária, Inflação e Credibilidade`)**
   - **Manômetro de Pressão:** Inflação anual e expectativas de risco.
   - **Válvula de Alívio:** Taxa Selic.
   - **Modo de Ruína:** Baixar a Selic "na marra" com gasto público solto faz a caldeira explodir (desancoragem e fuga de capitais). Subir a Selic isoladamente sem desindexar a dívida bombeia mais água para o Tanque 1 (déficit nominal de ~9,5% do PIB).

3. **🏗️ Ponte Suspensa Estrutural (`Identidade Y = C + I + G + X - M e Coesão Social`)**
   - **Sacos de Chumbo Pendurados (`R$`):** Gastos tributários e desonerações setoriais ineficientes (R$ 600–800 bilhões, ou 5% a 6% do PIB) que sobrecarregam a estrutura sem gerar retorno.
   - **Pilares de Sustentação:** Proteção social e investimento público.
   - **Modo de Ruína:** Aplicar o *"Tesouraço"* corrói os pilares sociais, derruba a demanda agregada ($Y$) e causa o colapso estrutural da ponte.

---

## 🗂️ Estrutura do Projeto

```text
/home/jose-eduardo/projetos/basico_economia/
├── index.html                  # Entrada principal do Game 2D (100% client-side, zero servidor obrigatório)
├── README.md                   # Documentação arquitetural e guia de uso
├── docs/
│   ├── AULA_01_BASICAO_2_0.md  # Síntese teórica e invariantes da Aula 1 (Monica De Bolle)
│   └── transcricoes/
│       └── 2026-10-30_basicao_2_0_intro.txt # Transcrição integral com timestamps
├── src/
│   ├── engine/
│   │   └── macro_physics.js    # Motor matemático/físico e banco de fases (Bloco 1 Atual + Bloco 2 Histórico)
│   └── ui/
│       ├── canvas_renderer.js  # Renderizador 2D a 60 FPS (ondas, vapor, duto LFT, ponte e câmera shake)
│       └── app.js              # Controlador do HUD, conquistas, blocos de cenário e botão Reset
└── tests/
    └── test_scenarios.py       # Testes automatizados de sanidade física e estrutura dos cenários
```

---

## 🚀 Como Executar

### Opção 1: Direto no Navegador (Instantâneo)
Basta abrir o arquivo `index.html` em qualquer navegador moderno.

### Opção 2: Servidor Local Leve
```bash
python3 -m http.server 8080 --directory /home/jose-eduardo/projetos/basico_economia
```
E acessar `http://localhost:8080`.

### Executar Testes de Validação
```bash
python3 -m unittest discover -s tests
```
