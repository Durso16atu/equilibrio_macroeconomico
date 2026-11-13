# Radar Semanal de Fontes Substack — Básico de Economia

> **Automação:** `Radar Semanal Substack (Basico Economia)` (`substack-macro-radar`)  
> **Agendamento:** Todas as sextas-feiras às 20h00 (`CRON_TZ=America/Sao_Paulo 0 20 * * 5`)  
> **Fontes Monitoradas:**
> - **André Lara Resende:** [https://substack.com/@andrelararesende](https://substack.com/@andrelararesende) (`https://andrelararesende.substack.com/feed`)
> - **Monica de Bolle:** [https://substack.com/@bolle](https://substack.com/@bolle) (`https://bolle.substack.com/feed`)

---

## Última Varredura (Execução de Teste / Baseline) — 13/11/2026 às 20h05

### 1. Status das Fontes Já Integradas ao App (`#1` a `#7`)

| # | Data | Autor / Série | Título | Status no App |
|---|---|---|---|---|
| **#1** | 30/10/2026 | Monica de Bolle (*Basicão 2.0*) | *Introdução aos Conceitos Básicos* | Integrado ([`2026-10-30_basicao_introducao.txt`](file:///home/jose-eduardo/projetos/basico_economia/docs/transcricoes/2026-10-30_basicao_introducao.txt)) |
| **#2** | 05/11/2026 | Monica de Bolle & J. P. Kupfer | *Juros, Dívida Pública e Política Fiscal* | Integrado ([`2026-11-05_juros_divida_fiscal_kupfer.txt`](file:///home/jose-eduardo/projetos/basico_economia/docs/transcricoes/2026-11-05_juros_divida_fiscal_kupfer.txt)) |
| **#3** | 06/11/2026 | Monica de Bolle (*Basicão 2.0*) | *Basicão: Política Monetária* | Integrado ([`2026-11-06_basicao_politica_monetaria.txt`](file:///home/jose-eduardo/projetos/basico_economia/docs/transcricoes/2026-11-06_basicao_politica_monetaria.txt)) |
| **#4** | 25/09/2026 | André Lara Resende | *Eu Acuso / J’Accuse: uma proposta para eliminar os juros absurdos* | Integrado ([`AULA_01_BASICAO_2_0.md`](file:///home/jose-eduardo/projetos/basico_economia/docs/AULA_01_BASICAO_2_0.md) + [`glossario.html`](file:///home/jose-eduardo/projetos/basico_economia/glossario.html)) |
| **#5** | 30/10/2026 | André Lara Resende | *Juros do Banco Central: Falsa Racionalidade?* | Integrado ([`AULA_01_BASICAO_2_0.md`](file:///home/jose-eduardo/projetos/basico_economia/docs/AULA_01_BASICAO_2_0.md) + [`glossario.html`](file:///home/jose-eduardo/projetos/basico_economia/glossario.html)) |
| **#6** | 12/11/2026 | Monica de Bolle & J. P. Kupfer | *Câmbio e Juros, com José Paulo Kupfer* | Integrado ([`2026-11-12_cambio_e_juros_kupfer.txt`](file:///home/jose-eduardo/projetos/basico_economia/docs/transcricoes/2026-11-12_cambio_e_juros_kupfer.txt)) |
| **#7** | 13/11/2026 | Monica de Bolle (*Basicão 2.0*) | *Basicão: Juros, Dívida, Ajuste—o que é preciso saber* | Integrado ([`2026-11-13_basicao_juros_divida_ajuste.txt`](file:///home/jose-eduardo/projetos/basico_economia/docs/transcricoes/2026-11-13_basicao_juros_divida_ajuste.txt)) |

---

### 2. Triagem de Pertinência dos DemaisItens Recentes nos Feeds RSS

#### Feed: `andrelararesende.substack.com/feed`
- **`28/09/2026` — *J’Accuse: A Proposal to Eliminate Brazil’s Absurd Interest Rates***
  - **Score de Pertinência:** `0/10 (Já contemplado)`
  - **Diagnóstico:** Versão em inglês do manifesto *Eu Acuso* (25/09/2026), já indexado e citado em [`glossario.html`](file:///home/jose-eduardo/projetos/basico_economia/glossario.html) e [`docs/AULA_01_BASICAO_2_0.md`](file:///home/jose-eduardo/projetos/basico_economia/docs/AULA_01_BASICAO_2_0.md).

#### Feed: `bolle.substack.com/feed`
- **`09/11/2026` — *Regras de Convivência*** (`https://bolle.substack.com/p/regras-de-convivencia`)
  - **Score de Pertinência:** `1/10 (Descartar)`
  - **Diagnóstico:** Comunicado editorial sobre moderação de comentários na comunidade Substack. Sem variáveis macroeconômicas para o motor ou glossário.
- **`05/11/2026` — *A Derrota de Trump*** (`https://bolle.substack.com/p/a-derrota-de-trump`)
  - **Score de Pertinência:** `2/10 (Descartar)`
  - **Diagnóstico:** Análise de conjuntura política norte-americana pós-eleições locais nos EUA. Fora do escopo do modelo fiscal-monetário brasileiro.
- **`29/10/2026` — *Live de Quinta, com José Paulo Kupfer*** (`https://bolle.substack.com/p/live-de-quinta-com-jose-paulo-kupfer-d6a`)
  - **Score de Pertinência:** `6/10 (Acervo Histórico Opcional)`
  - **Diagnóstico:** Debate sobre fim do imposto de importação de alimentos nos EUA (reconhecimento implícito de que tarifas pressionam preços domésticos) e impactos sobre exportadores brasileiros.
  - **Propostas de Ação (Caso deseje aproveitar):**
    - **Opção A (Apenas Acervo):** Baixar a transcrição para `docs/transcricoes/2026-10-29_live_quinta_kupfer.txt` apenas para completar a base de textos para futuro RAG/NLP.
    - **Opção B (Glossário):** Adicionar nota empírica no verbete de *Inflação de Oferta / Tarifas e Câmbio* em [`glossario.html`](file:///home/jose-eduardo/projetos/basico_economia/glossario.html).
    - **Opção C (Recomendada — Ignorar):** Manter apenas as aulas estruturais a partir de 30/10/2026 (*Basicão 2.0*).

---

### 3. Radar para a Próxima Sexta-Feira (`20/11/2026 às 20h00`)

- **Pauta já anunciada na Fonte #7 (`[39:11]`):**
  - Na próxima segunda-feira (`16/11/2026`), Monica de Bolle publicará o episódio **Basicão: Política Cambial** (abordando câmbio flutuante, reservas internacionais de ~US$ 350–360 bi, swaps cambiais, crise asiática/russa de 1997–99 e o ataque especulativo de 2002).
  - Na sexta-feira (`20/11/2026`), haverá o episódio do **Basicão: Balanço de Pagamentos** (Transações Correntes, Conta Capital e Financeira).
- **Como você gerencia:**
  - Na sexta-feira às 20h00, a automação baixará automaticamente as transcrições inéditas em `docs/transcricoes/`, atualizará este arquivo (`docs/PROPOSTAS_SEMANAIS.md`) e enviará uma notificação no chat com as **Opções A, B e C** para você aprovar com um único comando.
